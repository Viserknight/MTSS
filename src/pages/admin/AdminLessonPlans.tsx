import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search, Sparkles, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminLessonPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredPlans(
        plans.filter(
          (plan) =>
            plan.subject?.toLowerCase().includes(query) ||
            plan.topic?.toLowerCase().includes(query) ||
            plan.teacher_name?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredPlans(plans);
    }
  }, [searchQuery, plans]);

  const fetchPlans = async () => {
    setIsLoading(true);

    const { data: plansData } = await supabase
      .from("lesson_plans")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch teacher profiles separately
    const teacherIds = [...new Set((plansData || []).map((p) => p.teacher_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", teacherIds);

    const profilesMap = new Map((profiles || []).map((p) => [p.id, p]));

    const plansWithTeachers = (plansData || []).map((plan) => ({
      ...plan,
      teacher_name: profilesMap.get(plan.teacher_id)?.full_name || "Unknown",
      teacher_email: profilesMap.get(plan.teacher_id)?.email || "",
    }));

    setPlans(plansWithTeachers);
    setFilteredPlans(plansWithTeachers);
    setIsLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">All Lesson Plans</h1>
          <p className="text-muted-foreground mt-1">
            View all AI-generated lesson plans by teachers.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by subject, topic, or teacher..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Plans Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-3/4" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : filteredPlans.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Sparkles className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-2">No lesson plans found</h3>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline">Grade {plan.grade}</Badge>
                    <Sparkles className="h-4 w-4 text-accent" />
                  </div>
                  <CardTitle className="text-lg">{plan.topic}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {plan.subject}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    By {plan.teacher_name}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Created {new Date(plan.created_at).toLocaleDateString()}
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        View Lesson Plan
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="font-heading">
                          {plan.topic}
                        </DialogTitle>
                        <DialogDescription>
                          {plan.subject} • Grade {plan.grade} • By {plan.teacher_name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
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