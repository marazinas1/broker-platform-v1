-- =========================================================
-- One public door: masked views are the only anon-readable objects
-- =========================================================

ALTER VIEW public.listings_public SET (security_invoker = false);
ALTER VIEW public.listing_images_public SET (security_invoker = false);
ALTER VIEW public.listing_tours_public SET (security_invoker = false);

-- Documents view: never expose the storage path of a lead-gated document
CREATE OR REPLACE VIEW public.listing_documents_public AS
SELECT
  d.id,
  d.listing_id,
  d.type,
  CASE WHEN d.requires_lead THEN NULL::text ELSE d.storage_path END AS storage_path,
  d.filename,
  d.is_public,
  d.requires_lead,
  d.created_at
FROM public.listing_documents d
JOIN public.listings_public p ON p.id = d.listing_id
WHERE d.is_public = true;
ALTER VIEW public.listing_documents_public SET (security_invoker = false);

CREATE OR REPLACE VIEW public.profiles_public AS
SELECT
  p.id,
  p.full_name,
  p.public_title,
  p.public_bio,
  p.public_photo_url,
  p.languages_spoken,
  p.specializations,
  p.sort_order
FROM public.profiles p
WHERE p.show_on_website = true AND p.is_active = true;
ALTER VIEW public.profiles_public SET (security_invoker = false);

CREATE OR REPLACE VIEW public.site_settings_public AS
SELECT
  s.id, s.site_name, s.legal_name, s.country, s.default_locale, s.enabled_locales,
  s.currency, s.area_unit, s.logo_url, s.logo_dark_url, s.favicon_url, s.og_default_image,
  s.primary_color, s.secondary_color, s.accent_color, s.font_heading, s.font_body,
  s.contact_email, s.contact_phone, s.whatsapp,
  s.address_street, s.address_zip, s.address_city, s.address_country, s.geo_lat, s.geo_lng,
  s.opening_hours, s.social,
  s.google_analytics_id, s.google_site_verification, s.plausible_domain,
  s.legal_impressum, s.legal_privacy, s.legal_terms,
  s.primary_agent_name, s.primary_agent_role, s.primary_agent_photo_url,
  s.homepage_sections, s.credibility_stats, s.credibility_heading, s.about_body,
  s.updated_at
FROM public.site_settings s;
ALTER VIEW public.site_settings_public SET (security_invoker = false);

CREATE OR REPLACE VIEW public.feature_flags_public AS
SELECT f.key, f.enabled, f.config
FROM public.feature_flags f;
ALTER VIEW public.feature_flags_public SET (security_invoker = false);

-- Drop the raw-table anon read policies
DROP POLICY IF EXISTS "listings anon select public" ON public.listings;
DROP POLICY IF EXISTS "listing_images anon select via view predicate" ON public.listing_images;
DROP POLICY IF EXISTS "listing_tours anon select via view predicate" ON public.listing_tours;
DROP POLICY IF EXISTS "listing_documents anon select via view predicate" ON public.listing_documents;
DROP POLICY IF EXISTS "Public team members are readable" ON public.profiles;

CREATE POLICY "Authenticated can read website-visible profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (show_on_website = true AND is_active = true);

DROP POLICY IF EXISTS "Site settings are publicly readable" ON public.site_settings;
CREATE POLICY "Site settings readable by staff"
  ON public.site_settings FOR SELECT TO authenticated USING (true);

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'feature_flags' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.feature_flags', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "Feature flags readable by staff"
  ON public.feature_flags FOR SELECT TO authenticated USING (true);

-- Revoke every raw-table and view privilege from anon
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT c.relname
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind IN ('r','v')
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t.relname);
  END LOOP;
END $$;

GRANT SELECT ON public.listings_public TO anon, authenticated;
GRANT SELECT ON public.listing_images_public TO anon, authenticated;
GRANT SELECT ON public.listing_tours_public TO anon, authenticated;
GRANT SELECT ON public.listing_documents_public TO anon, authenticated;
GRANT SELECT ON public.profiles_public TO anon, authenticated;
GRANT SELECT ON public.site_settings_public TO anon, authenticated;
GRANT SELECT ON public.feature_flags_public TO anon, authenticated;
GRANT ALL ON public.profiles_public TO service_role;
GRANT ALL ON public.site_settings_public TO service_role;
GRANT ALL ON public.feature_flags_public TO service_role;

-- The single anon write path: inquiry submission
GRANT INSERT ON public.inquiries TO anon;
