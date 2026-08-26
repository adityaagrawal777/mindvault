from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os

load_dotenv()


def load_llm():
    """Load the Groq LLM (Groq Compound)."""
    return ChatGroq(
        model="groq/compound",
        temperature=0,
        api_key=os.getenv("GROQ_API_KEY")
    )
