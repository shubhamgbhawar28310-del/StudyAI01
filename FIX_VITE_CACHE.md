# Fix Vite Cache Issue After Rebranding

## The Problem
After renaming files from StudyAI to Aivy, Vite's cache still references the old file names.

## Quick Fix

**Stop the dev server and run:**

```bash
# Delete Vite cache
rm -rf node_modules/.vite

# Or on Windows PowerShell:
Remove-Item -Recurse -Force node_modules/.vite

# Restart dev server
npm run dev
```

## Alternative: Full Clean

If the above doesn't work:

```bash
# Stop dev server (Ctrl+C)

# Clear all caches
rm -rf node_modules/.vite
rm -rf dist
rm -rf .next

# On Windows PowerShell:
Remove-Item -Recurse -Force node_modules/.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

# Restart
npm run dev
```

## What Was Fixed

1. ✅ Renamed `StudyAIAssistant.tsx` → `AivyAssistant.tsx`
2. ✅ Updated all imports to use `AivyAssistant`
3. ✅ Export statement is correct: `export { AivyAssistant as AIAssistant }`

## Verify It Works

After clearing cache and restarting:
1. App should load without errors
2. AI assistant should work normally
3. All "Aivy" branding should be visible

## If Still Having Issues

Check these files manually:
- `src/components/ai-assistant/AivyAssistant.tsx` - Should exist
- `src/components/features/AIAssistant.tsx` - Should import from AivyAssistant
- No file named `StudyAIAssistant.tsx` should exist

Run this to verify:
```bash
# Check if old file exists (should return nothing)
Get-ChildItem -Path src -Recurse -Filter "*StudyAI*"

# Check if new file exists (should find AivyAssistant.tsx)
Get-ChildItem -Path src -Recurse -Filter "*Aivy*"
```
