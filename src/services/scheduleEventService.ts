import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

// Check if Google Calendar integration is available and configured
const isGoogleCalendarAvailable = () => {
  return !!(
    import.meta.env.VITE_GOOGLE_CLIENT_ID && 
    import.meta.env.VITE_GOOGLE_REDIRECT_URI
  );
};

// Check if user has Google Calendar sync enabled (check for OAuth tokens or sync queue activity)
const checkGoogleCalendarSyncStatus = async (userId: string) => {
  try {
    // Check if there are any recent sync queue entries for this user
    const { data, error } = await supabase
      .from('google_calendar_sync_queue')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    
    if (error) {
      console.log('Could not check Google Calendar sync status:', error);
      return false;
    }
    
    // If there are sync queue entries, Google Calendar is likely connected
    return data && data.length > 0;
  } catch (error) {
    console.log('Error checking Google Calendar sync status:', error);
    return false;
  }
};

export interface ScheduleEventData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type?: string;
  color?: string;
  taskId?: string;
}

export const scheduleEventService = {
  async createEvent(eventData: ScheduleEventData) {
    try {
      console.log('🚀 Starting event creation...');
      
      // 1. Get current user with detailed logging
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ Authentication error:', authError);
        toast({
          title: 'Authentication Error',
          description: 'Please log in to create events',
          variant: 'destructive'
        });
        throw new Error('User not authenticated');
      }
      
      console.log('✅ User authenticated:', user.id);
      console.log('📧 User email:', user.email);

      // 2. Prepare event data with proper field mapping
      const eventPayload = {
        id: crypto.randomUUID(), // Generate UUID
        user_id: user.id, // Use authenticated user ID
        title: eventData.title,
        description: eventData.description || null,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        type: eventData.type || 'study',
        color: eventData.color || null,
        task_id: eventData.taskId || null,
        status: 'scheduled',
        missed_count: 0,
        synced_to_google: false,
        created_at: new Date().toISOString()
      };

      console.log('📤 Sending event data:', eventPayload);

      // 3. Insert into Supabase with detailed error handling
      const { data, error } = await supabase
        .from('schedule_events')
        .insert(eventPayload)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Specific error handling
        if (error.code === '42501') {
          toast({
            title: 'Permission Error',
            description: 'You do not have permission to create events. Please check your account.',
            variant: 'destructive'
          });
        } else if (error.code === '23505') {
          toast({
            title: 'Duplicate Event',
            description: 'An event with this ID already exists.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Save Failed',
            description: `Failed to save event: ${error.message}`,
            variant: 'destructive'
          });
        }
        throw error;
      }

      console.log('✅ Event saved successfully:', data);
      
      // Show appropriate success message based on Google Calendar availability and user sync status
      const hasGoogleCalendar = isGoogleCalendarAvailable();
      const hasGoogleSync = hasGoogleCalendar ? await checkGoogleCalendarSyncStatus(user.id) : false;
      
      toast({
        title: 'Event Created',
        description: hasGoogleSync 
          ? 'Your study session has been saved and will sync to Google Calendar'
          : 'Your study session has been saved successfully',
      });

      return data;
    } catch (error) {
      console.error('❌ Error creating event:', error);
      throw error;
    }
  },

  async updateEvent(eventId: string, eventData: Partial<ScheduleEventData>) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const updatePayload = {
        title: eventData.title,
        description: eventData.description,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        type: eventData.type,
        color: eventData.color,
        task_id: eventData.taskId,
        synced_to_google: false // Mark for re-sync
      };

      const { data, error } = await supabase
        .from('schedule_events')
        .update(updatePayload)
        .eq('id', eventId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Update error:', error);
        toast({
          title: 'Update Failed',
          description: error.message,
          variant: 'destructive'
        });
        throw error;
      }

      const hasGoogleCalendar = isGoogleCalendarAvailable();
      const hasGoogleSync = hasGoogleCalendar ? await checkGoogleCalendarSyncStatus(user.id) : false;
      
      toast({
        title: 'Event Updated',
        description: hasGoogleSync 
          ? 'Changes will sync to Google Calendar'
          : 'Event updated successfully',
      });

      return data;
    } catch (error) {
      console.error('❌ Error updating event:', error);
      throw error;
    }
  },

  async deleteEvent(eventId: string) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('schedule_events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Delete error:', error);
        toast({
          title: 'Delete Failed',
          description: error.message,
          variant: 'destructive'
        });
        throw error;
      }

      const hasGoogleCalendar = isGoogleCalendarAvailable();
      const hasGoogleSync = hasGoogleCalendar ? await checkGoogleCalendarSyncStatus(user.id) : false;
      
      toast({
        title: 'Event Deleted',
        description: hasGoogleSync 
          ? 'Event removed and will be deleted from Google Calendar'
          : 'Event deleted successfully',
      });

      return true;
    } catch (error) {
      console.error('❌ Error deleting event:', error);
      throw error;
    }
  },

  // Debug function to test authentication
  async debugAuth() {
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('🔍 Debug Auth Results:');
    console.log('Current user:', user);
    console.log('Auth error:', error);
    console.log('User ID:', user?.id);
    console.log('User email:', user?.email);
    return { user, error };
  }
};