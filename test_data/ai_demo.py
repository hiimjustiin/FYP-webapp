import os
import json
from typing import List
from pydantic import BaseModel
from pydantic_ai import Agent
# --- FIX: Use the new GoogleModel ---
from pydantic_ai.models.google import GoogleModel

# --- 1. SETUP API KEY ---
# The library looks for GEMINI_API_KEY automatically in the environment.
# We ensure it is set here.
if not os.getenv('GEMINI_API_KEY'):
    # Replace 'AIza...' with your real key if it's not in your .env
    os.environ['GEMINI_API_KEY'] = "AIza..." 

# --- 2. DATA MODELS ---
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

# --- 3. THE AGENT ---
# FIX: We do NOT pass api_key here. The library finds it in os.environ automatically.
model = GoogleModel('gemini-1.5-flash')

agent = Agent(
    model,
    result_type=AssessmentResult,
    system_prompt="You are an academic auditor. Grade the essay strictly."
)

# --- 4. RUNNER ---
if __name__ == "__main__":
    print("🔹 STARTING AUDIT (Solution 1)...")
    
    fake_essay = "AI in healthcare is good but privacy is key."
    fake_rubric = "Score based on mention of stakeholders."

    try:
        # Run the AI
        result = agent.run_sync(f"Essay: {fake_essay}\nRubric: {fake_rubric}")
        print("\n✅ SUCCESS! JSON OUTPUT:")
        print(json.dumps(result.data.model_dump(), indent=2))
    except Exception as e:
        print(f"\n❌ Error: {e}")