-- Create a function to set teacher role that bypasses RLS
CREATE OR REPLACE FUNCTION public.set_teacher_role(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_roles 
  SET role = 'teacher', is_verified = true 
  WHERE user_id = target_user_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.set_teacher_role(uuid) TO authenticated;

-- Update Batlang (bernardbatlang@gmail.com) to admin
UPDATE public.user_roles 
SET role = 'admin', is_verified = true 
WHERE user_id = 'e2c422a9-becb-4f9f-aec6-f0fa1a94b894';