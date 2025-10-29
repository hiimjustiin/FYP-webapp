import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { instructorService, type CourseSubmission, type AIAnalysisResult } from '../services/instructorService';
import Button from '../components/ui/Button/Button';
import Table from '../components/ui/Table/Table';
import SearchBar from '../components/ui/SearchBar/SearchBar';

const CourseSubmissions = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<CourseSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<CourseSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scoringSubmissionId, setScoringSubmissionId] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<CourseSubmission | null>(null);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  const fetchSubmissions = React.useCallback(async () => {
    if (!courseId) return;
    
    try {
      const data = await instructorService.getCourseSubmissions(courseId);
      setSubmissions(data);
      setFilteredSubmissions(data);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSubmissions(submissions);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = submissions.filter(
      sub =>
        sub.student_name.toLowerCase().includes(query) ||
        sub.project_title.toLowerCase().includes(query) ||
        sub.status.toLowerCase().includes(query)
    );
    setFilteredSubmissions(filtered);
  }, [searchQuery, submissions]);

  const handleTriggerScoring = async (submissionId: string) => {
    setScoringSubmissionId(submissionId);
    try {
      const result = await instructorService.triggerScoring(submissionId);
      setAiResult(result);
      setSelectedSubmission(submissions.find(s => s.id === submissionId) || null);
      setShowReviewDialog(true);
      // Refresh submissions to get updated status
      await fetchSubmissions();
    } catch (err) {
      console.error('Error triggering scoring:', err);
      alert('Failed to score submission. Please try again.');
    } finally {
      setScoringSubmissionId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      submitted: 'bg-blue-100 text-blue-800',
      scoring: 'bg-yellow-100 text-yellow-800',
      scored: 'bg-green-100 text-green-800',
      reviewed: 'bg-purple-100 text-purple-800',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
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
          <Button 
            variant="grey" 
            onClick={() => navigate('/instructor')}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="heading-3 mb-2">Course Submissions</h1>
          <p className="body text-[var(--color-grey-55)]">
            {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="dashboard-card p-6">
            <div className="caption text-[var(--color-grey-55)] mb-2">Total</div>
            <div className="heading-3 text-[var(--color-blue-ntu)]">{submissions.length}</div>
          </div>
          <div className="dashboard-card p-6">
            <div className="caption text-[var(--color-grey-55)] mb-2">Submitted</div>
            <div className="heading-3 text-blue-600">
              {submissions.filter(s => s.status === 'submitted').length}
            </div>
          </div>
          <div className="dashboard-card p-6">
            <div className="caption text-[var(--color-grey-55)] mb-2">Scored</div>
            <div className="heading-3 text-green-600">
              {submissions.filter(s => s.status === 'scored').length}
            </div>
          </div>
          <div className="dashboard-card p-6">
            <div className="caption text-[var(--color-grey-55)] mb-2">Reviewed</div>
            <div className="heading-3 text-purple-600">
              {submissions.filter(s => s.status === 'reviewed').length}
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="dashboard-card p-6">
          <div className="mb-4">
            <SearchBar
              onSearch={setSearchQuery}
              placeholder="Search by student name, project, or status..."
            />
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="subtitle-2 text-[var(--color-grey-55)] mb-2">
                {searchQuery ? 'No submissions found' : 'No submissions yet'}
              </p>
              <p className="caption text-[var(--color-grey-55)]">
                {searchQuery ? 'Try adjusting your search query' : 'Submissions will appear here once students upload their work'}
              </p>
            </div>
          ) : (
            <Table
              data={[
                ['Student', 'Project', 'File', 'Status', 'Scores', 'Submitted', 'Actions'],
                ...filteredSubmissions.map((row: CourseSubmission) => [
                  <span className="subtitle-2">{row.student_name}</span>,
                  <span className="body-2">{row.project_title}</span>,
                  <span className="caption text-[var(--color-grey-55)]">
                    {row.file_type?.toUpperCase() || 'N/A'}
                  </span>,
                  getStatusBadge(row.status),
                  <span className="body-2">{row.scores_count > 0 ? `${row.scores_count}/9` : 'Not scored'}</span>,
                  <span className="caption text-[var(--color-grey-55)]">
                    {new Date(row.submitted_at).toLocaleDateString()}
                  </span>,
                  <div className="flex gap-2">
                    {row.file_url && (
                      <Button 
                        variant="grey" 
                        onClick={() => window.open(row.file_url, '_blank')}
                      >
                        View
                      </Button>
                    )}
                    {row.status === 'submitted' && (
                      <Button 
                        variant="blue" 
                        onClick={() => handleTriggerScoring(row.id)}
                        disabled={scoringSubmissionId === row.id}
                      >
                        {scoringSubmissionId === row.id ? 'Scoring...' : 'Score'}
                      </Button>
                    )}
                    {(row.status === 'scored' || row.status === 'reviewed') && (
                      <Button 
                        variant="darkBlue" 
                        onClick={() => {
                          setSelectedSubmission(row);
                          setShowReviewDialog(true);
                        }}
                      >
                        Review
                      </Button>
                    )}
                  </div>
                ])
              ]}
            />
          )}
        </div>

        {/* AI Results Dialog */}
        {showReviewDialog && aiResult && selectedSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowReviewDialog(false)}>
            <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="heading-4">AI Scoring Results</h2>
                  <button 
                    onClick={() => setShowReviewDialog(false)}
                    className="text-[var(--color-grey-55)] hover:text-black"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="caption text-[var(--color-grey-55)] mb-1">Student</p>
                    <p className="body-2 font-medium">{selectedSubmission.student_name}</p>
                  </div>
                  <div>
                    <p className="caption text-[var(--color-grey-55)] mb-1">Project</p>
                    <p className="body-2 font-medium">{selectedSubmission.project_title}</p>
                  </div>
                  <div>
                    <p className="caption text-[var(--color-grey-55)] mb-2">Overall Feedback</p>
                    <p className="body-2">{aiResult.overall_feedback}</p>
                  </div>
                  <div>
                    <p className="caption text-[var(--color-grey-55)] mb-2">Dimension Scores</p>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {aiResult.dimension_scores.map((score, idx) => (
                        <div key={idx} className="border border-[var(--color-grey-15)] rounded p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="body-2 font-medium">Dimension {score.dimension_id}</span>
                            <span className="subtitle-2 text-[var(--color-blue-ntu)]">{score.score}/10</span>
                          </div>
                          <p className="caption text-[var(--color-grey-55)]">{score.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="caption text-[var(--color-grey-55)] mb-1">Strengths</p>
                    <ul className="list-disc list-inside body-2 space-y-1">
                      {aiResult.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="caption text-[var(--color-grey-55)] mb-1">Areas for Improvement</p>
                    <ul className="list-disc list-inside body-2 space-y-1">
                      {aiResult.areas_for_improvement.map((area, idx) => (
                        <li key={idx}>{area}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-[var(--color-grey-15)]">
                    <Button 
                      variant="blue" 
                      onClick={() => {
                        setShowReviewDialog(false);
                        // Navigate to detailed review page (Phase 3)
                        navigate(`/instructor/submissions/${selectedSubmission.id}/review`);
                      }}
                    >
                      Review & Override Scores
                    </Button>
                    <Button 
                      variant="grey" 
                      onClick={() => {
                        setShowReviewDialog(false);
                        setAiResult(null);
                        setSelectedSubmission(null);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseSubmissions;
