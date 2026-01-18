import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Calendar, Clock } from "lucide-react";

interface ClassData {
  id: string;
  name: string;
  grade: string;
}

interface TeacherData {
  id: string;
  full_name: string;
}

interface TimetableEntry {
  id: string;
  class_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject: string;
  teacher_id: string;
  room: string | null;
  class_name?: string;
  teacher_name?: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const SUBJECTS = [
  "Mathematics", "Physical Sciences", "Life Sciences", "English", 
  "Afrikaans", "Geography", "History", "Accounting", "Business Studies",
  "Economics", "Life Orientation", "Computer Applications Technology",
  "Information Technology", "Engineering Graphics and Design", "Technical Mathematics"
];

export default function AdminTimetables() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("");
  
  const [newEntry, setNewEntry] = useState({
    class_id: "",
    day_of_week: "",
    start_time: "",
    end_time: "",
    subject: "",
    teacher_id: "",
    room: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchTimetables(selectedClass);
    }
  }, [selectedClass]);

  const fetchData = async () => {
    setIsLoading(true);
    
    const [classesRes, teachersRes] = await Promise.all([
      supabase.from("classes").select("id, name, grade").order("grade"),
      supabase.from("user_roles").select("user_id").eq("role", "teacher")
    ]);

    if (classesRes.data) {
      setClasses(classesRes.data);
      if (classesRes.data.length > 0 && !selectedClass) {
        setSelectedClass(classesRes.data[0].id);
      }
    }

    if (teachersRes.data) {
      const teacherIds = teachersRes.data.map(t => t.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", teacherIds);
      
      setTeachers(profiles || []);
    }

    setIsLoading(false);
  };

  const fetchTimetables = async (classId: string) => {
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
      const classData = classes.find(c => c.id === classId);

      const enriched = data.map(entry => ({
        ...entry,
        class_name: classData?.name || "",
        teacher_name: profileMap.get(entry.teacher_id) || "Unknown"
      }));

      setTimetables(enriched);
    }
  };

  const handleCreateEntry = async () => {
    if (!newEntry.class_id || !newEntry.day_of_week || !newEntry.start_time || 
        !newEntry.end_time || !newEntry.subject || !newEntry.teacher_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { error } = await supabase.from("timetables").insert({
      ...newEntry,
      room: newEntry.room || null,
      created_by: user!.id
    });

    if (error) {
      toast.error("Failed to create timetable entry");
      console.error(error);
    } else {
      toast.success("Timetable entry created");
      setIsDialogOpen(false);
      setNewEntry({
        class_id: selectedClass,
        day_of_week: "",
        start_time: "",
        end_time: "",
        subject: "",
        teacher_id: "",
        room: ""
      });
      fetchTimetables(selectedClass);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    const { error } = await supabase.from("timetables").delete().eq("id", id);
    
    if (error) {
      toast.error("Failed to delete entry");
    } else {
      toast.success("Entry deleted");
      fetchTimetables(selectedClass);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">Timetables</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage class schedules
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setNewEntry({ ...newEntry, class_id: selectedClass })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Timetable Entry</DialogTitle>
                <DialogDescription>
                  Create a new schedule entry for a class
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={newEntry.class_id} onValueChange={(v) => setNewEntry({ ...newEntry, class_id: v })}>
                    <SelectTrigger>
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
                </div>

                <div className="space-y-2">
                  <Label>Day</Label>
                  <Select value={newEntry.day_of_week} onValueChange={(v) => setNewEntry({ ...newEntry, day_of_week: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day) => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input 
                      type="time" 
                      value={newEntry.start_time}
                      onChange={(e) => setNewEntry({ ...newEntry, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input 
                      type="time" 
                      value={newEntry.end_time}
                      onChange={(e) => setNewEntry({ ...newEntry, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={newEntry.subject} onValueChange={(v) => setNewEntry({ ...newEntry, subject: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((subject) => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Teacher</Label>
                  <Select value={newEntry.teacher_id} onValueChange={(v) => setNewEntry({ ...newEntry, teacher_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Room (Optional)</Label>
                  <Input 
                    placeholder="e.g., Room 101"
                    value={newEntry.room}
                    onChange={(e) => setNewEntry({ ...newEntry, room: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateEntry}>Create Entry</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Class Schedule
                </CardTitle>
                <CardDescription>View and manage timetable entries</CardDescription>
              </div>
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
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : timetables.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No timetable entries for this class</p>
                <p className="text-sm">Click "Add Entry" to create a schedule</p>
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
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timetables.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Badge className={getDayColor(entry.day_of_week)}>
                          {entry.day_of_week}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}
                      </TableCell>
                      <TableCell className="font-medium">{entry.subject}</TableCell>
                      <TableCell>{entry.teacher_name}</TableCell>
                      <TableCell>{entry.room || "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEntry(entry.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
