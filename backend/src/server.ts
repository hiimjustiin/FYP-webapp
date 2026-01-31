import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import projectRoutes from "./routes/projects.js";
import essayRoutes from "./routes/essays.js";
import courseRoutes from "./routes/courses.js";
import dimensionsRoutes from "./routes/dimensions.js";
import instructorRoutes from "./routes/instructor.js";
import notificationRoutes from "./routes/notifications.js";
import adminRoutes from "./routes/admin.js";
import feedbackRoutes from "./routes/feedback.js";
import reportsRoutes from "./routes/reports.js";
import teamRoutes from "./routes/teams.js";

// Import middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting - much higher limit in development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // 1000 in dev, 100 in prod
  message: "Too many requests from this IP, please try again later.",
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/health";
  },
});
app.use(limiter);

// CORS configuration - Support multiple origins from environment
// CORS_ORIGIN can be a single origin or comma-separated list
const corsOriginEnv = process.env.CORS_ORIGIN || "http://localhost:5173";
const allowedOrigins = corsOriginEnv.split(",").map((origin) => origin.trim());

// Always include common development origins
const devOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174", // Vite alternative port
];

// Combine env origins with dev origins (remove duplicates)
const allAllowedOrigins = Array.from(
  new Set([...allowedOrigins, ...devOrigins])
);

console.log("🔒 CORS allowed origins:", allAllowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development, allow any localhost origin
      if (
        process.env.NODE_ENV === "development" &&
        origin.startsWith("http://localhost:")
      ) {
        return callback(null, true);
      }

      // Reject other origins
      console.warn("⚠️  CORS rejected origin:", origin);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing middleware - exclude multipart/form-data (handled by multer)
app.use(
  express.json({
    limit: "10mb",
    type: (req) => {
      if (req.headers["content-type"]?.startsWith("multipart/form-data")) {
        return false;
      }
      return true;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan("combined"));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "ILA Backend API",
  });
});

// Static file serving for uploads (POC - use S3 in production)
// This allows the AI service to download uploaded files via HTTP
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.join(__dirname, "..", "uploads");
console.log("📁 Serving static uploads from:", uploadsPath);
app.use("/uploads", express.static(uploadsPath));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/essays", essayRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/dimensions", dimensionsRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/teams", teamRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
