UPDATE public.site_settings
SET homepage_sections = (
  SELECT jsonb_agg(
    CASE WHEN s->>'key' = 'hero'
      THEN s || jsonb_build_object('image', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=2400&q=80')
      ELSE s END
    ORDER BY ord
  )
  FROM jsonb_array_elements(homepage_sections) WITH ORDINALITY AS t(s, ord)
);