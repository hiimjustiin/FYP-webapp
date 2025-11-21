import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  reportService,
  type PortfolioData,
} from "../services/reportService";
import {
  DimensionLineChart,
  type DimensionData,
} from "../components/ui/Charts/LineChart/LineChart";
import Button from "../components/ui/Button/Button";
import "./Report.css";

const Report = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const portfolioData = await reportService.getPortfolioAnalytics();
        setData(portfolioData);
      } catch (err) {
        console.error("Failed to load portfolio analytics:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load analytics"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Prepare timeline chart data
  const timelineChartData: DimensionData[] = useMemo(() => {
    if (!data || data.timeline.length === 0) return [];

    // Group by date
    const dateMap = new Map<string, Record<string, number>>();

    data.timeline.forEach((point) => {
      const dateKey = new Date(point.date).toLocaleDateString();
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {});
      }
      dateMap.get(dateKey)![point.dimension] = point.score;
    });

    return Array.from(dateMap.entries()).map(([date, scores]) => ({
      submission: date,
      ...scores,
    }));
  }, [data]);

  const timelineDimensions = useMemo(() => {
    if (!data) return [];
    const uniqueDims = Array.from(new Set(data.timeline.map((t) => t.dimension)));
    return uniqueDims.map((dim, index) => ({
      id: dim,
      text: dim,
      color: `hsl(${(index * 360) / uniqueDims.length}, 70%, 50%)`
    }));
  }, [data]);

  // Calculate improvement trend
  const improvementTrend = useMemo(() => {
    if (!data || data.timeline.length < 2) return null;

    const recent = data.timeline.slice(-5);
    const older = data.timeline.slice(0, 5);

    const recentAvg =
      recent.reduce((sum, p) => sum + p.score, 0) / recent.length;
    const olderAvg = older.reduce((sum, p) => sum + p.score, 0) / older.length;

    const diff = recentAvg - olderAvg;
    return {
      value: Math.abs(diff),
      direction: diff > 0.1 ? "up" : diff < -0.1 ? "down" : "stable",
    };
  }, [data]);

  if (loading) {
    return (
      <div className="report-page">
        <div className="report-loading">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#181C62]"></div>
          <p className="mt-4 text-gray-600">Loading portfolio analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="report-page">
        <div className="report-error">
          <p className="text-red-600">{error || "Failed to load data"}</p>
          <Button variant="blue" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { overview, projects, recentSubmissions } = data;

  return (
    <div className="report-page">
      {/* Header */}
      <div className="report-header">
        <div>
          <h1 className="heading-3">Portfolio Analytics</h1>
          <p className="body text-[var(--color-grey-55)]">
            Track your performance across all projects
          </p>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="report-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon bg-[#181C62]">📊</div>
          <div className="metric-content">
            <p className="metric-label">Total Projects</p>
            <p className="metric-value">{overview.totalProjects}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-blue-500">📝</div>
          <div className="metric-content">
            <p className="metric-label">Total Submissions</p>
            <p className="metric-value">{overview.totalSubmissions}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-purple-500">⭐</div>
          <div className="metric-content">
            <p className="metric-label">Average Score</p>
            <p className="metric-value">
              {overview.overallAvgScore.toFixed(1)}/3.0
            </p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-green-500">
            {improvementTrend?.direction === "up"
              ? "📈"
              : improvementTrend?.direction === "down"
              ? "📉"
              : "➡️"}
          </div>
          <div className="metric-content">
            <p className="metric-label">Trend</p>
            <p className="metric-value">
              {improvementTrend
                ? improvementTrend.direction === "up"
                  ? `+${improvementTrend.value.toFixed(1)}`
                  : improvementTrend.direction === "down"
                  ? `-${improvementTrend.value.toFixed(1)}`
                  : "Stable"
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="report-content-grid">
        {/* Left Column */}
        <div className="report-column-left">
          {/* Strengths & Weaknesses */}
          <div className="dashboard-card">
            <h3 className="heading-5 mb-4">Performance Insights</h3>

            {overview.bestDimension && (
              <div className="insight-item strength">
                <div className="insight-header">
                  <span className="insight-icon">💪</span>
                  <span className="subtitle-1">Top Strength</span>
                </div>
                <p className="body">
                  {overview.bestDimension.label}
                  <span className="ml-2 font-bold text-green-600">
                    {overview.bestDimension.score.toFixed(1)}/3.0
                  </span>
                </p>
              </div>
            )}

            {overview.worstDimension && (
              <div className="insight-item weakness">
                <div className="insight-header">
                  <span className="insight-icon">🎯</span>
                  <span className="subtitle-1">Growth Opportunity</span>
                </div>
                <p className="body">
                  {overview.worstDimension.label}
                  <span className="ml-2 font-bold text-orange-600">
                    {overview.worstDimension.score.toFixed(1)}/3.0
                  </span>
                </p>
              </div>
            )}

            {improvementTrend && improvementTrend.direction === "up" && (
              <div className="insight-item improvement">
                <div className="insight-header">
                  <span className="insight-icon">🚀</span>
                  <span className="subtitle-1">Great Progress!</span>
                </div>
                <p className="body">
                  You've improved by {improvementTrend.value.toFixed(1)} points
                  recently
                </p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="dashboard-card">
            <h3 className="heading-5 mb-4">Recent Submissions</h3>
            <div className="recent-submissions-list">
              {recentSubmissions.slice(0, 5).map((submission) => (
                <div key={submission.id} className="recent-submission-item">
                  <div className="flex-1">
                    <p className="subtitle-2">{submission.projectTitle}</p>
                    <p className="caption text-[var(--color-grey-55)]">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="body font-bold">
                      {submission.avgScore.toFixed(1)}
                    </span>
                    <Button
                      variant="grey"
                      onClick={() =>
                        navigate(`/projects/${submission.projectId}`)
                      }
                      className="text-xs"
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>


        </div>

        {/* Right Column */}
        <div className="report-column-right">
          {/* Performance Timeline */}
          {timelineChartData.length > 0 && (
            <div className="dashboard-card">
              <h3 className="heading-5 mb-4">Performance Over Time</h3>
              <DimensionLineChart
                data={timelineChartData}
                dimensions={timelineDimensions}
                title=""
                showArea={true}
                height={300}
              />
            </div>
          )}

          {/* Projects Summary */}
          <div className="dashboard-card">
            <h3 className="heading-5 mb-4">Projects Overview</h3>
            <div className="projects-summary-list">
              {projects.map((project) => (
                <div key={project.id} className="project-summary-item">
                  <div className="flex-1">
                    <p className="subtitle-1">{project.title}</p>
                    <p className="caption text-[var(--color-grey-55)]">
                      {project.submissionCount} submission
                      {project.submissionCount !== 1 ? "s" : ""} • Avg:{" "}
                      {project.avgScore.toFixed(1)}/3.0
                    </p>
                  </div>
                  <Button
                    variant="blue"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="text-xs"
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;
