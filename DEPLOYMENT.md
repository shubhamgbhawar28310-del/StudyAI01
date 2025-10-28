# 🚀 Deployment Guide - StudyAI

This guide will help you deploy StudyAI to various hosting platforms.

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ Supabase account and project set up
- ✅ Google Gemini API key
- ✅ All environment variables configured
- ✅ Database migrations run on Supabase

## 🌐 Hosting Options

### Option 1: Vercel (Recommended for Frontend)

**Frontend Deployment:**

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables** in Vercel Dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_GOOGLE_AI_API_KEY`
   - `VITE_API_URL` (if using separate backend)

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Option 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**
   ```bash
   netlify login
   ```

3. **Initialize**
   ```bash
   netlify init
   ```

4. **Build Command:** `npm run build`
5. **Publish Directory:** `dist`

6. **Set Environment Variables** in Netlify Dashboard

### Option 3: Railway (Full-Stack)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   railway init
   ```

4. **Deploy**
   ```bash
   railway up
   ```

### Option 4: Render

1. Go to [Render Dashboard](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run preview`
   - **Environment:** Node
5. Add environment variables

## 🐍 Python Backend Deployment

### Deploy Python Backend to Render

1. Create `render.yaml` in `python-backend/`:
   ```yaml
   services:
     - type: web
       name: studyai-backend
       env: python
       buildCommand: pip install -r requirements.txt
       startCommand: gunicorn app:app
   ```

2. Add `gunicorn` to `requirements.txt`:
   ```
   gunicorn==21.2.0
   ```

3. Deploy via Render Dashboard

### Deploy to Railway

```bash
cd python-backend
railway up
```

## 🔧 Environment Variables Setup

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_GOOGLE_AI_API_KEY=your-gemini-api-key
VITE_API_URL=https://your-backend-url.com/api
```

### Backend (python-backend/.env)
```env
FLASK_ENV=production
ALLOWED_ORIGINS=https://your-frontend-url.com
```

## 📊 Database Setup

1. **Run Migrations on Supabase:**
   - Go to Supabase Dashboard → SQL Editor
   - Run all migration files from `supabase/migrations/`

2. **Enable Row Level Security:**
   - Ensure RLS is enabled on all tables
   - Verify policies are in place

## ✅ Pre-Deployment Checklist

- [ ] All environment variables are set
- [ ] Database migrations are run
- [ ] `.env` file is NOT committed (check `.gitignore`)
- [ ] Build succeeds locally: `npm run build`
- [ ] All dependencies are in `package.json`
- [ ] Python backend requirements are in `requirements.txt`
- [ ] CORS is configured for production URLs
- [ ] API keys are secured

## 🔒 Security Best Practices

1. **Never commit `.env` files**
2. **Use environment variables** for all sensitive data
3. **Enable CORS** only for your frontend domain
4. **Use HTTPS** in production
5. **Keep dependencies updated**
6. **Enable Supabase RLS** on all tables

## 🐛 Troubleshooting

### Build Fails
- Check Node version (requires 18+)
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Environment Variables Not Working
- Ensure variables start with `VITE_` for Vite
- Restart dev server after changing `.env`

### Database Connection Issues
- Verify Supabase URL and keys
- Check if migrations are run
- Verify RLS policies

### CORS Errors
- Update backend CORS settings
- Check `VITE_API_URL` matches backend URL

## 📱 Post-Deployment

1. **Test all features:**
   - Authentication (email & Google)
   - Data sync
   - AI assistant
   - File uploads

2. **Monitor:**
   - Check error logs
   - Monitor API usage
   - Track user feedback

3. **Update DNS** (if using custom domain)

## 🎉 Success!

Your StudyAI app should now be live! Share the URL and start studying smarter.

For issues, check the main `README.md` or documentation files.
