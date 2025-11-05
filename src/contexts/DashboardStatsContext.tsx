import { createContext, useContext, ReactNode } from 'react'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useAuth } from './AuthContext'
import { DashboardStats } from '@/services/dashboardStatsService'

interface DashboardStatsContextType {
  stats: DashboardStats
  isInitialLoad: boolean
  isUpdating: boolean
  refreshStats: (silent?: boolean) => Promise<void>
  optimisticTaskUpdate: (completed: boolean) => void
  optimisticTaskAdd: () => void
  optimisticTaskDelete: (wasCompleted: boolean) => void
  optimisticSessionComplete: () => void
  optimisticMaterialAdd: () => void
}

const DashboardStatsContext = createContext<DashboardStatsContextType | undefined>(undefined)

export function DashboardStatsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const statsHook = useDashboardStats(user?.id)

  return (
    <DashboardStatsContext.Provider value={statsHook}>
      {children}
    </DashboardStatsContext.Provider>
  )
}

export function useDashboardStatsContext() {
  const context = useContext(DashboardStatsContext)
  if (context === undefined) {
    throw new Error('useDashboardStatsContext must be used within a DashboardStatsProvider')
  }
  return context
}
