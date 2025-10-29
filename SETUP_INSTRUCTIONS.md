# Signup Setup Instructions

## Issue Fixed
The signup page wasn't creating accounts properly. The following fixes have been implemented:

### Changes Made:
1. **Added Password Validation** - Minimum 6 characters required
2. **Added Name Validation** - Full name is now required
3. **Fixed Navigation Logic** - Properly handles both email confirmation and auto-login scenarios
4. **Improved Error Handling** - Better error messages and user feedback
5. **Added Proper Redirects** - Users are redirected to login or dashboard based on email confirmation settings

## Setup Required

### 1. Create Environment File
Create a `.env` file in the root directory with your Supabase credentials:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### 2. Get Supabase Credentials
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon/public key** → Use as `VITE_SUPABASE_PUBLISHABLE_KEY`

### 3. Configure Supabase Authentication

#### Enable Email Authentication:
1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email confirmation settings:
   - **Disable** email confirmation for instant signup (recommended for development)
   - **Enable** email confirmation for production (more secure)

#### Optional - Enable Google OAuth:
1. Go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials

### 4. Test the Signup Flow

#### Scenario 1: Email Confirmation Disabled (Development)
- User signs up → Account created → Auto-logged in → Redirected to dashboard

#### Scenario 2: Email Confirmation Enabled (Production)
- User signs up → Account created → Email sent → User redirected to login → User verifies email → Can log in

## How It Works Now

### Validation Checks:
- ✅ Name must not be empty
- ✅ Email must be valid format
- ✅ Password must be at least 6 characters
- ✅ Passwords must match

### Success Flow:
1. Form validates all fields
2. Calls Supabase `signUp` API
3. Handles three scenarios:
   - **Email confirmation required**: Shows success message, redirects to login after 2 seconds
   - **Auto-login**: Shows success message, auth listener redirects to dashboard
   - **Unexpected response**: Shows success message, redirects to login

### Error Handling:
- Shows specific error messages from Supabase
- Handles network errors gracefully
- Prevents form submission during loading

## Troubleshooting

### "Missing Supabase environment variables" Error
- Make sure `.env` file exists in the root directory
- Check that variable names match exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Restart the development server after creating `.env`

### "Invalid login credentials" Error
- This means Supabase is not configured or credentials are wrong
- Double-check your Supabase project URL and anon key
- Ensure your Supabase project is active

### Signup Succeeds but No Redirect
- Check browser console for errors
- Verify email confirmation settings in Supabase
- Check that the auth state change listener is working

### Email Not Received
- Check spam folder
- Verify email provider is configured in Supabase
- Check Supabase logs for email delivery status
