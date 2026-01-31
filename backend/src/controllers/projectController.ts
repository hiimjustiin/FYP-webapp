import { Response } from "express";
import { body, validationResult } from "express-validator";
import { query } from "../models/database.js";
import type { Project } from "../models/Project.js";
import { AuthRequest } from "../middleware/auth.js";

/**
 * Generate full URL for uploaded files that AI service can access
 * In Docker: uses INTERNAL_BACKEND_URL (http://backend:3001)
 * In dev: uses localhost
 */
const getFileUrl = (filename: string): string => {
  const baseUrl = process.env.INTERNAL_BACKEND_URL || "http://localhost:3001";
  return `${baseUrl}/uploads/${filename}`;
};

export const createProjectValidation = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
  body("status")
    .optional()
    .isIn([
      "Draft",
      "Submitted",
      "Completed",
      "active",
      "completed",
      "archived",
    ])
    .withMessage("Invalid status"),
  body("course_code")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Course code cannot exceed 50 characters"),
  body("submission_date")
    .optional()
    .isISO8601()
    .withMessage("Invalid submission date format"),
  body("interq_score").optional().isString(),
];

export const updateProjectValidation = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
  body("status")
    .optional()
    .isIn([
      "Draft",
      "Submitted",
      "Completed",
      "active",
      "completed",
      "archived",
    ])
    .withMessage("Invalid status"),
  body("course_code")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Course code cannot exceed 50 characters"),
  body("submission_date")
    .optional()
    .isISO8601()
    .withMessage("Invalid submission date format"),
  body("interq_score").optional().isString(),
];

// Get all projects for current user
export const getProjects = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    // Get projects with latest submission AI status and average score
    const projectsResult = await query(
      `SELECT 
         p.*, 
         u.display_name as owner_name,
         latest_sub.ai_processing_status,
         latest_sub.ai_processing_error,
         latest_sub.avg_ai_score as interq_score
       FROM projects p
       LEFT JOIN users u ON p.owner_id = u.id
       LEFT JOIN LATERAL (
         SELECT 
           ps.ai_processing_status,
           ps.ai_processing_error,
           (
             SELECT AVG(sds.ai_score)::numeric(3,2)
             FROM submission_dimension_scores sds 
             WHERE sds.submission_id = ps.id AND sds.ai_score IS NOT NULL
           ) as avg_ai_score
         FROM project_submissions ps
         WHERE ps.project_id = p.id
         ORDER BY ps.submitted_at DESC
         LIMIT 1
       ) latest_sub ON true
       WHERE p.owner_id = $1 OR p.id IN (
         SELECT pm.project_id FROM project_members pm WHERE pm.user_id = $1
       )
       ORDER BY p.updated_at DESC`,
      [req.user.id]
    );

    // Get all members for these projects
    const projectIds = projectsResult.rows.map((p) => p.id);
    let membersData: {
      project_id: string;
      user_id: string;
      role: string;
      email: string;
      display_name: string;
    }[] = [];

    if (projectIds.length > 0) {
      const membersResult = await query(
        `SELECT pm.project_id, pm.user_id, pm.role, u.email, u.display_name
         FROM project_members pm
         LEFT JOIN users u ON pm.user_id = u.id
         WHERE pm.project_id = ANY($1)`,
        [projectIds]
      );
      membersData = membersResult.rows;
    }

    // Group members by project
    const membersByProject = membersData.reduce((acc, member) => {
      if (!acc[member.project_id]) {
        acc[member.project_id] = [];
      }
      acc[member.project_id]!.push(member);
      return acc;
    }, {} as Record<string, typeof membersData>);

    // Attach members to projects and normalize interq_score
    // For group projects, include the owner in the members list
    const projects = projectsResult.rows.map((project) => {
      const projectMembers = membersByProject[project.id] || [];
      
      // For group projects, include owner as part of the members display
      // Owner is included with role 'owner' so frontend can identify them
      if (project.project_type === "group") {
        const ownerAsMember = {
          project_id: project.id,
          user_id: project.owner_id,
          role: "owner",
          email: "", // Owner email not fetched in main query, but display_name is
          display_name: project.owner_name || "Owner",
        };
        // Add owner at the beginning of members list
        projectMembers.unshift(ownerAsMember);
      }
      
      return {
        ...project,
        members: projectMembers,
        // Ensure interq_score is a number or null
        interq_score: project.interq_score
          ? parseFloat(project.interq_score)
          : null,
      };
    });

    res.json({
      success: true,
      data: { projects },
    });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};

