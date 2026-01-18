-- Create timetables table for class schedules
CREATE TABLE public.timetables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject TEXT NOT NULL,
  teacher_id UUID NOT NULL,
  room TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS for timetables
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;

-- Admins can manage timetables
CREATE POLICY "Admins can manage timetables"
  ON public.timetables
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Teachers can view timetables for their classes
CREATE POLICY "Teachers can view timetables"
  ON public.timetables
  FOR SELECT
  USING (
    has_role(auth.uid(), 'teacher') OR
    EXISTS (
      SELECT 1 FROM class_members cm
      WHERE cm.class_id = timetables.class_id AND cm.user_id = auth.uid()
    )
  );

-- Parents can view timetables for their children's classes
CREATE POLICY "Parents can view timetables"
  ON public.timetables
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM child_class_assignments cca
      JOIN children c ON c.id = cca.child_id
      WHERE cca.class_id = timetables.class_id AND c.parent_id = auth.uid()
    )
  );

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  notes TEXT,
  marked_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(child_id, class_id, date)
);

-- Enable RLS for attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Admins can manage all attendance
CREATE POLICY "Admins can manage attendance"
  ON public.attendance
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Teachers can insert and update attendance
CREATE POLICY "Teachers can manage attendance"
  ON public.attendance
  FOR ALL
  USING (
    has_role(auth.uid(), 'teacher') AND
    EXISTS (
      SELECT 1 FROM class_members cm
      WHERE cm.class_id = attendance.class_id AND cm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'teacher') AND
    EXISTS (
      SELECT 1 FROM class_members cm
      WHERE cm.class_id = attendance.class_id AND cm.user_id = auth.uid()
    )
  );

-- Parents can view their children's attendance
CREATE POLICY "Parents can view attendance"
  ON public.attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children c
      WHERE c.id = attendance.child_id AND c.parent_id = auth.uid()
    )
  );

-- Create messages table for teacher messaging
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Teachers can send messages
CREATE POLICY "Teachers can send messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'teacher') AND sender_id = auth.uid());

-- Users can view their own messages
CREATE POLICY "Users can view own messages"
  ON public.messages
  FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Recipients can update read status
CREATE POLICY "Recipients can update messages"
  ON public.messages
  FOR UPDATE
  USING (recipient_id = auth.uid());

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON public.messages
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));