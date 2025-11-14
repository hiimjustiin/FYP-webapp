import { Router } from "express";
import type {
  Router as RouterType,
  Request,
  Response,
  NextFunction,
} from "express";
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  submitProject,
  getSubmissionFeedback,
  updateProjectValidation,
} from "../controllers/projectController.js";
import { authenticate } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router: RouterType = Router();

// All routes require authentication
router.use(authenticate);

// Multer error handler
const handleUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  upload.array("files", 10)(req, res, (err: unknown) => {
    if (err) {
      console.error("🚨 Multer error:", err);
      // Check for file size error
      if (
        err instanceof Error &&
        (err.message.includes("FILE_SIZE") ||
          (err as unknown as Record<string, unknown>).code ===
            "LIMIT_FILE_SIZE")
      ) {
        res.status(400).json({
          success: false,
          error: { message: "File too large. Maximum size is 50MB." },
        });
        return;
      }
      // For other errors, continue anyway (text-only submission)
      console.log(
        "⚠️  Continuing despite multer error for text-only submission"
      );
    }
    next();
  });
};

// Project routes
router.get("/", getProjects);
router.get("/:id", getProject);
router.post("/", handleUpload, createProject); // Support up to 10 files
router.post("/:id/submit", submitProject); // Submit project for AI evaluation
router.get("/submissions/:submissionId/feedback", getSubmissionFeedback); // Get AI feedback for submission
router.put("/:id", updateProjectValidation, updateProject);
router.delete("/:id", deleteProject);

export default router;
