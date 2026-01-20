# Notice we import from the NEW file, not the old one
from ai_verificationlayer import verify_with_ai

# 1. Fake Data
fake_essay = """
Title: AI in Healthcare
The implementation of AI in healthcare has significant potential to improve patient outcomes.
However, we must consider the privacy of patients (Stakeholder 1).
Doctors (Stakeholder 2) and Nurses (Stakeholder 3) also play a key role.
This paper explores these dynamics.
"""

fake_rubric = """
Dimension 2: Stakeholders. 
Score 1: No stakeholders. 
Score 3: Identifies more than 3 distinct stakeholders.
"""

# 2. Run the Test
print("🔹 STARTING NEW AI TEST...")
result = verify_with_ai(fake_essay, fake_rubric)

# 3. Show Results
import json
print("\n🔹 RESULT FROM AI:")
print(json.dumps(result, indent=2))