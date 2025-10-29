/**
 * Migration: Add instructor dashboard support
 * 
 * Changes:
 * 1. Add file storage fields to project_submissions (file_url, file_type, file_size_bytes)
 * 2. Add status tracking to project_submissions (submitted/scoring/scored/reviewed)
 * 3. Add AI feedback and instructor override fields to submission_dimension_scores
 * 4. Create notifications table for submission/scoring notifications
 * 
 * Date: 2025-10-24
 */

export async function up(pgm) {
  // Add file storage and status tracking to project_submissions
  pgm.addColumns('project_submissions', {
    file_url: { type: 'text', notNull: false },
    file_type: { type: 'varchar(50)', notNull: false },
    file_size_bytes: { type: 'integer', notNull: false },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'submitted',
      check: "status IN ('submitted', 'scoring', 'scored', 'reviewed')"
    }
  });

  // Add AI feedback and instructor override fields to submission_dimension_scores
  pgm.addColumns('submission_dimension_scores', {
    ai_feedback_raw: { type: 'jsonb', notNull: false },
    ai_score_original: { type: 'smallint', notNull: false },
    instructor_override: { type: 'boolean', notNull: true, default: false },
    instructor_comments: { type: 'text', notNull: false },
    scored_at: { type: 'timestamptz', notNull: false },
    reviewed_at: { type: 'timestamptz', notNull: false }
  });

  // Enhance notifications table (already exists, add new columns)
  pgm.addColumns('notifications', {
    title: { type: 'text', notNull: false },
    message: { type: 'text', notNull: false },
    related_submission_id: {
      type: 'uuid',
      notNull: false,
      references: 'project_submissions',
      onDelete: 'CASCADE'
    },
    is_read: { type: 'boolean', notNull: true, default: false }
  });

  // Create indexes for notifications
  pgm.createIndex('notifications', ['created_at'], { method: 'btree', order: 'DESC', ifNotExists: true });
}

export async function down(pgm) {
  // Drop index
  pgm.dropIndex('notifications', ['created_at'], { ifExists: true });

  // Drop columns from notifications
  pgm.dropColumns('notifications', [
    'title',
    'message',
    'related_submission_id',
    'is_read'
  ], { ifExists: true });

  // Drop columns from submission_dimension_scores
  pgm.dropColumns('submission_dimension_scores', [
    'ai_feedback_raw',
    'ai_score_original',
    'instructor_override',
    'instructor_comments',
    'scored_at',
    'reviewed_at'
  ]);

  // Drop columns from project_submissions
  pgm.dropColumns('project_submissions', [
    'file_url',
    'file_type',
    'file_size_bytes',
    'status'
  ]);
}
