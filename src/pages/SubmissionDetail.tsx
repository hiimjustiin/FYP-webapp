import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, ArrowLeft, Download, Sparkles, CheckCircle, AlertTriangle, Pencil, FileText } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { instructorService, type Dimension } from "../services/instructorService";
import Button from "../components/ui/Button/Button";

interface SubmissionDetail {
  id: string;
  name: string;
  submitted_at: string;
  status: string;
  file_url: string;
  file_type: string;
  essay_text?: string | null;
  file_urls?: string[] | null;
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
  score: number;
  ai_feedback_raw?: Record<string, unknown>;
}

const SubmissionDetail = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
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
      scored: "bg-purple-100 text-purple-800",
      reviewed: "bg-green-100 text-green-800",
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
            <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={2.5} />
            Back
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
                    <Eye className="w-4 h-4 mr-2" strokeWidth={2.5} />
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
                    <Sparkles className="w-5 h-5 text-blue-600" />
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
                          <CheckCircle className="w-4 h-4 text-green-600" />
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
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
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
                  <Pencil className="w-5 h-5 text-purple-600" />
                  <h3 className="heading-4 text-purple-900">
                    Instructor Suggestions
                  </h3>
                </div>

                {isAdmin ? (
                  /* Read-only view for admins */
                  <div>
                    {submission.instructor_suggestion?.suggestion_text ? (
                      <div>
                        <p className="body-2 text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {submission.instructor_suggestion.suggestion_text}
                        </p>
                        <p className="text-xs text-purple-600 mt-3">
                          Last updated:{" "}
                          {new Date(
                            submission.instructor_suggestion.updated_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <p className="body-2 text-purple-400 italic">
                        No instructor suggestions have been provided yet.
                      </p>
                    )}
                  </div>
                ) : (
                  /* Editable view for instructors */
                  <div>
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
                )}
              </div>
            </div>

            {/* Student Submission Content */}
            {(() => {
              const fileList =
                submission.file_urls && submission.file_urls.length > 0
                  ? submission.file_urls
                  : submission.file_url
                  ? [submission.file_url]
                  : [];
              const hasEssay = Boolean(submission.essay_text?.trim());
              const hasFiles = fileList.length > 0;

              return (
                <div className="dashboard-card p-6 mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-[var(--color-blue-ntu)]" />
                    <h2 className="heading-4">Student Submission</h2>
                  </div>

                  {!hasEssay && !hasFiles && (
                    <p className="body-2 text-[var(--color-grey-55)] italic">
                      No submission content available.
                    </p>
                  )}

                  {hasEssay && (
                    <div className={hasFiles ? 'mb-4 pb-4 border-b border-[var(--color-grey-15)]' : ''}>
                      <p className="caption text-[var(--color-grey-55)] mb-2">Essay / Text</p>
                      <div className="bg-[var(--color-grey-05)] rounded-md p-4 max-h-80 overflow-y-auto">
                        <p className="body-2 text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {submission.essay_text}
                        </p>
                      </div>
                    </div>
                  )}

                  {hasFiles && (
                    <div>
                      <p className="caption text-[var(--color-grey-55)] mb-2">
                        {fileList.length === 1 ? 'File' : 'Files'}
                      </p>
                      <div className="space-y-2">
                        {fileList.map((url, idx) => {
                          const fileName = url.split('/').pop() || `file-${idx + 1}`;
                          return (
                            <Button
                              key={idx}
                              variant="grey"
                              onClick={() => window.open(url, '_blank')}
                              className="w-full justify-start gap-2"
                            >
                              <Download className="w-4 h-4" strokeWidth={2.5} />
                              <span className="truncate">{fileName}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
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
