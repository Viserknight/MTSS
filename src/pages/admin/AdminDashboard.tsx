import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileText, Sparkles, ClipboardList, Shield, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    teachers: 0,
    parents: 0,
    posts: 0,
    lessonPlans: 0,
    auditLogs: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [
      usersRes,
      teachersRes,
      parentsRes,
      postsRes,
      plansRes,
      logsRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase.from("user_roles").select("id", { count: "exact" }).eq("role", "teacher"),
      supabase.from("user_roles").select("id", { count: "exact" }).eq("role", "parent"),
      supabase.from("posts").select("id", { count: "exact" }),
      supabase.from("lesson_plans").select("id", { count: "exact" }),
      supabase.from("audit_logs").select("id", { count: "exact" }),
    ]);

    setStats({
      users: usersRes.count || 0,
      teachers: teachersRes.count || 0,
      parents: parentsRes.count || 0,
      posts: postsRes.count || 0,
      lessonPlans: plansRes.count || 0,
      auditLogs: logsRes.count || 0,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-heading text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor and manage the MTSS platform.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.users}</div>
              <p className="text-xs text-muted-foreground">
                {stats.teachers} teachers • {stats.parents} parents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.posts}</div>
              <p className="text-xs text-muted-foreground">
                Teacher announcements
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Lesson Plans</CardTitle>
              <Sparkles className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.lessonPlans}</div>
              <p className="text-xs text-muted-foreground">
                AI-generated plans
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Audit Logs</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.auditLogs}</div>
              <p className="text-xs text-muted-foreground">
                Tracked actions
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Platform Status</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">All Systems Operational</div>
              <p className="text-xs text-muted-foreground">
                MTSS platform is running smoothly
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage the MTSS platform</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/admin/users">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/audit-logs">
                <ClipboardList className="h-4 w-4 mr-2" />
                View Audit Logs
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/posts">
                <FileText className="h-4 w-4 mr-2" />
                Review Posts
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/lesson-plans">
                <Sparkles className="h-4 w-4 mr-2" />
                View Lesson Plans
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}