import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  instructorService,
  type DimensionScore,
} from "../services/instructorService";
import Button from "../components/ui/Button/Button";

interface SubmissionDetail {
  id: string;
  name: string;
  submitted_at: string;
  status: string;
  file_url: string;
  file_type: string;
  student_name: string;
  student_email: string;
  student_id: string;
  project_title: string;
  project_description: string;
  course_code: string;
  course_title: string;
  ai_overall_summary?: string | null;
  ai_overall_strengths?: string[] | null;
  ai_priority_improvements?: string[] | null;
}

interface DimensionScoreDetail extends DimensionScore {
  dimension_label: string;
  ai_score_original?: number;
  ai_feedback_raw?: Record<string, unknown>;
  instructor_override?: boolean;
  instructor_comments?: string;
}

const SubmissionDetail = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [scores, setScores] = useState<DimensionScoreDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scoring, setScoring] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSubmissionDetails = async () => {
    try {
      setLoading(true);
      const data = await instructorService.getSubmissionDetails(submissionId!);
      setSubmission(data.submission);
      setScores(data.scores || []);
    } catch (err) {
      console.error("Error fetching submission details:", err);
      setError("Failed to load submission details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (submissionId) {
      fetchSubmissionDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  const handleTriggerScoring = async () => {
    try {
      setScoring(true);
      const result = await instructorService.triggerScoring(submissionId!);

      // Map AI results to score format
      const newScores: DimensionScoreDetail[] = result.dimension_scores.map(
        (ds) => ({
          dimension_id: ds.dimension_id,
          dimension_label: `Dimension ${ds.dimension_id}`,
          score: ds.score,
          reasoning: ds.reasoning,
          ai_score_original: ds.score,
          instructor_override: false,
        })
      );

      setScores(newScores);

      // Refresh to get updated data
      await fetchSubmissionDetails();
    } catch (err) {
      console.error("Error triggering scoring:", err);
      alert("Failed to score submission. Please try again.");
    } finally {
      setScoring(false);
    }
  };

  const handleScoreChange = (dimensionId: number, newScore: string) => {
    const scoreValue = parseFloat(newScore);
    if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 10) return;

    setScores((prev) =>
      prev.map((s) =>
        s.dimension_id === dimensionId
          ? { ...s, score: scoreValue, instructor_override: true }
          : s
      )
    );
  };

  const handleCommentChange = (dimensionId: number, comment: string) => {
    setScores((prev) =>
      prev.map((s) =>
        s.dimension_id === dimensionId
          ? { ...s, comments: comment, instructor_override: true }
          : s
      )
    );
  };

  const handleSaveReview = async () => {
    try {
      setSaving(true);

      const dimensionScores = scores.map((s) => ({
        dimension_id: s.dimension_id,
        score: s.score,
        comments: s.comments,
      }));

      await instructorService.reviewSubmission(submissionId!, dimensionScores);

      alert("Review saved successfully!");
      await fetchSubmissionDetails();
    } catch (err) {
      console.error("Error saving review:", err);
      alert("Failed to save review. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      submitted: "bg-blue-100 text-blue-800",
      scoring: "bg-yellow-100 text-yellow-800",
      scored: "bg-green-100 text-green-800",
      reviewed: "bg-purple-100 text-purple-800",
    };

    return (
      <span
        className={`px-3 py-1 rounded text-sm font-medium ${
          statusColors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#181C62]"></div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-[var(--color-grey-05)] flex items-center justify-center">
        <div className="text-center">
          <p className="subtitle-2 text-red-500 mb-4">
            {error || "Submission not found"}
          </p>
          <Button variant="grey" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const averageScore =
    scores.length > 0
      ? (scores.reduce((sum, s) => sum + s.score, 0) / scores.length).toFixed(1)
      : "N/A";

  return (
    <div className="min-h-screen bg-[var(--color-grey-05)]">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="grey" onClick={() => navigate(-1)} className="mb-4">
            ← Back
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="heading-3 mb-2">Submission Details</h1>
              <p className="body text-[var(--color-grey-55)]">
                {submission.course_code} - {submission.course_title}
              </p>
            </div>
            {getStatusBadge(submission.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Submission Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Student Info Card */}
            <div className="dashboard-card p-6">
              <h2 className="heading-4 mb-4">Student Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="caption text-[var(--color-grey-55)]">Name</p>
                  <p className="body-2 font-medium">
                    {submission.student_name}
                  </p>
                </div>
                <div>
                  <p className="caption text-[var(--color-grey-55)]">
                    Student ID
                  </p>
                  <p className="body-2">{submission.student_id}</p>
                </div>
                <div>
                  <p className="caption text-[var(--color-grey-55)]">Email</p>
                  <p className="body-2">{submission.student_email}</p>
                </div>
              </div>
            </div>

            {/* Submission Info Card */}
            <div className="dashboard-card p-6">
              <h2 className="heading-4 mb-4">Submission Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="caption text-[var(--color-grey-55)]">Project</p>
                  <p className="body-2 font-medium">
                    {submission.project_title}
                  </p>
                </div>
                {submission.project_description && (
                  <div>
                    <p className="caption text-[var(--color-grey-55)]">
                      Project Description
                    </p>
                    <p className="body-2 text-gray-700 max-h-32 overflow-y-auto">
                      {submission.project_description}
                    </p>
                  </div>
                )}
                <div>
                  <p className="caption text-[var(--color-grey-55)]">
                    Submitted
                  </p>
                  <p className="body-2">
                    {new Date(submission.submitted_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="caption text-[var(--color-grey-55)]">
                    File Type
                  </p>
                  <p className="body-2">
                    {submission.file_type?.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="caption text-[var(--color-grey-55)]">Status</p>
                  <p className="body-2">{submission.status}</p>
                </div>
              </div>

              {submission.file_url && (
                <div className="mt-4 pt-4 border-t border-[var(--color-grey-15)]">
                  <Button
                    variant="blue"
                    onClick={() => window.open(submission.file_url, "_blank")}
                    className="w-full"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    View Submission File
                  </Button>
                </div>
              )}
            </div>

            {/* Score Summary Card */}
            {scores.length > 0 && (
              <div className="dashboard-card p-6">
                <h2 className="heading-4 mb-4">Score Summary</h2>
                <div className="text-center py-4">
                  <p className="caption text-[var(--color-grey-55)] mb-2">
                    Average Score
                  </p>
                  <p className="text-4xl font-bold text-[var(--color-blue-ntu)]">
                    {averageScore}
                  </p>
                  <p className="caption text-[var(--color-grey-55)] mt-1">
                    out of 10
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--color-grey-15)]">
                  <p className="caption text-[var(--color-grey-55)] mb-2">
                    Dimensions Scored
                  </p>
                  <p className="body-2">{scores.length} / 9</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Scoring Interface */}
          <div className="lg:col-span-2">
            <div className="dashboard-card p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="heading-4">Scoring & Review</h2>
                {submission.status === "submitted" && (
                  <Button
                    variant="blue"
                    onClick={handleTriggerScoring}
                    disabled={scoring}
                  >
                    {scoring ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Scoring...
                      </>
                    ) : (
                      "Trigger AI Scoring"
                    )}
                  </Button>
                )}
              </div>

              {scores.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 mx-auto text-[var(--color-grey-35)] mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="subtitle-2 text-[var(--color-grey-55)] mb-2">
                    No scores available
                  </p>
                  <p className="caption text-[var(--color-grey-55)]">
                    {submission.status === "submitted"
                      ? 'Click "Trigger AI Scoring" to generate AI scores for this submission'
                      : "Scores will appear here once generated"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Overall AI Feedback Section */}
                  {(submission.ai_overall_summary ||
                    submission.ai_overall_strengths ||
                    submission.ai_priority_improvements) && (
                    <div className="mb-6 dashboard-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                      <div className="flex items-center gap-2 mb-4">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <h3 className="heading-4 text-blue-900">
                          AI Feedback Summary
                        </h3>
                      </div>

                      {/* Overall Summary */}
                      {submission.ai_overall_summary && (
                        <div className="mb-4 pb-4 border-b border-blue-200">
                          <p className="body-2 text-gray-800 leading-relaxed">
                            {submission.ai_overall_summary}
                          </p>
                        </div>
                      )}

                      {/* Strengths */}
                      {submission.ai_overall_strengths &&
                        submission.ai_overall_strengths.length > 0 && (
                          <div className="mb-4 pb-4 border-b border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <svg
                                className="w-4 h-4 text-green-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <h4 className="subtitle-2 text-green-800">
                                Strengths
                              </h4>
                            </div>
                            <ul className="space-y-1 ml-6">
                              {submission.ai_overall_strengths.map(
                                (strength, idx) => (
                                  <li
                                    key={idx}
                                    className="body-2 text-gray-800 flex items-start gap-2"
                                  >
                                    <span className="text-green-600 font-bold mt-0.5">
                                      ✓
                                    </span>
                                    <span>{strength}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                      {/* Areas for Improvement */}
                      {submission.ai_priority_improvements &&
                        submission.ai_priority_improvements.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <svg
                                className="w-4 h-4 text-orange-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <h4 className="subtitle-2 text-orange-800">
                                Areas for Improvement
                              </h4>
                            </div>
                            <ul className="space-y-1 ml-6">
                              {submission.ai_priority_improvements.map(
                                (improvement, idx) => (
                                  <li
                                    key={idx}
                                    className="body-2 text-gray-800 flex items-start gap-2"
                                  >
                                    <span className="text-orange-600 font-bold mt-0.5">
                                      ⚠
                                    </span>
                                    <span>{improvement}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}

                  <div className="space-y-5 mb-6">
                    {scores.map((score) => {
                      const aiAnalysis = (score.ai_feedback_raw ||
                        {}) as Record<string, string | undefined>;

                      return (
                        <div
                          key={score.dimension_id}
                          className="border border-[var(--color-grey-15)] rounded-lg overflow-hidden"
                        >
                          {/* Header with Score and Label */}
                          <div className="bg-[var(--color-grey-05)] p-4 border-b border-[var(--color-grey-15)]">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="subtitle-2 text-gray-900 mb-1">
                                  {score.dimension_label}
                                </h3>
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                <div className="text-right">
                                  <label className="caption text-[var(--color-grey-55)] block mb-1">
                                    Score
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    className="w-20 px-2 py-1 border border-[var(--color-grey-15)] rounded text-sm font-semibold text-center"
                                    value={score.score.toString()}
                                    onChange={(e) =>
                                      handleScoreChange(
                                        score.dimension_id,
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                                <div className="text-gray-400 pt-6">/10</div>
                              </div>
                            </div>

                            {/* Score Change Indicator */}
                            {score.ai_score_original &&
                              score.ai_score_original !== score.score && (
                                <div className="text-xs text-blue-600 flex items-center gap-1">
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Modified from AI score:{" "}
                                  {score.ai_score_original}
                                </div>
                              )}
                          </div>

                          {/* AI Feedback Section */}
                          {(aiAnalysis?.reasoning ||
                            aiAnalysis?.full_analysis) && (
                            <div className="p-4 space-y-3 bg-blue-50 border-b border-[var(--color-grey-15)]">
                              <div className="flex items-center gap-2 mb-2">
                                <svg
                                  className="w-4 h-4 text-blue-600"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <p className="subtitle-2 text-blue-900">
                                  AI Analysis
                                </p>
                              </div>

                              {aiAnalysis?.reasoning && (
                                <div>
                                  <p className="caption text-blue-700 font-medium mb-1">
                                    Reasoning:
                                  </p>
                                  <p className="body-2 text-blue-800">
                                    {aiAnalysis.reasoning}
                                  </p>
                                </div>
                              )}

                              {aiAnalysis?.full_analysis && (
                                <div>
                                  <p className="caption text-blue-700 font-medium mb-1">
                                    Detailed Analysis:
                                  </p>
                                  <div className="bg-white rounded p-2 border border-blue-200">
                                    <p className="body-2 text-gray-700">
                                      {aiAnalysis.full_analysis}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Instructor Comments Section */}
                          <div className="p-4">
                            <label className="subtitle-2 text-gray-900 mb-2 block">
                              Instructor Comments
                            </label>
                            <textarea
                              className="w-full px-3 py-2 border border-[var(--color-grey-15)] rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-ntu)] focus:border-transparent"
                              rows={3}
                              placeholder="Add your feedback and comments for this dimension..."
                              value={score.comments || ""}
                              onChange={(e) =>
                                handleCommentChange(
                                  score.dimension_id,
                                  e.target.value
                                )
                              }
                            />
                            {score.comments && (
                              <p className="text-xs text-[var(--color-grey-55)] mt-1">
                                {score.comments.length} characters
                              </p>
                            )}
                          </div>

                          {/* Override Indicator */}
                          {score.instructor_override && (
                            <div className="bg-blue-50 border-t border-[var(--color-grey-15)] px-4 py-2 flex items-center gap-2">
                              <svg
                                className="w-4 h-4 text-blue-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-xs text-blue-700 font-medium">
                                Instructor modified
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-[var(--color-grey-15)]">
                    <Button
                      variant="blue"
                      onClick={handleSaveReview}
                      disabled={saving}
                      className="flex-1"
                    >
                      {saving ? "Saving..." : "Save Review"}
                    </Button>
                    <Button
                      variant="grey"
                      onClick={() => navigate(-1)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetail;
