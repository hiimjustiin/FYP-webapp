import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./assets/fonts/typography.css";
import "./assets/colors/colors.css";
import "./assets/colors/gradients.css";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import RoleDashboard from "./components/RoleDashboard";
import ProjectLanding from "./pages/Project/ProjectLanding.js";
import ProjectNew from "./pages/Project/ProjectNew.js";
import ProjectEdit from "./pages/Project/ProjectEdit.js";
import ProjectDetail from "./pages/Project/ProjectDetail.js";
import ProjectReport from "./pages/Report/ProjectReport";
import Team from "./pages/Team.js";
import TeamManage from "./pages/TeamManage.js";
import Report from "./pages/Report.js";
import Settings from "./pages/Settings.js";
import Courses from "./pages/Courses.js";
import LoginPage from "./pages/LoginPage.js";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import InstructorDashboard from "./pages/InstructorDashboard";
import InstructorCourses from "./pages/InstructorCourses";
import InstructorStudents from "./pages/InstructorStudents";
import InstructorSubmissions from "./pages/InstructorSubmissions";
import CourseStudents from "./pages/CourseStudents";
import CourseSubmissions from "./pages/CourseSubmissions";
import SubmissionDetail from "./pages/SubmissionDetail";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminCourses from "./pages/AdminCourses";
import AdminSubmissions from "./pages/AdminSubmissions";
import AdminProjects from "./pages/AdminProjects";

// Main app content with authentication logic
const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
        }
      />
      <Route
        path="/verify-email"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <VerifyEmailPage />
        }
      />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

      {/* Instructor routes */}
      <Route
        path="/instructor"
        element={
          <ProtectedRoute requiredRole="instructor">
            <DashboardLayout key="instructor-dashboard">
              <InstructorDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/courses"
        element={
          <ProtectedRoute requiredRole="instructor">
            <DashboardLayout key="instructor-courses">
              <InstructorCourses />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/students"
        element={
          <ProtectedRoute requiredRole="instructor">
            <DashboardLayout key="all-students">
              <InstructorStudents />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/submissions"
        element={
          <ProtectedRoute requiredRole="instructor">
            <DashboardLayout key="all-submissions">
              <InstructorSubmissions />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/courses/:courseId/students"
        element={
          <ProtectedRoute requiredRole="instructor">
            <DashboardLayout key="instructor-students">
              <CourseStudents />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/courses/:courseId/submissions"
        element={
          <ProtectedRoute requiredRole="instructor">
            <DashboardLayout key="instructor-submissions">
              <CourseSubmissions />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/submissions/:submissionId"
        element={
          <ProtectedRoute requiredRole="instructor">
            <DashboardLayout key="submission-detail">
              <SubmissionDetail />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <DashboardLayout key="admin-dashboard">
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredRole="admin">
            <DashboardLayout key="admin-users">
              <AdminUsers />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/courses"
        element={
          <ProtectedRoute requiredRole="admin">
            <DashboardLayout key="admin-courses">
              <AdminCourses />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/submissions"
        element={
          <ProtectedRoute requiredRole="admin">
            <DashboardLayout key="admin-submissions">
              <AdminSubmissions />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/projects"
        element={
          <ProtectedRoute requiredRole="admin">
            <DashboardLayout key="admin-projects">
              <AdminProjects />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/submissions/:submissionId"
        element={
          <ProtectedRoute requiredRole="admin">
            <DashboardLayout key="admin-submission-detail">
              <SubmissionDetail />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      {/* Protected dashboard routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout key="home">
              <RoleDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/project"
        element={
          <ProtectedRoute>
            <DashboardLayout key="project-landing">
              <ProjectLanding />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/new"
        element={
          <ProtectedRoute>
            <DashboardLayout key="project-new">
              <ProjectNew />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:projectId/edit"
        element={
          <ProtectedRoute>
            <DashboardLayout key="project-edit">
              <ProjectEdit />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId"
        element={
          <ProtectedRoute>
            <DashboardLayout key="project-view">
              <ProjectDetail />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/team"
        element={
          <ProtectedRoute>
            <DashboardLayout key="team">
              <Team />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/team/:projectId/manage"
        element={
          <ProtectedRoute>
            <DashboardLayout key="team-manage">
              <TeamManage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/report"
        element={
          <ProtectedRoute>
            <DashboardLayout key="report">
              <Report />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/report/:projectId"
        element={
          <ProtectedRoute>
            <DashboardLayout key="project-report">
              <ProjectReport />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses"
        element={
          <ProtectedRoute>
            <DashboardLayout key="courses">
              <Courses />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <DashboardLayout key="settings">
              <Settings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch all route - redirect to login if not authenticated, otherwise to home */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
