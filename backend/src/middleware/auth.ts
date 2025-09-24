import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { query } from "../models/database.js";
import { User } from "../models/User.js";

export interface AuthRequest extends Request {
  user?: User;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({
        success: false,
        error: { message: "Access denied. No token provided." },
      });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET not configured");
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;

    // Get user from database
    const result = await query(
      "SELECT id, email, display_name, role, is_active FROM users WHERE id = $1 AND is_active = true",
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: { message: "Invalid token. User not found." },
      });
      return;
    }

    req.user = result.rows[0];
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { message: "Invalid token." },
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required." },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: { message: "Insufficient permissions." },
      });
      return;
    }

    next();
  };
};
