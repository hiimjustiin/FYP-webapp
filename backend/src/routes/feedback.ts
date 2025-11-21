import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.js";
import type { AuthRequest } from "../middleware/auth.js";
import { query } from "../models/database.js";
import { aiService } from "../services/aiService.js";

const router: Router = Router();

/**
 * GET /api/feedback/submissions/:submissionId
 *
 * Get AI feedback for a submission
 * Accessible by: Student (own submission), Instructor (their course), Admin
 */
router.get(
  "/submissions/:submissionId",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { submissionId } = req.params;

      // Get submission and verify access
      const submissionResult = await query(
        `SELECT ps.*, c.instructor_id
         FROM project_submissions ps
         JOIN courses c ON ps.course_id = c.id
         WHERE ps.id = $1`,
        [submissionId]
      );

      if (submissionResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: { message: "Submission not found" },
        });
        return;
      }

      const submission = submissionResult.rows[0];

      // Check access: student owns it, instructor teaches course, or admin
      const hasAccess =
        submission.user_id === req.user?.id ||
        submission.instructor_id === req.user?.id ||
        req.user?.role === "admin";

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: { message: "Access denied" },
        });
        return;
      }

      // Note: Python AI service stores results in database
      // We fetch directly from our database tables below

      // Transform database data to frontend format
      // The AI service returns: { processing_status, dimension_scores, overall_feedback }
      // But we need to merge submission data from our query with AI results

      // Fetch dimension labels from dimensions table
      const dimensionsResult = await query(
        `SELECT d.id as dimension_id, d.label as dimension_label, d.variant as dimension_variant
         FROM dimensions d
         ORDER BY d.id`
      );

      const dimensionMap = new Map(
        dimensionsResult.rows.map((d) => [d.dimension_id, d])
      );

      // Get dimension scores from submission_dimension_scores table
      const scoresResult = await query(
        `SELECT 
          sds.dimension_id,
          sds.ai_score,
          sds.ai_reasoning,
          sds.ai_strengths,
          sds.ai_improvements,
          sds.ai_examples,
          sds.ai_processing_status,
          sds.personal_score
         FROM submission_dimension_scores sds
         WHERE sds.submission_id = $1
         ORDER BY sds.dimension_id`,
        [submissionId]
      );

      // Combine dimension metadata with scores
      const dimensions = scoresResult.rows.map((score) => {
        const dimInfo = dimensionMap.get(score.dimension_id);
        return {
          ...score,
          dimension_label:
            dimInfo?.dimension_label || `Dimension ${score.dimension_id}`,
          dimension_variant: dimInfo?.dimension_variant || "grey",
        };
      });

      res.json({
        success: true,
        data: {
          submission: {
            id: submission.id,
            project_id: submission.project_id,
            project_title: submission.name, // Using name as project_title
            name: submission.name,
            submitted_at: submission.submitted_at,
            ai_processing_status: submission.ai_processing_status,
            ai_processing_error: submission.ai_processing_error,
            ai_overall_summary: submission.ai_overall_summary,
            ai_overall_strengths: submission.ai_overall_strengths,
            ai_priority_improvements: submission.ai_priority_improvements,
            ai_estimated_level: submission.ai_estimated_level,
            essay_text: submission.essay_text,
            file_urls: submission.file_urls,
          },
          dimensions,
        },
      });
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to fetch feedback" },
      });
    }
  }
);

/**
 * POST /api/feedback/submissions/:submissionId/reanalyze
 *
 * Re-trigger AI analysis for a submission
 * Accessible by: Instructor (their course), Admin
 */
router.post(
  "/submissions/:submissionId/reanalyze",
  authenticate,
  authorize("instructor", "admin"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { submissionId } = req.params;

      // Verify access
      if (req.user?.role !== "admin") {
        const submissionResult = await query(
          `SELECT ps.id
           FROM project_submissions ps
           JOIN courses c ON ps.course_id = c.id
           WHERE ps.id = $1 AND c.instructor_id = $2`,
          [submissionId, req.user?.id]
        );

        if (submissionResult.rows.length === 0) {
          res.status(403).json({
            success: false,
            error: { message: "Access denied" },
          });
          return;
        }
      }

      // Trigger reanalysis on Python AI service
      const result = await aiService.reanalyzeSubmission(submissionId!);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error reanalyzing submission:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to reanalyze submission" },
      });
    }
  }
);

/**
 * PATCH /api/feedback/submissions/:submissionId/dimensions/:dimensionId/override
 *
 * Instructor override for a dimension score
 * Accessible by: Instructor (their course), Admin
 */
router.patch(
  "/submissions/:submissionId/dimensions/:dimensionId/override",
  authenticate,
  authorize("instructor", "admin"),
  [
    body("override_score")
      .isInt({ min: 1, max: 3 })
      .withMessage("Override score must be between 1 and 3"),
    body("comment")
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage("Comment must be between 10 and 500 characters"),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: { message: "Validation failed", details: errors.array() },
        });
        return;
      }

      const { submissionId, dimensionId } = req.params;
      const { override_score, comment } = req.body;

      // Verify access
      if (req.user?.role !== "admin") {
        const submissionResult = await query(
          `SELECT ps.id
           FROM project_submissions ps
           JOIN courses c ON ps.course_id = c.id
           WHERE ps.id = $1 AND c.instructor_id = $2`,
          [submissionId, req.user?.id]
        );

        if (submissionResult.rows.length === 0) {
          res.status(403).json({
            success: false,
            error: { message: "Access denied" },
          });
          return;
        }
      }

      // Apply override in database directly
      const updateResult = await query(
        `UPDATE submission_dimension_scores
         SET instructor_override_score = $1,
             instructor_comment = $2,
             instructor_id = $3,
             overridden_at = NOW()
         WHERE submission_id = $4 AND dimension_id = $5
         RETURNING *`,
        [override_score, comment, req.user?.id, submissionId, dimensionId]
      );

      if (updateResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: { message: "Dimension score not found" },
        });
        return;
      }

      res.json({
        success: true,
        data: { dimension_score: updateResult.rows[0] },
        message: "Override applied successfully",
      });
    } catch (error) {
      console.error("Error applying override:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to apply override" },
      });
    }
  }
);

/**
 * GET /api/feedback/submissions/:submissionId/status
 *
 * Get processing status for a submission
 * Accessible by: Student (own submission), Instructor (their course), Admin
 */
router.get(
  "/submissions/:submissionId/status",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { submissionId } = req.params;

      // Get submission and verify access
      const submissionResult = await query(
        `SELECT ps.ai_processing_status, ps.ai_processing_error, 
                ps.ai_processing_started_at, ps.ai_processing_completed_at,
                ps.user_id, c.instructor_id
         FROM project_submissions ps
         JOIN courses c ON ps.course_id = c.id
         WHERE ps.id = $1`,
        [submissionId]
      );

      if (submissionResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: { message: "Submission not found" },
        });
        return;
      }

      const submission = submissionResult.rows[0];

      // Check access
      const hasAccess =
        submission.user_id === req.user?.id ||
        submission.instructor_id === req.user?.id ||
        req.user?.role === "admin";

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: { message: "Access denied" },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          processing_status: submission.ai_processing_status,
          processing_error: submission.ai_processing_error,
          processing_started_at: submission.ai_processing_started_at,
          processing_completed_at: submission.ai_processing_completed_at,
        },
      });
    } catch (error) {
      console.error("Error fetching status:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to fetch status" },
      });
    }
  }
);

export default router;
