/**
 * Migration: Add course_dimensions table
 * 
 * This migration creates a junction table to allow courses to have
 * a configurable set of dimensions (1-9). By default, courses will
 * have all 9 dimensions enabled.
 * 
 * Date: 2025-11-28
 */

export async function up(pgm) {
  // Create course_dimensions junction table
  pgm.createTable('course_dimensions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    course_id: {
      type: 'uuid',
      notNull: true,
      references: 'courses(id)',
      onDelete: 'CASCADE',
    },
    dimension_id: {
      type: 'smallint',
      notNull: true,
      references: 'dimensions(id)',
      onDelete: 'CASCADE',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  // Create unique constraint: one entry per course+dimension
  pgm.addConstraint('course_dimensions', 'unique_course_dimension', {
    unique: ['course_id', 'dimension_id'],
  });

  // Create indexes for course_dimensions
  pgm.createIndex('course_dimensions', 'course_id');
  pgm.createIndex('course_dimensions', 'dimension_id');

  // Seed existing courses with all 9 dimensions
  pgm.sql(`
    INSERT INTO course_dimensions (course_id, dimension_id)
    SELECT c.id, d.id
    FROM courses c
    CROSS JOIN dimensions d
    ON CONFLICT DO NOTHING;
  `);
}

export async function down(pgm) {
  pgm.dropTable('course_dimensions', { ifExists: true, cascade: true });
}
