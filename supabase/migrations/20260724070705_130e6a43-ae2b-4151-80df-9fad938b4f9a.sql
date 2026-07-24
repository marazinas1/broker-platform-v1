
DROP VIEW IF EXISTS public.listing_images_public;
DROP VIEW IF EXISTS public.listing_documents_public;
DROP VIEW IF EXISTS public.listing_tours_public;
DROP VIEW IF EXISTS public.listings_public;

-- NEVER expose in listings_public:
--   sold_price     - private transaction data
--   expose_notes   - internal notes, PDF expose only
--   archived_at    - meaningless publicly, archived rows are excluded
--   view_count     - internal analytics
--   inquiry_count  - internal analytics
--   created_by     - internal user reference
--   updated_by     - internal user reference
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
  energy, features, condition, heating_type, availability_date,
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
