import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "teacher" | "parent")[];
  requireVerification?: boolean;
}

export function ProtectedRoute({ children, allowedRoles, requireVerification = true }: ProtectedRouteProps) {
  const { user, role, isVerified, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    const dashboardPath = role === "admin" ? "/admin" : role === "teacher" ? "/teacher" : "/parent";
    return <Navigate to={dashboardPath} replace />;
  }

  // Check if teacher needs verification (only for teacher-specific routes)
  if (requireVerification && role === "teacher" && !isVerified) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <CardTitle>Verification Pending</CardTitle>
              <CardDescription>
                Your account is waiting for admin approval. You'll be able to access all features once verified.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              <p>Please check back later or contact your school administrator.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return <>{children}</>;
}