
ALTER TABLE public.listings ADD COLUMN commission_note_public boolean NOT NULL DEFAULT false;

DROP VIEW IF EXISTS public.listings_public CASCADE;

CREATE VIEW public.listings_public
WITH (security_invoker = true) AS
SELECT
  id, slug, reference_code, status, deal_type, property_type,
  published_at, sold_at,
  is_featured, is_exclusive, sort_order,
  price, price_on_request, price_period,
  CASE WHEN commission_note_public THEN commission_note ELSE NULL END AS commission_note,
  additional_costs,
  living_area, plot_area, usable_area,
  rooms, bedrooms, bathrooms, floor, total_floors,
  year_built, year_renovated,
  CASE WHEN geo_precision = 'exact' THEN address_street ELSE NULL END AS address_street,
  CASE WHEN geo_precision = 'exact' THEN address_number ELSE NULL END AS address_number,
  address_zip, address_city, address_region, address_country,
  CASE
    WHEN geo_precision = 'exact' THEN geo_lat
    WHEN geo_precision = 'approximate' THEN round(geo_lat::numeric, 3)
    ELSE NULL
  END AS geo_lat,
  CASE
    WHEN geo_precision = 'exact' THEN geo_lng
    WHEN geo_precision = 'approximate' THEN round(geo_lng::numeric, 3)
    ELSE NULL
  END AS geo_lng,
  geo_precision,
  energy, features, condition, heating_type, availability_date,
  title, description, highlights, expose_notes,
  meta_title, meta_description,
  agent_id, created_at, updated_at
FROM public.listings
WHERE status IN ('active','coming_soon','reserved','sold','rented');

GRANT SELECT ON public.listings_public TO anon, authenticated;

CREATE VIEW public.listing_images_public
WITH (security_invoker = true) AS
SELECT i.* FROM public.listing_images i
JOIN public.listings_public p ON p.id = i.listing_id;

GRANT SELECT ON public.listing_images_public TO anon, authenticated;

CREATE VIEW public.listing_documents_public
WITH (security_invoker = true) AS
SELECT d.* FROM public.listing_documents d
JOIN public.listings_public p ON p.id = d.listing_id
WHERE d.is_public = true;

GRANT SELECT ON public.listing_documents_public TO anon, authenticated;

CREATE VIEW public.listing_tours_public
WITH (security_invoker = true) AS
SELECT t.* FROM public.listing_tours t
JOIN public.listings_public p ON p.id = t.listing_id;

GRANT SELECT ON public.listing_tours_public TO anon, authenticated;
