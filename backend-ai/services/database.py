"""
ILA AI Feedback Service - Database Service

Handle all database operations for AI feedback storage and retrieval.
"""

import psycopg2
from psycopg2.extras import RealDictCursor, Json
from psycopg2.pool import ThreadedConnectionPool
from typing import Optional, List, Dict, Any
from datetime import datetime
import hashlib

from config import get_settings
from models.evaluation import EvaluationResult, DimensionScore, ComparisonAnalysis


class DatabaseService:
    """Manage database connections and operations"""
    
    def __init__(self):
        self.settings = get_settings()
        self.pool: Optional[ThreadedConnectionPool] = None
    
    def initialize_pool(self):
        """Initialize database connection pool"""
        if self.pool is None:
            self.pool = ThreadedConnectionPool(
                minconn=self.settings.db_pool_min,
                maxconn=self.settings.db_pool_max,
                dsn=self.settings.database_url
            )
    
    def get_connection(self):
        """Get connection from pool"""
        if self.pool is None:
            self.initialize_pool()
        return self.pool.getconn()
    
    def return_connection(self, conn):
        """Return connection to pool"""
        if self.pool:
            self.pool.putconn(conn)
    
    def close_pool(self):
        """Close all connections in pool"""
        if self.pool:
            self.pool.closeall()
            self.pool = None
    
    def compute_content_hash(self, essay_text: str, file_urls: Optional[List[str]] = None) -> str:
        """
        Compute SHA-256 hash of submission content for caching.
        
        Args:
            essay_text: Essay text
            file_urls: Optional file URLs
            
        Returns:
            Hex string of SHA-256 hash
        """
        content = essay_text
        if file_urls:
            content += "|".join(sorted(file_urls))
        
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
    
    async def check_cache(self, content_hash: str) -> Optional[str]:
        """
        Check if submission with same content hash was already processed.
        
        Args:
            content_hash: Content hash to look up
            
        Returns:
            Submission ID if cache hit, None otherwise
        """
        conn = self.get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT id 
                    FROM project_submissions 
                    WHERE content_hash = %s 
                      AND ai_processing_status = 'completed'
                      AND ai_processing_completed_at IS NOT NULL
                    ORDER BY ai_processing_completed_at DESC
                    LIMIT 1
                """, (content_hash,))
                
                result = cur.fetchone()
                return result['id'] if result else None
        finally:
            self.return_connection(conn)
    
    async def update_submission_status(
        self, 
        submission_id: str, 
        status: str,
        error: Optional[str] = None
    ):
        """
        Update submission processing status.
        
        Args:
            submission_id: Submission UUID
            status: Processing status (pending, processing, completed, failed)
            error: Optional error message
        """
        conn = self.get_connection()
        try:
            with conn.cursor() as cur:
                if status == 'processing':
                    cur.execute("""
                        UPDATE project_submissions
                        SET ai_processing_status = %s,
                            ai_processing_started_at = NOW()
                        WHERE id = %s
                    """, (status, submission_id))
                elif status == 'completed':
                    cur.execute("""
                        UPDATE project_submissions
                        SET ai_processing_status = %s,
                            ai_processing_completed_at = NOW()
                        WHERE id = %s
                    """, (status, submission_id))
                    # Also update project status to Completed
                    cur.execute("""
                        UPDATE projects p
                        SET status = 'Completed'
                        FROM project_submissions ps
                        WHERE ps.id = %s AND p.id = ps.project_id
                    """, (submission_id,))
                elif status == 'failed':
                    cur.execute("""
                        UPDATE project_submissions
                        SET ai_processing_status = %s,
                            ai_processing_error = %s,
                            ai_retry_count = ai_retry_count + 1
                        WHERE id = %s
                    """, (status, error, submission_id))
                    # Also update project status to Failed
                    cur.execute("""
                        UPDATE projects p
                        SET status = 'Failed'
                        FROM project_submissions ps
                        WHERE ps.id = %s AND p.id = ps.project_id
                    """, (submission_id,))
                
                conn.commit()
        finally:
            self.return_connection(conn)
    
    async def save_evaluation_result(
        self, 
        result: EvaluationResult,
        content_hash: str,
        cached_from: Optional[str] = None
    ):
        """
        Save complete evaluation result to database.
        
        Args:
            result: EvaluationResult to save
            content_hash: Content hash for caching
            cached_from: Optional submission ID if this was a cache hit
        """
        conn = self.get_connection()
        try:
            with conn.cursor() as cur:
                # Update project_submissions with overall assessment
                cur.execute("""
                    UPDATE project_submissions
                    SET ai_overall_summary = %s,
                        ai_overall_strengths = %s,
                        ai_priority_improvements = %s,
                        ai_estimated_level = %s,
                        ai_processing_status = 'completed',
                        ai_processing_completed_at = NOW(),
                        content_hash = %s,
                        ai_cache_hit = %s,
                        ai_cached_from_submission_id = %s,
                        ai_total_tokens_used = %s,
                        ai_estimated_cost = %s
                    WHERE id = %s
                """, (
                    result.overall.overall_summary,
                    Json(result.overall.overall_strengths),
                    Json(result.overall.priority_improvements),
                    result.overall.estimated_level,
                    content_hash,
                    result.cache_hit,
                    cached_from,
                    result.tokens_used,
                    result.estimated_cost,
                    result.submission_id
                ))
                
                # Also update project status to Completed
                cur.execute("""
                    UPDATE projects p
                    SET status = 'Completed', updated_at = NOW()
                    FROM project_submissions ps
                    WHERE ps.id = %s AND p.id = ps.project_id
                """, (result.submission_id,))
                
                # Insert/update dimension scores
                for dim_score in result.dimension_scores:
                    cur.execute("""
                        INSERT INTO submission_dimension_scores (
                            submission_id,
                            dimension_id,
                            ai_score,
                            ai_reasoning,
                            ai_strengths,
                            ai_improvements,
                            ai_examples,
                            ai_raw_response,
                            ai_processing_status,
                            ai_processed_at,
                            ai_tokens_used,
                            personal_score
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, 'completed', NOW(), %s, %s
                        )
                        ON CONFLICT (submission_id, dimension_id) 
                        DO UPDATE SET
                            ai_score = EXCLUDED.ai_score,
                            ai_reasoning = EXCLUDED.ai_reasoning,
                            ai_strengths = EXCLUDED.ai_strengths,
                            ai_improvements = EXCLUDED.ai_improvements,
                            ai_examples = EXCLUDED.ai_examples,
                            ai_raw_response = EXCLUDED.ai_raw_response,
                            ai_processing_status = EXCLUDED.ai_processing_status,
                            ai_processed_at = EXCLUDED.ai_processed_at,
                            ai_tokens_used = EXCLUDED.ai_tokens_used,
                            personal_score = EXCLUDED.personal_score
                    """, (
                        result.submission_id,
                        dim_score.dimension_id,
                        dim_score.score,
                        dim_score.reasoning,
                        Json(dim_score.strengths),
                        Json(dim_score.improvements),
                        dim_score.examples,
                        Json(dim_score.dict()),  # Store full response for audit
                        result.tokens_used // 9,  # Approximate tokens per dimension
                        dim_score.score  # Set personal_score to AI score initially
                    ))
                
                conn.commit()
        finally:
            self.return_connection(conn)
    
    async def get_submission_feedback(self, submission_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve AI feedback for a submission.
        
        Args:
            submission_id: Submission UUID
            
        Returns:
            Dictionary with dimension scores and overall feedback
        """
        conn = self.get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Get submission-level data
                cur.execute("""
                    SELECT 
                        id,
                        project_id,
                        name,
                        submitted_at,
                        ai_processing_status,
                        ai_overall_summary,
                        ai_overall_strengths,
                        ai_priority_improvements,
                        ai_estimated_level,
                        ai_processing_error,
                        ai_total_tokens_used,
                        ai_estimated_cost,
                        essay_text,
                        file_urls
                    FROM project_submissions
                    WHERE id = %s
                """, (submission_id,))
                
                submission = cur.fetchone()
                if not submission:
                    return None
                
                # Get dimension scores
                cur.execute("""
                    SELECT 
                        dimension_id,
                        ai_score,
                        ai_reasoning,
                        ai_strengths,
                        ai_improvements,
                        ai_examples,
                        instructor_override_score,
                        instructor_comment,
                        ai_processing_status,
                        personal_score
                    FROM submission_dimension_scores
                    WHERE submission_id = %s
                    ORDER BY dimension_id
                """, (submission_id,))
                
                dimensions = cur.fetchall()
                
                return {
                    'processing_status': submission['ai_processing_status'],
                    'overall': dict(submission) if submission['ai_processing_status'] == 'completed' else None,
                    'dimensions': [dict(d) for d in dimensions] if dimensions else []
                }
        finally:
            self.return_connection(conn)
    
    async def save_comparison_analysis(
        self, 
        submission_id: str, 
        comparison: ComparisonAnalysis
    ):
        """
        Save comparison analysis to the submission record.
        
        Args:
            submission_id: Current submission UUID
            comparison: ComparisonAnalysis result
        """
        conn = self.get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE project_submissions
                    SET comparison_analysis = %s
                    WHERE id = %s
                """, (
                    Json(comparison.dict()),
                    submission_id
                ))
                conn.commit()
        finally:
            self.return_connection(conn)


# Singleton instance
_db_service: Optional[DatabaseService] = None


def get_db_service() -> DatabaseService:
    """Get singleton database service instance"""
    global _db_service
    if _db_service is None:
        _db_service = DatabaseService()
        _db_service.initialize_pool()
    return _db_service
