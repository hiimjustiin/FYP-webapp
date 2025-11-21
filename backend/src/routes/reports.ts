import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { query } from "../models/database.js";

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/reports/portfolio - Get user's portfolio analytics
router.get("/portfolio", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    // Get all projects where user has made submissions
    const projectsResult = await query(
      `SELECT 
        p.id,
        p.title,
        p.description,
        p.created_at,
        COUNT(DISTINCT ps.id) as submission_count,
        COALESCE(AVG(sds.ai_score), 0) as avg_score,
        MAX(ps.submitted_at) as last_submission
      FROM projects p
      JOIN project_submissions ps ON p.id = ps.project_id AND ps.user_id = $1
      LEFT JOIN submission_dimension_scores sds ON ps.id = sds.submission_id
      GROUP BY p.id
      ORDER BY p.created_at DESC`,
      [userId]
    );

    // Get dimension performance across all projects
    const dimensionsResult = await query(
      `SELECT 
        d.id,
        d.label,
        d.variant,
        COALESCE(AVG(sds.ai_score), 0) as avg_score,
        COUNT(sds.id) as assessment_count,
        MIN(sds.ai_score) as min_score,
        MAX(sds.ai_score) as max_score
      FROM dimensions d
      LEFT JOIN submission_dimension_scores sds ON d.id = sds.dimension_id
      LEFT JOIN project_submissions ps ON sds.submission_id = ps.id
      WHERE ps.user_id = $1
      GROUP BY d.id
      ORDER BY avg_score DESC`,
      [userId]
    );

    // Get recent submissions with status
    const recentSubmissionsResult = await query(
      `SELECT 
        ps.id,
        ps.submitted_at,
        ps.status,
        ps.ai_processing_status,
        p.id as project_id,
        p.title as project_title,
        COALESCE(AVG(sds.ai_score), 0) as avg_score
      FROM project_submissions ps
      JOIN projects p ON ps.project_id = p.id
      LEFT JOIN submission_dimension_scores sds ON ps.id = sds.submission_id
      WHERE ps.user_id = $1
      GROUP BY ps.id, p.id, p.title
      ORDER BY ps.submitted_at DESC
      LIMIT 10`,
      [userId]
    );

    // Get performance over time for timeline
    const timelineResult = await query(
      `SELECT 
        ps.submitted_at,
        d.label as dimension,
        sds.ai_score as score
      FROM project_submissions ps
      JOIN submission_dimension_scores sds ON ps.id = sds.submission_id
      JOIN dimensions d ON sds.dimension_id = d.id
      WHERE ps.user_id = $1
      ORDER BY ps.submitted_at ASC`,
      [userId]
    );

    // Get dimension scores by project (for heatmap)
    const heatmapResult = await query(
      `SELECT 
        p.id as project_id,
        p.title as project_title,
        d.id as dimension_id,
        d.label as dimension_label,
        d.variant,
        COALESCE(AVG(sds.ai_score), 0) as avg_score
      FROM projects p
      CROSS JOIN dimensions d
      JOIN project_submissions ps ON p.id = ps.project_id AND ps.user_id = $1
      LEFT JOIN submission_dimension_scores sds ON ps.id = sds.submission_id AND sds.dimension_id = d.id
      GROUP BY p.id, p.title, d.id, d.label, d.variant
      ORDER BY p.created_at DESC, d.id`,
      [userId]
    );

    // Calculate aggregate statistics
    const totalProjects = projectsResult.rows.length;
    const totalSubmissions = projectsResult.rows.reduce(
      (sum, p) => sum + parseInt(p.submission_count),
      0
    );
    const overallAvgScore =
      projectsResult.rows.length > 0
        ? projectsResult.rows.reduce((sum, p) => sum + parseFloat(p.avg_score), 0) /
          projectsResult.rows.length
        : 0;

    // Find best and worst dimensions
    const bestDimension =
      dimensionsResult.rows.length > 0 ? dimensionsResult.rows[0] : null;
    const worstDimension =
      dimensionsResult.rows.length > 0
        ? dimensionsResult.rows[dimensionsResult.rows.length - 1]
        : null;

    return res.json({
      success: true,
      data: {
        overview: {
          totalProjects,
          totalSubmissions,
          overallAvgScore: Math.round(overallAvgScore * 10) / 10,
          bestDimension: bestDimension
            ? {
                label: bestDimension.label,
                score: Math.round(parseFloat(bestDimension.avg_score) * 10) / 10,
              }
            : null,
          worstDimension: worstDimension
            ? {
                label: worstDimension.label,
                score: Math.round(parseFloat(worstDimension.avg_score) * 10) / 10,
              }
            : null,
        },
        projects: projectsResult.rows.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          submissionCount: parseInt(p.submission_count),
          avgScore: Math.round(parseFloat(p.avg_score) * 10) / 10,
          lastSubmission: p.last_submission,
        })),
        dimensions: dimensionsResult.rows.map((d) => ({
          id: d.id,
          label: d.label,
          variant: d.variant,
          avgScore: Math.round(parseFloat(d.avg_score) * 10) / 10,
          assessmentCount: parseInt(d.assessment_count),
          minScore: parseFloat(d.min_score),
          maxScore: parseFloat(d.max_score),
        })),
        recentSubmissions: recentSubmissionsResult.rows.map((s) => ({
          id: s.id,
          projectId: s.project_id,
          projectTitle: s.project_title,
          submittedAt: s.submitted_at,
          status: s.status,
          aiProcessingStatus: s.ai_processing_status,
          avgScore: Math.round(parseFloat(s.avg_score) * 10) / 10,
        })),
        timeline: timelineResult.rows.map((t) => ({
          date: t.submitted_at,
          dimension: t.dimension,
          score: parseFloat(t.score),
        })),
        heatmap: heatmapResult.rows.map((h) => ({
          projectId: h.project_id,
          projectTitle: h.project_title,
          dimensionId: h.dimension_id,
          dimensionLabel: h.dimension_label,
          variant: h.variant,
          score: Math.round(parseFloat(h.avg_score) * 10) / 10,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching portfolio analytics:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to fetch portfolio analytics" },
    });
  }
});

export default router;
