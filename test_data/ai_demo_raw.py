import requests
import json
import os

# --- 1. CONFIGURATION ---
API_KEY = os.getenv("OPENAI_API_KEY")  # <--- PASTE YOUR KEY HERE

# Fallback
if API_KEY == "PASTE_YOUR_KEY_HERE":
    API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    print("❌ ERROR: API Key is missing. Paste it in the script!")
    exit()

# --- 2. DATA ---
essay = "AI in healthcare is good but privacy is key. Doctors and nurses are vital."
rubric = "Score 1-3 based on mention of stakeholders."

# --- 3. THE ROBUST REQUEST LOOP ---
# We will try these models in order until one works
models_to_try = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-pro",     # The stable fallback
    "gemini-1.0-pro"
]

print(f"🔹 STARTING AUDIT (Trying {len(models_to_try)} models)...")

headers = {"Content-Type": "application/json"}
payload = {
    "contents": [{
        "parts": [{"text": f"Grade this essay based on the rubric. Return valid JSON.\n\nEssay: {essay}\nRubric: {rubric}"}]
    }]
}

success = False

for model_name in models_to_try:
    print(f"   ... Attempting model: {model_name}")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={API_KEY}"
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            print(f" SUCCESS with {model_name}!")
            data = response.json()
            # Extract text
            raw_text = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', "No text found")
            
            # Clean JSON
            clean_json = raw_text.replace("```json", "").replace("```", "").strip()
            
            print("\n⬇️ JSON OUTPUT FOR SCREENSHOT ⬇️")
            print(clean_json)
            print("⬆️ --------------------------- ⬆️")
            success = True
            break # Stop loop on success
        else:
            # If 404/400, just try the next one
            continue
            
    except Exception as e:
        print(f" Connection error: {e}")

if not success:
    print("\n ALL MODELS FAILED. Check your API Key permissions or internet connection.")