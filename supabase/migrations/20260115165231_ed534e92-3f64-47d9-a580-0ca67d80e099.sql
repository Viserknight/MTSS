-- Create teacher invitations table
CREATE TABLE public.teacher_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teacher_invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage invitations
CREATE POLICY "Admins can manage invitations"
ON public.teacher_invitations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view invitation by token (for registration)
CREATE POLICY "Anyone can view invitation by token"
ON public.teacher_invitations
FOR SELECT
USING (true);

-- Add constraint to limit children per parent (max 3)
CREATE OR REPLACE FUNCTION public.check_children_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  child_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO child_count
  FROM public.children
  WHERE parent_id = NEW.parent_id;
  
  IF child_count >= 3 THEN
    RAISE EXCEPTION 'Maximum of 3 children allowed per parent';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_children_limit
BEFORE INSERT ON public.children
FOR EACH ROW
EXECUTE FUNCTION public.check_children_limit();