# 🤖 AI & RAG Pipeline — Detailed Breakdown

> The heart of MindVault is its Retrieval-Augmented Generation (RAG) pipeline. It converts PDF content into searchable vectors, retrieves the most relevant passages for a user's question, and feeds them to an LLM to generate accurate, grounded answers.

---

## Table of Contents

- [What is RAG?](#-what-is-rag)
- [Pipeline Overview](#-pipeline-overview)
- [LangChain](#-langchain)
- [Text Splitting](#-text-splitting)
- [Embeddings (HuggingFace sentence-transformers)](#-embeddings-huggingface-sentence-transformers)
- [Vector Store (FAISS)](#-vector-store-faiss)
- [LLM (Groq API)](#-llm-groq-api)
- [QA Chain (LCEL)](#-qa-chain-lcel)
- [Advanced Features](#-advanced-features)

---

## 🧠 What is RAG?

**Retrieval-Augmented Generation (RAG)** is a technique that enhances LLM responses by grounding them in specific source documents rather than relying solely on the model's training data.

### Without RAG

```
User: "What does the document say about X?"
  │
  └── LLM → Generates answer from training data (may hallucinate)
```

### With RAG

```
User: "What does the document say about X?"
  │
  ├── 1. RETRIEVE: Find relevant passages from the uploaded document
  ├── 2. AUGMENT: Inject those passages into the LLM prompt as context
  └── 3. GENERATE: LLM answers based ONLY on provided context
```

### Why RAG matters

| Problem | RAG Solution |
|---|---|
| LLMs hallucinate facts | Answer is grounded in actual document text |
| LLMs have knowledge cutoffs | Uses the user's own documents, any date |
| Generic answers | Specific answers with page-level citations |
| No source attribution | Citations trace answers back to source pages |

---

## 🔄 Pipeline Overview

```
┌──────────┐    ┌──────────────┐    ┌────────────┐    ┌───────────┐    ┌──────────┐
│  Upload  │───>│  PDF Loader  │───>│  Text      │───>│ Embedding │───>│  FAISS   │
│  PDF     │    │  (PyPDF)     │    │  Splitter  │    │ Model     │    │  Index   │
└──────────┘    └──────────────┘    └────────────┘    └───────────┘    └──────────┘
                                                                            │
                                                                     Stored in memory
                                                                            │
┌──────────┐    ┌──────────────┐    ┌────────────┐    ┌───────────┐         │
│  Answer  │<───│  Groq LLM   │<───│  Prompt +  │<───│ Retriever │<────────┘
│          │    │  (Compound)  │    │  Context   │    │ (MMR)     │
└──────────┘    └──────────────┘    └────────────┘    └───────────┘
                                         ▲
                                         │
                                    ┌────────────┐
                                    │  User      │
                                    │  Question  │
                                    └────────────┘
```

---

## 🔗 LangChain

**Role**: Orchestration framework that wires together all AI components

LangChain is the glue that connects the retriever, prompt, LLM, and output parser into a single callable chain.

### Packages used

| Package | Purpose |
|---|---|
| `langchain` | Core abstractions (chains, prompts, output parsers) |
| `langchain-community` | Community integrations (HuggingFace embeddings, FAISS, PyPDF) |
| `langchain-groq` | Groq LLM integration (`ChatGroq` class) |
| `langchain-text-splitters` | Text chunking utilities |

### LCEL (LangChain Expression Language)

The project uses **LCEL**, LangChain's declarative syntax for building chains with the pipe (`|`) operator:

```python
chain = (
    RunnablePassthrough.assign(context=lambda x: format_docs(x["context"]))
    | prompt
    | llm
    | StrOutputParser()
)
```

This reads as: _take input → format docs → fill prompt → send to LLM → parse string output_.

---

## ✂️ Text Splitting

**Role**: Break documents into optimal chunks for embedding and retrieval

**Module**: `text_splitter.py`

### Configuration

```python
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1500,       # Max characters per chunk
    chunk_overlap=300,     # Overlap between consecutive chunks
    separators=["\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " ", ""],
    length_function=len,
)
```

### Why these settings?

| Parameter | Value | Rationale |
|---|---|---|
| `chunk_size` | 1500 | Large enough to preserve complete ideas/paragraphs |
| `chunk_overlap` | 300 | Prevents cutting off context at chunk boundaries |
| `separators` | Priority list | Splits at natural boundaries — paragraphs first, then sentences, then words |

### How RecursiveCharacterTextSplitter works

1. Try splitting on `\n\n` (paragraph breaks) first
2. If chunks are still too large, split on `\n` (line breaks)
3. Continue down the separator list until chunks fit within `chunk_size`
4. Adjacent chunks share 300 characters of overlap

### Example

```
Original text (3000 chars):
[==========|==========|==========]

After splitting (chunk_size=1500, overlap=300):
Chunk 1: [==========|===]        (1500 chars)
Chunk 2:        [===|==========|] (1500 chars, 300 overlap with chunk 1)
Chunk 3:               [|==========] (remaining)
```

---

## 🔢 Embeddings (HuggingFace sentence-transformers)

**Role**: Convert text chunks into numerical vectors that capture semantic meaning

**Module**: `embeddings.py`

### Model used

```python
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-mpnet-base-v2"
)
```

### About `all-mpnet-base-v2`

| Property | Value |
|---|---|
| **Base model** | Microsoft MPNet |
| **Embedding dimension** | 768 |
| **Max sequence length** | 384 tokens |
| **Training** | Trained on 1B+ sentence pairs |
| **Performance** | Top-tier on semantic similarity benchmarks |
| **Size** | ~420 MB |
| **Runs on** | CPU (no GPU required) |

### How embeddings work

```
"What is machine learning?"
         │
         ▼
  Embedding Model
         │
         ▼
[0.023, -0.154, 0.892, ..., 0.041]  ← 768-dimensional vector
```

- Semantically similar texts produce vectors that are **close together** in vector space
- "Machine learning is a subset of AI" and "ML is part of artificial intelligence" will have **high cosine similarity**
- "The weather is sunny today" will be **far away** from both

### Why not OpenAI embeddings?

- **Free** — HuggingFace models run locally, no API costs
- **Private** — document content never leaves the user's machine
- **Fast** — no network latency for embedding generation

---

## 📦 Vector Store (FAISS)

**Role**: Store and search document embeddings using similarity search

**Library**: `faiss-cpu` (Facebook AI Similarity Search)

### How FAISS is created

```python
from langchain_community.vectorstores import FAISS

vectorstore = FAISS.from_documents(chunks, embeddings)
```

This does:
1. Embeds each chunk using the HuggingFace model → array of 768-dim vectors
2. Builds a FAISS index for fast nearest-neighbor search
3. Returns a `FAISS` object that can be queried

### How retrieval works

```
User question: "What are the main findings?"
         │
         ▼
  Embed the question → [0.134, -0.089, ...]
         │
         ▼
  FAISS: Find top-K nearest vectors in index
         │
         ▼
  Return the text chunks those vectors represent
```

### MMR Retrieval (Maximal Marginal Relevance)

The project uses **MMR** instead of basic similarity search:

```python
retriever = vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 8,              # Return 8 diverse chunks
        "fetch_k": 20,       # Consider 20 candidates
        "lambda_mult": 0.7,  # 70% relevance, 30% diversity
    }
)
```

### MMR vs. basic similarity search

| Approach | Behavior | Risk |
|---|---|---|
| **Similarity** | Returns the 8 most similar chunks | May return near-duplicate passages |
| **MMR** | Returns 8 chunks that are relevant AND diverse | Covers different aspects of the topic |

### MMR algorithm

```
1. Find 20 most relevant chunks (fetch_k=20)
2. Select the #1 most relevant chunk
3. For each remaining selection:
   - Score = 0.7 × relevance_to_question - 0.3 × similarity_to_already_selected
   - Pick the chunk with highest score
4. Repeat until 8 chunks selected (k=8)
```

This ensures the LLM gets a **broad view** of the relevant content, not 8 variations of the same paragraph.

### In-memory storage

FAISS indexes are stored in the Python process memory:

```python
sessions[session_id] = {
    "chain": qa_chain,
    "vectorstore": vectorstore,  # FAISS index lives here
    "llm": llm
}
```

> ⚠️ **Important**: FAISS indexes are lost on server restart. The PDF file and chat history persist in SQLite, but the QA chain must be rebuilt by re-uploading the PDF.

---

## 🧠 LLM (Groq API)

**Role**: Generate natural language answers based on retrieved context

**Module**: `llm.py`

### Configuration

```python
from langchain_groq import ChatGroq

def load_llm():
    return ChatGroq(
        model="groq/compound",
        temperature=0,
        api_key=os.getenv("GROQ_API_KEY")
    )
```

### About Groq

| Property | Detail |
|---|---|
| **Provider** | Groq Inc. |
| **Model** | `groq/compound` |
| **Inference** | LPU (Language Processing Unit) hardware — extremely fast |
| **API** | Compatible with OpenAI chat completions format |
| **Temperature** | Set to `0` for deterministic, factual responses |

### Why temperature = 0?

For a document Q&A system, you want **deterministic, factual answers** — not creative ones. Temperature 0 means:
- The model always picks the most probable next token
- Same question + same context = same answer
- No creative embellishment or hallucination encouragement

### Why Groq over OpenAI/Anthropic?

| Factor | Groq | OpenAI |
|---|---|---|
| **Speed** | ~10x faster inference | Standard speed |
| **Cost** | Free tier generous | Pay-per-token |
| **Latency** | Ultra-low (LPU hardware) | Higher (GPU-based) |

---

## ⛓️ QA Chain (LCEL)

**Role**: Wire together retriever + prompt + LLM into a single callable chain

**Module**: `qa_chain.py`

### Chain architecture

```python
# Step 1: Parallel — retrieve docs AND pass through question
setup_and_retrieval = RunnableParallel(
    {"context": retriever, "question": RunnablePassthrough()}
)

# Step 2: Format docs → fill prompt → send to LLM → parse output
answer_chain = (
    RunnablePassthrough.assign(context=lambda x: format_docs(x["context"]))
    | prompt
    | llm
    | StrOutputParser()
)

# Step 3: Combine — output includes both context docs and generated answer
chain = setup_and_retrieval.assign(answer=answer_chain)
```

### What happens when you call `chain.invoke("What is X?")`

```
Input: "What is X?"
    │
    ├── RunnableParallel:
    │   ├── context: retriever.invoke("What is X?")
    │   │            → [Doc1, Doc2, ..., Doc8]  (FAISS MMR retrieval)
    │   └── question: "What is X?"              (passthrough)
    │
    │   Result: {"context": [Doc1...Doc8], "question": "What is X?"}
    │
    ├── answer_chain:
    │   ├── format_docs(context) → "Source 1 - Page 3\n..."  (formatted string)
    │   ├── prompt.invoke(context=..., question=...)          (fill template)
    │   ├── llm.invoke(filled_prompt)                        (Groq inference)
    │   └── StrOutputParser()                                (extract string)
    │
    └── Final output: {
          "context": [Doc1, Doc2, ..., Doc8],   ← Raw documents (for citations)
          "question": "What is X?",
          "answer": "Based on the document..."   ← Generated answer
        }
```

### Prompt template

```
You are a knowledgeable and helpful document assistant. Your job is to
answer questions using the provided context from a PDF document.

Instructions:
1. Read ALL the context passages carefully and thoroughly before answering.
2. Synthesize information from multiple passages when relevant.
3. If the context contains related information, even partially, provide
   the best answer you can. Connect the dots between passages.
4. Use clear, well-structured formatting (bullet points, numbered lists,
   headings) when appropriate.
5. Reference which source/page your information comes from when possible.
6. Only say you cannot find the information if NONE of the context passages
   contain anything even remotely related.

Context from the document:
{context}

Question: {question}

Answer:
```

### Document formatting

Retrieved documents are formatted with source labels:

```python
def format_docs(docs):
    formatted_parts = []
    for i, doc in enumerate(docs, 1):
        page_label = doc.metadata.get("page_label", f"Page {doc.metadata.get('page', 0) + 1}")
        formatted_parts.append(f"[Source {i} - {page_label}]\n{doc.page_content}")
    return "\n\n---\n\n".join(formatted_parts)
```

Example output fed to the LLM:

```
[Source 1 - Page 3]
Machine learning is a subset of artificial intelligence...

---

[Source 2 - Page 7]
The key algorithms include supervised learning...

---

[Source 3 - Page 12]
Applications of ML span across healthcare, finance...
```

---

## 🎯 Advanced Features

### Flashcard Generation

The `/flashcards/{session_id}` endpoint uses the QA chain with a specialized prompt:

```
Generate exactly {count} flashcards from this document for study purposes.
Return ONLY a valid JSON array:
[{"question": "What is X?", "answer": "X is..."}]
```

The response is parsed as JSON, validated, and returned as structured data.

### Quiz Generation

The `/quiz/{session_id}` endpoint implements **difficulty-aware retrieval**:

| Difficulty | Search Query Focus | Question Style |
|---|---|---|
| **Easy** | Definitions, key facts, vocabulary, basics | "What is X?", "Which term defines Y?" |
| **Medium** | Mechanisms, processes, cause-effect | "Why does X occur?", "How does Y function?" |
| **Hard** | Analysis, limitations, edge cases, trade-offs | "What can be inferred?", "Which constraint limits?" |

Each difficulty level uses a **different search query** to retrieve appropriate context chunks:

```python
if diff_key == "easy":
    search_query = "definition key facts vocabulary summary basic terms"
elif diff_key == "hard":
    search_query = "analysis methodology limitations edge cases trade-offs"
else:
    search_query = "mechanism process explanation features cause effect"
```

The quiz uses **direct LLM invocation** (bypassing the QA chain) with 12 MMR-retrieved chunks for maximum context coverage:

```python
docs = vectorstore.max_marginal_relevance_search(search_query, k=12, fetch_k=30, lambda_mult=0.6)
response = llm.invoke(prompt)
```

### Summary Types

| Type | Description |
|---|---|
| `bullets` | Concise bullet-point list of key ideas |
| `detailed` | Comprehensive multi-paragraph summary with markdown headings |
| `short` | 2-3 sentence essential summary |

---

## 📊 Performance Characteristics

| Operation | Typical Timing | Bottleneck |
|---|---|---|
| PDF text extraction | ~1-3s | Disk I/O + PDF parsing |
| Text splitting | <100ms | CPU (string operations) |
| Embedding generation | ~5-30s | CPU (depends on document size) |
| FAISS index creation | <1s | Memory allocation |
| Question retrieval (MMR) | ~50-200ms | Vector similarity computation |
| LLM inference (Groq) | ~1-5s | Network + Groq API |
| **Total first-upload time** | **~10-40s** | Embedding generation dominates |
| **Per-question latency** | **~1-5s** | LLM inference dominates |
