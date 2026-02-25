import multer from "multer";
import type { Request as ExpressRequest } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import type { Request, Response, NextFunction, RequestHandler } from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create uploads directory if not exists
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for local storage (TODO: migrate to S3 later)
const storage = multer.diskStorage({
  destination: (
    _req: ExpressRequest,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, uploadDir);
  },
  filename: (
    _req: ExpressRequest,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `submission-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Multer error type with code property
interface MulterError extends Error {
  code?: string;
}

const multerInstance = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (
    _req: ExpressRequest,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    // POC: Only PDF files supported for AI evaluation
    const allowedTypes = [".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed for AI evaluation"));
    }
  },
});

/**
 * Type-safe wrapper for multer single file upload.
 * Works around type conflicts between @types/express-serve-static-core versions.
 */
export const uploadSingle = (fieldName: string): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    multerInstance.single(fieldName)(req, res, (err: unknown) => {
      if (err) {
        const multerErr = err as MulterError;
        if (multerErr.message?.includes("FILE_SIZE") || multerErr.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({
            success: false,
            error: { message: "File too large. Maximum size is 50MB." },
          });
          return;
        }
        if (multerErr.message?.includes("Only PDF files")) {
          res.status(400).json({
            success: false,
            error: { message: multerErr.message },
          });
          return;
        }
        console.error("🚨 Multer error:", err);
      }
      next();
    });
  };
};

/**
 * Type-safe wrapper for multer multiple file upload.
 * Works around type conflicts between @types/express-serve-static-core versions.
 */
export const uploadMultiple = (fieldName: string, maxCount: number): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    multerInstance.array(fieldName, maxCount)(req, res, (err: unknown) => {
      if (err) {
        const multerErr = err as MulterError;
        if (multerErr.message?.includes("FILE_SIZE") || multerErr.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({
            success: false,
            error: { message: "File too large. Maximum size is 50MB." },
          });
          return;
        }
        console.error("🚨 Multer error:", err);
        // For other errors, continue anyway (text-only submission)
        console.log("⚠️  Continuing despite multer error for text-only submission");
      }
      next();
    });
  };
};

// Export the raw multer instance for backward compatibility (if needed)
export const upload = multerInstance;
