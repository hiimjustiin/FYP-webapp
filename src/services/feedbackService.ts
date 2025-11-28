/**
 * Feedback Service - Interface with backend for AI evaluation results
 */
import { api } from "../lib/api";

export interface DimensionScore {
  dimension_id: number;
  dimension_label: string;
  dimension_color: string;
  ai_score?: number; // 1-3 scale
  ai_reasoning?: string;
  ai_strengths?: string[];
  ai_improvements?: string[];
  ai_examples?: string;
  ai_processing_status: string;
  personal_score: number;
}

export interface Submission {
  id: string;
  project_id: string;
  project_title: string;
  name: string;
  submitted_at: string;
  ai_processing_status: string;
  ai_processing_error?: string;
  ai_overall_summary?: string;
  ai_overall_strengths?: string[];
  ai_priority_improvements?: string[];
  ai_estimated_level?: string;
  essay_text?: string;
  file_urls?: string[];
}

export interface FeedbackResponse {
  submission: Submission;
  dimensions: DimensionScore[];
}

export const feedbackService = {
  /**
   * Get AI feedback for a submission from backend
   * @param submissionId - UUID of the project submission
   */
  async getFeedback(submissionId: string): Promise<FeedbackResponse> {
    try {
      // api.get already unwraps data.data, so we get FeedbackResponse directly
      const data = await api.get<FeedbackResponse>(
        `/projects/submissions/${submissionId}/feedback`
      );
      return data;
    } catch (error) {
      console.error("Error fetching feedback:", error);
      throw error;
    }
  },

  /**
   * Poll for feedback with exponential backoff
   * @param submissionId - UUID of the project submission
   * @param onUpdate - Callback for status updates
   * @param maxAttempts - Maximum polling attempts (default: 30)
   */
  async pollForFeedback(
    submissionId: string,
    onUpdate: (status: string, data?: FeedbackResponse) => void,
    maxAttempts = 30
  ): Promise<FeedbackResponse | null> {
    let attempts = 0;
    const baseDelay = 2000; // Start with 2 seconds

    while (attempts < maxAttempts) {
      try {
        const data = await this.getFeedback(submissionId);

        onUpdate(data.submission.ai_processing_status, data);

        // If completed or failed, return result
        if (
          data.submission.ai_processing_status === "completed" ||
          data.submission.ai_processing_status === "failed"
        ) {
          return data;
        }

        // Calculate delay with exponential backoff (max 10 seconds)
        const delay = Math.min(baseDelay * Math.pow(1.5, attempts), 10000);

        // Wait before next attempt
        await new Promise((resolve) => setTimeout(resolve, delay));

        attempts++;
      } catch (error) {
        console.error(`Polling attempt ${attempts + 1} failed:`, error);
        attempts++;

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, baseDelay));
      }
    }

    // Max attempts reached
    onUpdate("timeout");
    return null;
  },
};
