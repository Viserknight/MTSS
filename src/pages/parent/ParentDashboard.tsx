import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Bell, Calendar } from "lucide-react";
import { ChildrenManager } from "@/components/ChildrenManager";

export default function ParentDashboard() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch author profiles separately
    const authorIds = [...new Set((postsData || []).map((p) => p.author_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", authorIds);

    const profilesMap = new Map((profiles || []).map((p) => [p.id, p]));

    const postsWithAuthors = (postsData || []).map((post) => ({
      ...post,
      author_name: profilesMap.get(post.author_id)?.full_name || "Teacher",
    }));

    setPosts(postsWithAuthors);
    setIsLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-bold">Welcome, Parent!</h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with the latest announcements from MTSS teachers.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">New Announcements</CardTitle>
              <Bell className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{posts.length}</div>
              <p className="text-xs text-muted-foreground">Latest updates from teachers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">School Term</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">Term 1</div>
              <p className="text-xs text-muted-foreground">2026 Academic Year</p>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary-foreground/80">MTSS</CardTitle>
              <FileText className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">We Strive for Excellence</div>
              <p className="text-xs text-primary-foreground/70">Mogwase Technical Secondary School</p>
            </CardContent>
          </Card>
        </div>

        {/* Children Manager */}
        <ChildrenManager />

        {/* Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Latest Announcements
            </CardTitle>
            <CardDescription>
              Posts and updates from your child's teachers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-lg border border-border animate-pulse">
                    <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2 mb-3" />
                    <div className="h-16 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No announcements yet</p>
                <p className="text-sm">Check back later for updates from teachers</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-heading font-semibold text-lg">{post.title}</h3>
                      <Badge variant="outline" className="text-xs shrink-0 ml-2">
                        {new Date(post.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Posted by {post.author_name}
                    </p>
                    <p className="text-sm text-foreground/80 whitespace-pre-line">
                      {post.content}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}