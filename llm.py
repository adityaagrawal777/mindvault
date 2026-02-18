from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os

load_dotenv()


def load_llm():
    """Load the Groq LLM (Llama 3.3 70B)."""
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0,
        api_key=os.getenv("GROQ_API_KEY")
    )
