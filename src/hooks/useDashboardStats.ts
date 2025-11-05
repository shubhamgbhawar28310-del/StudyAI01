import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchDashboardStats, DashboardStats } from '@/services/dashboardStatsService'

/**
 * Custom hook for real-time dashboard stats
 * - No loading spinners after initial load
 * - Optimistic updates for instant feedback
 * - Real-time sync with Supabase
 * - Smooth transitions between values
 */
export function useDashboardStats(userId: string | undefined) {
  const [stats, setStats] = useState<DashboardStats>({
    completionRate: 0,
    completedTasks: 0,
    totalTasks: 0,
    sessionsToday: 0,
    level: 1,
    xp: 0,
    currentStreak: 0,
    materialsCount: 0,
  })
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  // Fetch stats silently in background
  const refreshStats = useCallback(async (silent = false) => {
    if (!userId) return

    if (!silent) {
      setIsUpdating(true)
    }

    try {
      const newStats = await fetchDashboardStats(userId)
      setStats(newStats)
    } catch (error) {
      console.error('Error refreshing stats:', error)
    } finally {
      if (!silent) {
        setIsUpdating(false)
      }
      setIsInitialLoad(false)
    }
  }, [userId])

  // Optimistic update for task completion
  const optimisticTaskUpdate = useCallback((completed: boolean) => {
    setStats(prev => {
      const newCompletedTasks = completed ? prev.completedTasks + 1 : Math.max(0, prev.completedTasks - 1)
      const newCompletionRate = prev.totalTasks > 0 
        ? Math.round((newCompletedTasks / prev.totalTasks) * 100) 
        : 0

      return {
        ...prev,
        completedTasks: newCompletedTasks,
        completionRate: newCompletionRate
      }
    })

    // Sync in background
    setTimeout(() => refreshStats(true), 500)
  }, [refreshStats])

  // Optimistic update for new task
  const optimisticTaskAdd = useCallback(() => {
    setStats(prev => {
      const newTotalTasks = prev.totalTasks + 1
      const newCompletionRate = newTotalTasks > 0 
        ? Math.round((prev.completedTasks / newTotalTasks) * 100) 
        : 0

      return {
        ...prev,
        totalTasks: newTotalTasks,
        completionRate: newCompletionRate
      }
    })

    // Sync in background
    setTimeout(() => refreshStats(true), 500)
  }, [refreshStats])

  // Optimistic update for task deletion
  const optimisticTaskDelete = useCallback((wasCompleted: boolean) => {
    setStats(prev => {
      const newTotalTasks = Math.max(0, prev.totalTasks - 1)
      const newCompletedTasks = wasCompleted ? Math.max(0, prev.completedTasks - 1) : prev.completedTasks
      const newCompletionRate = newTotalTasks > 0 
        ? Math.round((newCompletedTasks / newTotalTasks) * 100) 
        : 0

      return {
        ...prev,
        totalTasks: newTotalTasks,
        completedTasks: newCompletedTasks,
        completionRate: newCompletionRate
      }
    })

    // Sync in background
    setTimeout(() => refreshStats(true), 500)
  }, [refreshStats])

  // Optimistic update for session completion
  const optimisticSessionComplete = useCallback(() => {
    setStats(prev => ({
      ...prev,
      sessionsToday: prev.sessionsToday + 1
    }))

    // Sync in background
    setTimeout(() => refreshStats(true), 500)
  }, [refreshStats])

  // Optimistic update for material upload
  const optimisticMaterialAdd = useCallback(() => {
    setStats(prev => ({
      ...prev,
      materialsCount: prev.materialsCount + 1
    }))

    // Sync in background
    setTimeout(() => refreshStats(true), 500)
  }, [refreshStats])

  // Initial load
  useEffect(() => {
    if (userId) {
      refreshStats(false)
    }
  }, [userId, refreshStats])

  // Listen for task events from StudyPlannerContext
  useEffect(() => {
    const handleTaskToggled = (e: Event) => {
      const customEvent = e as CustomEvent
      optimisticTaskUpdate(customEvent.detail.completed)
    }

    const handleTaskAdded = () => {
      optimisticTaskAdd()
    }

    const handleTaskDeleted = (e: Event) => {
      const customEvent = e as CustomEvent
      optimisticTaskDelete(customEvent.detail.wasCompleted)
    }

    window.addEventListener('task-toggled', handleTaskToggled)
    window.addEventListener('task-added', handleTaskAdded)
    window.addEventListener('task-deleted', handleTaskDeleted)

    return () => {
      window.removeEventListener('task-toggled', handleTaskToggled)
      window.removeEventListener('task-added', handleTaskAdded)
      window.removeEventListener('task-deleted', handleTaskDeleted)
    }
  }, [optimisticTaskUpdate, optimisticTaskAdd, optimisticTaskDelete])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!userId) return

    // Subscribe to tasks changes
    const tasksChannel = supabase
      .channel('dashboard-tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Refresh stats silently when tasks change
          refreshStats(true)
        }
      )
      .subscribe()

    // Subscribe to materials changes
    const materialsChannel = supabase
      .channel('dashboard-materials')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'materials',
          filter: `user_id=eq.${userId}`
        },
        () => {
          refreshStats(true)
        }
      )
      .subscribe()

    // Subscribe to study sessions changes
    const sessionsChannel = supabase
      .channel('dashboard-sessions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'study_sessions',
          filter: `user_id=eq.${userId}`
        },
        () => {
          refreshStats(true)
        }
      )
      .subscribe()

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(tasksChannel)
      supabase.removeChannel(materialsChannel)
      supabase.removeChannel(sessionsChannel)
    }
  }, [userId, refreshStats])

  return {
    stats,
    isInitialLoad,
    isUpdating,
    refreshStats,
    optimisticTaskUpdate,
    optimisticTaskAdd,
    optimisticTaskDelete,
    optimisticSessionComplete,
    optimisticMaterialAdd
  }
}
