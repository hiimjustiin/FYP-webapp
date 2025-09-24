import { Router } from "express";
import type { Router as RouterType } from "express";
import { authenticate } from "../middleware/auth.js";
import { query } from "../models/database.js";
import { AuthRequest } from "../middleware/auth.js";
import { Response } from "express";
import { body, validationResult } from "express-validator";

const router: RouterType = Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createEssayValidation = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Title must be between 1 and 500 characters"),
  body("body")
    .trim()
    .isLength({ min: 10, max: 50000 })
    .withMessage("Essay body must be between 10 and 50000 characters"),
  body("source")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Source cannot exceed 100 characters"),
];

// Get all essays for current user
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const result = await query(
      `SELECT e.*, u.display_name as author_name
       FROM essays e
       LEFT JOIN users u ON e.author_id = u.id
       WHERE e.author_id = $1
       ORDER BY e.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: { essays: result.rows },
    });
  } catch (error) {
    console.error("Get essays error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
});

// Get essay by ID
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const { id } = req.params;

    // Get essay with feedbacks and tags
    const essayResult = await query(
      `SELECT e.*, u.display_name as author_name
       FROM essays e
       LEFT JOIN users u ON e.author_id = u.id
       WHERE e.id = $1 AND e.author_id = $2`,
      [id, req.user.id]
    );

    if (essayResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: "Essay not found" },
      });
      return;
    }

    const essay = essayResult.rows[0];

    // Get feedbacks
    const feedbacksResult = await query(
      "SELECT * FROM feedbacks WHERE essay_id = $1 ORDER BY created_at DESC",
      [id]
    );

    // Get tags
    const tagsResult = await query(
      `SELECT t.*, et.assigned_at 
       FROM tags t
       JOIN essay_tags et ON t.id = et.tag_id
       WHERE et.essay_id = $1`,
      [id]
    );

    essay.feedbacks = feedbacksResult.rows;
    essay.tags = tagsResult.rows;

    res.json({
      success: true,
      data: { essay },
    });
  } catch (error) {
    console.error("Get essay error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
});

// Create new essay
router.post(
  "/",
  createEssayValidation,
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

      const { title, body, source } = req.body;

      const result = await query(
        `INSERT INTO essays (author_id, title, body, source)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
        [req.user.id, title, body, source]
      );

      res.status(201).json({
        success: true,
        data: { essay: result.rows[0] },
      });
    } catch (error) {
      console.error("Create essay error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Internal server error" },
      });
    }
  }
);

// Update essay
router.put(
  "/:id",
  createEssayValidation,
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
      const { title, body, source } = req.body;

      const result = await query(
        `UPDATE essays 
       SET title = $1, body = $2, source = $3, updated_at = now()
       WHERE id = $4 AND author_id = $5
       RETURNING *`,
        [title, body, source, id, req.user.id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: { message: "Essay not found or permission denied" },
        });
        return;
      }

      res.json({
        success: true,
        data: { essay: result.rows[0] },
      });
    } catch (error) {
      console.error("Update essay error:", error);
      res.status(500).json({
        success: false,
        error: { message: "Internal server error" },
      });
    }
  }
);

// Delete essay
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    const { id } = req.params;

    const result = await query(
      "DELETE FROM essays WHERE id = $1 AND author_id = $2 RETURNING id",
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: "Essay not found or permission denied" },
      });
      return;
    }

    res.json({
      success: true,
      message: "Essay deleted successfully",
    });
  } catch (error) {
    console.error("Delete essay error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
});

export default router;
