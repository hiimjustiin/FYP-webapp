import os
import pandas as pd
from google import genai
from dotenv import load_dotenv
import time
import datetime

# 1. Setup
load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_ID = "gemini-2.0-flash"

# 2. Load Data
file_path = r"C:\Users\ZhuoK\Documents\GitHub\ila-webapp\test_data\coding for student artefacts_datasets(S1S2)_feedback and forward.xlsx"
df = pd.read_excel(file_path)

# Filter for the first 100 rows
df_subset = df.head(10).copy()

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

print(f"Starting verification for {len(df_subset)} rows...")

for index, row in df_subset.iterrows():
    input_score = row[score_col]
    input_feedback = row[feedback_col]
    
    # Check if we should skip
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
            response = client.models.generate_content(
                model=MODEL_ID, 
                contents=prompt
            )
            
            # This dictionary defines the order of your columns in the final CSV
            results.append({
                "Original Score": input_score,
                "Original Feedback": input_feedback,
                "Verdict_AI": response.text,
                "Excel_Row": index + 2
            })
            
            print(f"Processed row {index + 1}/100")
            time.sleep(6) # Stay under free tier rate limits
            success = True
            
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                print("Rate limit hit. Sleeping for 10s...")
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
filename = f"verification_results_{timestamp}.csv"

try:
    final_df.to_csv(filename, index=False)
    print(f"\nSUCCESS! Results saved to: {filename}")
    print("The first two columns contain your original Score and Feedback.")
except PermissionError:
    alt_filename = f"RESULTS_CLOSE_EXCEL_{timestamp}.csv"
    final_df.to_csv(alt_filename, index=False)
    print(f"\nPermission denied. Saved to {alt_filename} instead.")