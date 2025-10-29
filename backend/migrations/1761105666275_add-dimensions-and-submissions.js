/**
 * Migration: Add dimensions and project submissions tables
 * 
 * This migration creates:
 * 1. dimensions table - catalog of 9 ILA dimensions (static data)
 * 2. project_submissions table - multiple drafts per project
 * 3. submission_dimension_scores table - scores per submission+dimension
 * 
 * Date: 2025-10-22
 */

export async function up(pgm) {
  // 1. Create dimensions table (static catalog)
  pgm.createTable('dimensions', {
    id: {
      type: 'smallserial',
      primaryKey: true,
    },
    label: {
      type: 'text',
      notNull: true,
      unique: true,
    },
    variant: {
      type: 'varchar(20)',
      notNull: true,
      comment: 'Color variant for UI display',
    },
    display_order: {
      type: 'integer',
      notNull: true,
    },
  });

  // Seed the 9 dimensions from Home.tsx mock data
  pgm.sql(`
    INSERT INTO dimensions (id, label, variant, display_order) VALUES
    (1, 'Frame the problem with an integrative approach', 'lime', 1),
    (2, 'Stakeholder consideration', 'yellow', 2),
    (3, 'Range of disciplinary perspectives', 'purple', 3),
    (4, 'Disciplinary reasoning', 'teal', 4),
    (5, 'Credibility of disciplinary knowledge', 'blue', 5),
    (6, 'Number of disciplinary integration', 'grey', 6),
    (7, 'Depth of disciplinary integration', 'green', 7),
    (8, 'Social (society) impact', 'navy', 8),
    (9, 'Limitations', 'pink', 9);
  `);

  // 2. Create project_submissions table
  pgm.createTable('project_submissions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    project_id: {
      type: 'uuid',
      notNull: true,
      references: 'projects(id)',
      onDelete: 'CASCADE',
    },
    course_id: {
      type: 'uuid',
      notNull: false,
      references: 'courses(id)',
      onDelete: 'SET NULL',
      comment: 'Course for calculating class averages',
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
      comment: 'Student who submitted this draft',
    },
    name: {
      type: 'text',
      notNull: true,
      comment: 'Submission name (e.g., Draft 1, Final Submission)',
    },
    submitted_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  // Create indexes for project_submissions
  pgm.createIndex('project_submissions', 'project_id');
  pgm.createIndex('project_submissions', 'user_id');
  pgm.createIndex('project_submissions', 'course_id');
  pgm.createIndex('project_submissions', 'submitted_at');

  // 3. Create submission_dimension_scores table
  pgm.createTable('submission_dimension_scores', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    submission_id: {
      type: 'uuid',
      notNull: true,
      references: 'project_submissions(id)',
      onDelete: 'CASCADE',
    },
    dimension_id: {
      type: 'smallint',
      notNull: true,
      references: 'dimensions(id)',
      onDelete: 'RESTRICT',
    },
    personal_score: {
      type: 'smallint',
      notNull: true,
      check: 'personal_score >= 0 AND personal_score <= 10',
      comment: 'Individual student score (0-10)',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  // Create unique constraint: one score per submission+dimension
  pgm.addConstraint('submission_dimension_scores', 'unique_submission_dimension', {
    unique: ['submission_id', 'dimension_id'],
  });

  // Create indexes for submission_dimension_scores
  pgm.createIndex('submission_dimension_scores', 'submission_id');
  pgm.createIndex('submission_dimension_scores', 'dimension_id');
}

export async function down(pgm) {
  // Drop tables in reverse order (respecting foreign keys)
  pgm.dropTable('submission_dimension_scores', { ifExists: true, cascade: true });
  pgm.dropTable('project_submissions', { ifExists: true, cascade: true });
  pgm.dropTable('dimensions', { ifExists: true, cascade: true });
}
