import pandas as pd
import os
import json
import time
import re
from tqdm import tqdm
from groq import Groq
from dotenv import load_dotenv

# 1. Initialize local environment and Groq Client
load_dotenv() # Automatically picks up your local .env file
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

DIMENSIONS = [
    "Frame the problem", "Stakeholder consideration",
    "Range of disciplinary perspectives", "Disciplinary reasoning",
    "Credibility of disciplinary knowledge", "Number of disciplinary integration",
    "Depth of disciplinary integration", "Social impact", "Limitations"
]

def extract_atomic_statements(feedback_text):
    """Breaks down a paragraph of feedback into a structured list of statements."""
    if not isinstance(feedback_text, str) or not feedback_text.strip() or feedback_text.upper() == 'NAN':
        return {"atomic_statements": []}

    prompt = f"""
    You are an expert educational analytics assistant specializing in rubric-based essay evaluation. 
    Your task is to deconstruct a block of feedback into a list of distinct, singular "atomic statements" for comparison.

    An atomic statement must:
    1. Contain exactly one complete observation, praise, or critique.
    2. Be completely self-contained and concise.

    Input Feedback text:
    \"\"\"
    {feedback_text}
    \"\"\"

    Respond strictly in JSON format matching this structure:
    {{
      "atomic_statements": [
        {{
          "statement": "The exact concise statement",
          "dimension": "General"
        }}
      ]
    }}
    """
    try:
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"\nExtraction Error: {e}")
        return {"atomic_statements": []}

def align_statements(human_statements, ai_statements):
    """Compares Human and AI statements and groups them into alignment buckets."""
    if not human_statements and not ai_statements:
        return {"aligned": [], "human_only": [], "ai_only": []}

    prompt = f"""
    You are evaluating an AI grading model against a Human expert. 
    Compare these two lists of atomic feedback statements.

    Human Statements: {json.dumps(human_statements)}
    AI Statements: {json.dumps(ai_statements)}

    Categorize them strictly into these three buckets based on meaning:
    1. "aligned": Concepts or critiques mentioned by BOTH the Human and the AI.
    2. "human_only": Points the Human grader made that the AI missed completely.
    3. "ai_only": Points the AI grader made that the Human missed completely.

    Respond strictly in JSON format matching this structure:
    {{
      "aligned": ["Summary of shared point A", "Summary of shared point B"],
      "human_only": ["Point missed by AI A"],
      "ai_only": ["Point caught only by AI A"]
    }}
    """
    try:
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"\nAlignment Error: {e}")
        return {"aligned": [], "human_only": [], "ai_only": []}

def sanitize_ai_list(raw_list):
    """Forces the AI's output into a clean list of strings, no matter how it formatted it."""
    if not raw_list:
        return []
    
    clean_list = []
    for item in raw_list:
        if isinstance(item, str):
            clean_list.append(item)
        elif isinstance(item, dict):
            # If the AI hallucinated a dictionary, grab the text inside it
            values = list(item.values())
            clean_list.append(str(values[0]) if values else "")
        else:
            clean_list.append(str(item))
    return clean_list

def main():
    # 2. Setup your local file paths
    ai_file = 'FINAL_Compiled_AI_Feedback.csv'
    human_file = 'Interdisciplinary learning_labelled data_9 dimensions_283rows1.xlsx'
    
    print("Loading local datasets...")
    ai_df = pd.read_csv(ai_file)
    human_df = pd.read_excel(human_file, engine='openpyxl')

    # --- CHUNK SETTINGS (MANUALLY ADJUST THIS FOR BATCHES) ---
    # Example: To run essays 6 through 25, use index 5 to 25
    start_idx = 28
    end_idx = 50
    
    output_report_path = f'Evaluation_Report_Essays_{start_idx}_to_{end_idx}.csv'
    print(f"Starting analysis for essays index {start_idx} to {end_idx}...")

    # Load existing progress file if you need to resume mid-batch, otherwise start fresh
    if os.path.exists(output_report_path):
        report_df = pd.read_csv(output_report_path)
        processed_indices = report_df['Essay_Index'].tolist()
        print(f"Found existing backup file. Resuming progress...")
    else:
        report_df = pd.DataFrame()
        processed_indices = []

    # 3. Main processing loop
    for index in range(start_idx, end_idx):
        if index in processed_indices:
            continue # Skip rows we've already evaluated and saved
            
        print(f"\n================ Evaluating Essay Index: {index} ================")
        
        # Base row data dictionary
        row_metrics = {
            "Essay_Index": index,
            "Question": ai_df.loc[index, 'Question'],
            "Essay": ai_df.loc[index, 'Essay']
        }
        
        # Process across all 9 dimensions for this single essay
        for dim in DIMENSIONS:
            print(f"-> Processing Dimension: {dim}")
            
            # Extract scores and calculate absolute grade difference
            try:
                h_score = float(human_df.loc[index, dim])
                a_score = float(ai_df.loc[index, f'{dim}_Score'])
                score_diff = h_score - a_score
            except Exception:
                h_score, a_score, score_diff = None, None, None
                
            row_metrics[f'{dim}_Human_Score'] = h_score
            row_metrics[f'{dim}_AI_Score'] = a_score
            row_metrics[f'{dim}_Score_Difference'] = score_diff

            # Safely extract text feedback from both files
            human_feedback = str(human_df.loc[index, f'{dim}.1']) # Handles the duplicate name .1 suffix
            ai_feedback = str(ai_df.loc[index, f'{dim}_Feedback_and_Feedforward'])

            # Call Groq API with robust pacing to prevent Free-Tier 429 Errors (30 RPM)
            h_atomic = extract_atomic_statements(human_feedback).get("atomic_statements", [])
            time.sleep(2) 
            
            a_atomic = extract_atomic_statements(ai_feedback).get("atomic_statements", [])
            time.sleep(2)
            
            alignment = align_statements(h_atomic, a_atomic)
            time.sleep(2)

            # --- APPLY THE BULLETPROOF SANITIZER ---
            safe_aligned = sanitize_ai_list(alignment.get("aligned", []))
            safe_human_only = sanitize_ai_list(alignment.get("human_only", []))
            safe_ai_only = sanitize_ai_list(alignment.get("ai_only", []))

            # Store clean quantitative alignment counts
            row_metrics[f'{dim}_Aligned_Count'] = len(safe_aligned)
            row_metrics[f'{dim}_Human_Only_Count'] = len(safe_human_only)
            row_metrics[f'{dim}_AI_Only_Count'] = len(safe_ai_only)
            
            # Safely join the text without crashing
            row_metrics[f'{dim}_Shared_Points'] = ", ".join(safe_aligned)
            row_metrics[f'{dim}_Points_AI_Missed'] = ", ".join(safe_human_only)
            row_metrics[f'{dim}_Points_Human_Missed'] = ", ".join(safe_ai_only)

        # Append row metrics to our dataframe and save IMMEDIATELY
        new_row_df = pd.DataFrame([row_metrics])
        report_df = pd.concat([report_df, new_row_df], ignore_index=True)
        report_df.to_csv(output_report_path, index=False)
        print(f"✓ Essay {index} safely saved to spreadsheet.")

    print(f"\nBatch processing complete! Output saved to: {output_report_path}")

if __name__ == "__main__":
    main()