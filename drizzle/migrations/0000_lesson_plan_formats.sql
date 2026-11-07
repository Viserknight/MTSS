CREATE TABLE public.lesson_plan_formats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  format_text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_plan_formats TO authenticated;
GRANT ALL ON public.lesson_plan_formats TO service_role;
ALTER TABLE public.lesson_plan_formats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage lesson plan formats"
  ON public.lesson_plan_formats
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Teachers read active lesson plan formats"
  ON public.lesson_plan_formats
  FOR SELECT
  TO authenticated
  USING (
    is_active = TRUE
    AND public.has_role(auth.uid(), 'teacher'::public.app_role)
  );