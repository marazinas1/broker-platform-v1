# Phase F — Admin listings management

Goal: create, edit and manage properties in the admin panel; every saved listing automatically has a public detail page at `/{locale}/immobilien/{slug}`. Backend (tables, triggers, energy validation, status flow, slug generation, image pipeline) is reused as-is — no new database structure, no new edge function.

## 1. Listings list — `/{locale}/admin/listings`

Replaces the current stub route.

- Admin-scoped fetch (all statuses incl. draft, reserved, sold, archived) via a new authenticated server function that reads `listings` (not `listings_public`) as the signed-in user, so RLS decides what each role sees.
- Table columns: primary photo thumbnail, title (current admin language, falls back to the other), city, price, status badge, last updated.
- Row actions: Edit, and a status dropdown offering only the transitions the database allows from the current status (draft → coming soon/active/archived, active → reserved/sold/rented/archived, etc.). Rejected transitions and missing publish permission surface as a toast with the database message rather than a silent failure.
- "New listing" button (permission-gated on `listing.create`).
- Calm admin styling: hairline borders, no shadows, Fraunces headings, sage accents. English default.

## 2. Create / edit form — `/{locale}/admin/listings/new` and `/{locale}/admin/listings/{id}`

One form shell, sections split into separate components (each well under 200 lines):

- **Basics** — title & description per language, deal type, property type, status.
- **Figures** — price with a "price on request" toggle (hides the amount), living/plot area, rooms, bedrooms, bathrooms, floor, total floors, year built, year renovated.
- **Location** — street, number, zip, city, region, country, latitude/longitude, plus the geo precision selector.
- **Energy** — fields rendered for the country configured in site settings (DE: certificate type, final energy, energy source, efficiency class, year built; AT: HWB, EEB, efficiency class), validated client-side with the existing `lib/validation/energy.ts` before save.
- **Content sections** — highlights, property info, building info, surroundings as editable bullet lists per language, written back in the exact shape the public page already reads.
- **Images** — see section 4.

Create saves a draft first (so the listing has an id for image uploads), then keeps editing in place. Publishing is a status change, which triggers the database's energy validation and publish-permission checks; errors come back inline.

### Draft-first flow, made obvious
On a new listing the images section is not an empty or greyed-out box. It renders a friendly panel in the place the uploader will occupy: "Save this listing first, then you can add photos", with a prominent "Save draft" button right inside that panel (the same action as the form's save). Only title and deal/property type are required for that first save, so it is a two-second step. Saving keeps the user on the same screen — no reload, no navigation flash: the form switches to edit mode in place, the panel is replaced by the live upload area, and a toast confirms the draft was saved.

### Bilingual fields
`title`, `description`, `meta_title`, `meta_description` and content-section items are already JSONB keyed by locale. The form renders a language tab strip (EN / DE, driven by `site_settings.enabled_locales`, English first) above the translatable fields; switching tabs swaps which key of the same JSON object you edit. Non-translatable fields (price, areas, address) sit outside the tabs and are edited once. On save the whole JSON object is written, so an untouched language is preserved. Empty strings are stripped so the public page's existing fallback logic keeps working.

### geo_precision
A three-option selector with a one-line explanation each:
- **Exact** — precise pin on the public map.
- **Approximate** — public view rounds coordinates to ~110 m and the map draws a soft area instead of a pin.
- **Hidden** — the public view returns no coordinates at all; the detail page shows only the town name, no map.

The admin writes the raw `geo_lat` / `geo_lng` and the precision to `listings`. Masking stays entirely in the existing `listings_public` view, so the map and privacy behaviour built in Phase D works unchanged from real admin input — nothing on the public side is re-implemented.

## 3. Server functions

New authenticated functions (all `requireSupabaseAuth` + `assertPermission`, each file small and focused):

- `listAdminListings` — table rows plus primary image.
- `getAdminListing` — full row plus its images, for the edit form.
- `saveListing` — create/update with zod validation; permission `listing.create` on create, `listing.edit.own`/`listing.edit.any` on update with ownership check reusing the existing pattern.
- `changeListingStatus` — single status write so the database triggers own the flow rules; `listing.status.change` / `listing.publish` gate publish-side moves.
- `reorderListingImages` / `setPrimaryImage` — sort order and primary flag.

Deleting images reuses the existing `deleteListingImage`.

## 4. Image upload — wired to the existing pipeline

No new pipeline. Per dropped/selected file the client:

1. Generates a UUID for the image and uploads the raw file with the browser Supabase client to the **private** `listing-originals` bucket at `listings/{listingId}/originals/{imageId}.{ext}` — the path convention the existing storage policies and `media-paths.ts` already expect. Nothing public ever points at this file.
2. Calls the existing `enqueueImageProcessing({ listingId, imageId, originalStoragePath, contentType, originalSizeBytes, filename })`, which inserts the `listing_images` row as `pending` and invokes `process-listing-image` with `EDGE_FUNCTION_SECRET`.
3. The edge function does the work already built — orientation fix, EXIF/GPS stripped by re-encoding, thumb/medium/large/og in AVIF + WebP into the public `listing-images` bucket, blurhash, then flips the row to `done`.

The UI shows a per-image status chip (pending → processing → done → failed with its error), polling the rows while any are unfinished. Drag to reorder (first image = primary/hero), delete removes every variant plus the original through the existing delete function. Because uploads need a listing id, the upload area is enabled only after the draft has been saved once — a new listing shows a short hint until then.

## 5. Round-trip check

After building: create a listing in the admin with photos, publish it, then open `/{locale}/immobilien/{slug}` and confirm the hero, fact pills, facts bar, energy panel, map (per chosen precision), content sections and share row all render from the entered data, and that images serve as AVIF/WebP from the public bucket. Verified with a browser pass on desktop and mobile widths, plus a check that a hidden-precision listing ships no coordinates in the page payload.

## Notes

- Permission gating is doubled: sidebar/buttons hide via `usePermission`, and every server function asserts through the database's `current_user_has_permission`.
- All new admin strings go into `src/messages/en.json` and `de.json`; nothing hardcoded, nothing client-specific.
- No new tables, triggers, buckets or edge functions in this phase.
