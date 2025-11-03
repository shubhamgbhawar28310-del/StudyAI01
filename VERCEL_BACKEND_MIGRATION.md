# Vercel Backend Migration Guide

Your Python backend has been successfully configured for Vercel deployment!

## What Changed

1. **New Structure**: Created `api/index.py` - Vercel's serverless function entry point
2. **Updated vercel.json**: Configured for both Python backend and React frontend
3. **Added requirements.txt**: Root-level dependencies for Vercel Python runtime
4. **Added .vercelignore**: Excludes unnecessary files from deployment

## File Structure

```
project-root/
├── api/
│   └── index.py          # Vercel serverless function (Python backend)
├── python-backend/       # Original backend (kept for reference)
│   ├── src/
│   │   └── services/
│   │       └── document_service.py
│   └── app.py
├── src/                  # React frontend
├── requirements.txt      # Python dependencies
├── vercel.json          # Vercel configuration
└── .vercelignore        # Files to exclude from deployment
```

## Deployment Steps

### 1. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy to Vercel
```bash
vercel
```

For production deployment:
```bash
vercel --prod
```

### 4. Configure Environment Variables (if needed)
In your Vercel dashboard:
- Go to your project settings
- Navigate to "Environment Variables"
- Add any required variables (API keys, etc.)

## API Endpoints

After deployment, your backend will be available at:

- **Health Check**: `https://your-app.vercel.app/health`
- **Upload Document**: `https://your-app.vercel.app/api/documents/upload`
- **Analyze Text**: `https://your-app.vercel.app/api/documents/analyze-text`

## Update Frontend API URLs

Update your frontend code to use the new Vercel backend URL:

```typescript
// Before (Render)
const API_URL = 'https://your-render-app.onrender.com';

// After (Vercel)
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-app.vercel.app' 
  : 'http://localhost:5000';
```

## Key Differences from Render

1. **Serverless**: Functions run on-demand (no always-on server)
2. **Cold Starts**: First request may be slower (1-2 seconds)
3. **Timeout**: 60 seconds max per request (configurable in vercel.json)
4. **Memory**: 1024MB allocated (configurable in vercel.json)
5. **File Size**: 50MB limit for serverless functions

## Advantages of Vercel

✅ Faster deployments
✅ Better integration with frontend
✅ Automatic HTTPS
✅ Global CDN
✅ Zero configuration scaling
✅ Free tier includes serverless functions

## Testing Locally

To test the serverless function locally:

```bash
# Install Vercel CLI
npm install -g vercel

# Run locally
vercel dev
```

This will start both your frontend and backend locally.

## Troubleshooting

### Issue: Module not found
**Solution**: Ensure all dependencies are in `requirements.txt`

### Issue: Function timeout
**Solution**: Increase `maxDuration` in vercel.json (max 60s on free tier)

### Issue: File upload fails
**Solution**: Check file size limits and memory allocation

### Issue: Cold start delays
**Solution**: This is normal for serverless. Consider keeping functions warm with periodic health checks.

## Monitoring

View logs in Vercel dashboard:
1. Go to your project
2. Click on "Deployments"
3. Select a deployment
4. View "Functions" tab for logs

## Next Steps

1. Deploy to Vercel: `vercel --prod`
2. Update frontend API URLs
3. Test all endpoints
4. Monitor function performance
5. Consider upgrading Vercel plan if needed (for longer timeouts/more memory)

## Rollback Plan

If you need to rollback to Render:
1. Keep the `python-backend/` folder intact
2. Use the original `python-backend/app.py`
3. Redeploy to Render using the original configuration

---

**Note**: The original `python-backend/` folder is preserved for reference and can be removed once you confirm Vercel deployment works correctly.
