from verificationlayer import verify_submission_integrity
from models.evaluation import DimensionScore, OverallAssessment

# Helper to create valid dummy text
LONG_TEXT = "This is a valid reasoning string that is definitely longer than fifty characters so Pydantic does not yell at us. " * 2
LONG_EXAMPLE = "This is a specific example from the student text that satisfies the length requirement."

def create_score(id, score, reasoning=LONG_TEXT, examples=LONG_EXAMPLE):
    return DimensionScore(
        dimension_id=id,
        score=score,
        reasoning=reasoning,
        strengths=["Strength 1 is valid"],
        improvements=["Improvement 1 is valid"],
        examples=examples
    )

def run_test():
    print("🔹 BUILDING MOCK DATA...")
    
    # --- SCENARIO 1: The Contradiction Check ---
    # We will give Dimension 1 a Score of 1, but say it is "Excellent"
    
    # Create 9 valid scores first
    scores = [create_score(i, 2) for i in range(1, 10)]
    
    # Sabotage Dimension 1
    scores[0] = create_score(
        id=1, 
        score=1, 
        reasoning="This work is absolutely excellent and perfect in every way. However I am giving it a 1.",
        examples=LONG_EXAMPLE
    )
    
    overall = OverallAssessment(
        overall_summary=LONG_TEXT * 2,
        overall_strengths=["Strength A is long enough", "Strength B is long enough"],
        priority_improvements=["Fix A is long enough", "Fix B is long enough", "Fix C is long enough"],
        estimated_level="Intermediate"
    )

    print("\n🔹 RUNNING VERIFICATION...")
    is_valid, msg = verify_submission_integrity(scores, overall)
    
    if not is_valid:
        print(f"✅ SUCCESS! Caught the error: {msg}")
    else:
        print(f"❌ FAIL! The error slipped through.")

if __name__ == "__main__":
    run_test()