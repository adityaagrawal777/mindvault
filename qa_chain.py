from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser


def format_docs(docs):
    """Format retrieved documents into a single context string."""
    return "\n\n".join(doc.page_content for doc in docs)


def create_qa_chain(llm, vectorstore):
    """Create a retrieval QA chain using LCEL (LangChain Expression Language)."""
    retriever = vectorstore.as_retriever()

    prompt = ChatPromptTemplate.from_template(
        """Answer the question based only on the following context:

{context}

Question: {question}

Answer:"""
    )

    # Chain with source retrieval
    # 1. Retrieve documents
    # 2. Assign formatted context to the prompt
    # 3. Pass through the original documents to the output
    from langchain_core.runnables import RunnableParallel

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
