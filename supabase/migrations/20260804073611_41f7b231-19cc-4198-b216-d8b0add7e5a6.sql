ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS handled_at timestamptz;

ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_status_check;
ALTER TABLE public.inquiries
  ADD CONSTRAINT inquiries_status_check CHECK (status IN ('new','read','handled'));

CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON public.inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS inquiries_status_idx ON public.inquiries (status);

GRANT SELECT, UPDATE ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;

DROP POLICY IF EXISTS "inquiries auth select" ON public.inquiries;
CREATE POLICY "inquiries auth select" ON public.inquiries
  FOR SELECT TO authenticated
  USING (
    public.current_user_has_permission('inquiry.view.any')
    OR (
      public.current_user_has_permission('inquiry.view.own')
      AND (
        listing_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.listings l
          WHERE l.id = inquiries.listing_id
            AND (l.agent_id = auth.uid() OR l.created_by = auth.uid())
        )
      )
    )
  );

DROP POLICY IF EXISTS "inquiries auth update status" ON public.inquiries;
CREATE POLICY "inquiries auth update status" ON public.inquiries
  FOR UPDATE TO authenticated
  USING (
    public.current_user_has_permission('inquiry.view.any')
    OR (
      public.current_user_has_permission('inquiry.view.own')
      AND (
        listing_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.listings l
          WHERE l.id = inquiries.listing_id
            AND (l.agent_id = auth.uid() OR l.created_by = auth.uid())
        )
      )
    )
  )
  WITH CHECK (
    public.current_user_has_permission('inquiry.view.any')
    OR (
      public.current_user_has_permission('inquiry.view.own')
      AND (
        listing_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.listings l
          WHERE l.id = inquiries.listing_id
            AND (l.agent_id = auth.uid() OR l.created_by = auth.uid())
        )
      )
    )
  );