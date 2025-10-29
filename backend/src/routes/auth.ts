import { Router } from "express";
import type { Router as RouterType } from "express";
import {
  register,
  login,
  me,
  verifyOTP,
  resendOTP,
  refreshToken,
  registerValidation,
  loginValidation,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router: RouterType = Router();

// Public routes
router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/refresh", refreshToken);

// Protected routes
router.get("/me", authenticate, me);

export default router;
