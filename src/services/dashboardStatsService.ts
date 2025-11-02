import { supabase } from '@/lib/supabase';

export interface DashboardStats {
  completionRate: number;
  completedTasks: number;
  totalTasks: number;
  sessionsToday: number;
  level: number;
  xp: number;
  currentStreak: number;
  materialsCount: number;
}

/**
 * Fetch dashboard statistics from Supabase
 */
export async function fetchDashboardStats(userId: string): Promise<DashboardStats> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Fetch tasks for today
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, completed')
      .eq('user_id', userId);

    if (tasksError) throw tasksError;

    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.completed).length || 0;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Fetch study sessions for today
    const { data: sessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('id, completed')
      .eq('user_id', userId)
      .gte('created_at', todayISO)
      .eq('completed', true);

    if (sessionsError) throw sessionsError;

    const sessionsToday = sessions?.length || 0;

    // Fetch XP and calculate level
    const { data: xpData, error: xpError } = await supabase
      .from('user_xp')
      .select('total_xp')
      .eq('user_id', userId)
      .single();

    if (xpError && xpError.code !== 'PGRST116') throw xpError; // PGRST116 = no rows

    const xp = xpData?.total_xp || 0;
    const level = calculateLevel(xp);

    // Fetch streak (consecutive days with at least 1 session)
    const streak = await calculateStreak(userId);

    // Fetch materials count
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (materialsError) throw materialsError;

    const materialsCount = materials || 0;

    return {
      completionRate,
      completedTasks,
      totalTasks,
      sessionsToday,
      level,
      xp,
      currentStreak: streak,
      materialsCount,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return default values on error
    return {
      completionRate: 0,
      completedTasks: 0,
      totalTasks: 0,
      sessionsToday: 0,
      level: 1,
      xp: 0,
      currentStreak: 0,
      materialsCount: 0,
    };
  }
}

/**
 * Calculate level based on XP
 * Formula: 100 XP per level
 */
function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

/**
 * Calculate current streak (consecutive days with at least 1 completed session)
 */
async function calculateStreak(userId: string): Promise<number> {
  try {
    const { data: sessions, error } = await supabase
      .from('study_sessions')
      .select('created_at, completed')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!sessions || sessions.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Group sessions by date
    const sessionsByDate = new Map<string, boolean>();
    sessions.forEach(session => {
      const date = new Date(session.created_at);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      sessionsByDate.set(dateKey, true);
    });

    // Count consecutive days backwards from today
    while (true) {
      const dateKey = currentDate.toISOString().split('T')[0];
      if (sessionsByDate.has(dateKey)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // If today has no sessions, check yesterday
        if (streak === 0) {
          currentDate.setDate(currentDate.getDate() - 1);
          const yesterdayKey = currentDate.toISOString().split('T')[0];
          if (sessionsByDate.has(yesterdayKey)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
}
