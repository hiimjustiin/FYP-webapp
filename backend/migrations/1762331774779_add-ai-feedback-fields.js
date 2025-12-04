/**
 * Migration: Add AI feedback fields for automated project evaluation
 * 
 * This migration adds support for Pydantic AI-powered feedback system:
 * - AI scores (1-3 scale per dimension)
 * - Detailed feedback and suggestions per dimension
 * - Processing status tracking
 * - Instructor override capabilities
 * - Content caching for cost optimization
 * 
 * Date: 2025-01-05
 */

export async function up(pgm) {
  // =====================================================
  // 1. Add AI-related fields to submission_dimension_scores
  // =====================================================
  
  pgm.addColumns('submission_dimension_scores', {
    // AI scoring (1-3 scale)
    ai_score: {
      type: 'smallint',
      check: 'ai_score >= 1 AND ai_score <= 3',
      comment: 'AI-generated score (1=Naive/Novice, 2=Intermediate, 3=Mastery)',
    },
    
    // AI feedback data
    ai_reasoning: {
      type: 'text',
      comment: 'Detailed AI reasoning for the score',
    },
    ai_strengths: {
      type: 'jsonb',
      comment: 'Array of identified strengths',
    },
    ai_improvements: {
      type: 'jsonb',
      comment: 'Array of specific improvement suggestions',
    },
    ai_examples: {
      type: 'text',
      comment: 'Concrete examples from student submission',
    },
    
    // Full AI response for debugging/auditing
    ai_raw_response: {
      type: 'jsonb',
      comment: 'Complete AI response for audit trail',
    },
    
    // Instructor override
    instructor_override_score: {
      type: 'smallint',
      check: 'instructor_override_score >= 1 AND instructor_override_score <= 3',
      comment: 'Instructor can manually adjust AI score',
    },
    instructor_comment: {
      type: 'text',
      comment: 'Instructor feedback/explanation for override',
    },
    instructor_id: {
      type: 'uuid',
      references: 'users(id)',
      onDelete: 'SET NULL',
      comment: 'Instructor who made the override',
    },
    overridden_at: {
      type: 'timestamptz',
      comment: 'When instructor override occurred',
    },
    
    // Processing status per dimension
    ai_processing_status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending',
      comment: 'pending | processing | completed | failed',
    },
    ai_processing_error: {
      type: 'text',
      comment: 'Error message if AI processing failed',
    },
    ai_processed_at: {
      type: 'timestamptz',
      comment: 'When AI analysis completed',
    },
    
    // Cost tracking
    ai_tokens_used: {
      type: 'integer',
      comment: 'Number of tokens consumed by this analysis',
    },
  });

  // Update personal_score to use final score (AI or instructor override)
  pgm.sql(`
    COMMENT ON COLUMN submission_dimension_scores.personal_score IS 
    'Final score displayed to student (uses instructor_override_score if set, else ai_score)';
  `);

  // =====================================================
  // 2. Add AI-related fields to project_submissions
  // =====================================================
  
  pgm.addColumns('project_submissions', {
    // Overall AI assessment
    ai_overall_summary: {
      type: 'text',
      comment: 'Overall AI assessment across all dimensions',
    },
    ai_overall_strengths: {
      type: 'jsonb',
      comment: 'Top strengths identified across submission',
    },
    ai_priority_improvements: {
      type: 'jsonb',
      comment: 'Top 3 priority areas for improvement',
    },
    ai_estimated_level: {
      type: 'varchar(20)',
      comment: 'Beginner | Intermediate | Advanced',
    },
    
    // Processing status for entire submission
    ai_processing_status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending',
      comment: 'pending | processing | completed | failed | retrying',
    },
    ai_processing_error: {
      type: 'text',
      comment: 'Error message if overall AI processing failed',
    },
    ai_retry_count: {
      type: 'smallint',
      notNull: true,
      default: 0,
      comment: 'Number of retry attempts (max 3)',
    },
    ai_processing_started_at: {
      type: 'timestamptz',
      comment: 'When AI processing started',
    },
    ai_processing_completed_at: {
      type: 'timestamptz',
      comment: 'When AI processing finished',
    },
    
    // Content caching for cost optimization
    content_hash: {
      type: 'varchar(64)',
      comment: 'SHA-256 hash of submission content for cache lookup',
    },
    ai_cache_hit: {
      type: 'boolean',
      default: false,
      comment: 'Whether this submission used cached AI results',
    },
    ai_cached_from_submission_id: {
      type: 'uuid',
      references: 'project_submissions(id)',
      onDelete: 'SET NULL',
      comment: 'If cache hit, points to original submission',
    },
    
    // Cost tracking
    ai_total_tokens_used: {
      type: 'integer',
      comment: 'Total tokens consumed for entire submission',
    },
    ai_estimated_cost: {
      type: 'numeric(8,4)',
      comment: 'Estimated cost in USD for this analysis',
    },
  });

  // =====================================================
  // 3. Create indexes for performance
  // =====================================================
  
  // Index for querying pending AI jobs
  pgm.createIndex('submission_dimension_scores', 'ai_processing_status');
  pgm.createIndex('project_submissions', 'ai_processing_status');
  
  // Index for instructor overrides
  pgm.createIndex('submission_dimension_scores', 'instructor_id');
  
  // Index for cache lookups
  pgm.createIndex('project_submissions', 'content_hash');
  
  // Composite index for finding submissions needing processing
  pgm.createIndex('project_submissions', ['ai_processing_status', 'submitted_at']);

  // =====================================================
  // 4. Create view for final scores (AI + overrides)
  // =====================================================
  
  pgm.createView('submission_final_scores', {}, `
    SELECT 
      sds.id,
      sds.submission_id,
      sds.dimension_id,
      COALESCE(sds.instructor_override_score, sds.ai_score) as final_score,
      sds.ai_score as ai_original_score,
      sds.instructor_override_score,
      sds.ai_reasoning,
      sds.ai_strengths,
      sds.ai_improvements,
      sds.ai_examples,
      sds.instructor_comment,
      sds.ai_processing_status,
      CASE 
        WHEN sds.instructor_override_score IS NOT NULL THEN 'instructor'
        WHEN sds.ai_score IS NOT NULL THEN 'ai'
        ELSE 'pending'
      END as score_source
    FROM submission_dimension_scores sds
  `);

  // =====================================================
  // 5. Add function to update personal_score from AI/override
  // =====================================================
  
  pgm.createFunction(
    'update_personal_score_from_ai',
    [],
    {
      returns: 'trigger',
      language: 'plpgsql',
      replace: true,
    },
    `
    BEGIN
      -- Update personal_score to use instructor override if present, else AI score
      NEW.personal_score := COALESCE(NEW.instructor_override_score, NEW.ai_score, NEW.personal_score);
      RETURN NEW;
    END;
    `
  );

  // Create trigger to automatically update personal_score
  pgm.createTrigger(
    'submission_dimension_scores',
    'update_personal_score_trigger',
    {
      when: 'BEFORE',
      operation: ['INSERT', 'UPDATE'],
      function: 'update_personal_score_from_ai',
      level: 'ROW',
    }
  );
}

