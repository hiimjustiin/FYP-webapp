import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Home from "../pages/Home";

/**
 * Smart dashboard component that routes users to the appropriate dashboard
 * based on their role:
 * - Admin -> /admin
 * - Instructor -> /instructor/dashboard
 * - Student -> Home (project dashboard)
 */
const RoleDashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect admins to admin dashboard
  if (user.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  // Redirect instructors to instructor dashboard
  if (user.role === "instructor") {
    return <Navigate to="/instructor" replace />;
  }

  // Students see the default Home dashboard
  return <Home />;
};

export default RoleDashboard;
