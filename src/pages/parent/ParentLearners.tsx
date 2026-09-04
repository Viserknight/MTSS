import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, GraduationCap, Loader2, Save, User } from "lucide-react";

const GRADES = ["8", "9", "10", "11", "12"];

const STATUSES = [
  { value: "not_started", label: "Not started", weight: 0 },
  { value: "in_progress", label: "In progress", weight: 0.5 },
  { value: "needs_help", label: "Needs help", weight: 0.25 },
  { value: "completed", label: "Completed", weight: 1 },
] as const;

const statusMeta = (value: string) => STATUSES.find((s) => s.value === value) ?? STATUSES[0];

const learnerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be under 100 characters"),
  grade: z.string().trim().max(4).optional(),
  favorite_animal: z.string().trim().min(1, "Favourite animal is required").max(50),
  date_of_birth: z.string().trim().min(1, "Date of birth is required"),
  learner_number: z.string().trim().max(30, "Learner number must be under 30 characters").optional(),
  emergency_contact_name: z.string().trim().max(100).optional(),
  emergency_contact_phone: z
    .string()
    .trim()
    .max(20, "Phone number must be under 20 characters")
    .regex(/^[0-9+\-()\s]*$/, "Phone number contains invalid characters")
    .optional(),
  medical_notes: z.string().trim().max(1000, "Medical notes must be under 1000 characters").optional(),
});

interface Learner {
  id: string;
  name: string;
  grade: string | null;
  favorite_animal: string;
  date_of_birth: string;
  learner_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_notes: string | null;
}

interface LessonPlan {
  id: string;
  subject: string;
  grade: string;
  topic: string;
  created_at: string;
}

interface ProgressRow {
  id: string;
  child_id: string;
  lesson_plan_id: string;
  status: string;
  parent_notes: string | null;
  teacher_notes: string | null;
}

