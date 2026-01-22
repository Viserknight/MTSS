import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Loader2, FileText } from "lucide-react";

export default function AdminNewPost() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    isPublished: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in both title and content.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("posts").insert({
      author_id: user!.id,
      title: formData.title.trim(),
      content: formData.content.trim(),
      is_published: formData.isPublished,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create post.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Post created!",
        description: formData.isPublished ? "Your post is now visible to parents." : "Post saved as draft.",
      });
      navigate("/admin/posts");
    }

    setIsSubmitting(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate("/admin/posts")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Posts
        </Button>

        <Card className="card-3d">
          <CardHeader>
            <CardTitle className="font-heading text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6 text-accent" />
              Create Admin Announcement
            </CardTitle>
            <CardDescription>
              Create an announcement or post for parents to see.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter post title..."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your announcement content..."
                  rows={10}
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-between py-4 px-4 bg-muted/50 rounded-lg">
                <div>
                  <Label htmlFor="published" className="font-medium">Publish immediately</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this post visible to parents right away
                  </p>
                </div>
                <Switch
                  id="published"
                  checked={formData.isPublished}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPublished: checked })
                  }
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {formData.isPublished ? "Publish Post" : "Save as Draft"}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}