import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminService, type AdminStats } from "../services/adminService";
import Button from "../components/ui/Button/Button";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadStats();
  }, []);

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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#181C62] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <Button variant="red" onClick={loadStats} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Platform-wide management and statistics
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Users Card */}
          <div className="dashboard-card bg-gradient-to-br from-[#181C62] to-[#2a2f7a] text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Users</p>
                <p className="text-3xl font-bold mt-1">{stats.users.total}</p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <svg
                  className="w-6 h-6"
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
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="opacity-75">Students</p>
                  <p className="font-semibold">
                    {stats.users.byRole.student || 0}
                  </p>
                </div>
                <div>
                  <p className="opacity-75">Instructors</p>
                  <p className="font-semibold">
                    {stats.users.byRole.instructor || 0}
                  </p>
                </div>
                <div>
                  <p className="opacity-75">Admins</p>
                  <p className="font-semibold">
                    {stats.users.byRole.admin || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Courses Card */}
          <div className="dashboard-card bg-gradient-to-br from-[#D71440] to-[#e63a5e] text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Courses</p>
                <p className="text-3xl font-bold mt-1">{stats.courses}</p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <svg
                  className="w-6 h-6"
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
            <div className="mt-4">
              <Button
                variant="white"
                onClick={() => navigate("/admin/courses")}
                className="w-full text-sm"
              >
                Manage Courses
              </Button>
            </div>
          </div>

          {/* Projects Card */}
          <div className="dashboard-card bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Projects</p>
                <p className="text-3xl font-bold mt-1">{stats.projects}</p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <svg
                  className="w-6 h-6"
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
          </div>

          {/* Submissions Card */}
          <div className="dashboard-card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Submissions</p>
                <p className="text-3xl font-bold mt-1">
                  {stats.submissions.total}
                </p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <svg
                  className="w-6 h-6"
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
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="opacity-75">Pending</p>
                  <p className="font-semibold">
                    {stats.submissions.byStatus.submitted || 0}
                  </p>
                </div>
                <div>
                  <p className="opacity-75">Scored</p>
                  <p className="font-semibold">
                    {(stats.submissions.byStatus.scored || 0) +
                      (stats.submissions.byStatus.reviewed || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="blue"
              onClick={() => navigate("/admin/users")}
              className="w-full"
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
              className="w-full"
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
              className="w-full"
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
              View All Submissions
            </Button>
          </div>
        </div>
    </div>
  );
}
