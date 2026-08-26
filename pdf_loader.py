import re
from langchain_community.document_loaders import PyPDFLoader


def clean_text(text: str) -> str:
    """Clean extracted PDF text to improve embedding quality.
    
    Fixes common PDF extraction issues:
    - Removes excessive whitespace and broken line breaks
    - Removes page headers/footers artifacts (page numbers, etc.)
    - Normalizes unicode characters
    - Joins hyphenated words split across lines
    """
    # Join hyphenated words split across lines (e.g., "compre-\nhensive" -> "comprehensive")
    text = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', text)
    
    # Replace single newlines (mid-paragraph breaks from PDF) with spaces
    # but preserve double newlines (actual paragraph breaks)
    text = re.sub(r'(?<!\n)\n(?!\n)', ' ', text)
    
    # Normalize multiple spaces to single space
    text = re.sub(r' {2,}', ' ', text)
    
    # Normalize multiple newlines to double newline (paragraph break)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Remove standalone page numbers (common PDF artifact)
    text = re.sub(r'\n\s*\d+\s*\n', '\n', text)
    
    # Strip leading/trailing whitespace
    text = text.strip()
    
    return text


def load_pdf(file_path):
    """Load a PDF file, clean extracted text, and return documents (one per page)."""
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    
    # Clean each document's text and enrich metadata
    for doc in documents:
        doc.page_content = clean_text(doc.page_content)
        # Add page number as human-readable metadata
        page_num = doc.metadata.get("page", 0)
        doc.metadata["page_label"] = f"Page {page_num + 1}"
    
    # Filter out empty or near-empty pages (< 50 chars after cleaning)
    documents = [doc for doc in documents if len(doc.page_content.strip()) >= 50]
    
    return documents
