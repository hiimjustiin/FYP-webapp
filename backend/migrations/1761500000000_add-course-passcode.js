/**
 * Migration: Add passcode field to courses table
 * 
 * Changes:
 * 1. Add passcode TEXT column to courses table for enrollment security
 * 2. Passcode is required and defaults to course code for backward compatibility
 * 
 * Date: 2025-11-05
 */

export async function up(pgm) {
  // Add passcode column to courses table
  // Default to course code if not provided, allowing instructors to set custom passcodes
  pgm.addColumns("courses", {
    passcode: {
      type: "text",
      notNull: true,
      default: pgm.raw("code"),
    },
  });

  // Add index for better query performance
  pgm.createIndex("courses", "passcode");
}

export async function down(pgm) {
  // Drop index
  pgm.dropIndex("courses", "passcode");

  // Drop column
  pgm.dropColumns("courses", ["passcode"]);
}
