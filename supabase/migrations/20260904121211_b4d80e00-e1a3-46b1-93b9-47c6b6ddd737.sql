ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS learner_number text,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS medical_notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS on_children_updated ON public.children;
CREATE TRIGGER on_children_updated
  BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.learner_lesson_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  lesson_plan_id uuid NOT NULL REFERENCES public.lesson_plans(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started',
  parent_notes text,
  teacher_notes text,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (child_id, lesson_plan_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.learner_lesson_progress TO authenticated;
GRANT ALL ON public.learner_lesson_progress TO service_role;

ALTER TABLE public.learner_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their children progress"
  ON public.learner_lesson_progress FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = learner_lesson_progress.child_id AND c.parent_id = auth.uid()));

CREATE POLICY "Parents can insert their children progress"
  ON public.learner_lesson_progress FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.children c WHERE c.id = learner_lesson_progress.child_id AND c.parent_id = auth.uid()));

CREATE POLICY "Parents can update their children progress"
  ON public.learner_lesson_progress FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = learner_lesson_progress.child_id AND c.parent_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.children c WHERE c.id = learner_lesson_progress.child_id AND c.parent_id = auth.uid()));

CREATE POLICY "Parents can delete their children progress"
  ON public.learner_lesson_progress FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = learner_lesson_progress.child_id AND c.parent_id = auth.uid()));

CREATE POLICY "Staff can view all progress"
  ON public.learner_lesson_progress FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can insert progress"
  ON public.learner_lesson_progress FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can update progress"
  ON public.learner_lesson_progress FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER on_learner_lesson_progress_updated
  BEFORE UPDATE ON public.learner_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Parents can view lesson plans for their children grades"
  ON public.lesson_plans FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.parent_id = auth.uid() AND c.grade IS NOT NULL AND c.grade = lesson_plans.grade
  ));