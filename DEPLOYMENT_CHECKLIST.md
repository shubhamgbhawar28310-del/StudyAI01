# ✅ Deployment Checklist

## Pre-Deployment
- [ ] Code is committed to GitHub
- [ ] All environment variables are documented in `.env.example`
- [ ] Backend dependencies are in `python-backend/requirements.txt`
- [ ] Frontend builds successfully locally: `npm run build`

## Backend Deployment (Render/Railway)

### Render Option
- [ ] Created account on [Render.com](https://render.com)
- [ ] Created new Web Service
- [ ] Connected GitHub repository
- [ ] Set root directory to `python-backend`
- [ ] Set build command: `pip install -r requirements.txt`
- [ ] Set start command: `gunicorn app:app`
- [ ] Deployment completed successfully
- [ ] Copied backend URL: `_______________________________`
- [ ] Tested health endpoint: `https://your-backend.onrender.com/health`
- [ ] Health check returns: `{"status": "OK", "message": "Python Document Processing Backend is running"}`

### Railway Option (Alternative)
- [ ] Created account on [Railway.app](https://railway.app)
- [ ] Created new project from GitHub
- [ ] Set root directory to `python-backend`
- [ ] Deployment completed successfully
- [ ] Copied backend URL: `_______________________________`
- [ ] Tested health endpoint

## Vercel Environment Variables

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

- [ ] `VITE_SUPABASE_URL` = `_______________________________`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` = `_______________________________`
- [ ] `VITE_GOOGLE_AI_API_KEY` = `_______________________________`
- [ ] `VITE_API_URL` = `https://your-backend.onrender.com/api` ⚠️ Must end with `/api`

## Vercel Redeployment
- [ ] Went to Vercel Dashboard → Deployments
- [ ] Clicked "Redeploy" on latest deployment
- [ ] Build completed successfully
- [ ] No build errors in logs
- [ ] Deployment is live at: `_______________________________`

## Post-Deployment Testing

### Backend Tests
- [ ] Health endpoint works: `https://your-backend.onrender.com/health`
- [ ] Returns proper JSON response
- [ ] No 502 errors (waited 1-2 min for cold start if needed)

### Frontend Tests
- [ ] Website loads without errors
- [ ] No console errors in browser DevTools
- [ ] Login/Signup works
- [ ] Dashboard loads

### AI Assistant Tests
- [ ] AI Assistant page loads
- [ ] Can send text messages
- [ ] AI responds to queries
- [ ] Can upload documents (PDF/PPTX/DOCX)
- [ ] Document processing works
- [ ] AI analyzes uploaded documents correctly

### Feature Tests
- [ ] Task creation works
- [ ] Flashcard generation works
- [ ] Study plan creation works
- [ ] Pomodoro timer works
- [ ] Data syncs to Supabase
- [ ] Data persists after refresh

## Troubleshooting (If Issues Found)

### Backend Issues
- [ ] Checked Render/Railway logs for errors
- [ ] Verified `requirements.txt` has all dependencies
- [ ] Confirmed `gunicorn` is in `requirements.txt`
- [ ] Waited 1-2 minutes for cold start

### Frontend Issues
- [ ] Checked browser console for errors
- [ ] Verified all environment variables are set in Vercel
- [ ] Confirmed `VITE_API_URL` ends with `/api`
- [ ] Checked Vercel deployment logs

### CORS Issues
- [ ] Verified backend URL is correct
- [ ] Checked backend CORS configuration in `app.py`
- [ ] Ensured no typos in `VITE_API_URL`

### AI Issues
- [ ] Verified `VITE_GOOGLE_AI_API_KEY` is set
- [ ] Checked API key is valid
- [ ] Tested with simple query first

## Final Verification
- [ ] All features work as expected
- [ ] No errors in browser console
- [ ] No errors in Vercel logs
- [ ] No errors in backend logs
- [ ] Performance is acceptable
- [ ] Mobile view works (if applicable)

## Documentation Updates
- [ ] Updated README.md with live URLs
- [ ] Documented any deployment-specific notes
- [ ] Saved backend URL for future reference
- [ ] Saved Vercel URL for sharing

## 🎉 Deployment Complete!

**Live URLs:**
- Frontend: `_______________________________`
- Backend: `_______________________________`

**Date Deployed:** `_______________________________`

**Notes:**
```
Add any deployment notes or issues encountered here
```

---

## Quick Reference

**Backend Health Check:**
```bash
curl https://your-backend.onrender.com/health
```

**Redeploy Frontend:**
1. Vercel Dashboard → Deployments → Redeploy

**Redeploy Backend:**
1. Render: Manual Deploy → Deploy latest commit
2. Railway: Automatically deploys on git push

**View Logs:**
- Vercel: Dashboard → Deployments → Click deployment → View logs
- Render: Dashboard → Your service → Logs tab
- Railway: Dashboard → Your service → Deployments → View logs
