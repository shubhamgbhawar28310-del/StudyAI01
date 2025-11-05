import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { FeatureCarousel } from "@/components/landing/FeatureCarousel";
import { useToast } from "@/hooks/use-toast";
import { signUp, signInWithOAuth } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, initialized } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Force light theme on signup page
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

  // Handle successful signup/login redirect
  useEffect(() => {
    if (initialized && user) {
      const from = (location.state as any)?.from || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, initialized, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "❌ Passwords Don't Match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.name,
      });

      if (result.success) {
        if (result.requiresEmailVerification) {
          // Email confirmation required
          toast({
            title: "✅ Account Created Successfully!",
            description: "Please check your email to verify your account. You may need to check your spam folder.",
            duration: 6000,
          });
          // Redirect to login after a delay
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
        } else {
          // Auto-login successful (email confirmation disabled)
          toast({
            title: "✅ Account Created Successfully!",
            description: "Welcome! Redirecting to your dashboard...",
          });
          // Navigation will be handled by the useEffect above
        }
      } else {
        toast({
          title: "❌ Signup Failed",
          description: result.error || "Failed to create account. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error('Signup exception:', err);
      toast({
        title: "❌ Connection Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithOAuth('google');
      
      if (!result.success) {
        toast({
          title: "❌ Google Signup Failed",
          description: result.error || "Failed to sign up with Google. Please try again.",
          variant: "destructive",
        });
      }
      // On success, OAuth will redirect automatically
    } catch (err: any) {
      console.error('Google signup exception:', err);
      toast({
        title: "❌ Connection Error",
        description: "Failed to connect to Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      
      {/* Feature Carousel - Left side */}
      <div className="w-full hidden md:block">
        <FeatureCarousel />
      </div>

      {/* Signup Form - Right side */}
      <div className="w-full flex flex-col items-center justify-center bg-background px-8">
        <form onSubmit={handleSubmit} className="md:w-96 w-80 flex flex-col items-center justify-center">
          <h2 className="text-4xl text-foreground font-medium">Sign up</h2>
          <p className="text-sm text-muted-foreground mt-3">Create your account to get started</p>

          <button 
            type="button" 
            onClick={handleGoogleSignup}
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
            <p className="w-full text-nowrap text-sm text-muted-foreground">or sign up with email</p>
            <div className="w-full h-px bg-border"></div>
          </div>

          <div className="flex items-center w-full bg-transparent border border-input h-12 rounded-full overflow-hidden pl-6 gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Full name" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="bg-transparent text-foreground placeholder-muted-foreground outline-none text-sm w-full h-full" 
              required 
            />                 
          </div>

          <div className="flex items-center mt-4 w-full bg-transparent border border-input h-12 rounded-full overflow-hidden pl-6 gap-2">
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

          <div className="flex items-center mt-4 w-full bg-transparent border border-input h-12 rounded-full overflow-hidden pl-6 gap-2">
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

          <div className="flex items-center mt-4 w-full bg-transparent border border-input h-12 rounded-full overflow-hidden pl-6 gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <input 
              type="password" 
              placeholder="Confirm password" 
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className="bg-transparent text-foreground placeholder-muted-foreground outline-none text-sm w-full h-full" 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-8 w-full h-11 rounded-full text-primary-foreground ai-gradient hover:opacity-90 transition-opacity font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
          
          <p className="text-muted-foreground text-sm mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;