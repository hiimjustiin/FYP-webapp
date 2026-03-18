import { Router } from "express";
import type { Router as RouterType } from "express";
import {
  getUserTeams,
  getTeamDetails,
  addTeamMember,
  removeTeamMember,
} from "../controllers/teamController.js";
import { authenticate } from "../middleware/auth.js";

const router: RouterType = Router();

// All routes require authentication
router.use(authenticate);

// Team routes
router.get("/", getUserTeams);
router.get("/:projectId", getTeamDetails);
router.post("/:projectId/members", addTeamMember);
router.delete("/:projectId/members/:userId", removeTeamMember);

export default router;
