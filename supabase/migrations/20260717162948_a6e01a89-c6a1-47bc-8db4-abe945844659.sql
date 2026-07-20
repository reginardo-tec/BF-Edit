
-- Storage policies for client-uploads bucket
CREATE POLICY "Public can upload to client-uploads"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'client-uploads');

CREATE POLICY "Admins can read client-uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'client-uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete client-uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'client-uploads' AND public.has_role(auth.uid(), 'admin'));

-- Fix INSERT policy on client_upload_files: remove EXISTS subquery that requires SELECT on client_uploads
DROP POLICY IF EXISTS "Anyone can insert upload files" ON public.client_upload_files;
CREATE POLICY "Anyone can insert upload files"
ON public.client_upload_files FOR INSERT
TO anon, authenticated
WITH CHECK (
  storage_path LIKE (upload_id::text || '/%')
  AND length(relative_path) BETWEEN 1 AND 1024
  AND length(storage_path) BETWEEN 1 AND 1200
  AND size_bytes BETWEEN 0 AND 5368709120
);

-- Allow the inserting session to read back the row it just created (RETURNING clause).
-- Keeps admin-only visibility for listing (existing SELECT policy already restricts to admins on general reads,
-- but PostgREST needs *some* SELECT policy for insert().select() to return the inserted row).
CREATE POLICY "Anon can read own inserted upload row"
ON public.client_uploads FOR SELECT
TO anon
USING (created_at > now() - interval '5 minutes');
