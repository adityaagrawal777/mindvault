import warnings
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

# Suppress deprecation warnings from HuggingFace embeddings
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", message=".*LangChainDeprecationWarning.*")


def create_vector_store(chunks):
    """Create a FAISS vector store from document chunks using HuggingFace embeddings.
    
    Uses all-MiniLM-L6-v2 (~80MB) — lightweight and fast, fits in Render free tier RAM.
    Quality is excellent for document Q&A tasks.
    """
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    return FAISS.from_documents(chunks, embeddings)
