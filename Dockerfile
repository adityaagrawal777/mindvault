# ─────────────────────────────────────────────────────────────
#  MindVault — Dockerfile for Hugging Face Spaces
#  SDK: Docker | Port: 7860
# ─────────────────────────────────────────────────────────────

FROM python:3.11-slim

# ── System dependencies ─────────────────────────────────────
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential && \
    rm -rf /var/lib/apt/lists/*

# ── Create non-root user (HF Spaces requirement) ───────────
RUN useradd -m -u 1000 user
ENV HOME=/home/user
ENV PATH=/home/user/.local/bin:$PATH

# ── Set model cache directory ───────────────────────────────
ENV HF_HOME=/home/user/.cache/huggingface
ENV TRANSFORMERS_CACHE=/home/user/.cache/huggingface
ENV SENTENCE_TRANSFORMERS_HOME=/home/user/.cache/huggingface

# ── Install Python dependencies ─────────────────────────────
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ── Pre-download the embedding model at build time ──────────
# This avoids downloading ~420MB on every cold start
RUN python -c "\
from huggingface_hub import snapshot_download; \
snapshot_download(repo_id='sentence-transformers/all-mpnet-base-v2', \
                 cache_dir='/home/user/.cache/huggingface')"

# ── Copy application code ──────────────────────────────────
COPY --chown=user:user . /app

# ── Create data directories ────────────────────────────────
RUN mkdir -p /app/data/pdfs && chown -R user:user /app/data

# ── Switch to non-root user ────────────────────────────────
USER user

# ── Expose HF Spaces default port ──────────────────────────
EXPOSE 7860

# ── Run the FastAPI server ──────────────────────────────────
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "7860"]
