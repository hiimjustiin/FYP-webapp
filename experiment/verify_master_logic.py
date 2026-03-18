import os
import pandas as pd
import google.generativeai as genai
from dotenv import load_dotenv

# 1. Setup
load_dotenv(dotenv_path="../.env")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

# 2. Load Yuhan's Real Data
# We use this to find "Reference Examples" to teach the AI
try:
    df = pd.read_excel("experiments/data.xlsx")
    
    # Let's find one real "Score 1" example from Yuhan's data to use as a template
    # We look for rows where Score == 1, pick the first one's feedback
    ref_score_1 = df[df['Score'] == 1]['Feedback'].iloc[0]
    
    # Let's find one real "Score 3" example
    ref_score_3 = df[df['Score'] == 3]['Feedback'].iloc[0]
    
    print("SUCCESS: Loaded Yuhan's data for reference.")
    print(f"Reference Score 1: {ref_score_1[:50]}...") # Print first 50 chars just to check
    print(f"Reference Score 3: {ref_score_3[:50]}...")

except Exception as e:
    print(f"WARNING: Could not load Excel ({e}). Using manual fallback data.")
    # Fallback if you haven't formatted the Excel yet
    ref_score_1 = "Your slides illustrate impacts but do not explicitly state the purpose."
    ref_score_3 = "You have mentioned multiple stakeholders demonstrating comprehensive consideration."

# ---------------------------------------------------------
# 3. DEFINE THE TEST CASE (The "New" Feedback to Verify)
# ---------------------------------------------------------

# CASE A: A Mismatch (Score 1, but feedback is generic/happy)
# This simulates a "Hallucination" where the AI messes up.
input_score = 1
input_feedback = "Good job! You did great."

# CASE B: A Question Error (Feedback asks questions)
# input_score = 2
# input_feedback = "Why did you choose this title? What do you think about AI?"

# CASE C: A Good Match (Similar to Yuhan's style)
# input_score = 3
# input_feedback = "Excellent analysis of the stakeholders. You covered the social and economic aspects well."

print(f"\n--- Verifying Input ---")
print(f"Score: {input_score}")
print(f"Feedback: {input_feedback}")

# 4. The Master Prompt
# We embed Yuhan's real data (ref_score_1, ref_score_3) directly into the instructions.
prompt = f"""
You are a Quality Assurance System for Academic Grading.
Your job is to verify if a specific Feedback matches its assigned Score.

REFERENCE STANDARDS (Derived from Expert Data):
- WHEN SCORE IS 1 (Low): Feedback must be critical like this example: "{ref_score_1}"
- WHEN SCORE IS 3 (High): Feedback must be positive/comprehensive like this example: "{ref_score_3}"

STRICT RULES:
1. CONSISTENCY: The tone of the feedback MUST match the Score.
2. NO QUESTIONS: Feedback must NOT contain direct questions (e.g. "Why did you...?"). It must be a statement.
3. SPECIFICITY: Feedback must not be vague (e.g. "Good job").

TASK:
Evaluate the following Input.
Input Score: {input_score}
Input Feedback: "{input_feedback}"

OUTPUT FORMAT:
VERDICT: [PASS / FAIL]
REASON: [Short explanation of why]
"""

# 5. Run Verification
response = model.generate_content(prompt)
print("\n--- RESULT ---")
print(response.text)