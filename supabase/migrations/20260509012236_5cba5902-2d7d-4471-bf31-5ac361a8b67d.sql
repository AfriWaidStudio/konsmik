
ALTER TABLE public.spaces
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS rules text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS theme_color text DEFAULT '#a855f7';

-- storage policies for media bucket (idempotent)
DO $$ BEGIN
  CREATE POLICY "Anyone reads media"
    ON storage.objects FOR SELECT USING (bucket_id = 'media');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated upload media"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'media' AND auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner updates media"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner deletes media"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
