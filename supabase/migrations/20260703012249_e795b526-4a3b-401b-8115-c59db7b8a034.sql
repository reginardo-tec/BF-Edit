-- Lock down SECURITY DEFINER functions.
-- Trigger-only functions: no direct callers, revoke from all app roles.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- has_role is invoked from RLS policies by signed-in users, so authenticated
-- must retain EXECUTE. Revoke from PUBLIC and anon (no anon-facing policies use it).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;