import { Router } from "express";
import type { Router as RouterType } from "express";
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  submitProject,
  getSubmissionFeedback,
  getProjectSubmissions,
  resubmitProject,
  updateProjectValidation,
} from "../controllers/projectController.js";
import { authenticate } from "../middleware/auth.js";
import { uploadMultiple } from "../middleware/upload.js";

const router: RouterType = Router();

// All routes require authentication
router.use(authenticate);

// Project routes
router.get("/", getProjects);
router.get("/:id", getProject);
router.get("/:id/submissions", getProjectSubmissions); // Get all submissions for a project
router.post("/", uploadMultiple("files", 10), createProject); // Support up to 10 files
router.post("/:id/submit", submitProject); // Submit project for AI evaluation
router.post("/:id/resubmit", uploadMultiple("files", 10), resubmitProject); // Resubmit with updated content
router.get("/submissions/:submissionId/feedback", getSubmissionFeedback); // Get AI feedback for submission
router.put("/:id", updateProjectValidation, updateProject);
router.delete("/:id", deleteProject);

export default router;
