import { useState, useEffect } from "react";
import { BarChart3, Eye, Trash2 } from "lucide-react";
import {
  adminService,
  type AdminSubmission,
  type AdminCourse,
} from "../services/adminService";
import Button from "../components/ui/Button/Button";
import Dropdown from "../components/ui/Dropdown/Dropdown";
import Table from "../components/ui/Table/Table";
import SearchBar from "../components/ui/SearchBar/SearchBar";
import { AlertDialog } from "../components/ui/AlertDialog/AlertDialog";

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<AdminSubmission | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSubmissions();
    setPage(1);
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
    setPage(1);
  };

  const handleDeleteClick = (submission: AdminSubmission) => {
    setSelectedSubmission(submission);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSubmission) return;

    try {
      setDeleting(true);
      setError("");

      // Call API to delete
      await adminService.deleteSubmission(selectedSubmission.id);

      // Remove from UI state
      setSubmissions((prev) =>
        prev.filter((sub) => sub.id !== selectedSubmission.id)
      );

      // Close dialog and clear selection
      setDeleteDialogOpen(false);
      setSelectedSubmission(null);
    } catch (err) {
      console.error("Failed to delete submission:", err);
      // Show error in dialog, don't close it
      setError(
        err instanceof Error ? err.message : "Failed to delete submission"
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSelectedSubmission(null);
  };

  const filteredSubmissions = submissions.filter(
    (sub) =>
      !searchTerm ||
      sub.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.course_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE));
  const pagedSubmissions = filteredSubmissions.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
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
    <div className="min-h-screen bg-[var(--color-grey-05)]">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="heading-3 mb-2">Platform Submissions</h1>
          <p className="body text-[var(--color-grey-55)]">
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
            <>
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
                ...pagedSubmissions.map((sub) => [
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
                  <span
                    key={`score-${sub.id}`}
                    className="inline-flex items-center gap-1 text-[var(--color-blue-ntu)] font-medium"
                  >
                    <BarChart3 className="w-4 h-4" strokeWidth={2.5} />
                    {sub.scores_count}
                  </span>,
                  new Date(sub.submitted_at).toLocaleDateString(),
                  <div className="flex gap-2" key={`actions-${sub.id}`}>
                    <Button
                      variant="blue"
                      onClick={() => window.open(sub.file_url, "_blank")}
                      className="p-1.5"
                      title="View file"
                    >
                      <Eye className="w-4 h-4" strokeWidth={2.5} />
                    </Button>
                    <Button
                      variant="red"
                      onClick={() => handleDeleteClick(sub)}
                      className="p-1.5"
                      title="Delete submission"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                    </Button>
                  </div>,
                ]),
              ]}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="grey"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="grey"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
            </>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {deleteDialogOpen && selectedSubmission && (
          <AlertDialog
            isOpen={deleteDialogOpen}
            type={error ? "error" : "warning"}
            title={error ? "Deletion Failed" : "Delete Submission"}
            message={
              error
                ? `${error}\n\nPlease try again.`
                : `Are you sure you want to delete the submission from ${selectedSubmission.student_name} for ${selectedSubmission.project_title}? This action cannot be undone.`
            }
            primaryButtonText={
              error ? "Try Again" : deleting ? "Deleting..." : "Delete"
            }
            secondaryButtonText="Cancel"
            onPrimaryAction={handleConfirmDelete}
            onSecondaryAction={handleCancelDelete}
            closeOnOverlayClick={false}
          />
        )}
      </div>
    </div>
  );
}
