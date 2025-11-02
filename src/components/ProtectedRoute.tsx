import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, initialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect after auth is initialized and we're sure there's no user
    if (initialized && !loading && !user) {
      // Save the attempted URL to redirect back after login
      const from = location.pathname + location.search;
      navigate('/login', { 
        replace: true,
        state: { from: from !== '/login' ? from : '/dashboard' }
      });
    }
  }, [user, loading, initialized, navigate, location]);

  // Show loading while checking auth state
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!user) {
    return null;
  }

  return <>{children}</>;
};
