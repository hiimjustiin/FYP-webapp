import os
import pandas as pd
from groq import Groq
from dotenv import load_dotenv
import time
import datetime

# 1. Setup
load_dotenv("../.env") # Points to the .env in your root folder
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL_ID = "llama-3.3-70b-versatile"

# 2. Load Data - Slicing the next 5 rows
file_path = r"C:\Users\ZhuoK\Documents\GitHub\ila-webapp\test_data\coding for student artefacts_datasets(S1S2)_feedback and forward.xlsx"
df = pd.read_excel(file_path)

#df_subset = df.head(100).copy()
# This takes rows 11 to 15 (Python index 10 to 15)
df_subset = df.iloc[91:92].copy()

# 3. Define the column pair
score_col = 'Frame the problem'
feedback_col = 'Frame the problem.1'

# 4. Reference Standards (Used for context)
ref_score_1 = "Critique: Missing depth in problem framing."
ref_score_3 = "Excellent: Well-defined interdisciplinary problem framing."

# 5. Bulk Processing Loop
results = []
print(f"Starting verification for Rows 11-15...")

for index, row in df_subset.iterrows():
    input_score = row[score_col]
    input_feedback = row[feedback_col]
    
    if pd.isna(input_feedback):
        results.append({"Original Score": input_score, "Original Feedback": "EMPTY", "Verdict_AI": "SKIP", "Excel_Row": index + 2})
        continue

    # IMPROVED PROMPT: Guided by the "STaR" philosophy (focusing on justification)
    prompt = f"""
    You are an Academic Quality Assurance expert. 
    Evaluate if the Feedback provided matches the numerical Score.

    GRADING SCALE:
    1.0 = Emerging (Critique-heavy, many gaps)
    2.0 = Developing (Helpful, points out gaps but acknowledges progress)
    3.0 = Mastery (Very positive, focuses on high-level integration)

    REFERENCE EXAMPLES:
    - Score 1.0 Example: "{ref_score_1}"
    - Score 3.0 Example: "{ref_score_3}"

    CRITICAL RULE: 
    - A 2.0 score is "Developing." It is OK for a 2.0 to have very helpful or positive feedback. 
    - Only FAIL the match if a 3.0 sounds negative/harsh, or a 1.0 sounds like perfect work.

    TASK:
    Score: {input_score}
    Feedback: "{input_feedback}"

    OUTPUT FORMAT:
    VERDICT: [PASS/FAIL]
    REASON: [Explain your rationale clearly]
    """

    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=MODEL_ID,
        )
        ai_response = chat_completion.choices[0].message.content
        
        results.append({
            "Original Score": input_score,
            "Original Feedback": input_feedback,
            "Verdict_AI": ai_response,
            "Excel_Row": index + 2
        })
        print(f"Processed row {index + 2}")
        time.sleep(2) # Respecting Groq free tier limits
        
    except Exception as e:
        print(f"Error on row {index + 2}: {e}")

# 6. Save Results
final_df = pd.DataFrame(results)
timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
filename = f"verification_rows_11_15_{timestamp}.csv"
final_df.to_csv(filename, index=False)

print(f"\nSUCCESS! Results for the next 5 rows saved to: {filename}")