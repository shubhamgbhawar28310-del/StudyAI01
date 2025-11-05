// Google Calendar Batch Sync Function
// Syncs all existing unsynced events to Google Calendar
// Called after OAuth connection or manual sync trigger

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
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('Missing userId');
    }

    console.log('🔄 Starting batch sync for user:', userId);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user has Google Calendar connected
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('google_calendar_connected, google_calendar_token')
      .eq('user_id', userId)
      .single();

    if (settingsError || !settings) {
      throw new Error('User settings not found');
    }

    if (!settings.google_calendar_connected) {
      throw new Error('Google Calendar not connected');
    }

    // Get all unsynced schedule events
    const { data: scheduleEvents, error: scheduleError } = await supabase
      .from('schedule_events')
      .select('*')
      .eq('user_id', userId)
      .or('synced_to_google.is.null,synced_to_google.eq.false')
      .is('google_event_id', null);

    if (scheduleError) {
      console.error('Error fetching schedule events:', scheduleError);
      throw scheduleError;
    }

    // Get all unsynced tasks with deadlines
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .not('deadline', 'is', null)
      .or('synced_to_google.is.null,synced_to_google.eq.false')
      .is('google_event_id', null);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw tasksError;
    }

    const stats = {
      scheduleEvents: scheduleEvents?.length || 0,
      tasks: tasks?.length || 0,
      queued: 0,
      errors: [] as string[],
    };

    console.log('📊 Found unsynced items:', stats);

    // Queue schedule events for sync
    if (scheduleEvents && scheduleEvents.length > 0) {
      for (const event of scheduleEvents) {
        try {
          // Check for duplicates before inserting
          const { data: existing } = await supabase
            .from('google_calendar_sync_queue')
            .select('id')
            .eq('event_type', 'schedule_event')
            .eq('event_id', event.id)
            .single();

          if (existing) {
            console.log(`⏭️ Event ${event.id} already in queue, skipping`);
            continue;
          }

          const { error: queueError } = await supabase
            .from('google_calendar_sync_queue')
            .insert({
              user_id: userId,
              event_type: 'schedule_event',
              event_id: event.id,
              operation: 'create',
              event_data: {
                summary: `📚 ${event.title}`,
                description: event.description || 'Study session from StudyAI',
                start: {
                  dateTime: event.start_time,
                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                },
                end: {
                  dateTime: event.end_time,
                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                },
                reminders: {
                  useDefault: false,
                  overrides: [
                    { method: 'popup', minutes: 10 }
                  ],
                },
              },
            });

          if (queueError) {
            console.error(`Error queuing event ${event.id}:`, queueError);
            stats.errors.push(`Event ${event.title}: ${queueError.message}`);
          } else {
            stats.queued++;
          }
        } catch (error) {
          console.error(`Error processing event ${event.id}:`, error);
          stats.errors.push(`Event ${event.title}: ${error.message}`);
        }
      }
    }

    // Queue tasks for sync
    if (tasks && tasks.length > 0) {
      for (const task of tasks) {
        try {
          // Check for duplicates before inserting
          const { data: existing } = await supabase
            .from('google_calendar_sync_queue')
            .select('id')
            .eq('event_type', 'task')
            .eq('event_id', task.id)
            .single();

          if (existing) {
            console.log(`⏭️ Task ${task.id} already in queue, skipping`);
            continue;
          }

          const { error: queueError } = await supabase
            .from('google_calendar_sync_queue')
            .insert({
              user_id: userId,
              event_type: 'task',
              event_id: task.id,
              operation: 'create',
              event_data: {
                summary: `✅ ${task.title}`,
                description: task.description || 'Task deadline from StudyAI',
                start: {
                  dateTime: task.deadline,
                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                },
                end: {
                  dateTime: new Date(new Date(task.deadline).getTime() + 60 * 60 * 1000).toISOString(),
                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                },
                reminders: {
                  useDefault: false,
                  overrides: [
                    { method: 'popup', minutes: 10 },
                    { method: 'popup', minutes: 60 }
                  ],
                },
              },
            });

          if (queueError) {
            console.error(`Error queuing task ${task.id}:`, queueError);
            stats.errors.push(`Task ${task.title}: ${queueError.message}`);
          } else {
            stats.queued++;
          }
        } catch (error) {
          console.error(`Error processing task ${task.id}:`, error);
          stats.errors.push(`Task ${task.title}: ${error.message}`);
        }
      }
    }

    // Trigger the worker to process the queue
    if (stats.queued > 0) {
      console.log('🚀 Triggering worker to process queue...');
      try {
        await supabase.functions.invoke('google-calendar-worker');
      } catch (workerError) {
        console.error('Error invoking worker:', workerError);
        // Don't fail the whole operation if worker invocation fails
        // The worker can be triggered manually or via cron
      }
    }

    console.log('✅ Batch sync completed:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        message: `Queued ${stats.queued} events for sync`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in google-calendar-batch-sync:', error);
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
