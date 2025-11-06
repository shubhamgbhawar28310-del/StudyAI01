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
    console.log('Fetching dashboard stats for user:', userId);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Fetch tasks for today
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, completed')
      .eq('user_id', userId);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw tasksError;
    }

    console.log('Tasks fetched:', tasks?.length || 0);

    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.completed).length || 0;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Fetch study sessions for today (try pomodoro_sessions if study_sessions doesn't exist)
    let sessionsToday = 0;
    
    // Try study_sessions first
    const { data: sessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('id, completed')
      .eq('user_id', userId)
      .gte('created_at', todayISO)
      .eq('completed', true);

    if (sessionsError) {
      console.warn('study_sessions table not found, trying pomodoro_sessions:', sessionsError);
      
      // Try pomodoro_sessions as fallback
      const { data: pomodoroSessions, error: pomodoroError } = await supabase
        .from('pomodoro_sessions')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', todayISO);
      
      if (!pomodoroError && pomodoroSessions) {
        sessionsToday = pomodoroSessions.length;
      }
    } else {
      sessionsToday = sessions?.length || 0;
    }

    console.log('Sessions today:', sessionsToday);

    // Fetch XP and calculate level
    const { data: xpData, error: xpError } = await supabase
      .from('user_xp')
      .select('total_xp')
      .eq('user_id', userId)
      .single();

    if (xpError && xpError.code !== 'PGRST116') {
      console.warn('user_xp table error:', xpError);
    }

    const xp = xpData?.total_xp || 0;
    const level = calculateLevel(xp);
    
    console.log('XP:', xp, 'Level:', level);

    // Fetch streak (consecutive days with at least 1 session)
    const streak = await calculateStreak(userId);

    // Materials are stored in localStorage, not in Supabase database
    // Get count from localStorage instead
    let materialsCount = 0;
    try {
      const savedData = localStorage.getItem('studyPlannerData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        materialsCount = parsed.materials?.length || 0;
      }
    } catch (error) {
      console.warn('Error reading materials from localStorage:', error);
    }

    console.log('Materials count:', materialsCount);

    const finalStats = {
      completionRate,
      completedTasks,
      totalTasks,
      sessionsToday,
      level,
      xp,
      currentStreak: streak,
      materialsCount: materialsCount || 0,
    };

    console.log('Final stats:', finalStats);

    return finalStats;
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

    if (error) {
      console.warn('Error calculating streak (study_sessions not found):', error);
      return 0;
    }
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
