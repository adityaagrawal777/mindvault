# 🚀 Deployment Guide — Vercel + Hugging Face Spaces

> Deploy MindVault for **free** with the React frontend on **Vercel** and the FastAPI backend on **Hugging Face Spaces**.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Step 1: Deploy Backend to Hugging Face Spaces](#step-1-deploy-backend-to-hugging-face-spaces)
- [Step 2: Deploy Frontend to Vercel](#step-2-deploy-frontend-to-vercel)
- [Step 3: Test the Deployed App](#step-3-test-the-deployed-app)
- [Troubleshooting](#troubleshooting)
- [Limitations](#limitations)

---

## Prerequisites

Before starting, make sure you have:

- [x] A **Hugging Face** account → [huggingface.co/join](https://huggingface.co/join)
- [x] A **Vercel** account → [vercel.com/signup](https://vercel.com/signup) (sign up with GitHub)
- [x] A **GitHub** account (Vercel deploys from GitHub)
- [x] **Git** installed on your machine
- [x] Your **Groq API key** ready

---

## Step 1: Deploy Backend to Hugging Face Spaces

### 1.1 Create a New Space

1. Go to [huggingface.co/new-space](https://huggingface.co/new-space)
2. Fill in the form:
   - **Space name**: `mindvault`
   - **License**: Choose any (e.g., MIT)
   - **SDK**: Select **Docker**
   - **Hardware**: Keep **Free — CPU Basic** (16GB RAM)
   - **Visibility**: Public (required for free tier)
3. Click **Create Space**

### 1.2 Set Secrets (API Keys)

1. In your new Space, go to **Settings** tab
2. Scroll to **Variables and secrets** section
3. Add the following **secrets** (click "New secret"):

   | Name | Value |
   |---|---|
   | `GROQ_API_KEY` | Your Groq API key (e.g., `gsk_...`) |
   | `JWT_SECRET` | Any random string (e.g., `mindvault-prod-secret-2026`) |

   > ⚠️ Use **Secrets** (not Variables) — secrets are encrypted and hidden from public view.

### 1.3 Push Backend Code to the Space

HF Spaces are Git repositories. You'll push your backend files to the Space repo.

```powershell
# Clone your empty HF Space
git clone https://huggingface.co/spaces/jinwoo-tensors/mindvault
cd mindvault

# Copy backend files from your project (adjust paths as needed)
# You need these files:
#   Dockerfile, requirements.txt,
#   api.py, auth.py, database.py, embeddings.py,
#   llm.py, main.py, pdf_loader.py, qa_chain.py, text_splitter.py
```

Copy these files into the cloned Space directory:

```
mindvault/                  ← HF Space repo
├── Dockerfile              ← From your project root
├── requirements.txt
├── api.py
├── auth.py
├── database.py
├── embeddings.py
├── llm.py
├── main.py
├── pdf_loader.py
├── qa_chain.py
└── text_splitter.py
```

Then push:

```powershell
cd mindvault
git add .
git commit -m "Deploy MindVault backend"
git push
```

> **Note**: HF will ask for your credentials. Use your HF username and an [access token](https://huggingface.co/settings/tokens) (not your password).

### 1.4 Wait for Build

1. Go to your Space page: `https://huggingface.co/spaces/jinwoo-tensors/mindvault`
2. Click the **Logs** tab to monitor the build
3. The first build takes **5-10 minutes** (downloading dependencies + embedding model)
4. Once you see `Uvicorn running on http://0.0.0.0:7860`, the backend is live!

### 1.5 Verify Backend

Open this URL in your browser:

```
https://jinwoo-tensors-mindvault.hf.space/health
```

You should see:
```json
{"status": "ok", "active_sessions": 0}
```

✅ Backend is deployed!

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Push Project to GitHub

If your project isn't already on GitHub:

```powershell
cd d:\pdf_chatbot
git add .
git commit -m "Add deployment configuration"
git push origin main
```

### 2.2 Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your `mindvault` (or `pdf_chatbot`) GitHub repository
4. Configure the project:

   | Setting | Value |
   |---|---|
   | **Framework Preset** | Vite |
   | **Root Directory** | `frontend` ← **Important!** Click "Edit" and set this |
   | **Build Command** | `npm run build` (auto-detected) |
   | **Output Directory** | `dist` (auto-detected) |

5. Click **Deploy**

### 2.3 Update the Space URL (if different)

If your HF Space URL is different from `jinwoo-tensors-mindvault.hf.space`, update the rewrite destination in `frontend/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-ACTUAL-SPACE-URL.hf.space/:path*"
    }
  ]
}
```

Commit and push — Vercel will auto-redeploy.

### 2.4 Verify Frontend

Vercel will give you a URL like `https://mindvault-xxx.vercel.app`. Open it and you should see the MindVault landing page!

✅ Frontend is deployed!

---

## Step 3: Test the Deployed App

1. Open your Vercel URL in the browser
2. **Register** a new account
3. **Upload** a PDF file
4. **Ask** a question about the document
5. Try the **Summary**, **Flashcards**, and **Quiz** features

### Expected behavior

- First upload may take **30-60 seconds** (embedding generation on CPU)
- Questions should respond in **2-5 seconds** (Groq is fast)
- If the HF Space was sleeping, the first request may take **1-3 minutes** to wake up

---

## Troubleshooting

### "502 Bad Gateway" or "Application Error"

**Cause**: The HF Space is sleeping (free tier sleeps after ~48hrs of inactivity).

**Fix**: Visit your Space page on Hugging Face to wake it up, then try again.

---

### "Failed to fetch" or CORS errors

**Cause**: The `vercel.json` rewrite URL doesn't match your actual Space URL.

**Fix**: Check your Space URL format. It should be:
```
https://{username}-{space-name}.hf.space
```
For example: `https://jinwoo-tensors-mindvault.hf.space`

Update `frontend/vercel.json` accordingly and redeploy.

---

### Build fails on Hugging Face

**Cause**: Usually out of memory during model download.

**Fix**: Check the build logs in the **Logs** tab. If the build runs out of memory, consider switching to the lighter embedding model in `embeddings.py`:

```python
# Lighter alternative (~80MB instead of ~420MB)
model_name="sentence-transformers/all-MiniLM-L6-v2"
```

Also update the model name in the `Dockerfile`'s pre-download step.

---

### "Model not found" error from Groq

**Cause**: `GROQ_API_KEY` secret is not set in HF Space settings.

**Fix**: Go to your Space → Settings → Variables and secrets → Add `GROQ_API_KEY`.

---

### Vercel says "Root Directory not found"

**Cause**: The root directory wasn't set to `frontend`.

**Fix**: In Vercel dashboard → Project Settings → General → Root Directory → set to `frontend`.

---

## Limitations

| Limitation | Detail | Workaround |
|---|---|---|
| **Data is ephemeral** | SQLite DB + PDFs are lost on restart | Accept for demo; use external DB for production |
| **Space sleeps** | After ~48hrs of inactivity | Visit Space page to wake it; use HF's "awake" option (paid) |
| **Cold start** | First request after sleep takes 1-3 min | Pre-downloaded model in Docker helps; users see loading state |
| **CPU only** | Embedding generation is slower on CPU | Use lighter model; Groq inference is still fast (cloud GPU) |
| **16GB RAM limit** | Fine for single users, not for heavy concurrent load | Sufficient for portfolio/demo usage |

---

## Architecture (Deployed)

```
User → Browser
         │
         ▼
┌─────────────────────────────┐
│  Vercel CDN                 │
│  https://mindvault.vercel.app │
│                             │
│  Static React build (dist/) │
│  vercel.json rewrites       │
│    /api/* → HF Space        │
└──────────┬──────────────────┘
           │ HTTPS
           ▼
┌─────────────────────────────┐
│  Hugging Face Spaces        │
│  Docker container           │
│                             │
│  FastAPI (:7860)            │
│  ├── SQLite (ephemeral)     │
│  ├── FAISS (in-memory)      │
│  ├── HuggingFace embeddings │
│  └── Groq API (external)    │
└─────────────────────────────┘
           │ HTTPS
           ▼
┌─────────────────────────────┐
│  Groq Cloud                 │
│  LLM inference (Compound)   │
└─────────────────────────────┘
```
