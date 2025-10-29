# 🚀 Quick Start Guide

## Start Both Servers

### Terminal 1 - Landing Page (Login/Signup)
```bash
cd "study-flow-ai-40-main"
npm run dev
```
**Runs on**: http://localhost:8080

### Terminal 2 - Main Website (Dashboard)
```bash
cd ".."
npm run dev
```
**Runs on**: http://localhost:5173

## Test Authentication

1. Go to http://localhost:8080
2. Click "Sign up" → Create account
3. Login with your credentials
4. ✅ Automatically redirected to http://localhost:5173
5. ✅ See your name/email in the sidebar
6. Click profile → "Logout" to sign out

## Key Files Modified

### Main Website
- ✅ `src/lib/supabase.ts` - NEW
- ✅ `src/contexts/AuthContext.tsx` - NEW
- ✅ `src/components/ProtectedRoute.tsx` - NEW
- ✅ `src/App.tsx` - UPDATED
- ✅ `src/components/DashboardSidebar.tsx` - UPDATED
- ✅ `.env` - UPDATED

### Landing Page
- ✅ `src/pages/Login.tsx` - UPDATED (redirects only)
- ✅ `src/pages/Signup.tsx` - UPDATED (redirects only)

## ✨ Features Working

- ✅ Email/Password login & signup
- ✅ Google OAuth (configured)
- ✅ Session persistence
- ✅ Protected routes
- ✅ User info in sidebar
- ✅ Logout functionality
- ✅ Auto-redirect after login

**No UI changes** to landing/login/signup pages! 🎨
