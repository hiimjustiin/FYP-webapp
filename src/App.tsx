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
import Home from "./pages/Home.js";
import ProjectLanding from "./pages/Project/ProjectLanding.js";
import ProjectNew from "./pages/Project/ProjectNew.js";
import ProjectEdit from "./pages/Project/ProjectEdit.js";
import Team from "./pages/Team.js";
import Report from "./pages/Report.js";
import Settings from "./pages/Settings.js";
import LoginPage from "./pages/LoginPage.js";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import InstructorDashboard from "./pages/InstructorDashboard";
import CourseStudents from "./pages/CourseStudents";
import CourseSubmissions from "./pages/CourseSubmissions";

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

      {/* Instructor routes */}
      <Route
        path="/instructor"
        element={
          <ProtectedRoute requiredRole="instructor">
            <DashboardLayout>
              <InstructorDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/courses/:courseId/students"
        element={
          <ProtectedRoute requiredRole="instructor">
            <DashboardLayout>
              <CourseStudents />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/courses/:courseId/submissions"
        element={
          <ProtectedRoute requiredRole="instructor">
            <DashboardLayout>
              <CourseSubmissions />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Protected dashboard routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Home />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/project"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ProjectLanding />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/new"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ProjectNew />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:projectId/edit"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ProjectEdit />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Home />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/team"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Team />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/report"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Report />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <DashboardLayout>
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
