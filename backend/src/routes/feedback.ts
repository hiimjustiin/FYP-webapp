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
  async (req: AuthRequest, res: Response) => {
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
        return res.status(404).json({
          success: false,
          error: { message: "Submission not found" },
        });
      }

      const submission = submissionResult.rows[0];

      // Check access: student owns it, instructor teaches course, or admin
      const hasAccess =
        submission.user_id === req.user?.id ||
        submission.instructor_id === req.user?.id ||
        req.user?.role === "admin";

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: { message: "Access denied" },
        });
      }

      // Fetch feedback from Python AI service
      const feedback = await aiService.getFeedback(submissionId!);

      res.json({
        success: true,
        data: feedback,
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
  async (req: AuthRequest, res: Response) => {
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
          return res.status(403).json({
            success: false,
            error: { message: "Access denied" },
          });
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
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: "Validation failed", details: errors.array() },
        });
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
          return res.status(403).json({
            success: false,
            error: { message: "Access denied" },
          });
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
        return res.status(404).json({
          success: false,
          error: { message: "Dimension score not found" },
        });
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
  async (req: AuthRequest, res: Response) => {
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
        return res.status(404).json({
          success: false,
          error: { message: "Submission not found" },
        });
      }

      const submission = submissionResult.rows[0];

      // Check access
      const hasAccess =
        submission.user_id === req.user?.id ||
        submission.instructor_id === req.user?.id ||
        req.user?.role === "admin";

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: { message: "Access denied" },
        });
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