// Get project by ID
export const getProject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const { id } = req.params;

    // Check if user has access to project
    const result = await query(
      `SELECT p.*, u.display_name as owner_name
       FROM projects p
       LEFT JOIN users u ON p.owner_id = u.id
       WHERE p.id = $1 AND (
         p.owner_id = $2 OR p.id IN (
           SELECT pm.project_id FROM project_members pm WHERE pm.user_id = $2
         )
       )`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: "Project not found or access denied" },
      });
      return;
    }

    // Get project members
    const membersResult = await query(
      `SELECT pm.*, u.email, u.display_name
       FROM project_members pm
       LEFT JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1`,
      [id]
    );

    const project = result.rows[0];
    project.members = membersResult.rows;

    // Include latest submission id for feedback lookups
    let latestSubmissionId: string | null = null;
    if (project.status === "Submitted" || project.status === "Completed") {
      const submissionResult = await query(
        `SELECT id FROM project_submissions
         WHERE project_id = $1 AND user_id = $2
         ORDER BY submitted_at DESC
         LIMIT 1`,
        [id, req.user.id]
      );
      if (submissionResult.rows.length > 0) {
        latestSubmissionId = submissionResult.rows[0].id;
      }
    }

    res.json({
      success: true,
      data: {
        project: {
          ...project,
          latest_submission_id: latestSubmissionId,
        },
      },
    });
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};

