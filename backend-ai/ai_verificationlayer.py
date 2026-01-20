import os
from typing import List, Optional
from pydantic import BaseModel
from pydantic_ai import Agent

# --- 1. DEFINE DATA MODELS (Specific for the AI) ---
class DimensionScore(BaseModel):
    dimension_id: int
    score: int
    reasoning: str
    examples: str

class OverallAssessment(BaseModel):
    total_score: int
    summary_feedback: str

class AssessmentResult(BaseModel):
    dimension_scores: List[DimensionScore]
    overall_assessment: OverallAssessment

# --- 2. SETUP THE AGENT ---
# Ensure the key is loaded (Checks for GEMINI_API_KEY, falls back to manual)
if not os.getenv('GEMINI_API_KEY'):
    # If you are using Groq, change this block!
    os.environ['GOOGLE_API_KEY'] = os.getenv('GEMINI_API_KEY', '')

# Define the Agent (Using Google Gemini Flash)
# If using Groq, change to: 'groq:llama-3.3-70b-versatile'
agent = Agent(
    'google:gemini-1.5-flash',
    result_type=AssessmentResult,
    system_prompt=(
        "You are an expert academic grader. Analyze the student essay against the rubric. "
        "Provide a score (1-3), reasoning, and quotes for each dimension."
    ),
)

# --- 3. THE NEW AI FUNCTION ---
def verify_with_ai(student_essay: str, grading_rubric: str) -> dict:
    print(f"--- [AI NEW] Sending data to Cloud... ---")
    
    try:
        # Run the AI
        result = agent.run_sync(
            f"Essay:\n{student_essay}\n\nRubric:\n{grading_rubric}"
        )
        data = result.data
        print(f"--- [AI NEW] Received {len(data.dimension_scores)} scores. ---")

        # (Optional) You can copy-paste your specific logic checks here later
        # if you want to double-check the AI's work.
        
        return {
            "status": "success",
            "scores": [d.model_dump() for d in data.dimension_scores],
            "summary": data.overall_assessment.model_dump()
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}