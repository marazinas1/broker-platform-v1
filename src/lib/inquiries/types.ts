// Shared inquiry types + small pure helpers (client-safe).

export const INQUIRY_STATUSES = ["new", "read", "handled"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const INQUIRY_TYPES = ["listing", "buyer", "seller"] as const;
export type InquiryType = (typeof INQUIRY_TYPES)[number];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any;

export interface AdminInquiryRow {
  id: string;
  type: string;
  status: InquiryStatus;
  name: string | null;
  email: string;
  phone: string | null;
  message: string | null;
  locale: string | null;
  source: string | null;
  payload: Json;
  photo_paths: string[];
  listing_id: string | null;
  created_at: string;
  read_at: string | null;
  handled_at: string | null;
  listing: { id: string; slug: string; title: Json } | null;
}

/** Translation key suffix for the human label of an inquiry type. */
export function inquiryTypeKey(type: string): string {
  return (INQUIRY_TYPES as readonly string[]).includes(type) ? type : "other";
}

/** Ordered, non-empty payload entries for display. */
export function payloadEntries(payload: Json): [string, string][] {
  if (!payload || typeof payload !== "object") return [];
  return Object.entries(payload as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => [k, String(v)] as [string, string]);
}

/** Short one-line preview for the list view. */
export function inquiryPreview(row: AdminInquiryRow): string {
  if (row.message && row.message.trim().length > 0) return row.message.trim();
  return payloadEntries(row.payload)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}
