import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Clock, Users, CalendarDays } from "lucide-react";
import { format } from "date-fns";

interface ChildData {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  notes: string | null;
  class_name?: string;
}

export default function ParentAttendance() {
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildData[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, [user]);

  useEffect(() => {
    if (selectedChild) {
      fetchAttendance(selectedChild);
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    setIsLoading(true);
    
    const { data } = await supabase
      .from("children")
      .select("id, name")
      .eq("parent_id", user!.id);

    if (data && data.length > 0) {
      setChildren(data);
      setSelectedChild(data[0].id);
    }

    setIsLoading(false);
  };

  const fetchAttendance = async (childId: string) => {
    const { data } = await supabase
      .from("attendance")
      .select("id, date, status, notes, class_id")
      .eq("child_id", childId)
      .order("date", { ascending: false })
      .limit(30);

    if (data) {
      const classIds = [...new Set(data.map(a => a.class_id))];
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name")
        .in("id", classIds);

      const classMap = new Map((classes || []).map(c => [c.id, c.name]));

      const enriched = data.map(record => ({
        ...record,
        class_name: classMap.get(record.class_id) || "Unknown"
      }));

      setAttendance(enriched);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500/10 text-green-600"><Check className="h-3 w-3 mr-1" /> Present</Badge>;
      case "absent":
        return <Badge className="bg-red-500/10 text-red-600"><X className="h-3 w-3 mr-1" /> Absent</Badge>;
      case "late":
        return <Badge className="bg-yellow-500/10 text-yellow-600"><Clock className="h-3 w-3 mr-1" /> Late</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    present: attendance.filter(a => a.status === "present").length,
    absent: attendance.filter(a => a.status === "absent").length,
    late: attendance.filter(a => a.status === "late").length
  };

  const attendanceRate = attendance.length > 0 
    ? Math.round((stats.present / attendance.length) * 100)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Attendance Record</h1>
          <p className="text-muted-foreground mt-1">
            View your child's attendance history
          </p>
        </div>

        {children.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No children registered yet</p>
              <p className="text-sm">Add your children from the dashboard</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select child" />
              </SelectTrigger>
              <SelectContent>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{attendanceRate}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600">Present</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.present}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-600">Absent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.absent}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-600">Late</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.late}</div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Attendance History
                </CardTitle>
                <CardDescription>
                  Last 30 days of attendance records
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attendance.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No attendance records yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {format(new Date(record.date), "PPP")}
                          </TableCell>
                          <TableCell>{record.class_name}</TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {record.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
