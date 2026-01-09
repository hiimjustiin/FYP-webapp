/**
 * Migration: Add iteration tracking for resubmissions
 *
 * This migration adds support for multiple submission iterations:
 * - iteration_number column to track submission version (1, 2, 3...)
 * - previous_submission_id to track lineage for comparisons
 * - comparison_analysis for storing AI comparative feedback
 *
 * Date: 2025-12-19
 */

export async function up(pgm) {
  // =====================================================
  // 1. Add iteration tracking fields to project_submissions
  // =====================================================

  pgm.addColumns("project_submissions", {
    // Iteration number (1 = first submission, 2 = second, etc.)
    iteration_number: {
      type: "integer",
      notNull: true,
      default: 1,
      comment:
        "Submission iteration number (1 = first submission, 2 = resubmission, etc.)",
    },

    // Reference to previous submission for comparison
    previous_submission_id: {
      type: "uuid",
      references: "project_submissions(id)",
      onDelete: "SET NULL",
      comment: "Links to previous submission for comparison analysis",
    },

    // AI comparison analysis between this and previous submission
    comparison_analysis: {
      type: "jsonb",
      comment:
        "AI comparison between this and previous submission (score deltas, improvements, regressions)",
    },
  });

  // =====================================================
  // 2. Create unique constraint for project + iteration
  // =====================================================

  // Ensure each project can only have one submission per iteration number
  pgm.createIndex("project_submissions", ["project_id", "iteration_number"], {
    unique: true,
    name: "project_submissions_project_iteration_unique",
  });

  // Index for finding previous submission quickly
  pgm.createIndex("project_submissions", "previous_submission_id");

  // =====================================================
  // 3. Update existing submissions to have iteration_number = 1
  // =====================================================

  // All existing submissions are iteration 1 by default (handled by column default)
  pgm.sql(`
    COMMENT ON COLUMN project_submissions.iteration_number IS 
    'Submission iteration number - starts at 1, increments with each resubmission';
  `);
}

export async function down(pgm) {
  // Drop indexes
  pgm.dropIndex("project_submissions", "previous_submission_id", {
    ifExists: true,
  });
  pgm.dropIndex("project_submissions", ["project_id", "iteration_number"], {
    ifExists: true,
    name: "project_submissions_project_iteration_unique",
  });

  // Drop columns
  pgm.dropColumns("project_submissions", [
    "iteration_number",
    "previous_submission_id",
    "comparison_analysis",
  ]);
}
