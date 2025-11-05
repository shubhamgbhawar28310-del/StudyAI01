import { createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from '@/hooks/useAuth';
import { signOut as authSignOut } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const authState = useAuthState();
  const navigate = useNavigate();
  const { toast } = useToast();

  const signOut = async () => {
    try {
      const result = await authSignOut();
      
      if (result.success) {
        // Clear any local storage data
        localStorage.removeItem('Aivy-theme');
        
        // Redirect to landing page
        navigate('/', { replace: true });
        
        toast({
          title: '✅ Signed Out',
          description: 'You have been successfully signed out.',
        });
      } else {
        toast({
          title: '❌ Sign Out Failed',
          description: result.error || 'Failed to sign out. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: '❌ Error',
        description: 'An unexpected error occurred while signing out.',
        variant: 'destructive',
      });
    }
  };

  const value = {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    initialized: authState.initialized,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
