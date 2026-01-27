import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { query } from "../models/database.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken, generateRefreshToken } from "../utils/jwt.js";
import { User, CreateUserInput } from "../models/User.js";
import { AuthRequest } from "../middleware/auth.js";
import { generateOTP, sendOTPEmail, sendWelcomeEmail } from "../utils/email.js";

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  token_type: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  sub?: string;
  id?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

const GOOGLE_OAUTH_SCOPE = "openid email profile";
const GOOGLE_STATE_TTL_MS = 10 * 60 * 1000;

const getBackendPublicUrl = (): string => {
  const baseUrl = process.env.BACKEND_PUBLIC_URL || "http://localhost:3001";
  return baseUrl.replace(/\/$/, "");
};

const getAllowedRedirectOrigins = (): Set<string> => {
  const corsOriginEnv = process.env.CORS_ORIGIN || "http://localhost:5173";
  const envOrigins = corsOriginEnv
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const devOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
  ];
  const frontendBase = process.env.FRONTEND_BASE_URL;
  if (frontendBase) {
    envOrigins.push(frontendBase);
  }
  return new Set([...envOrigins, ...devOrigins]);
};

const getRedirectOrigin = (rawRedirect?: string): string | null => {
  if (!rawRedirect) return null;
  try {
    const parsed = new URL(rawRedirect);
    const origin = parsed.origin;
    return getAllowedRedirectOrigins().has(origin) ? origin : null;
  } catch {
    return null;
  }
};

const getOAuthRedirectUri = (): string => {
  return `${getBackendPublicUrl()}/api/auth/google/callback`;
};

const buildFrontendCallbackUrl = (
  origin: string,
  params: Record<string, string>
) => {
  const url = new URL("/oauth/callback", origin);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
};

const getGoogleClientConfig = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth environment variables are not set");
  }

  return { clientId, clientSecret };
};

const createOAuthState = (origin: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  const payload = {
    origin,
    nonce: crypto.randomBytes(16).toString("hex"),
    issuedAt: Date.now(),
  };

  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");

  return `${data}.${signature}`;
};

const verifyOAuthState = (state: string): { origin: string } | null => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return null;
  }

  const [data, signature] = state.split(".");
  if (!data || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8")
    ) as { origin?: string; issuedAt?: number };

    if (!payload.origin || !payload.issuedAt) {
      return null;
    }

    if (Date.now() - payload.issuedAt > GOOGLE_STATE_TTL_MS) {
      return null;
    }

    return { origin: payload.origin };
  } catch {
    return null;
  }
};

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

// Google OAuth: Start OAuth flow
export const googleOAuthStart = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("🔵 Google OAuth Start - Request received");
    console.log("Query params:", req.query);
    
    const { clientId } = getGoogleClientConfig();
    console.log("✅ Client ID loaded:", clientId?.substring(0, 20) + "...");
    
    const rawRedirect = req.query.redirect as string | undefined;
    console.log("Redirect param:", rawRedirect);
    
    const redirectOrigin = getRedirectOrigin(rawRedirect);
    console.log("Validated redirect origin:", redirectOrigin);

    if (!redirectOrigin) {
      console.error("❌ Invalid redirect origin");
      res.status(400).json({
        success: false,
        error: { message: "Invalid redirect origin" },
      });
      return;
    }

    const state = createOAuthState(redirectOrigin);
    console.log("✅ State token created");
    
    const redirectUri = getOAuthRedirectUri();
    console.log("Redirect URI:", redirectUri);

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", GOOGLE_OAUTH_SCOPE);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    console.log("🔗 Redirecting to Google:", authUrl.toString().substring(0, 100) + "...");
    res.redirect(authUrl.toString());
  } catch (error) {
    console.error("❌ Google OAuth start error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    res.status(500).json({
      success: false,
      error: { message: "Failed to initiate Google OAuth" },
    });
  }
};

