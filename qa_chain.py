from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableParallel
from langchain_core.output_parsers import StrOutputParser


def format_docs(docs):
    """Format retrieved documents into a single context string with page references."""
    formatted_parts = []
    for i, doc in enumerate(docs, 1):
        page_label = doc.metadata.get("page_label", f"Page {doc.metadata.get('page', 0) + 1}")
        formatted_parts.append(f"[Source {i} - {page_label}]\n{doc.page_content}")
    return "\n\n---\n\n".join(formatted_parts)


def create_qa_chain(llm, vectorstore):
    """Create a retrieval QA chain using LCEL (LangChain Expression Language).
    
    Uses MMR (Maximal Marginal Relevance) retrieval to get diverse, relevant chunks.
    MMR balances relevance with diversity — it fetches 20 candidate chunks, then
    selects the top 8 that are both relevant AND cover different aspects of the topic.
    This dramatically reduces the chance of missing relevant content.
    """
    retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": 8,          # Return 8 diverse chunks (up from 6)
            "fetch_k": 20,   # Consider top 20 candidates before selecting 8
            "lambda_mult": 0.7,  # Balance: 0.7 relevance, 0.3 diversity
        }
    )

    prompt = ChatPromptTemplate.from_template(
        """You are a knowledgeable and helpful document assistant. Your job is to answer questions using the provided context from a PDF document.

Instructions:
1. Read ALL the context passages carefully and thoroughly before answering.
2. Synthesize information from multiple passages when relevant — the answer may be spread across several sources.
3. If the context contains information related to the question, even partially, provide the best answer you can from what's available. Connect the dots between passages.
4. Use clear, well-structured formatting (bullet points, numbered lists, headings) when appropriate.
5. Reference which source/page your information comes from when possible.
6. Only say you cannot find the information if NONE of the context passages contain anything even remotely related to the question.

Context from the document:
{context}

Question: {question}

Answer:"""
    )

    setup_and_retrieval = RunnableParallel(
        {"context": retriever, "question": RunnablePassthrough()}
    )

    answer_chain = (
        RunnablePassthrough.assign(context=lambda x: format_docs(x["context"]))
        | prompt
        | llm
        | StrOutputParser()
    )

    chain = setup_and_retrieval.assign(answer=answer_chain)
    return chain
