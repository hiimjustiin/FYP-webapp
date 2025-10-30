import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button/Button";
import MemberGroup from "../../components/ui/MemberIcon/MemberGroup";
import { type Member } from "../../components/ui/SearchBar/SearchBar";
import { projectService, type Project } from "../../services/projectService";

/** ------------------------------- Helpers ------------------------------- */
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-UK", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

/** ------------------------------- Mock AI Feedback ------------------------------- */
interface DimensionFeedback {
  name: string;
  score: number;
  maxScore: number;
  feedback: string;
  variant: string;
}

interface AIFeedback {
  overallScore: number;
  maxScore: number;
  dimensions: DimensionFeedback[];
  summary: string;
  strengths: string[];
  improvements: string[];
  generatedAt: string;
}

// ILA Dimensions based on the app's actual dimensions
const ILA_DIMENSIONS = [
  {
    label: "Frame the problem with an integrative approach",
    variant: "lime",
    feedback: "Strong problem framing that considers multiple perspectives. The interdisciplinary approach is evident and well-articulated.",
    score: 8,
  },
  {
    label: "Stakeholder consideration",
    variant: "yellow",
    feedback: "Good identification of key stakeholders. Consider expanding analysis to include indirect stakeholders and their potential impacts.",
    score: 7,
  },
  {
    label: "Range of disciplinary perspectives",
    variant: "purple",
    feedback: "Excellent integration of diverse disciplinary viewpoints. The breadth of perspectives demonstrates comprehensive understanding.",
    score: 9,
  },
  {
    label: "Disciplinary reasoning",
    variant: "teal",
    feedback: "Solid application of discipline-specific methodologies. The reasoning follows established frameworks appropriately.",
    score: 8,
  },
  {
    label: "Credibility of disciplinary knowledge",
    variant: "blue",
    feedback: "Sources are credible and well-cited. Consider incorporating more recent studies to strengthen the knowledge base.",
    score: 7,
  },
  {
    label: "Number of disciplinary integration",
    variant: "grey",
    feedback: "Good integration across multiple disciplines. The connections between fields are clear and purposeful.",
    score: 8,
  },
  {
    label: "Depth of disciplinary integration",
    variant: "green",
    feedback: "Integration goes beyond surface level. Shows understanding of how disciplines complement each other in addressing the problem.",
    score: 9,
  },
  {
    label: "Social (society) impact",
    variant: "navy",
    feedback: "Strong consideration of societal implications. The analysis demonstrates awareness of broader social contexts and potential impacts.",
    score: 8,
  },
  {
    label: "Limitations",
    variant: "pink",
    feedback: "Good acknowledgment of study limitations. Consider discussing methodological constraints and potential biases more explicitly.",
    score: 7,
  },
];

const generateMockAIFeedback = (): AIFeedback => {
  const dimensions: DimensionFeedback[] = ILA_DIMENSIONS.map((dim) => ({
    name: dim.label,
    score: dim.score,
    maxScore: 10,
    feedback: dim.feedback,
    variant: dim.variant,
  }));

  const totalScore = dimensions.reduce((sum, dim) => sum + dim.score, 0);
  const maxTotalScore = dimensions.length * 10;

  return {
    overallScore: totalScore,
    maxScore: maxTotalScore,
    dimensions,
    summary:
      "This project demonstrates strong interdisciplinary learning and integration. The work shows comprehensive understanding of multiple perspectives and their integration. The problem is well-framed with clear stakeholder consideration. Areas for enhancement include expanding stakeholder analysis and incorporating more recent scholarly sources.",
    strengths: [
      "Exceptional depth of disciplinary integration across multiple fields",
      "Clear and comprehensive problem framing with integrative approach",
      "Strong demonstration of disciplinary reasoning and methodologies",
      "Thoughtful consideration of societal impact and broader implications",
      "Effective synthesis of diverse disciplinary perspectives",
    ],
    improvements: [
      "Expand stakeholder analysis to include indirect stakeholders",
      "Incorporate more recent studies to strengthen credibility of knowledge",
      "Provide more explicit discussion of methodological limitations",
      "Consider additional ethical implications in the social impact section",
    ],
    generatedAt: new Date().toISOString(),
  };
};

