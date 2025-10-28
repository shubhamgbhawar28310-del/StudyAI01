# 🚀 Vercel Deployment Guide - StudyAI

This guide will help you deploy StudyAI to Vercel with the Python backend on Render/Railway.

## 📋 Architecture

- **Frontend**: Deployed on Vercel
- **Backend**: Deployed on Render or Railway (Python Flask)
- **Database**: Supabase (already cloud-hosted)
- **AI**: Google Gemini API (serverless)

## 🔧 Step 1: Deploy Python Backend

### Option A: Deploy to Render (Recommended)

1. **Go to [Render Dashboard](https://dashboard.render.com/)**

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `python-backend` directory (or root if needed)

3. **Configure Service**
   - **Name**: `studyai-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `python-backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`

4. **Add Environment Variables** (Optional)
   - `FLASK_ENV`: `production`
   - `PYTHON_VERSION`: `3.11.0`

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete (5-10 minutes)
   - Copy the deployment URL (e.g., `https://studyai-backend.onrender.com`)

### Option B: Deploy to Railway

1. **Go to [Railway Dashboard](https://railway.app/)**

2. **Create New Project**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

3. **Configure Service**
   - Railway will auto-detect Python
   - Set root directory to `python-backend` if needed
   - Railway will use `Procfile` automatically

4. **Add Environment Variables**
   - `FLASK_ENV`: `production`

5. **Deploy**
   - Railway will automatically deploy
   - Copy the deployment URL from the dashboard

## 🌐 Step 2: Deploy Frontend to Vercel

### Method 1: Vercel Dashboard (Easiest)

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import your GitHub repository

3. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Add Environment Variables**
   
   Click "Environment Variables" and add:
   
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
   VITE_GOOGLE_AI_API_KEY=your-google-gemini-api-key
   VITE_API_URL=https://studyai-backend.onrender.com/api
   ```
   
   **IMPORTANT**: Replace `https://studyai-backend.onrender.com/api` with your actual backend URL from Step 1.

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (2-5 minutes)
   - Your app will be live at `https://your-project.vercel.app`

### Method 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
   vercel env add VITE_GOOGLE_AI_API_KEY
   vercel env add VITE_API_URL
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## ✅ Step 3: Verify Deployment

### Test Backend
1. Visit `https://your-backend-url.onrender.com/health`
2. You should see: `{"status": "OK", "message": "Python Document Processing Backend is running"}`

### Test Frontend
1. Visit your Vercel URL
2. Try uploading a document
3. Check browser console for any errors
4. Verify AI assistant works

## 🔄 Step 4: Update CORS (If Needed)

If you get CORS errors, update `python-backend/app.py`:

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:5173",  # Local development
    "https://your-project.vercel.app",  # Your Vercel URL
    "https://*.vercel.app"  # All Vercel preview deployments
])
```

## 📝 Environment Variables Reference

### Vercel (Frontend)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | `eyJhbGc...` |
| `VITE_GOOGLE_AI_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `VITE_API_URL` | Backend API URL | `https://studyai-backend.onrender.com/api` |

### Render/Railway (Backend)
| Variable | Description | Value |
|----------|-------------|-------|
| `FLASK_ENV` | Flask environment | `production` |
| `PYTHON_VERSION` | Python version | `3.11.0` |

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Backend not starting
- Check Render/Railway logs
- Verify `requirements.txt` has all dependencies
- Ensure `gunicorn` is in `requirements.txt`

**Problem**: 502 Bad Gateway
- Backend might be starting up (wait 1-2 minutes)
- Check if port binding is correct: `gunicorn app:app --bind 0.0.0.0:$PORT`

### Frontend Issues

**Problem**: "Failed to fetch" or CORS errors
- Verify `VITE_API_URL` is set correctly in Vercel
- Check backend CORS configuration
- Ensure backend URL includes `/api` at the end

**Problem**: AI not working
- Verify `VITE_GOOGLE_AI_API_KEY` is set in Vercel
- Check browser console for API errors
- Ensure API key has proper permissions

**Problem**: Authentication not working
- Verify Supabase environment variables
- Check Supabase dashboard for auth settings
- Ensure database migrations are run

### Environment Variable Issues

**Problem**: Environment variables not loading
- Ensure all variables start with `VITE_` for Vite
- Redeploy after adding variables in Vercel dashboard
- Check "Environment Variables" tab in Vercel project settings

## 🔄 Redeployment

### Trigger New Deployment

**Vercel (Frontend)**:
- Push to GitHub → Auto-deploys
- Or use: `vercel --prod`
- Or click "Redeploy" in Vercel dashboard

**Render (Backend)**:
- Push to GitHub → Auto-deploys
- Or click "Manual Deploy" → "Deploy latest commit"

**Railway (Backend)**:
- Push to GitHub → Auto-deploys
- Or click "Deploy" in Railway dashboard

## 🎉 Success Checklist

- [ ] Backend deployed and `/health` endpoint returns OK
- [ ] Frontend deployed and loads without errors
- [ ] All environment variables set in Vercel
- [ ] Document upload works (tests backend connection)
- [ ] AI assistant responds (tests Gemini API)
- [ ] Authentication works (tests Supabase)
- [ ] Data syncs properly (tests Supabase database)

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [Supabase Documentation](https://supabase.com/docs)

## 🆘 Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check Vercel deployment logs
3. Check Render/Railway logs
4. Verify all environment variables are set correctly
5. Ensure backend URL in `VITE_API_URL` includes `/api` suffix

---

**Important**: After deployment, update your repository's README with the live URLs!
