ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS credibility_heading jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS about_body jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.site_settings
  SET credibility_heading = jsonb_build_object('de', 'Warum ' || COALESCE(site_name, 'wir'), 'en', 'Why ' || COALESCE(site_name, 'us'))
  WHERE credibility_heading = '{}'::jsonb;