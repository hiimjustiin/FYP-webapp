import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import { query } from "../models/database.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken, generateRefreshToken } from "../utils/jwt.js";
import { User, CreateUserInput } from "../models/User.js";
import { AuthRequest } from "../middleware/auth.js";
import { generateOTP, sendOTPEmail, sendWelcomeEmail } from "../utils/email.js";

// Validation rules
export const registerValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("display_name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Display name must be between 1 and 100 characters"),
  body("role")
    .optional()
    .isIn(["student", "instructor", "admin"])
    .withMessage("Invalid role"),
];

export const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Register new user (Step 1: Create account and send OTP)
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: { message: "Validation failed", details: errors.array() },
      });
      return;
    }

    const {
      email,
      password,
      display_name,
      role = "student",
    }: CreateUserInput = req.body;

    // Check if user already exists
    const existingUser = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existingUser.rows.length > 0) {
      res.status(409).json({
        success: false,
        error: { message: "User already exists with this email" },
      });
      return;
    }

    // Hash password
    const hashedPassword = password ? await hashPassword(password) : null;

    // Create user (not verified yet)
    const result = await query(
      `INSERT INTO users (email, password_hash, display_name, role, is_active) 
       VALUES ($1, $2, $3, $4, false) 
       RETURNING id, email, display_name, role, created_at`,
      [email, hashedPassword, display_name, role]
    );

    const newUser = result.rows[0] as User;

    // Generate and store OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await query(
      `INSERT INTO email_verification_otps (email, otp_code, expires_at) 
       VALUES ($1, $2, $3)`,
      [email, otpCode, expiresAt]
    );

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otpCode);

    if (!emailSent) {
      console.warn("Failed to send OTP email, but registration proceeding");
    }

    res.status(201).json({
      success: true,
      data: {
        message:
          "Registration successful. Please check your email for the verification code.",
        userId: newUser.id,
        email: newUser.email,
        requiresVerification: true,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: { message: "Validation failed", details: errors.array() },
      });
      return;
    }

    const { email, password } = req.body;

    // Find user
    const result = await query(
      "SELECT id, email, password_hash, display_name, role, is_active FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: { message: "Invalid credentials" },
      });
      return;
    }

    const user = result.rows[0] as User;

    if (!user.is_active) {
      res.status(401).json({
        success: false,
        error: { message: "Account is deactivated" },
      });
      return;
    }

    // Check password
    if (
      !user.password_hash ||
      !(await comparePassword(password, user.password_hash))
    ) {
      res.status(401).json({
        success: false,
        error: { message: "Invalid credentials" },
      });
      return;
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          role: user.role,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};

// Refresh access token using refresh token
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: { message: "Refresh token is required" },
      });
      return;
    }

    // Verify refresh token
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_REFRESH_SECRET not configured");
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, secret) as { userId: string };
    } catch {
      res.status(401).json({
        success: false,
        error: { message: "Invalid or expired refresh token" },
      });
      return;
    }

    // Get user from database
    const result = await query(
      "SELECT id, email, display_name, role, is_active FROM users WHERE id = $1 AND is_active = true",
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: { message: "User not found or inactive" },
      });
      return;
    }

    const user = result.rows[0] as User;

    // Generate new tokens
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};

// Get current user profile
export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    // User is attached to request by auth middleware
    const user = (req as AuthRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: { message: "User not found" },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};

// Verify OTP and activate account
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        error: { message: "Email and OTP are required" },
      });
      return;
    }

    // Find the OTP record
    const otpResult = await query(
      `SELECT id, email, otp_code, expires_at, verified_at, attempts 
       FROM email_verification_otps 
       WHERE email = $1 AND otp_code = $2 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [email, otp]
    );

    if (otpResult.rows.length === 0) {
      res.status(400).json({
        success: false,
        error: { message: "Invalid OTP code" },
      });
      return;
    }

    const otpRecord = otpResult.rows[0];

    // Check if already verified
    if (otpRecord.verified_at) {
      res.status(400).json({
        success: false,
        error: { message: "OTP has already been used" },
      });
      return;
    }

    // Check if expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      res.status(400).json({
        success: false,
        error: { message: "OTP has expired. Please request a new one." },
      });
      return;
    }

    // Check attempts (max 5)
    if (otpRecord.attempts >= 5) {
      res.status(400).json({
        success: false,
        error: { message: "Too many attempts. Please request a new OTP." },
      });
      return;
    }

    // Mark OTP as verified
    await query(
      `UPDATE email_verification_otps 
       SET verified_at = now(), attempts = attempts + 1 
       WHERE id = $1`,
      [otpRecord.id]
    );

    // Activate user account and set email_verified
    const userResult = await query(
      `UPDATE users 
       SET is_active = true, email_verified = now() 
       WHERE email = $1 
       RETURNING id, email, display_name, role`,
      [email]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: "User not found" },
      });
      return;
    }

    const user = userResult.rows[0] as User;

    // Send welcome email
    await sendWelcomeEmail(email, user.display_name || "User");

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      data: {
        message: "Email verified successfully!",
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          role: user.role,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};

// Resend OTP
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: { message: "Email is required" },
      });
      return;
    }

    // Check if user exists
    const userResult = await query(
      "SELECT id, email, is_active FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: "User not found" },
      });
      return;
    }

    const user = userResult.rows[0];

    // Check if already verified
    if (user.is_active) {
      res.status(400).json({
        success: false,
        error: { message: "Email is already verified" },
      });
      return;
    }

    // Check rate limit (allow resend only after 1 minute)
    const recentOTP = await query(
      `SELECT id, created_at 
       FROM email_verification_otps 
       WHERE email = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [email]
    );

    if (recentOTP.rows.length > 0) {
      const lastOTPTime = new Date(recentOTP.rows[0].created_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastOTPTime.getTime()) / 1000 / 60;

      if (diffMinutes < 1) {
        res.status(429).json({
          success: false,
          error: {
            message: "Please wait before requesting a new OTP",
            retryAfter: Math.ceil(60 - diffMinutes * 60), // seconds
          },
        });
        return;
      }
    }

    // Generate and store new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await query(
      `INSERT INTO email_verification_otps (email, otp_code, expires_at) 
       VALUES ($1, $2, $3)`,
      [email, otpCode, expiresAt]
    );

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otpCode);

    if (!emailSent) {
      res.status(500).json({
        success: false,
        error: { message: "Failed to send email. Please try again later." },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        message: "OTP has been resent to your email",
      },
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
};
