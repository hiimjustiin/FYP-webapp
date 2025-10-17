import { useMemo, useState } from "react";
import Button from "../components/ui/Button/Button";
import SearchBar, { type Member } from "../components/ui/SearchBar/SearchBar";
import Table, { type TableData } from "../components/ui/Table/Table";
import MemberGroup from "../components/ui/MemberIcon/MemberGroup";
// import { useNavigate } from "react-router-dom";

/** ------------------------------ Types ------------------------------ */
type TeamRow = {
    id: string;
    course: string;
    projectName: string;
    members: Member[];
};

/** ---------------------------- Mock Data ---------------------------- */
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

const MOCK_TEAMS: TeamRow[] = [
    {
        id: "t-001",
        course: "MSL 902",
        projectName: "Urban Heat Islands Study",
        members: [mockMembers[0], mockMembers[1], mockMembers[2], mockMembers[3]],
    },
    {
        id: "t-002",
        course: "EEE 311",
        projectName: "Renewable Microgrids Pilot",
        members: [mockMembers[4], mockMembers[5]],
    },
    {
        id: "t-003",
        course: "HSS 210",
        projectName: "AI Ethics in Clinics",
        members: [mockMembers[6]],
    },
    {
        id: "t-004",
        course: "CEE 450",
        projectName: "Coastal Erosion Mitigation",
        members: [mockMembers[7], mockMembers[2]],
    },
];

/** ----------------------------- Component ----------------------------- */
const Team = () => {
    // const navigate = useNavigate();
    const [query, setQuery] = useState("");

    // Filter by course / project / member / status
    const filtered = useMemo(() => {
        if (!query.trim()) return MOCK_TEAMS;
        const q = query.toLowerCase();
        return MOCK_TEAMS.filter((t) => {
            if (t.course.toLowerCase().includes(q)) return true;
            if (t.projectName.toLowerCase().includes(q)) return true;
            if (t.members.some((m) => m.name.toLowerCase().includes(q))) return true;
            return false;
        });
    }, [query]);

    // Build data for Table component
    const tableData: TableData = useMemo(() => {
        const header: TableData[number] = ["Course", "Project Name", "Member", "Status"];
        const rows: TableData[number][] = filtered.map((t) => [
            t.course,
            t.projectName,
            <MemberGroup
                key={`mg-${t.id}`}
                members={t.members.map((m) => ({
                    id: m.id,
                    name: m.name,
                    backgroundColor: m.backgroundColor ?? "auto",
                }))}
                size="small"
                maxVisible={6}
                layout="horizontal"
            />,
            // Status column 
            <div key={`act-${t.id}`} className="flex items-center gap-2">
                <Button variant="blue" onClick={() => alert(`Edit team: ${t.projectName}`)}>
                    Edit
                </Button>
                <Button variant="grey" onClick={() => alert(`Remove member in: ${t.projectName}`)}>
                    Manage
                </Button>
            </div>,
        ]);
        return [header, ...rows];
    }, [filtered]);

    // SearchBar handlers
    const handleSearch = (q: string) => setQuery(q);
    const handleSelect = (member: Member) => setQuery(member.name);
    const handleShowAll = () => setQuery("");

    return (
        <div className="p-3 sm:p-4 lg:p-6 h-screen flex flex-col">
            <div className="w-full flex-1 min-h-0 flex flex-col">
                <div className="flex flex-col h-full gap-4">
                    {/* Header row: greeting + new group */}
                    <div className="flex flex-row justify-between items-center gap-4 flex-shrink-0">
                        <div className="dashboard-card flex-7/12 px-4 py-2">
                            <h5 className="heading-5">Hi, User!</h5>
                            <p className="subtitle-2 text-grey-80">Let's begin a new project with ILA!</p>
                        </div>

                        {/* New Group card (clickable) */}
                        <div
                            className="dashboard-card basis-5/12 min-w-0 px-6 py-5 flex items-center justify-center cursor-pointer hover:scale-102 active:scale-98 transition-all"
                            onClick={() => /*navigate("/team/new")*/ alert("Create new group - to be implemented")}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    /*navigate("/team/new")*/ alert("Create new group - to be implemented");
                                }
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <span className="subtitle-2 leading-none">＋</span>
                                <span className="subtitle-2">New Group</span>
                            </div>
                        </div>
                    </div>

                    {/* Search + Table */}
                    <div className="flex-1 min-h-0">
                        <div className="dashboard-card px-4 py-4 w-full h-full min-h-0 flex flex-col gap-4">
                            {/* Search */}
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

                            {/* Table */}
                            <div className="w-full overflow-x-auto">
                                {filtered.length === 0 ? (
                                    <div className="h-[280px] flex items-center justify-center text-[var(--color-grey-55)]">
                                        <div className="text-center">
                                            <p className="subtitle-2 mb-1">No teams found.</p>
                                            <p className="caption">Try a different search.</p>
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

export default Team;
