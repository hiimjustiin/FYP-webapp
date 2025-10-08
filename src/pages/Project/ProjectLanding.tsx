import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button/Button";
import SearchBar, { type Member } from "../../components/ui/SearchBar/SearchBar";
import Table, { type TableData } from "../../components/ui/Table/Table";
import MemberGroup from "../../components/ui/MemberIcon/MemberGroup";

/** -------------------------------- Types -------------------------------- */
type ProjectStatus = "Draft" | "Submitted" | "Completed";

type ProjectRow = {
    id: string;
    course: string;
    name: string;
    date: string; // ISO string for simplicity
    members: Member[]; // re-use Member type from SearchBar
    interq?: string; // placeholder summary
    status: ProjectStatus;
};

/** ------------------------------ Mock Data ------------------------------ */
const mockMembers: Member[] = [
    { id: "1", name: "Calvin Klein", initials: "CK", backgroundColor: "auto" },
    { id: "2", name: "Mark Jacobs", initials: "MJ", backgroundColor: "auto" },
    { id: "3", name: "Kate Spade", initials: "KS", backgroundColor: "auto" },
    { id: "4", name: "Giorgio Armani", initials: "GA", backgroundColor: "auto" },
    { id: "5", name: "Tommy Hilfiger", initials: "TH", backgroundColor: "auto" },
    { id: "6", name: "Yves Saint Laurent", initials: "YSL", backgroundColor: "auto" },
    { id: "7", name: "Jane Smith", initials: "JS", backgroundColor: "auto" },
    { id: "8", name: "David Chen", initials: "DC", backgroundColor: "auto" },
];

const MOCK_PROJECTS: ProjectRow[] = [
    {
        id: "p-001",
        course: "MSL 902",
        name: "Urban Heat Islands Study",
        date: "2025-09-12",
        members: [mockMembers[0], mockMembers[1], mockMembers[2], mockMembers[3]],
        interq: "—",
        status: "Submitted",
    },
    {
        id: "p-002",
        course: "EEE 311",
        name: "Renewable Microgrids Pilot",
        date: "2025-03-18",
        members: [mockMembers[4], mockMembers[5]],
        interq: "—",
        status: "Completed",
    },
    {
        id: "p-003",
        course: "HSS 210",
        name: "AI Ethics in Clinics",
        date: "2025-06-01",
        members: [mockMembers[6]],
        interq: "—",
        status: "Submitted",
    },
    {
        id: "p-004",
        course: "CEE 450",
        name: "Coastal Erosion Mitigation",
        date: "2025-08-10",
        members: [mockMembers[7], mockMembers[2]],
        interq: "—",
        status: "Draft",
    },
];

/** ------------------------------- Helpers ------------------------------- */
const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-UK", { month: "short", day: "numeric", year: "numeric" });

/** ------------------------------ Component ------------------------------ */
const ProjectLanding = () => {
    const navigate = useNavigate();

    // SearchBar state (you can wire this to a backend later)
    const [query, setQuery] = useState("");

    // Simple filter: match against course, name, member names
    const filteredProjects = useMemo(() => {
        if (!query.trim()) return MOCK_PROJECTS;
        const q = query.toLowerCase();
        return MOCK_PROJECTS.filter((p) => {
            if (p.course.toLowerCase().includes(q)) return true;
            if (p.name.toLowerCase().includes(q)) return true;
            if (p.status.toLowerCase().includes(q)) return true;
            if (p.members.some((m) => m.name.toLowerCase().includes(q))) return true;
            return false;
        });
    }, [query]);

    // Build TableData from projects
    const tableData: TableData = useMemo(() => {
        const header: TableData[number] = ["Course", "Project Name", "Date", "Member", "InterQ Scores", "Status", "Action"];

        const rows: TableData[number][] = filteredProjects.map((p) => [
            p.course,
            p.name,
            formatDate(p.date),
            <MemberGroup
                key={`mg-${p.id}`}
                members={p.members.map((m) => ({
                    id: m.id,
                    name: m.name,
                    backgroundColor: m.backgroundColor ?? "auto",
                }))}
                size="small"
                maxVisible={6}
                layout="horizontal"
            />,
            p.interq ?? "—",
            p.status,
            <div key={`act-${p.id}`} className="flex gap-2">
                <Button variant="blue" onClick={() => alert(`Open ${p.name}`)}>
                    Open
                </Button>
                <Button variant="grey" onClick={() => alert(`Edit ${p.name}`)}>
                    Edit
                </Button>
            </div>,
        ]);

        return [header, ...rows];
    }, [filteredProjects, navigate]);

    // SearchBar handlers
    const handleSearch = (q: string) => setQuery(q);
    const handleSelect = (member: Member) => setQuery(member.name);
    const handleShowAll = () => setQuery("");

    return (
        <div className="p-3 sm:p-4 lg:p-6 h-screen flex flex-col">
            <div className="w-full flex-1 min-h-0 flex flex-col">
                <div className="flex flex-col h-full gap-4">
                    {/* Header row: greeting + new project */}
                    <div className="flex flex-row justify-between items-center gap-4 flex-shrink-0">
                        <div className="dashboard-card flex-7/12 px-4 py-2">
                            <h5 className="heading-5">Hi, User!</h5>
                            <p className="subtitle-2 text-grey-80">Let's begin a new project with ILA!</p>
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
                                    members={mockMembers}
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
                                            <p className="caption">Try a different search, or create a new project.</p>
                                            <div className="mt-3">
                                                <Button variant="blue" onClick={() => navigate("/project/new")}>
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
