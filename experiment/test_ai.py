import os
import asyncio
from dotenv import load_dotenv
from pydantic_ai import Agent
from pydantic_ai.models.groq import GroqModel

# Load variables from .env
load_dotenv()

# Get the key from environment variables
api_key = os.getenv('GROQ_API_KEY')

if not api_key:
    print("Error: GROQ_API_KEY not found in .env file!")
else:
    model = GroqModel('llama-3.1-8b-instant', api_key=api_key)
    agent = Agent(model, system_prompt="You are a pedagogical assistant.")

    async def main():
        try:
            result = await agent.run("Analyze the link between Computer Science and Biology.")
            print(f"Test Result: {result.data}")
        except Exception as e:
            print(f"An error occurred: {e}")

    if __name__ == "__main__":
        asyncio.run(main())