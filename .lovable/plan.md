## What's actually wrong

The masking view is fine — `listings_public` already NULLs `commission_note` unless `commission_note_public` is true, and masks street/number/coords by `geo_precision`. The leak is that **the view is not the only public door**.

Confirmed against the live database:

- The `anon` role holds full table privileges (select/insert/update/delete) on **every** table in the public schema.
- `listings` has an RLS policy `listings anon select public` with `USING (status IN ('active','coming_soon','reserved','sold','rented'))` — no column restriction.
- So anyone with the public API key can call the Data API against the raw table and read `commission_note`, `sold_price`, exact `address_street`/`address_number`, exact `geo_lat`/`geo_lng` regardless of `geo_precision`, plus `expose_notes`, `created_by`, `updated_by`, `view_count`, `inquiry_count`. The view masking never runs.
- Same pattern on siblings: `listing_images`, `listing_tours`, `listing_documents` have direct anon SELECT policies; `profiles` has `Public team members are readable USING (show_on_website = true)` over **all columns**, exposing `email`, `phone`, `role`, `is_active`, `last_login_at`; `site_settings` is readable by role `public` with `USING (true)`.
- All four `*_public` views are `security_invoker=true`, which is why those wide base-table policies exist.

This is a template defect: every forked client site inherits it.

## The fix: one public door

### 1. Views become the only anon-readable objects
- Flip `listings_public`, `listing_images_public`, `listing_tours_public`, `listing_documents_public` to `security_invoker = false` so they execute as owner; row filters and column masking already live in the view bodies.
- Harden `listing_documents_public`: `storage_path` returns NULL when `requires_lead = true`.
- Add `profiles_public` (`id, full_name, public_title, public_bio, public_photo_url, languages_spoken, specializations, sort_order`, filtered to `show_on_website AND is_active`) — no email, phone, role, or login timestamps.
- Add `site_settings_public` (brand/contact/legal/analytics config that the page renders) and `feature_flags_public` (`key, enabled, config`).

### 2. Remove the raw-table anon surface
- Drop the anon SELECT policies on `listings`, `listing_images`, `listing_tours`, `listing_documents`, `profiles`, and the `USING (true)` public policies on `site_settings` / `feature_flags`; replace the last ones with authenticated-only staff read policies.
- `REVOKE ALL … FROM anon` on every public-schema table and view, then `GRANT SELECT` on the seven `*_public` views to `anon`.
- Keep exactly one anon write path: `GRANT INSERT ON public.inquiries TO anon`, backed by the existing insert policy. Anon currently also holds update/delete grants on `profiles`, `permissions`, `user_invitations` and everything else — blocked by RLS today, one missing policy away from a real hole. Those go away.
- `authenticated` and `service_role` grants untouched, so admin panel and server functions keep working.

### 3. Point app code at the new views
- `src/lib/team/queries.functions.ts` → `profiles_public`
- `src/lib/config/site-settings.functions.ts` public read → `site_settings_public` (admin writes unchanged)
- `src/lib/config/feature-flags.functions.ts` public read → `feature_flags_public`
- Listing queries already use `listings_public` / `listing_images_public` — unchanged.

## Audit report delivered with the fix

For every anon-reachable column I'll verify and report: `commission_note` (flag-gated), `sold_price` (never public), address/geo fields (`geo_precision`-gated), `expose_notes`, `created_by`/`updated_by`, `view_count`/`inquiry_count`, draft/archived rows, document `is_public`/`requires_lead` gating, image `original_storage_path` and processing internals, profile `email`/`phone`/`role`/`is_active`/`last_login_at`, `inquiries` PII and `photo_paths` (write-only for anon), `permissions` / `role_permissions` / `owner_only_permissions` / `user_invitations` (invite `token`) — no anon access at all, and storage buckets (`listing-images` public; documents/originals/seller-photos private).

## Verification

1. Re-run the security scan; confirm the `commission_note` finding is cleared and no error-level findings remain.
2. Anon Data API probe: raw `listings` must return permission denied; `listings_public` must return `commission_note: null` for a flag-off listing and no `sold_price` column at all.
3. Confirm the site still renders: homepage, listings index, detail page, sold archive, about/team, contact.
4. Publish, then verify `https://broker-platform-v1.lovable.app/de` — Berg Immobilien identity, bucket-served images — and re-run the anon probe against the live project, showing the raw response.

No images are regenerated or touched.
