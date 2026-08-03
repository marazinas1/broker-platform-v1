// Supabase Edge Function: process-site-image
//
// Same optimisation contract as process-listing-image, applied to the images
// stored in site_settings (logo, dark logo, favicon, OG image, agent
// portrait): decode to raw pixels, apply EXIF orientation, drop every byte of
// metadata (GPS included) by re-encoding, resize to a sensible maximum for the
// slot, and write AVIF + WebP into the public `site-assets` bucket. The raw
// upload is deleted afterwards so an unoptimised original never becomes
// publicly reachable.
//
// Invoked server-to-server from src/lib/config/site-images.functions.ts with a
// shared secret; verify_jwt is off for this function.
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import {
  applyOrientation,
  decodeImage,
  readOrientation,
  resizeMax,
  toAvif,
  toWebp,
} from "./pipeline.ts";

const BUCKET = "site-assets";
const UPLOADS_PREFIX = "uploads/";

// Maximum width per slot. Portraits and logos never need more.
const MAX_WIDTH: Record<string, number> = {
  primary_agent_photo_url: 1200,
  logo_url: 600,
  logo_dark_url: 600,
  favicon_url: 256,
  og_default_image: 1200,
};

interface Payload {
  field: keyof typeof MAX_WIDTH;
  originalStoragePath: string;
  contentType: string;
  /** Output basename, e.g. "agent/dorothe-waltner-portrait". */
  targetBase: string;
}

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const EDGE_SECRET = Deno.env.get("EDGE_FUNCTION_SECRET") ?? "";

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.byteLength !== bb.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < ab.byteLength; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

function publicUrl(path: string): string {
  return admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const provided = req.headers.get("x-edge-secret") ?? "";
  if (!EDGE_SECRET || !timingSafeEqual(provided, EDGE_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const maxWidth = MAX_WIDTH[payload?.field as string];
  if (!maxWidth) return new Response("Unsupported field", { status: 400 });
  if (!payload.originalStoragePath?.startsWith(UPLOADS_PREFIX)) {
    return new Response("Original must live under uploads/", { status: 400 });
  }
  const targetBase = (payload.targetBase ?? "").replace(/^\/+|\.+$/g, "");
  if (!/^[a-z0-9][a-z0-9/_-]*$/.test(targetBase)) {
    return new Response("Invalid targetBase", { status: 400 });
  }

  try {
    const { data: file, error: downloadError } = await admin.storage
      .from(BUCKET)
      .download(payload.originalStoragePath);
    if (downloadError || !file) {
      return new Response(downloadError?.message ?? "Original not found", { status: 404 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const orientation = await readOrientation(bytes, payload.contentType);
    const decoded = await decodeImage(bytes, payload.contentType);
    const rotated = applyOrientation(decoded, orientation);
    const sized = await resizeMax(rotated, maxWidth);

    const avif = await toAvif(sized);
    const webp = await toWebp(sized);

    const avifPath = `${targetBase}.avif`;
    const webpPath = `${targetBase}.webp`;

    for (const [path, body, type] of [
      [avifPath, avif, "image/avif"],
      [webpPath, webp, "image/webp"],
    ] as const) {
      const { error } = await admin.storage
        .from(BUCKET)
        .upload(path, body, { contentType: type, upsert: true });
      if (error) return new Response(error.message, { status: 500 });
    }

    // The raw original never stays around.
    await admin.storage.from(BUCKET).remove([payload.originalStoragePath]);

    const { data: row } = await admin
      .from("site_settings")
      .select("id")
      .limit(1)
      .maybeSingle();
    if (row) {
      await admin
        .from("site_settings")
        .update({ [payload.field]: publicUrl(avifPath) })
        .eq("id", row.id);
    }

    return Response.json({
      field: payload.field,
      avif: publicUrl(avifPath),
      webp: publicUrl(webpPath),
      width: sized.width,
      height: sized.height,
    });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Processing failed", {
      status: 500,
    });
  }
});