// Google OAuth: Handle callback
export const googleOAuthCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      console.error("Google OAuth error:", oauthError);
      const fallbackOrigin = getAllowedRedirectOrigins().values().next().value || "http://localhost:5173";
      const errorUrl = buildFrontendCallbackUrl(fallbackOrigin, {
        error: "oauth_failed",
      });
      res.redirect(errorUrl);
      return;
    }

    if (!code || !state) {
      res.status(400).json({
        success: false,
        error: { message: "Missing code or state parameter" },
      });
      return;
    }

    const stateData = verifyOAuthState(state as string);
    if (!stateData) {
      res.status(400).json({
        success: false,
        error: { message: "Invalid or expired state parameter" },
      });
      return;
    }

    const { clientId, clientSecret } = getGoogleClientConfig();
    const redirectUri = getOAuthRedirectUri();

    // Exchange code for tokens
    const tokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      }
    );

    const tokenData: GoogleTokenResponse = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error("Google token exchange error:", tokenData.error_description);
      const errorUrl = buildFrontendCallbackUrl(stateData.origin, {
        error: "token_exchange_failed",
      });
      res.redirect(errorUrl);
      return;
    }

    // Fetch user info
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    const userInfo: GoogleUserInfo = await userInfoResponse.json();

    console.log("📧 Google user info received:", {
      sub: userInfo.sub,
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
    });

    if (!userInfo.email) {
      console.error("❌ No email in user info");
      const errorUrl = buildFrontendCallbackUrl(stateData.origin, {
        error: "no_email",
      });
      res.redirect(errorUrl);
      return;
    }

    // Google's user ID can be in 'sub' or 'id' field
    const googleUserId = userInfo.sub || userInfo.id;
    if (!googleUserId) {
      console.error("❌ No user ID (sub or id) in Google user info:", userInfo);
      const errorUrl = buildFrontendCallbackUrl(stateData.origin, {
        error: "no_user_id",
      });
      res.redirect(errorUrl);
      return;
    }

    console.log("✅ Google user ID:", googleUserId);

    // Find or create user
    const userResult = await query(
      "SELECT id, email, display_name, role, is_active FROM users WHERE email = $1",
      [userInfo.email]
    );

    let user: User;

    if (userResult.rows.length === 0) {
      // Create new user (auto-activated, email verified via Google)
      const newUserResult = await query(
        `INSERT INTO users (email, display_name, role, is_active, email_verified, avatar_url) 
         VALUES ($1, $2, $3, true, now(), $4) 
         RETURNING id, email, display_name, role, is_active`,
        [
          userInfo.email,
          userInfo.name || userInfo.email.split("@")[0],
          "student",
          userInfo.picture || null,
        ]
      );
      user = newUserResult.rows[0] as User;

      // Send welcome email
      await sendWelcomeEmail(userInfo.email, user.display_name || "User");
    } else {
      user = userResult.rows[0] as User;
    }

    // Upsert OAuth account
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    console.log("💾 Storing OAuth account:", {
      provider: "google",
      provider_account_id: googleUserId,
      user_id: user.id,
    });

    await query(
      `INSERT INTO oauth_accounts (provider, provider_account_id, user_id, access_token, refresh_token, expires_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       ON CONFLICT (provider, provider_account_id)
       DO UPDATE SET access_token = $4, refresh_token = $5, expires_at = $6, updated_at = now()`,
      [
        "google",
        googleUserId,
        user.id,
        tokenData.access_token,
        tokenData.refresh_token || null,
        expiresAt,
      ]
    );

    console.log("✅ OAuth account stored successfully");

    // Generate app tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Redirect to frontend with tokens
    const successUrl = buildFrontendCallbackUrl(stateData.origin, {
      token,
      refreshToken,
    });

    res.redirect(successUrl);
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    const fallbackOrigin = getAllowedRedirectOrigins().values().next().value || "http://localhost:5173";
    const errorUrl = buildFrontendCallbackUrl(fallbackOrigin, {
      error: "server_error",
    });
    res.redirect(errorUrl);
  }
};
