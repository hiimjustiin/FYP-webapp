import { Router } from "express";
import type { Router as RouterType } from "express";
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  updateProjectValidation,
} from "../controllers/projectController.js";
import { authenticate } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router: RouterType = Router();

// All routes require authentication
router.use(authenticate);

// Project routes
router.get("/", getProjects);
router.get("/:id", getProject);
router.post("/", upload.array("files", 10), createProject); // Support up to 10 files
router.put("/:id", updateProjectValidation, updateProject);
router.delete("/:id", deleteProject);

export default router;
