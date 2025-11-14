import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button/Button";
import MemberGroup from "../../components/ui/MemberIcon/MemberGroup";
import { type Member } from "../../components/ui/SearchBar/SearchBar";
import { projectService, type Project } from "../../services/projectService";
import { feedbackService } from "../../services/feedbackService";

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

/** ------------------------------- Component ------------------------------- */
const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [aiFeedback, setAIFeedback] = useState<AIFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;

      try {
        setIsLoading(true);
        setError(null);
        const data = await projectService.getProject(projectId);
        setProject(data);

        // If project has a submission, load its feedback
        if (data.latest_submission_id) {
          console.log(
            "[ProjectDetail] Found submission:",
            data.latest_submission_id
          );
          setSubmissionId(data.latest_submission_id);
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

  // Load AI feedback when available - single unified effect
  useEffect(() => {
    const loadFeedback = async () => {
      if (!submissionId) return;

      try {
        console.log(
          "[ProjectDetail] Loading feedback for submission:",
          submissionId
        );
        const feedbackData = await feedbackService.getFeedback(submissionId);
        console.log("[ProjectDetail] Got feedback:", feedbackData);

        if (!feedbackData?.submission) {
          console.error("[ProjectDetail] No submission data in response");
          return;
        }

        const sub = feedbackData.submission;
        const dims = feedbackData.dimensions || [];

        if (sub.ai_processing_status === "completed" && dims.length > 0) {
          // Convert real AI feedback to display format
          const feedback: AIFeedback = {
            overallScore:
              Math.round(
                (dims.reduce((sum, d) => sum + (d.ai_score || 0), 0) /
                  (dims.length || 1)) *
                  10
              ) / 10,
            maxScore: 3,
            dimensions: dims.map((d) => ({
              name: d.dimension_label,
              score: d.ai_score || 0,
              maxScore: 3,
              feedback: d.ai_reasoning || "Analysis in progress...",
              variant: d.dimension_variant,
            })),
            summary: sub.ai_overall_summary || "Analysis complete",
            strengths: sub.ai_overall_strengths || [],
            improvements: sub.ai_priority_improvements || [],
            generatedAt: sub.submitted_at,
          };
          setAIFeedback(feedback);
          setProcessingStatus("Analysis complete!");
        } else if (
          sub.ai_processing_status === "processing" ||
          sub.ai_processing_status === "pending"
        ) {
          // Status is still processing/pending, start polling
          setProcessingStatus(
            sub.ai_processing_status === "processing"
              ? "AI is analyzing your submission..."
              : "Queued for analysis..."
          );
          // Will be handled by polling effect below
        } else if (sub.ai_processing_status === "failed") {
          setError(
            `Analysis failed: ${sub.ai_processing_error || "Unknown error"}`
          );
          setProcessingStatus("Analysis failed.");
        }
      } catch (err) {
        console.error("[ProjectDetail] Error loading feedback:", err);
      }
    };

    loadFeedback();
  }, [submissionId]);

  // Poll for AI feedback when submission is processing/pending
  useEffect(() => {
    // Only poll if we have a submission ID, no feedback yet, and not failed/completed
    if (
      !submissionId ||
      aiFeedback ||
      processingStatus.includes("failed") ||
      processingStatus.includes("complete")
    )
      return;

    let isActive = true;
    let pollInterval: NodeJS.Timeout;

    const checkFeedback = async () => {
      if (!isActive) return;

      try {
        const feedbackData = await feedbackService.getFeedback(submissionId);

        if (!isActive) return;

        const sub = feedbackData.submission;
        const dims = feedbackData.dimensions || [];

        if (sub.ai_processing_status === "completed" && dims.length > 0) {
          // Feedback is ready
          const feedback: AIFeedback = {
            overallScore:
              Math.round(
                (dims.reduce((sum, d) => sum + (d.ai_score || 0), 0) /
                  (dims.length || 1)) *
                  10
              ) / 10,
            maxScore: 3,
            dimensions: dims.map((d) => ({
              name: d.dimension_label,
              score: d.ai_score || 0,
              maxScore: 3,
              feedback: d.ai_reasoning || "Analysis in progress...",
              variant: d.dimension_variant,
            })),
            summary: sub.ai_overall_summary || "Analysis complete",
            strengths: sub.ai_overall_strengths || [],
            improvements: sub.ai_priority_improvements || [],
            generatedAt: sub.submitted_at,
          };
          setAIFeedback(feedback);
          setProcessingStatus("Analysis complete!");
          console.log("[ProjectDetail] AI feedback loaded successfully");
        } else if (sub.ai_processing_status === "failed") {
          setProcessingStatus("Analysis failed.");
          setError(
            `Analysis failed: ${sub.ai_processing_error || "Unknown error"}`
          );
        } else if (sub.ai_processing_status === "processing") {
          setProcessingStatus("AI is analyzing your submission...");
          // Continue polling
          pollInterval = setTimeout(checkFeedback, 3000);
        } else if (sub.ai_processing_status === "pending") {
          setProcessingStatus("Queued for analysis...");
          // Continue polling
          pollInterval = setTimeout(checkFeedback, 5000);
        }
      } catch (err) {
        console.error("[ProjectDetail] Error polling feedback:", err);
        if (isActive) {
          // Retry after delay
          pollInterval = setTimeout(checkFeedback, 5000);
        }
      }
    };

    // Start polling
    checkFeedback();

    return () => {
      isActive = false;
      if (pollInterval) clearTimeout(pollInterval);
    };
  }, [submissionId, aiFeedback, processingStatus]);

  // Handle project submission for AI evaluation
  const handleSubmitProject = async () => {
    if (!project || !projectId) return;

    // Confirm submission
    const confirmed = window.confirm(
      "Are you sure you want to submit this project for AI evaluation? This will change the status from Draft to Submitted. You'll be redirected to the project list."
    );

    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await projectService.submitProject(projectId);

      console.log("Submission result:", result);

      // Show success message and redirect
      alert(
        `${result.message}\n\nYou can check the feedback status from the project list.`
      );

      // Redirect to project list
      navigate("/project");
    } catch (err) {
      console.error("Failed to submit project:", err);
      let errorMessage = "Failed to submit project. Please try again.";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "object" && err !== null && "response" in err) {
        const errResponse = err as {
          response?: { data?: { error?: { message?: string } } };
        };
        errorMessage =
          errResponse.response?.data?.error?.message || errorMessage;
      }

      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                Submitted on{" "}
                {project.submission_date
                  ? formatDate(project.submission_date)
                  : "Not yet submitted"}
              </p>
            </div>
            <div className="flex gap-2">
              {/* Show Submit button only for Draft projects */}
              {project.status === "Draft" && (
                <Button
                  variant="blue"
                  onClick={handleSubmitProject}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit for AI Feedback"}
                </Button>
              )}
              <Button
                variant="grey"
                onClick={() => navigate(`/project/${project.id}/edit`)}
                disabled={isSubmitting}
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
              <p className="body-1 whitespace-pre-wrap">
                {project.description}
              </p>
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
                    width: `${
                      (aiFeedback.overallScore / aiFeedback.maxScore) * 100
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* ILA Dimensions Assessment */}
            <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
              <h5 className="subtitle-1 mb-4">ILA Dimensions Assessment</h5>
              <div className="space-y-4">
                {aiFeedback.dimensions.map((dimension, idx) => (
                  <div
                    key={idx}
                    className="border-b border-grey-10 pb-4 last:border-0 last:pb-0"
                  >
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
                        <span className="subtitle-2 flex-1">
                          {dimension.name}
                        </span>
                      </div>
                      <span className="body-2 font-medium whitespace-nowrap">
                        {dimension.score}/{dimension.maxScore}
                      </span>
                    </div>
                    <div className="w-full bg-grey-20 rounded-full h-2 mb-2">
                      <div
                        className="bg-[#D71440] h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            (dimension.score / dimension.maxScore) * 100
                          }%`,
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
                    <li
                      key={idx}
                      className="body-2 text-grey-80 flex items-start gap-2"
                    >
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
                    <li
                      key={idx}
                      className="body-2 text-grey-80 flex items-start gap-2"
                    >
                      <span className="text-orange-600 mt-1">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder if not submitted and Draft */}
        {!aiFeedback && project.status === "Draft" && (
          <div className="dashboard-card p-6 text-center">
            <div className="text-5xl mb-3">📋</div>
            <h5 className="subtitle-1 mb-2">Ready to Submit?</h5>
            <p className="body-2 text-grey-80 mb-4">
              Submit your project to receive detailed AI feedback and assessment
              based on the 9 ILA dimensions for interdisciplinary learning.
            </p>
            <Button
              variant="blue"
              onClick={handleSubmitProject}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit for AI Feedback"}
            </Button>
          </div>
        )}

        {/* Processing state - show after submission */}
        {!aiFeedback && project.status === "Submitted" && (
          <div className="dashboard-card p-6 text-center">
            <div className="text-5xl mb-3">⏳</div>
            <h5 className="subtitle-1 mb-2">AI Evaluation in Progress</h5>
            <p className="body-2 text-grey-80 mb-2">
              {processingStatus ||
                "Your project is being analyzed by our AI system. This typically takes 30-60 seconds."}
            </p>
            {processingStatus.includes("longer than expected") && (
              <p className="caption text-orange-600 mb-4">
                The analysis is taking longer than usual. You can safely leave
                this page and return later.
              </p>
            )}
            <div className="flex justify-center gap-3 mt-4">
              <Button variant="grey" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
