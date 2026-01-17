import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Baby, Calendar, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Child {
  id: string;
  name: string;
  grade: string | null;
  parent_name: string;
}

interface ReportCard {
  id: string;
  child_id: string;
  child_name: string;
  term: string;
  year: number;
  file_name: string;
  file_path: string;
  created_at: string;
}

const TERMS = ["Term 1", "Term 2", "Term 3", "Term 4"];
const GRADES = ["8", "9", "10", "11", "12"];

export default function ReportCards() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [children, setChildren] = useState<Child[]>([]);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [uploadForm, setUploadForm] = useState({
    childId: "",
    term: "",
    year: new Date().getFullYear(),
    file: null as File | null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch children with parent info
    const { data: childrenData } = await supabase
      .from("children")
      .select("id, name, grade, parent_id")
      .order("name");

    if (childrenData) {
      const parentIds = [...new Set(childrenData.map(c => c.parent_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", parentIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
      
      setChildren(childrenData.map(c => ({
        ...c,
        parent_name: profilesMap.get(c.parent_id) || "Unknown"
      })));
    }

    // Fetch report cards
    const { data: reportCardsData } = await supabase
      .from("report_cards")
      .select("*")
      .order("created_at", { ascending: false });

    if (reportCardsData) {
      const childIds = [...new Set(reportCardsData.map(r => r.child_id))];
      const { data: childrenInfo } = await supabase
        .from("children")
        .select("id, name")
        .in("id", childIds);

      const childrenMap = new Map(childrenInfo?.map(c => [c.id, c.name]) || []);

      setReportCards(reportCardsData.map(r => ({
        ...r,
        child_name: childrenMap.get(r.child_id) || "Unknown"
      })));
    }

    setIsLoading(false);
  };

  const handleUpload = async () => {
    if (!uploadForm.childId || !uploadForm.term || !uploadForm.file || !user) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields and select a file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = uploadForm.file.name.split('.').pop();
      const filePath = `${uploadForm.childId}/${uploadForm.year}/${uploadForm.term.replace(' ', '-')}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("report-cards")
        .upload(filePath, uploadForm.file, { upsert: true });

      if (uploadError) throw uploadError;

      // Save record to database
      const { error: dbError } = await supabase
        .from("report_cards")
        .insert({
          child_id: uploadForm.childId,
          term: uploadForm.term,
          year: uploadForm.year,
          file_path: filePath,
          file_name: uploadForm.file.name,
          uploaded_by: user.id,
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Report card uploaded successfully.",
      });

      setDialogOpen(false);
      setUploadForm({ childId: "", term: "", year: new Date().getFullYear(), file: null });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload report card.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (reportCard: ReportCard) => {
    try {
      // Delete from storage
      await supabase.storage.from("report-cards").remove([reportCard.file_path]);
      
      // Delete from database
      await supabase.from("report_cards").delete().eq("id", reportCard.id);

      toast({ title: "Deleted", description: "Report card removed." });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete report card.",
        variant: "destructive",
      });
    }
  };

  const filteredReportCards = reportCards.filter(rc =>
    rc.child_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rc.term.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold">Report Cards</h1>
            <p className="text-muted-foreground mt-1">
              Upload and manage student report cards.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Report Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Report Card</DialogTitle>
                <DialogDescription>
                  Select a student and upload their report card (PDF).
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select
                    value={uploadForm.childId}
                    onValueChange={(v) => setUploadForm({ ...uploadForm, childId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.name} {child.grade ? `(Grade ${child.grade})` : ""} - {child.parent_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Term</Label>
                    <Select
                      value={uploadForm.term}
                      onValueChange={(v) => setUploadForm({ ...uploadForm, term: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        {TERMS.map((term) => (
                          <SelectItem key={term} value={term}>{term}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={uploadForm.year}
                      onChange={(e) => setUploadForm({ ...uploadForm, year: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Report Card (PDF)</Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name or term..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Uploaded Report Cards ({filteredReportCards.length})</CardTitle>
            <CardDescription>All report cards uploaded for students</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : filteredReportCards.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No report cards uploaded yet</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReportCards.map((rc) => (
                      <TableRow key={rc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Baby className="h-4 w-4 text-muted-foreground" />
                            {rc.child_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{rc.term}</Badge>
                        </TableCell>
                        <TableCell>{rc.year}</TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(rc.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(rc)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
