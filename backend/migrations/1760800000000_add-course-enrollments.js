/**
 * Migration: Add course enrollments and enhanced user profiles
 * 
 * Changes:
 * 1. Create course_enrollments table for course registration system
 * 2. Add user profile fields (phone, bio, department, student_id)
 * 
 * Date: 2025-01-14
 */

export async function up(pgm) {
  // Create course_enrollments table
  pgm.createTable("course_enrollments", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    course_id: {
      type: "uuid",
      notNull: true,
      references: "courses",
      onDelete: "CASCADE",
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    status: {
      type: "text",
      notNull: true,
      default: "active",
    },
    enrolled_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    completed_at: {
      type: "timestamptz",
    },
  });

  // Add unique constraint to prevent duplicate enrollments
  pgm.addConstraint("course_enrollments", "unique_course_user", {
    unique: ["course_id", "user_id"],
  });

  // Add indexes for better query performance
  pgm.createIndex("course_enrollments", "user_id");
  pgm.createIndex("course_enrollments", "course_id");
  pgm.createIndex("course_enrollments", ["user_id", "status"]);

  // Add additional user profile fields
  pgm.addColumns("users", {
    phone: { type: "text" },
    bio: { type: "text" },
    department: { type: "text" },
    student_id: { type: "text" },
  });

  // Add index on student_id
  pgm.createIndex("users", "student_id");
}

export async function down(pgm) {
  // Drop indexes
  pgm.dropIndex("course_enrollments", "user_id");
  pgm.dropIndex("course_enrollments", "course_id");
  pgm.dropIndex("course_enrollments", ["user_id", "status"]);
  pgm.dropIndex("users", "student_id");

  // Drop table
  pgm.dropTable("course_enrollments");

  // Drop user columns
  pgm.dropColumns("users", ["phone", "bio", "department", "student_id"]);
}
