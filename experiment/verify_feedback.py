import os
import pandas as pd
import google.generativeai as genai
from dotenv import load_dotenv

# 1. Setup Gemini
load_dotenv(dotenv_path="../.env")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

# 2. Load Yuhan's "Gold Standard" Data
# REPLACE 'data.xlsx' with your actual filename
# REPLACE 'Feedback' with the actual column name in the header
try:
    df = pd.read_excel("experiments/data.xlsx") 
    # specific_column = df['Feedback_Column_Name'].dropna().tolist()
    # For now, let's assume the column is named 'feedback'. Change this!
    good_examples = df['feedback'].dropna().head(3).tolist()
except Exception as e:
    print(f"Could not load Excel: {e}")
    # Fallback if Excel fails, just so code runs for you right now
    good_examples = [
        "The essay effectively integrates economic theory but lacks sociological context.",
        "Your analysis of the supply chain demonstrates strong interdisciplinary understanding.",
        "Consider how the historical context influenced the scientific discovery mentioned."
    ]

# 3. Define the "Bogus" Feedback you want to catch
# (Change this text to test different scenarios)
bogus_input = "Great job nice essay." 

print(f"--- Testing Verification Layer ---")
print(f"Input to verify: '{bogus_input}'")

# 4. The Verification Prompt
# We teach Gemini what "Good" looks like, then ask it to judge the Input.
prompt = f"""
You are a Quality Control AI for an academic platform.
Your job is to determine if a piece of feedback is "LEGITIMATE" (useful, specific, expert) or "BOGUS" (vague, short, low-effort).

Here are examples of LEGITIMATE feedback from our expert (Yuhan):
1. "{good_examples[0]}"
2. "{good_examples[1]}"
3. "{good_examples[2]}"

CRITERIA:
- Legitimate feedback mentions specific concepts, improvements, or analysis.
- Bogus feedback is generic (e.g., "good job"), too short, or makes no sense.

TASK:
Classify the following feedback.
Input: "{bogus_input}"

Format your answer as:
VERDICT: [LEGITIMATE or BOGUS]
REASON: [One sentence explanation]
"""

# 5. Get Verdict
response = model.generate_content(prompt)
print("\n--- GEMINI VERDICT ---")
print(response.text)