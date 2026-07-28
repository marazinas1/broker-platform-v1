-- =========================================================
-- Stored masking + invoker views + column-level anon grants
-- =========================================================

-- 1. Pre-masked, database-computed public columns
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS public_commission_note text
    GENERATED ALWAYS AS (CASE WHEN commission_note_public THEN commission_note ELSE NULL END) STORED,
  ADD COLUMN IF NOT EXISTS public_address_street text
    GENERATED ALWAYS AS (CASE WHEN geo_precision = 'exact' THEN address_street ELSE NULL END) STORED,
  ADD COLUMN IF NOT EXISTS public_address_number text
    GENERATED ALWAYS AS (CASE WHEN geo_precision = 'exact' THEN address_number ELSE NULL END) STORED,
  ADD COLUMN IF NOT EXISTS public_geo_lat numeric
    GENERATED ALWAYS AS (CASE WHEN geo_precision = 'exact' THEN geo_lat
                              WHEN geo_precision = 'approximate' THEN round(geo_lat, 3)
                              ELSE NULL END) STORED,
  ADD COLUMN IF NOT EXISTS public_geo_lng numeric
    GENERATED ALWAYS AS (CASE WHEN geo_precision = 'exact' THEN geo_lng
                              WHEN geo_precision = 'approximate' THEN round(geo_lng, 3)
                              ELSE NULL END) STORED;

ALTER TABLE public.listing_documents
  ADD COLUMN IF NOT EXISTS public_storage_path text
    GENERATED ALWAYS AS (CASE WHEN requires_lead THEN NULL ELSE storage_path END) STORED;

-- 2. Views project only pre-masked columns and run as the caller
CREATE OR REPLACE VIEW public.listings_public AS
SELECT
  id, slug, reference_code, status, deal_type, property_type,
  published_at, sold_at, is_featured, is_exclusive, sort_order,
  price, price_on_request, price_period,
  public_commission_note AS commission_note,
  additional_costs, living_area, plot_area, usable_area,
  rooms, bedrooms, bathrooms, floor, total_floors, year_built, year_renovated,
  public_address_street AS address_street,
  public_address_number AS address_number,
  address_zip, address_city, address_region, address_country,
  public_geo_lat AS geo_lat,
  public_geo_lng AS geo_lng,
  geo_precision, energy, features, content_sections, condition, heating_type,
  availability_date, title, description, highlights,
  meta_title, meta_description, agent_id, created_at, updated_at
FROM public.listings
WHERE status = ANY (ARRAY['active','coming_soon','reserved','sold','rented']);
ALTER VIEW public.listings_public SET (security_invoker = true);

CREATE OR REPLACE VIEW public.listing_images_public AS
SELECT i.id, i.listing_id, i.storage_path, i.variants, i.alt_text, i.caption,
       i.sort_order, i.is_primary, i.is_floorplan, i.is_visualization,
       i.width, i.height, i.blurhash, i.created_at
FROM public.listing_images i
JOIN public.listings_public p ON p.id = i.listing_id;
ALTER VIEW public.listing_images_public SET (security_invoker = true);

CREATE OR REPLACE VIEW public.listing_tours_public AS
SELECT t.id, t.listing_id, t.type, t.url, t.thumbnail_url, t.sort_order, t.created_at
FROM public.listing_tours t
JOIN public.listings_public p ON p.id = t.listing_id;
ALTER VIEW public.listing_tours_public SET (security_invoker = true);

DROP VIEW IF EXISTS public.listing_documents_public;
CREATE VIEW public.listing_documents_public AS
SELECT d.id, d.listing_id, d.type,
       d.public_storage_path AS storage_path,
       d.filename, d.is_public, d.requires_lead, d.created_at
FROM public.listing_documents d
JOIN public.listings_public p ON p.id = d.listing_id
WHERE d.is_public = true;
ALTER VIEW public.listing_documents_public SET (security_invoker = true);

CREATE OR REPLACE VIEW public.profiles_public AS
SELECT p.id, p.full_name, p.public_title, p.public_bio, p.public_photo_url,
       p.languages_spoken, p.specializations, p.sort_order
FROM public.profiles p
WHERE p.show_on_website = true AND p.is_active = true;
ALTER VIEW public.profiles_public SET (security_invoker = true);

ALTER VIEW public.site_settings_public SET (security_invoker = true);
ALTER VIEW public.feature_flags_public SET (security_invoker = true);

-- 3. Row scope for anonymous visitors (needed again by invoker views)
DROP POLICY IF EXISTS "listings anon select public" ON public.listings;
CREATE POLICY "listings anon select public"
  ON public.listings FOR SELECT TO anon
  USING (status = ANY (ARRAY['active','coming_soon','reserved','sold','rented']));

