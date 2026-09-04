REVOKE EXECUTE ON FUNCTION public.set_teacher_role(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.log_action(text, jsonb) FROM anon;