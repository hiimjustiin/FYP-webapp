/**
 * Migration: Add submission_instructor_suggestions table
 * Purpose: Allow instructors to provide overall improvement suggestions per submission attempt
 * without affecting AI scores or submission status
 */

export async function up(pgm) {
  // Create submission_instructor_suggestions table
  pgm.createTable("submission_instructor_suggestions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    submission_id: {
      type: "uuid",
      notNull: true,
      references: "project_submissions",
      onDelete: "CASCADE",
    },
    instructor_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "SET NULL",
    },
    suggestion_text: {
      type: "text",
      notNull: true,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  // One suggestion per submission (enforce single current value)
  pgm.createConstraint("submission_instructor_suggestions", "unique_submission_suggestion", {
    unique: ["submission_id"],
  });

  // Index for instructor lookup
  pgm.createIndex("submission_instructor_suggestions", "instructor_id");

  // Add comment
  pgm.sql(`
    COMMENT ON TABLE submission_instructor_suggestions IS 
    'Instructor improvement suggestions per submission attempt (no scoring impact)';
  `);
}

export async function down(pgm) {
  pgm.dropTable("submission_instructor_suggestions");
}
