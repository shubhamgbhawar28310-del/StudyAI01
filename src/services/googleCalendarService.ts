// Google Calendar Service
// Handles OAuth authentication and calendar sync operations

import { supabase } from '@/lib/supabase';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`;
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

export interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  reminders: {
    useDefault: false;
    overrides: Array<{
      method: 'popup' | 'email';
      minutes: number;
    }>;
  };
}

export const googleCalendarService = {
  // Initiate OAuth flow
  initiateOAuth() {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', GOOGLE_REDIRECT_URI);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', GOOGLE_SCOPES);
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    authUrl.searchParams.append('state', window.location.pathname); // Return to current page

    console.log('🚀 Initiating Google Calendar OAuth:', {
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      redirect_uri_length: GOOGLE_REDIRECT_URI.length,
      full_url: authUrl.toString()
    });

    // Open in popup
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      authUrl.toString(),
      'Google Calendar Authorization',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  },

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string, userId: string) {
    try {
      // Call Supabase Edge Function to securely exchange code
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { code, userId }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  },

  // Get user's Google Calendar connection status
  async getConnectionStatus(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('google_calendar_connected, google_calendar_email, google_calendar_token_expires_at')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      // Check if token is expired
      const isExpired = data.google_calendar_token_expires_at 
        ? new Date(data.google_calendar_token_expires_at) < new Date()
        : true;

      return {
        connected: data.google_calendar_connected && !isExpired,
        email: data.google_calendar_email,
        needsRefresh: isExpired && data.google_calendar_connected
      };
    } catch (error) {
      console.error('Error getting connection status:', error);
      return { connected: false, email: null, needsRefresh: false };
    }
  },

  // Disconnect Google Calendar
  async disconnect(userId: string) {
    try {
      // Clear tokens from database
      const { error } = await supabase
        .from('user_settings')
        .update({
          google_calendar_connected: false,
          google_calendar_email: null,
          google_calendar_token: null,
          google_calendar_refresh_token: null,
          google_calendar_token_expires_at: null
        })
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      throw error;
    }
  },

  // Create a calendar event
  async createEvent(userId: string, event: GoogleCalendarEvent) {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          userId,
          operation: 'create',
          event
        }
      });

      if (error) throw error;

      return data.eventId;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  },

  // Update a calendar event
  async updateEvent(userId: string, eventId: string, event: GoogleCalendarEvent) {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          userId,
          operation: 'update',
          eventId,
          event
        }
      });

      if (error) throw error;

      return data.eventId;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  },

  // Delete a calendar event
  async deleteEvent(userId: string, eventId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          userId,
          operation: 'delete',
          eventId
        }
      });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  },

  // Sync a study session to Google Calendar
  async syncStudySession(userId: string, session: any) {
    const event: GoogleCalendarEvent = {
      summary: `📚 ${session.title}`,
      description: session.description || 'Study session from Aivy',
      start: {
        dateTime: new Date(session.start_time).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: new Date(session.end_time).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 10 }
        ]
      }
    };

    if (session.google_event_id) {
      return await this.updateEvent(userId, session.google_event_id, event);
    } else {
      return await this.createEvent(userId, event);
    }
  },

  // Sync a task deadline to Google Calendar
  async syncTaskDeadline(userId: string, task: any) {
    const event: GoogleCalendarEvent = {
      summary: `✅ ${task.title}`,
      description: task.description || 'Task deadline from Aivy',
      start: {
        dateTime: new Date(task.deadline).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: new Date(new Date(task.deadline).getTime() + 60 * 60 * 1000).toISOString(), // +1 hour
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 10 },
          { method: 'popup', minutes: 60 } // 1 hour before
        ]
      }
    };

    if (task.google_event_id) {
      return await this.updateEvent(userId, task.google_event_id, event);
    } else {
      return await this.createEvent(userId, event);
    }
  },

  // Batch sync all unsynced events
  async syncAllEvents(userId: string) {
    try {
      console.log('🔄 Starting batch sync for user:', userId);
      
      const { data, error } = await supabase.functions.invoke('google-calendar-batch-sync', {
        body: { userId }
      });

      if (error) {
        console.error('Batch sync error:', error);
        throw error;
      }

      console.log('✅ Batch sync completed:', data);
      return data;
    } catch (error) {
      console.error('Error syncing all events:', error);
      throw error;
    }
  },

  // Get sync status for user
  async getSyncStatus(userId: string) {
    try {
      const { data: scheduleEvents, error: scheduleError } = await supabase
        .from('schedule_events')
        .select('id, synced_to_google, google_event_id')
        .eq('user_id', userId);

      if (scheduleError) throw scheduleError;

      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, synced_to_google, google_event_id')
        .eq('user_id', userId)
        .not('deadline', 'is', null);

      if (tasksError) throw tasksError;

      const { data: queueItems, error: queueError } = await supabase
        .from('google_calendar_sync_queue')
        .select('status')
        .eq('user_id', userId);

      if (queueError) throw queueError;

      const syncedEvents = scheduleEvents?.filter(e => e.synced_to_google && e.google_event_id).length || 0;
      const unsyncedEvents = scheduleEvents?.filter(e => !e.synced_to_google || !e.google_event_id).length || 0;
      const syncedTasks = tasks?.filter(t => t.synced_to_google && t.google_event_id).length || 0;
      const unsyncedTasks = tasks?.filter(t => !t.synced_to_google || !t.google_event_id).length || 0;
      const pendingInQueue = queueItems?.filter(q => q.status === 'pending').length || 0;
      const processingInQueue = queueItems?.filter(q => q.status === 'processing').length || 0;

      return {
        scheduleEvents: {
          synced: syncedEvents,
          unsynced: unsyncedEvents,
          total: scheduleEvents?.length || 0,
        },
        tasks: {
          synced: syncedTasks,
          unsynced: unsyncedTasks,
          total: tasks?.length || 0,
        },
        queue: {
          pending: pendingInQueue,
          processing: processingInQueue,
          total: queueItems?.length || 0,
        },
        totalSynced: syncedEvents + syncedTasks,
        totalUnsynced: unsyncedEvents + unsyncedTasks,
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      throw error;
    }
  }
};
