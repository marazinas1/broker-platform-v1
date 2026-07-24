
CREATE OR REPLACE FUNCTION public.validate_listing_energy(_country text, _energy jsonb, _property_type text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  missing text[] := ARRAY[]::text[];
  v text;
BEGIN
  IF _property_type IN ('land','garage') THEN RETURN ARRAY[]::text[]; END IF;

  IF _country = 'AT' THEN
    IF NOT (_energy ? 'hwb') OR jsonb_typeof(_energy->'hwb') <> 'number' THEN missing := array_append(missing, 'hwb'); END IF;
    IF NOT (_energy ? 'eeb') OR jsonb_typeof(_energy->'eeb') <> 'number' THEN missing := array_append(missing, 'eeb'); END IF;
    v := _energy->>'efficiency_class';
    IF v IS NULL OR v NOT IN ('A++','A+','A','B','C','D','E','F','G') THEN missing := array_append(missing, 'efficiency_class'); END IF;

  ELSIF _country = 'DE' THEN
    v := _energy->>'certificate_type';
    IF v IS NULL OR v NOT IN ('Bedarfsausweis','Verbrauchsausweis') THEN missing := array_append(missing, 'certificate_type'); END IF;
    IF NOT (_energy ? 'final_energy') OR jsonb_typeof(_energy->'final_energy') <> 'number' THEN missing := array_append(missing, 'final_energy'); END IF;
    IF (_energy->>'energy_source') IS NULL OR length(_energy->>'energy_source') = 0 THEN missing := array_append(missing, 'energy_source'); END IF;
    v := _energy->>'efficiency_class';
    IF v IS NULL OR v NOT IN ('A+','A','B','C','D','E','F','G','H') THEN missing := array_append(missing, 'efficiency_class'); END IF;
    IF NOT (_energy ? 'year_built') OR jsonb_typeof(_energy->'year_built') <> 'number' THEN missing := array_append(missing, 'year_built'); END IF;
  END IF;

  RETURN missing;
END;
$$;
