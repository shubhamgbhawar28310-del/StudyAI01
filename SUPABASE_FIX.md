# ⚠️ CRITICAL: Supabase Credentials Mismatch

## Problem Detected
Your Supabase URL and API key are from **different projects**:
- URL: `wcedcqkedhaioymmmuwg.supabase.co`
- API Key: For project `crdqpioymuvnzhtgrenj`

This is why signup isn't working!

## Fix Instructions

### Option 1: Use Project `wcedcqkedhaioymmmuwg` (Current URL)
1. Go to https://app.supabase.com
2. Select project: `wcedcqkedhaioymmmuwg`
3. Go to Settings → API
4. Copy the **anon/public** key
5. Replace `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env` with this key

### Option 2: Use Project `crdqpioymuvnzhtgrenj` (Current Key)
1. Go to https://app.supabase.com
2. Select project: `crdqpioymuvnzhtgrenj`
3. Go to Settings → API
4. Copy the **Project URL**
5. Replace `VITE_SUPABASE_URL` in `.env` with this URL

## Which Project Should You Use?

Check which project has:
- ✅ Email authentication enabled
- ✅ Your app configured
- ✅ Any existing user data you want to keep

## After Fixing:
1. Save the `.env` file
2. Restart the dev server (Ctrl+C, then `npm run dev`)
3. Try signing up again

The credentials MUST be from the same Supabase project!
