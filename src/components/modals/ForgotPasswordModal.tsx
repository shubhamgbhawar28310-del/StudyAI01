import { useState } from 'react';
import { Mail, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { resetPassword } from '@/services/authService';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal = ({ isOpen, onClose }: ForgotPasswordModalProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await resetPassword(email);

      if (result.success) {
        setEmailSent(true);
        toast({
          title: '✅ Reset Email Sent',
          description: 'Check your email for password reset instructions.',
        });
      } else {
        toast({
          title: '❌ Failed to Send Email',
          description: result.error || 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setEmailSent(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-background rounded-2xl shadow-xl p-8 m-4">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!emailSent ? (
          <>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Forgot Password?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="flex items-center w-full bg-transparent border border-input h-12 rounded-full overflow-hidden pl-6 gap-2 mb-6">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent text-foreground placeholder-muted-foreground outline-none text-sm w-full h-full"
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-full text-primary-foreground ai-gradient hover:opacity-90 transition-opacity font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Check Your Email
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={handleClose}
                className="w-full h-11 rounded-full bg-muted hover:bg-muted/80 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
