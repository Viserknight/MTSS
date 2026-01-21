import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import mtssLogo from "@/assets/mtss-logo.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/5 blur-3xl floating" />
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-accent/5 blur-3xl floating" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 rounded-full bg-primary/3 blur-2xl floating" style={{ animationDelay: "2s" }} />
      </div>
      
      <div className="text-center relative z-10">
        <div className="relative inline-block mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-2xl scale-150" />
          <img src={mtssLogo} alt="MTSS" className="h-24 w-auto relative floating" />
        </div>
        
        <h1 className="mb-4 text-8xl font-heading font-bold text-primary text-3d">404</h1>
        <p className="mb-6 text-2xl text-muted-foreground font-heading">Oops! Page not found</p>
        <p className="mb-8 text-muted-foreground max-w-md mx-auto px-4">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <Button asChild size="lg" className="gradient-shine">
          <Link to="/">
            <Home className="mr-2 h-5 w-5" />
            Return to Home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;