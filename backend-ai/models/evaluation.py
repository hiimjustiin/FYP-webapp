"""
ILA AI Feedback Service - Pydantic Models

Data models for AI evaluation results and API requests/responses.
"""

from typing import List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field, validator


class DimensionScore(BaseModel):
    """Score and feedback for a single dimension"""
    
    dimension_id: int = Field(..., ge=1, le=9, description="Dimension ID (1-9)")
    score: int = Field(..., ge=1, le=3, description="Score: 1=Naive/Novice, 2=Intermediate, 3=Mastery")
    reasoning: str = Field(..., min_length=50, max_length=500, description="Detailed reasoning for the score")
    strengths: List[str] = Field(..., min_items=1, max_items=3, description="1-3 identified strengths")
    improvements: List[str] = Field(..., min_items=1, max_items=3, description="1-3 specific improvement suggestions")
    examples: str = Field(..., min_length=20, max_length=300, description="Concrete examples from submission")
    
    @validator('strengths', 'improvements')
    def validate_list_items(cls, v):
        """Ensure each item in list is non-empty"""
        if not all(item.strip() for item in v):
            raise ValueError("List items cannot be empty strings")
        return v


class OverallAssessment(BaseModel):
    """Overall assessment across all dimensions"""
    
    overall_summary: str = Field(..., min_length=100, max_length=1000, description="Overall assessment summary")
    overall_strengths: List[str] = Field(..., min_items=2, max_items=5, description="Top strengths across submission")
    priority_improvements: List[str] = Field(..., min_items=3, max_items=3, description="Top 3 priority improvements")
    estimated_level: Literal["Beginner", "Intermediate", "Advanced"] = Field(..., description="Overall skill level")
    
    @validator('overall_strengths', 'priority_improvements')
    def validate_overall_lists(cls, v):
        """Ensure each item is non-empty and substantive"""
        if not all(len(item.strip()) > 10 for item in v):
            raise ValueError("List items must be substantive (>10 chars)")
        return v


class EvaluationResult(BaseModel):
    """Complete evaluation result for a submission"""
    
    submission_id: str
    dimension_scores: List[DimensionScore] = Field(..., min_items=9, max_items=9, description="Scores for all 9 dimensions")
    overall: OverallAssessment
    tokens_used: int = Field(..., ge=0)
    estimated_cost: float = Field(..., ge=0.0)
    processing_time: float = Field(..., ge=0.0, description="Processing time in seconds")
    cache_hit: bool = False
    
    @validator('dimension_scores')
    def validate_all_dimensions(cls, v):
        """Ensure all 9 dimensions are evaluated"""
        dimension_ids = {score.dimension_id for score in v}
        expected_ids = set(range(1, 10))
        if dimension_ids != expected_ids:
            raise ValueError(f"Missing dimensions: {expected_ids - dimension_ids}")
        return v


class AnalyzeSubmissionRequest(BaseModel):
    """Request to analyze a student submission"""
    
    submission_id: str
    project_id: str
    course_id: str
    user_id: str
    essay_text: str = Field(..., description="Essay text content")
    file_urls: Optional[List[str]] = Field(default=None, description="URLs to uploaded files (PDF/DOCX)")
    reanalyze: bool = Field(default=False, description="Force re-analysis (skip cache)")
    
    @validator('essay_text')
    def validate_essay_or_files(cls, v, values):
        """Ensure either essay_text has content OR files are provided"""
        if not v or len(v.strip()) < 50:
            # Allow short/empty essay if files will be provided
            # File validation happens in the endpoint
            pass
        return v


class AnalyzeSubmissionResponse(BaseModel):
    """Response from submission analysis"""
    
    success: bool
    submission_id: str
    status: Literal["processing", "completed", "failed"]
    message: str
    result: Optional[EvaluationResult] = None
    error: Optional[str] = None


class InstructorOverrideRequest(BaseModel):
    """Request to override AI score for a dimension"""
    
    submission_id: str
    dimension_id: int = Field(..., ge=1, le=9)
    override_score: int = Field(..., ge=1, le=3)
    comment: str = Field(..., min_length=10, max_length=500)
    instructor_id: str


class GetFeedbackResponse(BaseModel):
    """Response for fetching submission feedback"""
    
    success: bool
    submission_id: str
    processing_status: Literal["pending", "processing", "completed", "failed"]
    dimension_scores: Optional[List[dict]] = None
    overall_feedback: Optional[dict] = None
    error: Optional[str] = None


class HealthCheckResponse(BaseModel):
    """Health check response"""
    
    status: str
    service: str
    version: str
    timestamp: datetime
    openai_available: bool
    database_available: bool
    cache_available: bool
