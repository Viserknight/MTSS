import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, Loader2, Save } from "lucide-react";

const SUBJECTS = [
  // Core Subjects
  "Mathematics",
  "Mathematical Literacy",
  "English Home Language",
  "English First Additional Language",
  "Afrikaans First Additional Language",
  "Life Orientation",
  
  // Sciences
  "Physical Sciences",
  "Life Sciences",
  "Natural Sciences",
  
  // Technical Subjects
  "Engineering Graphics and Design (EGD)",
  "Civil Technology",
  "Electrical Technology",
  "Mechanical Technology",
  "Information Technology (IT)",
  "Computer Applications Technology (CAT)",
  "Technical Mathematics",
  "Technical Sciences",
  
  // Vocational Subjects
  "Welding and Metalwork",
  "Motor Mechanics",
  "Electrical Installation",
  "Plumbing",
  "Carpentry and Joinery",
  "Bricklaying and Plastering",
  
  // Commerce & Business
  "Accounting",
  "Business Studies",
  "Economics",
  "Economic and Management Sciences",
  
  // Humanities & Arts
  "Geography",
  "History",
  "Tourism",
  "Consumer Studies",
  "Social Sciences",
  
  // Creative Arts
  "Visual Arts",
  "Design",
  "Music",
];

const GRADES = ["8", "9", "10", "11", "12"];

export default function NewLessonPlan() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [formData, setFormData] = useState({
    subject: "",
    grade: "",
    topic: "",
  });

  const generateLessonPlan = async () => {
    if (!formData.subject || !formData.grade || !formData.topic.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedContent("");

    try {
      // Call AI edge function (will be created)
      const { data, error } = await supabase.functions.invoke("generate-lesson-plan", {
        body: {
          subject: formData.subject,
          grade: formData.grade,
          topic: formData.topic,
        },
      });

      if (error) throw error;

      setGeneratedContent(data.content);
      toast({
        title: "Lesson plan generated!",
        description: "Review and save your CAPS-aligned lesson plan.",
      });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message || "AI service unavailable. Please try again later.",
        variant: "destructive",
      });
      // Fallback placeholder
      setGeneratedContent(`
CAPS-ALIGNED LESSON PLAN
========================

Subject: ${formData.subject}
Grade: ${formData.grade}
Topic: ${formData.topic}

---

LESSON OBJECTIVES:
• Students will understand the key concepts of ${formData.topic}
• Students will be able to apply knowledge in practical scenarios
• Students will demonstrate critical thinking skills

DURATION: 45 minutes

RESOURCES REQUIRED:
• Textbook
• Whiteboard and markers
• Worksheets
• Visual aids

INTRODUCTION (10 minutes):
• Recap previous lesson
• Introduce today's topic: ${formData.topic}
• State learning objectives

DEVELOPMENT (25 minutes):
• Explain core concepts
• Provide examples and demonstrations
• Interactive class discussion
• Group activity

CONSOLIDATION (10 minutes):
• Summary of key points
• Q&A session
• Homework assignment

ASSESSMENT:
• Class participation
• Written exercise
• Peer evaluation

---
Note: This is a placeholder. Connect the AI service for full CAPS-aligned plans.
      `);
    }

    setIsGenerating(false);
  };

  const saveLessonPlan = async () => {
    if (!generatedContent) {
      toast({
        title: "No content",
        description: "Generate a lesson plan first.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.from("lesson_plans").insert({
      teacher_id: user!.id,
      subject: formData.subject,
      grade: formData.grade,
      topic: formData.topic,
      content: generatedContent,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save lesson plan.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Saved!",
        description: "Your lesson plan has been saved.",
      });
      navigate("/teacher/lesson-plans");
    }

    setIsSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate("/teacher/lesson-plans")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Lesson Plans
        </Button>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-2xl flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-accent" />
                AI Lesson Generator
              </CardTitle>
              <CardDescription>
                Generate CAPS-aligned lesson plans powered by AI.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subject: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select
                  value={formData.grade}
                  onValueChange={(value) =>
                    setFormData({ ...formData, grade: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        Grade {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Quadratic Equations, Photosynthesis"
                  value={formData.topic}
                  onChange={(e) =>
                    setFormData({ ...formData, topic: e.target.value })
                  }
                />
              </div>

              <Button
                onClick={generateLessonPlan}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Lesson Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Content */}
          <Card className="lg:row-span-2">
            <CardHeader>
              <CardTitle>Generated Lesson Plan</CardTitle>
              <CardDescription>
                Review and edit before saving
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedContent ? (
                <>
                  <pre className="whitespace-pre-wrap font-body text-sm bg-muted p-4 rounded-lg max-h-[500px] overflow-y-auto mb-4">
                    {generatedContent}
                  </pre>
                  <Button
                    onClick={saveLessonPlan}
                    disabled={isSaving}
                    className="w-full"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Lesson Plan
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Fill in the details and click generate</p>
                  <p className="text-sm">Your AI-generated lesson plan will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}