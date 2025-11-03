// Google Calendar Background Sync Worker
// Processes the sync queue and syncs events to Google Calendar

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
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get pending sync items
    const { data: queueItems, error: queueError } = await supabase
      .from('google_calendar_sync_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('retry_count', 3)
      .order('created_at', { ascending: true })
      .limit(50);

    if (queueError) {
      throw queueError;
    }

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each item
    for (const item of queueItems || []) {
      try {
        // Mark as processing
        await supabase
          .from('google_calendar_sync_queue')
          .update({ status: 'processing' })
          .eq('id', item.id);

        // Get user's Google Calendar token
        const { data: settings, error: settingsError } = await supabase
          .from('user_settings')
          .select('google_calendar_token, google_calendar_refresh_token, google_calendar_token_expires_at')
          .eq('user_id', item.user_id)
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
            .eq('user_id', item.user_id);
        }

        let googleEventId = null;

        // Perform the operation
        switch (item.operation) {
          case 'create': {
            const response = await fetch(
              'https://www.googleapis.com/calendar/v3/calendars/primary/events',
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(item.event_data),
              }
            );

            if (!response.ok) {
              const error = await response.text();
              throw new Error(`Failed to create event: ${error}`);
            }

            const result = await response.json();
            googleEventId = result.id;
            break;
          }

          case 'update': {
            // Get the google_event_id from the database
            const tableName = item.event_type === 'task' ? 'tasks' : 'schedule_events';
            const { data: eventData } = await supabase
              .from(tableName)
              .select('google_event_id')
              .eq('id', item.event_id)
              .single();

            if (!eventData?.google_event_id) {
              // If no google_event_id, create instead
              const response = await fetch(
                'https://www.googleapis.com/calendar/v3/calendars/primary/events',
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(item.event_data),
                }
              );

              if (!response.ok) {
                const error = await response.text();
                throw new Error(`Failed to create event: ${error}`);
              }

              const result = await response.json();
              googleEventId = result.id;
            } else {
              const response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventData.google_event_id}`,
                {
                  method: 'PATCH',
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(item.event_data),
                }
              );

              if (!response.ok) {
                const error = await response.text();
                throw new Error(`Failed to update event: ${error}`);
              }

              googleEventId = eventData.google_event_id;
            }
            break;
          }

          case 'delete': {
            const eventIdToDelete = item.event_data?.google_event_id;
            if (eventIdToDelete) {
              const response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventIdToDelete}`,
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
            }
            break;
          }
        }

        // Update the original event with google_event_id
        if (googleEventId && item.operation !== 'delete') {
          const tableName = item.event_type === 'task' ? 'tasks' : 'schedule_events';
          await supabase
            .from(tableName)
            .update({
              google_event_id: googleEventId,
              synced_to_google: true,
              last_synced_at: new Date().toISOString(),
            })
            .eq('id', item.event_id);
        }

        // Mark as completed
        await supabase
          .from('google_calendar_sync_queue')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        results.processed++;
      } catch (error) {
        console.error(`Error processing sync item ${item.id}:`, error);
        
        // Mark as failed and increment retry count
        await supabase
          .from('google_calendar_sync_queue')
          .update({
            status: 'failed',
            error_message: error.message,
            retry_count: item.retry_count + 1,
          })
          .eq('id', item.id);

        results.failed++;
        results.errors.push(`Item ${item.id}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in google-calendar-worker:', error);
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
