import { Request, Response } from "express";

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response
): void => {
  let { statusCode = 500, message } = err;

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // PostgreSQL errors
  if (
    err.name === "QueryFailedError" ||
    err.message.includes("duplicate key")
  ) {
    statusCode = 409;
    message = "Resource already exists";
  }

  // Log error for debugging
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    statusCode,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message:
        process.env.NODE_ENV === "production"
          ? statusCode === 500
            ? "Internal Server Error"
            : message
          : message,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
  });
};
