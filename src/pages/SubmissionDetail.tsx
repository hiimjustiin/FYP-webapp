import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { instructorService, type Dimension } from "../services/instructorService";
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
  dimension_ids?: number[];
  ai_overall_summary?: string | null;
  ai_overall_strengths?: string[] | null;
  ai_priority_improvements?: string[] | null;
  instructor_suggestion?: {
    suggestion_text: string;
    updated_at: string;
  } | null;
}

interface DimensionScoreDetail {
  dimension_id: number;
  ai_feedback_raw?: Record<string, unknown>;
}

const SubmissionDetail = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [scores, setScores] = useState<DimensionScoreDetail[]>([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestionText, setSuggestionText] = useState("");
  const [savingSuggestion, setSavingSuggestion] = useState(false);
  const [showRubricDetails, setShowRubricDetails] = useState(false);

  const fetchSubmissionDetails = async () => {
    try {
      setLoading(true);
      const data = await instructorService.getSubmissionDetails(submissionId!);
      setSuggestionText(
        data.submission.instructor_suggestion?.suggestion_text || ""
      );
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

  useEffect(() => {
    const fetchDimensions = async () => {
      try {
        const data = await instructorService.getDimensions();
        setDimensions(data);
      } catch (err) {
        console.error("Error fetching dimensions:", err);
      }
    };

    fetchDimensions();
  }, []);

  const handleSaveSuggestion = async () => {
    if (!suggestionText.trim()) {
      alert("Please enter a suggestion before saving.");
      return;
    }

    try {
      setSavingSuggestion(true);
      await instructorService.upsertSubmissionSuggestion(
        submissionId!,
        suggestionText
      );
      alert("Suggestion saved successfully!");
      await fetchSubmissionDetails();
    } catch (err) {
      console.error("Error saving suggestion:", err);
      alert("Failed to save suggestion. Please try again.");
    } finally {
      setSavingSuggestion(false);
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

  const aiFeedbackAvailable =
    Boolean(submission.ai_overall_summary) ||
    (submission.ai_overall_strengths?.length || 0) > 0 ||
    (submission.ai_priority_improvements?.length || 0) > 0 ||
    scores.some((score) => Boolean(score.ai_feedback_raw));
  const selectedDimensionIds =
    submission.dimension_ids && submission.dimension_ids.length > 0
      ? submission.dimension_ids
      : scores.map((s) => s.dimension_id);
  const scoredScores = scores.filter((s) =>
    selectedDimensionIds.includes(s.dimension_id)
  );
  const displayedDimensionIds =
    selectedDimensionIds.length > 0
      ? selectedDimensionIds
      : scores.map((s) => s.dimension_id);
  const dimensionById = new Map(dimensions.map((dim) => [dim.id, dim]));
  const scoreById = new Map(scores.map((score) => [score.dimension_id, score]));
  const averageScore =
    scoredScores.length > 0
      ? (
          scoredScores.reduce((sum, s) => sum + s.score, 0) /
          scoredScores.length
        ).toFixed(1)
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
                <div>
                  <p className="caption text-[var(--color-grey-55)]">
                    AI Feedback
                  </p>
                  <p className="body-2">
                    {aiFeedbackAvailable ? "Generated" : "Not generated"}
                  </p>
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
                    out of 3
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--color-grey-15)]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="caption text-[var(--color-grey-55)]">
                      Dimensions Scored
                    </p>
                    <Button
                      variant="grey"
                      onClick={() => setShowRubricDetails(true)}
                      className="text-xs px-2 py-1"
                    >
                      View Rubric
                    </Button>
                  </div>
                  <p className="body-2">
                    {scoredScores.length} / {selectedDimensionIds.length}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Guidance */}
          <div className="lg:col-span-2">
            <div className="dashboard-card p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="heading-4">Guidance</h2>
              </div>

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

                  {submission.ai_overall_summary && (
                    <div className="mb-4 pb-4 border-b border-blue-200">
                      <p className="body-2 text-gray-800 leading-relaxed">
                        {submission.ai_overall_summary}
                      </p>
                    </div>
                  )}

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

              <div className="dashboard-card p-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
                <div className="flex items-center gap-2 mb-4">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  <h3 className="heading-4 text-purple-900">
                    Instructor Suggestions
                  </h3>
                </div>

                <div className="mb-3">
                  <label className="caption text-purple-700 font-medium mb-2 block">
                    Overall improvement suggestions for the student
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-purple-200 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                    rows={6}
                    placeholder="Provide constructive feedback and suggestions to help the student improve their work. This will be visible to the student alongside the AI feedback..."
                    value={suggestionText}
                    onChange={(e) => setSuggestionText(e.target.value)}
                    maxLength={5000}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-purple-600">
                      {suggestionText.length} / 5000 characters
                    </p>
                    {submission.instructor_suggestion && (
                      <p className="text-xs text-purple-600">
                        Last updated:{" "}
                        {new Date(
                          submission.instructor_suggestion.updated_at
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  variant="purple"
                  onClick={handleSaveSuggestion}
                  disabled={savingSuggestion || !suggestionText.trim()}
                  className="w-full"
                >
                  {savingSuggestion
                    ? "Saving..."
                    : submission.instructor_suggestion
                    ? "Update Suggestion"
                    : "Save Suggestion"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showRubricDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Rubric Details
                </h2>
                <p className="text-sm text-gray-600">
                  Scores shown only for selected dimensions
                </p>
              </div>
              <Button
                variant="grey"
                onClick={() => setShowRubricDetails(false)}
              >
                Close
              </Button>
            </div>

            {displayedDimensionIds.length === 0 ? (
              <p className="text-sm text-gray-600">No dimensions available.</p>
            ) : (
              <div className="space-y-4">
                {displayedDimensionIds.map((dimensionId) => {
                  const dimension = dimensionById.get(dimensionId);
                  const score = scoreById.get(dimensionId);

                  return (
                    <div
                      key={dimensionId}
                      className="border border-[var(--color-grey-15)] rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <p className="subtitle-2 text-gray-900">
                            {dimension
                              ? dimension.label
                              : `Dimension ${dimensionId}`}
                          </p>
                          {dimension?.description && (
                            <p className="text-xs text-gray-600 mt-1">
                              {dimension.description}
                            </p>
                          )}
                        </div>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-[var(--color-grey-05)] text-gray-700">
                          {score ? `${score.score} / 3` : "Not scored"}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-700">
                            Level 1
                          </p>
                          <p className="text-sm text-gray-700">
                            {dimension?.rubric_level_1 ||
                              "No rubric provided."}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-700">
                            Level 2
                          </p>
                          <p className="text-sm text-gray-700">
                            {dimension?.rubric_level_2 ||
                              "No rubric provided."}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-700">
                            Level 3
                          </p>
                          <p className="text-sm text-gray-700">
                            {dimension?.rubric_level_3 ||
                              "No rubric provided."}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionDetail;
