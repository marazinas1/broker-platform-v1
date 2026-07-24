import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InquiryInput = z.object({
  listing_id: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  message: z.string().trim().min(1).max(4000),
});

export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => InquiryInput.parse(raw))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("inquiries").insert({
      listing_id: data.listing_id,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      message: data.message,
      source: "public_web",
    });
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });
