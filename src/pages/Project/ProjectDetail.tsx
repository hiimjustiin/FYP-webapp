import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button/Button";
import RadarChart, {
  type RadarDataPoint,
} from "../../components/ui/Charts/RadarChart/RadarChart";
import DimensionFeedbackCard from "../../components/ui/DimensionFeedbackCard/DimensionFeedbackCard";
import ChatInterface, {
  type ChatMessage,
} from "../../components/ui/ChatInterface/ChatInterface";
import ComparisonSelector from "../../components/layout/ComparisonSelector/ComparisonSelector";
import type { DropdownOption } from "../../components/ui/Dropdown/Dropdown";
import type { Variant } from "../../services/dimensionsService";
import { projectService, type Project } from "../../services/projectService";
import { feedbackService } from "../../services/feedbackService";
import "./ProjectDetail.css";

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

  // Comparison state
  const [leftSubmission, setLeftSubmission] = useState<string>("draft");
  const [rightSubmission, setRightSubmission] = useState<string>("submit-1");

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Submission content
  const [submissionContent, setSubmissionContent] = useState<string>("");

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

        console.log("[ProjectDetail] Submission data:", {
          essay_text: sub.essay_text?.substring(0, 100),
          file_urls: sub.file_urls,
          dimensions_count: dims.length,
          has_essay: !!sub.essay_text,
          has_files: !!(sub.file_urls && sub.file_urls.length > 0),
        });

        // Load submission content (essay_text or file_urls)
        if (sub.essay_text) {
          console.log(
            "[ProjectDetail] Setting essay_text as submission content, length:",
            sub.essay_text.length
          );
          setSubmissionContent(sub.essay_text);
        } else if (sub.file_urls && sub.file_urls.length > 0) {
          console.log(
            "[ProjectDetail] Setting file_urls as submission content"
          );
          setSubmissionContent(
            `[File submission: ${
              sub.file_urls.length
            } file(s)]\n${sub.file_urls.join("\n")}`
          );
        } else {
          console.warn(
            "[ProjectDetail] No essay_text or file_urls found in submission"
          );
        }

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
          console.log("[ProjectDetail] Setting AI feedback:", {
            dimensions: feedback.dimensions.length,
            first5: feedback.dimensions
              .slice(0, 5)
              .map((d) => ({ name: d.name, score: d.score })),
          });
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

        // Load submission content
        if (sub.essay_text) {
          setSubmissionContent(sub.essay_text);
        } else if (sub.file_urls && sub.file_urls.length > 0) {
          setSubmissionContent(
            `[File submission: ${
              sub.file_urls.length
            } file(s)]\n${sub.file_urls.join("\n")}`
          );
        }

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

  // Mock submissions for comparison
  const MOCK_SUBMISSIONS: DropdownOption[] = [
    { id: "draft", label: "Draft" },
    { id: "submit-1", label: "Submit (e)" },
  ];

  // Prepare radar data from feedback (top 5 dimensions)
  const radarData: RadarDataPoint[] = aiFeedback
    ? aiFeedback.dimensions.slice(0, 5).map((dim) => {
        console.log(
          "[ProjectDetail] Radar dimension:",
          dim.name,
          "score:",
          dim.score
        );
        return {
          dimension: dim.name,
          userScore: dim.score,
          classAverage: 2.5, // Mock class average
        };
      })
    : [];

  console.log("[ProjectDetail] Radar data:", radarData.length, "points");

  // Handle chat message send
  const handleSendMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      message,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, newMessage]);
    setIsChatLoading(true);

    // Simulate LLM response (replace with actual API call)
    setTimeout(() => {
      const llmResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "llm",
        message:
          "Thank you for your question. This is a mock response. In production, this would connect to the LLM API to provide contextual feedback about your submission.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, llmResponse]);
      setIsChatLoading(false);
    }, 1000);
  };

  // Submission content is now loaded directly in loadFeedback effect

  // Loading state
  if (isLoading) {
    return (
      <div className="project-detail-loading">
        <div className="text-center">
          <p className="subtitle-2 text-grey-80">Loading project...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="project-detail-error">
        <div className="project-detail-error-content">
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
    <div className="project-detail">
      {/* Header Section */}
      <div className="project-detail-header">
        <div className="project-detail-welcome">
          <h3 className="heading-5">Hi, User!</h3>
          <p className="subtitle-2 text-grey-80">
            Let's begin a new project with ILA!
          </p>
        </div>

        <div className="project-detail-actions">
          <Button variant="blue" onClick={() => navigate("/project/new")}>
            + Add New Project
          </Button>
        </div>
      </div>

      {/* Comparison Selector */}
      <div className="project-detail-comparison">
        <ComparisonSelector
          submissions={MOCK_SUBMISSIONS}
          leftSubmission={leftSubmission}
          rightSubmission={rightSubmission}
          onLeftChange={setLeftSubmission}
          onRightChange={setRightSubmission}
        />
      </div>

      {/* Main Content - Three Column Layout */}
      {aiFeedback ? (
        <div className="project-detail-content">
          {/* Column 1: Radar + Feedback Cards */}
          <div className="project-detail-col-1">
            {/* Radar Chart */}
            <div className="detail-card radar-section">
              <h4 className="subtitle-1 mb-4">Radar Chart</h4>
              {radarData.length > 0 ? (
                <RadarChart
                  data={radarData}
                  selectedDimensions={radarData.map((d) => d.dimension)}
                  maxScore={3}
                  height={300}
                />
              ) : (
                <div className="text-center text-grey-55 caption py-8">
                  No dimension data available
                </div>
              )}
            </div>

            {/* Feedback Cards */}
            <div className="feedback-cards-section">
              {aiFeedback.dimensions.map((dim, idx) => (
                <DimensionFeedbackCard
                  key={idx}
                  dimensionLabel={dim.name}
                  dimensionVariant={dim.variant as Variant}
                  level={dim.score}
                  feedbackText={dim.feedback}
                />
              ))}
            </div>

            {/* View Full Report Button */}
            <Button
              variant="blue"
              onClick={() => navigate(`/report/${projectId}`)}
              className="w-full"
            >
              Full Report
            </Button>
          </div>

          {/* Column 2: Submission Content */}
          <div className="project-detail-col-2">
            <div className="submission-content-card">
              <h4 className="subtitle-1">Student Submission</h4>
              {submissionContent ? (
                <>
                  <p className="submission-text body-2">{submissionContent}</p>
                  <div className="submission-actions">
                    <Button
                      variant="red"
                      onClick={handleSubmitProject}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="submission-empty">
                  <p className="subtitle-2">No submission content available</p>
                  <p className="caption">
                    Submit your project to view content here
                  </p>
                  <p className="caption text-grey-55 mt-2">
                    Debug: submissionId={submissionId || "null"}, aiFeedback=
                    {aiFeedback ? "exists" : "null"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Chat Interface */}
          <div className="project-detail-col-3">
            <ChatInterface
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isLoading={isChatLoading}
              placeholder="Ask about your feedback..."
            />
          </div>
        </div>
      ) : project.status === "Draft" ? (
        <div className="processing-state">
          <div className="processing-state-icon">📋</div>
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
      ) : (
        <div className="processing-state">
          <div className="processing-state-icon">⏳</div>
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
  );
};

export default ProjectDetail;
