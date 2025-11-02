import { supabase } from '@/lib/supabase';

export interface UserSettings {
  id?: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  theme: 'light' | 'dark' | 'system';
  language: string;
  daily_study_goal: number;
  pomodoro_length: number;
  break_length: number;
  auto_start_breaks: boolean;
  study_reminders: boolean;
  task_deadlines: boolean;
  achievements: boolean;
  weekly_report: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch user settings from Supabase
 */
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no settings exist, return null (will be created)
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return null;
  }
}

/**
 * Create or update user settings
 */
export async function upsertUserSettings(settings: Partial<UserSettings> & { user_id: string }): Promise<UserSettings | null> {
  try {
    // Prepare the data object with only the fields we want to save
    const dataToSave = {
      user_id: settings.user_id,
      display_name: settings.display_name,
      email: settings.email,
      theme: settings.theme,
      language: settings.language,
      daily_study_goal: settings.daily_study_goal,
      pomodoro_length: settings.pomodoro_length,
      break_length: settings.break_length,
      auto_start_breaks: settings.auto_start_breaks,
      study_reminders: settings.study_reminders,
      task_deadlines: settings.task_deadlines,
      achievements: settings.achievements,
      weekly_report: settings.weekly_report
    };

    // Try upsert first
    let { data, error } = await supabase
      .from('user_settings')
      .upsert(dataToSave, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    // If schema cache error, try alternative approach
    if (error && error.message?.includes('schema cache')) {
      console.log('Schema cache error detected, trying alternative approach...');
      
      // Try to update first
      const { data: updateData, error: updateError } = await supabase
        .from('user_settings')
        .update(dataToSave)
        .eq('user_id', settings.user_id)
        .select()
        .single();

      if (updateError && updateError.code === 'PGRST116') {
        // Record doesn't exist, try insert
        const { data: insertData, error: insertError } = await supabase
          .from('user_settings')
          .insert(dataToSave)
          .select()
          .single();

        if (insertError) throw insertError;
        return insertData;
      }

      if (updateError) throw updateError;
      return updateData;
    }

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error upserting user settings:', error);
    throw error;
  }
}

/**
 * Initialize default settings for a new user
 */
export async function initializeUserSettings(userId: string, email: string, displayName?: string): Promise<UserSettings> {
  const defaultSettings: Partial<UserSettings> & { user_id: string } = {
    user_id: userId,
    email,
    display_name: displayName || email.split('@')[0],
    theme: 'system',
    language: 'English',
    daily_study_goal: 4,
    pomodoro_length: 25,
    break_length: 5,
    auto_start_breaks: true,
    study_reminders: false,
    task_deadlines: false,
    achievements: false,
    weekly_report: false,
  };

  const result = await upsertUserSettings(defaultSettings);
  if (!result) {
    throw new Error('Failed to initialize user settings');
  }
  return result;
}

/**
 * Export user data for download
 */
export async function exportUserData(userId: string): Promise<any> {
  try {
    // Fetch all user data
    const [settings, tasks, materials, sessions] = await Promise.all([
      supabase.from('user_settings').select('*').eq('user_id', userId).single(),
      supabase.from('tasks').select('*').eq('user_id', userId),
      supabase.from('materials').select('*').eq('user_id', userId),
      supabase.from('study_sessions').select('*').eq('user_id', userId),
    ]);

    return {
      exported_at: new Date().toISOString(),
      user_id: userId,
      settings: settings.data,
      tasks: tasks.data || [],
      materials: materials.data || [],
      study_sessions: sessions.data || [],
    };
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw error;
  }
}

/**
 * Change user password
 */
export async function changePassword(newPassword: string): Promise<void> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
}

/**
 * Delete user account and all associated data
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  try {
    // Delete user data (cascade will handle related records)
    const { error: settingsError } = await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', userId);

    if (settingsError) throw settingsError;

    // Sign out the user
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
}
