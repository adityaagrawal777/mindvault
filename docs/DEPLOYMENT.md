# 🚀 How to Deploy MindVault (Free)

Frontend → Vercel (free)  
Backend → Render (free)

---

## What You Need Before Starting

- A GitHub account (your code should already be pushed)
- A Groq API Key (you already have this in your `.env`)

---

## Part 1: Deploy Backend on Render

1. Go to [render.com](https://render.com) and sign up using your GitHub account

2. Click the "New +" button → click "Web Service"

3. It will show your GitHub repos → select `mindvault`

4. Fill in these settings:

   - Name: `mindvault-backend`
   - Runtime: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn api:app --host 0.0.0.0 --port $PORT`
   - Instance Type: `Free`

5. Click "Create Web Service"

6. Now go to the "Environment" tab on the left side and add these 3 variables:

   - `GROQ_API_KEY` = (paste your Groq API key)
   - `JWT_SECRET` = `mindvault-secret-2026`
   - `DATA_DIR` = `/tmp/data`

7. Click "Save Changes" — Render will start building (wait 3-5 minutes)

8. When it's done, your backend URL will be shown at the top. It looks like:
   ```
   https://mindvault-backend.onrender.com
   ```

9. Test it — open this in your browser:
   ```
   https://mindvault-backend.onrender.com/health
   ```
   If you see `{"status": "ok"}` → backend is working!

---

## Part 2: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up using your GitHub account

2. Click "Add New Project"

3. Select your `mindvault` repo from the list

4. Important! Click "Edit" next to Root Directory and type: `frontend`

5. Leave everything else as default (Vercel auto-detects Vite)

6. Click "Deploy" — takes about 1 minute

7. Vercel gives you a live URL like:
   ```
   https://mindvault-xxx.vercel.app
   ```

8. Open it in your browser → you should see the MindVault landing page!

---

## Part 3: Connect Frontend to Backend

If your Render URL is exactly `mindvault-backend.onrender.com`, skip this step — it's already configured!

If Render gave you a different URL, update this file:

File: `frontend/vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-RENDER-URL-HERE.onrender.com/:path*"
    }
  ]
}
```

Then push to GitHub:
```powershell
git add .
git commit -m "Update backend URL"
git push origin main
```

Vercel will auto-redeploy in ~30 seconds.

---

## Part 4: Test Everything

1. Open your Vercel URL in browser
2. Register a new account
3. Upload a PDF
4. Ask a question
5. Try Summary, Flashcards, and Quiz

---

## Good to Know

| Thing | Detail |
|---|---|
| First visit is slow | Render sleeps after 15 min of no activity. First request takes ~2 min to wake up |
| Data resets | Uploaded PDFs and chat history are lost when Render restarts (fine for demo) |
| Auto-deploy | Every `git push` auto-redeploys both Vercel and Render |
| Keep backend awake | Use free [UptimeRobot](https://uptimerobot.com) to ping your `/health` endpoint every 14 min |

---

## Something Not Working?

| Problem | Fix |
|---|---|
| Page loads but API calls fail | Check `frontend/vercel.json` has the correct Render URL |
| "Service Unavailable" | Render is sleeping — wait 2-3 min and refresh |
| "Model not found" error | Add `GROQ_API_KEY` in Render → Environment tab |
| Vercel says "Root Directory not found" | Set Root Directory to `frontend` in Vercel project settings |
| Build fails on Render | Check Render logs — usually a missing package in `requirements.txt` |
