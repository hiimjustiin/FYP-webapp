/**
 * Migration: Add UI-specific fields to projects table
 * 
 * Changes:
 * 1. Add course_code (varchar) for course display
 * 2. Add submission_date for project timeline
 * 3. Add interq_score for InterQ analytics summary
 * 4. Update status column to support Draft/Submitted/Completed
 * 
 * Date: 2025-10-17
 */

export async function up(pgm) {
  // Add new columns to projects table
  pgm.addColumns('projects', {
    course_code: {
      type: 'varchar(50)',
      notNull: false,
      comment: 'Course code (e.g., MSL 902, EEE 311)',
    },
    submission_date: {
      type: 'timestamptz',
      notNull: false,
      comment: 'Date when project was/will be submitted',
    },
    interq_score: {
      type: 'text',
      notNull: false,
      comment: 'InterQ score summary or placeholder',
    },
  });

  // Update status column to match UI expectations
  pgm.sql(`
    ALTER TABLE projects 
    ALTER COLUMN status TYPE varchar(20),
    ALTER COLUMN status SET DEFAULT 'Draft';
  `);

  // Add comment to clarify status values
  pgm.sql(`
    COMMENT ON COLUMN projects.status IS 'Project status: Draft, Submitted, Completed, or legacy: active, completed, archived';
  `);

  // Create index for course_code for faster filtering
  pgm.createIndex('projects', 'course_code');

  // Create index for submission_date for sorting
  pgm.createIndex('projects', 'submission_date');
}

export async function down(pgm) {
  // Remove indexes
  pgm.dropIndex('projects', 'submission_date');
  pgm.dropIndex('projects', 'course_code');

  // Revert status column
  pgm.sql(`
    ALTER TABLE projects 
    ALTER COLUMN status SET DEFAULT 'active';
  `);

  // Remove added columns
  pgm.dropColumns('projects', ['course_code', 'submission_date', 'interq_score']);
}
