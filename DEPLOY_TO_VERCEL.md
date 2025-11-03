# Quick Deploy to Vercel

## Prerequisites
- Node.js installed
- Vercel account (free tier works!)

## Step-by-Step Deployment

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```
Follow the prompts to authenticate.

### 3. Deploy Your App
From your project root directory:

```bash
vercel
```

This will:
- Detect your project settings
- Ask a few configuration questions
- Deploy your app to a preview URL

### 4. Deploy to Production
Once you've tested the preview:

```bash
vercel --prod
```

## Configuration Questions

When you run `vercel` for the first time, you'll be asked:

1. **Set up and deploy?** → Yes
2. **Which scope?** → Select your account
3. **Link to existing project?** → No (first time)
4. **Project name?** → Press Enter (uses folder name) or type a custom name
5. **Directory with code?** → Press Enter (current directory)
6. **Override settings?** → No

## What Gets Deployed

✅ **Frontend**: Your React app (from `src/`)
✅ **Backend**: Python serverless functions (from `api/`)
✅ **Static Assets**: Everything in `public/`

## After Deployment

You'll get a URL like: `https://your-app.vercel.app`

### Test Your Endpoints

```bash
# Health check
curl https://your-app.vercel.app/health

# Upload test (replace with your URL)
curl -X POST https://your-app.vercel.app/api/documents/upload \
  -F "file=@test.pdf"
```

## Update Frontend API URL

After deployment, update your frontend to use the Vercel backend:

1. Find where you define your API URL (usually in a config file or service)
2. Update it to:

```typescript
const API_URL = import.meta.env.PROD 
  ? '' // Empty string uses same domain
  : 'http://localhost:5000'; // Local development
```

Or if you want to be explicit:

```typescript
const API_URL = import.meta.env.PROD 
  ? 'https://your-app.vercel.app'
  : 'http://localhost:5000';
```

## Environment Variables

If you need to add environment variables:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add your variables (e.g., API keys)

## Automatic Deployments

Once connected to Git:
- Push to `main` branch → Deploys to production
- Push to other branches → Creates preview deployments

## Troubleshooting

### Python function not working?
- Check logs in Vercel dashboard
- Ensure all dependencies are in `requirements.txt`
- Verify Python version (3.11 specified in vercel.json)

### Frontend not loading?
- Check build logs
- Ensure `dist` folder is created during build
- Verify `vercel-build` script in package.json

### CORS errors?
- Backend already has CORS enabled
- Check if frontend is using correct API URL

## Local Testing

Test the full setup locally before deploying:

```bash
vercel dev
```

This runs both frontend and backend locally, simulating Vercel's environment.

## Monitoring

View logs and analytics:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Deployments" to see deployment history
4. Click "Functions" to see serverless function logs

## Cost

Free tier includes:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless functions (100GB-hours)
- ✅ Automatic HTTPS
- ✅ Global CDN

Perfect for your study app!

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Python on Vercel: https://vercel.com/docs/functions/serverless-functions/runtimes/python
- Support: https://vercel.com/support

---

**Ready to deploy?** Just run: `vercel`
