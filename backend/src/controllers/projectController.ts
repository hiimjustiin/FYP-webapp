import { Response } from "express";
import { body, validationResult } from "express-validator";
import { query } from "../models/database.js";
import type { Project } from "../models/Project.js";
import { AuthRequest } from "../middleware/auth.js";
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

    // Get projects
    const projectsResult = await query(
      `SELECT p.*, u.display_name as owner_name
       FROM projects p
       LEFT JOIN users u ON p.owner_id = u.id
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

    // Attach members to projects
    const projects = projectsResult.rows.map((project) => ({
      ...project,
      members: membersByProject[project.id] || [],
    }));

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

    res.json({
      success: true,
      data: { project },
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
      status = "Draft",
      course_id,
      project_type = "individual",
      essay_text,
      member_ids, // JSON string array of user IDs
    } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      res.status(400).json({
        success: false,
        error: { message: "Title is required" },
      });
      return;
    }

    if (!course_id) {
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
      } catch (error) {
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
      const files = (req as any).files as Express.Multer.File[];
      if (files && files.length > 0) {
        for (const file of files) {
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
        }
      }

      await query("COMMIT");

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
      };

      res.status(201).json({
        success: true,
        data: { project: completeProject },
      });
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
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
      "SELECT owner_id FROM projects WHERE id = $1",
      [id]
    );

    if (existingProject.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: "Project not found" },
      });
      return;
    }

    if (existingProject.rows[0].owner_id !== req.user.id) {
      res.status(403).json({
        success: false,
        error: { message: "Permission denied" },
      });
      return;
    }

    // Build update query dynamically
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

    res.json({
      success: true,
      data: { project: result.rows[0] },
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
