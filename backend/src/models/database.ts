import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Database connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Only use SSL for external cloud databases (not Docker)
  // Check if DATABASE_URL contains a cloud provider or explicitly enable SSL
  ssl:
    process.env.DATABASE_URL?.includes('amazonaws.com') ||
    process.env.DATABASE_URL?.includes('azure.com') ||
    process.env.DATABASE_URL?.includes('neon.tech') ||
    process.env.POSTGRES_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
export const testConnection = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log("✓ Database connected successfully");
    client.release();
  } catch (error) {
    console.error("✗ Database connection failed:", error);
    process.exit(1);
  }
};

// Execute query with error handling
export const query = async (text: string, params?: unknown[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error("Query error:", error);
    throw error;
  }
};

// Initialize database connection on startup
testConnection();
