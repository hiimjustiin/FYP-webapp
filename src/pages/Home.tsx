import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Dropdown, { type DropdownOption } from "../components/ui/Dropdown/Dropdown";
import Calendar from "../components/ui/Calendar/Calendar";
import RadarChart, { type RadarDataPoint } from "../components/ui/Charts/RadarChart/RadarChart";
import DimensionLabel from "../components/ui/DimensionLabel/DimensionLabel";
import Button from "../components/ui/Button/Button";

import { DimensionLineChart } from "../components/ui/Charts/LineChart/LineChart";
import ChevronUp from "../assets/icons/chevron_up.svg";
import ChevronDown from "../assets/icons/chevron_down.svg";

/** ---------------- Dimension catalog (ids + labels) ---------------- */
type Variant = "lime" | "yellow" | "purple" | "teal" | "blue" | "grey" | "green" | "navy" | "pink";
type Dimension = { id: string; label: string, variant: Variant };

const DIMENSIONS: Dimension[] = [
    { id: "1", label: "Frame the problem with an integrative approach", variant: "lime" },
    { id: "2", label: "Stakeholder consideration", variant: "yellow" },
    { id: "3", label: "Range of disciplinary perspectives", variant: "purple" },
    { id: "4", label: "Disciplinary reasoning", variant: "teal" },
    { id: "5", label: "Credibility of disciplinary knowledge", variant: "blue" },
    { id: "6", label: "Number of disciplinary integration", variant: "grey" },
    { id: "7", label: "Depth of disciplinary integration", variant: "green" },
    { id: "8", label: "Social (society) impact", variant: "navy" },
    { id: "9", label: "Limitations", variant: "pink" },
];

const VARIANT_COLORS: Record<Variant, string> = {
    lime: "var(--color-green-m1)",
    yellow: "var(--color-yellow)",
    purple: "var(--color-purple)",
    teal: "var(--color-teal)",
    blue: "var(--color-blue-m3)",
    grey: "var(--color-grey-80)",
    green: "var(--color-green-p1)",
    navy: "var(--color-blue-ntu)",
    pink: "var(--color-red-p2)",
};

type DimensionScore = {
    personal: number;   // 0..10
    classAvg: number;   // 0..10
};

type Submission = {
    id: string;
    name: string;       // e.g., Draft 1, Submission 2, etc.
    date: Date;
    // scores keyed by dimension id ("1".."9")
    scores: Record<string, DimensionScore>;
};

type Project = {
    id: string;
    name: string;
    date: Date;         // main project date (used for the overall filter)
    summary: string;
    submissions: Submission[];
};

/** Utility to clamp and coerce integer 0..10 */
const clamp01 = (v: number) => Math.max(0, Math.min(10, Math.round(v)));

/** Helper to make a dimension score object quickly */
const makeScores = (
    personalById: Partial<Record<string, number>>,
    classAvgById: Partial<Record<string, number>>
): Record<string, DimensionScore> => {
    const result: Record<string, DimensionScore> = {};
    DIMENSIONS.forEach(({ id }) => {
        const p = clamp01(personalById[id] ?? 0);
        const c = clamp01(classAvgById[id] ?? 0);
        result[id] = { personal: p, classAvg: c };
    });
    return result;
};

