
-- 1. listing_images processing columns
ALTER TABLE public.listing_images
  ADD COLUMN IF NOT EXISTS processing_status text NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending','processing','done','failed')),
  ADD COLUMN IF NOT EXISTS processing_error text,
  ADD COLUMN IF NOT EXISTS content_type text,
  ADD COLUMN IF NOT EXISTS original_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS original_storage_path text;

-- 2. inquiries table (minimal — full lead capture flow comes later)
CREATE TABLE IF NOT EXISTS public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  phone text,
  message text,
  locale text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inquiries_listing_email_idx
  ON public.inquiries (listing_id, lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiries TO authenticated;
GRANT INSERT ON public.inquiries TO anon;
GRANT ALL ON public.inquiries TO service_role;

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inquiries anon insert"
  ON public.inquiries FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = inquiries.listing_id
        AND l.status IN ('active','coming_soon','reserved')
    )
  );

CREATE POLICY "inquiries auth insert"
  ON public.inquiries FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "inquiries auth select"
  ON public.inquiries FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = inquiries.listing_id
        AND (
          public.current_user_has_permission('listing.edit.any')
          OR (public.current_user_has_permission('listing.edit.own')
              AND (l.agent_id = auth.uid() OR l.created_by = auth.uid()))
        )
    )
  );

CREATE POLICY "inquiries auth delete"
  ON public.inquiries FOR DELETE TO authenticated
  USING (public.current_user_has_permission('listing.edit.any'));

-- 3. Helper: derive listing_id from a `listings/{listing_id}/...` object path.
CREATE OR REPLACE FUNCTION public.storage_listing_id_from_path(_name text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  parts text[];
  v_id uuid;
BEGIN
  parts := string_to_array(_name, '/');
  IF array_length(parts, 1) < 2 OR parts[1] <> 'listings' THEN
    RETURN NULL;
  END IF;
  BEGIN
    v_id := parts[2]::uuid;
  EXCEPTION WHEN others THEN
    RETURN NULL;
  END;
  RETURN v_id;
END;
$$;

-- Reusable predicate: caller may edit parent listing derived from object path
CREATE OR REPLACE FUNCTION public.storage_can_edit_listing_object(_bucket text, _name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing uuid;
BEGIN
  v_listing := public.storage_listing_id_from_path(_name);
  IF v_listing IS NULL THEN RETURN false; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = v_listing
      AND (
        public.current_user_has_permission('listing.edit.any')
        OR (public.current_user_has_permission('listing.edit.own')
            AND (l.agent_id = auth.uid() OR l.created_by = auth.uid()))
      )
  );
END;
$$;

-- 4. Storage RLS on storage.objects
-- Clean up any previous policies with these names (idempotent re-run).
DROP POLICY IF EXISTS "listing-images anon read" ON storage.objects;
DROP POLICY IF EXISTS "listing-images auth read" ON storage.objects;
DROP POLICY IF EXISTS "listing-images edit insert" ON storage.objects;
DROP POLICY IF EXISTS "listing-images edit update" ON storage.objects;
DROP POLICY IF EXISTS "listing-images edit delete" ON storage.objects;
DROP POLICY IF EXISTS "listing-documents edit read" ON storage.objects;
DROP POLICY IF EXISTS "listing-documents edit insert" ON storage.objects;
DROP POLICY IF EXISTS "listing-documents edit update" ON storage.objects;
DROP POLICY IF EXISTS "listing-documents edit delete" ON storage.objects;

-- listing-images: public read
CREATE POLICY "listing-images anon read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'listing-images');

CREATE POLICY "listing-images edit insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'listing-images'
    AND public.storage_can_edit_listing_object(bucket_id, name)
  );

CREATE POLICY "listing-images edit update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND public.storage_can_edit_listing_object(bucket_id, name)
  )
  WITH CHECK (
    bucket_id = 'listing-images'
    AND public.storage_can_edit_listing_object(bucket_id, name)
  );

CREATE POLICY "listing-images edit delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND public.storage_can_edit_listing_object(bucket_id, name)
  );

-- listing-documents: no anon read at all
CREATE POLICY "listing-documents edit read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'listing-documents'
    AND public.storage_can_edit_listing_object(bucket_id, name)
  );

CREATE POLICY "listing-documents edit insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'listing-documents'
    AND public.storage_can_edit_listing_object(bucket_id, name)
  );

CREATE POLICY "listing-documents edit update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'listing-documents'
    AND public.storage_can_edit_listing_object(bucket_id, name)
  )
  WITH CHECK (
    bucket_id = 'listing-documents'
    AND public.storage_can_edit_listing_object(bucket_id, name)
  );

CREATE POLICY "listing-documents edit delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'listing-documents'
    AND public.storage_can_edit_listing_object(bucket_id, name)
  );
