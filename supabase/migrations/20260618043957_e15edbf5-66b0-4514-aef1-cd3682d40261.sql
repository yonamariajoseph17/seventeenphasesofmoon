-- Allow anyone (anon + authenticated) to upload and read objects in the
-- letter-songs bucket. The app has no auth; uploads are public by design,
-- scoped strictly to this single bucket. Files are read back via signed URLs.
CREATE POLICY "letter-songs insert"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'letter-songs');

CREATE POLICY "letter-songs select"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'letter-songs');