/** ---------------- Mock projects with submissions + scores --------- */
const ALL_PROJECTS: Project[] = [
    {
        id: "p1",
        name: "Urban Heat Islands Study",
        date: new Date("2025-09-12"),
        summary: "Measured heat stress across five districts; proposed greening strategies.",
        submissions: [
            {
                id: "p1-s1",
                name: "Draft 1",
                date: new Date("2025-08-20"),
                scores: makeScores(
                    // personal
                    { "1": 5, "2": 4, "3": 3, "4": 5, "5": 4, "6": 5, "7": 4, "8": 3, "9": 4 },
                    // class average
                    { "1": 4, "2": 5, "3": 4, "4": 5, "5": 4, "6": 4, "7": 4, "8": 4, "9": 3 }
                ),
            },
            {
                id: "p1-s2",
                name: "Draft 2",
                date: new Date("2025-08-29"),
                scores: makeScores(
                    { "1": 6, "2": 5, "3": 4, "4": 6, "5": 5, "6": 6, "7": 5, "8": 4, "9": 4 },
                    { "1": 5, "2": 5, "3": 4, "4": 5, "5": 5, "6": 5, "7": 5, "8": 4, "9": 4 }
                ),
            },
            {
                id: "p1-s3",
                name: "Submission 1",
                date: new Date("2025-09-10"),
                scores: makeScores(
                    { "1": 7, "2": 6, "3": 5, "4": 7, "5": 6, "6": 7, "7": 6, "8": 5, "9": 5 },
                    { "1": 6, "2": 6, "3": 5, "4": 6, "5": 6, "6": 6, "7": 6, "8": 5, "9": 5 }
                ),
            },
            {
                id: "p1-s4",
                name: "Submission 2",
                date: new Date("2025-09-12"),
                scores: makeScores(
                    { "1": 8, "2": 7, "3": 6, "4": 8, "5": 7, "6": 8, "7": 7, "8": 6, "9": 6 },
                    { "1": 7, "2": 7, "3": 6, "4": 7, "5": 7, "6": 7, "7": 7, "8": 6, "9": 6 }
                ),
            },
        ],
    },
    {
        id: "p2",
        name: "Coastal Erosion Mitigation",
        date: new Date("2025-08-10"),
        summary: "Compared breakwater vs mangrove restoration effectiveness.",
        submissions: [
            {
                id: "p2-s1",
                name: "Draft 1",
                date: new Date("2025-07-15"),
                scores: makeScores(
                    { "1": 4, "2": 5, "3": 3, "4": 5, "5": 4, "6": 5, "7": 4, "8": 2, "9": 3 },
                    { "1": 4, "2": 5, "3": 4, "4": 5, "5": 4, "6": 4, "7": 4, "8": 3, "9": 3 }
                ),
            },
            {
                id: "p2-s2",
                name: "Submission 1",
                date: new Date("2025-08-10"),
                scores: makeScores(
                    { "1": 6, "2": 6, "3": 4, "4": 6, "5": 5, "6": 6, "7": 6, "8": 3, "9": 4 },
                    { "1": 5, "2": 6, "3": 4, "4": 5, "5": 5, "6": 5, "7": 5, "8": 3, "9": 4 }
                ),
            },
        ],
    },
    {
        id: "p3",
        name: "AI Ethics in Clinics",
        date: new Date("2025-06-01"),
        summary: "Audited patient consent flows for ML-assisted diagnosis.",
        submissions: [
            {
                id: "p3-s1",
                name: "Draft 1",
                date: new Date("2025-05-10"),
                scores: makeScores(
                    { "1": 5, "2": 4, "3": 5, "4": 4, "5": 6, "6": 3, "7": 4, "8": 4, "9": 4 },
                    { "1": 4, "2": 4, "3": 4, "4": 4, "5": 5, "6": 4, "7": 4, "8": 4, "9": 4 }
                ),
            },
            {
                id: "p3-s2",
                name: "Submission 1",
                date: new Date("2025-06-01"),
                scores: makeScores(
                    { "1": 6, "2": 5, "3": 6, "4": 5, "5": 7, "6": 4, "7": 5, "8": 5, "9": 5 },
                    { "1": 5, "2": 5, "3": 5, "4": 5, "5": 6, "6": 5, "7": 5, "8": 5, "9": 5 }
                ),
            },
        ],
    },
    {
        id: "p4",
        name: "Renewable Microgrids Pilot",
        date: new Date("2025-03-18"),
        summary: "Evaluated CAPEX/OPEX for solar+storage on two campuses.",
        submissions: [
            {
                id: "p4-s1",
                name: "Draft 1",
                date: new Date("2025-03-01"),
                scores: makeScores(
                    { "1": 3, "2": 4, "3": 3, "4": 5, "5": 3, "6": 4, "7": 4, "8": 2, "9": 3 },
                    { "1": 3, "2": 4, "3": 3, "4": 4, "5": 3, "6": 4, "7": 4, "8": 3, "9": 3 }
                ),
            },
            {
                id: "p4-s2",
                name: "Submission 1",
                date: new Date("2025-03-18"),
                scores: makeScores(
                    { "1": 5, "2": 5, "3": 4, "4": 6, "5": 4, "6": 5, "7": 6, "8": 3, "9": 4 },
                    { "1": 4, "2": 5, "3": 4, "4": 5, "5": 4, "6": 5, "7": 5, "8": 3, "9": 4 }
                ),
            },
        ],
    },
];

