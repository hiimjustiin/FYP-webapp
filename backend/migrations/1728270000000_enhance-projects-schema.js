/**
 * Migration: Enhance projects schema for course selection, project types, and file uploads
 * 
 * Changes:
 * 1. Add course_id to projects (FK to courses)
 * 2. Add project_type (individual/group)
 * 3. Add essay_text for individual projects
 * 4. Create project_files table for file uploads
 * 
 * Date: 2025-10-07
 */

export async function up(pgm) {
  // Add new columns to projects table
  pgm.addColumns('projects', {
    course_id: {
      type: 'uuid',
      references: 'courses',
      onDelete: 'SET NULL',
      notNull: false,
      comment: 'Associated course from predefined dropdown'
    },
    project_type: {
      type: 'text',
      notNull: true,
      default: 'individual',
      check: "project_type IN ('individual', 'group')",
      comment: 'Type of project: individual or group'
    },
    essay_text: {
      type: 'text',
      notNull: false,
      comment: 'Essay content for individual projects (text input)'
    }
  });

  // Create project_files table for file uploads
  pgm.createTable('project_files', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    project_id: {
      type: 'uuid',
      notNull: true,
      references: 'projects',
      onDelete: 'CASCADE',
      comment: 'Associated project'
    },
    file_name: {
      type: 'text',
      notNull: true,
      comment: 'Original filename'
    },
    file_url: {
      type: 'text',
      notNull: true,
      comment: 'Storage URL or path to uploaded file'
    },
    file_type: {
      type: 'text',
      notNull: false,
      comment: 'MIME type (e.g., application/pdf)'
    },
    file_size: {
      type: 'integer',
      notNull: false,
      comment: 'File size in bytes'
    },
    uploaded_by: {
      type: 'uuid',
      notNull: false,
      references: 'users',
      onDelete: 'SET NULL',
      comment: 'User who uploaded the file'
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()')
    }
  });

  // Add indexes for better query performance
  pgm.createIndex('projects', 'course_id');
  pgm.createIndex('projects', 'project_type');
  pgm.createIndex('project_files', 'project_id');
  pgm.createIndex('project_files', 'uploaded_by');

  // Add comment to clarify project_members usage
  pgm.sql(`
    COMMENT ON TABLE project_members IS 'Team members for group projects. For individual projects, owner_id in projects table is sufficient.';
  `);
}

export async function down(pgm) {
  // Drop indexes
  pgm.dropIndex('project_files', 'uploaded_by');
  pgm.dropIndex('project_files', 'project_id');
  pgm.dropIndex('projects', 'project_type');
  pgm.dropIndex('projects', 'course_id');

  // Drop project_files table
  pgm.dropTable('project_files');

  // Drop columns from projects table
  pgm.dropColumns('projects', ['essay_text', 'project_type', 'course_id']);
}
