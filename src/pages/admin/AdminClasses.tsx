import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { School, Plus, Users, GraduationCap, Trash2, UserPlus } from "lucide-react";

interface ClassData {
  id: string;
  name: string;
  grade: string;
  created_at: string;
  members: { id: string; full_name: string; email: string; role: string }[];
}

interface UserOption {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export default function AdminClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [newClass, setNewClass] = useState({ name: "", grade: "" });
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    fetchClasses();
    fetchUsers();
  }, []);

  const fetchClasses = async () => {
    setIsLoading(true);

    const { data: classesData, error: classesError } = await supabase
      .from("classes")
      .select("*")
      .order("created_at", { ascending: false });

    if (classesError) {
      console.error("Error fetching classes:", classesError);
      setIsLoading(false);
      return;
    }

    // Fetch members for each class
    const classesWithMembers: ClassData[] = [];

    for (const cls of classesData || []) {
      const { data: members } = await supabase
        .from("class_members")
        .select("user_id")
        .eq("class_id", cls.id);

      const memberIds = members?.map((m) => m.user_id) || [];

      if (memberIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", memberIds);

        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", memberIds);

        const rolesMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);

        const membersWithDetails = (profiles || []).map((p) => ({
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          role: rolesMap.get(p.id) || "unknown",
        }));

        classesWithMembers.push({ ...cls, members: membersWithDetails });
      } else {
        classesWithMembers.push({ ...cls, members: [] });
      }
    }

    setClasses(classesWithMembers);
    setIsLoading(false);
  };

  const fetchUsers = async () => {
    // Get all teachers and parents (not admins)
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["teacher", "parent"]);

    if (!roles) return;

    const userIds = roles.map((r) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    const rolesMap = new Map(roles.map((r) => [r.user_id, r.role]));

    const usersWithRoles = (profiles || []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      role: rolesMap.get(p.id) || "unknown",
    }));

    setUsers(usersWithRoles);
  };

  const handleCreateClass = async () => {
    if (!newClass.name || !newClass.grade) {
      toast.error("Please fill in all fields");
      return;
    }

    const { error } = await supabase.from("classes").insert({
      name: newClass.name,
      grade: newClass.grade,
      created_by: user!.id,
    });

    if (error) {
      toast.error("Failed to create class");
      console.error(error);
      return;
    }

    toast.success("Class created successfully");
    setNewClass({ name: "", grade: "" });
    setIsCreateOpen(false);
    fetchClasses();
  };

  const handleDeleteClass = async (classId: string) => {
    const { error } = await supabase.from("classes").delete().eq("id", classId);

    if (error) {
      toast.error("Failed to delete class");
      console.error(error);
      return;
    }

    toast.success("Class deleted successfully");
    fetchClasses();
  };

  const handleAddMember = async () => {
    if (!selectedClass || !selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    const { error } = await supabase.from("class_members").insert({
      class_id: selectedClass.id,
      user_id: selectedUserId,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("User is already in this class");
      } else {
        toast.error("Failed to add member");
        console.error(error);
      }
      return;
    }

    toast.success("Member added successfully");
    setSelectedUserId("");
    setIsAddMemberOpen(false);
    fetchClasses();
  };

  const handleRemoveMember = async (classId: string, userId: string) => {
    const { error } = await supabase
      .from("class_members")
      .delete()
      .eq("class_id", classId)
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed to remove member");
      console.error(error);
      return;
    }

    toast.success("Member removed successfully");
    fetchClasses();
  };

  const getAvailableUsers = () => {
    if (!selectedClass) return users;
    const memberIds = selectedClass.members.map((m) => m.id);
    return users.filter((u) => !memberIds.includes(u.id));
  };

  const grades = ["Grade R", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <School className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-heading text-3xl font-bold">Class Management</h1>
              <p className="text-muted-foreground mt-1">
                Create classes and assign teachers and parents.
              </p>
            </div>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
                <DialogDescription>
                  Add a new class to organize teachers and parents.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Class Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Class 3A"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Select value={newClass.grade} onValueChange={(value) => setNewClass({ ...newClass, grade: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateClass}>Create Class</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Classes List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <School className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No classes created yet</p>
                <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Class
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {classes.map((cls) => (
              <Card key={cls.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <School className="h-5 w-5" />
                      {cls.name}
                    </CardTitle>
                    <CardDescription>{cls.grade}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={isAddMemberOpen && selectedClass?.id === cls.id} onOpenChange={(open) => {
                      setIsAddMemberOpen(open);
                      if (open) setSelectedClass(cls);
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <UserPlus className="h-4 w-4 mr-1" />
                          Add Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Member to {cls.name}</DialogTitle>
                          <DialogDescription>
                            Select a teacher or parent to add to this class.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select user" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableUsers().map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  <span className="flex items-center gap-2">
                                    {user.role === "teacher" ? (
                                      <GraduationCap className="h-4 w-4" />
                                    ) : (
                                      <Users className="h-4 w-4" />
                                    )}
                                    {user.full_name} ({user.email})
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddMember}>Add Member</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteClass(cls.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {cls.members.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No members assigned yet</p>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cls.members.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">{member.full_name}</TableCell>
                              <TableCell>{member.email}</TableCell>
                              <TableCell>
                                <Badge variant={member.role === "teacher" ? "secondary" : "outline"}>
                                  {member.role === "teacher" ? (
                                    <GraduationCap className="h-3 w-3 mr-1" />
                                  ) : (
                                    <Users className="h-3 w-3 mr-1" />
                                  )}
                                  {member.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveMember(cls.id, member.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
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
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