/** ---------------- Component ---------------- */
const Home = () => {
    const navigate = useNavigate();

    // Date range
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    // Selected project & submission
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

    const formatDate = (date: Date) =>
        date.toLocaleDateString("en-UK", { month: "short", day: "numeric", year: "numeric" });

    /* Filter projects by inclusive date range (main project date) */
    const filteredProjects = useMemo<Project[]>(() => {
        if (!startDate || !endDate) return [];
        const s = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0);
        const e = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
        return ALL_PROJECTS
            .filter(p => p.date >= s && p.date <= e)
            .sort((a, b) => b.date.getTime() - a.date.getTime()); // most recent first
    }, [startDate, endDate]);

    // Project dropdown options
    const projectOptions: DropdownOption[] = filteredProjects.map(p => ({ id: p.id, label: p.name }));

    // Selected project object
    const selectedProject = selectedProjectId
        ? filteredProjects.find(p => p.id === selectedProjectId) ?? null
        : null;

    // Submission dropdown options for selected project
    const submissionOptions: DropdownOption[] = (selectedProject?.submissions ?? [])
        .slice()
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .map(s => ({ id: s.id, label: s.name }));

    // Selected submission object
    const selectedSubmission = selectedSubmissionId
        ? (selectedProject?.submissions ?? []).find(s => s.id === selectedSubmissionId) ?? null
        : null;

    const hasSubmission = !!selectedSubmission;

    /** Build radar data from the currently selected submission */
    const radarData: RadarDataPoint[] = useMemo(() => {
        return DIMENSIONS.map(d => {
            const s = selectedSubmission?.scores[d.id];
            return {
                dimension: d.label,
                userScore: s ? s.personal : 0,
                classAverage: s ? s.classAvg : 0,
            };
        });
    }, [selectedSubmission]);

    /** Build line chart data from the currently selected project */
    const lineChartData = useMemo(() => {
        if (!selectedProject) return [];
        const subs = selectedProject.submissions
            .slice()
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        return subs.map(s => {
            const row: { submission: string;[key: string]: number | string } = { submission: s.name };
            DIMENSIONS.forEach(d => {
                row[d.id] = s.scores[d.id]?.personal ?? 0; // personal; swap to classAvg if you prefer
            });
            return row;
        });
    }, [selectedProject]);

    /** Filtering state for the chips (default first 5) */
    const [selectedDimIds, setSelectedDimIds] = useState<string[]>(
        DIMENSIONS.slice(0, 5).map(d => d.id)
    );

    const toggleDim = (id: string) =>
        setSelectedDimIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );

    const selectAllDims = () => setSelectedDimIds(DIMENSIONS.map(d => d.id));
    const clearAllDims = () => setSelectedDimIds([]);

    /** Convert selected ids → dimension labels for RadarChart */
    const selectedTexts = useMemo(
        () =>
            selectedDimIds
                .map(id => DIMENSIONS.find(d => d.id === id)?.label)
                .filter(Boolean) as string[],
        [selectedDimIds]
    );

    /** Dimension config for line chart (id, text, color) */
    const chartDimsForLine = useMemo(
        () =>
            selectedDimIds
                .map(id => {
                    const d = DIMENSIONS.find(x => x.id === id);
                    return d ? { id: d.id, text: d.label, color: VARIANT_COLORS[d.variant] } : null;
                })
                .filter(Boolean) as { id: string; text: string; color: string }[],
        [selectedDimIds]
    );

    const [detailsOpen, setDetailsOpen] = useState(false);

    /** Keep selections valid when date range or project changes */
    useEffect(() => {
        // Reset selection when dates cleared or no projects in range
        if (!startDate || !endDate || filteredProjects.length === 0) {
            setSelectedProjectId(null);
            setSelectedSubmissionId(null);
            return;
        }
        // If current selected project not in range, or none selected, pick most recent
        if (!selectedProject || !filteredProjects.some(p => p.id === selectedProjectId)) {
            const mostRecent = filteredProjects[0];
            setSelectedProjectId(mostRecent.id);
            // default submission for that project: most recent
            const mostRecentSub = mostRecent.submissions
                .slice()
                .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
            setSelectedSubmissionId(mostRecentSub?.id ?? null);
            return;
        }
        // Project is valid; ensure a valid submission is selected
        if (
            !selectedSubmission ||
            !selectedProject.submissions.some(s => s.id === selectedSubmissionId)
        ) {
            const mostRecentSub = selectedProject.submissions
                .slice()
                .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
            setSelectedSubmissionId(mostRecentSub?.id ?? null);
        }
        setSelectedDimIds(DIMENSIONS.slice(0, 5).map(d => d.id));
        setDetailsOpen(false);
    }, [startDate, endDate, selectedProjectId, selectedSubmissionId, selectedSubmission, filteredProjects, selectedProject]);

    return (
        <div className="p-3 sm:p-4 lg:p-6 min-h-screen pb-8 flex flex-col">
            <div className="w-full flex-1 min-h-0 flex flex-col">
                <div className="flex flex-col h-full gap-4">
                    {/* Row: Greeting + Add New Project */}
                    <div className="flex flex-row justify-between items-center gap-4 flex-shrink-0">
                        {/* Greeting card */}
                        <div className="dashboard-card flex-7/12 px-4 py-2">
                            <h5 className="heading-5">Hi, User!</h5>
                            <p className="subtitle-2 text-grey-80">Let's begin a new project with ILA!</p>
                        </div>

                        {/* Add New Project card (clickable) */}
                        <div
                            className="dashboard-card basis-5/12 min-w-0 px-6 py-5 flex items-center justify-center cursor-pointer hover:scale-102 active:scale-98 transition-all"
                            onClick={() => navigate("/project")}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    navigate("/project");
                                }
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <span className="subtitle-2 leading-none">＋</span>
                                <span className="subtitle-2">Add New Project</span>
                            </div>
                        </div>
                    </div>

                    {/* Find your reports between: [Start] to [End] */}
                    <div className="flex-1 min-h-0">
                        <div className="dashboard-card px-6 py-4 w-full flex flex-col gap-4">
                            {/* Date range row */}
                            <div className="flex items-center flex-wrap gap-4">
                                <span className="subtitle-2">Find your reports between:</span>

                                {/* Start Date */}
                                <div className="relative shrink-0 w-[160px]">
                                    <Dropdown
                                        placeholder="Start Date"
                                        customTriggerText={startDate ? formatDate(startDate) : undefined}
                                        className="w-full min-w-0"
                                    >
                                        <Calendar selectedDate={startDate} onDateSelect={setStartDate} />
                                    </Dropdown>
                                </div>

                                <span className="body-2 ps-3 shrink-0">To</span>

                                {/* End Date */}
                                <div className="relative shrink-0 w-[160px]">
                                    <Dropdown
                                        placeholder="End Date"
                                        customTriggerText={endDate ? formatDate(endDate) : undefined}
                                        className="w-full min-w-0"
                                    >
                                        <Calendar selectedDate={endDate} onDateSelect={setEndDate} />
                                    </Dropdown>
                                </div>
                            </div>

                            {/* Project + Submission pickers */}
                            <div className="flex items-center flex-wrap gap-4">
                                {/* Project dropdown (enabled only when dates ready) */}
                                <div
                                    className={`relative w-[320px] ${!startDate || !endDate ? "opacity-50 pointer-events-none" : ""}`}
                                >
                                    <Dropdown
                                        placeholder="Select a project"
                                        options={projectOptions}
                                        selectedOption={
                                            selectedProject
                                                ? { id: selectedProject.id, label: selectedProject.name }
                                                : null
                                        }
                                        onSelect={(opt) => {
                                            setSelectedProjectId(opt.id);
                                            // reset submission to most recent for the chosen project
                                            const p = filteredProjects.find(fp => fp.id === opt.id);
                                            const mostRecentSub = p?.submissions
                                                ?.slice()
                                                .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
                                            setSelectedSubmissionId(mostRecentSub?.id ?? null);
                                        }}
                                        className="w-full min-w-0"
                                        customTriggerText={selectedProject ? selectedProject.name : undefined}
                                    />
                                </div>

                                {/* Submission dropdown (enabled only when project chosen) */}
                                <div
                                    className={`relative w-[240px] ${!selectedProject ? "opacity-50 pointer-events-none" : ""}`}
                                >
                                    <Dropdown
                                        placeholder="Select a submission"
                                        options={submissionOptions}
                                        selectedOption={
                                            selectedSubmission
                                                ? { id: selectedSubmission.id, label: selectedSubmission.name }
                                                : null
                                        }
                                        onSelect={(opt) => setSelectedSubmissionId(opt.id)}
                                        className="w-full min-w-0"
                                        customTriggerText={selectedSubmission ? selectedSubmission.name : undefined}
                                    />
                                </div>

                                {/* Small count helper */}
                                <span className="overline">
                                    {startDate && endDate
                                        ? filteredProjects.length
                                            ? `(${filteredProjects.length} project${filteredProjects.length > 1 ? "s" : ""} in range)`
                                            : "(No projects in this range)"
                                        : "(Pick a date range to see projects)"}
                                </span>
                            </div>
                        </div>

                        {/* Collapsible report scores */}
                        <div className="mt-4">
                            <div className="dashboard-card px-6 py-5">
                                {!selectedProject ? (
                                    <p className="body-2">Select a project to view report details.</p>
                                ) : !selectedSubmission ? (
                                    <p className="body-2">Select a submission to view scores.</p>
                                ) : (
                                    <>
                                        {/* Header: always visible when a submission exists */}
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <h6 className="heading-6">{selectedProject.name}</h6>
                                            </div>
                                            <div className="flex flex-row gap-5">
                                                <div className="flex flex-col items-end">
                                                    <div className="subtitle-2">{selectedSubmission.name}</div>
                                                    <div className="caption">
                                                        {formatDate(selectedSubmission.date)}
                                                    </div>

                                                </div>
                                                {/* Expand / Collapse toggle */}
                                                <Button
                                                    variant="whiteCard"
                                                    onClick={() => setDetailsOpen((v) => !v)}
                                                    aria-expanded={detailsOpen}
                                                    className="pl-4 pr-2"
                                                >
                                                    {detailsOpen ? (
                                                        <>
                                                            Hide details <img src={ChevronUp} alt="Chevron Up" className="size-8" />
                                                        </>
                                                    ) : (
                                                        <>
                                                            Show details <img src={ChevronDown} alt="Chevron Down" className="size-8" />
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Body: only when expanded */}
                                        {detailsOpen && (
                                            <div className="mt-4 space-y-4">
                                                {/* Scores table */}
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-[720px] w-full border-separate border-spacing-y-2">
                                                        <thead>
                                                            <tr className="text-left">
                                                                <th className="ps-3 caption">Dimension</th>
                                                                <th className="caption">Personal (0–10)</th>
                                                                <th className="caption">Class Avg (0–10)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {DIMENSIONS.map(({ id, label }) => {
                                                                const s = selectedSubmission.scores[id];
                                                                return (
                                                                    <tr key={id} className="bg-[var(--color-grey-05)] rounded-xl">
                                                                        <td className="px-3 py-1 rounded-l-xl body-2">{label}</td>
                                                                        <td className="px-3 py-1 body-2 font-medium">{s.personal}</td>
                                                                        <td className="px-3 py-1 rounded-r-xl body-2">{s.classAvg}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Summary */}
                                                <p className="body-2 text-grey-80">{selectedProject.summary}</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Report details */}
                        {hasSubmission && (
                            <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-4">
                                    {/* LEFT: Filter + Radar */}
                                    <div className="dashboard-card px-6 py-4 flex flex-col">
                                        {/* Filter header + actions */}
                                        <div className="rounded-2xl border border-[var(--color-grey-25)] bg-[var(--color-grey-05)]/40 p-3">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="subtitle-2">Select Dimensions</div>
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        variant="green"
                                                        onClick={selectAllDims}
                                                    >
                                                        Select All
                                                    </Button>
                                                    <Button
                                                        variant="grey"
                                                        onClick={clearAllDims}
                                                    >
                                                        Clear All
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Chips */}
                                            <div className="flex flex-wrap gap-2">
                                                {DIMENSIONS.map(d => {
                                                    const isSelected = selectedDimIds.includes(d.id);
                                                    return (
                                                        <DimensionLabel
                                                            key={d.id}
                                                            text={d.label}
                                                            variant={d.variant}
                                                            size="small"
                                                            isSelected={isSelected}
                                                            onClick={() => toggleDim(d.id)}
                                                        />
                                                    );
                                                })}
                                            </div>

                                            {/* Small counter */}
                                            <div className="mt-2">
                                                <p className="caption">{selectedDimIds.length} of {DIMENSIONS.length} dimensions selected</p>
                                            </div>
                                        </div>

                                        {/* Radar */}
                                        <div>
                                            <RadarChart
                                                key={selectedTexts.join("|")}
                                                data={radarData}
                                                selectedDimensions={selectedTexts}
                                                maxScore={10}
                                                height={420}
                                            />
                                        </div>
                                    </div>

                                    <div className="dashboard-card px-6 py-4 flex flex-col">
                                        {/* Filter header + actions */}
                                        <div className="rounded-2xl border border-[var(--color-grey-25)] bg-[var(--color-grey-05)]/40 p-3">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="subtitle-2">Select Dimensions</div>
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        variant="green"
                                                        onClick={selectAllDims}
                                                    >
                                                        Select All
                                                    </Button>
                                                    <Button
                                                        variant="grey"
                                                        onClick={clearAllDims}
                                                    >
                                                        Clear All
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Chips */}
                                            <div className="flex flex-wrap gap-2">
                                                {DIMENSIONS.map(d => {
                                                    const isSelected = selectedDimIds.includes(d.id);
                                                    return (
                                                        <DimensionLabel
                                                            key={d.id}
                                                            text={d.label}
                                                            variant={d.variant}
                                                            size="small"
                                                            isSelected={isSelected}
                                                            onClick={() => toggleDim(d.id)}
                                                        />
                                                    );
                                                })}
                                            </div>

                                            {/* Small counter */}
                                            <div className="mt-2">
                                                <p className="caption">{selectedDimIds.length} of {DIMENSIONS.length} dimensions selected</p>
                                            </div>
                                        </div>

                                        {/* Line Chart */}
                                        <div>
                                            {chartDimsForLine.length === 0 ? (
                                                <div className="h-[420px] flex flex-col items-center justify-center text-[var(--color-grey-55)] gap-3">
                                                    <p className="text-[var(--color-grey-55)] subtitle-2">No dimensions selected.</p>
                                                    <p className="text-[var(--color-grey-55)] caption">Select at least one dimension to display the line chart.</p>
                                                </div>
                                            ) : lineChartData.length === 0 ? (
                                                <div className="h-[420px] flex items-center justify-center text-[var(--color-grey-55)] subtitle-2">
                                                    No submissions found for this project.
                                                </div>
                                            ) : (
                                                <DimensionLineChart
                                                    key={chartDimsForLine.map(d => d.id).join("|")}
                                                    data={lineChartData}
                                                    dimensions={chartDimsForLine}
                                                    title={`Performance Across Submissions — ${chartDimsForLine.length} dims`}
                                                    showArea={true}
                                                    height={420}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT: Details card */}
                                <div className="dashboard-card px-6 py-5 flex flex-col">
                                    <div className="mt-6 flex-1 flex items-center justify-center subtitle-2 text-[var(--color-grey-55)]">
                                        Report Detail
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
