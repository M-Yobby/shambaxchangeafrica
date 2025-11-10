-- Create a public storage bucket for social media uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'post-media'
  ) THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true);
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read for post-media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to post-media in their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files in post-media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files in post-media" ON storage.objects;

-- Policies for the 'post-media' bucket
-- Public read access for images in this bucket
CREATE POLICY "Public read for post-media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'post-media');

-- Only authenticated users can upload to their own folder: {user_id}/filename
CREATE POLICY "Users can upload to post-media in their own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own files
CREATE POLICY "Users can update their own files in post-media"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own files
CREATE POLICY "Users can delete their own files in post-media"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]
);
