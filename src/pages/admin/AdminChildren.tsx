import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Search, Baby, Calendar, Heart, User, Pencil, Trash2, School, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Child {
  id: string;
  name: string;
  favorite_animal: string;
  date_of_birth: string;
  grade: string | null;
  parent_id: string;
  created_at: string;
  parent_name?: string;
  parent_email?: string;
  assigned_class?: { id: string; name: string; grade: string } | null;
}

interface ClassOption {
  id: string;
  name: string;
  grade: string;
}

export default function AdminChildren() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [filteredChildren, setFilteredChildren] = useState<Child[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignClassDialogOpen, setAssignClassDialogOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [editForm, setEditForm] = useState({
    name: "",
    favorite_animal: "",
    date_of_birth: "",
    grade: "",
  });

  const GRADES = ["8", "9", "10", "11", "12"];

  useEffect(() => {
    fetchChildren();
    fetchClasses();
  }, []);

  useEffect(() => {
    filterChildren();
  }, [searchQuery, ageFilter, children]);

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from("classes")
      .select("id, name, grade")
      .order("name");

    if (!error && data) {
      setClasses(data);
    }
  };

  const fetchChildren = async () => {
    setIsLoading(true);

    const { data: childrenData, error } = await supabase
      .from("children")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching children:", error);
      setIsLoading(false);
      return;
    }

    // Get parent profiles
    const parentIds = [...new Set(childrenData?.map((c) => c.parent_id) || [])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", parentIds);

    const profilesMap = new Map(
      profiles?.map((p) => [p.id, { name: p.full_name, email: p.email }]) || []
    );

    // Get class assignments
    const childIds = childrenData?.map((c) => c.id) || [];
    const { data: assignments } = await supabase
      .from("child_class_assignments")
      .select("child_id, class_id")
      .in("child_id", childIds);

    const { data: classesData } = await supabase
      .from("classes")
      .select("id, name, grade");

    const classesMap = new Map(
      classesData?.map((c) => [c.id, { id: c.id, name: c.name, grade: c.grade }]) || []
    );

    const assignmentsMap = new Map(
      assignments?.map((a) => [a.child_id, classesMap.get(a.class_id) || null]) || []
    );

    const childrenWithParents = (childrenData || []).map((child) => ({
      ...child,
      parent_name: profilesMap.get(child.parent_id)?.name || "Unknown",
      parent_email: profilesMap.get(child.parent_id)?.email || "Unknown",
      assigned_class: assignmentsMap.get(child.id) || null,
    }));

    setChildren(childrenWithParents);
    setFilteredChildren(childrenWithParents);
    setIsLoading(false);
  };

  const filterChildren = () => {
    let filtered = [...children];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (child) =>
          child.name.toLowerCase().includes(query) ||
          child.favorite_animal.toLowerCase().includes(query) ||
          child.parent_name?.toLowerCase().includes(query) ||
          child.parent_email?.toLowerCase().includes(query)
      );
    }

    // Age filter
    if (ageFilter !== "all") {
      filtered = filtered.filter((child) => {
        const age = calculateAge(child.date_of_birth);
        switch (ageFilter) {
          case "0-5":
            return age >= 0 && age <= 5;
          case "6-10":
            return age >= 6 && age <= 10;
          case "11-15":
            return age >= 11 && age <= 15;
          case "16+":
            return age >= 16;
          default:
            return true;
        }
      });
    }

    setFilteredChildren(filtered);
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const openEditDialog = (child: Child) => {
    setSelectedChild(child);
    setEditForm({
      name: child.name,
      favorite_animal: child.favorite_animal,
      date_of_birth: child.date_of_birth,
      grade: child.grade || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditChild = async () => {
    if (!selectedChild) return;

    const { error } = await supabase
      .from("children")
      .update({
        name: editForm.name,
        favorite_animal: editForm.favorite_animal,
        date_of_birth: editForm.date_of_birth,
        grade: editForm.grade || null,
      })
      .eq("id", selectedChild.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update child information.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Child information updated successfully.",
    });
    setEditDialogOpen(false);
    fetchChildren();
  };

  const openDeleteDialog = (child: Child) => {
    setSelectedChild(child);
    setDeleteDialogOpen(true);
  };

  const handleDeleteChild = async () => {
    if (!selectedChild) return;

    const { error } = await supabase
      .from("children")
      .delete()
      .eq("id", selectedChild.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete child.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Deleted",
      description: "Child has been removed.",
    });
    setDeleteDialogOpen(false);
    fetchChildren();
  };

  const openAssignClassDialog = (child: Child) => {
    setSelectedChild(child);
    setSelectedClassId(child.assigned_class?.id || "");
    setAssignClassDialogOpen(true);
  };

  const handleAssignClass = async () => {
    if (!selectedChild || !user) return;

    // First, remove any existing assignment
    await supabase
      .from("child_class_assignments")
      .delete()
      .eq("child_id", selectedChild.id);

    // If a class is selected, create new assignment
    if (selectedClassId) {
      const { error } = await supabase
        .from("child_class_assignments")
        .insert({
          child_id: selectedChild.id,
          class_id: selectedClassId,
          assigned_by: user.id,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to assign class.",
          variant: "destructive",
        });
        return;
      }
    }

    toast({
      title: "Success",
      description: selectedClassId ? "Child assigned to class successfully." : "Class assignment removed.",
    });
    setAssignClassDialogOpen(false);
    fetchChildren();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">All Children</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all registered children across the school.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, animal, or parent..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={ageFilter} onValueChange={setAgeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Age range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ages</SelectItem>
              <SelectItem value="0-5">0-5 years</SelectItem>
              <SelectItem value="6-10">6-10 years</SelectItem>
              <SelectItem value="11-15">11-15 years</SelectItem>
              <SelectItem value="16+">16+ years</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Children Table */}
        <Card className="card-3d">
          <CardHeader>
            <CardTitle>Registered Children ({filteredChildren.length})</CardTitle>
            <CardDescription>
              All children registered by parents on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : filteredChildren.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Baby className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No children found</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Child Name</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Assigned Class</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Favorite Animal</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredChildren.map((child) => (
                      <TableRow key={child.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Baby className="h-4 w-4 text-muted-foreground" />
                            {child.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {child.grade ? (
                            <Badge className="bg-primary">Grade {child.grade}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Not assigned</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {child.assigned_class ? (
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                              <School className="h-3 w-3" />
                              {child.assigned_class.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">No class</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {calculateAge(child.date_of_birth)} years
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-pink-500" />
                            {child.favorite_animal}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{child.parent_name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{child.parent_email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(child.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openAssignClassDialog(child)}
                              title="Assign to class"
                            >
                              <Link2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(child)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => openDeleteDialog(child)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Assign Class Dialog */}
      <Dialog open={assignClassDialogOpen} onOpenChange={setAssignClassDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign {selectedChild?.name} to a Class</DialogTitle>
            <DialogDescription>
              Select a class to assign this child to. This will allow them to appear in attendance and timetable views.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No class (remove assignment)</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      <span className="flex items-center gap-2">
                        <School className="h-4 w-4" />
                        {cls.name} - {cls.grade}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignClassDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignClass}>
              {selectedClassId ? "Assign Class" : "Remove Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Child Information</DialogTitle>
            <DialogDescription>
              Update the child's details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Child's Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-animal">Favorite Animal</Label>
              <Input
                id="edit-animal"
                value={editForm.favorite_animal}
                onChange={(e) => setEditForm({ ...editForm, favorite_animal: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dob">Date of Birth</Label>
              <Input
                id="edit-dob"
                type="date"
                value={editForm.date_of_birth}
                onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Grade (8-12)</Label>
              <Select
                value={editForm.grade}
                onValueChange={(v) => setEditForm({ ...editForm, grade: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Not assigned</SelectItem>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditChild}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Child</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedChild?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteChild}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
