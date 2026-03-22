import os
import pandas as pd
from groq import Groq
from dotenv import load_dotenv
import time
import datetime

# 1. Setup
# This will try the current folder first, then the parent folder
if not load_dotenv():
    load_dotenv("../.env")

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY not found! Check if your .env file exists and contains the key.")

client = Groq(api_key=api_key)
MODEL_ID = "llama-3.1-8b-instant"

# 2. Define the exact column pairs from C to T
column_pairs = [
    ('Frame the problem', 'Frame the problem.1'),
    ('Stakeholder consideration', 'Stakeholder consideration.1'),
    ('Range of disciplinary perspectives', 'Range of disciplinary perspectives.1'),
    ('Disciplinary reasoning', 'Disciplinary reasoning.1'),
    ('Credibility of disciplinary knowledge', 'Credibility of disciplinary knowledge.1'),
    ('Number of disciplinary integration', 'Number of disciplinary integration.1'),
    ('Depth of disciplinary integration', 'Depth of disciplinary integration.1'),
    ('Social impact', 'Social impact.1'),
    ('Limitations', 'Limitations.1')
]

# 3. Load Data
file_path = r"C:\Users\ZhuoK\Documents\GitHub\ila-webapp\test_data\Interdisciplinary_learning_labelleddata_9dimensions_148rows.xlsx"
df = pd.read_excel(file_path)

# Clean column names (removes any accidental hidden spaces from Excel)
df.columns = df.columns.str.strip()

# Testing all 100 rows
df_subset = df.head(50).copy()
# To specifically target the missing ones:
#df_subset = df.iloc[[50, 100]] # Running rows 50 to 100 on using another API key

# 4. Reference Standards (Keeping your consistency)
ref_score_1 = "Critique: Missing depth in problem framing."
ref_score_3 = "Excellent: Well-defined interdisciplinary problem framing."

results = []

print(f"Starting Full Validation: 100 rows x 9 categories...")

# 5. Nested Loop: Iterate through Rows, then through each Category Pair
for index, row in df_subset.iterrows():
    row_num = index + 2 # Excel row number
    print(f"Processing Row {row_num}...")

    for score_col, feedback_col in column_pairs:
        input_score = row[score_col]
        input_feedback = row[feedback_col]
        
        # Skip if data is missing
        if pd.isna(input_feedback) or pd.isna(input_score):
            continue

        # YOUR ORIGINAL CONSISTENT PROMPT (now with dynamic category)
        prompt = f"""
        You are an Academic Quality Assurance expert. 
        Evaluate if the Feedback provided matches the numerical Score for the category: "{score_col}".

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

        PEDAGOGICAL RULE: Our institution follows a 'Supportive Feedback' policy. 
        It is MANDATORY for markers to provide helpful, actionable 'Feedforward' even for a Score of 1.0. 
        Do NOT fail the match simply because the feedback is encouraging or helpful. 
        Only fail if the feedback claims the student met criteria they clearly missed.

        TASK:
        Category: {score_col}
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
                "Excel_Row": row_num,
                "Category": score_col,
                "Original Score": input_score,
                "Original Feedback": input_feedback,
                "Verdict_AI": ai_response
            })
            
            # Rate limit handling (Groq Free Tier is quite sensitive)
            time.sleep(3) 
            
        except Exception as e:
            print(f"Error on row {row_num}, category {score_col}: {e}")
            # If we hit a rate limit, wait longer
            if "rate_limit" in str(e).lower():
                print("Rate limit reached. Sleeping for 30 seconds...")
                time.sleep(30)
            else:
                time.sleep(5)

# 6. Save results to a clean CSV
final_df = pd.DataFrame(results)
timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
output_filename = f"full_validation_C_to_T_{timestamp}.csv"
final_df.to_csv(output_filename, index=False)

print(f"\nSUCCESS! All categories from C to T validated.")
print(f"Results saved to: {output_filename}")