import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button/Button";
import SearchBar, { type Member } from "../components/ui/SearchBar/SearchBar";
import Table, { type TableData } from "../components/ui/Table/Table";
import MemberGroup from "../components/ui/MemberIcon/MemberGroup";
import { teamService, type Team as TeamType } from "../services/teamService";
import { useAuth } from "../contexts/AuthContext";

/** ----------------------------- Component ----------------------------- */
const Team = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [teams, setTeams] = useState<TeamType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch teams on mount
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedTeams = await teamService.getTeams();
        setTeams(fetchedTeams);
      } catch (err) {
        console.error("Failed to fetch teams:", err);
        setError("Failed to load teams. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  // Build a flat list of members for SearchBar autocomplete
  const allMembers: Member[] = useMemo(() => {
    const membersMap = new Map<string, Member>();
    teams.forEach((team) => {
      team.members.forEach((m) => {
        if (!membersMap.has(m.id)) {
          // Generate a consistent color based on member ID
          const colors: (
            | "blue"
            | "pink"
            | "green"
            | "purple"
            | "teal"
            | "yellow"
          )[] = ["blue", "pink", "green", "purple", "teal", "yellow"];
          const colorIndex =
            parseInt(m.id.substring(0, 8), 16) % colors.length;

          membersMap.set(m.id, {
            id: m.id,
            name: m.name,
            initials: m.initials,
            backgroundColor: colors[colorIndex],
          });
        }
      });
    });
    return Array.from(membersMap.values());
  }, [teams]);

  // Filter by course / project / member
  const filtered = useMemo(() => {
    if (!query.trim()) return teams;
    const q = query.toLowerCase();
    return teams.filter((t) => {
      if (t.course.code?.toLowerCase().includes(q)) return true;
      if (t.course.title?.toLowerCase().includes(q)) return true;
      if (t.projectName.toLowerCase().includes(q)) return true;
      if (t.members.some((m) => m.name.toLowerCase().includes(q))) return true;
      if (t.status.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [query, teams]);

  // Build data for Table component
  const tableData: TableData = useMemo(() => {
    const header: TableData[number] = [
      "Course",
      "Project Name",
      "Members",
      "Actions",
    ];
    const rows: TableData[number][] = filtered.map((t) => [
      t.course.code || t.course.title,
      t.projectName,
      <MemberGroup
        key={`mg-${t.id}`}
        members={t.members.map((m) => {
          // Generate a consistent color based on member ID
          const colors: (
            | "blue"
            | "pink"
            | "green"
            | "purple"
            | "teal"
            | "yellow"
          )[] = ["blue", "pink", "green", "purple", "teal", "yellow"];
          const colorIndex =
            parseInt(m.id.substring(0, 8), 16) % colors.length;

          return {
            id: m.id,
            name: m.name,
            backgroundColor: colors[colorIndex],
          };
        })}
        size="small"
        maxVisible={6}
        layout="horizontal"
      />,
      <div key={`act-${t.id}`} className="flex items-center gap-2">
        <Button
          variant="blue"
          onClick={() => navigate(`/project/${t.id}/edit`)}
        >
          Edit
        </Button>
        {t.ownerIsCurrentUser && (
          <Button
            variant="grey"
            onClick={() => navigate(`/team/${t.id}/manage`)}
          >
            Manage
          </Button>
        )}
      </div>,
    ]);
    return [header, ...rows];
  }, [filtered, navigate]);

  // SearchBar handlers
  const handleSearch = (q: string) => setQuery(q);
  const handleSelect = (member: Member) => setQuery(member.name);
  const handleShowAll = () => setQuery("");

  // Get display name for greeting
  const displayName = user?.display_name?.split(" ")[0] || "User";

  return (
    <div className="p-3 sm:p-4 lg:p-6 h-screen flex flex-col">
      <div className="w-full flex-1 min-h-0 flex flex-col">
        <div className="flex flex-col h-full gap-4">
          {/* Header row: greeting + new group */}
          <div className="flex flex-row justify-between items-center gap-4 flex-shrink-0">
            <div className="dashboard-card flex-7/12 px-4 py-2">
              <h5 className="heading-5">Hi, {displayName}!</h5>
              <p className="subtitle-2 text-grey-80">
                Manage your team projects here.
              </p>
            </div>

            {/* New Group card (clickable) - navigates to create project */}
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
                <span className="subtitle-2 leading-none">+</span>
                <span className="subtitle-2">New Group Project</span>
              </div>
            </div>
          </div>

          {/* Search + Table */}
          <div className="flex-1 min-h-0">
            <div className="dashboard-card px-4 py-4 w-full h-full min-h-0 flex flex-col gap-4">
              {/* Search */}
              <div className="w-full">
                <SearchBar
                  placeholder="Search by course / project / member"
                  members={allMembers}
                  onSearch={handleSearch}
                  onSelect={handleSelect}
                  onShowAll={handleShowAll}
                  maxResults={6}
                  className="w-full min-w-0"
                />
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="h-[280px] flex items-center justify-center text-[var(--color-grey-55)]">
                  <div className="text-center">
                    <p className="subtitle-2 mb-1">Loading teams...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {!isLoading && error && (
                <div className="h-[280px] flex items-center justify-center text-[var(--color-grey-55)]">
                  <div className="text-center">
                    <p className="subtitle-2 mb-1 text-red-500">{error}</p>
                    <Button
                      variant="grey"
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && teams.length === 0 && (
                <div className="h-[280px] flex items-center justify-center text-[var(--color-grey-55)]">
                  <div className="text-center">
                    <p className="subtitle-2 mb-1">No team projects yet.</p>
                    <p className="caption mb-4">
                      Create a group project to start collaborating with your
                      classmates.
                    </p>
                    <Button variant="blue" onClick={() => navigate("/project/new")}>
                      Create Group Project
                    </Button>
                  </div>
                </div>
              )}

              {/* No Results State */}
              {!isLoading && !error && teams.length > 0 && filtered.length === 0 && (
                <div className="h-[280px] flex items-center justify-center text-[var(--color-grey-55)]">
                  <div className="text-center">
                    <p className="subtitle-2 mb-1">No teams found.</p>
                    <p className="caption">Try a different search.</p>
                  </div>
                </div>
              )}

              {/* Table */}
              {!isLoading && !error && filtered.length > 0 && (
                <div className="w-full overflow-x-auto">
                  <Table data={tableData} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Team;
