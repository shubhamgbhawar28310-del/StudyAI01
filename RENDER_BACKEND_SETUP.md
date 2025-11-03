# Render Backend Setup Guide

## ✅ Your Configuration

**Backend URL**: `https://studyai01-2.onrender.com`
**API Endpoint**: `https://studyai01-2.onrender.com/api`

## 🚀 Quick Setup

### 1. Verify Render Backend is Running

Check if your backend is active:
```bash
curl https://studyai01-2.onrender.com/health
```

Should return:
```json
{
  "status": "OK",
  "message": "Python Document Processing Backend is running"
}
```

### 2. Update Vercel Environment Variable

1. Go to https://vercel.com/dashboard
2. Select your **StudyAI** project
3. Click **Settings** → **Environment Variables**
4. Update or add:
   ```
   VITE_API_URL=https://studyai01-2.onrender.com/api
   ```
5. Click **Save**

### 3. Redeploy Vercel

After updating the environment variable:
```bash
# Option 1: Trigger redeploy via dashboard
# Go to Deployments → Click "..." → Redeploy

# Option 2: Push a small change
git commit --allow-empty -m "Trigger redeploy with Render backend"
git push origin main
```

## 🧪 Test After Deployment

1. **Health Check**
   ```bash
   curl https://studyai01-2.onrender.com/health
   ```

2. **Upload Test** (from your app)
   - Go to your StudyAI app
   - Upload a document
   - Should work with files up to 50 MB

## 📋 Render Backend Configuration

Your `python-backend/` folder has everything needed:

```
python-backend/
├── app.py                    # Main Flask app
├── requirements.txt          # Dependencies
├── Procfile                  # Render start command
├── render.yaml              # Render configuration
└── src/
    └── services/
        └── document_service.py
```

### If Backend Needs Redeployment

1. Go to https://dashboard.render.com
2. Find your **studyai-backend** service
3. Click **Manual Deploy** → **Deploy latest commit**

Or update from GitHub:
```bash
cd python-backend
git add .
git commit -m "Update backend"
git push origin main
```

Render will auto-deploy if connected to GitHub.

## 🔍 Troubleshooting

### Backend Not Responding?
- Check Render dashboard for service status
- Render free tier spins down after inactivity
- First request may take 30-60 seconds (cold start)

### CORS Errors?
- Backend already has CORS enabled
- Check that `VITE_API_URL` is set correctly in Vercel

### Upload Fails?
- Check file size (max 50 MB)
- Check Render logs for errors
- Verify backend is running

## 💰 Cost

**Render Free Tier:**
- ✅ 750 hours/month free
- ✅ Spins down after 15 min inactivity
- ✅ 512 MB RAM
- ✅ Perfect for your use case

**Vercel Free Tier:**
- ✅ Frontend hosting
- ✅ Unlimited bandwidth (100 GB)
- ✅ Automatic deployments

**Total Cost: $0/month** 🎉

## 📊 Architecture

```
User Browser
    ↓
Vercel (Frontend)
    ↓ API calls to https://studyai01-2.onrender.com/api
Render (Backend)
    ↓
Document Processing
```

## ✅ Advantages of This Setup

1. **Free**: Both services have generous free tiers
2. **Scalable**: Can upgrade either service independently
3. **Reliable**: Render handles large files better than Vercel free tier
4. **Simple**: No complex configuration needed

## 🎯 Final Checklist

- [ ] Render backend is running
- [ ] `VITE_API_URL` set in Vercel to `https://studyai01-2.onrender.com/api`
- [ ] Vercel redeployed with new environment variable
- [ ] Test document upload with large file
- [ ] Verify health endpoint responds

---

**You're all set!** Your frontend is on Vercel, backend is on Render, and large files will work perfectly. 🚀
