import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { School, Users, GraduationCap } from "lucide-react";

interface ClassMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface ClassData {
  id: string;
  name: string;
  grade: string;
  members: ClassMember[];
}

export default function TeacherClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) fetchClasses();
  }, [user]);

  const fetchClasses = async () => {
    setIsLoading(true);

    // Get classes the teacher is a member of
    const { data: memberOf } = await supabase
      .from("class_members")
      .select("class_id")
      .eq("user_id", user!.id);

    if (!memberOf || memberOf.length === 0) {
      setClasses([]);
      setIsLoading(false);
      return;
    }

    const classIds = memberOf.map((m) => m.class_id);

    const { data: classesData } = await supabase
      .from("classes")
      .select("*")
      .in("id", classIds);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <School className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-heading text-3xl font-bold">My Classes</h1>
            <p className="text-muted-foreground mt-1">
              View the classes you're assigned to and their parent groups.
            </p>
          </div>
        </div>

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
                <p>You haven't been assigned to any classes yet.</p>
                <p className="text-sm mt-2">Contact your admin to be added to a class.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {classes.map((cls) => {
              const parents = cls.members.filter((m) => m.role === "parent");
              const teachers = cls.members.filter((m) => m.role === "teacher");

              return (
                <Card key={cls.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <School className="h-5 w-5" />
                      {cls.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span>{cls.grade}</span>
                      <span>•</span>
                      <span>{teachers.length} teacher(s)</span>
                      <span>•</span>
                      <span>{parents.length} parent(s)</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Parents in this class */}
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Parents in this Class ({parents.length})
                      </h4>
                      {parents.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No parents assigned yet</p>
                      ) : (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {parents.map((parent) => (
                                <TableRow key={parent.id}>
                                  <TableCell className="font-medium">{parent.full_name}</TableCell>
                                  <TableCell>{parent.email}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      <Users className="h-3 w-3 mr-1" />
                                      Parent
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {/* Other teachers */}
                      {teachers.length > 1 && (
                        <>
                          <h4 className="font-medium flex items-center gap-2 mt-6">
                            <GraduationCap className="h-4 w-4" />
                            Other Teachers
                          </h4>
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Email</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {teachers
                                  .filter((t) => t.id !== user!.id)
                                  .map((teacher) => (
                                    <TableRow key={teacher.id}>
                                      <TableCell className="font-medium">{teacher.full_name}</TableCell>
                                      <TableCell>{teacher.email}</TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
