"""
ILA AI Feedback Service - Project Evaluator Agent

Pydantic AI agent for evaluating student projects against 9 rubric dimensions.
"""

from typing import List
import asyncio
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openai import OpenAIModel

from config import get_settings, RUBRIC_CRITERIA
from models.evaluation import DimensionScore, OverallAssessment, EvaluationResult


settings = get_settings()


# System prompt with embedded rubric criteria
SYSTEM_PROMPT = """You are an expert academic evaluator for interdisciplinary learning assessment (ILA). 
Your task is to evaluate student project submissions against 9 specific rubric dimensions.

EVALUATION FRAMEWORK:
You will assess student work across 9 dimensions of interdisciplinary competence. For EACH dimension, 
you must provide a score from 1-3 based on the specific criteria defined below:

""" + "\n\n".join([
    f"""DIMENSION {dim_id}: {criteria['label']}
Level 1 (Naive/Novice): {criteria['levels'][1]['criteria']}
Level 2 (Intermediate): {criteria['levels'][2]['criteria']}
Level 3 (Mastery): {criteria['levels'][3]['criteria']}"""
    for dim_id, criteria in RUBRIC_CRITERIA.items()
]) + """

SCORING GUIDELINES:
- Be objective and evidence-based
- Quote or reference specific parts of the submission
- Provide constructive, actionable feedback
- Identify concrete strengths (what student did well)
- Suggest specific improvements (what to do differently)
- Give examples from their work to illustrate your points

IMPORTANT:
- You MUST evaluate ALL 9 dimensions
- Each dimension must have a score of 1, 2, or 3 (no decimals, no ranges)
- Your reasoning must be at least 50 characters and substantive
- Provide 1-3 strengths and 1-3 improvements per dimension
- Be encouraging but honest in your assessment
"""


class ProjectEvaluatorAgent:
    """Pydantic AI agent for evaluating project submissions"""
    
    def __init__(self):
        self.settings = get_settings()
        
        # Initialize OpenAI model
        self.model = OpenAIModel(
            model_name=self.settings.openai_model,
            api_key=self.settings.openai_api_key
        )
        
        # Create dimension evaluation agent
        self.dimension_agent = Agent(
            self.model,
            result_type=DimensionScore,
            system_prompt=SYSTEM_PROMPT
        )
        
        # Create overall assessment agent
        self.overall_agent = Agent(
            self.model,
            result_type=OverallAssessment,
            system_prompt="""You are an expert academic evaluator. Based on the dimension scores provided, 
create an overall assessment that synthesizes the student's performance across all dimensions. 
Provide 2-5 top strengths, exactly 3 priority improvements, and estimate their overall level."""
        )
    
    async def evaluate_dimension(self, dimension_id: int, submission_text: str) -> DimensionScore:
        """
        Evaluate a single dimension.
        
        Args:
            dimension_id: Dimension ID (1-9)
            submission_text: Student submission text
            
        Returns:
            DimensionScore with score and feedback
        """
        criteria = RUBRIC_CRITERIA[dimension_id]
        
        prompt = f"""Evaluate this student submission for DIMENSION {dimension_id}: {criteria['label']}

SUBMISSION TEXT:
{submission_text}

EVALUATION CRITERIA:
Level 1 (Naive/Novice): {criteria['levels'][1]['criteria']}
Level 2 (Intermediate): {criteria['levels'][2]['criteria']}
Level 3 (Mastery): {criteria['levels'][3]['criteria']}

Provide your evaluation with:
- dimension_id: {dimension_id}
- score: 1, 2, or 3 based on the criteria
- reasoning: Detailed explanation (50-500 chars)
- strengths: 1-3 specific strengths you identified
- improvements: 1-3 specific suggestions for improvement
- examples: Concrete quotes/references from their work
"""
        
        result = await self.dimension_agent.run(prompt)
        return result.data
    
    async def evaluate_all_dimensions(self, submission_text: str) -> List[DimensionScore]:
        """
        Evaluate all 9 dimensions concurrently.
        
        Args:
            submission_text: Student submission text
            
        Returns:
            List of 9 DimensionScore objects
        """
        tasks = [
            self.evaluate_dimension(dim_id, submission_text)
            for dim_id in range(1, 10)
        ]
        
        dimension_scores = await asyncio.gather(*tasks)
        return list(dimension_scores)
    
    async def create_overall_assessment(
        self, 
        dimension_scores: List[DimensionScore],
        submission_text: str
    ) -> OverallAssessment:
        """
        Create overall assessment based on dimension scores.
        
        Args:
            dimension_scores: List of dimension scores
            submission_text: Original submission text for context
            
        Returns:
            OverallAssessment with summary and recommendations
        """
        # Summarize dimension scores for the overall agent
        score_summary = "\n".join([
            f"Dimension {score.dimension_id} ({RUBRIC_CRITERIA[score.dimension_id]['label']}): "
            f"Score {score.score}/3 - {score.reasoning[:100]}..."
            for score in dimension_scores
        ])
        
        # Calculate average score
        avg_score = sum(score.score for score in dimension_scores) / len(dimension_scores)
        
        prompt = f"""Based on the following dimension scores, create an overall assessment:

DIMENSION SCORES:
{score_summary}

AVERAGE SCORE: {avg_score:.2f}/3

ORIGINAL SUBMISSION (first 500 chars):
{submission_text[:500]}...

Provide:
- overall_summary: Holistic assessment (100-1000 chars)
- overall_strengths: 2-5 top strengths across all dimensions
- priority_improvements: Exactly 3 most important areas to improve
- estimated_level: "Beginner" (avg 1.0-1.5), "Intermediate" (1.5-2.5), or "Advanced" (2.5-3.0)
"""
        
        result = await self.overall_agent.run(prompt)
        return result.data
    
    async def evaluate_submission(
        self,
        submission_id: str,
        submission_text: str,
        input_tokens: int
    ) -> EvaluationResult:
        """
        Complete evaluation of a submission.
        
        Args:
            submission_id: Submission UUID
            submission_text: Full submission text (essay + files)
            input_tokens: Number of input tokens used
            
        Returns:
            EvaluationResult with all scores and feedback
        """
        import time
        start_time = time.time()
        
        # Evaluate all 9 dimensions
        dimension_scores = await self.evaluate_all_dimensions(submission_text)
        
        # Create overall assessment
        overall = await self.create_overall_assessment(dimension_scores, submission_text)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Estimate tokens and cost (rough approximation)
        # Each dimension response ~300 tokens, overall ~500 tokens = ~3200 total output tokens
        estimated_output_tokens = len(dimension_scores) * 300 + 500
        total_tokens = input_tokens + estimated_output_tokens
        
        estimated_cost = (
            (input_tokens / 1000) * self.settings.cost_per_1k_input_tokens +
            (estimated_output_tokens / 1000) * self.settings.cost_per_1k_output_tokens
        )
        
        return EvaluationResult(
            submission_id=submission_id,
            dimension_scores=dimension_scores,
            overall=overall,
            tokens_used=total_tokens,
            estimated_cost=round(estimated_cost, 4),
            processing_time=round(processing_time, 2),
            cache_hit=False
        )


# Singleton instance
_evaluator_agent: ProjectEvaluatorAgent = None


def get_evaluator_agent() -> ProjectEvaluatorAgent:
    """Get singleton evaluator agent instance"""
    global _evaluator_agent
    if _evaluator_agent is None:
        _evaluator_agent = ProjectEvaluatorAgent()
    return _evaluator_agent
