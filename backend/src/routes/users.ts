import { Router } from "express";
import type { Router as RouterType } from "express";
import { body, validationResult } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.js";
import { query } from "../models/database.js";
import { AuthRequest } from "../middleware/auth.js";
import { Response } from "express";

const router: RouterType = Router();

// Get all users (admin only)
router.get(
  "/",
  authenticate,
  authorize("admin"),
  async (_req: AuthRequest, res: Response) => {
    try {
      const result = await query(
        "SELECT id, email, display_name, role, is_active, created_at FROM users ORDER BY created_at DESC"
      );

      res.json({
        success: true,
        data: { users: result.rows },
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Internal server error" },
      });
    }
  }
);

// Get user by ID
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const { id } = req.params;

    // Users can only view their own profile unless they are admin
    if (req.user.role !== "admin" && req.user.id !== id) {
      res.status(403).json({
        success: false,
        error: { message: "Permission denied" },
      });
      return;
    }

    const result = await query(
      "SELECT id, email, display_name, role, avatar_url, is_active, created_at, phone, bio, department, student_id FROM users WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: "User not found" },
      });
      return;
    }

    res.json({
      success: true,
      data: { user: result.rows[0] },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
});

// Update user profile
router.put(
  "/:id",
  authenticate,
  [
    body("display_name")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Display name must be between 1 and 100 characters"),
    body("bio")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Bio cannot exceed 500 characters"),
    body("phone")
      .optional({ values: "falsy" })
      .trim()
      .matches(
        /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/
      )
      .withMessage("Invalid phone number format"),
    body("department").optional({ values: "falsy" }).trim(),
    body("student_id").optional({ values: "falsy" }).trim(),
  ],
  async (req: AuthRequest, res: Response) => {
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

      // Users can only update their own profile unless they are admin
      if (req.user.role !== "admin" && req.user.id !== id) {
        res.status(403).json({
          success: false,
          error: { message: "Permission denied" },
        });
        return;
      }

      const { display_name, bio, phone, department, student_id } = req.body;

      // Build update query dynamically
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      if (display_name !== undefined) {
        updateFields.push(`display_name = $${paramCount}`);
        values.push(display_name);
        paramCount++;
      }

      if (bio !== undefined) {
        updateFields.push(`bio = $${paramCount}`);
        values.push(bio);
        paramCount++;
      }

      if (phone !== undefined) {
        updateFields.push(`phone = $${paramCount}`);
        values.push(phone);
        paramCount++;
      }

      if (department !== undefined) {
        updateFields.push(`department = $${paramCount}`);
        values.push(department);
        paramCount++;
      }

      if (student_id !== undefined) {
        updateFields.push(`student_id = $${paramCount}`);
        values.push(student_id);
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
        `UPDATE users SET ${updateFields.join(
          ", "
        )} WHERE id = $${paramCount} RETURNING id, email, display_name, role, bio, phone, department, student_id, avatar_url, created_at, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: { message: "User not found" },
        });
        return;
      }

      res.json({
        success: true,
        data: { user: result.rows[0] },
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Internal server error" },
      });
    }
  }
);

export default router;
