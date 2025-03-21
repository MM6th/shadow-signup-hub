
-- Create a storage bucket for livestream recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('livestream_recordings', 'Livestream Recordings', true);

-- Create policies to manage access to the bucket
CREATE POLICY "Public can view livestream recordings"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'livestream_recordings');

CREATE POLICY "Authenticated users can upload livestream recordings"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'livestream_recordings');

CREATE POLICY "Users can delete their own recordings"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'livestream_recordings' AND (auth.uid())::text = (storage.foldername(name))[1]);
