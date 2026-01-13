import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Sparkles, Plus, TrendingUp } from "lucide-react";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ posts: 0, lessonPlans: 0 });
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchRecentPosts();
    }
  }, [user]);

  const fetchStats = async () => {
    const [postsRes, plansRes] = await Promise.all([
      supabase.from("posts").select("id", { count: "exact" }).eq("author_id", user!.id),
      supabase.from("lesson_plans").select("id", { count: "exact" }).eq("teacher_id", user!.id),
    ]);

    setStats({
      posts: postsRes.count || 0,
      lessonPlans: plansRes.count || 0,
    });
  };

  const fetchRecentPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("author_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5);

    setRecentPosts(data || []);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-bold">Welcome back, Teacher!</h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your classroom.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/teacher/posts/new">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/teacher/lesson-plans/new">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Lesson Plan
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/teacher/feed">
              <FileText className="h-4 w-4 mr-2" />
              View Feed
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/teacher/classes">
              <TrendingUp className="h-4 w-4 mr-2" />
              My Classes
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.posts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Announcements shared with parents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Lesson Plans</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.lessonPlans}</div>
              <p className="text-xs text-muted-foreground mt-1">
                AI-generated CAPS lessons
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">Active</div>
              <p className="text-xs text-muted-foreground mt-1">
                Your classroom is connected
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>Your latest announcements to parents</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No posts yet. Create your first announcement!</p>
                <Button className="mt-4" asChild>
                  <Link to="/teacher/posts/new">Create Post</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium">{post.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/teacher/posts/${post.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}