export async function down(pgm) {
  // Drop trigger and function
  pgm.dropTrigger('submission_dimension_scores', 'update_personal_score_trigger', { ifExists: true });
  pgm.dropFunction('update_personal_score_from_ai', [], { ifExists: true });
  
  // Drop view
  pgm.dropView('submission_final_scores', { ifExists: true });
  
  // Drop indexes
  pgm.dropIndex('submission_dimension_scores', 'ai_processing_status', { ifExists: true });
  pgm.dropIndex('project_submissions', 'ai_processing_status', { ifExists: true });
  pgm.dropIndex('submission_dimension_scores', 'instructor_id', { ifExists: true });
  pgm.dropIndex('project_submissions', 'content_hash', { ifExists: true });
  pgm.dropIndex('project_submissions', ['ai_processing_status', 'submitted_at'], { ifExists: true });
  
  // Drop columns from project_submissions
  pgm.dropColumns('project_submissions', [
    'ai_overall_summary',
    'ai_overall_strengths',
    'ai_priority_improvements',
    'ai_estimated_level',
    'ai_processing_status',
    'ai_processing_error',
    'ai_retry_count',
    'ai_processing_started_at',
    'ai_processing_completed_at',
    'content_hash',
    'ai_cache_hit',
    'ai_cached_from_submission_id',
    'ai_total_tokens_used',
    'ai_estimated_cost',
  ]);
  
  // Drop columns from submission_dimension_scores
  pgm.dropColumns('submission_dimension_scores', [
    'ai_score',
    'ai_reasoning',
    'ai_strengths',
    'ai_improvements',
    'ai_examples',
    'ai_raw_response',
    'instructor_override_score',
    'instructor_comment',
    'instructor_id',
    'overridden_at',
    'ai_processing_status',
    'ai_processing_error',
    'ai_processed_at',
    'ai_tokens_used',
  ]);
}