// Create new project
export const createProject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    // Parse form data (sent as multipart/form-data with files)
    const {
      title,
      description,
      course_id,
      project_type = "individual",
      essay_text,
      member_ids, // JSON string array of user IDs
    } = req.body;

    // Status is always "Processing" on creation (no more Draft)
    const status = "Processing";

    const uploadedFiles = Array.isArray(req.files)
      ? (req.files as Express.Multer.File[])
      : [];

    console.log("📝 Project creation request received:", {
      title,
      course_id,
      project_type,
      essay_text: essay_text ? `[${essay_text.length} chars]` : "none",
      has_files: uploadedFiles.length > 0,
    });

    // Validate required fields
    if (!title || !title.trim()) {
      console.error("❌ Validation error: Title is required");
      res.status(400).json({
        success: false,
        error: { message: "Title is required" },
      });
      return;
    }

    if (!course_id) {
      console.error("❌ Validation error: Course is required");
      res.status(400).json({
        success: false,
        error: { message: "Course is required" },
      });
      return;
    }

    // Parse member_ids if provided
    let memberIds: string[] = [];
    if (member_ids) {
      try {
        memberIds = JSON.parse(member_ids);
        if (!Array.isArray(memberIds)) {
          throw new Error("member_ids must be an array");
        }
      } catch {
        res.status(400).json({
          success: false,
          error: { message: "Invalid member_ids format" },
        });
        return;
      }
    }

    // Validate project type
    if (project_type !== "individual" && project_type !== "group") {
      res.status(400).json({
        success: false,
        error: { message: "Project type must be 'individual' or 'group'" },
      });
      return;
    }

    // For group projects, validate that owner and all members are enrolled in the course
    if (project_type === "group" && memberIds.length > 0) {
      const allUserIds = [req.user.id, ...memberIds];
      const enrollmentCheck = await query(
        `SELECT user_id FROM course_enrollments 
         WHERE course_id = $1 AND user_id = ANY($2) AND status = 'active'`,
        [course_id, allUserIds]
      );

      if (enrollmentCheck.rows.length !== allUserIds.length) {
        res.status(400).json({
          success: false,
          error: {
            message: "All team members must be enrolled in the selected course",
          },
        });
        return;
      }
    } else if (project_type === "individual") {
      // Verify owner is enrolled in course
      const enrollmentCheck = await query(
        `SELECT user_id FROM course_enrollments 
         WHERE course_id = $1 AND user_id = $2 AND status = 'active'`,
        [course_id, req.user.id]
      );

      if (enrollmentCheck.rows.length === 0) {
        res.status(403).json({
          success: false,
          error: { message: "You must be enrolled in this course" },
        });
        return;
      }
    }

    // Start transaction
    await query("BEGIN");

    try {
      // Create project
      const projectResult = await query(
        `INSERT INTO projects (
          title, description, owner_id, status, course_id, 
          project_type, essay_text
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          title.trim(),
          description || null,
          req.user.id,
          status,
          course_id,
          project_type,
          essay_text || null,
        ]
      );

      const project = projectResult.rows[0] as Project;

      // Add team members for group projects
      if (project_type === "group" && memberIds.length > 0) {
        for (const memberId of memberIds) {
          await query(
            `INSERT INTO project_members (project_id, user_id, role)
             VALUES ($1, $2, $3)`,
            [project.id, memberId, "member"]
          );
        }
      }

      // Handle file uploads if any
      const fileUrls: string[] = [];
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          await query(
            `INSERT INTO project_files (
              project_id, file_name, file_url, file_type, 
              file_size, uploaded_by
            )
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              project.id,
              file.originalname,
              file.filename, // Stored filename on disk
              file.mimetype,
              file.size,
              req.user.id,
            ]
          );
          fileUrls.push(file.filename);
        }
      }

      // Validate project has content for AI evaluation
      const hasEssayText = essay_text && essay_text.trim().length > 0;
      if (!hasEssayText && fileUrls.length === 0) {
        await query("ROLLBACK");
        res.status(400).json({
          success: false,
          error: {
            message:
              "Project must have essay text or uploaded files to be evaluated",
          },
        });
        return;
      }

      // Create submission record for AI evaluation
      const crypto = await import("crypto");
      const contentForHash = JSON.stringify({
        essay: essay_text || "",
        files: [...fileUrls].sort(),
      });
      const contentHash = crypto
        .createHash("sha256")
        .update(contentForHash)
        .digest("hex");

      const submissionResult = await query(
        `INSERT INTO project_submissions (
          project_id, course_id, user_id, name, submitted_at,
          essay_text, file_urls, content_hash, ai_processing_status,
          iteration_number
        )
        VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, 'pending', 1)
        RETURNING id`,
        [
          project.id,
          course_id,
          req.user.id,
          "Submission 1",
          essay_text || null,
          JSON.stringify(fileUrls),
          contentHash,
        ]
      );

      const submissionId = submissionResult.rows[0].id;

      await query("COMMIT");

      // Trigger AI evaluation asynchronously (don't wait for response)
      const AI_SERVICE_URL =
        process.env.AI_SERVICE_URL || "http://backend-ai:8000";
      const essayTextForAI = hasEssayText
        ? essay_text
        : "[No essay text provided. Analysis based on uploaded files.]";

      // Convert filenames to full URLs for AI service
      const fileUrlsForAI = fileUrls.map((filename) => getFileUrl(filename));
      console.log("📤 Sending files to AI service:", fileUrlsForAI);

      fetch(`${AI_SERVICE_URL}/api/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submission_id: submissionId,
          project_id: project.id,
          course_id: course_id,
          user_id: req.user.id,
          essay_text: essayTextForAI,
          file_urls: fileUrlsForAI,
          reanalyze: false,
        }),
      }).catch((error) => {
        console.error("Failed to trigger AI evaluation:", error);
        // Update submission and project status to failed
        query(
          `UPDATE project_submissions 
           SET ai_processing_status = 'failed', 
               ai_processing_error = $1 
           WHERE id = $2`,
          ["Failed to connect to AI service", submissionId]
        ).catch((err) =>
          console.error("Failed to update submission status:", err)
        );

        query(`UPDATE projects SET status = 'Failed' WHERE id = $1`, [
          project.id,
        ]).catch((err) =>
          console.error("Failed to update project status:", err)
        );
      });

      // Fetch complete project with members
      const membersResult = await query(
        `SELECT pm.*, u.email, u.display_name
         FROM project_members pm
         LEFT JOIN users u ON pm.user_id = u.id
         WHERE pm.project_id = $1`,
        [project.id]
      );

      const completeProject = {
        ...project,
        members: membersResult.rows,
        latest_submission_id: submissionId,
      };

      res.status(201).json({
        success: true,
        data: {
          project: completeProject,
          submission_id: submissionId,
          message: "Project created and submitted for AI evaluation.",
        },
      });
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    interface DatabaseError extends Error {
      detail?: string;
    }
    const typedError = error as DatabaseError;
    console.error("Create project error:", {
      message: typedError?.message,
      detail: typedError?.detail,
      errorObj: error,
    });
    res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
        debug:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
    });
  }
};

// Update project
export const updateProject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: { message: "Validation failed", details: errors.array() },
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const { id } = req.params;
    const updates = req.body as Record<string, unknown>;

    // Check if user owns the project
    const existingProject = await query(
      "SELECT owner_id, course_id, project_type FROM projects WHERE id = $1",
      [id]
    );

    if (existingProject.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: "Project not found" },
      });
      return;
    }

    const project = existingProject.rows[0];

    if (project.owner_id !== req.user.id) {
      res.status(403).json({
        success: false,
        error: { message: "Permission denied" },
      });
      return;
    }

    // Handle member_ids separately if provided (for group projects)
    const memberIds = updates.member_ids as string[] | undefined;
    delete updates.member_ids; // Remove from updates to avoid putting in project table

    if (memberIds !== undefined) {
      if (project.project_type !== "group") {
        res.status(400).json({
          success: false,
          error: { message: "Cannot add members to individual projects" },
        });
        return;
      }

      // Validate all members are enrolled in the course
      if (memberIds.length > 0) {
        const enrollmentCheck = await query(
          `SELECT user_id FROM course_enrollments 
           WHERE course_id = $1 AND user_id = ANY($2) AND status = 'active'`,
          [project.course_id, memberIds]
        );

        if (enrollmentCheck.rows.length !== memberIds.length) {
          res.status(400).json({
            success: false,
            error: {
              message:
                "All team members must be enrolled in the course",
            },
          });
          return;
        }
      }

      // Sync project_members: remove those not in list, add those in list
      // First, get current members (excluding owner)
      const currentMembers = await query(
        `SELECT user_id FROM project_members WHERE project_id = $1`,
        [id]
      );
      const currentMemberIds = currentMembers.rows.map(
        (r: { user_id: string }) => r.user_id
      );

      // Members to remove
      const membersToRemove = currentMemberIds.filter(
        (mId: string) => !memberIds.includes(mId)
      );
      // Members to add
      const membersToAdd = memberIds.filter(
        (mId) => !currentMemberIds.includes(mId) && mId !== project.owner_id
      );

      // Remove members
      if (membersToRemove.length > 0) {
        await query(
          `DELETE FROM project_members 
           WHERE project_id = $1 AND user_id = ANY($2)`,
          [id, membersToRemove]
        );
      }

      // Add new members
      for (const memberId of membersToAdd) {
        await query(
          `INSERT INTO project_members (project_id, user_id, role)
           VALUES ($1, $2, 'member')
           ON CONFLICT (project_id, user_id) DO NOTHING`,
          [id, memberId]
        );
      }

      console.log(
        `✅ Team members updated for project ${id}: removed ${membersToRemove.length}, added ${membersToAdd.length}`
      );
    }

    // Build update query dynamically for other fields
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (updates.title !== undefined) {
      updateFields.push(`title = $${paramCount}`);
      values.push(updates.title);
      paramCount++;
    }

    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramCount}`);
      values.push(updates.description);
      paramCount++;
    }

    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramCount}`);
      values.push(updates.status);
      paramCount++;
    }

    if (updates.settings !== undefined) {
      updateFields.push(`settings = $${paramCount}`);
      values.push(JSON.stringify(updates.settings));
      paramCount++;
    }

    if (updates.course_code !== undefined) {
      updateFields.push(`course_code = $${paramCount}`);
      values.push(updates.course_code);
      paramCount++;
    }

    if (updates.submission_date !== undefined) {
      updateFields.push(`submission_date = $${paramCount}`);
      values.push(updates.submission_date);
      paramCount++;
    }

    if (updates.interq_score !== undefined) {
      updateFields.push(`interq_score = $${paramCount}`);
      values.push(updates.interq_score);
      paramCount++;
    }

    // If only member_ids were updated and no other fields
    if (updateFields.length === 0 && memberIds !== undefined) {
      // Just fetch and return the project with updated members
      const projectResult = await query(
        `SELECT p.* FROM projects p WHERE p.id = $1`,
        [id]
      );

      const membersResult = await query(
        `SELECT pm.*, u.email, u.display_name
         FROM project_members pm
         LEFT JOIN users u ON pm.user_id = u.id
         WHERE pm.project_id = $1`,
        [id]
      );

      res.json({
        success: true,
        data: {
          project: {
            ...projectResult.rows[0],
            members: membersResult.rows,
          },
        },
      });
      return;
    }

    if (updateFields.length === 0) {
      res.status(400).json({
        success: false,
        error: { message: "No valid fields to update" },
      });
      return;
    }

    updateFields.push(`updated_at = now()`);
    values.push(id);

    const result = await query(
      `UPDATE projects SET ${updateFields.join(
        ", "
      )} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    // Also fetch members if it's a group project
    let members: unknown[] = [];
    if (project.project_type === "group") {
      const membersResult = await query(
        `SELECT pm.*, u.email, u.display_name
         FROM project_members pm
         LEFT JOIN users u ON pm.user_id = u.id
         WHERE pm.project_id = $1`,
        [id]
      );
      members = membersResult.rows;
    }

    res.json({
      success: true,
      data: {
        project: {
          ...result.rows[0],
          members,
        },
      },
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};

// Delete project
export const deleteProject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const { id } = req.params;

    // Check if user owns the project
    const result = await query(
      "DELETE FROM projects WHERE id = $1 AND owner_id = $2 RETURNING id",
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: "Project not found or permission denied" },
      });
      return;
    }

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};

