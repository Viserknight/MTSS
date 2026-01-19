import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import mtssLogo from "@/assets/mtss-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, signIn, isLoading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
    setIsLoading(true);

    const { error } = await signIn(formData.email, formData.password);

    if (error) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
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
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/5 blur-3xl floating" />
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-accent/5 blur-3xl floating" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 rounded-full bg-primary/3 blur-2xl floating" style={{ animationDelay: "2s" }} />
      </div>
      
      {/* Simple Nav */}
      <nav className="p-4 nav-3d relative z-10">
        <Link to="/" className="flex items-center gap-2 w-fit group">
          <img src={mtssLogo} alt="MTSS" className="h-10 w-auto drop-shadow-lg group-hover:scale-105 transition-transform" />
          <span className="font-heading font-bold text-3d">MTSS</span>
        </Link>
      </nav>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10 perspective-container">
        <Card className="w-full max-w-md animate-scale-in">
          <CardHeader className="text-center">
            <div className="relative inline-block mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-2xl scale-150" />
              <img src={mtssLogo} alt="MTSS" className="h-20 w-auto relative floating" />
            </div>
            <CardTitle className="font-heading text-2xl text-3d">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your MTSS account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="pl-14 input-3d h-12 rounded-xl"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg icon-3d flex items-center justify-center">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
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

              <Button type="submit" className="w-full gradient-shine" size="lg" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary font-medium hover:underline">
                  Create one
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;