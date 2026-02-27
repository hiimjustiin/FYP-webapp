import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { adminService, type AdminStats } from "../services/adminService";
import Button from "../components/ui/Button/Button";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isInitialized, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Wait for auth to be initialized before fetching data
    if (!isInitialized || !isAuthenticated) {
      return;
    }

    loadStats();
  }, [isInitialized, isAuthenticated]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load statistics"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-grey-05)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#181C62] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-grey-05)] flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800">{error}</p>
          <Button variant="red" onClick={loadStats} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-[var(--color-grey-05)]">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-3 mb-2">Admin Dashboard</h1>
          <p className="body text-[var(--color-grey-55)]">
            Welcome back, {user?.display_name || "Admin"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Users Card */}
          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="caption text-[var(--color-grey-55)]">Total Users</div>
              <div className="bg-[var(--color-blue-ntu)] bg-opacity-10 rounded-full p-2">
                <Users className="w-5 h-5 text-[var(--color-blue-ntu)]" strokeWidth={2.5} />
              </div>
            </div>
            <div className="heading-3 text-[var(--color-blue-ntu)] mb-3">{stats.users.total}</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="caption text-[var(--color-grey-55)]">Students</div>
                <div className="body-2 font-medium">{stats.users.byRole.student || 0}</div>
              </div>
              <div>
                <div className="caption text-[var(--color-grey-55)]">Instructors</div>
                <div className="body-2 font-medium">{stats.users.byRole.instructor || 0}</div>
              </div>
              <div>
                <div className="caption text-[var(--color-grey-55)]">Admins</div>
                <div className="body-2 font-medium">{stats.users.byRole.admin || 0}</div>
              </div>
            </div>
          </div>

          {/* Courses Card */}
          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="caption text-[var(--color-grey-55)]">Total Courses</div>
              <div className="bg-[var(--color-red-ntu)] bg-opacity-10 rounded-full p-2">
                <BookOpen className="w-5 h-5 text-[var(--color-red-ntu)]" strokeWidth={2.5} />
              </div>
            </div>
            <div className="heading-3 text-[var(--color-blue-ntu)]">{stats.courses}</div>
          </div>

          {/* Projects Card */}
          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="caption text-[var(--color-grey-55)]">Total Projects</div>
              <div className="bg-green-100 rounded-full p-2">
                <FileText className="w-5 h-5 text-green-600" strokeWidth={2.5} />
              </div>
            </div>
            <div className="heading-3 text-[var(--color-blue-ntu)]">{stats.projects}</div>
          </div>

          {/* Submissions Card */}
          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="caption text-[var(--color-grey-55)]">Submissions</div>
              <div className="bg-purple-100 rounded-full p-2">
                <ClipboardCheck className="w-5 h-5 text-purple-600" strokeWidth={2.5} />
              </div>
            </div>
            <div className="heading-3 text-[var(--color-blue-ntu)] mb-3">{stats.submissions.total}</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="caption text-[var(--color-grey-55)]">Pending</div>
                <div className="body-2 font-medium">{stats.submissions.byStatus.submitted || 0}</div>
              </div>
              <div>
                <div className="caption text-[var(--color-grey-55)]">Scored</div>
                <div className="body-2 font-medium">
                  {(stats.submissions.byStatus.scored || 0) +
                    (stats.submissions.byStatus.reviewed || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card p-6">
          <h2 className="heading-4 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="blue"
              onClick={() => navigate("/admin/users")}
              className="w-full justify-center"
            >
              <Users className="w-5 h-5 mr-2" strokeWidth={2.5} />
              Manage Users
            </Button>
            <Button
              variant="red"
              onClick={() => navigate("/admin/courses")}
              className="w-full justify-center"
            >
              <BookOpen className="w-5 h-5 mr-2" strokeWidth={2.5} />
              Manage Courses
            </Button>
            <Button
              variant="darkBlue"
              onClick={() => navigate("/admin/submissions")}
              className="w-full justify-center"
            >
              <ClipboardCheck className="w-5 h-5 mr-2" strokeWidth={2.5} />
              View Submissions
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
