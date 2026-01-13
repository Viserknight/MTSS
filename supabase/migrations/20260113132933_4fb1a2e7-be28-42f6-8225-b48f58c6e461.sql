-- Add is_verified column to user_roles for teacher verification
ALTER TABLE public.user_roles ADD COLUMN is_verified boolean NOT NULL DEFAULT false;

-- Auto-verify admins and parents, only teachers need verification
UPDATE public.user_roles SET is_verified = true WHERE role IN ('admin', 'parent');

-- Create classes table for admin to organize parent groups
CREATE TABLE public.classes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    grade text NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create class_members table to assign parents and teachers to classes
CREATE TABLE public.class_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(class_id, user_id)
);

-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

-- Classes policies: Admin can manage, teachers can view their classes
CREATE POLICY "Admins can manage classes"
ON public.classes FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can view assigned classes"
ON public.classes FOR SELECT
TO authenticated
USING (
    has_role(auth.uid(), 'admin') OR 
    EXISTS (SELECT 1 FROM public.class_members WHERE class_id = id AND user_id = auth.uid())
);

-- Class members policies
CREATE POLICY "Admins can manage class members"
ON public.class_members FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their class memberships"
ON public.class_members FOR SELECT
TO authenticated
USING (
    has_role(auth.uid(), 'admin') OR 
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.class_members cm 
        WHERE cm.class_id = class_id AND cm.user_id = auth.uid()
    )
);

-- Add trigger for updated_at on classes
CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create function to check if teacher is verified
CREATE OR REPLACE FUNCTION public.is_teacher_verified(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT is_verified FROM public.user_roles WHERE user_id = _user_id AND role = 'teacher'),
        false
    )
$$;