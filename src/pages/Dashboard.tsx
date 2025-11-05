import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ModernSidebar } from '@/components/ModernSidebar'
import { Explorer } from '@/pages/Explorer'
import { TaskManager } from '@/components/features/TaskManager'
import { FlashcardManager } from '@/components/features/FlashcardManager'
import { DynamicScheduleView } from '@/components/features/DynamicScheduleView'
import { EnhancedPomodoroTimer } from '@/components/features/EnhancedPomodoroTimer'
import { FloatingMusicPlayer } from '@/components/features/FloatingMusicPlayer'
import { ProgressTracker } from '@/components/features/ProgressTracker'
import { MaterialsManager } from '@/components/features/MaterialsManager'
import { AIAssistant } from '@/components/features/AIAssistant'
import { Settings } from '@/components/features/Settings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStudyPlanner } from '@/contexts/StudyPlannerContext'
import { useAuth } from '@/contexts/AuthContext'
import { TaskModal } from '@/components/modals/TaskModal'
import { FeedbackModal } from '@/components/modals/FeedbackModal'
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator'
import { DatabaseSetupWarning } from '@/components/DatabaseSetupWarning'
import { MotivationalQuote } from '@/components/MotivationalQuote'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { DashboardStatsProvider } from '@/contexts/DashboardStatsContext'
import { 
  CheckSquare, 
  Timer, 
  Brain, 
  TrendingUp,
  Plus,
  Target,
  Flame,
  Bot,
  Loader2,
  FolderOpen,
  Upload,
  MessageCircle
} from 'lucide-react'

function DashboardOverview({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { state, setCurrentPomodoroTask } = useStudyPlanner()
  const { user } = useAuth()
  const [showTaskModal, setShowTaskModal] = useState(false)
  
  // Use real-time stats hook
  const { stats, isInitialLoad, isUpdating } = useDashboardStats(user?.id)
  
  const pendingTasks = state.tasks.filter(t => !t.completed)

  const handleAddTask = () => {
    setShowTaskModal(true)
  }
  
  const handleUploadMaterial = () => {
    setActiveTab('materials')
  }
  
  const handleViewProgress = () => {
    setActiveTab('analytics')
  }
  
  const handleAIAssistant = () => {
    setActiveTab('ai-assistant')
  }

  const handlePomodoroTimer = () => {
    setActiveTab('pomodoro-timer')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back to <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Aivy</span>! 👋</h1>
        <p className="text-muted-foreground">Here's your study overview for today</p>
        
        {/* Motivational Quote */}
        <MotivationalQuote />
      </div>

      {/* Quick Stats - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="min-w-0 hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    Completion
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold transition-opacity duration-300">{stats.completionRate}%</p>
                  <p className="text-xs text-muted-foreground hidden sm:block transition-opacity duration-300">{stats.completedTasks}/{stats.totalTasks}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="min-w-0 hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate flex items-center gap-1.5">
                    <Timer className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                    Sessions
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold transition-opacity duration-300">{stats.sessionsToday}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">today</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Timer className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="min-w-0 hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate flex items-center gap-1.5">
                    <Brain className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    Level
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold transition-opacity duration-300">{stats.level}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block transition-opacity duration-300">{stats.xp} XP</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="min-w-0 hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                    Streak
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold transition-opacity duration-300">{stats.currentStreak}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">days</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                  <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="col-span-2 sm:col-span-1"
          >
            <Card className="min-w-0 hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate flex items-center gap-1.5">
                    <FolderOpen className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    Materials
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold transition-opacity duration-300">{stats.materialsCount}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">uploaded</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button 
              variant="outline"
              className="h-20 sm:h-24 flex flex-col gap-2 hover:bg-purple-50 dark:hover:bg-purple-950/20 text-xs sm:text-sm bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800"
              onClick={handleAIAssistant}
            >
              <Bot className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600 dark:text-purple-400" />
              <span className="text-center leading-tight text-purple-700 dark:text-purple-300 font-medium">AI Assistant</span>
            </Button>

            <Button 
              variant="outline"
              className="h-20 sm:h-24 flex flex-col gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-xs sm:text-sm bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800"
              onClick={() => setActiveTab('study-planner')}
            >
              <Target className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 dark:text-blue-400" />
              <span className="text-center leading-tight text-blue-700 dark:text-blue-300 font-medium">Smart Schedule</span>
            </Button>
            
            <Button 
              variant="outline"
              className="h-20 sm:h-24 flex flex-col gap-2 hover:bg-green-50 dark:hover:bg-green-950/20 text-xs sm:text-sm bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800"
              onClick={handleViewProgress}
            >
              <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-green-600 dark:text-green-400" />
              <span className="text-center leading-tight text-green-700 dark:text-green-300 font-medium">View Progress</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tasks and Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <TaskManager 
            compactMode={true} 
            maxTasks={5} 
            showFilters={false}
            showHeader={true}
          />
          
          <DynamicScheduleView compactMode={true} showHeader={true} />
        </div>

        {/* Right Column - Quick Pomodoro */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Quick Pomodoro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Start a focused study session
              </p>
              <Button
                onClick={() => setActiveTab('pomodoro-timer')}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white"
              >
                <Timer className="h-4 w-4 mr-2" />
                Start Pomodoro
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Task Modal */}
      <TaskModal 
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
      />
    </div>
  )
}
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [musicEnabled, setMusicEnabled] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  
  console.log('Dashboard mounted with activeTab:', activeTab)
  console.log('Dashboard component rendering...')

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview setActiveTab={setActiveTab} />
      case 'explorer':
        return <Explorer setActiveTab={setActiveTab} />
      case 'ai-assistant':
        return <AIAssistant />
      case 'study-planner':
        return <DynamicScheduleView />
      case 'task-manager':
        return <TaskManager />
      case 'pomodoro-timer':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Pomodoro Timer</h2>
              <p className="text-muted-foreground">Focus on your tasks with the Pomodoro technique</p>
            </div>
            <div className="max-w-2xl mx-auto">
              <EnhancedPomodoroTimer />
            </div>
          </div>
        )
      case 'flashcards':
        return <FlashcardManager />
      case 'materials':
        console.log('Dashboard: Rendering MaterialsManager component')
        return <MaterialsManager />
      case 'analytics':
        return <ProgressTracker />
      case 'settings':
        return <Settings />
      default:
        return <DashboardOverview setActiveTab={setActiveTab} />
    }
  }

  return (
    <DashboardStatsProvider>
      <div className="flex h-screen bg-background">
        <ModernSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-auto">
        {/* Database Setup Warning */}
        <DatabaseSetupWarning />
        
        {/* Sync Status Indicator */}
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <Button
            onClick={() => setMusicEnabled(!musicEnabled)}
            size="default"
            className={`${
              musicEnabled 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-md'
            }`}
            title={musicEnabled ? 'Disable Music' : 'Enable Music'}
          >
            <img 
              src="/music (2).png" 
              alt="Music" 
              className="h-5 w-5"
            />
          </Button>
          <SyncStatusIndicator />
        </div>
        
        <div className={activeTab === 'ai-assistant' ? '' : 'p-4 sm:p-6 lg:p-8'}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </main>
      
      {/* Floating Music Player */}
      <FloatingMusicPlayer
        enabled={musicEnabled}
        onClose={() => setMusicEnabled(false)}
      />

      {/* Floating Feedback Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: 'spring' }}
        onClick={() => setShowFeedbackModal(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
        title="Share Feedback"
      >
        <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
      </motion.button>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
      </div>
    </DashboardStatsProvider>
  )
}