from langchain_text_splitters import RecursiveCharacterTextSplitter


def split_documents(documents):
    """Split documents into smaller chunks for embedding.
    
    Uses larger chunk sizes (1500) with more overlap (300) to preserve
    semantic coherence. The separators prioritize splitting at natural
    boundaries (paragraphs > sentences > words) to keep related content together.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500,
        chunk_overlap=300,
        separators=["\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " ", ""],
        length_function=len,
        is_separator_regex=False,
    )
    return splitter.split_documents(documents)