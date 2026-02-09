import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, User, Baby, Heart, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import mtssLogo from "@/assets/mtss-logo.png";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, signUp, isLoading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    childName: "",
    favoriteAnimal: "",
    dateOfBirth: "",
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user && role) {
      const dashboardPath = role === "admin" ? "/admin" : role === "teacher" ? "/teacher" : "/parent";
      navigate(dashboardPath, { replace: true });
    }
  }, [user, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    // Child info is now optional - parents can add children from their dashboard
    const hasChildInfo = formData.childName.trim() && formData.favoriteAnimal.trim() && formData.dateOfBirth;
    
    // If they started filling child info, require all fields
    if ((formData.childName.trim() || formData.favoriteAnimal.trim() || formData.dateOfBirth) && !hasChildInfo) {
      toast({
        title: "Incomplete child information",
        description: "Please fill in all child details or leave them empty to add later.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error, userId } = await signUp(formData.email, formData.password, formData.name);

    if (error) {
      toast({
        title: "Signup failed",
        description: error.message || "Could not create account. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // If user was created successfully and child info was provided, add the child record
    if (userId && hasChildInfo) {
      const { error: childError } = await supabase
        .from("children")
        .insert({
          parent_id: userId,
          name: formData.childName.trim(),
          favorite_animal: formData.favoriteAnimal.trim(),
          date_of_birth: formData.dateOfBirth,
        });

      if (childError) {
        console.error("Error adding child:", childError);
        toast({
          title: "Account created",
          description: "Your account was created but there was an issue saving child info. You can add it from your dashboard.",
          variant: "default",
        });
      } else {
        toast({
          title: "Account created!",
          description: "Welcome to MTSS. Redirecting to your dashboard...",
        });
      }
    } else if (userId) {
      toast({
        title: "Account created!",
        description: "Welcome to MTSS. You can add your child's information from your dashboard.",
      });
    } else {
      toast({
        title: "Account created!",
        description: "Welcome to MTSS. Please check your email to confirm your account.",
      });
    }

    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl floating" />
        <div className="absolute bottom-40 left-10 w-64 h-64 rounded-full bg-accent/5 blur-3xl floating" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-primary/3 blur-2xl floating" style={{ animationDelay: "2.5s" }} />
      </div>
      
      {/* Simple Nav */}
      <nav className="p-4 nav-3d relative z-10">
        <Link to="/" className="flex items-center gap-2 w-fit group">
          <img src={mtssLogo} alt="MTSS" className="h-10 w-auto drop-shadow-lg group-hover:scale-105 transition-transform" />
          <span className="font-heading font-bold text-3d">MTSS</span>
        </Link>
      </nav>

      {/* Signup Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10 perspective-container">
        <Card className="w-full max-w-md animate-scale-in">
          <CardHeader className="text-center">
            <div className="relative inline-block mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-2xl scale-150" />
              <img src={mtssLogo} alt="MTSS" className="h-16 w-auto relative floating" />
            </div>
            <CardTitle className="font-heading text-2xl text-3d">Create Account</CardTitle>
            <CardDescription>
              Join the MTSS community. Register children from your dashboard after signing up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Parent Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Your Full Name</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg icon-3d flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    className="pl-14"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg icon-3d flex items-center justify-center">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    className="pl-14"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg icon-3d flex items-center justify-center">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    className="pl-14 pr-12"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg icon-3d flex items-center justify-center">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="pl-14"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Separator */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 py-1 text-muted-foreground rounded-full glass-3d">Child Information (Optional)</span>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground text-center -mt-2">
                You can add your child now or later from your dashboard
              </p>

              {/* Child Name */}
              <div className="space-y-2">
                <Label htmlFor="childName">Child's Name</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg icon-3d flex items-center justify-center">
                    <Baby className="h-4 w-4 text-primary" />
                  </div>
                  <Input
                    id="childName"
                    type="text"
                    placeholder="Your child's full name"
                    className="pl-14"
                    value={formData.childName}
                    onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                  />
                </div>
              </div>

              {/* Favorite Animal */}
              <div className="space-y-2">
                <Label htmlFor="favoriteAnimal">Child's Favorite Animal</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg icon-3d flex items-center justify-center">
                    <Heart className="h-4 w-4 text-primary" />
                  </div>
                  <Input
                    id="favoriteAnimal"
                    type="text"
                    placeholder="e.g., Lion, Elephant, Dog"
                    className="pl-14"
                    value={formData.favoriteAnimal}
                    onChange={(e) => setFormData({ ...formData, favoriteAnimal: e.target.value })}
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Child's Date of Birth</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg icon-3d flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    className="pl-14"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full gradient-shine" size="lg" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

              <div className="mt-6 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Are you a teacher?</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Teachers must be invited by an administrator.{" "}
                  <Link to="/teacher-signup" className="text-primary font-medium hover:underline">
                    Register here
                  </Link>
                </p>
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
