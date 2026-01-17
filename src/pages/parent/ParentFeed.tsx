import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { FileText, User } from "lucide-react";

interface Post {
  id: string;
  title: string;
  content: string;
  is_published: boolean;
  created_at: string;
  author_name: string;
}

export default function ParentFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);

    // Fetch all published posts
    const { data: postsData, error } = await supabase
      .from("posts")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
      setIsLoading(false);
      return;
    }

    // Get author profiles
    const authorIds = [...new Set(postsData?.map((p) => p.author_id) || [])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", authorIds);

    const profilesMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

    const postsWithAuthors = (postsData || []).map((post) => ({
      ...post,
      author_name: profilesMap.get(post.author_id) || "Unknown",
    }));

    setPosts(postsWithAuthors);
    setIsLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">School Feed</h1>
          <p className="text-muted-foreground mt-1">
            View all announcements and updates from teachers.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No announcements yet</p>
                <p className="text-sm mt-1">Check back later for updates from teachers.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{post.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4" />
                        {post.author_name} • {new Date(post.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Announcement</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{post.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
