import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, Users } from "lucide-react";

interface ChildData {
  id: string;
  name: string;
  class_id?: string;
  class_name?: string;
  grade?: string;
}

interface TimetableEntry {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject: string;
  teacher_name?: string;
  room: string | null;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function ParentTimetable() {
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildData[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, [user]);

  useEffect(() => {
    if (selectedChild) {
      const child = children.find(c => c.id === selectedChild);
      if (child?.class_id) {
        fetchTimetable(child.class_id);
      } else {
        setTimetable([]);
      }
    }
  }, [selectedChild, children]);

  const fetchChildren = async () => {
    setIsLoading(true);
    
    const { data: childrenData } = await supabase
      .from("children")
      .select("id, name")
      .eq("parent_id", user!.id);

    if (childrenData && childrenData.length > 0) {
      // Get class assignments
      const childIds = childrenData.map(c => c.id);
      const { data: assignments } = await supabase
        .from("child_class_assignments")
        .select("child_id, class_id")
        .in("child_id", childIds);

      const assignmentMap = new Map((assignments || []).map(a => [a.child_id, a.class_id]));

      // Get class details
      const classIds = [...new Set((assignments || []).map(a => a.class_id))];
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name, grade")
        .in("id", classIds);

      const classMap = new Map((classes || []).map(c => [c.id, c]));

      const enrichedChildren = childrenData.map(child => {
        const classId = assignmentMap.get(child.id);
        const classData = classId ? classMap.get(classId) : null;
        return {
          ...child,
          class_id: classId,
          class_name: classData?.name,
          grade: classData?.grade
        };
      });

      setChildren(enrichedChildren);
      if (enrichedChildren.length > 0) {
        setSelectedChild(enrichedChildren[0].id);
      }
    }

    setIsLoading(false);
  };

  const fetchTimetable = async (classId: string) => {
    const { data } = await supabase
      .from("timetables")
      .select("*")
      .eq("class_id", classId)
      .order("day_of_week")
      .order("start_time");

    if (data) {
      const teacherIds = [...new Set(data.map(t => t.teacher_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", teacherIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

      const enriched = data.map(entry => ({
        ...entry,
        teacher_name: profileMap.get(entry.teacher_id) || "Unknown"
      }));

      setTimetable(enriched);
    }
  };

  const getDayColor = (day: string) => {
    const colors: Record<string, string> = {
      Monday: "bg-blue-500/10 text-blue-600",
      Tuesday: "bg-green-500/10 text-green-600",
      Wednesday: "bg-yellow-500/10 text-yellow-600",
      Thursday: "bg-purple-500/10 text-purple-600",
      Friday: "bg-orange-500/10 text-orange-600"
    };
    return colors[day] || "";
  };

  const selectedChildData = children.find(c => c.id === selectedChild);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Class Timetable</h1>
          <p className="text-muted-foreground mt-1">
            View your child's class schedule
          </p>
        </div>

        {children.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No children registered yet</p>
              <p className="text-sm">Add your children from the dashboard to view their timetables</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-4">
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

              {selectedChildData?.class_name && (
                <Badge variant="secondary">
                  {selectedChildData.class_name} (Grade {selectedChildData.grade})
                </Badge>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Weekly Schedule
                </CardTitle>
                <CardDescription>
                  {selectedChildData?.class_name 
                    ? `Schedule for ${selectedChildData.class_name}`
                    : "No class assigned"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedChildData?.class_id ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>This child is not assigned to a class yet</p>
                    <p className="text-sm">Contact the school administrator</p>
                  </div>
                ) : timetable.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No timetable available for this class</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Day</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Room</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {DAYS.map(day => {
                        const dayEntries = timetable.filter(e => e.day_of_week === day);
                        if (dayEntries.length === 0) return null;
                        
                        return dayEntries.map((entry, idx) => (
                          <TableRow key={entry.id}>
                            {idx === 0 && (
                              <TableCell rowSpan={dayEntries.length}>
                                <Badge className={getDayColor(day)}>{day}</Badge>
                              </TableCell>
                            )}
                            <TableCell className="font-mono text-sm">
                              {entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}
                            </TableCell>
                            <TableCell className="font-medium">{entry.subject}</TableCell>
                            <TableCell>{entry.teacher_name}</TableCell>
                            <TableCell>{entry.room || "-"}</TableCell>
                          </TableRow>
                        ));
                      })}
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
