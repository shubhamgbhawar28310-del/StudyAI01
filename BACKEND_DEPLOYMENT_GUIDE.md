# 🚀 Python Backend Deployment Guide

## Problem
Your AI assistant can't analyze uploaded files because the Python backend isn't deployed. It only runs locally.

## Solution
Deploy the Python backend to **Render** (free tier) and connect it to your Vercel frontend.

---

## 📋 Step-by-Step Deployment

### Step 1: Push Backend Changes to GitHub

```bash
git add python-backend/
git commit -m "Prepare Python backend for deployment"
git push origin main
```

### Step 2: Deploy to Render

1. **Go to Render:**
   - Visit: https://render.com
   - Click **"Get Started"** or **"Sign Up"**
   - Sign up with GitHub

2. **Create New Web Service:**
   - Click **"New +"** → **"Web Service"**
   - Click **"Build and deploy from a Git repository"**
   - Click **"Connect account"** (if needed)
   - Select your repository: **Ren0-07/StudyAI01**

3. **Configure Service:**
   - **Name:** `studyai-backend`
   - **Region:** Oregon (US West) - closest to Vercel
   - **Branch:** `main`
   - **Root Directory:** `python-backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`

4. **Environment Variables:**
   - Click **"Advanced"**
   - Add environment variable:
     - **Key:** `PYTHON_VERSION`
     - **Value:** `3.11.0`

5. **Select Plan:**
   - Choose **"Free"** plan
   - Click **"Create Web Service"**

6. **Wait for Deployment:**
   - Takes 5-10 minutes
   - You'll see build logs
   - Once done, you'll get a URL like: `https://studyai-backend.onrender.com`

### Step 3: Update Frontend Environment Variable

Once your backend is deployed, copy the URL and update your Vercel environment variables:

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your **StudyAI01** project

2. **Update Environment Variable:**
   - Go to **Settings** → **Environment Variables**
   - Find `VITE_API_URL`
   - Change from `http://localhost:5000/api` to:
     ```
     https://studyai-backend.onrender.com/api
     ```
   - Click **"Save"**

3. **Redeploy Frontend:**
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**
   - Or just push any change to GitHub (auto-deploys)

### Step 4: Test the Connection

1. **Visit your deployed app**
2. **Go to AI Assistant**
3. **Upload a PDF/DOCX file**
4. **Ask a question about the file**
5. **It should now work!** ✅

---

## 🔍 Troubleshooting

### Backend not responding?
- Check Render logs: Dashboard → Your Service → Logs
- Make sure service status is "Live" (green)

### CORS errors?
- The backend is configured to allow all origins
- Check browser console for specific errors

### File upload fails?
- Check file size (max 50MB)
- Check Render logs for Python errors
- Make sure all dependencies installed correctly

### Backend goes to sleep (Free tier)?
- Render free tier sleeps after 15 min of inactivity
- First request after sleep takes 30-60 seconds
- Consider upgrading to paid tier ($7/mo) for always-on

---

## 💰 Cost Breakdown

### Free Tier (What you'll use):
- ✅ 750 hours/month (enough for 24/7)
- ✅ Automatic HTTPS
- ✅ Custom domains
- ❌ Sleeps after 15 min inactivity
- ❌ Slower cold starts

### Paid Tier ($7/month):
- ✅ Always-on (no sleep)
- ✅ Faster performance
- ✅ More resources

---

## 🎯 Alternative: Railway

If Render doesn't work, try Railway:

1. **Go to:** https://railway.app
2. **Sign up with GitHub**
3. **New Project** → **Deploy from GitHub repo**
4. **Select:** Ren0-07/StudyAI01
5. **Root Directory:** `python-backend`
6. **Railway auto-detects Python and deploys**
7. **Get URL and update Vercel env variable**

---

## ✅ Verification Checklist

After deployment:

- [ ] Backend URL is live (visit `/health` endpoint)
- [ ] Vercel env variable updated with backend URL
- [ ] Frontend redeployed
- [ ] File upload works in AI Assistant
- [ ] AI can analyze uploaded documents

---

## 📝 Quick Commands

```bash
# Push changes
git add .
git commit -m "Deploy Python backend"
git push origin main

# Test backend locally (before deploying)
cd python-backend
pip install -r requirements.txt
python app.py
# Visit: http://localhost:5000/health

# Test with curl
curl https://studyai-backend.onrender.com/health
```

---

## 🎉 Success!

Once deployed, your AI Assistant will be able to:
- ✅ Process PDF files
- ✅ Process DOCX files
- ✅ Process PPTX files
- ✅ Process TXT files
- ✅ Extract text and analyze content
- ✅ Answer questions about uploaded documents

Your full-stack app is now complete and deployed! 🚀
