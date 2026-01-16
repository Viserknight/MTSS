import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Baby, Heart, Calendar, Plus, Trash2, Edit2, Users } from "lucide-react";

interface Child {
  id: string;
  name: string;
  favorite_animal: string;
  date_of_birth: string;
  created_at: string;
}

const MAX_CHILDREN = 3;

export function ChildrenManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    favoriteAnimal: "",
    dateOfBirth: "",
  });

  useEffect(() => {
    if (user) {
      fetchChildren();
    }
  }, [user]);

  const fetchChildren = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from("children")
      .select("*")
      .eq("parent_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching children:", error);
      toast({
        title: "Error",
        description: "Could not load your children's information.",
        variant: "destructive",
      });
    } else {
      setChildren(data || []);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      favoriteAnimal: "",
      dateOfBirth: "",
    });
  };

  const handleAddChild = async () => {
    if (!user) return;
    
    if (!formData.name.trim() || !formData.favoriteAnimal.trim() || !formData.dateOfBirth) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (children.length >= MAX_CHILDREN) {
      toast({
        title: "Maximum children reached",
        description: `You can only register up to ${MAX_CHILDREN} children.`,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.from("children").insert({
      parent_id: user.id,
      name: formData.name.trim(),
      favorite_animal: formData.favoriteAnimal.trim(),
      date_of_birth: formData.dateOfBirth,
    });

    if (error) {
      console.error("Error adding child:", error);
      const message = error.message?.includes("Maximum of 3 children")
        ? "Maximum of 3 children allowed per parent."
        : "Could not add child. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Child added",
        description: `${formData.name} has been registered successfully.`,
      });
      resetForm();
      setIsAddDialogOpen(false);
      fetchChildren();
    }
    setIsSaving(false);
  };

  const handleEditChild = async () => {
    if (!editingChild) return;

    if (!formData.name.trim() || !formData.favoriteAnimal.trim() || !formData.dateOfBirth) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from("children")
      .update({
        name: formData.name.trim(),
        favorite_animal: formData.favoriteAnimal.trim(),
        date_of_birth: formData.dateOfBirth,
      })
      .eq("id", editingChild.id);

    if (error) {
      console.error("Error updating child:", error);
      toast({
        title: "Error",
        description: "Could not update child information.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Updated",
        description: `${formData.name}'s information has been updated.`,
      });
      resetForm();
      setIsEditDialogOpen(false);
      setEditingChild(null);
      fetchChildren();
    }
    setIsSaving(false);
  };

  const handleDeleteChild = async (child: Child) => {
    const { error } = await supabase.from("children").delete().eq("id", child.id);

    if (error) {
      console.error("Error deleting child:", error);
      toast({
        title: "Error",
        description: "Could not remove child.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Removed",
        description: `${child.name} has been removed.`,
      });
      fetchChildren();
    }
  };

  const openEditDialog = (child: Child) => {
    setEditingChild(child);
    setFormData({
      name: child.name,
      favoriteAnimal: child.favorite_animal,
      dateOfBirth: child.date_of_birth,
    });
    setIsEditDialogOpen(true);
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const canAddMore = children.length < MAX_CHILDREN;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              My Children
            </CardTitle>
            <CardDescription>
              Manage your registered children ({children.length}/{MAX_CHILDREN})
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={!canAddMore}>
                <Plus className="h-4 w-4 mr-1" />
                Add Child
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register New Child</DialogTitle>
                <DialogDescription>
                  Add your child's information to the school system.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="add-name">Child's Name</Label>
                  <div className="relative">
                    <Baby className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="add-name"
                      placeholder="Child's full name"
                      className="pl-10"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-animal">Favorite Animal</Label>
                  <div className="relative">
                    <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="add-animal"
                      placeholder="e.g., Lion, Elephant"
                      className="pl-10"
                      value={formData.favoriteAnimal}
                      onChange={(e) => setFormData({ ...formData, favoriteAnimal: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-dob">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="add-dob"
                      type="date"
                      className="pl-10"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { resetForm(); setIsAddDialogOpen(false); }}>
                  Cancel
                </Button>
                <Button onClick={handleAddChild} disabled={isSaving}>
                  {isSaving ? "Adding..." : "Add Child"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 rounded-lg border border-border animate-pulse">
                <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : children.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Baby className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No children registered yet</p>
            <p className="text-sm">Click "Add Child" to register your child</p>
          </div>
        ) : (
          <div className="space-y-3">
            {children.map((child) => (
              <div
                key={child.id}
                className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{child.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {calculateAge(child.date_of_birth)} years old
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {child.favorite_animal}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(child.date_of_birth).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(child)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove {child.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove {child.name} from your registered children. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteChild(child)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!canAddMore && children.length > 0 && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Maximum of {MAX_CHILDREN} children reached
          </p>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Child Information</DialogTitle>
              <DialogDescription>
                Update {editingChild?.name}'s information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Child's Name</Label>
                <div className="relative">
                  <Baby className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-name"
                    placeholder="Child's full name"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-animal">Favorite Animal</Label>
                <div className="relative">
                  <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-animal"
                    placeholder="e.g., Lion, Elephant"
                    className="pl-10"
                    value={formData.favoriteAnimal}
                    onChange={(e) => setFormData({ ...formData, favoriteAnimal: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dob">Date of Birth</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-dob"
                    type="date"
                    className="pl-10"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { resetForm(); setIsEditDialogOpen(false); setEditingChild(null); }}>
                Cancel
              </Button>
              <Button onClick={handleEditChild} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
