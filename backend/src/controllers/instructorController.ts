import { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { query } from "../models/database.js";
import { aiService } from "../services/aiService.js";
import { notificationService } from "../services/notificationService.js";

// GET /api/instructor/courses
export const getInstructorCourses = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT 
        c.id, c.code, c.title, c.description, c.term,
        COUNT(DISTINCT ce.user_id) as enrolled_count,
        COUNT(DISTINCT ps.id) as submission_count,
        COUNT(DISTINCT CASE WHEN ps.status = 'submitted' THEN ps.id END) as pending_count
      FROM courses c
      LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.status = 'active'
      LEFT JOIN project_submissions ps ON ps.course_id = c.id
      WHERE c.instructor_id = $1
      GROUP BY c.id
      ORDER BY c.created_at DESC`,
      [req.user?.id]
    );

    res.json({ success: true, data: { courses: result.rows } });
  } catch (error) {
    console.error("Error fetching instructor courses:", error);
    res
      .status(500)
      .json({ success: false, error: { message: "Failed to fetch courses" } });
  }
};

// GET /api/instructor/courses/:courseId/students
export const getCourseStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;

    // Verify instructor owns this course (or is admin)
    if (req.user?.role !== "admin") {
      const courseCheck = await query(
        "SELECT 1 FROM courses WHERE id = $1 AND instructor_id = $2",
        [courseId, req.user?.id]
      );
      if (courseCheck.rows.length === 0) {
        return res
          .status(403)
          .json({ success: false, error: { message: "Access denied" } });
      }
    }

    const result = await query(
      `SELECT 
        u.id, u.email, u.display_name, u.student_id, u.department,
        ce.enrolled_at,
        COUNT(DISTINCT ps.id) as submission_count,
        MAX(ps.submitted_at) as last_submission_at
      FROM course_enrollments ce
      JOIN users u ON ce.user_id = u.id
      LEFT JOIN project_submissions ps ON ps.user_id = u.id AND ps.course_id = ce.course_id
      WHERE ce.course_id = $1 AND ce.status = 'active'
      GROUP BY u.id, u.email, u.display_name, u.student_id, u.department, ce.enrolled_at
      ORDER BY u.display_name ASC`,
      [courseId]
    );

    return res.json({ success: true, data: { students: result.rows } });
  } catch (error) {
    console.error("Error fetching course students:", error);
    return res
      .status(500)
      .json({ success: false, error: { message: "Failed to fetch students" } });
  }
};

// GET /api/instructor/courses/:courseId/submissions
export const getCourseSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;

    // Verify instructor owns this course (or is admin)
    if (req.user?.role !== "admin") {
      const courseCheck = await query(
        "SELECT 1 FROM courses WHERE id = $1 AND instructor_id = $2",
        [courseId, req.user?.id]
      );
      if (courseCheck.rows.length === 0) {
        return res
          .status(403)
          .json({ success: false, error: { message: "Access denied" } });
      }
    }

    const result = await query(
      `SELECT 
        ps.id, ps.name, ps.submitted_at, ps.status, ps.file_url, ps.file_type,
        u.display_name as student_name, u.student_id, u.email as student_email,
        p.title as project_title, p.id as project_id,
        COUNT(sds.id) as scores_count
      FROM project_submissions ps
      JOIN users u ON ps.user_id = u.id
      JOIN projects p ON ps.project_id = p.id
      LEFT JOIN submission_dimension_scores sds ON ps.id = sds.submission_id
      WHERE ps.course_id = $1
      GROUP BY ps.id, u.display_name, u.student_id, u.email, p.title, p.id
      ORDER BY ps.submitted_at DESC`,
      [courseId]
    );

    return res.json({ success: true, data: { submissions: result.rows } });
  } catch (error) {
    console.error("Error fetching course submissions:", error);
    return res
      .status(500)
      .json({
        success: false,
        error: { message: "Failed to fetch submissions" },
      });
  }
};

// POST /api/instructor/submissions/:submissionId/score
export const triggerScoring = async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params;

    // Get submission details and verify access
    const submissionResult = await query(
      `SELECT ps.*, p.description as project_description, c.instructor_id
      FROM project_submissions ps
      JOIN projects p ON ps.project_id = p.id
      JOIN courses c ON ps.course_id = c.id
      WHERE ps.id = $1`,
      [submissionId]
    );

    if (submissionResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: { message: "Submission not found" } });
    }

    const submission = submissionResult.rows[0];
    if (
      req.user?.role !== "admin" &&
      submission.instructor_id !== req.user?.id
    ) {
      return res
        .status(403)
        .json({ success: false, error: { message: "Access denied" } });
    }

    if (!submission.file_url) {
      return res
        .status(400)
        .json({
          success: false,
          error: { message: "No file attached to this submission" },
        });
    }

    // Update status to 'scoring'
    await query("UPDATE project_submissions SET status = $1 WHERE id = $2", [
      "scoring",
      submissionId,
    ]);

    // Get dimensions
    const dimensionsResult = await query(
      "SELECT id, label FROM dimensions ORDER BY display_order ASC"
    );

    // Trigger AI analysis
    console.log(`Starting AI analysis for submission ${submissionId}...`);
    const analysis = await aiService.analyzeSubmission(
      submission.file_url,
      submission.file_type || "application/pdf",
      submission.project_description || "",
      dimensionsResult.rows
    );

    // Store scores
    for (const dimScore of analysis.dimension_scores) {
      await query(
        `INSERT INTO submission_dimension_scores 
        (submission_id, dimension_id, personal_score, ai_score_original, ai_feedback_raw, scored_at)
        VALUES ($1, $2, $3, $4, $5, now())
        ON CONFLICT (submission_id, dimension_id) 
        DO UPDATE SET 
          personal_score = $3, 
          ai_score_original = $4, 
          ai_feedback_raw = $5, 
          scored_at = now()`,
        [
          submissionId,
          dimScore.dimension_id,
          dimScore.score,
          dimScore.score,
          JSON.stringify({
            reasoning: dimScore.reasoning,
            full_analysis: analysis,
          }),
        ]
      );
    }

    // Update submission status to 'scored'
    await query("UPDATE project_submissions SET status = $1 WHERE id = $2", [
      "scored",
      submissionId,
    ]);

    // Send notification to student
    await notificationService.notifyScoringComplete(submissionId as string);

    return res.json({
      success: true,
      data: {
        analysis: {
          overall_feedback: analysis.overall_feedback,
          strengths: analysis.strengths,
          areas_for_improvement: analysis.areas_for_improvement,
          dimension_scores: analysis.dimension_scores,
        },
      },
    });
  } catch (error) {
    console.error("Error triggering scoring:", error);
    // Rollback status on error
    await query("UPDATE project_submissions SET status = $1 WHERE id = $2", [
      "submitted",
      req.params.submissionId,
    ]);
    return res.status(500).json({
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Failed to score submission",
      },
    });
  }
};

// PUT /api/instructor/submissions/:submissionId/review
export const reviewSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { dimension_scores } = req.body;

    // Verify access
    const submissionResult = await query(
      `SELECT ps.id, c.instructor_id
      FROM project_submissions ps
      JOIN courses c ON ps.course_id = c.id
      WHERE ps.id = $1`,
      [submissionId]
    );

    if (submissionResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: { message: "Submission not found" } });
    }

    const submission = submissionResult.rows[0];
    if (
      req.user?.role !== "admin" &&
      submission.instructor_id !== req.user?.id
    ) {
      return res
        .status(403)
        .json({ success: false, error: { message: "Access denied" } });
    }

    // Update scores with instructor overrides
    if (dimension_scores && Array.isArray(dimension_scores)) {
      for (const dimScore of dimension_scores) {
        await query(
          `UPDATE submission_dimension_scores 
          SET personal_score = $1, instructor_override = TRUE, instructor_comments = $2, reviewed_at = now()
          WHERE submission_id = $3 AND dimension_id = $4`,
          [
            dimScore.score,
            dimScore.comments || null,
            submissionId,
            dimScore.dimension_id,
          ]
        );
      }
    }

    // Update submission status
    await query("UPDATE project_submissions SET status = $1 WHERE id = $2", [
      "reviewed",
      submissionId,
    ]);

    return res.json({ success: true, message: "Review saved successfully" });
  } catch (error) {
    console.error("Error reviewing submission:", error);
    return res
      .status(500)
      .json({ success: false, error: { message: "Failed to save review" } });
  }
};

// POST /api/instructor/submissions/upload
export const uploadSubmission = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: { message: "No file uploaded" } });
    }

    const { projectId, courseId, name } = req.body;

    if (!projectId || !courseId || !name) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Missing required fields: projectId, courseId, name",
        },
      });
    }

    // Insert submission record
    const result = await query(
      `INSERT INTO project_submissions 
        (project_id, course_id, user_id, name, file_url, file_type, file_size_bytes, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'submitted')
      RETURNING *`,
      [
        projectId,
        courseId,
        req.user?.id,
        name,
        req.file.path,
        req.file.mimetype,
        req.file.size,
      ]
    );

    const submission = result.rows[0];

    // Send notification to instructor
    await notificationService.notifySubmissionReceived(
      submission.id,
      courseId,
      projectId
    );

    return res.json({ success: true, data: { submission } });
  } catch (error) {
    console.error("Error uploading submission:", error);
    return res
      .status(500)
      .json({
        success: false,
        error: { message: "Failed to upload submission" },
      });
  }
};
