import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SquarePen, FileText } from "lucide-react";
import {
  instructorService,
  type CourseSubmission,
} from "../services/instructorService";
import Button from "../components/ui/Button/Button";
import SearchBar from "../components/ui/SearchBar/SearchBar";

/** Star Rating for submission avg_score (1-3 scale) */
const SubmissionStarRating = ({ score }: { score: number | undefined }) => {
  if (score === undefined || score === null || score === 0) {
    return <span className="text-gray-400">--</span>;
  }

  const roundedScore = Math.round(score * 2) / 2;
  const fullStars = Math.floor(roundedScore);
  const hasHalfStar = roundedScore % 1 !== 0;
  const emptyStars = 3 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div
      className="flex items-center gap-0.5"
      title={`${Number(score).toFixed(1)}/3.0`}
    >
      {Array.from({ length: fullStars }).map((_, i) => (
        <svg key={`full-${i}`} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {hasHalfStar && (
        <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="instructor-half-star">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
          <path fill="url(#instructor-half-star)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-xs text-gray-500">({Number(score).toFixed(1)})</span>
    </div>
  );
};

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
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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
    setPage(1);
  }, [searchTerm, filterStatus, submissions]);

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      submitted: "bg-blue-100 text-blue-800",
      scoring: "bg-yellow-100 text-yellow-800",
      scored: "bg-purple-100 text-purple-800",
      reviewed: "bg-green-100 text-green-800",
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
            <FileText className="w-16 h-16 mx-auto text-[var(--color-grey-35)] mb-4" strokeWidth={1.5} />
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
                      Score
                    </th>
                    <th className="px-6 py-4 text-center body-2 font-semibold text-[var(--color-grey-55)]">
                      View
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions
                    .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
                    .map((submission) => (
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
                        <SubmissionStarRating score={parseFloat(String(submission.avg_score))} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          variant="blue"
                          onClick={() =>
                            navigate(`/instructor/submissions/${submission.id}`)
                          }
                          className="p-2"
                          aria-label="View submission"
                          title="Review submission"
                        >
                          <SquarePen className="w-4 h-4" strokeWidth={2.5} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE) > 1 && (
              <div className="flex justify-center gap-2 mt-6 pb-4">
                <Button
                  variant="grey"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-gray-700">
                  Page {page} of {Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE)}
                </span>
                <Button
                  variant="grey"
                  onClick={() => setPage((p) => Math.min(Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE), p + 1))}
                  disabled={page === Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorSubmissions;
