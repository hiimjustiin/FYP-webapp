/**
 * Migration: Add essay_text and file_urls to project_submissions
 * 
 * These fields are needed to store the actual submission content
 * for AI analysis. They were missing from the original table definition.
 * 
 * Date: 2025-11-14
 */

export async function up(pgm) {
  // Add essay_text and file_urls columns to project_submissions
  pgm.addColumns('project_submissions', {
    essay_text: {
      type: 'text',
      comment: 'Essay/reflection text submitted by student',
    },
    file_urls: {
      type: 'jsonb',
      comment: 'Array of uploaded file URLs for this submission',
    },
  });

  // Create index for faster queries on submissions with content
  pgm.createIndex('project_submissions', 'essay_text', {
    where: 'essay_text IS NOT NULL',
  });
}

export async function down(pgm) {
  // Drop index
  pgm.dropIndex('project_submissions', 'essay_text', { ifExists: true });
  
  // Drop columns
  pgm.dropColumns('project_submissions', ['essay_text', 'file_urls']);
}
