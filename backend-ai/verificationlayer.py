from typing import List, Tuple
from models.evaluation import DimensionScore, OverallAssessment
from config import RUBRIC_CRITERIA

def verify_submission_integrity(
    dimension_scores: List[DimensionScore], 
    overall_assessment: OverallAssessment
) -> Tuple[bool, str]:
    """
    Checks for logical inconsistencies that Pydantic misses.
    """
    print(f"--- [VERIFICATION LAYER] Inspecting {len(dimension_scores)} dimensions ---")
    
    # 1. LOGIC CHECK: Dimension 9 (Limitations)
    # Rule: Score 3 requires "resolution" or "mitigate"
    dim_9 = next((d for d in dimension_scores if d.dimension_id == 9), None)
    if dim_9 and dim_9.score == 3:
        keywords = ["resolution", "address", "solve", "mitigate", "future", "propose"]
        if not any(word in dim_9.reasoning.lower() for word in keywords):
            print(f"WARNING: Dimension 9 scored 3/3 but reasoning might lack resolution keywords.")

    # 2. LOGIC CHECK: Dimension 2 (Stakeholders)
    # Rule: Score 3 requires listing >3 stakeholders.
    # Heuristic: Check for commas or list keywords in "examples"
    dim_2 = next((d for d in dimension_scores if d.dimension_id == 2), None)
    if dim_2 and dim_2.score == 3:
        # If the 'examples' field (where they quote the text) is very short, they probably didn't cite 3 stakeholders
        if len(dim_2.examples.split()) < 5: 
            return False, f"Dimension 2 Scored 3 (Mastery) but provided example is too short to contain 3 stakeholders."

    # 3. SENTIMENT CHECK: Score vs Reasoning
    # If score is 1 (Fail), reasoning should not contain "excellent" or "perfect"
    for item in dimension_scores:
        if item.score == 1:
            positive_words = ["excellent", "perfect", "outstanding", "superb"]
            if any(word in item.reasoning.lower() for word in positive_words):
                 return False, f"Dimension {item.dimension_id} Contradiction: Score is 1 but reasoning contains positive words."

    print("--- [VERIFICATION LAYER] All checks passed. ---")
    return True, ""