// Google Calendar OAuth Callback Handler
// This page handles the OAuth redirect from Google

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { googleCalendarService } from '@/services/googleCalendarService';
import { useAuth } from '@/contexts/AuthContext';

export function GoogleCalendarCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting to Google Calendar...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const state = searchParams.get('state') || '/settings';

      if (error) {
        setStatus('error');
        setMessage('Authorization canceled or failed');
        
        // Notify parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'google-calendar-auth',
            success: false,
            error: error
          }, window.location.origin);
          window.close();
        } else {
          setTimeout(() => navigate(state), 2000);
        }
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received');
        setTimeout(() => navigate('/settings'), 2000);
        return;
      }

      if (!user) {
        setStatus('error');
        setMessage('User not authenticated');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Exchange code for tokens
      setMessage('Exchanging authorization code...');
      const result = await googleCalendarService.exchangeCodeForTokens(code, user.id);

      setStatus('success');
      setMessage(`Connected as ${result.email}`);

      // Notify parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'google-calendar-auth',
          success: true,
          email: result.email
        }, window.location.origin);
        
        // Close popup after 1 second
        setTimeout(() => window.close(), 1000);
      } else {
        // If not in popup, redirect to settings
        setTimeout(() => navigate(state), 2000);
      }
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to connect Google Calendar');

      // Notify parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'google-calendar-auth',
          success: false,
          error: error.message
        }, window.location.origin);
        setTimeout(() => window.close(), 2000);
      } else {
        setTimeout(() => navigate('/settings'), 2000);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4 p-8">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h2 className="text-xl font-semibold">{message}</h2>
            <p className="text-muted-foreground">Please wait...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold text-green-600">Success!</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">Redirecting...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold text-red-600">Connection Failed</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
}
