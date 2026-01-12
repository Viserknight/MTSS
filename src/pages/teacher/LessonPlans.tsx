import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Sparkles, Trash2, BookOpen } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function LessonPlans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    if (user) fetchPlans();
  }, [user]);

  const fetchPlans = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("lesson_plans")
      .select("*")
      .eq("teacher_id", user!.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to load lesson plans", variant: "destructive" });
    } else {
      setPlans(data || []);
    }
    setIsLoading(false);
  };

  const deletePlan = async (planId: string) => {
    const { error } = await supabase.from("lesson_plans").delete().eq("id", planId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete plan", variant: "destructive" });
    } else {
      toast({ title: "Plan deleted", description: "The lesson plan has been removed" });
      fetchPlans();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">AI Lesson Plans</h1>
            <p className="text-muted-foreground mt-1">
              Generate CAPS-aligned lesson plans with AI assistance.
            </p>
          </div>
          <Button asChild>
            <Link to="/teacher/lesson-plans/new">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate New
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Sparkles className="h-16 w-16 mx-auto text-accent mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-2">No lesson plans yet</h3>
              <p className="text-muted-foreground mb-6">
                Use AI to generate your first CAPS-aligned lesson plan.
              </p>
              <Button asChild>
                <Link to="/teacher/lesson-plans/new">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate First Plan
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className="mb-2">
                      Grade {plan.grade}
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this lesson plan?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deletePlan(plan.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <CardTitle className="text-lg">{plan.topic}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {plan.subject}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-4">
                    Created {new Date(plan.created_at).toLocaleDateString()}
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setSelectedPlan(plan)}
                      >
                        View Lesson Plan
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="font-heading">
                          {plan.topic}
                        </DialogTitle>
                        <DialogDescription>
                          {plan.subject} • Grade {plan.grade}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="prose prose-sm max-w-none dark:prose-invert mt-4">
                        <pre className="whitespace-pre-wrap font-body text-sm bg-muted p-4 rounded-lg">
                          {plan.content}
                        </pre>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}