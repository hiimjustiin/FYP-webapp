import { Router } from "express";
import type { Router as RouterType } from "express";
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  createProjectValidation,
  updateProjectValidation,
} from "../controllers/projectController.js";
import { authenticate } from "../middleware/auth.js";

const router: RouterType = Router();

// All routes require authentication
router.use(authenticate);

// Project routes
router.get("/", getProjects);
router.get("/:id", getProject);
router.post("/", createProjectValidation, createProject);
router.put("/:id", updateProjectValidation, updateProject);
router.delete("/:id", deleteProject);

export default router;