DROP POLICY IF EXISTS "listing_images anon select" ON public.listing_images;
CREATE POLICY "listing_images anon select"
  ON public.listing_images FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_images.listing_id
                 AND l.status = ANY (ARRAY['active','coming_soon','reserved','sold','rented'])));

DROP POLICY IF EXISTS "listing_tours anon select" ON public.listing_tours;
CREATE POLICY "listing_tours anon select"
  ON public.listing_tours FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_tours.listing_id
                 AND l.status = ANY (ARRAY['active','coming_soon','reserved','sold','rented'])));

DROP POLICY IF EXISTS "listing_documents anon select" ON public.listing_documents;
CREATE POLICY "listing_documents anon select"
  ON public.listing_documents FOR SELECT TO anon
  USING (is_public = true AND EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_documents.listing_id
                 AND l.status = ANY (ARRAY['active','coming_soon','reserved','sold','rented'])));

DROP POLICY IF EXISTS "profiles anon select website team" ON public.profiles;
CREATE POLICY "profiles anon select website team"
  ON public.profiles FOR SELECT TO anon
  USING (show_on_website = true AND is_active = true);

DROP POLICY IF EXISTS "site_settings anon select" ON public.site_settings;
CREATE POLICY "site_settings anon select"
  ON public.site_settings FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "feature_flags anon select" ON public.feature_flags;
CREATE POLICY "feature_flags anon select"
  ON public.feature_flags FOR SELECT TO anon USING (true);

-- 4. Column-level privileges: anon may read ONLY these columns
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind IN ('r','v')
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t.relname);
  END LOOP;
END $$;

GRANT SELECT (
  id, slug, reference_code, status, deal_type, property_type,
  published_at, sold_at, is_featured, is_exclusive, sort_order,
  price, price_on_request, price_period, public_commission_note,
  additional_costs, living_area, plot_area, usable_area,
  rooms, bedrooms, bathrooms, floor, total_floors, year_built, year_renovated,
  public_address_street, public_address_number,
  address_zip, address_city, address_region, address_country,
  public_geo_lat, public_geo_lng, geo_precision, energy, features,
  content_sections, condition, heating_type, availability_date,
  title, description, highlights, meta_title, meta_description,
  agent_id, created_at, updated_at
) ON public.listings TO anon;

GRANT SELECT (
  id, listing_id, storage_path, variants, alt_text, caption, sort_order,
  is_primary, is_floorplan, is_visualization, width, height, blurhash, created_at
) ON public.listing_images TO anon;

GRANT SELECT (
  id, listing_id, type, url, thumbnail_url, sort_order, created_at
) ON public.listing_tours TO anon;

GRANT SELECT (
  id, listing_id, type, public_storage_path, filename, is_public, requires_lead, created_at
) ON public.listing_documents TO anon;

GRANT SELECT (
  id, full_name, public_title, public_bio, public_photo_url,
  languages_spoken, specializations, sort_order, show_on_website, is_active
) ON public.profiles TO anon;

GRANT SELECT (
  id, site_name, legal_name, country, default_locale, enabled_locales, currency, area_unit,
  logo_url, logo_dark_url, favicon_url, og_default_image,
  primary_color, secondary_color, accent_color, font_heading, font_body,
  contact_email, contact_phone, whatsapp,
  address_street, address_zip, address_city, address_country, geo_lat, geo_lng,
  opening_hours, social, google_analytics_id, google_site_verification, plausible_domain,
  legal_impressum, legal_privacy, legal_terms,
  primary_agent_name, primary_agent_role, primary_agent_photo_url,
  homepage_sections, credibility_stats, credibility_heading, about_body, updated_at
) ON public.site_settings TO anon;

GRANT SELECT (key, enabled, config) ON public.feature_flags TO anon;

GRANT SELECT ON public.listings_public TO anon, authenticated;
GRANT SELECT ON public.listing_images_public TO anon, authenticated;
GRANT SELECT ON public.listing_tours_public TO anon, authenticated;
GRANT SELECT ON public.listing_documents_public TO anon, authenticated;
GRANT SELECT ON public.profiles_public TO anon, authenticated;
GRANT SELECT ON public.site_settings_public TO anon, authenticated;
GRANT SELECT ON public.feature_flags_public TO anon, authenticated;
GRANT ALL ON public.listing_documents_public TO service_role;

-- 5. The single anon write path
GRANT INSERT ON public.inquiries TO anon;
