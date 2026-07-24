
ALTER TABLE public.inquiries ALTER COLUMN listing_id DROP NOT NULL;

ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'listing',
  ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS photo_paths text[] NOT NULL DEFAULT ARRAY[]::text[];

ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_type_check;
ALTER TABLE public.inquiries
  ADD CONSTRAINT inquiries_type_check CHECK (type IN ('listing', 'buyer', 'seller'));

ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_listing_id_type_check;
ALTER TABLE public.inquiries
  ADD CONSTRAINT inquiries_listing_id_type_check CHECK (
    (type = 'listing' AND listing_id IS NOT NULL)
    OR (type IN ('buyer', 'seller') AND listing_id IS NULL)
  );

DROP POLICY IF EXISTS "seller-photos service role all" ON storage.objects;
CREATE POLICY "seller-photos service role all"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'seller-photos')
  WITH CHECK (bucket_id = 'seller-photos');
