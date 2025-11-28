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
        c.id, c.code, c.title, c.description, c.term, c.passcode,
        COALESCE((SELECT COUNT(DISTINCT user_id)::integer FROM course_enrollments WHERE course_id = c.id AND status = 'active'), 0) as enrolled_count,
        COALESCE((SELECT COUNT(*)::integer FROM project_submissions WHERE course_id = c.id), 0) as submission_count,
        COALESCE((SELECT COUNT(*)::integer FROM project_submissions WHERE course_id = c.id AND status = 'submitted'), 0) as pending_count,
        COALESCE(
          (SELECT array_agg(dimension_id ORDER BY dimension_id) FROM course_dimensions WHERE course_id = c.id),
          ARRAY[]::smallint[]
        ) as dimension_ids
      FROM courses c
      WHERE c.instructor_id = $1
      ORDER BY c.created_at DESC`,
      [req.user?.id]
    );

    // Ensure all count fields are numbers
    const coursesWithNumbers = result.rows.map((row) => ({
      ...row,
      enrolled_count: parseInt(row.enrolled_count, 10),
      submission_count: parseInt(row.submission_count, 10),
      pending_count: parseInt(row.pending_count, 10),
      dimension_ids: row.dimension_ids || [],
    }));

    res.json({ success: true, data: { courses: coursesWithNumbers } });
  } catch (error) {
    console.error("Error fetching instructor courses:", error);
    res
      .status(500)
      .json({ success: false, error: { message: "Failed to fetch courses" } });
  }
};

// POST /api/instructor/courses - Create new course
export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { code, title, description, term, passcode, dimension_ids } =
      req.body;

    if (!code || !title) {
      return res.status(400).json({
        success: false,
        error: { message: "Course code and title are required" },
      });
    }

    const result = await query(
      `INSERT INTO courses (code, title, description, instructor_id, term, passcode)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, $1))
       RETURNING *`,
      [code, title, description, req.user?.id, term, passcode]
    );

    const course = result.rows[0];

    // Handle dimension assignments
    if (
      dimension_ids &&
      Array.isArray(dimension_ids) &&
      dimension_ids.length > 0
    ) {
      // Insert selected dimensions
      for (const dimId of dimension_ids) {
        await query(
          `INSERT INTO course_dimensions (course_id, dimension_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [course.id, dimId]
        );
      }
    } else {
      // Default: assign all dimensions
      await query(
        `INSERT INTO course_dimensions (course_id, dimension_id)
         SELECT $1, id FROM dimensions WHERE is_active = true`,
        [course.id]
      );
    }

    // Fetch the dimension_ids for response
    const dimResult = await query(
      `SELECT array_agg(dimension_id ORDER BY dimension_id) as dimension_ids
       FROM course_dimensions WHERE course_id = $1`,
      [course.id]
    );

    return res.status(201).json({
      success: true,
      data: {
        course: {
          ...course,
          dimension_ids: dimResult.rows[0]?.dimension_ids || [],
        },
      },
    });
  } catch (error) {
    console.error("Error creating course:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to create course" },
    });
  }
};

// PUT /api/instructor/courses/:courseId - Update course
export const updateCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const { code, title, description, term, passcode, dimension_ids } =
      req.body;

    // Verify instructor owns this course
    const courseCheck = await query(
      "SELECT 1 FROM courses WHERE id = $1 AND instructor_id = $2",
      [courseId, req.user?.id]
    );
    if (courseCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ success: false, error: { message: "Access denied" } });
    }

    const updateFields: string[] = [];
    const values: (string | undefined)[] = [];
    let paramCount = 0;

    if (code !== undefined) {
      paramCount++;
      updateFields.push(`code = $${paramCount}`);
      values.push(code);
    }

    if (title !== undefined) {
      paramCount++;
      updateFields.push(`title = $${paramCount}`);
      values.push(title);
    }

    if (description !== undefined) {
      paramCount++;
      updateFields.push(`description = $${paramCount}`);
      values.push(description);
    }

    if (term !== undefined) {
      paramCount++;
      updateFields.push(`term = $${paramCount}`);
      values.push(term);
    }

    if (passcode !== undefined) {
      paramCount++;
      updateFields.push(`passcode = $${paramCount}`);
      values.push(passcode);
    }

    if (updateFields.length === 0 && !dimension_ids) {
      return res.status(400).json({
        success: false,
        error: { message: "No fields to update" },
      });
    }

    let course;
    if (updateFields.length > 0) {
      updateFields.push("updated_at = NOW()");
      paramCount++;
      values.push(courseId as string);

      const result = await query(
        `UPDATE courses SET ${updateFields.join(", ")} WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: { message: "Course not found" },
        });
      }
      course = result.rows[0];
    } else {
      const result = await query("SELECT * FROM courses WHERE id = $1", [
        courseId,
      ]);
      course = result.rows[0];
    }

    // Handle dimension updates if provided
    if (dimension_ids && Array.isArray(dimension_ids)) {
      // Remove existing dimension assignments
      await query("DELETE FROM course_dimensions WHERE course_id = $1", [
        courseId,
      ]);

      // Insert new dimension assignments
      for (const dimId of dimension_ids) {
        await query(
          `INSERT INTO course_dimensions (course_id, dimension_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [courseId, dimId]
        );
      }
    }

    // Fetch the dimension_ids for response
    const dimResult = await query(
      `SELECT array_agg(dimension_id ORDER BY dimension_id) as dimension_ids
       FROM course_dimensions WHERE course_id = $1`,
      [courseId]
    );

    return res.json({
      success: true,
      data: {
        course: {
          ...course,
          dimension_ids: dimResult.rows[0]?.dimension_ids || [],
        },
      },
    });
  } catch (error) {
    console.error("Error updating course:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to update course" },
    });
  }
};

