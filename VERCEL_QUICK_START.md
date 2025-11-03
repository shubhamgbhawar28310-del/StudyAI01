# 🚀 Vercel Quick Start

## Deploy in 3 Commands

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
```

## What You Get

✅ Frontend + Backend on same domain
✅ Automatic HTTPS
✅ Global CDN
✅ Serverless Python functions
✅ Free tier (100GB bandwidth/month)

## Your Endpoints

After deployment:
- **App**: `https://your-app.vercel.app`
- **Health**: `https://your-app.vercel.app/health`
- **Upload**: `https://your-app.vercel.app/api/documents/upload`

## Local Development

```bash
# Option 1: Separate processes
cd python-backend && python app.py  # Terminal 1
npm run dev                          # Terminal 2

# Option 2: Vercel dev (simulates production)
vercel dev
```

## Environment Variables

Add in Vercel Dashboard → Settings → Environment Variables:
- `VITE_GOOGLE_AI_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

(No need for `VITE_API_URL` - same domain!)

## Files Changed

- ✅ `api/index.py` - Serverless function
- ✅ `vercel.json` - Configuration
- ✅ `requirements.txt` - Python deps
- ✅ `src/services/api.ts` - Smart URL detection

## Need Help?

- 📖 Full guide: `VERCEL_MIGRATION_COMPLETE.md`
- 📖 Deploy guide: `DEPLOY_TO_VERCEL.md`
- 🌐 Vercel docs: https://vercel.com/docs

---

**Ready?** Run: `vercel --prod`
