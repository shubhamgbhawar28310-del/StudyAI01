# 🔄 Authentication Flow Diagrams

## 📊 Visual Guide to Auth Flows

---

## 1️⃣ Signup Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        USER VISITS /signup                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  PublicRoute checks if user is already logged in            │
│  - If logged in → Redirect to /dashboard                    │
│  - If not logged in → Show signup page                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  User fills form: Name, Email, Password, Confirm Password   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  User clicks "Create Account"                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend Validation (authService.ts)                        │
│  ✓ Email format valid?                                       │
│  ✓ Password strength (min 6 chars)?                          │
│  ✓ Passwords match?                                          │
│  ✓ Name provided?                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Check if email already exists (checkEmailExists)            │
│  - Try login with dummy password                             │
│  - Check error message                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                ┌────────┴────────┐
                │                 │
         Email exists?      Email available
                │                 │
                ▼                 ▼
    ┌──────────────────┐  ┌──────────────────────────────────┐
    │ Show error:      │  │ Call Supabase signUp()           │
    │ "Email already   │  │ - Create user account            │
    │  registered"     │  │ - Send verification email        │
    └──────────────────┘  └──────────┬───────────────────────┘
                                     │
                            ┌────────┴────────┐
                            │                 │
                  Email verification    Email verification
                      enabled?              disabled?
                            │                 │
                            ▼                 ▼
            ┌───────────────────────┐  ┌──────────────────┐
            │ Show success message: │  │ Auto-login user  │
            │ "Check your email"    │  │ Create session   │
            │                       │  │ Redirect to      │
            │ Redirect to /login    │  │ /dashboard       │
            └───────────────────────┘  └──────────────────┘
                            │
                            ▼
            ┌───────────────────────────────────────────────┐
            │ User checks email                             │
            │ Clicks verification link                      │
            └───────────────┬───────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────────────────────────┐
            │ Supabase validates token                      │
            │ Creates session                               │
            │ Redirects to /dashboard                       │
            └───────────────┬───────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────────────────────────┐
            │ onAuthStateChange detects SIGNED_IN event     │
            │ AuthContext updates user state                │
            │ User sees dashboard                           │
            └───────────────────────────────────────────────┘
