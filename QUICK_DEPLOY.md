# ⚡ Quick Deploy Reference

## 🎯 The Problem
Your AI Assistant works locally but not on Vercel because:
- Frontend calls `http://localhost:5000/api` (only works locally)
- Backend needs to be deployed separately
- Vercel needs the deployed backend URL

## ✅ The Solution (3 Steps)

### Step 1: Deploy Backend (5 minutes)
1. Go to [Render.com](https://render.com) → Sign up/Login
2. Click "New +" → "Web Service"
3. Connect GitHub → Select your repo
4. Configure:
   - **Root Directory**: `python-backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
5. Click "Create Web Service"
6. **Copy the URL** (e.g., `https://studyai-backend-abc123.onrender.com`)

### Step 2: Update Vercel Environment Variables (2 minutes)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → Settings → Environment Variables
3. Update `VITE_API_URL`:
   ```
   VITE_API_URL=https://studyai-backend-abc123.onrender.com/api
   ```
   ⚠️ **IMPORTANT**: Add `/api` at the end!
4. Save changes

### Step 3: Redeploy Frontend (1 minute)
1. In Vercel dashboard → Deployments tab
2. Click "..." on latest deployment → "Redeploy"
3. Wait for build to complete

## 🧪 Test It
1. Visit your Vercel URL
2. Upload a document in AI Assistant
3. Check if it processes correctly

## 🔑 Required Environment Variables in Vercel

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
VITE_GOOGLE_AI_API_KEY=AIzaSy...
VITE_API_URL=https://your-backend.onrender.com/api
```

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend 502 error | Wait 1-2 min (cold start) |
| CORS error | Check URL ends with `/api` |
| AI not working | Verify API key is set |
| Auth not working | Check Supabase variables |

## 📝 Files Created
- `python-backend/render.yaml` - Render config
- `python-backend/Procfile` - Railway config
- `VERCEL_DEPLOYMENT_GUIDE.md` - Full guide
