import { supabase } from '@/lib/supabase';
import { AuthError } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  requiresEmailVerification?: boolean;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email.trim().toLowerCase());
};

/**
 * Validates password strength
 */
export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long' };
  }
  if (password.length > 72) {
    return { valid: false, error: 'Password must be less than 72 characters' };
  }
  return { valid: true };
};

/**
 * Check if email already exists in the system
 * Note: This is a best-effort check. Supabase will ultimately handle duplicate prevention.
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  // Supabase doesn't provide a direct API to check email existence for security reasons
  // The signup API will handle duplicate detection and return appropriate errors
  // We'll skip the pre-check and let Supabase handle it during signup
  return false;
};

/**
 * Sign up a new user
 */
export const signUp = async (data: SignUpData): Promise<AuthResult> => {
  try {
    // Validate email
    if (!validateEmail(data.email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    // Validate password
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error };
    }

    // Validate name
    if (!data.fullName.trim()) {
      return { success: false, error: 'Please enter your full name' };
    }

    // Attempt signup - Supabase will handle duplicate email detection
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: data.fullName.trim(),
        },
      },
    });

    if (error) {
      return { success: false, error: getAuthErrorMessage(error) };
    }

    // Supabase behavior with email confirmation enabled:
    // - New user: Returns user object with identities array populated
    // - Duplicate: Returns user object but identities array is EMPTY
    if (authData.user) {
      // Check if this is a duplicate by looking at identities
      const hasIdentities = authData.user.identities && authData.user.identities.length > 0;
      
      if (!hasIdentities) {
        // No identities means this is a duplicate signup attempt
        return {
          success: false,
          error: 'This email is already registered. Please try logging in instead.',
        };
      }

      // Has identities - this is a new user
      if (!authData.session) {
        // Email confirmation required
        return {
          success: true,
          requiresEmailVerification: true,
        };
      }

      // Auto-login successful (email confirmation disabled)
      return {
        success: true,
        requiresEmailVerification: false,
      };
    }

    // Shouldn't reach here, but handle gracefully
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  } catch (error: any) {
    console.error('Signup error:', error);
    return {
      success: false,
      error: error?.message || 'An unexpected error occurred. Please try again.',
    };
  }
};

/**
 * Sign in an existing user
 */
export const signIn = async (data: SignInData): Promise<AuthResult> => {
  try {
    // Validate email
    if (!validateEmail(data.email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    // Validate password
    if (!data.password) {
      return { success: false, error: 'Please enter your password' };
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });

    if (error) {
      return { success: false, error: getAuthErrorMessage(error) };
    }

    if (!authData.session) {
      return { success: false, error: 'Failed to create session. Please try again.' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: error?.message || 'An unexpected error occurred. Please try again.',
    };
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<AuthResult> => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: getAuthErrorMessage(error) };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to sign out. Please try again.',
    };
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<AuthResult> => {
  try {
    if (!validateEmail(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    if (error) {
      return { success: false, error: getAuthErrorMessage(error) };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to send reset email. Please try again.',
    };
  }
};

/**
 * Update user password
 */
export const updatePassword = async (newPassword: string): Promise<AuthResult> => {
  try {
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: getAuthErrorMessage(error) };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Update password error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to update password. Please try again.',
    };
  }
};

/**
 * Sign in with OAuth provider (Google)
 */
export const signInWithOAuth = async (provider: 'google'): Promise<AuthResult> => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      return { success: false, error: getAuthErrorMessage(error) };
    }

    return { success: true };
  } catch (error: any) {
    console.error('OAuth sign in error:', error);
    return {
      success: false,
      error: error?.message || `Failed to sign in with ${provider}. Please try again.`,
    };
  }
};

/**
 * Get user-friendly error messages from Supabase auth errors
 */
const getAuthErrorMessage = (error: AuthError): string => {
  const message = error.message.toLowerCase();

  // Sign in errors
  if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }

  if (message.includes('email not confirmed')) {
    return 'Please verify your email address before logging in. Check your inbox for the verification link.';
  }

  if (message.includes('user not found')) {
    return 'No account found with this email. Please sign up first.';
  }

  // Sign up errors - check for various duplicate email messages
  if (
    message.includes('user already registered') || 
    message.includes('already exists') ||
    message.includes('already registered') ||
    message.includes('already been registered') ||
    message.includes('duplicate')
  ) {
    return 'This email is already registered. Please try logging in instead.';
  }

  if (message.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }

  if (message.includes('password')) {
    return error.message; // Keep original password error messages
  }

  // Rate limiting
  if (message.includes('too many requests') || message.includes('rate limit')) {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  // Default to original message if no match
  return error.message;
};
