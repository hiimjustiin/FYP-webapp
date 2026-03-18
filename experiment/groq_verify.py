import os
import pandas as pd
from groq import Groq  # CHANGED: Import Groq instead of google.genai
from dotenv import load_dotenv
import time
import datetime

# 1. Setup
load_dotenv("../.env")
# CHANGED: Initialize Groq client using your new API key
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
# CHANGED: Use a Groq-supported model
MODEL_ID = "llama-3.3-70b-versatile" 

# 2. Load Data
# (Keep your file path logic the same)
file_path = r"C:\Users\ZhuoK\Documents\GitHub\ila-webapp\test_data\coding for student artefacts_datasets(S1S2)_feedback and forward.xlsx"
df = pd.read_excel(file_path)

df_subset = df.head(100).copy()
# This skips the first 10 rows and takes the next 5 (Rows 11 to 15 in Excel)
#df_subset = df.iloc[75:101].copy()

# 3. Define the column pair
score_col = 'Frame the problem'
feedback_col = 'Frame the problem.1'

# 4. Reference Standards
try:
    ref_score_1 = df_subset[df_subset[score_col] <= 1.0][feedback_col].iloc[0]
    ref_score_3 = df_subset[df_subset[score_col] >= 3.0][feedback_col].iloc[0]
    print(f"References loaded for {score_col}")
except Exception:
    ref_score_1 = "Critique: Missing depth in problem framing."
    ref_score_3 = "Excellent: Well-defined interdisciplinary problem framing."

# 5. Bulk Processing Loop
results = []
print(f"Starting verification with Groq for {len(df_subset)} rows...")

for index, row in df_subset.iterrows():
    input_score = row[score_col]
    input_feedback = row[feedback_col]
    
    if pd.isna(input_feedback):
        results.append({
            "Original Score": input_score,
            "Original Feedback": "EMPTY",
            "Verdict_Raw": "SKIP: No data",
            "Excel_Row": index + 2
        })
        continue

    prompt = f"""
    You are a Quality Assurance System for Academic Grading.
    Verify if the Feedback matches the Score.

    REFERENCE STANDARDS:
    - LOW SCORE (<=1): "{ref_score_1}"
    - HIGH SCORE (>=3): "{ref_score_3}"

    STRICT RULES: Tone must match Score, NO questions, be specific.

    TASK:
    Score: {input_score}
    Feedback: "{input_feedback}"

    OUTPUT FORMAT:
    VERDICT: [PASS/FAIL]
    REASON: [Explanation]
    """

    success = False
    while not success:
        try:
            # CHANGED: Groq uses chat.completions.create
            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model=MODEL_ID,
            )
            
            # CHANGED: Accessing the text result via .choices[0].message.content
            ai_response = chat_completion.choices[0].message.content
            
            results.append({
                "Original Score": input_score,
                "Original Feedback": input_feedback,
                "Verdict_AI": ai_response,
                "Excel_Row": index + 2
            })
            
            print(f"Processed row {index + 1}/10")
            # Groq is very fast, but free tier has rate limits. 2-3 seconds is usually safe.
            time.sleep(2) 
            success = True
            
        except Exception as e:
            # Groq error handling (typically 429 for rate limits)
            if "429" in str(e):
                print("Groq Rate limit hit. Sleeping for 10s...")
                time.sleep(10)
            else:
                print(f"Error on row {index + 1}: {e}")
                results.append({
                    "Original Score": input_score,
                    "Original Feedback": input_feedback,
                    "Verdict_AI": f"ERROR: {e}",
                    "Excel_Row": index + 2
                })
                success = True

# 6. Save Results
final_df = pd.DataFrame(results)
timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
filename = f"verification_results_groq_{timestamp}.csv"

final_df.to_csv(filename, index=False)
print(f"\nSUCCESS! Results saved to: {filename}")