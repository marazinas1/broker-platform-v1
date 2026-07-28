-- Revert today's "one public door" hardening back to the db64744 state.

DROP VIEW IF EXISTS public.profiles_public;
DROP VIEW IF EXISTS public.site_settings_public;
DROP VIEW IF EXISTS public.feature_flags_public;

DROP VIEW IF EXISTS public.listing_images_public;
DROP VIEW IF EXISTS public.listing_documents_public;
DROP VIEW IF EXISTS public.listing_tours_public;
DROP VIEW IF EXISTS public.listings_public;

ALTER TABLE public.listings
  DROP COLUMN IF EXISTS public_commission_note,
  DROP COLUMN IF EXISTS public_address_street,
  DROP COLUMN IF EXISTS public_address_number,
  DROP COLUMN IF EXISTS public_geo_lat,
  DROP COLUMN IF EXISTS public_geo_lng;

ALTER TABLE public.listing_documents
  DROP COLUMN IF EXISTS public_storage_path;

CREATE VIEW public.listings_public WITH (security_invoker = true) AS
SELECT
  id, slug, reference_code, status, deal_type, property_type,
  published_at, sold_at,
  is_featured, is_exclusive, sort_order,
  price, price_on_request, price_period,
  CASE WHEN commission_note_public THEN commission_note ELSE NULL END AS commission_note,
  additional_costs,
  living_area, plot_area, usable_area,
  rooms, bedrooms, bathrooms, floor, total_floors, year_built, year_renovated,
  CASE WHEN geo_precision = 'exact' THEN address_street ELSE NULL END AS address_street,
  CASE WHEN geo_precision = 'exact' THEN address_number ELSE NULL END AS address_number,
  address_zip, address_city, address_region, address_country,
  CASE
    WHEN geo_precision = 'exact' THEN geo_lat
    WHEN geo_precision = 'approximate' THEN round(geo_lat, 3)
    ELSE NULL
  END AS geo_lat,
  CASE
    WHEN geo_precision = 'exact' THEN geo_lng
    WHEN geo_precision = 'approximate' THEN round(geo_lng, 3)
    ELSE NULL
  END AS geo_lng,
  geo_precision,
  energy, features, content_sections, condition, heating_type, availability_date,
  title, description, highlights,
  meta_title, meta_description,
  agent_id, created_at, updated_at
FROM public.listings
WHERE status IN ('active','coming_soon','reserved','sold','rented');
GRANT SELECT ON public.listings_public TO anon, authenticated;

CREATE VIEW public.listing_images_public WITH (security_invoker = true) AS
SELECT i.id, i.listing_id, i.storage_path, i.variants, i.alt_text, i.caption,
       i.sort_order, i.is_primary, i.is_floorplan, i.is_visualization,
       i.width, i.height, i.blurhash, i.created_at
FROM public.listing_images i
JOIN public.listings_public p ON p.id = i.listing_id;
GRANT SELECT ON public.listing_images_public TO anon, authenticated;

CREATE VIEW public.listing_documents_public WITH (security_invoker = true) AS
SELECT d.id, d.listing_id, d.type, d.storage_path, d.filename,
       d.is_public, d.requires_lead, d.created_at
FROM public.listing_documents d
JOIN public.listings_public p ON p.id = d.listing_id
WHERE d.is_public = true;
GRANT SELECT ON public.listing_documents_public TO anon, authenticated;

CREATE VIEW public.listing_tours_public WITH (security_invoker = true) AS
SELECT t.id, t.listing_id, t.type, t.url, t.thumbnail_url, t.sort_order, t.created_at
FROM public.listing_tours t
JOIN public.listings_public p ON p.id = t.listing_id;
GRANT SELECT ON public.listing_tours_public TO anon, authenticated;

-- Restore the earlier anon read policies
DROP POLICY IF EXISTS "listings anon select public" ON public.listings;
CREATE POLICY "listings anon select public" ON public.listings FOR SELECT TO anon
USING (status = ANY (ARRAY['active','coming_soon','reserved','sold','rented']));

DROP POLICY IF EXISTS "listing_images anon select" ON public.listing_images;
CREATE POLICY "listing_images anon select via view predicate"
  ON public.listing_images FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_images.listing_id
                 AND l.status = ANY (ARRAY['active','coming_soon','reserved','sold','rented'])));

DROP POLICY IF EXISTS "listing_tours anon select" ON public.listing_tours;
CREATE POLICY "listing_tours anon select via view predicate"
  ON public.listing_tours FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_tours.listing_id
                 AND l.status = ANY (ARRAY['active','coming_soon','reserved','sold','rented'])));

DROP POLICY IF EXISTS "listing_documents anon select" ON public.listing_documents;
CREATE POLICY "listing_documents anon select via view predicate"
  ON public.listing_documents FOR SELECT TO anon
  USING (is_public = true AND EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_documents.listing_id
                 AND l.status = ANY (ARRAY['active','coming_soon','reserved','sold','rented'])));

DROP POLICY IF EXISTS "profiles anon select website team" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can read website-visible profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public team members are readable" ON public.profiles;
CREATE POLICY "Public team members are readable"
  ON public.profiles FOR SELECT
  USING (show_on_website = true);

DROP POLICY IF EXISTS "site_settings anon select" ON public.site_settings;
DROP POLICY IF EXISTS "Site settings readable by staff" ON public.site_settings;
CREATE POLICY "Site settings are publicly readable"
  ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "feature_flags anon select" ON public.feature_flags;
DROP POLICY IF EXISTS "Feature flags readable by staff" ON public.feature_flags;
CREATE POLICY "Feature flags are publicly readable"
  ON public.feature_flags FOR SELECT USING (true);

-- Restore table-level anon grants as they were before today
GRANT SELECT ON public.listings TO anon;
GRANT SELECT ON public.listing_images TO anon;
GRANT SELECT ON public.listing_tours TO anon;
GRANT SELECT ON public.listing_documents TO anon;
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT ON public.feature_flags TO anon;
GRANT INSERT ON public.inquiries TO anon;