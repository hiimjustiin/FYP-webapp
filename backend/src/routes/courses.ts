import { Router } from "express";
import type { Router as RouterType } from "express";
import {
  getCourses,
  getEnrolledCourses,
  enrollCourse,
  unenrollCourse,
  getEnrolledStudents,
} from "../controllers/courseController.js";
import { authenticate } from "../middleware/auth.js";

const router: RouterType = Router();

// All routes require authentication
router.use(authenticate);

// Course routes
router.get("/", getCourses);
router.get("/enrolled", getEnrolledCourses);
router.get("/:courseId/enrolled-students", getEnrolledStudents);
router.post("/:courseId/enroll", enrollCourse);
router.delete("/:courseId/enroll", unenrollCourse);

export default router;
