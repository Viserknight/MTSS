-- Create children table for parent registrations
CREATE TABLE public.children (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL,
  name TEXT NOT NULL,
  favorite_animal TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Parents can view their own children
CREATE POLICY "Parents can view their own children"
ON public.children
FOR SELECT
USING (parent_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Parents can insert their own children
CREATE POLICY "Parents can insert their own children"
ON public.children
FOR INSERT
WITH CHECK (parent_id = auth.uid());

-- Parents can update their own children
CREATE POLICY "Parents can update their own children"
ON public.children
FOR UPDATE
USING (parent_id = auth.uid());

-- Parents can delete their own children
CREATE POLICY "Parents can delete their own children"
ON public.children
FOR DELETE
USING (parent_id = auth.uid());

-- Admins have full access
CREATE POLICY "Admins can manage all children"
ON public.children
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));