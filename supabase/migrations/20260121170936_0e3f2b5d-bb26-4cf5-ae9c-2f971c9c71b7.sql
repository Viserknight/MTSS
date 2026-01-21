-- Update the trigger to use Batlang's email as admin
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_role app_role;
    admin_email TEXT := 'bernardbatlang@gmail.com';
BEGIN
    -- Check if the email is the admin email
    IF NEW.email = admin_email THEN
        user_role := 'admin';
    ELSE
        -- Default to 'parent' for regular signups
        user_role := 'parent';
    END IF;
    
    INSERT INTO public.user_roles (user_id, role, is_verified)
    VALUES (NEW.id, user_role, true);
    
    RETURN NEW;
END;
$$;