
-- site_settings: single-row configuration per deployment
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text NOT NULL,
  legal_name text,
  country text NOT NULL CHECK (country IN ('AT','DE','CH','IS','US')),
  default_locale text NOT NULL DEFAULT 'de',
  enabled_locales text[] NOT NULL DEFAULT ARRAY['de','en']::text[],
  currency text NOT NULL DEFAULT 'EUR',
  area_unit text NOT NULL DEFAULT 'sqm' CHECK (area_unit IN ('sqm','sqft')),
  logo_url text,
  logo_dark_url text,
  favicon_url text,
  og_default_image text,
  primary_color text,
  secondary_color text,
  accent_color text,
  font_heading text,
  font_body text,
  contact_email text,
  contact_phone text,
  whatsapp text,
  address_street text,
  address_zip text,
  address_city text,
  address_country text,
  geo_lat numeric,
  geo_lng numeric,
  opening_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  social jsonb NOT NULL DEFAULT '{}'::jsonb,
  google_analytics_id text,
  google_site_verification text,
  plausible_domain text,
  legal_impressum jsonb NOT NULL DEFAULT '{}'::jsonb,
  legal_privacy   jsonb NOT NULL DEFAULT '{}'::jsonb,
  legal_terms     jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings are publicly readable"
  ON public.site_settings FOR SELECT
  USING (true);

-- feature_flags
CREATE TABLE public.feature_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  description text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.feature_flags TO anon, authenticated;
GRANT ALL ON public.feature_flags TO service_role;

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Feature flags are publicly readable"
  ON public.feature_flags FOR SELECT
  USING (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER set_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Seed a neutral default site_settings row so a fresh clone renders.
INSERT INTO public.site_settings (site_name, country, default_locale, enabled_locales)
VALUES ('Template', 'AT', 'de', ARRAY['de','en']::text[]);

-- Seed feature flags. Only 'sales' enabled by default.
INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('sales',         true,  'Sales listings'),
  ('rentals',       false, 'Rental listings'),
  ('valuation',     false, 'Property valuation tool'),
  ('sold_archive',  false, 'Archive of sold properties'),
  ('team',          false, 'Team / agent profiles'),
  ('blog',          false, 'Blog / news'),
  ('area_pages',    false, 'Neighborhood / area landing pages'),
  ('testimonials',  false, 'Customer testimonials'),
  ('saved_search',  false, 'User saved searches'),
  ('mortgage_calc', false, 'Mortgage calculator'),
  ('virtual_tours', false, 'Virtual tour embeds'),
  ('crm_sync',      false, 'External CRM sync');
