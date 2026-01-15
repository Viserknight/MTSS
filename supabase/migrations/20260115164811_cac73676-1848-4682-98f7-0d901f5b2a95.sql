-- Update handle_new_user_role to auto-assign admin for specific email
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role app_role;
    admin_email TEXT := 'mtss84560@gmail.com';
BEGIN
    -- Check if the email is the admin email
    IF NEW.email = admin_email THEN
        user_role := 'admin';
    ELSE
        -- Default to 'parent' for regular signups
        -- Teachers will be added by admin through a separate flow
        user_role := 'parent';
    END IF;
    
    INSERT INTO public.user_roles (user_id, role, is_verified)
    VALUES (NEW.id, user_role, CASE WHEN user_role = 'admin' THEN true ELSE true END);
    
    RETURN NEW;
END;
$$;