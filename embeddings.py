import warnings
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

# Suppress deprecation warnings from HuggingFace embeddings
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", message=".*LangChainDeprecationWarning.*")


def create_vector_store(chunks):
    """Create a FAISS vector store from document chunks using HuggingFace embeddings."""
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-mpnet-base-v2"
    )
    return FAISS.from_documents(chunks, embeddings)
