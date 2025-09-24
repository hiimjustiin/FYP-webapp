import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { query } from "../models/database.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken, generateRefreshToken } from "../utils/jwt.js";
import { User, CreateUserInput } from "../models/User.js";
import { AuthRequest } from "../middleware/auth.js";

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

// Register new user
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

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, display_name, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, display_name, role, created_at`,
      [email, hashedPassword, display_name, role]
    );

    const newUser = result.rows[0] as User;
    const token = generateToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          display_name: newUser.display_name,
          role: newUser.role,
        },
        token,
        refreshToken,
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