// Submit project for AI evaluation
export const submitProject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const { id } = req.params;

    // Check if user has access to project
    const projectResult = await query(
      `SELECT p.*, u.display_name as owner_name
       FROM projects p
       LEFT JOIN users u ON p.owner_id = u.id
       WHERE p.id = $1 AND (
         p.owner_id = $2 OR p.id IN (
           SELECT pm.project_id FROM project_members pm WHERE pm.user_id = $2
         )
       )`,
      [id, req.user.id]
    );

    if (projectResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: "Project not found or access denied" },
      });
      return;
    }

    const project = projectResult.rows[0];

    // Only allow submission if project is in Draft status
    if (project.status !== "Draft") {
      res.status(400).json({
        success: false,
        error: {
          message: `Project cannot be submitted. Current status: ${project.status}`,
        },
      });
      return;
    }

    // Check if project has content (essay_text or files)
    const filesResult = await query(
      `SELECT COUNT(*) as file_count FROM project_files WHERE project_id = $1`,
      [id]
    );

    const fileCount = parseInt(filesResult.rows[0].file_count);
    const hasEssayText =
      project.essay_text && project.essay_text.trim().length > 0;

    if (!hasEssayText && fileCount === 0) {
      res.status(400).json({
        success: false,
        error: {
          message:
            "Project must have essay text or uploaded files to be submitted",
        },
      });
      return;
    }

    // Start transaction
    await query("BEGIN");

    let submissionId: string;

    try {
      console.log(`[Submit] Starting submission for project ${id}`);

      // Update project status to Submitted
      await query(
        `UPDATE projects SET status = 'Submitted', updated_at = NOW() WHERE id = $1`,
        [id]
      );
      console.log(`[Submit] Project status updated to Submitted`);

      // Get project files for AI analysis
      const filesData = await query(
        `SELECT file_name, file_url, file_type FROM project_files WHERE project_id = $1`,
        [id]
      );
      const fileUrls = filesData.rows.map(
        (fileRow: { file_url: string }) => fileRow.file_url
      );
      console.log(`[Submit] Found ${fileUrls.length} files`);

      // Create project_submissions record
      console.log(`[Submit] Creating submission record...`);
      const submissionResult = await query(
        `INSERT INTO project_submissions (
          project_id, course_id, user_id, name, submitted_at, iteration_number
        )
        VALUES ($1, $2, $3, $4, NOW(), 1)
        RETURNING id`,
        [id, project.course_id, req.user.id, "Submission 1"]
      );

      submissionId = submissionResult.rows[0].id;
      console.log(`[Submit] Submission created with ID: ${submissionId}`);

      // Update with AI-specific fields
      const crypto = await import("crypto");
      const contentForHash = JSON.stringify({
        essay: project.essay_text || "",
        files: [...fileUrls].sort(),
      });
      const contentHash = crypto
        .createHash("sha256")
        .update(contentForHash)
        .digest("hex");

      console.log(`[Submit] Updating AI-specific fields...`);
      await query(
        `UPDATE project_submissions 
         SET essay_text = $1, 
             file_urls = $2, 
             content_hash = $3,
             ai_processing_status = 'pending'
         WHERE id = $4`,
        [
          project.essay_text || null,
          JSON.stringify(fileUrls),
          contentHash,
          submissionId,
        ]
      );
      console.log(`[Submit] AI fields updated successfully`);

      await query("COMMIT");
      console.log(`[Submit] Transaction committed successfully`);

      // Trigger AI evaluation asynchronously (don't wait for response)
      const AI_SERVICE_URL =
        process.env.AI_SERVICE_URL || "http://backend-ai:8000";

      // Prepare essay text - use placeholder if empty to meet AI service expectations
      const essayText =
        project.essay_text && project.essay_text.trim().length > 0
          ? project.essay_text
          : "[No essay text provided. Analysis based on uploaded files.]";

      // Convert filenames to full URLs for AI service
      const fileUrlsForAI = fileUrls.map((filename: string) =>
        getFileUrl(filename)
      );
      console.log("📤 Sending files to AI service:", fileUrlsForAI);

      fetch(`${AI_SERVICE_URL}/api/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submission_id: submissionId,
          project_id: id,
          course_id: project.course_id,
          user_id: req.user.id,
          essay_text: essayText,
          file_urls: fileUrlsForAI,
          reanalyze: false,
        }),
      }).catch((error) => {
        console.error("Failed to trigger AI evaluation:", error);
        // Try to update submission status to failed
        query(
          `UPDATE project_submissions 
           SET ai_processing_status = 'failed', 
               ai_processing_error = $1 
           WHERE id = $2`,
          ["Failed to connect to AI service", submissionId]
        ).catch((err) =>
          console.error("Failed to update submission status:", err)
        );
      });

      res.json({
        success: true,
        data: {
          project: {
            ...project,
            status: "Submitted",
          },
          submission_id: submissionId,
          message:
            "Project submitted successfully. AI evaluation is in progress.",
        },
      });
    } catch (error) {
      console.error(`[Submit] Transaction error - rolling back:`, error);
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Submit project error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};

/**
 * Get all submissions for a project
 */
export const getProjectSubmissions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const { id } = req.params;

    // Check if user has access to project
    const projectCheck = await query(
      `SELECT p.id FROM projects p
       WHERE p.id = $1 AND (
         p.owner_id = $2 OR p.id IN (
           SELECT pm.project_id FROM project_members pm WHERE pm.user_id = $2
         )
       )`,
      [id, req.user.id]
    );

    if (projectCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: "Project not found or access denied" },
      });
      return;
    }

    // Get all submissions for this project ordered by iteration
    const submissionsResult = await query(
      `SELECT 
        ps.id,
        ps.name,
        ps.iteration_number,
        ps.submitted_at,
        ps.ai_processing_status,
        ps.ai_overall_summary,
        ps.ai_estimated_level,
        ps.previous_submission_id,
        ps.comparison_analysis,
        (
          SELECT AVG(sds.ai_score)::numeric(3,2)
          FROM submission_dimension_scores sds 
          WHERE sds.submission_id = ps.id AND sds.ai_score IS NOT NULL
        ) as avg_score
       FROM project_submissions ps
       WHERE ps.project_id = $1
       ORDER BY ps.iteration_number ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        submissions: submissionsResult.rows,
        total_count: submissionsResult.rows.length,
      },
    });
  } catch (error) {
    console.error("Get project submissions error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};

/**
 * Resubmit a project with updated content for AI re-evaluation
 */
export const resubmitProject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const { id } = req.params;
    const { essay_text } = req.body;

    // Handle uploaded files from multer
    const uploadedFiles = Array.isArray(req.files)
      ? (req.files as Express.Multer.File[])
      : [];

    // Check if user has access to project
    const projectResult = await query(
      `SELECT p.*, u.display_name as owner_name
       FROM projects p
       LEFT JOIN users u ON p.owner_id = u.id
       WHERE p.id = $1 AND (
         p.owner_id = $2 OR p.id IN (
           SELECT pm.project_id FROM project_members pm WHERE pm.user_id = $2
         )
       )`,
      [id, req.user.id]
    );

    if (projectResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: "Project not found or access denied" },
      });
      return;
    }

    const project = projectResult.rows[0];

    // Validate project has content
    const hasEssayText = essay_text && essay_text.trim().length > 0;
    const hasFiles = uploadedFiles.length > 0;

    if (!hasEssayText && !hasFiles) {
      res.status(400).json({
        success: false,
        error: {
          message: "Resubmission must have essay text or files",
        },
      });
      return;
    }

    // Get the latest submission to determine next iteration number
    const latestSubmissionResult = await query(
      `SELECT id, iteration_number FROM project_submissions
       WHERE project_id = $1
       ORDER BY iteration_number DESC
       LIMIT 1`,
      [id]
    );

    const previousSubmission = latestSubmissionResult.rows[0];
    const nextIterationNumber = previousSubmission
      ? previousSubmission.iteration_number + 1
      : 1;

    // Start transaction
    await query("BEGIN");

    try {
      // Update project essay_text if provided
      if (hasEssayText) {
        await query(
          `UPDATE projects SET essay_text = $1, updated_at = NOW() WHERE id = $2`,
          [essay_text, id]
        );
      }

      // Handle file uploads - store in project_files and collect filenames
      const fileUrls: string[] = [];
      if (hasFiles) {
        for (const file of uploadedFiles) {
          await query(
            `INSERT INTO project_files (
              project_id, file_name, file_url, file_type, 
              file_size, uploaded_by
            )
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              id,
              file.originalname,
              file.filename, // Stored filename on disk
              file.mimetype,
              file.size,
              req.user.id,
            ]
          );
          fileUrls.push(file.filename);
        }
        console.log(
          `📁 Resubmit: Stored ${fileUrls.length} files for project ${id}`
        );
      }

      // Create new submission record
      const crypto = await import("crypto");
      const contentForHash = JSON.stringify({
        essay: essay_text || "",
        files: [...fileUrls].sort(),
      });
      const contentHash = crypto
        .createHash("sha256")
        .update(contentForHash)
        .digest("hex");

      const submissionResult = await query(
        `INSERT INTO project_submissions (
          project_id, course_id, user_id, name, submitted_at,
          essay_text, file_urls, content_hash, ai_processing_status,
          iteration_number, previous_submission_id
        )
        VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, 'pending', $8, $9)
        RETURNING id, iteration_number`,
        [
          id,
          project.course_id,
          req.user.id,
          `Submission ${nextIterationNumber}`,
          essay_text || null,
          JSON.stringify(fileUrls),
          contentHash,
          nextIterationNumber,
          previousSubmission?.id || null,
        ]
      );

      const newSubmission = submissionResult.rows[0];

      // Update project status to Processing
      await query(
        `UPDATE projects SET status = 'Processing', updated_at = NOW() WHERE id = $1`,
        [id]
      );

      await query("COMMIT");

      // Trigger AI evaluation with previous submission for comparison
      const AI_SERVICE_URL =
        process.env.AI_SERVICE_URL || "http://backend-ai:8000";
      const essayTextForAI = hasEssayText
        ? essay_text
        : "[No essay text provided. Analysis based on uploaded files.]";

      // Convert filenames to full URLs for AI service
      const fileUrlsForAI = fileUrls.map((filename) => getFileUrl(filename));
      console.log("📤 Resubmit: Sending files to AI service:", fileUrlsForAI);

      fetch(`${AI_SERVICE_URL}/api/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submission_id: newSubmission.id,
          project_id: id,
          course_id: project.course_id,
          user_id: req.user.id,
          essay_text: essayTextForAI,
          file_urls: fileUrlsForAI,
          previous_submission_id: previousSubmission?.id || null,
          reanalyze: false,
        }),
      }).catch((error) => {
        console.error("Failed to trigger AI evaluation:", error);
        query(
          `UPDATE project_submissions 
           SET ai_processing_status = 'failed', 
               ai_processing_error = $1 
           WHERE id = $2`,
          ["Failed to connect to AI service", newSubmission.id]
        ).catch((err) =>
          console.error("Failed to update submission status:", err)
        );

        query(`UPDATE projects SET status = 'Failed' WHERE id = $1`, [
          id,
        ]).catch((err) =>
          console.error("Failed to update project status:", err)
        );
      });

      res.json({
        success: true,
        data: {
          submission_id: newSubmission.id,
          iteration_number: newSubmission.iteration_number,
          previous_submission_id: previousSubmission?.id || null,
          message: `Submission ${nextIterationNumber} created. AI evaluation is in progress.`,
        },
      });
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Resubmit project error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};

