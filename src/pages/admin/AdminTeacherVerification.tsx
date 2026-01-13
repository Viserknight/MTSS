import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GraduationCap, CheckCircle, XCircle, Clock, UserCheck } from "lucide-react";

interface TeacherUser {
  id: string;
  full_name: string;
  email: string;
  is_verified: boolean;
  created_at: string;
}

export default function AdminTeacherVerification() {
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setIsLoading(true);

    // Get all teachers with their verification status
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, is_verified, created_at")
      .eq("role", "teacher");

    if (rolesError) {
      console.error("Error fetching teachers:", rolesError);
      setIsLoading(false);
      return;
    }

    if (!roles || roles.length === 0) {
      setTeachers([]);
      setIsLoading(false);
      return;
    }

    // Get profiles for these teachers
    const teacherIds = roles.map((r) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", teacherIds);

    const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    const teachersWithProfiles = roles.map((role) => {
      const profile = profilesMap.get(role.user_id);
      return {
        id: role.user_id,
        full_name: profile?.full_name || "Unknown",
        email: profile?.email || "Unknown",
        is_verified: role.is_verified ?? false,
        created_at: role.created_at,
      };
    });

    setTeachers(teachersWithProfiles);
    setIsLoading(false);
  };

  const handleVerify = async (userId: string, verify: boolean) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ is_verified: verify })
      .eq("user_id", userId)
      .eq("role", "teacher");

    if (error) {
      toast.error("Failed to update verification status");
      console.error(error);
      return;
    }

    toast.success(verify ? "Teacher verified successfully" : "Teacher verification revoked");
    fetchTeachers();
  };

  const pendingTeachers = teachers.filter((t) => !t.is_verified);
  const verifiedTeachers = teachers.filter((t) => t.is_verified);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <UserCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-heading text-3xl font-bold">Teacher Verification</h1>
            <p className="text-muted-foreground mt-1">
              Approve teachers before they can access the platform features.
            </p>
          </div>
        </div>

        {/* Pending Verification */}
        <Card className="border-warning/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              <CardTitle>Pending Verification ({pendingTeachers.length})</CardTitle>
            </div>
            <CardDescription>
              These teachers are waiting for your approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : pendingTeachers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No pending teacher verifications</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTeachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            {teacher.full_name}
                          </div>
                        </TableCell>
                        <TableCell>{teacher.email}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(teacher.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleVerify(teacher.id, true)}
                            className="mr-2"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
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

        {/* Verified Teachers */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <CardTitle>Verified Teachers ({verifiedTeachers.length})</CardTitle>
            </div>
            <CardDescription>
              Teachers with full platform access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : verifiedTeachers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No verified teachers yet</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verifiedTeachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            {teacher.full_name}
                          </div>
                        </TableCell>
                        <TableCell>{teacher.email}</TableCell>
                        <TableCell>
                          <Badge className="bg-success">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerify(teacher.id, false)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Revoke
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
