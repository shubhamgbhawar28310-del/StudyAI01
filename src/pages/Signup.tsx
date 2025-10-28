import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { FeatureCarousel } from "@/components/landing/FeatureCarousel";
import { useToast } from "@/hooks/use-toast";


const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Do NOT automatically redirect if user is already logged in
    // This prevents redirect loops - user chose to visit signup page
    
    // Only listen for NEW sign in events from this page
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Small delay to ensure session is properly set
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match!",
        variant: "destructive",
      });
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    // Validate name is provided
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin + '/dashboard',
          data: {
            full_name: formData.name,
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        
        // Provide specific error messages based on error code
        let errorMessage = error.message;
        
        if (error.message.toLowerCase().includes('already registered') || 
            error.message.toLowerCase().includes('already exists')) {
          errorMessage = "This email is already registered. Please try logging in instead.";
        } else if (error.message.toLowerCase().includes('invalid email')) {
          errorMessage = "Please enter a valid email address.";
        } else if (error.message.toLowerCase().includes('password')) {
          errorMessage = error.message; // Keep original password error message
        } else if (error.message.toLowerCase().includes('network') || 
                   error.message.toLowerCase().includes('fetch')) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        }
        
        toast({
          title: "Signup Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Check if email confirmation is required
      if (data?.user && !data.session) {
        // Email confirmation required
        console.log('Signup success - email confirmation required:', data);
        toast({
          title: "✅ Account Created Successfully!",
          description: "Please check your email to verify your account. You may need to check your spam folder.",
        });
        // Optionally redirect to a confirmation page or login
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      } else if (data?.session) {
        // Auto-login successful (email confirmation disabled)
        console.log('Signup success - auto-logged in:', data);
        toast({
          title: "✅ Account Created Successfully!",
          description: "Welcome! Redirecting to your dashboard...",
        });
        // The auth state change listener will handle navigation
      } else {
        // Unexpected response
        console.log('Signup success - unexpected response:', data);
        toast({
          title: "✅ Account Created!",
          description: "Your account has been created. Please try logging in.",
        });
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    } catch (err: any) {
      console.error('Signup exception:', err);
      
      let errorMessage = "Failed to connect to authentication service. Please check your internet connection and try again.";
      
      if (err?.message) {
        errorMessage = err.message;
      }
      
      toast({
        title: "❌ Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });
      
      if (error) {
        console.error('Error signing up with Google:', error.message);
        toast({
          title: "❌ Google Signup Failed",
          description: error.message || "Failed to sign up with Google. Please try again.",
          variant: "destructive",
        });
      }
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