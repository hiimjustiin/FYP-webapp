import { Router } from "express";
import type { Router as RouterType } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { uploadSingle } from "../middleware/upload.js";
import * as instructorController from "../controllers/instructorController.js";

const router: RouterType = Router();

// All routes require authentication as instructor or admin
router.use(authenticate);
router.use(authorize("instructor", "admin"));

// Dashboard endpoints
router.get(
  "/dashboard/recent-activity",
  instructorController.getDashboardRecentActivity
);
router.get(
  "/dashboard/at-risk-students",
  instructorController.getDashboardAtRiskStudents
);

// GET /api/instructor/courses - Get courses taught by instructor
router.get("/courses", instructorController.getInstructorCourses);

// POST /api/instructor/courses - Create new course
router.post("/courses", instructorController.createCourse);

// PUT /api/instructor/courses/:courseId - Update course
router.put("/courses/:courseId", instructorController.updateCourse);

// DELETE /api/instructor/courses/:courseId - Delete course
router.delete("/courses/:courseId", instructorController.deleteCourse);

// GET /api/instructor/courses/:courseId/students - Get enrolled students
router.get(
  "/courses/:courseId/students",
  instructorController.getCourseStudents
);

// GET /api/instructor/courses/:courseId/submissions - Get all submissions for course
router.get(
  "/courses/:courseId/submissions",
  instructorController.getCourseSubmissions
);

// GET /api/instructor/submissions/:submissionId - Get submission details
router.get(
  "/submissions/:submissionId",
  instructorController.getSubmissionDetails
);

// POST /api/instructor/submissions/:submissionId/score - Trigger AI scoring
router.post(
  "/submissions/:submissionId/score",
  instructorController.triggerScoring
);

// PUT /api/instructor/submissions/:submissionId/review - Update scores/feedback
router.put(
  "/submissions/:submissionId/review",
  instructorController.reviewSubmission
);

// PUT /api/instructor/submissions/:submissionId/suggestion - Add/update instructor suggestion
router.put(
  "/submissions/:submissionId/suggestion",
  instructorController.upsertSubmissionSuggestion
);

// POST /api/instructor/submissions/upload - Upload submission file
router.post(
  "/submissions/upload",
  uploadSingle("file"),
  instructorController.uploadSubmission
);

export default router;
