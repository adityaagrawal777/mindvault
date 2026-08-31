# 🚀 Deployment Guide — Vercel (Frontend) + Render (Backend)

> Deploy MindVault for **100% free** — React frontend on **Vercel**, FastAPI backend on **Render**.

---

## Architecture

```
┌──────────────────────────────┐         /api/* rewrites         ┌─────────────────────────────┐
│   Vercel                     │ ──────────────────────────────> │   Render                    │
│   Frontend (React)           │                                  │   Backend (FastAPI)         │
│   mindvault.vercel.app       │ <────────────────────────────── │   mindvault-backend.onrender│
└──────────────────────────────┘         JSON responses           └─────────────────────────────┘
                                                                           │
                                                                    Groq API (LLM)
```

> [!WARNING]
> **Free tier limitation on both platforms:**
> - Render sleeps after **15 minutes** of inactivity. Cold start takes ~2-3 minutes.
> - Storage is **ephemeral** — uploaded PDFs and chat history reset when the service restarts.
> - This is fine for demos and portfolio projects.

---

## Prerequisites

- [x] A **GitHub** account with this project pushed
- [x] A **Vercel** account → [vercel.com/signup](https://vercel.com/signup) *(sign up with GitHub)*
- [x] A **Render** account → [render.com](https://render.com) *(sign up with GitHub)*
- [x] Your **Groq API key** ready

---

## Step 1: Push Your Code to GitHub

If you haven't pushed yet:

```powershell
cd d:\pdf_chatbot
git add .
git commit -m "Add deployment config for Vercel + Render"
git push origin main
```

---

## Step 2: Deploy Backend to Render

### 2.1 Create a New Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if prompted
4. Select your `mindvault` (or `pdf_chatbot`) repository
5. Configure the service:

   | Setting | Value |
   |---|---|
   | **Name** | `mindvault-backend` |
   | **Region** | Choose closest to you |
   | **Branch** | `main` |
   | **Runtime** | `Python 3` |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `uvicorn api:app --host 0.0.0.0 --port $PORT` |
   | **Instance Type** | **Free** |

6. Click **"Create Web Service"**

> Render auto-detects `render.yaml` in your repo — the settings above should pre-fill automatically.

### 2.2 Set Environment Variables (Secrets)

On the service page, go to **"Environment"** tab and add:

| Key | Value |
|---|---|
| `GROQ_API_KEY` | Your Groq API key (e.g., `gsk_...`) |
| `JWT_SECRET` | Any random string (e.g., `mindvault-render-secret-2026`) |
| `DATA_DIR` | `/tmp/data` |

Click **"Save Changes"** — Render will redeploy automatically.

### 2.3 Wait for Deploy

1. Click the **"Logs"** tab to watch the build
2. First build takes **3-6 minutes** (installing dependencies + downloading embedding model)
3. You'll see: `Uvicorn running on http://0.0.0.0:PORT`

### 2.4 Find Your Backend URL

At the top of the service page you'll see your URL:
```
https://mindvault-backend.onrender.com
```

> ⚠️ If Render gives a different name, copy the exact URL — you'll need it in Step 4.

### 2.5 Verify Backend

Open in browser:
```
https://mindvault-backend.onrender.com/health
```

Expected response:
```json
{"status": "ok", "active_sessions": 0}
```

✅ Backend is live!

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your `mindvault` GitHub repository
4. Configure:

   | Setting | Value |
   |---|---|
   | **Framework Preset** | Vite |
   | **Root Directory** | `frontend` ← **Click "Edit" and set this!** |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

5. Click **"Deploy"**

### 3.2 Update vercel.json if Needed

If your Render URL is different from `mindvault-backend.onrender.com`, update `frontend/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-ACTUAL-RENDER-URL.onrender.com/:path*"
    }
  ]
}
```

Commit and push — Vercel auto-redeploys in ~30 seconds.

---

## Step 4: Test the Live App

1. Open your Vercel URL (e.g., `https://mindvault-xxx.vercel.app`)
2. **Register** an account
3. **Upload** a PDF
4. **Ask** a question

### Expected Timing

| Action | Time |
|---|---|
| Cold start (after sleep) | ~2-3 min |
| PDF upload + processing | ~15-30 sec |
| Per question | ~2-5 sec |

---

## Troubleshooting

### "Service Unavailable" or timeout
Render is sleeping. Wait 2-3 minutes for cold start, then retry.

### "Failed to fetch" CORS error  
The `vercel.json` URL doesn't match your actual Render URL. Update `frontend/vercel.json` and push.

### Build fails on Render
Check logs. Common causes:
- Missing package in `requirements.txt`
- Wrong start command (should be `uvicorn api:app --host 0.0.0.0 --port $PORT`)

### "Model not found" from Groq
`GROQ_API_KEY` env var is not set in Render. Go to Render → Environment → add it.

### Out of memory on Render
The lighter `all-MiniLM-L6-v2` model is already configured. If you still get OOM, check Render logs.

---

## Keeping Your Render Service Awake (Optional)

On the free tier, Render sleeps after 15 min of inactivity. To reduce cold starts:
- Use [UptimeRobot](https://uptimerobot.com) (free) to ping your `/health` endpoint every 14 minutes
- Add monitor → HTTP(s) → URL: `https://mindvault-backend.onrender.com/health` → every 14 min

This keeps your backend always awake — completely free!
