# 🔧 Fix: Access Blocked - Google Verification

## The Issue

You're seeing:
```
Error 403: access_denied
studyAI has not completed the Google verification process
```

This is **normal for development**! Your OAuth app is in "Testing" mode, which means only approved test users can access it.

---

## ✅ Quick Fix (2 minutes)

### Step 1: Go to Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Select your project (StudyAI)

### Step 2: Add Test Users

1. Click **APIs & Services** in the left sidebar
2. Click **OAuth consent screen**
3. Scroll down to **Test users** section
4. Click **+ ADD USERS**
5. Enter your email: `kishanindrachand@gmail.com`
6. Click **SAVE**

### Step 3: Try Again

1. Go back to your app
2. Click "Connect Calendar" again
3. Sign in with `kishanindrachand@gmail.com`
4. It should work now! ✅

---

## Alternative: Publish the App (For Production)

If you want anyone to use it (not just test users), you need to publish the app:

### Option 1: Keep it in Testing Mode (Recommended for Now)

**Pros**:
- ✅ Quick setup
- ✅ Works immediately
- ✅ No verification needed
- ✅ Up to 100 test users

**Cons**:
- ⚠️ Only approved test users can connect
- ⚠️ Need to add each user manually

**Best for**: Development, personal use, small team

### Option 2: Publish to Production

**Steps**:
1. Go to **OAuth consent screen**
2. Click **PUBLISH APP**
3. Fill out required information:
   - App name
   - User support email
   - Developer contact email
   - Privacy policy URL (optional for internal use)
   - Terms of service URL (optional)
4. Submit for verification (takes 1-6 weeks)

**Pros**:
- ✅ Anyone can use it
- ✅ No user limits

**Cons**:
- ⚠️ Requires Google verification (1-6 weeks)
- ⚠️ Need privacy policy
- ⚠️ More documentation required

**Best for**: Public apps, production deployment

---

## 🎯 Recommended Approach

**For now (Development/Testing)**:
1. Add yourself as a test user (2 minutes)
2. Add any other users who need access
3. Keep app in "Testing" mode

**Later (Production)**:
1. Create privacy policy
2. Submit for Google verification
3. Publish the app

---

## Step-by-Step: Add Test User

### 1. Go to OAuth Consent Screen

https://console.cloud.google.com/apis/credentials/consent

### 2. Find Test Users Section

Scroll down to see:
```
┌─────────────────────────────────────┐
│ Test users                          │
│                                     │
│ [+ ADD USERS]                       │
│                                     │
│ No test users added yet             │
└─────────────────────────────────────┘
```

### 3. Click "+ ADD USERS"

### 4. Enter Email

```
┌─────────────────────────────────────┐
│ Add test users                      │
│                                     │
│ Email addresses                     │
│ ┌─────────────────────────────────┐ │
│ │ kishanindrachand@gmail.com      │ │
│ └─────────────────────────────────┘ │
│                                     │
│           [CANCEL]  [SAVE]          │
└─────────────────────────────────────┘
```

### 5. Click SAVE

You should now see:
```
┌─────────────────────────────────────┐
│ Test users                          │
│                                     │
│ [+ ADD USERS]                       │
│                                     │
│ kishanindrachand@gmail.com    [×]   │
└─────────────────────────────────────┘
```

---

## 🧪 Test Again

1. Go to your app: http://localhost:5173
2. Go to **Settings → Notifications**
3. Click **"Connect Calendar"**
4. Sign in with `kishanindrachand@gmail.com`
5. Grant permissions
6. Should work now! ✅

---

## Add More Test Users

You can add up to **100 test users** in Testing mode.

To add more users:
1. Go to OAuth consent screen
2. Click **+ ADD USERS** under Test users
3. Enter email addresses (one per line)
4. Click SAVE

---

## Troubleshooting

### Still Getting "Access Blocked"?

**Check**:
1. Email is added to test users list
2. Using the exact same email to sign in
3. OAuth consent screen is in "Testing" status
4. Try in incognito mode (clear cookies)

### "App is in Testing Mode" Warning

This is **normal**! The warning will show for all test users. Just click "Continue" or "Advanced" → "Go to StudyAI (unsafe)".

This warning disappears once you publish the app.

### Want to Remove the Warning?

You need to:
1. Publish the app
2. Complete Google verification
3. Wait 1-6 weeks for approval

**Or** just keep it in Testing mode - the warning is harmless for development!

---

## 📊 Testing vs Production

| Feature | Testing Mode | Production Mode |
|---------|--------------|-----------------|
| User Limit | 100 test users | Unlimited |
| Setup Time | 2 minutes | 1-6 weeks |
| Verification | Not required | Required |
| Warning Screen | Shows warning | No warning |
| Best For | Development | Public release |

---

## 🎯 Summary

**Right now**:
1. Go to Google Cloud Console
2. OAuth consent screen
3. Add test users
4. Add: `kishanindrachand@gmail.com`
5. Save
6. Try connecting again

**It will work immediately!** ✅

---

## 📝 For Production Later

When you're ready to publish:

1. **Create Privacy Policy** (required)
   - Explain what data you collect
   - How you use it
   - How users can delete their data

2. **Submit for Verification**
   - Fill out OAuth consent screen completely
   - Add privacy policy URL
   - Submit for review

3. **Wait for Approval** (1-6 weeks)
   - Google will review your app
   - May ask for additional information
   - Once approved, anyone can use it

---

**Add yourself as a test user now and try again! 🚀**