export default function ParentLearners() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [progress, setProgress] = useState<Record<string, ProgressRow>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Learner>>({});

  const selected = useMemo(() => learners.find((l) => l.id === selectedId) ?? null, [learners, selectedId]);

  useEffect(() => {
    if (user) loadLearners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!selected) return;
    setForm(selected);
    loadProgress(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const loadLearners = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("children")
      .select(
        "id, name, grade, favorite_animal, date_of_birth, learner_number, emergency_contact_name, emergency_contact_phone, medical_notes"
      )
      .order("created_at", { ascending: true });
    if (error) {
      toast({ title: "Could not load learners", description: error.message, variant: "destructive" });
    } else {
      const rows = (data ?? []) as Learner[];
      setLearners(rows);
      if (rows.length && !selectedId) setSelectedId(rows[0].id);
    }
    setIsLoading(false);
  };

  const loadProgress = async (learner: Learner) => {
    const planQuery = supabase
      .from("lesson_plans")
      .select("id, subject, grade, topic, created_at")
      .order("created_at", { ascending: false });
    const { data: planData, error: planError } = learner.grade
      ? await planQuery.eq("grade", learner.grade)
      : await planQuery;

    if (planError) {
      toast({ title: "Could not load lesson plans", description: planError.message, variant: "destructive" });
      setPlans([]);
    } else {
      setPlans((planData ?? []) as LessonPlan[]);
    }

    const { data: progressData } = await supabase
      .from("learner_lesson_progress")
      .select("id, child_id, lesson_plan_id, status, parent_notes, teacher_notes")
      .eq("child_id", learner.id);

    const map: Record<string, ProgressRow> = {};
    ((progressData ?? []) as ProgressRow[]).forEach((row) => {
      map[row.lesson_plan_id] = row;
    });
    setProgress(map);
  };

  const saveDetails = async () => {
    if (!selected) return;
    const parsed = learnerSchema.safeParse({
      name: form.name ?? "",
      grade: form.grade ?? "",
      favorite_animal: form.favorite_animal ?? "",
      date_of_birth: form.date_of_birth ?? "",
      learner_number: form.learner_number ?? "",
      emergency_contact_name: form.emergency_contact_name ?? "",
      emergency_contact_phone: form.emergency_contact_phone ?? "",
      medical_notes: form.medical_notes ?? "",
    });
    if (!parsed.success) {
      toast({
        title: "Please check the details",
        description: parsed.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const values = parsed.data;
    const { error } = await supabase
      .from("children")
      .update({
        name: values.name,
        grade: values.grade || null,
        favorite_animal: values.favorite_animal,
        date_of_birth: values.date_of_birth,
        learner_number: values.learner_number || null,
        emergency_contact_name: values.emergency_contact_name || null,
        emergency_contact_phone: values.emergency_contact_phone || null,
        medical_notes: values.medical_notes || null,
      })
      .eq("id", selected.id);
    setIsSaving(false);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Learner details updated" });
    await loadLearners();
    await loadProgress({ ...selected, ...values, grade: values.grade || null } as Learner);
  };

  const upsertProgress = async (planId: string, patch: Partial<ProgressRow>) => {
    if (!selected) return;
    const existing = progress[planId];
    setSavingPlanId(planId);
    const payload = {
      child_id: selected.id,
      lesson_plan_id: planId,
      status: patch.status ?? existing?.status ?? "not_started",
      parent_notes: patch.parent_notes ?? existing?.parent_notes ?? null,
      updated_by: user?.id ?? null,
    };
    const { data, error } = await supabase
      .from("learner_lesson_progress")
      .upsert(payload, { onConflict: "child_id,lesson_plan_id" })
      .select("id, child_id, lesson_plan_id, status, parent_notes, teacher_notes")
      .single();
    setSavingPlanId(null);

    if (error) {
      toast({ title: "Could not save progress", description: error.message, variant: "destructive" });
      return;
    }
    setProgress((prev) => ({ ...prev, [planId]: data as ProgressRow }));
  };

  const completion = useMemo(() => {
    if (!plans.length) return 0;
    const total = plans.reduce((sum, p) => sum + statusMeta(progress[p.id]?.status ?? "not_started").weight, 0);
    return Math.round((total / plans.length) * 100);
  }, [plans, progress]);

  return (
    <DashboardLayout title="My Learners" description="View and update your learner's details and lesson plan progress">
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : learners.length === 0 ? (
        <Card className="glass-3d">
          <CardHeader>
            <CardTitle className="font-heading">No learners yet</CardTitle>
            <CardDescription>
              Add your child on the dashboard first, then come back here to manage their details and progress.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="glass-3d card-3d">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle className="font-heading flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Select learner
                </CardTitle>
                <CardDescription>Everything below applies to the learner you choose.</CardDescription>
              </div>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="sm:w-64">
                  <SelectValue placeholder="Choose a learner" />
                </SelectTrigger>
                <SelectContent>
                  {learners.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                      {l.grade ? ` — Grade ${l.grade}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
          </Card>

          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">
                <User className="mr-2 h-4 w-4" />
                Learner details
              </TabsTrigger>
              <TabsTrigger value="progress">
                <BookOpen className="mr-2 h-4 w-4" />
                Lesson plan progress
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <Card className="glass-3d">
                <CardHeader>
                  <CardTitle className="font-heading">Details for {selected?.name}</CardTitle>
                  <CardDescription>Keep this information accurate — teachers rely on it.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full name</Label>
                      <Input
                        id="name"
                        maxLength={100}
                        value={form.name ?? ""}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grade">Grade</Label>
                      <Select
                        value={form.grade ?? ""}
                        onValueChange={(v) => setForm({ ...form, grade: v })}
                      >
                        <SelectTrigger id="grade">
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADES.map((g) => (
                            <SelectItem key={g} value={g}>
                              Grade {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="learner_number">Learner number</Label>
                      <Input
                        id="learner_number"
                        maxLength={30}
                        value={form.learner_number ?? ""}
                        onChange={(e) => setForm({ ...form, learner_number: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={form.date_of_birth ?? ""}
                        onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="animal">Favourite animal</Label>
                      <Input
                        id="animal"
                        maxLength={50}
                        value={form.favorite_animal ?? ""}
                        onChange={(e) => setForm({ ...form, favorite_animal: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ec_name">Emergency contact name</Label>
                      <Input
                        id="ec_name"
                        maxLength={100}
                        value={form.emergency_contact_name ?? ""}
                        onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ec_phone">Emergency contact phone</Label>
                      <Input
                        id="ec_phone"
                        maxLength={20}
                        inputMode="tel"
                        value={form.emergency_contact_phone ?? ""}
                        onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medical">Medical notes / allergies</Label>
                    <Textarea
                      id="medical"
                      rows={4}
                      maxLength={1000}
                      value={form.medical_notes ?? ""}
                      onChange={(e) => setForm({ ...form, medical_notes: e.target.value })}
                    />
                  </div>
                  <Button onClick={saveDetails} disabled={isSaving} className="btn-3d">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save details
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="progress" className="mt-4 space-y-4">
              <Card className="glass-3d">
                <CardHeader>
                  <CardTitle className="font-heading">Overall progress</CardTitle>
                  <CardDescription>
                    {plans.length
                      ? `${completion}% across ${plans.length} lesson plan${plans.length === 1 ? "" : "s"}${
                          selected?.grade ? ` for Grade ${selected.grade}` : ""
                        }`
                      : "No lesson plans published for this learner's grade yet."}
                  </CardDescription>
                </CardHeader>
                {plans.length > 0 && (
                  <CardContent>
                    <Progress value={completion} />
                  </CardContent>
                )}
              </Card>

              {plans.map((plan) => {
                const row = progress[plan.id];
                const status = row?.status ?? "not_started";
                return (
                  <Card key={plan.id} className="glass-3d card-3d">
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="font-heading text-lg">{plan.topic}</CardTitle>
                        <Badge variant={status === "completed" ? "default" : "secondary"}>
                          {statusMeta(status).label}
                        </Badge>
                      </div>
                      <CardDescription>
                        {plan.subject} · Grade {plan.grade}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Progress status</Label>
                          <Select value={status} onValueChange={(v) => upsertProgress(plan.id, { status: v })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Your note for the teacher</Label>
                          <Textarea
                            rows={2}
                            maxLength={1000}
                            defaultValue={row?.parent_notes ?? ""}
                            onBlur={(e) => {
                              const value = e.target.value.trim();
                              if (value !== (row?.parent_notes ?? "")) {
                                upsertProgress(plan.id, { parent_notes: value || null });
                              }
                            }}
                            placeholder="e.g. struggled with the practical task"
                          />
                        </div>
                      </div>
                      {row?.teacher_notes && (
                        <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Teacher note: </span>
                          {row.teacher_notes}
                        </p>
                      )}
                      {savingPlanId === plan.id && (
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DashboardLayout>
  );
}
