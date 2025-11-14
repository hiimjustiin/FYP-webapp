import fs from "fs";

// Python AI service configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export interface DimensionScore {
  dimension_id: number;
  score: number; // 1-3 scale (Pydantic AI)
  reasoning: string;
  strengths: string[];
  improvements: string[];
  examples: string;
}

export interface AIAnalysisResult {
  overall_feedback: string;
  dimension_scores: DimensionScore[];
  strengths: string[];
  areas_for_improvement: string[];
  raw_response: unknown;
}

/**
 * Extract text content from various file types
 * Note: Python service also handles this, but we keep for backward compatibility
 */
async function extractTextFromFile(
  filePath: string,
  fileType: string
): Promise<string> {
  try {
    if (fileType.includes("pdf")) {
      // Extract text from PDF using dynamic import
      const dataBuffer = fs.readFileSync(filePath);
      const pdfParseModule = await import("pdf-parse");
      const pdfParse = pdfParseModule.default as unknown as (
        dataBuffer: Buffer
      ) => Promise<{ text: string }>;
      const pdfData = await pdfParse(dataBuffer);
      return pdfData.text;
    } else if (fileType.includes("text") || fileType.includes("txt")) {
      // Read plain text file
      return fs.readFileSync(filePath, "utf-8");
    } else {
      // For PPT/PPTX, return placeholder (TODO: implement PPT parsing)
      console.warn(
        `File type ${fileType} not fully supported yet. Using basic extraction.`
      );
      return `[File content extraction for ${fileType} - To be implemented]`;
    }
  } catch (error) {
    console.error("Error extracting text from file:", error);
    throw new Error("Failed to extract text from file");
  }
}

export const aiService = {
  /**
   * Analyze a submission using the Python Pydantic AI service
   *
   * This triggers async processing on the Python service. The response will be
   * "processing" status, and the client should poll for results.
   */
  async analyzeSubmission(
    filePath: string,
    fileType: string,
    projectDescription: string,
    dimensions: Array<{ id: number; label: string }>
  ): Promise<AIAnalysisResult> {
    try {
      // Extract text from file
      console.log("Extracting text from file...");
      const fileContent = await extractTextFromFile(filePath, fileType);

      if (!fileContent || fileContent.trim().length === 0) {
        throw new Error("No content extracted from file");
      }

      // Call Python AI service (synchronous for backward compatibility)
      // In production, this should be async with polling
      console.log("Calling Python AI service for analysis...");

      const response = await fetch(`${AI_SERVICE_URL}/api/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submission_id: "temp-id", // Will be replaced with actual submission ID
          project_id: "temp-project",
          course_id: "temp-course",
          user_id: "temp-user",
          essay_text: `${projectDescription}\n\n${fileContent}`,
          file_urls: [], // File already extracted
          reanalyze: false,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI service error: ${error}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "AI service returned failure");
      }

      // Poll for results (simplified - in production use proper async handling)
      console.log("Waiting for AI processing to complete...");
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

      // For now, return a placeholder response structure
      // In production, this should poll the /api/feedback endpoint
      return {
        overall_feedback:
          "AI analysis in progress. Results will be available shortly.",
        dimension_scores: dimensions.map((dim) => ({
          dimension_id: dim.id,
          score: 2, // Placeholder
          reasoning: "Analysis in progress...",
          strengths: ["Processing..."],
          improvements: ["Processing..."],
          examples: "Processing...",
        })),
        strengths: ["Analysis in progress"],
        areas_for_improvement: ["Analysis in progress"],
        raw_response: result,
      };
    } catch (error) {
      console.error("AI analysis error:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to analyze submission: ${error.message}`);
      }
      throw new Error("Failed to analyze submission");
    }
  },

  /**
   * Trigger AI analysis for a submission (new async method)
   *
   * @param submissionId - UUID of the submission
   * @param projectId - UUID of the project
   * @param courseId - UUID of the course
   * @param userId - UUID of the user
   * @param essayText - Essay text content
   * @param fileUrls - Array of file URLs to analyze
   * @returns Promise with processing status
   */
  async triggerAsyncAnalysis(
    submissionId: string,
    projectId: string,
    courseId: string,
    userId: string,
    essayText: string,
    fileUrls: string[] = []
  ): Promise<{ success: boolean; status: string; message: string }> {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submission_id: submissionId,
          project_id: projectId,
          course_id: courseId,
          user_id: userId,
          essay_text: essayText,
          file_urls: fileUrls,
          reanalyze: false,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI service error: ${error}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Failed to trigger AI analysis:", error);
      throw error;
    }
  },

  /**
   * Get AI feedback results for a submission
   *
   * @param submissionId - UUID of the submission
   * @returns Promise with feedback data
   */
  async getFeedback(submissionId: string): Promise<{
    success: boolean;
    submission_id: string;
    processing_status: string;
    dimension_scores?: Array<Record<string, unknown>>;
    overall_feedback?: Record<string, unknown>;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${AI_SERVICE_URL}/api/feedback/${submissionId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch feedback: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Failed to fetch AI feedback:", error);
      throw error;
    }
  },

  /**
   * Re-trigger AI analysis for a submission
   *
   * @param submissionId - UUID of the submission
   * @returns Promise with processing status
   */
  async reanalyzeSubmission(submissionId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(
        `${AI_SERVICE_URL}/api/reanalyze/${submissionId}`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error(`Failed to reanalyze: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Failed to reanalyze submission:", error);
      throw error;
    }
  },
};
