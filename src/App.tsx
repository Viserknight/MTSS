import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SchoolAnthem from "./pages/SchoolAnthem";
import MediaGallery from "./pages/MediaGallery";
import TeacherSignup from "./pages/TeacherSignup";
import NotFound from "./pages/NotFound";

// Teacher pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherPosts from "./pages/teacher/TeacherPosts";
import NewPost from "./pages/teacher/NewPost";
import LessonPlans from "./pages/teacher/LessonPlans";
import NewLessonPlan from "./pages/teacher/NewLessonPlan";
import TeacherClasses from "./pages/teacher/TeacherClasses";
import TeacherFeed from "./pages/teacher/TeacherFeed";

// Parent pages
import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentAnnouncements from "./pages/parent/ParentAnnouncements";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminLessonPlans from "./pages/admin/AdminLessonPlans";
import AdminTeacherVerification from "./pages/admin/AdminTeacherVerification";
import AdminTeacherInvitations from "./pages/admin/AdminTeacherInvitations";
import AdminClasses from "./pages/admin/AdminClasses";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/school-anthem" element={<SchoolAnthem />} />
            <Route path="/gallery" element={<MediaGallery />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/teacher-signup" element={<TeacherSignup />} />

            {/* Teacher Routes */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/posts"
              element={
                <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                  <TeacherPosts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/posts/new"
              element={
                <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                  <NewPost />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/lesson-plans"
              element={
                <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                  <LessonPlans />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/lesson-plans/new"
              element={
                <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                  <NewLessonPlan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/classes"
              element={
                <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                  <TeacherClasses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/feed"
              element={
                <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                  <TeacherFeed />
                </ProtectedRoute>
              }
            />

            {/* Parent Routes */}
            <Route
              path="/parent"
              element={
                <ProtectedRoute allowedRoles={["parent", "admin"]}>
                  <ParentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent/announcements"
              element={
                <ProtectedRoute allowedRoles={["parent", "admin"]}>
                  <ParentAnnouncements />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/teacher-verification"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminTeacherVerification />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/classes"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminClasses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/teacher-invitations"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminTeacherInvitations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminAuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/posts"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminPosts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/lesson-plans"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminLessonPlans />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;