```

---

## 2️⃣ Login Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        USER VISITS /login                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  PublicRoute checks if user is already logged in            │
│  - If logged in → Redirect to /dashboard                    │
│  - If not logged in → Show login page                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  User fills form: Email, Password                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  User clicks "Sign In"                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend Validation (authService.ts)                        │
│  ✓ Email format valid?                                       │
│  ✓ Password provided?                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Call Supabase signInWithPassword()                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                ┌────────┴────────┐
                │                 │
            Success?           Error?
                │                 │
                ▼                 ▼
    ┌──────────────────┐  ┌──────────────────────────────────┐
    │ Session created  │  │ Show user-friendly error:        │
    │ User logged in   │  │ - Invalid credentials            │
    │                  │  │ - Email not verified             │
    │ Show success     │  │ - Too many attempts              │
    │ toast            │  │ - Network error                  │
    └────────┬─────────┘  └──────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  onAuthStateChange detects SIGNED_IN event                   │
│  AuthContext updates user state                              │
└────────────────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  Check if there's a saved redirect URL                       │
│  - If yes → Redirect to saved URL                            │
│  - If no → Redirect to /dashboard                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 3️⃣ Password Reset Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User on /login page clicks "Forgot password?"              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  ForgotPasswordModal opens                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  User enters email address                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  User clicks "Send Reset Link"                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Validate email format                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Call Supabase resetPasswordForEmail()                       │
│  - Sends email with reset link                               │
│  - Link contains token                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Show success message: "Check your email"                    │
│  Modal shows confirmation                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  User checks email                                           │
│  Clicks reset link                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase validates token                                    │
│  Creates recovery session                                    │
│  Redirects to /reset-password                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  ResetPassword page checks for valid session                 │
│  - If valid → Show password form                             │
│  - If invalid → Show error, redirect to /login               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  User enters new password (twice)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Validate passwords match                                    │
│  Validate password strength                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Call Supabase updateUser({ password })                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Password updated successfully                               │
│  User is automatically logged in                             │
│  Show success message                                        │
│  Redirect to /dashboard                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 4️⃣ Session Persistence Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User opens app / refreshes page                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  App.tsx renders                                             │
│  AuthProvider initializes                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  useAuthState hook runs                                      │
│  - Sets loading = true                                       │
│  - Sets initialized = false                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Call supabase.auth.getSession()                             │
│  - Checks localStorage for session                           │
│  - Validates session token                                   │
│  - Refreshes token if needed                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                ┌────────┴────────┐
                │                 │
         Session found?      No session
                │                 │
                ▼                 ▼
    ┌──────────────────┐  ┌──────────────────┐
    │ Set user state   │  │ Set user = null  │
    │ Set session      │  │ Set session=null │
    └────────┬─────────┘  └────────┬─────────┘
             │                     │
             └──────────┬──────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Set loading = false                                         │
│  Set initialized = true                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Setup onAuthStateChange listener                            │
│  - Listens for SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED        │
│  - Updates user state on changes                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Route guards check auth state                               │
│  - ProtectedRoute: Redirect to /login if no user            │
│  - PublicRoute: Redirect to /dashboard if user exists       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Render appropriate page                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 5️⃣ Route Protection Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User tries to access /dashboard                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  ProtectedRoute component renders                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Get auth state from useAuth()                               │
│  - user                                                      │
│  - loading                                                   │
│  - initialized                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                ┌────────┴────────┐
                │                 │
         Not initialized     Initialized
         or loading?
                │                 │
                ▼                 ▼
    ┌──────────────────┐  ┌──────────────────────────────────┐
    │ Show loading     │  │ Check if user exists             │
    │ spinner          │  └────────┬─────────────────────────┘
    └──────────────────┘           │
                          ┌────────┴────────┐
                          │                 │
                    User exists?       No user?
                          │                 │
                          ▼                 ▼
              ┌──────────────────┐  ┌──────────────────────┐
              │ Render protected │  │ Save current URL     │
              │ page (Dashboard) │  │ Redirect to /login   │
              └──────────────────┘  │ with state.from      │
                                    └──────────────────────┘
```

---

## 6️⃣ OAuth (Google) Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User clicks "Continue with Google"                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Call signInWithOAuth('google')                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase redirects to Google OAuth                          │
│  - User sees Google login page                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  User logs in with Google                                    │
│  User approves permissions                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Google redirects back to app                                │
│  - URL contains auth code                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase exchanges code for session                         │
│  - Creates or updates user account                           │
│  - Creates session                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  onAuthStateChange detects SIGNED_IN                         │
│  AuthContext updates user state                              │
│  User is redirected to /dashboard                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 7️⃣ Sign Out Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User clicks "Sign Out" button                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Call signOut() from useAuth()                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Call authService.signOut()                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Call supabase.auth.signOut()                                │
│  - Invalidates session                                       │
│  - Clears localStorage                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  onAuthStateChange detects SIGNED_OUT                        │
│  AuthContext updates:                                        │
│  - user = null                                               │
│  - session = null                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Show success toast                                          │
│  Redirect to / (landing page)                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Takeaways

### 1. Centralized State Management
- All auth state managed in `AuthContext`
- Single source of truth
- No duplicate state

### 2. Proper Initialization
- `initialized` flag prevents premature rendering
- Loading states show during auth check
- No flashing of wrong content

### 3. Route Guards
- `ProtectedRoute` for authenticated pages
- `PublicRoute` for login/signup pages
- Automatic redirects

### 4. Service Layer
- All auth operations in `authService.ts`
- Validation before API calls
- User-friendly error messages

### 5. Session Persistence
- Automatic session storage
- Token auto-refresh
- Works across tabs and browser restarts

---

## 📚 Related Documentation

- **Implementation Details**: `AUTH_SYSTEM_DOCUMENTATION.md`
- **Quick Start**: `AUTH_QUICK_START.md`
- **Code Examples**: `AUTH_QUICK_REFERENCE.md`
- **Migration Guide**: `AUTH_MIGRATION_GUIDE.md`

---

**Last Updated:** November 2, 2025
