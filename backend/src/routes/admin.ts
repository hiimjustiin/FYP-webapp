import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { body } from "express-validator";
import {
  getDashboardStats,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getAllSubmissions,
  deleteSubmission,
  getInstructors,
  getAllDimensions,
} from "../controllers/adminController.js";

const router: Router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize("admin"));

// Dashboard stats
router.get("/dashboard", getDashboardStats);

// User management
router.get("/users", getAllUsers);
router.post(
  "/users",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("display_name").optional().trim(),
    body("role").optional().isIn(["student", "instructor", "admin"]),
    body("student_id").optional().trim(),
    body("department").optional().trim(),
    body("phone").optional().trim(),
  ],
  createUser
);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Course management
router.get("/courses", getAllCourses);
router.post(
  "/courses",
  [
    body("code").notEmpty().trim(),
    body("title").notEmpty().trim(),
    body("description").optional().trim(),
    body("instructor_id").optional().isUUID(),
    body("term").optional().trim(),
  ],
  createCourse
);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);

// Submission management
router.get("/submissions", getAllSubmissions);
router.delete("/submissions/:id", deleteSubmission);

// Utility routes
router.get("/instructors", getInstructors);
router.get("/dimensions", getAllDimensions);

export default router;
