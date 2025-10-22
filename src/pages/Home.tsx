import { useMemo, useState, useEffect } from "react";
import Dropdown, {
  type DropdownOption,
} from "../components/ui/Dropdown/Dropdown";
import Calendar from "../components/ui/Calendar/Calendar";
import RadarChart, {
  type RadarDataPoint,
} from "../components/ui/Charts/RadarChart/RadarChart";
import {
  DimensionLineChart,
  type DimensionData,
} from "../components/ui/Charts/LineChart/LineChart";
import { DimensionSelector } from "../components/layout/DimensionSelector/DimensionSelector";
import ChevronUp from "../assets/icons/chevron_up.svg";
import ChevronDown from "../assets/icons/chevron_down.svg";

import {
  dimensionsService,
  type Dimension,
  type Submission,
  type Project,
  type ProjectListItem,
  type Variant,
} from "../services/dimensionsService";

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

const Home = () => {
  // State for data from backend
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);
  const [selectedDimIds, setSelectedDimIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch dimensions on mount
  useEffect(() => {
    const fetchDimensions = async () => {
      try {
        const dims = await dimensionsService.getDimensions();
        setDimensions(dims);
        // Select all dimensions by default
        setSelectedDimIds(dims.map((d) => d.id.toString()));
      } catch (err) {
        console.error("Error fetching dimensions:", err);
        setError("Failed to load dimensions");
      }
    };

    fetchDimensions();
  }, []);

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const projectsList = await dimensionsService.getProjects();
        setProjects(projectsList);

        // Auto-select first project if available
        if (projectsList.length > 0) {
          await loadProjectSubmissions(projectsList[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects");
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Load submissions for a specific project
  const loadProjectSubmissions = async (projectId: string) => {
    try {
      setLoading(true);
      const data = await dimensionsService.getProjectSubmissions(projectId);
      setSelectedProject(data.project);
      setSubmissions(data.submissions);

      // Auto-select latest submission
      if (data.submissions.length > 0) {
        setSelectedSubmissionId(
          data.submissions[data.submissions.length - 1].id
        );
      }
    } catch (err) {
      console.error("Error fetching project submissions:", err);
      setError("Failed to load project data");
    } finally {
      setLoading(false);
    }
  };

  // Handle project selection
  const handleProjectChange = async (projectId: string) => {
    await loadProjectSubmissions(projectId);
  };

  // Dimension selection handlers
  const toggleDim = (id: string) => {
    setSelectedDimIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllDims = () => {
    setSelectedDimIds(dimensions.map((d) => d.id.toString()));
  };

  const clearAllDims = () => {
    setSelectedDimIds([]);
  };

  // Find the currently selected submission
  const currentSubmission = submissions.find(
    (s) => s.id === selectedSubmissionId
  );

  // Build the dropdown options for submissions
  const submissionOptions: DropdownOption[] = useMemo(() => {
    return submissions.map((s) => ({
      id: s.id,
      value: s.id,
      label: s.name,
    }));
  }, [submissions]);

  // Build the dropdown options for projects
  const projectOptions: DropdownOption[] = useMemo(() => {
    return projects.map((p) => ({
      id: p.id,
      value: p.id,
      label: `${p.name} (${p.submission_count} submissions)`,
    }));
  }, [projects]);

  // Get selected dimensions for charts
  const selectedDims = useMemo(() => {
    return dimensions.filter((d) => selectedDimIds.includes(d.id.toString()));
  }, [dimensions, selectedDimIds]);

  // Build radar chart data
  const radarData: RadarDataPoint[] = useMemo(() => {
    if (!currentSubmission) return [];

    return selectedDims.map((dim) => {
      const score = currentSubmission.scores[dim.id.toString()];
      return {
        dimension: dim.label,
        userScore: score?.personal || 0,
        classAverage: score?.classAvg || 0,
      };
    });
  }, [currentSubmission, selectedDims]);

  // Build line chart data
  const lineChartData = useMemo(() => {
    return submissions.map((sub) => {
      const dataPoint: DimensionData = {
        submission: sub.name,
      };

      selectedDims.forEach((dim) => {
        const score = sub.scores[dim.id.toString()];
        dataPoint[dim.label] = score?.personal || 0;
      });

      return dataPoint;
    });
  }, [submissions, selectedDims]);

  // Chart dimension configs for line chart
  const chartDimsForLine = useMemo(() => {
    return selectedDims.map((d) => ({
      id: d.id.toString(),
      text: d.label,
      color: VARIANT_COLORS[d.variant],
    }));
  }, [selectedDims]);

  if (loading && dimensions.length === 0) {
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
          <h1 className="heading-3 mb-2">Dashboard</h1>
          <p className="body text-[var(--color-grey-55)]">
            Track your project performance across multiple dimensions
          </p>
        </div>

        {/* Filters */}
        <div className="dashboard-card p-4 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="subtitle-1">Filters</span>
              {!showFilters && (
                <span className="caption text-[var(--color-grey-55)]">
                  {selectedProject
                    ? selectedProject.name
                    : "No project selected"}
                  {currentSubmission && ` - ${currentSubmission.name}`}
                </span>
              )}
            </div>
            <img
              src={showFilters ? ChevronUp : ChevronDown}
              alt="toggle"
              className="w-5 h-5"
            />
          </button>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Project Selector */}
              <div>
                <label className="caption text-[var(--color-grey-55)] mb-2 block">
                  Project
                </label>
                <Dropdown
                  options={projectOptions}
                  selectedOption={
                    projectOptions.find((o) => o.id === selectedProject?.id) ||
                    null
                  }
                  onSelect={(option) => handleProjectChange(option.id)}
                  placeholder="Select a project"
                />
              </div>

              {/* Submission Selector */}
              <div>
                <label className="caption text-[var(--color-grey-55)] mb-2 block">
                  Submission
                </label>
                <Dropdown
                  options={submissionOptions}
                  selectedOption={
                    submissionOptions.find(
                      (o) => o.id === selectedSubmissionId
                    ) || null
                  }
                  onSelect={(option) => setSelectedSubmissionId(option.id)}
                  placeholder="Select a submission"
                />
              </div>

              {/* Date Filter (placeholder) */}
              <div>
                <label className="caption text-[var(--color-grey-55)] mb-2 block">
                  Date Range
                </label>
                <Calendar
                  selectedDate={
                    selectedProject ? new Date(selectedProject.date) : null
                  }
                  onDateSelect={() => {}}
                />
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div>
          {!selectedProject || submissions.length === 0 ? (
            <div className="dashboard-card p-12 flex flex-col items-center justify-center">
              <p className="subtitle-2 text-[var(--color-grey-55)] mb-2">
                {projects.length === 0
                  ? "No projects found"
                  : "No submissions found for this project"}
              </p>
              <p className="caption text-[var(--color-grey-55)]">
                {projects.length === 0
                  ? "Create a project to get started"
                  : "Submit your first draft to see analytics"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Project Info */}
              <div className="dashboard-card p-6">
                <h2 className="heading-2 mb-2">{selectedProject.name}</h2>
                <p className="body text-[var(--color-grey-55)]">
                  {selectedProject.summary}
                </p>
                {currentSubmission && (
                  <div className="mt-4 flex items-center gap-4">
                    <span className="caption">
                      Viewing: <strong>{currentSubmission.name}</strong>
                    </span>
                    <span className="caption text-[var(--color-grey-55)]">
                      Submitted:{" "}
                      {new Date(currentSubmission.date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Dimension Selector */}
              <div className="dashboard-card px-6 py-4">
                <DimensionSelector
                  dimensions={dimensions}
                  selectedDimIds={selectedDimIds}
                  onToggleDim={toggleDim}
                  onSelectAll={selectAllDims}
                  onClearAll={clearAllDims}
                />
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* LEFT: Radar Chart */}
                <div className="dashboard-card px-6 py-4 flex flex-col">
                  <h3 className="subtitle-1 mb-4">Radar Chart</h3>
                  <div>
                    {selectedDims.length === 0 ? (
                      <div className="h-[420px] flex flex-col items-center justify-center text-[var(--color-grey-55)] gap-3">
                        <p className="subtitle-2">No dimensions selected</p>
                        <p className="caption">
                          Select dimensions to view the radar chart
                        </p>
                      </div>
                    ) : (
                      <RadarChart
                        data={radarData}
                        selectedDimensions={selectedDims.map((d) => d.label)}
                        maxScore={10}
                        height={420}
                      />
                    )}
                  </div>
                </div>

                {/* MIDDLE: Line Chart */}
                <div className="dashboard-card px-6 py-4 flex flex-col">
                  <h3 className="subtitle-1 mb-4">Performance Trend</h3>
                  <div>
                    {selectedDims.length === 0 ? (
                      <div className="h-[420px] flex flex-col items-center justify-center text-[var(--color-grey-55)] gap-3">
                        <p className="subtitle-2">No dimensions selected</p>
                        <p className="caption">
                          Select dimensions to view performance trends
                        </p>
                      </div>
                    ) : lineChartData.length === 0 ? (
                      <div className="h-[420px] flex items-center justify-center text-[var(--color-grey-55)] subtitle-2">
                        No submissions found
                      </div>
                    ) : (
                      <DimensionLineChart
                        data={lineChartData}
                        dimensions={chartDimsForLine}
                        title={`Performance Across Submissions — ${chartDimsForLine.length} dims`}
                        showArea={true}
                        height={420}
                      />
                    )}
                  </div>
                </div>

                {/* RIGHT: Details */}
                <div className="dashboard-card px-6 py-5 flex flex-col">
                  <div className="mt-6 flex-1 flex items-center justify-center subtitle-2 text-[var(--color-grey-55)]">
                    Report Detail
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
