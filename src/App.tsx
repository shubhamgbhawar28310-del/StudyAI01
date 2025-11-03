import { Toaster } from '@/components/ui/sonner';
import { Toaster as ShadcnToaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StudyPlannerProvider } from '@/contexts/StudyPlannerContext';
import { ChatHistoryProvider } from '@/contexts/ChatHistoryContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/components/theme-provider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PublicRoute } from '@/components/PublicRoute';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import { GoogleCalendarCallback } from './pages/GoogleCalendarCallback';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="studyai-theme">
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <StudyPlannerProvider>
                <ChatHistoryProvider>
                  <Toaster />
                  <ShadcnToaster />
                  <Routes>
                    {/* Public routes - redirect to dashboard if logged in */}
                    <Route 
                      path="/" 
                      element={
                        <PublicRoute>
                          <LandingPage />
                        </PublicRoute>
                      } 
                    />
                    <Route 
                      path="/login" 
                      element={
                        <PublicRoute>
                          <Login />
                        </PublicRoute>
                      } 
                    />
                    <Route 
                      path="/signup" 
                      element={
                        <PublicRoute>
                          <Signup />
                        </PublicRoute>
                      } 
                    />
                    <Route 
                      path="/reset-password" 
                      element={<ResetPassword />} 
                    />
                    <Route 
                      path="/privacy-policy" 
                      element={<PrivacyPolicy />} 
                    />
                    
                    {/* OAuth callback route */}
                    <Route 
                      path="/auth/google/callback" 
                      element={
                        <ProtectedRoute>
                          <GoogleCalendarCallback />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Protected routes - require authentication */}
                    <Route 
                      path="/dashboard" 
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/home" 
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ChatHistoryProvider>
              </StudyPlannerProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;