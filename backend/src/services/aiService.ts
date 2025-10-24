import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export interface DimensionScore {
  dimension_id: number;
  score: number; // 0-10
  reasoning: string;
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

/**
 * Build ILA-specific prompt for OpenAI
 */
function buildILAPrompt(
  content: string,
  projectDescription: string,
  dimensions: Array<{ id: number; label: string }>
): string {
  return `You are an expert educational assessor for the Interdisciplinary Learning Analytics (ILA) program. Your task is to analyze a student project submission and provide comprehensive feedback across multiple dimensions.

**Project Description:**
${projectDescription}

**Submission Content:**
${content.substring(0, 8000)} ${
    content.length > 8000 ? "... [truncated for length]" : ""
  }

**ILA Dimensions to Evaluate (Rate each on a scale of 0-10):**
${dimensions.map((d) => `${d.id}. ${d.label}`).join("\n")}

**Instructions:**
1. Carefully analyze the submission content
2. For each dimension, provide:
   - A score from 0-10 (0=poor, 5=average, 10=excellent)
   - Clear reasoning for the score
3. Identify 3-5 key strengths
4. Identify 3-5 areas for improvement
5. Provide overall constructive feedback

**IMPORTANT:** Return your response as a valid JSON object with this exact structure:
{
  "overall_feedback": "comprehensive feedback paragraph",
  "dimension_scores": [
    {"dimension_id": 1, "score": 7, "reasoning": "explanation for this score"},
    ...
  ],
  "strengths": ["strength 1", "strength 2", ...],
  "areas_for_improvement": ["area 1", "area 2", ...]
}`;
}

export const aiService = {
  /**
   * Analyze a submission file and generate ILA dimension scores
   */
  async analyzeSubmission(
    filePath: string,
    fileType: string,
    projectDescription: string,
    dimensions: Array<{ id: number; label: string }>
  ): Promise<AIAnalysisResult> {
    try {
      // Validate OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY not configured");
      }

      // Extract text from file
      console.log("Extracting text from file...");
      const fileContent = await extractTextFromFile(filePath, fileType);

      if (!fileContent || fileContent.trim().length === 0) {
        throw new Error("No content extracted from file");
      }

      // Build prompt
      const prompt = buildILAPrompt(
        fileContent,
        projectDescription,
        dimensions
      );

      // Call OpenAI API
      console.log("Calling OpenAI API for analysis...");
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content:
              "You are an expert educational assessor specializing in interdisciplinary learning evaluation. Always respond with valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content in OpenAI response");
      }

      const result = JSON.parse(content);

      // Validate response structure
      if (!result.dimension_scores || !Array.isArray(result.dimension_scores)) {
        throw new Error("Invalid response structure from OpenAI");
      }

      return {
        overall_feedback: result.overall_feedback || "No feedback provided",
        dimension_scores: result.dimension_scores,
        strengths: result.strengths || [],
        areas_for_improvement: result.areas_for_improvement || [],
        raw_response: response,
      };
    } catch (error) {
      console.error("AI analysis error:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to analyze submission: ${error.message}`);
      }
      throw new Error("Failed to analyze submission");
    }
  },
};
