import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Loader2 } from "lucide-react";
import { FeatureCarousel } from "@/components/landing/FeatureCarousel";
import { useToast } from "@/hooks/use-toast";
import { signIn, signInWithOAuth } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { ForgotPasswordModal } from "@/components/modals/ForgotPasswordModal";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, initialized } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    // Force light theme on login page
    const root = document.documentElement;
    root.classList.remove('dark');
    
    return () => {
      // Restore previous theme when leaving
      const savedTheme = localStorage.getItem('Aivy-theme');
      if (savedTheme === 'dark') {
        root.classList.add('dark');
      }
    };
  }, []);

  // Handle successful login redirect
  useEffect(() => {
    if (initialized && user) {
      const from = (location.state as any)?.from || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, initialized, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn({
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        toast({
          title: "✅ Welcome Back!",
          description: "Logged in successfully! Redirecting to your dashboard...",
        });
        // Navigation will be handled by the useEffect above
      } else {
        toast({
          title: "❌ Login Failed",
          description: result.error || "Failed to log in. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error('Login exception:', err);
      toast({
        title: "❌ Connection Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithOAuth('google');
      
      if (!result.success) {
        toast({
          title: "❌ Google Login Failed",
          description: result.error || "Failed to login with Google. Please try again.",
          variant: "destructive",
        });
      }
      // On success, OAuth will redirect automatically
    } catch (err: any) {
      console.error('Google login exception:', err);
      toast({
        title: "❌ Connection Error",
        description: "Failed to connect to Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <ForgotPasswordModal 
        isOpen={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)} 
      />
      
      <div className="min-h-screen flex">
        
        {/* Feature Carousel - Left side */}
        <div className="w-full hidden md:block">
          <FeatureCarousel />
        </div>

      {/* Login Form - Right side */}
      <div className="w-full flex flex-col items-center justify-center bg-background px-8">
        <form onSubmit={handleSubmit} className="md:w-96 w-80 flex flex-col items-center justify-center">
          <h2 className="text-4xl text-foreground font-medium">Sign in</h2>
          <p className="text-sm text-muted-foreground mt-3">Welcome back! Please sign in to continue</p>

          <button 
            type="button" 
            onClick={handleGoogleLogin}
            className="w-full mt-8 bg-muted hover:bg-muted/80 flex items-center justify-center h-14 rounded-full transition-colors gap-3"
          >
            <img 
              src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/googleLogo.svg" 
              alt="Google Logo" 
              className="w-6 h-6"
            />
            <span className="text-foreground font-medium">Continue with Google</span>
          </button>

          <div className="flex items-center gap-4 w-full my-5">
            <div className="w-full h-px bg-border"></div>
            <p className="w-full text-nowrap text-sm text-muted-foreground">or sign in with email</p>
            <div className="w-full h-px bg-border"></div>
          </div>

          <div className="flex items-center w-full bg-transparent border border-input h-12 rounded-full overflow-hidden pl-6 gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <input 
              type="email" 
              placeholder="Email address" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="bg-transparent text-foreground placeholder-muted-foreground outline-none text-sm w-full h-full" 
              required 
            />                 
          </div>

          <div className="flex items-center mt-6 w-full bg-transparent border border-input h-12 rounded-full overflow-hidden pl-6 gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <input 
              type="password" 
              placeholder="Password" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="bg-transparent text-foreground placeholder-muted-foreground outline-none text-sm w-full h-full" 
              required 
            />
          </div>

          <div className="w-full flex items-center justify-between mt-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <input 
                className="h-4 w-4 accent-primary" 
                type="checkbox" 
                id="rememberMe"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({...formData, rememberMe: e.target.checked})}
              />
              <label className="text-sm" htmlFor="rememberMe">Remember me</label>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-8 w-full h-11 rounded-full text-primary-foreground ai-gradient hover:opacity-90 transition-opacity font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
          
          <p className="text-muted-foreground text-sm mt-4">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </form>
      </div>
      </div>
    </>
  );
};

export default Login;