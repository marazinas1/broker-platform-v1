CREATE POLICY "listings anon select public" ON public.listings FOR SELECT TO anon
USING (status = ANY (ARRAY['active','coming_soon','reserved','sold','rented']));
GRANT SELECT ON public.listings TO anon;