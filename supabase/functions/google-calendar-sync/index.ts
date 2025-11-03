// Google Calendar Sync Function
// Handles create, update, and delete operations for calendar events

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
    const { userId, operation, eventId, event } = await req.json();

    if (!userId || !operation) {
      throw new Error('Missing required parameters');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user's Google Calendar token
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('google_calendar_token, google_calendar_refresh_token, google_calendar_token_expires_at')
      .eq('user_id', userId)
      .single();

    if (settingsError || !settings) {
      throw new Error('User settings not found');
    }

    // Check if token is expired and refresh if needed
    let accessToken = settings.google_calendar_token;
    const expiresAt = new Date(settings.google_calendar_token_expires_at);
    
    if (expiresAt < new Date()) {
      // Refresh token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID'),
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET'),
          refresh_token: settings.google_calendar_refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh token');
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      // Update token in database
      const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000);
      await supabase
        .from('user_settings')
        .update({
          google_calendar_token: accessToken,
          google_calendar_token_expires_at: newExpiresAt.toISOString(),
        })
        .eq('user_id', userId);
    }

    let result;

    // Perform the requested operation
    switch (operation) {
      case 'create': {
        const response = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to create event: ${error}`);
        }

        result = await response.json();
        break;
      }

      case 'update': {
        if (!eventId) {
          throw new Error('Event ID required for update');
        }

        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to update event: ${error}`);
        }

        result = await response.json();
        break;
      }

      case 'delete': {
        if (!eventId) {
          throw new Error('Event ID required for delete');
        }

        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok && response.status !== 404) {
          const error = await response.text();
          throw new Error(`Failed to delete event: ${error}`);
        }

        result = { deleted: true };
        break;
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        eventId: result.id || eventId,
        result,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in google-calendar-sync:', error);
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
