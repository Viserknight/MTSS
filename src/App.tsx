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
import ReportCards from "./pages/teacher/ReportCards";
import TeacherAttendance from "./pages/teacher/Attendance";
import TeacherMessages from "./pages/teacher/Messages";

// Parent pages
import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentAnnouncements from "./pages/parent/ParentAnnouncements";
import ParentFeed from "./pages/parent/ParentFeed";
import ParentReportCards from "./pages/parent/ParentReportCards";
import ParentTimetable from "./pages/parent/ParentTimetable";
import ParentAttendance from "./pages/parent/ParentAttendance";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminChildren from "./pages/admin/AdminChildren";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminLessonPlans from "./pages/admin/AdminLessonPlans";
import AdminTeacherVerification from "./pages/admin/AdminTeacherVerification";
import AdminTeacherInvitations from "./pages/admin/AdminTeacherInvitations";
import AdminClasses from "./pages/admin/AdminClasses";
import AdminTimetables from "./pages/admin/AdminTimetables";
import AdminAttendance from "./pages/admin/AdminAttendance";

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
            <Route
              path="/teacher/report-cards"
              element={
                <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                  <ReportCards />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/attendance"
              element={
                <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                  <TeacherAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/messages"
              element={
                <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                  <TeacherMessages />
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
              path="/parent/feed"
              element={
                <ProtectedRoute allowedRoles={["parent", "admin"]}>
                  <ParentFeed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent/timetable"
              element={
                <ProtectedRoute allowedRoles={["parent", "admin"]}>
                  <ParentTimetable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent/attendance"
              element={
                <ProtectedRoute allowedRoles={["parent", "admin"]}>
                  <ParentAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent/report-cards"
              element={
                <ProtectedRoute allowedRoles={["parent", "admin"]}>
                  <ParentReportCards />
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
              path="/admin/children"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminChildren />
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
              path="/admin/timetables"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminTimetables />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/attendance"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminAttendance />
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