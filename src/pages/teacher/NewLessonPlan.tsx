import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, Loader2, Save, Camera, Upload, Wand2, FileText } from "lucide-react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [activeTab, setActiveTab] = useState("generate");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState("");
  
  const [formData, setFormData] = useState({
    subject: "",
    grade: "",
    topic: "",
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const generateLessonPlan = async () => {
    if (!formData.subject || !formData.grade || !formData.topic.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setGeneratedContent("");

    try {
      const { data, error } = await supabase.functions.invoke("generate-lesson-plan", {
        body: {
          subject: formData.subject,
          grade: formData.grade,
          topic: formData.topic,
          mode: "generate",
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
    }

    setIsProcessing(false);
  };

  const extractFromImage = async () => {
    if (!uploadedImage) {
      toast({
        title: "No image",
        description: "Please upload an image of your lesson plan first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setGeneratedContent("");

    try {
      const { data, error } = await supabase.functions.invoke("generate-lesson-plan", {
        body: {
          imageBase64: uploadedImage,
          mode: "extract",
        },
      });

      if (error) throw error;

      setGeneratedContent(data.content);
      toast({
        title: "Lesson plan extracted!",
        description: "Your handwritten/printed lesson plan has been digitized.",
      });
    } catch (error: any) {
      toast({
        title: "Extraction failed",
        description: error.message || "Failed to extract lesson plan from image.",
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  const editLessonPlan = async () => {
    if (!generatedContent) {
      toast({
        title: "No content",
        description: "Generate or upload a lesson plan first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-lesson-plan", {
        body: {
          editContent: {
            currentPlan: generatedContent,
            instruction: editInstruction,
          },
          imageBase64: uploadedImage,
          mode: "edit",
        },
      });

      if (error) throw error;

      setGeneratedContent(data.content);
      setEditInstruction("");
      toast({
        title: "Lesson plan updated!",
        description: "Your changes have been applied.",
      });
    } catch (error: any) {
      toast({
        title: "Edit failed",
        description: error.message || "Failed to edit lesson plan.",
        variant: "destructive",
      });
    }

    setIsProcessing(false);
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
      subject: formData.subject || "Not specified",
      grade: formData.grade || "Not specified",
      topic: formData.topic || "Uploaded/Edited Plan",
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
      <div className="max-w-6xl mx-auto space-y-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate("/teacher/lesson-plans")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Lesson Plans
        </Button>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Methods */}
          <Card className="card-3d">
            <CardHeader>
              <CardTitle className="font-heading text-2xl flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-accent" />
                AI Lesson Plan Creator
              </CardTitle>
              <CardDescription>
                Generate, upload, or edit CAPS-aligned lesson plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="generate" className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Generate
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="flex items-center gap-1">
                    <Camera className="h-3 w-3" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="edit" className="flex items-center gap-1">
                    <Wand2 className="h-3 w-3" />
                    Edit
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="generate" className="space-y-4">
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
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate CAPS Lesson Plan
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    
                    {uploadedImage ? (
                      <div className="space-y-4">
                        <img
                          src={uploadedImage}
                          alt="Uploaded lesson plan"
                          className="max-h-48 mx-auto rounded-lg shadow-lg"
                        />
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Replace
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => setUploadedImage(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer py-8"
                      >
                        <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="font-medium">Upload or photograph your lesson plan</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Take a photo of your handwritten or printed lesson plan
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={extractFromImage}
                    disabled={isProcessing || !uploadedImage}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Extract & Convert to CAPS Format
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="edit" className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      {generatedContent
                        ? "✅ You have a lesson plan loaded. Describe what changes you want to make."
                        : "⚠️ First generate or upload a lesson plan, then come back here to edit it."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editInstruction">Describe your changes</Label>
                    <Textarea
                      id="editInstruction"
                      placeholder="e.g., Add more group activities, include a practical demonstration, extend the consolidation phase, add assessment rubric..."
                      value={editInstruction}
                      onChange={(e) => setEditInstruction(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Or upload reference image (optional)</Label>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Add Reference Image
                    </Button>
                  </div>

                  <Button
                    onClick={editLessonPlan}
                    disabled={isProcessing || !generatedContent}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Apply AI Edits
                      </>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Generated Content */}
          <Card className="lg:row-span-2 card-3d">
            <CardHeader>
              <CardTitle>CAPS Lesson Plan</CardTitle>
              <CardDescription>
                Official Grades 8-12 format
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedContent ? (
                <>
                  <pre className="whitespace-pre-wrap font-mono text-xs bg-muted p-4 rounded-lg max-h-[600px] overflow-y-auto mb-4 leading-relaxed">
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
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">No lesson plan yet</p>
                  <p className="text-sm mt-2">
                    Generate a new plan, upload an image, or edit an existing one
                  </p>
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg text-left text-xs">
                    <p className="font-semibold mb-2">CAPS Format Includes:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• CAPS Reference & Learning Objectives</li>
                      <li>• Prior Knowledge & Resources</li>
                      <li>• 4-Phase Lesson Structure</li>
                      <li>• Assessment & Differentiation</li>
                      <li>• Teacher Reflection</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
