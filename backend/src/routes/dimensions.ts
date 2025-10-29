import { Router, Response } from "express";
import type { Router as RouterType } from "express";
import { query } from "../models/database.js";
import { authenticate, type AuthRequest } from "../middleware/auth.js";

interface Submission {
  id: string;
  name: string;
  submitted_at: string;
  course_id: string;
  project_name: string;
  project_summary: string;
}

interface DimensionScore {
  submission_id: string;
  dimension_id: number;
  personal_score: number;
  dimension_label: string;
  dimension_variant: string;
  class_avg_score: number | null;
}

// interface FormattedSubmission {
//   id: string;
//   name: string;
//   date: string;
//   scores: Record<string, { personal: number; classAvg: number }>;
// }

const router: RouterType = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/dimensions - List all dimensions
router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      "SELECT id, label, variant, display_order FROM dimensions ORDER BY display_order ASC"
    );

    res.json({
      success: true,
      data: { dimensions: result.rows },
    });
  } catch (error) {
    console.error("Error fetching dimensions:", error);
    res.status(500).json({
      success: false,
      error: { message: "Failed to fetch dimensions" },
    });
  }
});

// GET /api/dimensions/projects/:projectId/submissions - Get all submissions with scores for a project
router.get(
  "/projects/:projectId/submissions",
  async (req: AuthRequest, res: Response) => {
    try {
      const { projectId } = req.params;

      // Get all submissions for the project
      const submissionsResult = await query(
        `SELECT 
        ps.id,
        ps.name,
        ps.submitted_at,
        ps.course_id,
        p.title as project_name,
        p.description as project_summary
      FROM project_submissions ps
      JOIN projects p ON ps.project_id = p.id
      WHERE ps.project_id = $1 AND ps.user_id = $2
      ORDER BY ps.submitted_at ASC`,
        [projectId, req.user?.id]
      );

      if (submissionsResult.rows.length === 0) {
        return res.json({
          success: true,
          data: {
            project: null,
            submissions: [],
          },
        });
      }

      const submissions = submissionsResult.rows;
      const courseId = submissions[0]?.course_id;

      // Get scores for all submissions
      const scoresResult = await query(
        `SELECT 
        sds.submission_id,
        sds.dimension_id,
        sds.personal_score,
        d.label as dimension_label,
        d.variant as dimension_variant,
        (
          SELECT ROUND(AVG(sds2.personal_score)::numeric, 1)
          FROM submission_dimension_scores sds2
          JOIN project_submissions ps2 ON sds2.submission_id = ps2.id
          WHERE ps2.course_id = $1
            AND sds2.dimension_id = sds.dimension_id
        ) as class_avg_score
      FROM submission_dimension_scores sds
      JOIN dimensions d ON sds.dimension_id = d.id
      WHERE sds.submission_id = ANY($2)
      ORDER BY sds.dimension_id ASC`,
        [courseId, submissions.map((s: Submission) => s.id)]
      );

      // Group scores by submission
      const scoresBySubmission: Record<string, DimensionScore[]> = {};
      scoresResult.rows.forEach((score: DimensionScore) => {
        if (!scoresBySubmission[score.submission_id]) {
          scoresBySubmission[score.submission_id] = [];
        }
        scoresBySubmission[score.submission_id]!.push(score);
      });

      // Format submissions with scores
      const formattedSubmissions = submissions.map((submission: Submission) => {
        const scores: Record<string, { personal: number; classAvg: number }> =
          {};
        const submissionScores = scoresBySubmission[submission.id] || [];

        submissionScores.forEach((score: DimensionScore) => {
          scores[score.dimension_id.toString()] = {
            personal: score.personal_score,
            classAvg: score.class_avg_score || 0,
          };
        });

        return {
          id: submission.id,
          name: submission.name,
          date: submission.submitted_at,
          scores,
        };
      });

      return res.json({
        success: true,
        data: {
          project: {
            id: projectId,
            name: submissions[0].project_name,
            summary: submissions[0].project_summary,
            date: submissions[submissions.length - 1].submitted_at, // Use last submission date
          },
          submissions: formattedSubmissions,
        },
      });
    } catch (error) {
      console.error("Error fetching project submissions:", error);
      return res.status(500).json({
        success: false,
        error: { message: "Failed to fetch project submissions" },
      });
    }
  }
);

// GET /api/dimensions/projects - Get all projects with their latest submission info
router.get("/projects", async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT DISTINCT
        p.id,
        p.title as name,
        p.description as summary,
        p.created_at as date,
        (
          SELECT COUNT(*)
          FROM project_submissions ps
          WHERE ps.project_id = p.id AND ps.user_id = $1
        ) as submission_count
      FROM projects p
      WHERE p.owner_id = $1
      ORDER BY p.created_at DESC`,
      [req.user?.id]
    );

    res.json({
      success: true,
      data: { projects: result.rows },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({
      success: false,
      error: { message: "Failed to fetch projects" },
    });
  }
});

export default router;
