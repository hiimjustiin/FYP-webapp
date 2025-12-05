import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button/Button";
import SearchBar, {
  type Member,
} from "../../components/ui/SearchBar/SearchBar";
import Table, { type TableData } from "../../components/ui/Table/Table";
import MemberGroup from "../../components/ui/MemberIcon/MemberGroup";
import { projectService, type Project } from "../../services/projectService";

/** ------------------------------- Helpers ------------------------------- */
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-UK", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/** Star Rating Component for InterQ Scores (1-3 stars) */
const StarRating = ({ score }: { score: number | undefined }) => {
  if (score === undefined || score === null) {
    return <span className="text-gray-400">—</span>;
  }

  // Round to nearest 0.5 for half-star support
  const roundedScore = Math.round(score * 2) / 2;
  const fullStars = Math.floor(roundedScore);
  const hasHalfStar = roundedScore % 1 !== 0;
  const emptyStars = 3 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div
      className="flex items-center gap-0.5"
      title={`${score.toFixed(1)}/3.0`}
    >
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <svg
          key={`full-${i}`}
          className="w-4 h-4 text-yellow-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {/* Half star */}
      {hasHalfStar && (
        <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
          <path
            fill="url(#half)"
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          />
        </svg>
      )}
      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <svg
          key={`empty-${i}`}
          className="w-4 h-4 text-gray-300"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-xs text-gray-500">({score.toFixed(1)})</span>
    </div>
  );
};

/** Loading Spinner Component */
const LoadingSpinner = () => (
  <div className="flex items-center gap-2">
    <svg
      className="animate-spin h-4 w-4 text-blue-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    <span className="text-sm text-blue-600">Evaluating...</span>
  </div>
);

/** Status Badge Component */
const StatusBadge = ({ status, error }: { status: string; error?: string }) => {
  if (status === "Processing") {
    return <LoadingSpinner />;
  }

  if (status === "Failed") {
    return (
      <div
        className="flex items-center gap-1"
        title={error || "AI evaluation failed"}
      >
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
          ❌ Failed
        </span>
      </div>
    );
  }

  if (status === "Completed") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
        ✓ Completed
      </span>
    );
  }

  // Fallback for any other status
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
      {status}
    </span>
  );
};

