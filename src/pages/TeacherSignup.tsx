import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import mtssLogo from "@/assets/mtss-logo.png";

const TeacherSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [invitation, setInvitation] = useState<{ email: string; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("No invitation token provided. Please use the link from your invitation email.");
        setIsValidating(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("teacher_invitations")
        .select("email, status, expires_at")
        .eq("token", token)
        .single();

      if (fetchError || !data) {
        setError("Invalid invitation link. Please contact the administrator for a new invitation.");
        setIsValidating(false);
        return;
      }

      if (data.status === "accepted") {
        setError("This invitation has already been used. Please log in instead.");
        setIsValidating(false);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError("This invitation has expired. Please contact the administrator for a new invitation.");
        setIsValidating(false);
        return;
      }

      setInvitation({ email: data.email, status: data.status });
      setIsValidating(false);
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invitation) return;

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

    setIsLoading(true);

    try {
      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.name,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Use the security definer function to set teacher role (bypasses RLS)
        const { error: roleError } = await supabase.rpc('set_teacher_role', {
          target_user_id: authData.user.id
        });

        if (roleError) {
          console.error("Error setting teacher role:", roleError);
          // Continue anyway - admin can verify later
        }
      }

      // Update the invitation status
      await supabase
        .from("teacher_invitations")
        .update({ status: "accepted" })
        .eq("token", token);

      toast({
        title: "Account created!",
        description: "Welcome to MTSS. You can now log in to your teacher dashboard.",
      });

      navigate("/login");
    } catch (err: any) {
      console.error("Signup error:", err);
      toast({
        title: "Registration failed",
        description: err.message || "Could not create account. Please try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/5 blur-3xl floating" />
          <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-accent/5 blur-3xl floating" style={{ animationDelay: "1s" }} />
        </div>
        
        <div className="text-center relative z-10">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/5 blur-3xl floating" />
          <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-accent/5 blur-3xl floating" style={{ animationDelay: "1s" }} />
        </div>
        
        <nav className="p-4 nav-3d relative z-10">
          <Link to="/" className="flex items-center gap-2 w-fit group">
            <img src={mtssLogo} alt="MTSS" className="h-10 w-auto drop-shadow-lg group-hover:scale-105 transition-transform" />
            <span className="font-heading font-bold text-3d">MTSS</span>
          </Link>
        </nav>
        <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10 perspective-container">
          <Card className="w-full max-w-md animate-scale-in card-3d">
            <CardContent className="pt-6">
              <Alert variant="destructive" className="glass-3d">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="mt-6 text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Teacher accounts require an invitation from the school administrator. 
                  If you haven't received one, please contact the administration office.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/login">
                    <Button variant="outline" className="w-full hover-lift">Go to Login</Button>
                  </Link>
                  <Link to="/">
                    <Button variant="ghost" className="w-full hover-lift">Back to Home</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
      
      <nav className="p-4 nav-3d relative z-10">
        <Link to="/" className="flex items-center gap-2 w-fit group">
          <img src={mtssLogo} alt="MTSS" className="h-10 w-auto drop-shadow-lg group-hover:scale-105 transition-transform" />
          <span className="font-heading font-bold text-3d">MTSS</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10 perspective-container">
        <Card className="w-full max-w-md animate-scale-in">
          <CardHeader className="text-center">
            <div className="relative inline-block mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-2xl scale-150" />
              <img src={mtssLogo} alt="MTSS" className="h-16 w-auto relative floating" />
            </div>
            <CardTitle className="font-heading text-2xl text-3d">Teacher Registration</CardTitle>
            <CardDescription>Complete your registration to join MTSS</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6 bg-success/10 border-success/30">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription className="text-success-foreground">
                You're registering with: <strong>{invitation?.email}</strong>
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg icon-3d flex items-center justify-center">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={invitation?.email || ""}
                    className="pl-14 bg-muted input-3d h-12 rounded-xl"
                    disabled
                  />
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg icon-3d flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    className="pl-14 input-3d h-12 rounded-xl"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    className="pl-14 pr-12 input-3d h-12 rounded-xl"
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
                    className="pl-14 input-3d h-12 rounded-xl"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full gradient-shine" size="lg" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Complete Registration"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherSignup;