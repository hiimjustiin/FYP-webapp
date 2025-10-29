import { useState, useEffect } from "react";
import {
  adminService,
  type AdminSubmission,
  type AdminCourse,
} from "../services/adminService";
import Button from "../components/ui/Button/Button";
import Dropdown from "../components/ui/Dropdown/Dropdown";
import Table from "../components/ui/Table/Table";
import SearchBar from "../components/ui/SearchBar/SearchBar";

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, courseFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [submissionsData, coursesData] = await Promise.all([
        adminService.getSubmissions(),
        adminService.getCourses(),
      ]);
      setSubmissions(submissionsData);
      setCourses(coursesData);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load submissions"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminService.getSubmissions({
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(courseFilter !== "all" && { courseId: courseFilter }),
      });
      setSubmissions(data);
    } catch (err) {
      console.error("Failed to load submissions:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load submissions"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const filteredSubmissions = submissions.filter(
    (sub) =>
      !searchTerm ||
      sub.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.course_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      submitted: "bg-blue-100 text-blue-800",
      scoring: "bg-yellow-100 text-yellow-800",
      scored: "bg-purple-100 text-purple-800",
      reviewed: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const statusOptions = [
    { id: "all", label: "All Statuses" },
    { id: "submitted", label: "Submitted" },
    { id: "scoring", label: "Scoring" },
    { id: "scored", label: "Scored" },
    { id: "reviewed", label: "Reviewed" },
  ];

  const courseOptions = [
    { id: "all", label: "All Courses" },
    ...courses.map((course) => ({
      id: course.id,
      label: `${course.code} - ${course.title}`,
    })),
  ];

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Platform Submissions
          </h1>
          <p className="mt-2 text-gray-600">
            View and manage all submissions across all courses
          </p>
        </div>

        {/* Filters */}
        <div className="dashboard-card p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <SearchBar
                placeholder="Search student, project, or course..."
                onSearch={handleSearch}
              />
            </div>
            <div>
              <Dropdown
                options={statusOptions}
                selectedOption={
                  statusOptions.find((opt) => opt.id === statusFilter) || null
                }
                onSelect={(option) => setStatusFilter(option.id)}
              />
            </div>
            <div>
              <Dropdown
                options={courseOptions}
                selectedOption={
                  courseOptions.find((opt) => opt.id === courseFilter) || null
                }
                onSelect={(option) => setCourseFilter(option.id)}
              />
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total",
              count: submissions.length,
              color: "bg-[#181C62]",
            },
            {
              label: "Submitted",
              count: submissions.filter((s) => s.status === "submitted").length,
              color: "bg-blue-500",
            },
            {
              label: "Scored",
              count: submissions.filter((s) => s.status === "scored").length,
              color: "bg-purple-500",
            },
            {
              label: "Reviewed",
              count: submissions.filter((s) => s.status === "reviewed").length,
              color: "bg-green-500",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${stat.color} text-white rounded-lg p-4`}
            >
              <p className="text-sm opacity-90">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.count}</p>
            </div>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Submissions Table */}
        <div className="dashboard-card p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#181C62] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading submissions...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm
                ? "No submissions match your search"
                : "No submissions found"}
            </div>
          ) : (
            <Table
              noBorder
              data={[
                [
                  "Student",
                  "Email",
                  "Project",
                  "Status",
                  "Scores",
                  "Submitted",
                  "Actions",
                ],
                ...filteredSubmissions.map((sub) => [
                  sub.student_name,
                  sub.student_email,
                  `${sub.course_code} - ${sub.project_title}`,
                  <span
                    key={`status-${sub.id}`}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                      sub.status
                    )}`}
                  >
                    {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                  </span>,
                  sub.scores_count,
                  new Date(sub.submitted_at).toLocaleDateString(),
                  <div className="flex gap-2" key={`actions-${sub.id}`}>
                    <Button
                      variant="blue"
                      onClick={() => window.open(sub.file_url, "_blank")}
                      className="text-xs"
                    >
                      View File
                    </Button>
                  </div>,
                ]),
              ]}
            />
          )}
        </div>
    </div>
  );
}
