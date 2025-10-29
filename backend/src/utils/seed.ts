import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { query } from "../models/database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function seed() {
  try {
    console.log("Starting database seeding...");

    // Read the seed SQL file from the database/init directory
    const seedPath = path.join(__dirname, "../../../database/init/02-seed.sql");
    const seedSQL = fs.readFileSync(seedPath, "utf-8");

    // Execute the seed SQL
    console.log("Executing seed SQL...");
    await query(seedSQL);

    console.log("✓ Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("✗ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
