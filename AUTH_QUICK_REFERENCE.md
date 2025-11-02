# 🚀 Auth System Quick Reference Card

## 📦 Import Statements

```typescript
// Auth Context
import { useAuth } from '@/contexts/AuthContext';

// Auth Service
import { 
  signUp, 
  signIn, 
  signOut, 
  resetPassword, 
  updatePassword,
  signInWithOAuth,
  validateEmail,
  validatePassword,
  checkEmailExists
} from '@/services/authService';

// Route Guards
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PublicRoute } from '@/components/PublicRoute';
```

---

## 🎣 useAuth Hook

```typescript
const { 
  user,         // User | null
  session,      // Session | null
  loading,      // boolean
  initialized,  // boolean
  signOut       // () => Promise<void>
} = useAuth();
```

### Examples

```typescript
// Check if user is logged in
if (user) {
  console.log('Logged in as:', user.email);
}

// Wait for auth to initialize
if (!initialized || loading) {
  return <Spinner />;
}

// Sign out
await signOut();
```

---

## 🔐 Auth Service Functions

### Sign Up
```typescript
const result = await signUp({
  email: 'user@example.com',
  password: 'password123',
  fullName: 'John Doe'
});

if (result.success) {
  if (result.requiresEmailVerification) {
    // Show "check your email" message
  } else {
    // User is auto-logged in
  }
} else {
  // Show error: result.error
}
```

### Sign In
```typescript
const result = await signIn({
  email: 'user@example.com',
  password: 'password123'
});

if (result.success) {
  // User is logged in
} else {
  // Show error: result.error
}
```

### Sign Out
```typescript
const result = await signOut();

if (result.success) {
  // User is logged out
} else {
  // Show error: result.error
}
```

### Reset Password (Send Email)
```typescript
const result = await resetPassword('user@example.com');

if (result.success) {
  // Email sent
} else {
  // Show error: result.error
}
```

### Update Password
```typescript
const result = await updatePassword('newPassword123');

if (result.success) {
  // Password updated
} else {
  // Show error: result.error
}
```

### OAuth Sign In
```typescript
const result = await signInWithOAuth('google');

if (result.success) {
  // Redirecting to Google...
} else {
  // Show error: result.error
}
```

### Validate Email
```typescript
const isValid = validateEmail('user@example.com');
// Returns: boolean
```

### Validate Password
```typescript
const { valid, error } = validatePassword('password123');

if (valid) {
  // Password is valid
} else {
  // Show error message
}
```

### Check Email Exists
```typescript
const exists = await checkEmailExists('user@example.com');

if (exists) {
  // Email is already registered
} else {
  // Email is available
}
```

---

## 🛡️ Route Guards

### Protected Route
```typescript
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

### Public Route
```typescript
<Route 
  path="/login" 
  element={
    <PublicRoute>
      <Login />
    </PublicRoute>
  } 
/>
```

---

## 🎨 Common Patterns

### Show Content Only When Logged In
```typescript
function MyComponent() {
  const { user, loading, initialized } = useAuth();
  
  if (!initialized || loading) {
    return <Spinner />;
  }
  
  if (!user) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome {user.email}</div>;
}
```

### Conditional Rendering Based on Auth
```typescript
function Header() {
  const { user } = useAuth();
  
  return (
    <header>
      {user ? (
        <UserMenu user={user} />
      ) : (
        <LoginButton />
      )}
    </header>
  );
}
```

### Form with Auth Service
```typescript
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await signIn({ email, password });
    
    if (result.success) {
      toast({ title: 'Success!', description: 'Logged in' });
    } else {
      toast({ 
        title: 'Error', 
        description: result.error,
        variant: 'destructive'
      });
    }
    
    setLoading(false);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input 
        type="password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Loading...' : 'Sign In'}
      </button>
    </form>
  );
}
```

---

## 🔧 Configuration

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Supabase Client
```typescript
// src/lib/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

---

## 🎯 Common Use Cases

### Redirect After Login
```typescript
// In Login component
const location = useLocation();
const navigate = useNavigate();

useEffect(() => {
  if (user) {
    const from = (location.state as any)?.from || '/dashboard';
    navigate(from, { replace: true });
  }
}, [user]);
```

### Show User Profile
```typescript
function UserProfile() {
  const { user } = useAuth();
  
  return (
    <div>
      <p>Email: {user?.email}</p>
      <p>Name: {user?.user_metadata?.full_name}</p>
      <p>ID: {user?.id}</p>
    </div>
  );
}
```

### Logout Button
```typescript
function LogoutButton() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const handleLogout = async () => {
    setLoading(true);
    await signOut();
    setLoading(false);
  };
  
  return (
    <button onClick={handleLogout} disabled={loading}>
      {loading ? 'Logging out...' : 'Logout'}
    </button>
  );
}
```

---

## 🐛 Error Handling

### Auth Service Errors
```typescript
const result = await signIn({ email, password });

if (!result.success) {
  // result.error contains user-friendly message
  switch (result.error) {
    case 'Invalid email or password...':
      // Handle invalid credentials
      break;
    case 'Please verify your email...':
      // Handle unverified email
      break;
    default:
      // Handle other errors
  }
}
```

### Try-Catch Pattern
```typescript
try {
  const result = await signIn({ email, password });
  
  if (result.success) {
    // Success
  } else {
    // Show result.error
  }
} catch (error) {
  // Handle unexpected errors
  console.error('Unexpected error:', error);
}
```

---

## 📋 Validation

### Email Validation
```typescript
if (!validateEmail(email)) {
  toast({
    title: 'Invalid Email',
    description: 'Please enter a valid email address',
    variant: 'destructive'
  });
  return;
}
```

### Password Validation
```typescript
const { valid, error } = validatePassword(password);

if (!valid) {
  toast({
    title: 'Invalid Password',
    description: error,
    variant: 'destructive'
  });
  return;
}
```

### Passwords Match
```typescript
if (password !== confirmPassword) {
  toast({
    title: 'Passwords Don\'t Match',
    description: 'Please make sure both passwords are identical',
    variant: 'destructive'
  });
  return;
}
```

---

## 🎨 Loading States

### Button Loading State
```typescript
<button 
  type="submit" 
  disabled={isLoading}
  className="..."
>
  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
  {isLoading ? 'Loading...' : 'Submit'}
</button>
```

### Page Loading State
```typescript
function MyPage() {
  const { loading, initialized } = useAuth();
  
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }
  
  return <div>Page content</div>;
}
```

---

## 🔗 Useful Links

- **Full Documentation**: `AUTH_SYSTEM_DOCUMENTATION.md`
- **Quick Start**: `AUTH_QUICK_START.md`
- **Migration Guide**: `AUTH_MIGRATION_GUIDE.md`
- **Complete Summary**: `AUTH_REFACTOR_COMPLETE.md`

---

## 💡 Tips

1. **Always check `initialized`** before rendering auth-dependent content
2. **Use `loading` state** to show spinners during operations
3. **Handle errors gracefully** with user-friendly messages
4. **Validate input** before calling auth service
5. **Use route guards** for protected pages
6. **Clear error messages** help users fix issues
7. **Test all flows** before deploying

---

**Quick Reference Version:** 1.0.0  
**Last Updated:** November 2, 2025
