-- Create report_cards table first
CREATE TABLE public.report_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  year INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on report_cards
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;

-- RLS policies for report_cards
CREATE POLICY "Teachers and admins can insert report cards"
ON public.report_cards FOR INSERT
WITH CHECK (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers and admins can view all report cards"
ON public.report_cards FOR SELECT
USING (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Parents can view their children report cards"
ON public.report_cards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = child_id AND c.parent_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete report cards"
ON public.report_cards FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add grade column to children table for class assignment (Grade 8-12)
ALTER TABLE public.children ADD COLUMN grade TEXT;

-- Create child_class_assignments table
CREATE TABLE public.child_class_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(child_id, class_id)
);

-- Enable RLS
ALTER TABLE public.child_class_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for child_class_assignments
CREATE POLICY "Admins can manage child class assignments"
ON public.child_class_assignments FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can view assignments for their classes"
ON public.child_class_assignments FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.class_members cm
    WHERE cm.class_id = child_class_assignments.class_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Parents can view their children assignments"
ON public.child_class_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = child_id AND c.parent_id = auth.uid()
  )
);