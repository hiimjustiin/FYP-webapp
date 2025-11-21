import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button/Button";
import SearchBar from "../../components/ui/SearchBar/SearchBar";
import RadarChart, {
  type RadarDataPoint,
} from "../../components/ui/Charts/RadarChart/RadarChart";
import {
  DimensionLineChart,
  type DimensionData,
} from "../../components/ui/Charts/LineChart/LineChart";
import DimensionLabel from "../../components/ui/DimensionLabel/DimensionLabel";
import StarRating from "../../components/ui/StarRating/StarRating";
import DimensionFeedbackCard from "../../components/ui/DimensionFeedbackCard/DimensionFeedbackCard";
import ComparisonSelector from "../../components/layout/ComparisonSelector/ComparisonSelector";
import type { DropdownOption } from "../../components/ui/Dropdown/Dropdown";
import type { Variant } from "../../services/dimensionsService";
import "./ProjectReport.css";

/** Mock Data Structures */
interface DimensionScore {
  id: string;
  label: string;
  variant: Variant;
  initialScore: number;
  finalScore: number;
  feedback: string;
}

const MOCK_SUBMISSIONS: DropdownOption[] = [
  { id: "draft", label: "Draft" },
  { id: "submit-1", label: "Submit 1" },
  { id: "submit-2", label: "Submit 2" },
  { id: "submit-3", label: "Submit 3" },
];

const MOCK_DIMENSIONS: DimensionScore[] = [
  {
    id: "1",
    label: "Frame the problem with an integrative approach",
    variant: "lime",
    initialScore: 1,
    finalScore: 2,
    feedback:
      "The student's text offers reasons and mechanisms (AI leading to job losses and the need to learn new skills), though the depth of causal reasoning could be enhanced. The text acknowledges societal impacts but lacks comprehensive integration across multiple perspectives or disciplines.",
  },
  {
    id: "2",
    label: "Stakeholder consideration",
    variant: "yellow",
    initialScore: 1,
    finalScore: 1,
    feedback:
      "Given the acknowledgment of different impacts from AI and the internet (technological and economic disciplines), the text shows awareness of multiple stakeholders but doesn't deeply integrate their perspectives into a cohesive framework.",
  },
  {
    id: "3",
    label: "Range of disciplinary perspectives",
    variant: "purple",
    initialScore: 2,
    finalScore: 2,
    feedback:
      "The student text provides knowledge about AI, the internet, job economics, and societal changes. However, it does not explicitly cite or reference specific disciplinary sources, making it difficult to assess the credibility of the knowledge being integrated.",
  },
  {
    id: "4",
    label: "Disciplinary reasoning",
    variant: "teal",
    initialScore: 2,
    finalScore: 1,
    feedback:
      "The text lacks a direct reflection on the strengths or limitations of integrating these disciplinary insights. There is no meta-level analysis of how the integration of technological, economic, and social perspectives helps or hinders understanding.",
  },
  {
    id: "5",
    label: "Credibility of disciplinary knowledge",
    variant: "blue",
    initialScore: 1,
    finalScore: 2,
    feedback:
      "The student's text appears to cover more than one discipline, including topics from economics, technology (AI and internet), and societal change. This indicates engagement with multiple perspectives, though the depth of each discipline's treatment varies.",
  },
];

const ProjectReport: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [leftSubmission, setLeftSubmission] = useState<string>("draft");
  const [rightSubmission, setRightSubmission] = useState<string>("submit-1");
  const [, setSearchQuery] = useState<string>("");

  // Mock radar data - showing top 5 dimensions
  const radarData: RadarDataPoint[] = useMemo(() => {
    return MOCK_DIMENSIONS.slice(0, 5).map((dim) => ({
      dimension: dim.label,
      userScore: dim.finalScore,
      classAverage: 2.5, // Mock class average
    }));
  }, []);

  // Mock line chart data - progression across submissions
  const lineChartData: DimensionData[] = useMemo(() => {
    return [
      { submission: "Draft", "1": 1, "2": 1, "3": 2, "4": 2, "5": 1 },
      { submission: "Submit 1", "1": 1.5, "2": 1, "3": 2, "4": 1.5, "5": 1.5 },
      { submission: "Submit 2", "1": 2, "2": 1, "3": 2, "4": 1, "5": 2 },
    ];
  }, []);

  const lineChartDimensions = useMemo(() => {
    return MOCK_DIMENSIONS.slice(0, 5).map((dim) => ({
      id: dim.id,
      text: dim.label,
      color: `var(--color-${dim.variant})`,
    }));
  }, []);

  return (
    <div className="project-report">
      {/* Header Section */}
      <div className="project-report-header">
        <div className="project-report-welcome">
          <h3 className="heading-5">Hi, User!</h3>
          <p className="subtitle-2 text-grey-80">
            Let's begin a new project with ILA!
          </p>
        </div>

        <div className="project-report-search">
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="Search Person / Project Name"
          />
        </div>
      </div>

      {/* Comparison Selector */}
      <div className="project-report-comparison">
        <ComparisonSelector
          submissions={MOCK_SUBMISSIONS}
          leftSubmission={leftSubmission}
          rightSubmission={rightSubmission}
          onLeftChange={setLeftSubmission}
          onRightChange={setRightSubmission}
        />
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="project-report-content">
        {/* Column 1: Radar, Breakdown, Line Chart */}
        <div className="project-report-col-1">
          {/* Radar Chart */}
          <div className="report-card radar-card">
            <h4 className="subtitle-1 mb-4">Dimension Overview</h4>
            <RadarChart
              data={radarData}
              selectedDimensions={radarData.map((d) => d.dimension)}
              maxScore={3}
              height={300}
            />
          </div>

          {/* Component Breakdown */}
          <div className="report-card breakdown-card">
            <div className="breakdown-buttons">
              <Button variant="grey" onClick={() => {}}>
                Draft
              </Button>
              <Button variant="grey" onClick={() => {}}>
                Submit (e)
              </Button>
            </div>

            <div className="breakdown-list">
              {MOCK_DIMENSIONS.slice(0, 5).map((dim) => (
                <div key={dim.id} className="breakdown-item">
                  <DimensionLabel
                    text={dim.label}
                    variant={dim.variant}
                    size="small"
                  />
                  <StarRating
                    initialRating={dim.initialScore}
                    finalRating={dim.finalScore}
                    size="small"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Line Chart */}
          <div className="report-card line-chart-card">
            <DimensionLineChart
              data={lineChartData}
              dimensions={lineChartDimensions}
              title="Performance Progression"
              showArea={true}
              height={300}
            />
          </div>

          {/* Full Report Button */}
          <Button
            variant="blue"
            onClick={() => navigate(`/project/${projectId}`)}
            className="full-report-button"
          >
            Back to Project Detail
          </Button>
        </div>

        {/* Column 2: Dimension Feedback Cards */}
        <div className="project-report-col-2">
          <div className="feedback-cards-container">
            {MOCK_DIMENSIONS.map((dim) => (
              <DimensionFeedbackCard
                key={dim.id}
                dimensionLabel={dim.label}
                dimensionVariant={dim.variant}
                level={dim.finalScore}
                feedbackText={dim.feedback}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectReport;
