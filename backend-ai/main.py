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
    InstructorOverrideRequest,
    ComparisonAnalysis,
    DimensionComparison
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
    content_hash: str,
    previous_submission_id: str | None = None
):
    """
    Background task to process submission evaluation.
    
    Args:
        submission_id: Submission UUID
        essay_text: Essay text content
        file_urls: List of file URLs
        content_hash: Content hash for caching
        previous_submission_id: Previous submission ID for comparison (optional)
    """
    db_service = get_db_service()
    
    try:
        logger.info("Starting submission processing", submission_id=submission_id, has_previous=bool(previous_submission_id))
        
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
        
        # Generate comparison analysis if previous submission exists
        comparison_analysis = None
        if previous_submission_id:
            try:
                comparison_analysis = await generate_comparison_analysis(
                    db_service, 
                    submission_id, 
                    previous_submission_id,
                    result
                )
                
                if comparison_analysis:
                    await db_service.save_comparison_analysis(submission_id, comparison_analysis)
                    logger.info("Comparison analysis saved", submission_id=submission_id)
            except Exception as e:
                logger.error("Failed to generate comparison", error=str(e))
                # Don't fail the whole evaluation if comparison fails
        
        logger.info(
            "Submission processing completed",
            submission_id=submission_id,
            tokens_used=result.tokens_used,
            estimated_cost=result.estimated_cost,
            processing_time=result.processing_time,
            has_comparison=bool(comparison_analysis)
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


async def generate_comparison_analysis(
    db_service,
    current_submission_id: str,
    previous_submission_id: str,
    current_result
) -> ComparisonAnalysis | None:
    """
    Generate comparison analysis between current and previous submissions.
    
    Args:
        db_service: Database service instance
        current_submission_id: Current submission ID
        previous_submission_id: Previous submission ID
        current_result: Current evaluation result
        
    Returns:
        ComparisonAnalysis or None if comparison not possible
    """
    from config import RUBRIC_CRITERIA
    
    # Get previous submission scores
    previous_feedback = await db_service.get_submission_feedback(previous_submission_id)
    
    if not previous_feedback or previous_feedback['processing_status'] != 'completed':
        logger.warning("Previous submission not completed, skipping comparison", previous_id=previous_submission_id)
        return None
    
    previous_dimensions = previous_feedback.get('dimensions', [])
    if not previous_dimensions:
        return None
    
    # Create dimension score lookup from previous submission
    previous_scores = {d['dimension_id']: d.get('ai_score', 0) for d in previous_dimensions}
    
    # Build dimension comparisons
    dimension_comparisons = []
    improvements = []
    regressions = []
    
    for dim_score in current_result.dimension_scores:
        prev_score = previous_scores.get(dim_score.dimension_id, 0)
        curr_score = dim_score.score
        score_change = curr_score - prev_score
        
        dim_name = RUBRIC_CRITERIA.get(dim_score.dimension_id, {}).get('label', f'Dimension {dim_score.dimension_id}')
        
        comparison = DimensionComparison(
            dimension_id=dim_score.dimension_id,
            dimension_name=dim_name,
            previous_score=prev_score,
            current_score=curr_score,
            score_change=score_change,
            improvement_summary=f"{'Improved' if score_change > 0 else 'Regressed' if score_change < 0 else 'Unchanged'} from {prev_score} to {curr_score}"
        )
        dimension_comparisons.append(comparison)
        
        if score_change > 0:
            improvements.append(f"{dim_name}: +{score_change}")
        elif score_change < 0:
            regressions.append(f"{dim_name}: {score_change}")
    
    # Calculate averages
    previous_avg = sum(previous_scores.values()) / len(previous_scores) if previous_scores else 0
    current_avg = sum(d.score for d in current_result.dimension_scores) / len(current_result.dimension_scores)
    score_delta = current_avg - previous_avg
    
    # Determine overall improvement status
    if score_delta > 0.1:
        overall_improvement = "improved"
    elif score_delta < -0.1:
        overall_improvement = "regressed"
    else:
        overall_improvement = "unchanged"
    
    # Generate summary
    summary_parts = []
    if improvements:
        summary_parts.append(f"Improved in {len(improvements)} dimension(s)")
    if regressions:
        summary_parts.append(f"Regressed in {len(regressions)} dimension(s)")
    if not improvements and not regressions:
        summary_parts.append("Scores remained consistent across all dimensions")
    
    summary = f"Average score changed from {previous_avg:.2f} to {current_avg:.2f} ({'+' if score_delta >= 0 else ''}{score_delta:.2f}). {'. '.join(summary_parts)}."
    
    return ComparisonAnalysis(
        previous_submission_id=previous_submission_id,
        current_submission_id=current_submission_id,
        overall_improvement=overall_improvement,
        previous_avg_score=round(previous_avg, 2),
        current_avg_score=round(current_avg, 2),
        score_delta=round(score_delta, 2),
        dimension_comparisons=dimension_comparisons,
        summary=summary,
        key_improvements=improvements[:3],
        key_regressions=regressions[:3]
    )


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
            content_hash=content_hash,
            previous_submission_id=request.previous_submission_id
        )
        
        logger.info(
            "Submission queued for processing", 
            submission_id=request.submission_id,
            has_previous=bool(request.previous_submission_id)
        )
        
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
