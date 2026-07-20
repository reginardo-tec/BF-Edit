
-- 1) Make has_role SECURITY INVOKER and self-only (prevents probing other users)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND _user_id = auth.uid()
  );
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2) Ownership on client_uploads
ALTER TABLE public.client_uploads
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Anyone can create an upload submission" ON public.client_uploads;
CREATE POLICY "Submitters can create an upload"
ON public.client_uploads
FOR INSERT TO anon, authenticated
WITH CHECK (
  (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  )
  AND length(btrim(sender_name)) BETWEEN 2 AND 120
  AND (sender_email IS NULL OR (length(sender_email) <= 200 AND sender_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'))
  AND (sender_phone IS NULL OR length(sender_phone) <= 40)
  AND (note IS NULL OR length(note) <= 2000)
  AND total_files BETWEEN 0 AND 500
  AND total_bytes BETWEEN 0 AND 5368709120
);

DROP POLICY IF EXISTS "Users see own uploads" ON public.client_uploads;
CREATE POLICY "Users see own uploads"
ON public.client_uploads
FOR SELECT TO authenticated
USING (user_id IS NOT NULL AND user_id = auth.uid());

-- 3) Restrict client_upload_files inserts to recent, matching parent uploads
CREATE OR REPLACE FUNCTION public.client_upload_is_recent(_upload_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_uploads
    WHERE id = _upload_id
      AND created_at > now() - interval '2 hours'
      AND (
        user_id IS NULL
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
      )
  );
$$;
REVOKE EXECUTE ON FUNCTION public.client_upload_is_recent(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.client_upload_is_recent(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can insert upload files" ON public.client_upload_files;
CREATE POLICY "Recent uploads can add files"
ON public.client_upload_files
FOR INSERT TO anon, authenticated
WITH CHECK (
  public.client_upload_is_recent(upload_id)
  AND storage_path LIKE (upload_id::text || '/%')
  AND length(relative_path) BETWEEN 1 AND 1024
  AND length(storage_path) BETWEEN 1 AND 1200
  AND size_bytes BETWEEN 0 AND 5368709120
);
