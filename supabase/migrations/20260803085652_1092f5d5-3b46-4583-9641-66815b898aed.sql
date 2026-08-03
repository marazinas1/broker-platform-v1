UPDATE public.site_settings SET
  default_locale  = 'en',
  enabled_locales = ARRAY['en','de'],
  font_heading    = 'Fraunces',
  font_body       = 'Inter',
  primary_color   = '#6B7259',
  secondary_color = '#E8E3D9',
  accent_color    = '#A67C6D',
  homepage_sections = '[
    {"key":"hero","enabled":true,"variant":"region"},
    {"key":"categories","enabled":true},
    {"key":"featured","enabled":true},
    {"key":"credibility","enabled":true},
    {"key":"sold","enabled":true},
    {"key":"about","enabled":true},
    {"key":"team","enabled":false},
    {"key":"areas","enabled":true},
    {"key":"contact","enabled":true}
  ]'::jsonb;