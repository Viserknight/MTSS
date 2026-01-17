import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Download, Baby, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Child {
  id: string;
  name: string;
  grade: string | null;
}

interface ReportCard {
  id: string;
  child_id: string;
  term: string;
  year: number;
  file_name: string;
  file_path: string;
  created_at: string;
}

export default function ParentReportCards() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChild, setActiveChild] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);

    // Fetch parent's children
    const { data: childrenData } = await supabase
      .from("children")
      .select("id, name, grade")
      .eq("parent_id", user.id)
      .order("name");

    if (childrenData && childrenData.length > 0) {
      setChildren(childrenData);
      setActiveChild(childrenData[0].id);

      // Fetch report cards for all children
      const childIds = childrenData.map(c => c.id);
      const { data: reportCardsData } = await supabase
        .from("report_cards")
        .select("*")
        .in("child_id", childIds)
        .order("year", { ascending: false })
        .order("term", { ascending: false });

      setReportCards(reportCardsData || []);
    }

    setIsLoading(false);
  };

  const handleDownload = async (reportCard: ReportCard) => {
    try {
      const { data, error } = await supabase.storage
        .from("report-cards")
        .download(reportCard.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = reportCard.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const getChildReportCards = (childId: string) => {
    return reportCards.filter(rc => rc.child_id === childId);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-3xl font-bold">Report Cards</h1>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (children.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-3xl font-bold">Report Cards</h1>
            <p className="text-muted-foreground mt-1">
              View your children's academic reports.
            </p>
          </div>
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Baby className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No children registered</p>
                <p className="text-sm mt-1">Add your children from the dashboard to view their report cards.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Report Cards</h1>
          <p className="text-muted-foreground mt-1">
            View and download your children's academic reports.
          </p>
        </div>

        <Tabs value={activeChild} onValueChange={setActiveChild}>
          <TabsList className="mb-4">
            {children.map((child) => (
              <TabsTrigger key={child.id} value={child.id}>
                {child.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {children.map((child) => {
            const childReports = getChildReportCards(child.id);
            
            return (
              <TabsContent key={child.id} value={child.id}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Baby className="h-5 w-5" />
                      {child.name}'s Report Cards
                    </CardTitle>
                    <CardDescription>
                      {child.grade ? `Grade ${child.grade}` : "Grade not assigned"} • {childReports.length} report{childReports.length !== 1 ? "s" : ""} available
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {childReports.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>No report cards available yet</p>
                        <p className="text-sm mt-1">Report cards will appear here once uploaded by teachers.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {childReports.map((rc) => (
                          <div
                            key={rc.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{rc.term} {rc.year}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  Uploaded {new Date(rc.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(rc)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
