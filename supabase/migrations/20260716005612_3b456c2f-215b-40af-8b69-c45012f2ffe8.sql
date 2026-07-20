
-- 1) Fix function search_path on touch_updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2) Lock down EXECUTE on has_role (SECURITY DEFINER)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- 3) Replace overly permissive INSERT policies on client_uploads with validated ones
DROP POLICY IF EXISTS "Anyone can create an upload submission" ON public.client_uploads;
CREATE POLICY "Anyone can create an upload submission"
ON public.client_uploads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(sender_name)) BETWEEN 2 AND 120
  AND (sender_email IS NULL OR (length(sender_email) <= 200 AND sender_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'))
  AND (sender_phone IS NULL OR length(sender_phone) <= 40)
  AND (note IS NULL OR length(note) <= 2000)
  AND total_files BETWEEN 0 AND 500
  AND total_bytes BETWEEN 0 AND 5368709120
);

-- 4) Replace overly permissive INSERT policy on client_upload_files with a check
--    tying rows to an existing upload and constraining storage_path prefix.
DROP POLICY IF EXISTS "Anyone can insert upload files" ON public.client_upload_files;
CREATE POLICY "Anyone can insert upload files"
ON public.client_upload_files
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.client_uploads u WHERE u.id = client_upload_files.upload_id)
  AND storage_path LIKE (upload_id::text || '/%')
  AND length(relative_path) BETWEEN 1 AND 1024
  AND length(storage_path) BETWEEN 1 AND 1200
  AND size_bytes BETWEEN 0 AND 5368709120
);
