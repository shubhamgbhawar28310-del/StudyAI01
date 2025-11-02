import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface PublicRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export const PublicRoute = ({ children, redirectTo = '/dashboard' }: PublicRouteProps) => {
  const { user, loading, initialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect after auth is initialized
    if (initialized && !loading && user) {
      // Check if there's a saved redirect location
      const from = (location.state as any)?.from;
      const destination = from || redirectTo;
      
      // User is logged in, redirect to dashboard or saved location
      navigate(destination, { replace: true });
    }
  }, [user, loading, initialized, navigate, redirectTo, location]);

  // Show loading while checking auth state
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show public page if not logged in
  if (!user) {
    return <>{children}</>;
  }

  // Don't render anything while redirecting
  return null;
};
