import { supabase } from '@/lib/supabase'

export interface Feedback {
  id: string
  user_id: string | null
  feedback_type: 'bug' | 'suggestion' | 'general'
  message: string
  email: string | null
  status: 'new' | 'reviewed' | 'resolved' | 'archived'
  created_at: string
  updated_at: string
}

export interface FeedbackSubmission {
  feedback_type: 'bug' | 'suggestion' | 'general'
  message: string
  email?: string
}

/**
 * Submit user feedback
 */
export async function submitFeedback(feedback: FeedbackSubmission): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('user_feedback')
      .insert({
        user_id: user?.id || null,
        feedback_type: feedback.feedback_type,
        message: feedback.message.trim(),
        email: feedback.email?.trim() || null,
        status: 'new'
      })

    if (error) {
      console.error('Error submitting feedback:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return { success: false, error: 'Failed to submit feedback' }
  }
}

/**
 * Get all feedback for the current user
 */
export async function getUserFeedback(): Promise<Feedback[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return []

    const { data, error } = await supabase
      .from('user_feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user feedback:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching user feedback:', error)
    return []
  }
}

/**
 * Get all feedback (admin only - you'll need to add admin check)
 */
export async function getAllFeedback(): Promise<Feedback[]> {
  try {
    const { data, error } = await supabase
      .from('user_feedback')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all feedback:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching all feedback:', error)
    return []
  }
}

/**
 * Update feedback status (admin only)
 */
export async function updateFeedbackStatus(
  feedbackId: string, 
  status: 'new' | 'reviewed' | 'resolved' | 'archived'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_feedback')
      .update({ status })
      .eq('id', feedbackId)

    if (error) {
      console.error('Error updating feedback status:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating feedback status:', error)
    return { success: false, error: 'Failed to update feedback status' }
  }
}

/**
 * Get feedback statistics
 */
export async function getFeedbackStats(): Promise<{
  total: number
  byType: { bug: number; suggestion: number; general: number }
  byStatus: { new: number; reviewed: number; resolved: number; archived: number }
}> {
  try {
    const { data, error } = await supabase
      .from('user_feedback')
      .select('feedback_type, status')

    if (error) {
      console.error('Error fetching feedback stats:', error)
      return {
        total: 0,
        byType: { bug: 0, suggestion: 0, general: 0 },
        byStatus: { new: 0, reviewed: 0, resolved: 0, archived: 0 }
      }
    }

    const stats = {
      total: data.length,
      byType: { bug: 0, suggestion: 0, general: 0 },
      byStatus: { new: 0, reviewed: 0, resolved: 0, archived: 0 }
    }

    data.forEach(item => {
      stats.byType[item.feedback_type as keyof typeof stats.byType]++
      stats.byStatus[item.status as keyof typeof stats.byStatus]++
    })

    return stats
  } catch (error) {
    console.error('Error fetching feedback stats:', error)
    return {
      total: 0,
      byType: { bug: 0, suggestion: 0, general: 0 },
      byStatus: { new: 0, reviewed: 0, resolved: 0, archived: 0 }
    }
  }
}
