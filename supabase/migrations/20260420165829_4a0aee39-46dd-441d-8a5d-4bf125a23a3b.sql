
-- 1. Fix has_role to require is_verified
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
          AND is_verified = true
    )
$$;

-- 2. teacher_invitations: remove public SELECT, restrict to admins
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.teacher_invitations;

CREATE POLICY "Admins can view invitations"
ON public.teacher_invitations
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. profiles: restrict SELECT
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role));

-- 4. class_members: fix self-join bug
DROP POLICY IF EXISTS "Users can view their class memberships" ON public.class_members;

CREATE POLICY "Users can view their class memberships"
ON public.class_members
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR user_id = auth.uid()
);

-- 5. classes: fix broken policy
DROP POLICY IF EXISTS "Teachers can view assigned classes" ON public.classes;

CREATE POLICY "Teachers can view assigned classes"
ON public.classes
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.class_members cm
    WHERE cm.class_id = classes.id
      AND cm.user_id = auth.uid()
  )
);

-- 6. audit_logs: prevent users from inserting arbitrary entries
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_logs;
-- Only the log_action SECURITY DEFINER function should write. No user-facing INSERT policy.
