import asyncio
from pydantic_ai import Agent
# Import your specific models

# Define the "Cheap" Rubric Prompt
SYSTEM_PROMPT = """
Evaluate the essay based on these rules:
1. Disciplines: 11 categories (e.g., Law, Psychology, Education) [cite: 2-12].
2. Stakeholders: Must be specific (e.g., 'elders'). General 'people' = 0.
3. Scoring:
   - Mastery (3): >3 disciplines AND >3 stakeholders.
   - Intermediate (2): 2-3 disciplines AND 2-3 stakeholders.
   - Naive (1): 0-1 disciplines OR 0-1 stakeholders.
"""

agent = Agent('openai:gpt-4o', system_prompt=SYSTEM_PROMPT)

async def test():
    # Simulate an essay
    user_essay = "This project helps people using AI and hospitals."
    # Run the agent
    result = await agent.run(user_essay)
    print(result.data)

if __name__ == "__main__":
    asyncio.run(test())