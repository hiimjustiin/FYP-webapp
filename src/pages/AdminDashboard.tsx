import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
                <svg
                  className="w-5 h-5 text-[var(--color-blue-ntu)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
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
                <svg
                  className="w-5 h-5 text-[var(--color-red-ntu)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>
            <div className="heading-3 text-[var(--color-blue-ntu)]">{stats.courses}</div>
          </div>

          {/* Projects Card */}
          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="caption text-[var(--color-grey-55)]">Total Projects</div>
              <div className="bg-green-100 rounded-full p-2">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <div className="heading-3 text-[var(--color-blue-ntu)]">{stats.projects}</div>
          </div>

          {/* Submissions Card */}
          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="caption text-[var(--color-grey-55)]">Submissions</div>
              <div className="bg-purple-100 rounded-full p-2">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
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
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Manage Users
            </Button>
            <Button
              variant="red"
              onClick={() => navigate("/admin/courses")}
              className="w-full justify-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Manage Courses
            </Button>
            <Button
              variant="darkBlue"
              onClick={() => navigate("/admin/submissions")}
              className="w-full justify-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              View Submissions
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
