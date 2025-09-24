import { Response } from "express";
import { body, validationResult } from "express-validator";
import { query } from "../models/database.js";
import {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
} from "../models/Project.js";
import { AuthRequest } from "../middleware/auth.js";

// Validation rules
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
    .isIn(["active", "completed", "archived"])
    .withMessage("Invalid status"),
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
    .isIn(["active", "completed", "archived"])
    .withMessage("Invalid status"),
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

    const result = await query(
      `SELECT p.*, u.display_name as owner_name
       FROM projects p
       LEFT JOIN users u ON p.owner_id = u.id
       WHERE p.owner_id = $1 OR p.id IN (
         SELECT pm.project_id FROM project_members pm WHERE pm.user_id = $1
       )
       ORDER BY p.updated_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: { projects: result.rows },
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

    const {
      title,
      description,
      status = "active",
      settings = {},
    }: CreateProjectInput = req.body;

    const result = await query(
      `INSERT INTO projects (title, description, owner_id, status, settings)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, req.user.id, status, JSON.stringify(settings)]
    );

    const project = result.rows[0] as Project;

    res.status(201).json({
      success: true,
      data: { project },
    });
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
    const updates: UpdateProjectInput = req.body;

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
