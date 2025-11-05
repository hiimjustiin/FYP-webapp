import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

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

// Import middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// CORS configuration - Support multiple origins from environment
// CORS_ORIGIN can be a single origin or comma-separated list
const corsOriginEnv = process.env.CORS_ORIGIN || "http://localhost:5173";
const allowedOrigins = corsOriginEnv.split(',').map(origin => origin.trim());

// Always include common development origins
const devOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174", // Vite alternative port
];

// Combine env origins with dev origins (remove duplicates)
const allAllowedOrigins = Array.from(new Set([...allowedOrigins, ...devOrigins]));

console.log('🔒 CORS allowed origins:', allAllowedOrigins);

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
      if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      
      // Reject other origins
      console.warn('⚠️  CORS rejected origin:', origin);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
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

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
