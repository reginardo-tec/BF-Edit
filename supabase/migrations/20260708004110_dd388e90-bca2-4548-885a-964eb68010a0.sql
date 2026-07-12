
-- Client uploads: submissions grouping and files with relative paths
CREATE TABLE public.client_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  sender_phone TEXT,
  note TEXT,
  total_files INTEGER NOT NULL DEFAULT 0,
  total_bytes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.client_uploads TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.client_uploads TO authenticated;
GRANT ALL ON public.client_uploads TO service_role;

ALTER TABLE public.client_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create an upload submission"
  ON public.client_uploads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view uploads"
  ON public.client_uploads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete uploads"
  ON public.client_uploads FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER touch_client_uploads_updated_at
  BEFORE UPDATE ON public.client_uploads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.client_upload_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES public.client_uploads(id) ON DELETE CASCADE,
  relative_path TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX client_upload_files_upload_id_idx ON public.client_upload_files(upload_id);

GRANT INSERT ON public.client_upload_files TO anon, authenticated;
GRANT SELECT, DELETE ON public.client_upload_files TO authenticated;
GRANT ALL ON public.client_upload_files TO service_role;

ALTER TABLE public.client_upload_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can add files to a submission"
  ON public.client_upload_files FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view upload files"
  ON public.client_upload_files FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete upload files"
  ON public.client_upload_files FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies for the client-uploads bucket
CREATE POLICY "Anyone can upload to client-uploads"
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
