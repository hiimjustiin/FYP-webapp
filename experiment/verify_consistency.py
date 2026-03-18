import os
import google.generativeai as genai
from dotenv import load_dotenv

# 1. Setup Gemini
load_dotenv(dotenv_path="../.env")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

# 2. DEFINE YOUR TEST CASE HERE (Change these values to test different scenarios)
# SCENARIO A: A Mismatch (Score 1, but feedback is happy) -> SHOULD FAIL
test_score = 1
test_feedback = "Great job! This is very comprehensive and covers all stakeholders perfectly."

# SCENARIO B: A Question Error (Score 2, but asks questions) -> SHOULD FAIL
# test_score = 2
# test_feedback = "This is okay. Why did you choose this topic? What were you thinking?"

# SCENARIO C: A Match (Score 3, Yuhan's real data) -> SHOULD PASS
# test_score = 3
# test_feedback = "You have mentioned multiple stakeholders... demonstrating a comprehensive consideration."

print(f"--- Verifying Consistency ---")
print(f"Input Score: {test_score}")
print(f"Input Feedback: '{test_feedback}'")

# 3. The Consistency Prompt
prompt = f"""
You are an Automated Grader Verification System. 
Your task is to detect LOGIC ERRORS in the grading output.

RUBRIC RULES:
- SCORE 1 (Low): Feedback MUST be critical, identify missing parts (purpose, justification), and suggest major fixes.
- SCORE 2 (Mid): Feedback should be balanced (strengths + specific weaknesses).
- SCORE 3 (High): Feedback MUST be positive, confirming the student covered necessary topics (stakeholders, justification).
- NO QUESTIONS: Feedback must NOT ask the student questions (e.g., "Why did you...?"). It must be a statement/advice.

INPUT DATA:
Score Given: {test_score}
Feedback Text: "{test_feedback}"

TASK:
1. Determine if the Feedback Sentiment matches the Score.
2. Check if there are direct questions in the text.

OUTPUT FORMAT:
STATUS: [PASS or FAIL]
ISSUE_DETECTED: [None, Mismatch, or Invalid Format]
EXPLANATION: [Brief reason]
"""

# 4. Get Verdict
response = model.generate_content(prompt)
print("\n--- VERIFICATION RESULT ---")
print(response.text)