import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  instructorService,
  type CourseSubmission,
} from "../services/instructorService";
import Button from "../components/ui/Button/Button";
import Table from "../components/ui/Table/Table";
import SearchBar from "../components/ui/SearchBar/SearchBar";

const CourseSubmissions = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<CourseSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<
    CourseSubmission[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSubmissions = React.useCallback(async () => {
    if (!courseId) return;

    try {
      const data = await instructorService.getCourseSubmissions(courseId);
      setSubmissions(data);
      setFilteredSubmissions(data);
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSubmissions(submissions);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = submissions.filter(
      (sub) =>
        sub.student_name.toLowerCase().includes(query) ||
        sub.project_title.toLowerCase().includes(query) ||
        sub.status.toLowerCase().includes(query)
    );
    setFilteredSubmissions(filtered);
  }, [searchQuery, submissions]);

  const getStatusBadge = () => {
    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
        Submitted
      </span>
    );
  };

  const getFeedbackBadge = (hasFeedback: boolean) => {
    if (hasFeedback) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-[#181C62]/10 text-[#181C62]">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Reviewed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Pending
      </span>
    );
  };

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

  return (
    <div className="min-h-screen bg-[var(--color-grey-05)]">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="grey"
            onClick={() => navigate("/instructor", { replace: false })}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="heading-3 mb-2">Course Submissions</h1>
          <p className="body text-[var(--color-grey-55)]">
            {submissions.length}{" "}
            {submissions.length === 1 ? "submission" : "submissions"}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="dashboard-card p-6">
            <div className="caption text-[var(--color-grey-55)] mb-2">
              Total Submissions
            </div>
            <div className="heading-3 text-[var(--color-blue-ntu)]">
              {submissions.length}
            </div>
          </div>
          <div className="dashboard-card p-6">
            <div className="caption text-[var(--color-grey-55)] mb-2">
              Pending Instructor Review
            </div>
            <div className="heading-3 text-orange-600">
              {submissions.filter((s) => !s.has_instructor_feedback).length}
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="dashboard-card p-6">
          <div className="mb-4">
            <SearchBar
              onSearch={setSearchQuery}
              placeholder="Search by student name, project, or status..."
            />
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="subtitle-2 text-[var(--color-grey-55)] mb-2">
                {searchQuery ? "No submissions found" : "No submissions yet"}
              </p>
              <p className="caption text-[var(--color-grey-55)]">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Submissions will appear here once students upload their work"}
              </p>
            </div>
          ) : (
            <Table
              noBorder
              data={[
                [
                  "Student",
                  "Project",
                  "File",
                  "Submitted",
                  "Status",
                  "Instructor Feedback",
                  "Actions",
                ],
                ...filteredSubmissions.map((row: CourseSubmission) => [
                  <span className="subtitle-2">{row.student_name}</span>,
                  <button
                    className="body-2 text-[var(--color-blue-ntu)] hover:underline text-left"
                    onClick={() =>
                      navigate(`/instructor/submissions/${row.id}`)
                    }
                  >
                    {row.project_title}
                  </button>,
                  <span className="caption text-[var(--color-grey-55)]">
                    {row.file_type?.toUpperCase() || "N/A"}
                  </span>,
                  <span className="caption text-[var(--color-grey-55)]">
                    {new Date(row.submitted_at).toLocaleDateString()}
                  </span>,
                  getStatusBadge(),
                  getFeedbackBadge(row.has_instructor_feedback),
                  <div className="flex gap-2">
                    <Button
                      variant="blue"
                      onClick={() =>
                        navigate(`/instructor/submissions/${row.id}`)
                      }
                    >
                      View Details
                    </Button>
                  </div>,
                ]),
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseSubmissions;
