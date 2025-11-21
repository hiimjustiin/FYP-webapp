import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button/Button";
import RadarChart, {
  type RadarDataPoint,
} from "../../components/ui/Charts/RadarChart/RadarChart";
import DimensionFeedbackCard from "../../components/ui/DimensionFeedbackCard/DimensionFeedbackCard";
import DimensionLabel from "../../components/ui/DimensionLabel/DimensionLabel";
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

  // Selected dimension for feedback display
  const [selectedDimension, setSelectedDimension] = useState<string | null>(
    null
  );

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

  // Prepare radar data from feedback (all dimensions)
  const radarData: RadarDataPoint[] = aiFeedback
    ? aiFeedback.dimensions.map((dim) => {
        console.log(
          "[ProjectDetail] Radar dimension:",
          dim.name,
          "score:",
          dim.score,
          "variant:",
          dim.variant
        );
        return {
          dimension: dim.name,
          userScore: dim.score,
          classAverage: 2.0, // Mock class average
        };
      })
    : [];

  console.log("[ProjectDetail] Radar data:", radarData.length, "points");
  console.log("[ProjectDetail] aiFeedback exists:", !!aiFeedback);
  console.log(
    "[ProjectDetail] aiFeedback dimensions:",
    aiFeedback?.dimensions.length
  );

  // Generate improvement suggestion based on score (1-3 scale)
  const getImprovementSuggestion = (
    dimensionName: string,
    score: number
  ): string => {
    const suggestions: Record<string, Record<number, string>> = {
      "Frame the problem with an integrative approach": {
        1: "To reach level 2, start by clearly identifying the problem and acknowledging multiple perspectives. Begin exploring how different disciplines might view the issue differently.",
        2: "To get level 3, you need to demonstrate sophisticated integration of multiple disciplinary perspectives. Show how these perspectives interact and complement each other to frame a more complete understanding of the problem.",
      },
      "Stakeholder consideration": {
        1: "To reach level 2, identify the key stakeholders affected by the issue. Consider their diverse interests and how they might be impacted differently.",
        2: "To get level 3, conduct deeper analysis of stakeholder relationships and power dynamics. Consider both direct and indirect stakeholders, and analyze potential conflicts of interest and ethical implications.",
      },
      "Range of disciplinary perspectives": {
        1: "To reach level 2, incorporate perspectives from at least 2-3 different disciplines. Show awareness that multiple fields can contribute to understanding the issue.",
        2: "To get level 3, integrate 4 or more distinct disciplinary perspectives. Demonstrate deep understanding of how each discipline uniquely contributes to analyzing the problem.",
      },
      "Disciplinary reasoning": {
        1: "To reach level 2, begin using concepts and methods specific to different disciplines. Show basic understanding of how each discipline approaches problems.",
        2: "To get level 3, demonstrate sophisticated use of disciplinary reasoning. Apply discipline-specific methodologies accurately and explain the rationale behind choosing particular analytical approaches.",
      },
      "Credibility of disciplinary knowledge": {
        1: "To reach level 2, start citing credible sources from different disciplines. Include peer-reviewed research, expert opinions, or authoritative references.",
        2: "To get level 3, critically evaluate the quality and relevance of disciplinary sources. Discuss the strengths and limitations of different knowledge claims and explain why certain sources are more credible in specific contexts.",
      },
      "Number of disciplinary integration": {
        1: "To reach level 2, make explicit connections between at least two disciplines. Show how insights from one field relate to or inform another.",
        2: "To get level 3, create sophisticated integrations across multiple disciplines. Demonstrate how combining insights generates new understanding that wouldn't emerge from any single discipline alone.",
      },
      "Depth of disciplinary integration": {
        1: "To reach level 2, move beyond simply listing different perspectives. Begin synthesizing ideas by identifying common themes or complementary insights across disciplines.",
        2: "To get level 3, achieve deep integration where disciplinary insights are woven together seamlessly. Create new frameworks or solutions that transform understanding by combining disciplinary knowledge in novel ways.",
      },
      "Social (society) impact": {
        1: "To reach level 2, identify specific societal impacts of the issue. Consider effects on communities, institutions, or social structures.",
        2: "To get level 3, analyze societal impacts with nuance and depth. Consider short-term and long-term effects, intended and unintended consequences, and differential impacts on various social groups. Discuss ethical implications and potential solutions.",
      },
      Limitations: {
        1: "To reach level 2, acknowledge that your analysis has limitations. Identify gaps in your research or areas where more information would be valuable.",
        2: "To get level 3, provide thoughtful, specific discussion of limitations. Address methodological constraints, scope limitations, potential biases, and areas requiring further investigation. Show how these limitations might affect your conclusions.",
      },
    };

    // Generic suggestion if specific dimension not found
    const genericSuggestions: Record<number, string> = {
      1: "To reach level 2, you need to enhance the depth of your explanations. Add more detailed examples and dive deeper into the mechanisms and relationships within this dimension. Use more detailed reasoning to strengthen your arguments.",
      2: "To get level 3, demonstrate mastery by providing comprehensive analysis with sophisticated integration. Include concrete examples, consider multiple perspectives, and show how different elements interact. Back up your arguments with credible evidence and explain the implications of your analysis.",
    };

    if (score >= 3) return ""; // No suggestion needed for level 3

    return (
      suggestions[dimensionName]?.[score] || genericSuggestions[score] || ""
    );
  };

  // Handle dimension click from radar chart
  const handleDimensionClick = (dimension: string) => {
    console.log("[ProjectDetail] Dimension clicked:", dimension);
    console.log(
      "[ProjectDetail] Available dimensions:",
      aiFeedback?.dimensions.map((d) => d.name)
    );
    setSelectedDimension(dimension);
  };

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
              <div className="flex justify-between items-center mb-4">
                <h4 className="subtitle-1">Radar Chart</h4>
                {selectedDimension && (
                  <span className="caption text-grey-55">
                    Selected: {selectedDimension}
                  </span>
                )}
              </div>
              {radarData.length > 0 ? (
                <RadarChart
                  data={radarData}
                  selectedDimensions={radarData.map((d) => d.dimension)}
                  maxScore={3}
                  height={450}
                  onDimensionClick={handleDimensionClick}
                />
              ) : (
                <div className="text-center text-grey-55 caption py-8">
                  No dimension data available
                </div>
              )}
            </div>

            {/* Feedback Cards */}
            <div className="feedback-cards-section">
              {selectedDimension ? (
                aiFeedback.dimensions
                  .filter((dim) => dim.name === selectedDimension)
                  .map((dim, idx) => {
                    const improvementSuggestion = getImprovementSuggestion(
                      dim.name,
                      dim.score
                    );

                    return (
                      <div key={idx} className="feedback-with-suggestion">
                        <DimensionFeedbackCard
                          dimensionLabel={dim.name}
                          dimensionVariant={dim.variant as Variant}
                          level={dim.score}
                          feedbackText={dim.feedback}
                        />

                        {improvementSuggestion && (
                          <>
                            <div className="suggestion-arrow">
                              <svg
                                width="32"
                                height="32"
                                viewBox="0 0 32 32"
                                fill="none"
                              >
                                <path
                                  d="M16 4L16 28M16 28L8 20M16 28L24 20"
                                  stroke="#000000"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                            <div className="improvement-suggestion-card">
                              <div className="suggestion-header">
                                <DimensionLabel
                                  text={dim.name}
                                  variant={dim.variant as Variant}
                                  size="medium"
                                />
                                <span className="body-2">:</span>
                              </div>
                              <p className="suggestion-body caption">
                                {improvementSuggestion}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
              ) : (
                <div className="feedback-instruction">
                  <p className="subtitle-2 text-grey-80">
                    👆 Click a dimension on the radar chart
                  </p>
                  <p className="caption text-grey-55">
                    Select any dimension to view detailed feedback
                  </p>
                </div>
              )}
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
