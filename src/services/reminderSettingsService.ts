// Reminder Settings Service
// Manages user notification preferences in Supabase

import { supabase } from '@/lib/supabase';

export interface ReminderSettings {
  enable_study_reminders: boolean;
  enable_task_reminders: boolean;
  reminder_time: number;
  enable_email_alerts: boolean;
  enable_achievement_notifications: boolean;
  enable_weekly_reports: boolean;
  google_calendar_connected: boolean;
}

export const reminderSettingsService = {
  // Get user's reminder settings
  async getReminderSettings(userId: string): Promise<ReminderSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .select(`
        enable_study_reminders,
        enable_task_reminders,
        reminder_time,
        enable_email_alerts,
        enable_achievement_notifications,
        enable_weekly_reports,
        google_calendar_connected
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching reminder settings:', error);
      return null;
    }

    return data;
  },

  // Update reminder settings
  async updateReminderSettings(
    userId: string,
    settings: Partial<ReminderSettings>
  ) {
    const { error } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating reminder settings:', error);
      throw error;
    }

    return true;
  },

  // Get upcoming events with alerts
  async getUpcomingEvents(userId: string) {
    const { data, error } = await supabase.rpc('get_user_upcoming_events', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error fetching upcoming events:', error);
      return [];
    }

    return data;
  },

  // Connect Google Calendar
  async connectGoogleCalendar(userId: string, token: string, refreshToken: string) {
    const { error } = await supabase
      .from('user_settings')
      .update({
        google_calendar_connected: true,
        google_calendar_token: token,
        google_calendar_refresh_token: refreshToken,
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error connecting Google Calendar:', error);
      throw error;
    }

    return true;
  },

  // Disconnect Google Calendar
  async disconnectGoogleCalendar(userId: string) {
    const { error } = await supabase
      .from('user_settings')
      .update({
        google_calendar_connected: false,
        google_calendar_token: null,
        google_calendar_refresh_token: null,
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error disconnecting Google Calendar:', error);
      throw error;
    }

    return true;
  },
};