// DELETE /api/instructor/courses/:courseId - Delete course
export const deleteCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;

    // Verify instructor owns this course
    const courseCheck = await query(
      "SELECT 1 FROM courses WHERE id = $1 AND instructor_id = $2",
      [courseId, req.user?.id]
    );
    if (courseCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ success: false, error: { message: "Access denied" } });
    }

    const result = await query(
      "DELETE FROM courses WHERE id = $1 RETURNING id",
      [courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: "Course not found" },
      });
    }

    return res.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to delete course" },
    });
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
    return res.status(500).json({
      success: false,
      error: { message: "Failed to fetch submissions" },
    });
  }
};

// GET /api/instructor/submissions/:submissionId - Get submission details with scores
export const getSubmissionDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params;

    // Get submission details including overall AI feedback
    const submissionResult = await query(
      `SELECT 
        ps.id, ps.name, ps.submitted_at, ps.status, ps.file_url, ps.file_type,
        ps.ai_overall_summary, ps.ai_overall_strengths, ps.ai_priority_improvements,
        u.display_name as student_name, u.email as student_email, u.student_id,
        p.title as project_title, p.description as project_description,
        c.code as course_code, c.title as course_title, c.instructor_id
      FROM project_submissions ps
      JOIN users u ON ps.user_id = u.id
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

    // Verify instructor owns this course (or is admin)
    if (
      req.user?.role !== "admin" &&
      submission.instructor_id !== req.user?.id
    ) {
      return res
        .status(403)
        .json({ success: false, error: { message: "Access denied" } });
    }

    // Get dimension scores if they exist
    const scoresResult = await query(
      `SELECT 
        sds.dimension_id,
        d.label as dimension_label,
        d.color_hex as dimension_color,
        sds.personal_score as score,
        sds.ai_score_original,
        sds.ai_feedback_raw,
        sds.instructor_override,
        sds.instructor_comments
      FROM submission_dimension_scores sds
      JOIN dimensions d ON sds.dimension_id = d.id
      WHERE sds.submission_id = $1
      ORDER BY d.id ASC`,
      [submissionId]
    );

    // Parse AI feedback to extract reasoning and full analysis
    const scores = scoresResult.rows.map((row) => {
      let reasoning = null;
      if (row.ai_feedback_raw) {
        try {
          const feedback = JSON.parse(row.ai_feedback_raw);
          reasoning = feedback.reasoning;
        } catch {
          // Ignore parse errors
        }
      }
      return {
        dimension_id: row.dimension_id,
        dimension_label: row.dimension_label,
        score: parseFloat(row.score),
        reasoning,
        ai_feedback_raw: row.ai_feedback_raw
          ? JSON.parse(row.ai_feedback_raw)
          : null,
        ai_score_original: row.ai_score_original
          ? parseFloat(row.ai_score_original)
          : null,
        instructor_override: row.instructor_override || false,
        instructor_comments: row.instructor_comments,
      };
    });

    return res.json({
      success: true,
      data: {
        submission: {
          id: submission.id,
          name: submission.name,
          submitted_at: submission.submitted_at,
          status: submission.status,
          file_url: submission.file_url,
          file_type: submission.file_type,
          student_name: submission.student_name,
          student_email: submission.student_email,
          student_id: submission.student_id,
          project_title: submission.project_title,
          project_description: submission.project_description,
          course_code: submission.course_code,
          course_title: submission.course_title,
          ai_overall_summary: submission.ai_overall_summary,
          ai_overall_strengths: submission.ai_overall_strengths || null,
          ai_priority_improvements: submission.ai_priority_improvements || null,
        },
        scores,
      },
    });
  } catch (error) {
    console.error("Error fetching submission details:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to fetch submission details" },
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
      return res.status(400).json({
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
      "SELECT id, label, rubric_level_1, rubric_level_2, rubric_level_3 FROM dimensions WHERE is_active = true ORDER BY id ASC"
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

    // Update submission status to 'scored' and store overall AI feedback
    await query(
      `UPDATE project_submissions 
       SET status = $1, 
           ai_overall_summary = $2,
           ai_overall_strengths = $3,
           ai_priority_improvements = $4,
           ai_processing_completed_at = now()
       WHERE id = $5`,
      [
        "scored",
        analysis.overall_feedback,
        JSON.stringify(analysis.strengths),
        JSON.stringify(analysis.areas_for_improvement),
        submissionId,
      ]
    );

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
    return res.status(500).json({
      success: false,
      error: { message: "Failed to upload submission" },
    });
  }
};