/**
 * Get AI feedback for a submission
 */
export const getSubmissionFeedback = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const { submissionId } = req.params;

    // Verify user has access to this submission
    const submissionCheck = await query(
      `SELECT ps.*, p.owner_id, p.course_id
       FROM project_submissions ps
       JOIN projects p ON ps.project_id = p.id
       WHERE ps.id = $1 AND (
         p.owner_id = $2 OR p.id IN (
           SELECT pm.project_id FROM project_members pm WHERE pm.user_id = $2
         )
       )`,
      [submissionId, req.user.id]
    );

    if (submissionCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: "Submission not found or access denied" },
      });
      return;
    }

    const submission = submissionCheck.rows[0];

    // Get dimension scores with color info
    const scoresResult = await query(
      `SELECT 
        sds.*,
        d.label as dimension_label,
        d.color_hex as dimension_color
       FROM submission_dimension_scores sds
       JOIN dimensions d ON sds.dimension_id = d.id
       WHERE sds.submission_id = $1
       ORDER BY d.id`,
      [submissionId]
    );

    // Get project info for submission
    const projectResult = await query(
      `SELECT title FROM projects WHERE id = $1`,
      [submission.project_id]
    );

    // Get total submission count for this project
    const countResult = await query(
      `SELECT COUNT(*) as total_count FROM project_submissions WHERE project_id = $1`,
      [submission.project_id]
    );

    // Format response to match frontend expectations
    res.json({
      success: true,
      data: {
        submission: {
          id: submission.id,
          project_id: submission.project_id,
          project_title: projectResult.rows[0]?.title || "",
          name: submission.name,
          iteration_number: submission.iteration_number || 1,
          total_submissions: parseInt(countResult.rows[0].total_count) || 1,
          previous_submission_id: submission.previous_submission_id,
          comparison_analysis: submission.comparison_analysis,
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
        dimensions: scoresResult.rows,
      },
    });
  } catch (error) {
    console.error("Get submission feedback error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};
