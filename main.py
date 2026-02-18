import warnings
import os

# Suppress all deprecation and future warnings for clean output
warnings.filterwarnings("ignore")
os.environ["TOKENIZERS_PARALLELISM"] = "false"

from pdf_loader import load_pdf
from text_splitter import split_documents
from embeddings import create_vector_store
from llm import load_llm
from qa_chain import create_qa_chain


def main():
    print("\n" + "=" * 60)
    print("       PDF CHATBOT - Chat with your PDF")
    print("=" * 60)

    pdf_path = input("\nEnter PDF file path: ").strip().strip('"')

    if not os.path.exists(pdf_path):
        print(f"\nError: File not found - {pdf_path}")
        return

    print("\nLoading PDF...")
    docs = load_pdf(pdf_path)

    print("Splitting into chunks...")
    chunks = split_documents(docs)

    print("Creating embeddings (this may take a moment)...")
    vectorstore = create_vector_store(chunks)

    print("Loading LLM...")
    llm = load_llm()
    qa_chain = create_qa_chain(llm, vectorstore)

    print("\n" + "=" * 60)
    print("  PDF loaded successfully!")
    print("  Type 'summary' for a summary")
    print("  Type 'exit' to quit")
    print("=" * 60)

    while True:
        query = input("\nYou: ").strip()

        if not query:
            continue

        if query.lower() == "exit":
            print("\nGoodbye!")
            break

        if query.lower() == "summary":
            query = "Give a detailed summary of this document"

        try:
            answer = qa_chain.invoke(query)
            print(f"\nAssistant:\n{answer}")
            print("-" * 60)
        except Exception as e:
            print(f"\nError: {e}")
            print("Please try again with a different question.")


if __name__ == "__main__":
    main()
