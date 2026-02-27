import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  instructorService,
  type InstructorCourse,
  type RecentActivity,
} from "../services/instructorService";
import Button from "../components/ui/Button/Button";
import {
  Eye,
  BookOpen,
  Users,
  FileText,
  ClipboardCheck,
  Settings,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const InstructorDashboard = () => {
  const { user, isInitialized, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [recentPage, setRecentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to be initialized before fetching data
    if (!isInitialized || !isAuthenticated) {
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const [coursesData, activityData] = await Promise.all([
          instructorService.getCourses(),
          instructorService.getRecentActivity(12),
        ]);
        setCourses(coursesData);
        setRecentActivity(activityData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isInitialized, isAuthenticated]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="subtitle-2 text-[var(--color-grey-55)]">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="subtitle-2 text-red-500">{error}</div>
      </div>
    );
  }

  // Calculate insights
  const totalStudents = courses.reduce(
    (sum, course) => sum + course.enrolled_count,
    0
  );
  const totalNewSubmissions = courses.reduce(
    (sum, course) => sum + course.pending_count,
    0
  );
  const coursesByPending = [...courses]
    .filter((c) => c.pending_count > 0)
    .sort((a, b) => b.pending_count - a.pending_count);
  const coursesWithNoSubmissions = courses.filter(
    (c) => c.submission_count === 0 && c.enrolled_count > 0
  );

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const badges = {
      submitted: "bg-blue-100 text-blue-800",
      scoring: "bg-yellow-100 text-yellow-800",
      scored: "bg-purple-100 text-purple-800",
      reviewed: "bg-green-100 text-green-800",
    };
    return badges[status as keyof typeof badges] || badges.submitted;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const recentPageSize = 5;
  const recentTotalPages = Math.max(
    1,
    Math.ceil(recentActivity.length / recentPageSize)
  );
  const recentStartIndex = (recentPage - 1) * recentPageSize;
  const recentPageItems = recentActivity.slice(
    recentStartIndex,
    recentStartIndex + recentPageSize
  );
  const handleRecentPageChange = (nextPage: number) => {
    const safePage = Math.min(Math.max(nextPage, 1), recentTotalPages);
    setRecentPage(safePage);
  };

  return (
    <div className="min-h-screen bg-[var(--color-grey-05)]">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="heading-3 mb-2">Instructor Dashboard</h1>
            <p className="body text-[var(--color-grey-55)]">
              Welcome back, {user?.display_name || "Instructor"}
            </p>
          </div>
          <Button
            variant="blue"
            onClick={() => navigate("/instructor/courses")}
          >
            <BookOpen className="w-5 h-5 mr-2" strokeWidth={2.5} />
            Manage Courses
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="caption text-[var(--color-grey-55)]">
                Active Courses
              </div>
              <BookOpen className="w-5 h-5 text-[var(--color-blue-ntu)]" strokeWidth={2.5} />
            </div>
            <div className="heading-3 text-[var(--color-blue-ntu)]">
              {courses.length}
            </div>
          </div>
          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="caption text-[var(--color-grey-55)]">
                Total Students
              </div>
              <Users className="w-5 h-5 text-[var(--color-blue-ntu)]" strokeWidth={2.5} />
            </div>
            <div className="heading-3 text-[var(--color-blue-ntu)]">
              {totalStudents}
            </div>
          </div>
          <div
            className="dashboard-card p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/instructor/submissions")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="caption text-[var(--color-grey-55)]">
                Recent Submissions
              </div>
              <ClipboardCheck className="w-5 h-5 text-[var(--color-blue-ntu)]" strokeWidth={2.5} />
            </div>
            <div className="heading-3 text-[var(--color-blue-ntu)]">
              {totalNewSubmissions}
            </div>
            {totalNewSubmissions > 0 && (
              <div className="caption text-[var(--color-blue-ntu)] mt-1">
                View all →
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Courses Needing Attention */}
          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="subtitle-1">Courses With New Submissions</h2>
              <Button
                variant="grey"
                onClick={() => navigate("/instructor/courses")}
                className="p-2"
                aria-label="View all courses"
              >
                <Eye className="w-4 h-4" strokeWidth={2.5} />
              </Button>
            </div>

            {coursesByPending.length === 0 &&
            coursesWithNoSubmissions.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-[var(--color-grey-30)]" strokeWidth={1.5} />
                <p className="subtitle-2 text-[var(--color-grey-55)]">
                  All caught up!
                </p>
                <p className="caption text-[var(--color-grey-55)]">
                  No courses need immediate attention
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {coursesByPending.slice(0, 5).map((course) => (
                  <div
                    key={course.id}
                    className="p-4 bg-[var(--color-grey-05)] rounded-lg border border-[var(--color-grey-10)] hover:border-[var(--color-blue-ntu)] transition-colors cursor-pointer"
                    onClick={() =>
                      navigate(`/instructor/courses/${course.id}/submissions`)
                    }
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="subtitle-2 text-[var(--color-blue-ntu)]">
                          {course.code}
                        </span>
                        <p className="caption text-[var(--color-grey-55)]">
                          {course.title}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-[var(--color-red-ntu)] text-white text-xs font-medium rounded-full">
                        {course.pending_count} new
                      </span>
                    </div>
                    <div className="caption text-[var(--color-grey-55)]">
                      {course.enrolled_count} students ·{" "}
                      {course.submission_count} submissions
                    </div>
                  </div>
                ))}
                {coursesWithNoSubmissions.slice(0, 3).map((course) => (
                  <div
                    key={course.id}
                    className="p-4 bg-[#FFF3CD] rounded-lg border border-[#FFC107] cursor-pointer hover:border-[#FF9800] transition-colors"
                    onClick={() =>
                      navigate(`/instructor/courses/${course.id}/students`)
                    }
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="subtitle-2 text-[#856404]">
                          {course.code}
                        </span>
                        <p className="caption text-[#856404]">{course.title}</p>
                      </div>
                      <span className="px-3 py-1 bg-[#FF9800] text-white text-xs font-medium rounded-full">
                        No submissions
                      </span>
                    </div>
                    <div className="caption text-[#856404]">
                      {course.enrolled_count} enrolled students
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="subtitle-1">Recent Submissions</h2>
              <Button
                variant="grey"
                onClick={() => navigate("/instructor/submissions")}
                className="p-2"
                aria-label="View all submissions"
              >
                <Eye className="w-4 h-4" strokeWidth={2.5} />
              </Button>
            </div>

            {recentActivity.length === 0 ? (
              <div className="py-8 text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 text-[var(--color-grey-30)]" strokeWidth={1.5} />
                <p className="subtitle-2 text-[var(--color-grey-55)] mb-1">
                  No submissions yet
                </p>
                <p className="caption text-[var(--color-grey-55)]">
                  Activity will appear here once students submit
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPageItems.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-3 bg-[var(--color-grey-05)] rounded-lg border border-[var(--color-grey-10)] hover:border-[var(--color-blue-ntu)] transition-colors cursor-pointer"
                    onClick={() =>
                      navigate(`/instructor/submissions/${activity.id}`)
                    }
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="subtitle-2 text-[var(--color-grey-90)] truncate">
                          {activity.student_name}
                        </p>
                        <p className="caption text-[var(--color-grey-55)] truncate">
                          {activity.project_title}
                        </p>
                      </div>
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-medium rounded ${getStatusBadge(
                          activity.status
                        )}`}
                      >
                        {activity.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="caption text-[var(--color-grey-55)]">
                        {activity.course_code}
                      </span>
                      <span className="caption text-[var(--color-grey-55)]">
                        {formatTimeAgo(activity.submitted_at)}
                      </span>
                    </div>
                  </div>
                ))}
                {recentTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="grey"
                      onClick={() => handleRecentPageChange(recentPage - 1)}
                      disabled={recentPage === 1}
                      className="text-xs px-3 py-2"
                    >
                      &lt;
                    </Button>
                    <span className="caption text-[var(--color-grey-55)]">
                      Page {recentPage} of {recentTotalPages}
                    </span>
                    <Button
                      variant="grey"
                      onClick={() => handleRecentPageChange(recentPage + 1)}
                      disabled={recentPage === recentTotalPages}
                      className="text-xs px-3 py-2"
                    >
                      &gt;
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 dashboard-card p-6">
          <h2 className="heading-4 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              variant="blue"
              onClick={() => navigate("/instructor/submissions")}
              className="w-full justify-center"
            >
              <ClipboardCheck className="w-5 h-5 mr-2" strokeWidth={2.5} />
              Review Submissions
            </Button>
            <Button
              variant="darkBlue"
              onClick={() => navigate("/instructor/students")}
              className="w-full justify-center"
            >
              <Users className="w-5 h-5 mr-2" strokeWidth={2.5} />
              Manage Students
            </Button>
            <Button
              variant="purple"
              onClick={() => navigate("/instructor/courses")}
              className="w-full justify-center"
            >
              <BookOpen className="w-5 h-5 mr-2" strokeWidth={2.5} />
              Course Settings
            </Button>
            <Button
              variant="grey"
              onClick={() => navigate("/settings")}
              className="w-full justify-center"
            >
              <Settings className="w-5 h-5 mr-2" strokeWidth={2.5} />
              Profile Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