/** ------------------------------- Component ------------------------------- */
const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [aiFeedback, setAIFeedback] = useState<AIFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;

      try {
        setIsLoading(true);
        setError(null);
        const data = await projectService.getProject(projectId);
        setProject(data);

        // Generate AI feedback if project is submitted or completed
        if (data.status === "Submitted" || data.status === "Completed") {
          const feedback = generateMockAIFeedback();
          setAIFeedback(feedback);
        }
      } catch (err) {
        console.error("Failed to load project:", err);
        setError("Failed to load project. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  // Convert project members to Member format for MemberGroup
  const projectMembers: Member[] =
    project?.members.map((m) => {
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
    }) || [];

  // Loading state
  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="subtitle-2 text-grey-80">Loading project...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="p-3 sm:p-4 lg:p-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="subtitle-2 text-red-500 mb-3">
            {error || "Project not found"}
          </p>
          <Button variant="blue" onClick={() => navigate("/project")}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button variant="grey" onClick={() => navigate("/project")}>
            ← Back
          </Button>
          <h3 className="heading-3">{project.title}</h3>
        </div>

        {/* Project Details Card */}
        <div className="dashboard-card p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h4 className="heading-4 mb-2">Project Details</h4>
              <p className="subtitle-2 text-grey-80">
                Submitted on {project.submission_date ? formatDate(project.submission_date) : "Not yet submitted"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="grey"
                onClick={() => navigate(`/project/${project.id}/edit`)}
              >
                Edit
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="subtitle-2 text-grey-80 block mb-1">
                  Course Code
                </label>
                <p className="body-1">{project.course_code || "—"}</p>
              </div>

              <div>
                <label className="subtitle-2 text-grey-80 block mb-1">
                  Status
                </label>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    project.status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : project.status === "Submitted"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-grey-100 text-grey-800"
                  }`}
                >
                  {project.status}
                </span>
              </div>

              <div>
                <label className="subtitle-2 text-grey-80 block mb-1">
                  InterQ Score
                </label>
                <p className="body-1">{project.interq_score || "—"}</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="subtitle-2 text-grey-80 block mb-1">
                  Team Members
                </label>
                <div className="mt-2">
                  <MemberGroup
                    members={projectMembers}
                    size="medium"
                    maxVisible={10}
                    layout="horizontal"
                  />
                </div>
              </div>

              <div>
                <label className="subtitle-2 text-grey-80 block mb-1">
                  Created At
                </label>
                <p className="body-1">{formatDate(project.created_at)}</p>
              </div>

              <div>
                <label className="subtitle-2 text-grey-80 block mb-1">
                  Last Updated
                </label>
                <p className="body-1">{formatDate(project.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div className="mt-6 pt-6 border-t border-grey-20">
              <label className="subtitle-2 text-grey-80 block mb-2">
                Description
              </label>
              <p className="body-1 whitespace-pre-wrap">{project.description}</p>
            </div>
          )}
        </div>

        {/* AI Feedback Card - Only show if project is submitted/completed */}
        {aiFeedback && (
          <div className="dashboard-card p-6 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="flex items-start gap-3 mb-6">
              <div className="text-3xl">🤖</div>
              <div>
                <h4 className="heading-4 mb-1">AI Feedback & Assessment</h4>
                <p className="subtitle-2 text-grey-80">
                  Generated on {formatDate(aiFeedback.generatedAt)}
                </p>
              </div>
            </div>

            {/* Overall Score */}
            <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="subtitle-1">Overall Score</span>
                <span className="heading-3 text-[#181C62]">
                  {aiFeedback.overallScore}/{aiFeedback.maxScore}
                </span>
              </div>
              <div className="w-full bg-grey-20 rounded-full h-3">
                <div
                  className="bg-[#181C62] h-3 rounded-full transition-all"
                  style={{
                    width: `${(aiFeedback.overallScore / aiFeedback.maxScore) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* ILA Dimensions Assessment */}
            <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
              <h5 className="subtitle-1 mb-4">ILA Dimensions Assessment</h5>
              <div className="space-y-4">
                {aiFeedback.dimensions.map((dimension, idx) => (
                  <div key={idx} className="border-b border-grey-10 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-2 gap-4">
                      <div className="flex items-center gap-2 flex-1">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium bg-${dimension.variant}-100 text-${dimension.variant}-800`}
                          style={{
                            backgroundColor: `var(--color-${dimension.variant}-10, #f0f0f0)`,
                            color: `var(--color-${dimension.variant}-70, #333)`,
                          }}
                        >
                          {dimension.variant}
                        </span>
                        <span className="subtitle-2 flex-1">{dimension.name}</span>
                      </div>
                      <span className="body-2 font-medium whitespace-nowrap">
                        {dimension.score}/{dimension.maxScore}
                      </span>
                    </div>
                    <div className="w-full bg-grey-20 rounded-full h-2 mb-2">
                      <div
                        className="bg-[#D71440] h-2 rounded-full transition-all"
                        style={{
                          width: `${(dimension.score / dimension.maxScore) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="caption text-grey-80">{dimension.feedback}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
              <h5 className="subtitle-1 mb-2">Summary</h5>
              <p className="body-2 text-grey-80">{aiFeedback.summary}</p>
            </div>

            {/* Strengths and Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h5 className="subtitle-1 mb-3 text-green-700">✓ Strengths</h5>
                <ul className="space-y-2">
                  {aiFeedback.strengths.map((strength, idx) => (
                    <li key={idx} className="body-2 text-grey-80 flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h5 className="subtitle-1 mb-3 text-orange-700">
                  ⚠ Areas for Improvement
                </h5>
                <ul className="space-y-2">
                  {aiFeedback.improvements.map((improvement, idx) => (
                    <li key={idx} className="body-2 text-grey-80 flex items-start gap-2">
                      <span className="text-orange-600 mt-1">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder if not submitted */}
        {!aiFeedback && (
          <div className="dashboard-card p-6 text-center">
            <div className="text-5xl mb-3">📋</div>
            <h5 className="subtitle-1 mb-2">No AI Feedback Yet</h5>
            <p className="body-2 text-grey-80">
              Submit your project to receive detailed AI feedback and assessment based on the 9 ILA dimensions for interdisciplinary learning.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
