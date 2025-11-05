"""
ILA AI Feedback Service - Main FastAPI Application

REST API for AI-powered project feedback evaluation.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import logging
import structlog

from config import get_settings
from models.evaluation import (
    AnalyzeSubmissionRequest,
    AnalyzeSubmissionResponse,
    GetFeedbackResponse,
    HealthCheckResponse,
    InstructorOverrideRequest
)
from agents.project_evaluator import get_evaluator_agent
from services.document_parser import DocumentParser
from services.database import get_db_service


# Configure logging
logging.basicConfig(level=logging.INFO)
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)

logger = structlog.get_logger()
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting ILA AI Feedback Service", version=settings.service_version)
    
    # Initialize services
    db_service = get_db_service()
    db_service.initialize_pool()
    
    logger.info("Services initialized successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down ILA AI Feedback Service")
    db_service.close_pool()


# Create FastAPI app
app = FastAPI(
    title="ILA AI Feedback Service",
    description="AI-powered evaluation service for student project submissions",
    version=settings.service_version,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def process_submission_async(
    submission_id: str,
    essay_text: str,
    file_urls: list[str],
    content_hash: str
):
    """
    Background task to process submission evaluation.
    
    Args:
        submission_id: Submission UUID
        essay_text: Essay text content
        file_urls: List of file URLs
        content_hash: Content hash for caching
    """
    db_service = get_db_service()
    
    try:
        logger.info("Starting submission processing", submission_id=submission_id)
        
        # Update status to processing
        await db_service.update_submission_status(submission_id, 'processing')
        
        # Parse documents and extract text
        parser = DocumentParser()
        combined_text, input_tokens, was_truncated = await parser.parse_submission(
            essay_text, 
            file_urls
        )
        
        if was_truncated:
            logger.warning(
                "Submission truncated to token limit",
                submission_id=submission_id,
                max_tokens=settings.max_input_tokens
            )
        
        # Evaluate with AI agent
        agent = get_evaluator_agent()
        result = await agent.evaluate_submission(
            submission_id=submission_id,
            submission_text=combined_text,
            input_tokens=input_tokens
        )
        
        # Save results to database
        await db_service.save_evaluation_result(result, content_hash)
        
        logger.info(
            "Submission processing completed",
            submission_id=submission_id,
            tokens_used=result.tokens_used,
            estimated_cost=result.estimated_cost,
            processing_time=result.processing_time
        )
        
    except Exception as e:
        logger.error(
            "Submission processing failed",
            submission_id=submission_id,
            error=str(e),
            exc_info=True
        )
        
        # Update status to failed
        await db_service.update_submission_status(submission_id, 'failed', str(e))


@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint"""
    
    # Check database connection
    db_available = False
    try:
        db_service = get_db_service()
        conn = db_service.get_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
        db_service.return_connection(conn)
        db_available = True
    except Exception as e:
        logger.error("Database health check failed", error=str(e))
    
    # Check OpenAI availability (simplified check)
    openai_available = bool(settings.openai_api_key)
    
    return HealthCheckResponse(
        status="healthy" if (db_available and openai_available) else "degraded",
        service=settings.service_name,
        version=settings.service_version,
        timestamp=datetime.now(),
        openai_available=openai_available,
        database_available=db_available,
        cache_available=True  # Simplified
    )


@app.post("/api/evaluate", response_model=AnalyzeSubmissionResponse)
async def analyze_submission(
    request: AnalyzeSubmissionRequest,
    background_tasks: BackgroundTasks
):
    """
    Analyze a student submission and provide AI feedback.
    
    This endpoint triggers asynchronous processing. The client should:
    1. Receive immediate response with status="processing"
    2. Poll GET /api/feedback/{submission_id} for results
    """
    
    try:
        db_service = get_db_service()
        
        # Compute content hash
        content_hash = db_service.compute_content_hash(
            request.essay_text,
            request.file_urls
        )
        
        # Check cache unless reanalyze is requested
        if not request.reanalyze and settings.cache_enabled:
            cached_submission_id = await db_service.check_cache(content_hash)
            
            if cached_submission_id:
                logger.info(
                    "Cache hit - copying results",
                    submission_id=request.submission_id,
                    cached_from=cached_submission_id
                )
                
                # Get cached results
                cached_result = await db_service.get_submission_feedback(cached_submission_id)
                
                if cached_result and cached_result['processing_status'] == 'completed':
                    # TODO: Copy cached results to new submission
                    # For now, just proceed with new analysis
                    pass
        
        # Add to background processing queue
        background_tasks.add_task(
            process_submission_async,
            submission_id=request.submission_id,
            essay_text=request.essay_text,
            file_urls=request.file_urls or [],
            content_hash=content_hash
        )
        
        logger.info("Submission queued for processing", submission_id=request.submission_id)
        
        return AnalyzeSubmissionResponse(
            success=True,
            submission_id=request.submission_id,
            status="processing",
            message="Submission queued for AI evaluation. This may take 30-60 seconds."
        )
        
    except Exception as e:
        logger.error("Failed to queue submission", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/feedback/{submission_id}", response_model=GetFeedbackResponse)
async def get_feedback(submission_id: str):
    """
    Get AI feedback for a submission.
    
    Returns processing status and results if available.
    """
    
    try:
        db_service = get_db_service()
        result = await db_service.get_submission_feedback(submission_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Submission not found")
        
        return GetFeedbackResponse(
            success=True,
            submission_id=submission_id,
            processing_status=result['processing_status'],
            dimension_scores=result.get('dimensions'),
            overall_feedback=result.get('overall')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to fetch feedback", submission_id=submission_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/reanalyze/{submission_id}")
async def reanalyze_submission(submission_id: str, background_tasks: BackgroundTasks):
    """
    Re-trigger AI analysis for a submission (bypasses cache).
    """
    
    try:
        db_service = get_db_service()
        
        # Get submission data
        conn = db_service.get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT essay_text, file_urls
                    FROM project_submissions
                    WHERE id = %s
                """, (submission_id,))
                
                row = cur.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Submission not found")
                
                essay_text, file_urls = row
        finally:
            db_service.return_connection(conn)
        
        # Queue for reanalysis
        content_hash = db_service.compute_content_hash(essay_text, file_urls)
        
        background_tasks.add_task(
            process_submission_async,
            submission_id=submission_id,
            essay_text=essay_text,
            file_urls=file_urls or [],
            content_hash=content_hash
        )
        
        return {"success": True, "message": "Reanalysis queued"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to reanalyze", submission_id=submission_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/override")
async def instructor_override(request: InstructorOverrideRequest):
    """
    Allow instructor to override AI score for a dimension.
    """
    
    try:
        db_service = get_db_service()
        conn = db_service.get_connection()
        
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE submission_dimension_scores
                    SET instructor_override_score = %s,
                        instructor_comment = %s,
                        instructor_id = %s,
                        overridden_at = NOW()
                    WHERE submission_id = %s
                      AND dimension_id = %s
                """, (
                    request.override_score,
                    request.comment,
                    request.instructor_id,
                    request.submission_id,
                    request.dimension_id
                ))
                
                if cur.rowcount == 0:
                    raise HTTPException(status_code=404, detail="Dimension score not found")
                
                conn.commit()
        finally:
            db_service.return_connection(conn)
        
        return {"success": True, "message": "Instructor override applied"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to apply override", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True,
        log_level=settings.log_level.lower()
    )
