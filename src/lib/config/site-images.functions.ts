// Server functions for site_settings imagery (logo, favicon, OG image, agent
// portrait). Every image entering the site goes through the same optimisation
// contract as listing photography: EXIF/GPS stripped, orientation corrected,
// resized for its slot, stored as AVIF with a WebP sibling. Raw originals are
// uploaded to `site-assets/uploads/` and deleted once processed, so an
// unoptimised file is never the URL a visitor loads.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission } from "@/lib/auth/require-permission.server";

export const SITE_ASSETS_BUCKET = "site-assets";
export const SITE_UPLOADS_PREFIX = "uploads/";

/** site_settings columns that hold an image URL. */
export const SITE_IMAGE_FIELDS = [
  "logo_url",
  "logo_dark_url",
  "favicon_url",
  "og_default_image",
  "primary_agent_photo_url",
] as const;

export type SiteImageField = (typeof SITE_IMAGE_FIELDS)[number];

const schema = z.object({
  field: z.enum(SITE_IMAGE_FIELDS),
  /** Path of the raw upload inside site-assets, must sit under uploads/. */
  originalStoragePath: z.string().min(1).startsWith(SITE_UPLOADS_PREFIX),
  contentType: z.string().min(1).max(120),
  /** Output basename without extension, e.g. "agent/portrait". */
  targetBase: z.string().min(1).max(160).regex(/^[a-z0-9][a-z0-9/_-]*$/),
});

/**
 * Optimise an already-uploaded site image and point the matching
 * site_settings column at the processed AVIF.
 */
export const processSiteImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertPermission(supabase, userId, "settings.edit");

    const edgeSecret = process.env.EDGE_FUNCTION_SECRET;
    if (!edgeSecret) {
      throw new Response("EDGE_FUNCTION_SECRET is not configured", { status: 500 });
    }

    const { data: result, error } = await supabase.functions.invoke(
      "process-site-image",
      { headers: { "x-edge-secret": edgeSecret }, body: data },
    );
    if (error) throw new Response(error.message, { status: 502 });

    return result as {
      field: SiteImageField;
      avif: string;
      webp: string;
      width: number;
      height: number;
    };
  });
