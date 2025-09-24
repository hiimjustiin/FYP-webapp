import { Router } from "express";
import type { Router as RouterType } from "express";
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
      "SELECT id, email, display_name, role, avatar_url, is_active, created_at FROM users WHERE id = $1",
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

export default router;
