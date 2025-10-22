import { useMemo, useState, useEffect } from "react";
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

/** ------------------------------ Component ------------------------------ */
const ProjectLanding = () => {
  const navigate = useNavigate();

  // State
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await projectService.getProjects();
        setProjects(data);
      } catch (err) {
        console.error("Failed to load projects:", err);
        setError("Failed to load projects. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

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
        p.submission_date ? formatDate(p.submission_date) : "—",
        <MemberGroup
          key={`mg-${p.id}`}
          members={projectMembers}
          size="small"
          maxVisible={6}
          layout="horizontal"
        />,
        p.interq_score || "—",
        p.status,
        <div key={`act-${p.id}`} className="flex gap-2">
          <Button variant="blue" onClick={() => navigate(`/projects/${p.id}`)}>
            Open
          </Button>
          <Button
            variant="grey"
            onClick={() => navigate(`/project/${p.id}/edit`)}
          >
            Edit
          </Button>
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
