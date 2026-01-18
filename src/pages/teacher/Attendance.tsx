import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarIcon, Check, X, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ClassData {
  id: string;
  name: string;
  grade: string;
}

interface ChildData {
  id: string;
  name: string;
  grade: string | null;
}

interface AttendanceRecord {
  id?: string;
  child_id: string;
  status: "present" | "absent" | "late";
}

export default function Attendance() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [children, setChildren] = useState<ChildData[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, [user]);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchChildrenAndAttendance();
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    // Get classes where teacher is a member
    const { data: memberData } = await supabase
      .from("class_members")
      .select("class_id")
      .eq("user_id", user!.id);

    if (memberData && memberData.length > 0) {
      const classIds = memberData.map(m => m.class_id);
      const { data: classesData } = await supabase
        .from("classes")
        .select("id, name, grade")
        .in("id", classIds)
        .order("grade");

      if (classesData) {
        setClasses(classesData);
        if (classesData.length > 0) {
          setSelectedClass(classesData[0].id);
        }
      }
    }
    setIsLoading(false);
  };

  const fetchChildrenAndAttendance = async () => {
    // Get children assigned to this class
    const { data: assignments } = await supabase
      .from("child_class_assignments")
      .select("child_id")
      .eq("class_id", selectedClass);

    if (assignments && assignments.length > 0) {
      const childIds = assignments.map(a => a.child_id);
      const { data: childrenData } = await supabase
        .from("children")
        .select("id, name, grade")
        .in("id", childIds)
        .order("name");

      setChildren(childrenData || []);

      // Fetch existing attendance for this date
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("*")
        .eq("class_id", selectedClass)
        .eq("date", dateStr);

      const attendanceMap = new Map<string, AttendanceRecord>();
      (attendanceData || []).forEach(record => {
        attendanceMap.set(record.child_id, {
          id: record.id,
          child_id: record.child_id,
          status: record.status as "present" | "absent" | "late"
        });
      });
      setAttendance(attendanceMap);
    } else {
      setChildren([]);
      setAttendance(new Map());
    }
  };

  const handleStatusChange = (childId: string, status: "present" | "absent" | "late") => {
    const newAttendance = new Map(attendance);
    const existing = newAttendance.get(childId);
    newAttendance.set(childId, {
      ...existing,
      child_id: childId,
      status
    });
    setAttendance(newAttendance);
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    
    const records = Array.from(attendance.values()).map(record => ({
      child_id: record.child_id,
      class_id: selectedClass,
      date: dateStr,
      status: record.status,
      marked_by: user!.id
    }));

    // Upsert attendance records
    const { error } = await supabase
      .from("attendance")
      .upsert(records, { 
        onConflict: "child_id,class_id,date",
        ignoreDuplicates: false
      });

    if (error) {
      toast.error("Failed to save attendance");
      console.error(error);
    } else {
      toast.success("Attendance saved successfully");
      fetchChildrenAndAttendance();
    }
    setIsSaving(false);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500/10 text-green-600"><Check className="h-3 w-3 mr-1" /> Present</Badge>;
      case "absent":
        return <Badge className="bg-red-500/10 text-red-600"><X className="h-3 w-3 mr-1" /> Absent</Badge>;
      case "late":
        return <Badge className="bg-yellow-500/10 text-yellow-600"><Clock className="h-3 w-3 mr-1" /> Late</Badge>;
      default:
        return <Badge variant="outline">Not marked</Badge>;
    }
  };

  const stats = {
    present: Array.from(attendance.values()).filter(a => a.status === "present").length,
    absent: Array.from(attendance.values()).filter(a => a.status === "absent").length,
    late: Array.from(attendance.values()).filter(a => a.status === "late").length
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground mt-1">
            Mark and track student attendance
          </p>
        </div>

        {classes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>You are not assigned to any classes yet</p>
              <p className="text-sm">Contact an administrator to be assigned to classes</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Controls */}
            <div className="flex flex-wrap gap-4 items-center">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} (Grade {c.grade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button onClick={handleSaveAttendance} disabled={isSaving || children.length === 0}>
                {isSaving ? "Saving..." : "Save Attendance"}
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
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

            {/* Attendance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Mark Attendance</CardTitle>
                <CardDescription>
                  {children.length} students in this class
                </CardDescription>
              </CardHeader>
              <CardContent>
                {children.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No students assigned to this class</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {children.map((child) => (
                        <TableRow key={child.id}>
                          <TableCell className="font-medium">{child.name}</TableCell>
                          <TableCell>{child.grade || "-"}</TableCell>
                          <TableCell>{getStatusBadge(attendance.get(child.id)?.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={attendance.get(child.id)?.status === "present" ? "default" : "outline"}
                                className="h-8"
                                onClick={() => handleStatusChange(child.id, "present")}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={attendance.get(child.id)?.status === "absent" ? "destructive" : "outline"}
                                className="h-8"
                                onClick={() => handleStatusChange(child.id, "absent")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={attendance.get(child.id)?.status === "late" ? "secondary" : "outline"}
                                className="h-8"
                                onClick={() => handleStatusChange(child.id, "late")}
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                            </div>
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
