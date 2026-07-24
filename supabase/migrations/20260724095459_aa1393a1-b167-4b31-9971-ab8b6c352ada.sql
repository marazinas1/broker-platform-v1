
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS homepage_sections jsonb NOT NULL DEFAULT
    '[
      {"key":"hero","enabled":true,"variant":"property"},
      {"key":"categories","enabled":true},
      {"key":"featured","enabled":true},
      {"key":"credibility","enabled":true},
      {"key":"sold","enabled":true},
      {"key":"about","enabled":true},
      {"key":"team","enabled":false},
      {"key":"areas","enabled":true},
      {"key":"contact","enabled":true}
    ]'::jsonb,
  ADD COLUMN IF NOT EXISTS credibility_stats jsonb NOT NULL DEFAULT '[]'::jsonb;
