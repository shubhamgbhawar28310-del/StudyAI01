import { useState, useEffect } from "react";
import { Menu, X, LogOut, GraduationCap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Logged out successfully!",
      });
      navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200">
              <GraduationCap className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ stroke: 'url(#gradient)' }} />
              <svg width="0" height="0">
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgb(37, 99, 235)" />
                    <stop offset="100%" stopColor="rgb(147, 51, 234)" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                StudyAI
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-all duration-200 font-medium">
              Features
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-all duration-200 font-medium">
              How it Works
            </a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-all duration-200 font-medium">
              FAQ
            </a>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Log In</Link>
                </Button>
                <Button className="ai-gradient text-white font-medium ai-glow-soft hover:ai-glow transition-all duration-300" asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-foreground"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-3 bg-background border-t border-border">
              <a href="#features" className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-all duration-200 font-medium">
                Features
              </a>
              <a href="#how-it-works" className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-all duration-200 font-medium">
                How it Works
              </a>
              <a href="#faq" className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-all duration-200 font-medium">
                FAQ
              </a>
              <div className="flex flex-col space-y-2 px-3 pt-2">
                {user ? (
                  <>
                    <span className="text-sm text-muted-foreground px-3 py-2">{user.email}</span>
                    <Button 
                      variant="ghost" 
                      onClick={handleLogout}
                      className="text-muted-foreground hover:text-foreground justify-start"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Log Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="justify-start" asChild>
                      <Link to="/login">Log In</Link>
                    </Button>
                    <Button className="ai-gradient text-white font-medium ai-glow-soft hover:ai-glow transition-all duration-300 justify-start" asChild>
                      <Link to="/signup">Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;