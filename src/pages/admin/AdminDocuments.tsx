import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2, Sparkles, CheckCircle, AlertCircle, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProcessedLearner {
  name: string;
  dateOfBirth?: string;
  grade?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  status: "pending" | "success" | "error";
  message?: string;
}

export default function AdminDocuments() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentText, setDocumentText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedLearners, setProcessedLearners] = useState<ProcessedLearner[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Read text files directly
      if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".csv")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setDocumentText(event.target?.result as string || "");
        };
        reader.readAsText(file);
      } else {
        toast({
          title: "File selected",
          description: "File ready for processing. You can also paste or type the learner information below.",
        });
      }
    }
  };

  const processDocument = async () => {
    if (!documentText.trim()) {
      toast({
        title: "No content",
        description: "Please enter or paste learner information to process.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessedLearners([]);

    try {
      const { data, error } = await supabase.functions.invoke("process-document", {
        body: {
          content: documentText,
          type: "learner_registration",
        },
      });

      if (error) throw error;

      const learners: ProcessedLearner[] = data.learners || [];
      setProcessedLearners(learners);

      const successCount = learners.filter((l) => l.status === "success").length;
      toast({
        title: "Processing complete",
        description: `${successCount} of ${learners.length} learners processed successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process document.",
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  const registerLearners = async () => {
    const pendingLearners = processedLearners.filter((l) => l.status === "pending" || l.status === "success");
    
    if (pendingLearners.length === 0) {
      toast({
        title: "No learners to register",
        description: "Process a document first to extract learner information.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    const updatedLearners = [...processedLearners];

    for (let i = 0; i < updatedLearners.length; i++) {
      const learner = updatedLearners[i];
      if (learner.status !== "pending" && learner.status !== "success") continue;

      try {
        // Create parent if email provided
        let parentId = null;
        if (learner.parentEmail) {
          // Check if parent already exists
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", learner.parentEmail)
            .single();

          if (existingProfile) {
            parentId = existingProfile.id;
          }
        }

        // Insert child
        const { error: childError } = await supabase.from("children").insert({
          name: learner.name,
          date_of_birth: learner.dateOfBirth || new Date().toISOString().split("T")[0],
          parent_id: parentId || "00000000-0000-0000-0000-000000000000", // Placeholder if no parent
          favorite_animal: "Not specified",
          grade: learner.grade || null,
        });

        if (childError) throw childError;

        updatedLearners[i] = { ...learner, status: "success", message: "Registered successfully" };
      } catch (error: any) {
        updatedLearners[i] = { ...learner, status: "error", message: error.message };
      }
    }

    setProcessedLearners(updatedLearners);
    
    const successCount = updatedLearners.filter((l) => l.status === "success").length;
    toast({
      title: "Registration complete",
      description: `${successCount} learners registered successfully.`,
    });

    setIsProcessing(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Document Processing</h1>
          <p className="text-muted-foreground mt-1">
            Upload or paste documents for AI to extract and register learner information.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Section */}
          <Card className="card-3d">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-accent" />
                Upload Document
              </CardTitle>
              <CardDescription>
                Upload a file or paste learner information directly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-accent/50 transition-colors"
              >
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click to upload a file
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports TXT, CSV, or paste content below
                </p>
                {selectedFile && (
                  <Badge className="mt-4" variant="secondary">
                    {selectedFile.name}
                  </Badge>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,.pdf,.docx"
                className="hidden"
                onChange={handleFileSelect}
              />

              <div className="space-y-2">
                <Label>Or paste learner information</Label>
                <Textarea
                  placeholder={`Example format:
Name: John Smith
Date of Birth: 2010-05-15
Grade: 8
Parent: Mary Smith
Email: mary@example.com
Phone: 0821234567

Name: Jane Doe
Date of Birth: 2011-03-22
Grade: 9
...`}
                  rows={10}
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                />
              </div>

              <Button
                onClick={processDocument}
                disabled={isProcessing || !documentText.trim()}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Process Document
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="card-3d">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                Extracted Learners
              </CardTitle>
              <CardDescription>
                Review extracted information before registering
              </CardDescription>
            </CardHeader>
            <CardContent>
              {processedLearners.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No learners extracted yet</p>
                  <p className="text-sm">Process a document to see results</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {processedLearners.map((learner, index) => (
                      <div
                        key={index}
                        className="p-4 bg-muted/50 rounded-lg border"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{learner.name}</h4>
                          {learner.status === "success" ? (
                            <Badge className="bg-accent/10 text-accent border-accent/20">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ready
                            </Badge>
                          ) : learner.status === "error" ? (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Error
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {learner.grade && <p>Grade: {learner.grade}</p>}
                          {learner.dateOfBirth && (
                            <p>DOB: {learner.dateOfBirth}</p>
                          )}
                          {learner.parentName && (
                            <p>Parent: {learner.parentName}</p>
                          )}
                          {learner.parentEmail && (
                            <p>Email: {learner.parentEmail}</p>
                          )}
                          {learner.message && (
                            <p className="text-xs italic">{learner.message}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {processedLearners.length > 0 && (
                <Button
                  onClick={registerLearners}
                  disabled={isProcessing}
                  className="w-full mt-4"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Register All Learners
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}