/** ------------------------------ Component ------------------------------ */
const ProjectLanding = () => {
  const navigate = useNavigate();

  // State
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if any projects are still processing
  const hasProcessingProjects = useMemo(
    () => projects.some((p) => p.status === "Processing"),
    [projects]
  );

  // Fetch projects function (reusable for polling)
  const loadProjects = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects:", err);
      setError("Failed to load projects. Please try again.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Auto-poll when there are processing projects
  useEffect(() => {
    if (!hasProcessingProjects) return;

    const pollInterval = setInterval(() => {
      console.log("[ProjectLanding] Polling for updates...");
      loadProjects(false); // Don't show loading spinner during poll
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [hasProcessingProjects, loadProjects]);

  // Convert projects to searchable members (all unique members across projects)
  const allMembers = useMemo(() => {
    const membersMap = new Map<string, Member>();

    projects.forEach((project) => {
      project.members.forEach((member) => {
        if (!membersMap.has(member.user_id)) {
          const names = (member.display_name || member.email).split(" ");
          const initials =
            names.length > 1
              ? names[0][0] + names[names.length - 1][0]
              : names[0].substring(0, 2);

          membersMap.set(member.user_id, {
            id: member.user_id,
            name: member.display_name || member.email,
            initials: initials.toUpperCase(),
            backgroundColor: "auto",
          });
        }
      });
    });

    return Array.from(membersMap.values());
  }, [projects]);

  // Simple filter: match against course, name, member names, status
  const filteredProjects = useMemo(() => {
    if (!query.trim()) return projects;
    const q = query.toLowerCase();
    return projects.filter((p) => {
      if (p.course_code?.toLowerCase().includes(q)) return true;
      if (p.title.toLowerCase().includes(q)) return true;
      if (p.status.toLowerCase().includes(q)) return true;
      if (p.members.some((m) => m.display_name?.toLowerCase().includes(q)))
        return true;
      if (p.members.some((m) => m.email.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [query, projects]);

  // Build TableData from projects
  const tableData: TableData = useMemo(() => {
    const header: TableData[number] = [
      "Course",
      "Project Name",
      "Date",
      "Member",
      "InterQ Scores",
      "Status",
      "Action",
    ];

    const rows: TableData[number][] = filteredProjects.map((p) => {
      // Convert project members to Member format
      const projectMembers: Member[] = p.members.map((m) => {
        const names = (m.display_name || m.email).split(" ");
        const initials =
          names.length > 1
            ? names[0][0] + names[names.length - 1][0]
            : names[0].substring(0, 2);

        return {
          id: m.user_id,
          name: m.display_name || m.email,
          initials: initials.toUpperCase(),
          backgroundColor: "auto",
        };
      });

      return [
        p.course_code || "—",
        p.title,
        p.submission_date
          ? formatDate(p.submission_date)
          : formatDate(p.created_at),
        <MemberGroup
          key={`mg-${p.id}`}
          members={projectMembers}
          size="small"
          maxVisible={6}
          layout="horizontal"
        />,
        // InterQ Scores - show stars for completed, spinner for processing
        p.status === "Processing" ? (
          <span key={`score-${p.id}`} className="text-gray-400 text-sm">
            Pending...
          </span>
        ) : p.status === "Failed" ? (
          <span key={`score-${p.id}`} className="text-red-500 text-sm">
            —
          </span>
        ) : (
          <StarRating key={`score-${p.id}`} score={p.interq_score} />
        ),
        // Status with badge
        <StatusBadge
          key={`status-${p.id}`}
          status={p.status}
          error={p.ai_processing_error}
        />,
        // Actions
        <div key={`act-${p.id}`} className="flex gap-2">
          <Button
            variant="blue"
            onClick={() => navigate(`/projects/${p.id}`)}
            disabled={p.status === "Processing"}
          >
            {p.status === "Processing" ? "Processing..." : "Open"}
          </Button>
          {p.status === "Failed" && (
            <Button
              variant="grey"
              onClick={() => {
                // TODO: Implement retry functionality
                alert("Retry functionality coming soon");
              }}
            >
              Retry
            </Button>
          )}
        </div>,
      ];
    });

    return [header, ...rows];
  }, [filteredProjects, navigate]);

  // SearchBar handlers
  const handleSearch = (q: string) => setQuery(q);
  const handleSelect = (member: Member) => setQuery(member.name);
  const handleShowAll = () => setQuery("");

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="subtitle-2 text-grey-80">Loading projects...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-3 sm:p-4 lg:p-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="subtitle-2 text-red-500 mb-3">{error}</p>
          <Button variant="blue" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 h-screen flex flex-col">
      <div className="w-full flex-1 min-h-0 flex flex-col">
        <div className="flex flex-col h-full gap-4">
          {/* Header row: greeting + new project */}
          <div className="flex flex-row justify-between items-center gap-4 flex-shrink-0">
            <div className="dashboard-card flex-7/12 px-4 py-2">
              <h5 className="heading-5">Hi, User!</h5>
              <p className="subtitle-2 text-grey-80">
                Let's begin a new project with ILA!
              </p>
            </div>

            {/* Add New Project card (clickable) */}
            <div
              className="dashboard-card basis-5/12 min-w-0 px-6 py-5 flex items-center justify-center cursor-pointer hover:scale-102 active:scale-98 transition-all"
              onClick={() => navigate("/project/new")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate("/project/new");
                }
              }}
            >
              <div className="flex items-center gap-2">
                <span className="subtitle-2 leading-none">＋</span>
                <span className="subtitle-2">Add New Project</span>
              </div>
            </div>
          </div>

          {/* Processing notification banner */}
          {hasProcessingProjects && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <LoadingSpinner />
              <span className="text-sm text-blue-700">
                Some projects are being evaluated by AI. This page will
                auto-refresh.
              </span>
            </div>
          )}

          {/* Search + Table */}
          <div className="flex-1 min-h-0">
            <div className="dashboard-card px-4 py-4 w-full h-full min-h-0 flex flex-col gap-4">
              {/* SearchBar */}
              <div className="w-full">
                <SearchBar
                  placeholder="Search by course / project / member / status"
                  members={allMembers}
                  onSearch={handleSearch}
                  onSelect={handleSelect}
                  onShowAll={handleShowAll}
                  maxResults={6}
                  className="w-full min-w-0"
                />
              </div>

              {/* Projects Table */}
              <div className="w-full overflow-x-auto">
                {filteredProjects.length === 0 ? (
                  <div className="h-[280px] flex items-center justify-center text-[var(--color-grey-55)]">
                    <div className="text-center">
                      <p className="subtitle-2 mb-1">No projects found.</p>
                      <p className="caption">
                        Try a different search, or create a new project.
                      </p>
                      <div className="mt-3">
                        <Button
                          variant="blue"
                          onClick={() => navigate("/project/new")}
                        >
                          Create Project
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Table data={tableData} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectLanding;
