// Google Calendar OAuth Token Exchange
// Securely exchanges authorization code for access tokens

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code, userId } = await req.json();

    if (!code || !userId) {
      throw new Error('Missing code or userId');
    }

    // Exchange code for tokens
    // IMPORTANT: redirect_uri must EXACTLY match what was used in the initial OAuth request
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI') || 'http://localhost:5173/auth/google/callback';
    
    console.log('🔍 Token exchange attempt:', {
      client_id: Deno.env.get('GOOGLE_CLIENT_ID'),
      redirect_uri: redirectUri,
      redirect_uri_length: redirectUri.length,
      redirect_uri_trimmed: redirectUri.trim(),
      has_code: !!code,
      code_length: code?.length,
      has_secret: !!Deno.env.get('GOOGLE_CLIENT_SECRET'),
      env_redirect_uri: Deno.env.get('GOOGLE_REDIRECT_URI'),
      all_env_keys: Object.keys(Deno.env.toObject())
    });
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: Deno.env.get('GOOGLE_CLIENT_ID') || '',
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error
      });
      throw new Error(`Token exchange failed (${tokenResponse.status}): ${error}`);
    }

    const tokens = await tokenResponse.json();

    // Get user email from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userInfo = await userInfoResponse.json();

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Store tokens in Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: updateError } = await supabase
      .from('user_settings')
      .update({
        google_calendar_connected: true,
        google_calendar_email: userInfo.email,
        google_calendar_token: tokens.access_token,
        google_calendar_refresh_token: tokens.refresh_token,
        google_calendar_token_expires_at: expiresAt.toISOString(),
        google_calendar_last_sync: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        email: userInfo.email,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in google-calendar-auth:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
