
-- RLS policies for the private listing-originals bucket.
-- Mirrors the edit-rights model used for listing-images: no public read;
-- only users with edit rights on the parent listing (derived from the
-- listings/{listing_id}/... path) may read, insert, update, or delete.

CREATE POLICY "listing_originals_select_edit"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'listing-originals'
    AND public.storage_can_edit_listing_object(bucket_id, name)
  );

CREATE POLICY "listing_originals_insert_edit"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'listing-originals'
    AND public.storage_can_edit_listing_object(bucket_id, name)
  );

CREATE POLICY "listing_originals_update_edit"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'listing-originals'
    AND public.storage_can_edit_listing_object(bucket_id, name)
  )
  WITH CHECK (
    bucket_id = 'listing-originals'
    AND public.storage_can_edit_listing_object(bucket_id, name)
  );

CREATE POLICY "listing_originals_delete_edit"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'listing-originals'
    AND public.storage_can_edit_listing_object(bucket_id, name)
  );
