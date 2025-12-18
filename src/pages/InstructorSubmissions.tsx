import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  instructorService,
  type CourseSubmission,
} from "../services/instructorService";
import Button from "../components/ui/Button/Button";
import SearchBar from "../components/ui/SearchBar/SearchBar";

const InstructorSubmissions = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<CourseSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<
    CourseSubmission[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchAllSubmissions();
  }, []);

  const fetchAllSubmissions = async () => {
    try {
      setLoading(true);
      const courses = await instructorService.getCourses();
      let allSubmissions: CourseSubmission[] = [];

      for (const course of courses) {
        const courseSubmissions = await instructorService.getCourseSubmissions(
          course.id
        );
        allSubmissions = [...allSubmissions, ...courseSubmissions];
      }

      setSubmissions(allSubmissions);
      setFilteredSubmissions(allSubmissions);
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = submissions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (sub) =>
          sub.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((sub) => sub.status === filterStatus);
    }

    setFilteredSubmissions(filtered);
  }, [searchTerm, filterStatus, submissions]);

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      submitted: "bg-blue-100 text-blue-800",
      scoring: "bg-yellow-100 text-yellow-800",
      scored: "bg-green-100 text-green-800",
      reviewed: "bg-purple-100 text-purple-800",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          statusColors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#181C62]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-grey-05)] p-6 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="heading-3 mb-2">All Submissions</h1>
          <p className="body text-[var(--color-grey-55)]">
            View and manage submissions from all your courses
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="dashboard-card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchBar
              placeholder="Search by student, email, project, or submission name..."
              onSearch={setSearchTerm}
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-[var(--color-grey-15)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-ntu)]"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="scoring">Scoring</option>
              <option value="scored">Scored</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="body-2 text-[var(--color-grey-55)]">
            Showing {filteredSubmissions.length} of {submissions.length}{" "}
            submissions
          </p>
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <div className="dashboard-card p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto text-[var(--color-grey-35)] mb-4"
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
            <p className="subtitle-2 text-[var(--color-grey-55)]">
              No submissions found
            </p>
          </div>
        ) : (
          <div className="dashboard-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-grey-15)] bg-[var(--color-grey-05)]">
                    <th className="px-6 py-4 text-left body-2 font-semibold text-[var(--color-grey-55)]">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left body-2 font-semibold text-[var(--color-grey-55)]">
                      Project
                    </th>
                    <th className="px-6 py-4 text-left body-2 font-semibold text-[var(--color-grey-55)]">
                      Submission
                    </th>
                    <th className="px-6 py-4 text-left body-2 font-semibold text-[var(--color-grey-55)]">
                      Submitted
                    </th>
                    <th className="px-6 py-4 text-left body-2 font-semibold text-[var(--color-grey-55)]">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left body-2 font-semibold text-[var(--color-grey-55)]">
                      Instructor Feedback
                    </th>
                    <th className="px-6 py-4 text-center body-2 font-semibold text-[var(--color-grey-55)]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((submission) => (
                    <tr
                      key={submission.id}
                      className="border-b border-[var(--color-grey-15)] hover:bg-[var(--color-grey-05)]"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="body-2 font-medium">
                            {submission.student_name}
                          </p>
                          <p className="caption text-[var(--color-grey-55)]">
                            {submission.student_email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="body-2">{submission.project_title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="body-2">{submission.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="body-2">
                          {new Date(
                            submission.submitted_at
                          ).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(submission.status)}
                      </td>
                      <td className="px-6 py-4">
                        {getFeedbackBadge(submission.has_instructor_feedback)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          variant="blue"
                          onClick={() =>
                            navigate(`/instructor/submissions/${submission.id}`)
                          }
                          className="text-sm"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorSubmissions;
