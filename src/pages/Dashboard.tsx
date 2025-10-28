import { useState } from 'react'
import { motion } from 'framer-motion'
import { DashboardSidebar } from '@/components/DashboardSidebar'
import { TaskManager } from '@/components/features/TaskManager'
import { PomodoroTimer } from '@/components/features/PomodoroTimer'
import { FlashcardManager } from '@/components/features/FlashcardManager'
import { ScheduleView } from '@/components/features/ScheduleView'
import { ProgressTracker } from '@/components/features/ProgressTracker'
import { MaterialsManager } from '@/components/features/MaterialsManager'
import { AIAssistant } from '@/components/features/AIAssistant'
import { Settings } from '@/components/features/Settings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStudyPlanner } from '@/contexts/StudyPlannerContext'
import { TaskModal } from '@/components/modals/TaskModal'
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator'
import { DatabaseSetupWarning } from '@/components/DatabaseSetupWarning'
import { 
  CheckSquare, 
  Timer, 
  Brain, 
  TrendingUp,
  Plus,
  Calendar,
  Target,
  Flame,
  FolderOpen,
  Upload,
  GraduationCap,
  Bot
} from 'lucide-react'

function DashboardOverview({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { state, setCurrentPomodoroTask, dispatch } = useStudyPlanner()
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showMaterialUpload, setShowMaterialUpload] = useState(false)
  
  const pendingTasks = state.tasks.filter(t => !t.completed)
  const todayEvents = state.scheduleEvents.filter(event => {
    const today = new Date().toDateString()
    return new Date(event.startTime).toDateString() === today
  })
  
  const flashcardsNeedingReview = state.flashcards.filter(card => {
    if (card.reviewCount === 0) return true
    if (!card.nextReview) return true
    return new Date(card.nextReview) <= new Date()
  })

  const completionRate = state.userStats.totalTasks > 0 
    ? Math.round((state.userStats.completedTasks / state.userStats.totalTasks) * 100)
    : 0

  const totalPomodoroSessions = state.pomodoroSessions.filter(s => s.completed).length

  const handleQuickPomodoro = () => {
    if (pendingTasks.length > 0) {
      setCurrentPomodoroTask(pendingTasks[0])
      setActiveTab('pomodoro')
    } else {
      alert('No pending tasks to focus on. Create a task first!')
    }
  }
  
  const handleAddTask = () => {
    setShowTaskModal(true)
  }
  
  const handleStudyCards = () => {
    if (flashcardsNeedingReview.length > 0) {
      setActiveTab('flashcards')
    } else {
      alert('No flashcards to review. Generate some flashcards first!')
    }
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

  const handleFlashcards = () => {
    setActiveTab('flashcards')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back to <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">StudyAI</span>! 👋</h1>
        <p className="text-muted-foreground">Here's your study overview for today</p>
      </div>

      {/* Quick Stats - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="min-w-0">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Completion</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">{completionRate}%</p>
                <p className="text-xs text-muted-foreground hidden sm:block">{state.userStats.completedTasks}/{state.userStats.totalTasks}</p>
              </div>
              <Target className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Sessions</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">{totalPomodoroSessions}</p>
                <p className="text-xs text-muted-foreground hidden sm:block">completed</p>
              </div>
              <Timer className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Level</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">{state.userStats.level}</p>
                <p className="text-xs text-muted-foreground hidden sm:block">{state.userStats.xp} XP</p>
              </div>
              <CheckSquare className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Streak</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">{state.userStats.currentStreak}</p>
                <p className="text-xs text-muted-foreground hidden sm:block">days</p>
              </div>
              <Flame className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 col-span-2 sm:col-span-1">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Materials</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">{state.materials.length}</p>
                <p className="text-xs text-muted-foreground hidden sm:block">uploaded</p>
              </div>
              <FolderOpen className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Button 
              variant="outline"
              className="h-16 sm:h-20 flex flex-col gap-2 hover:bg-blue-50 text-xs sm:text-sm bg-gradient-to-r from-blue-100 to-purple-100 border-blue-200"
              onClick={handleAddTask}
            >
              <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <span className="text-center leading-tight text-blue-700">Add Task</span>
            </Button>
            
            <Button 
              variant="outline"
              className="h-16 sm:h-20 flex flex-col gap-2 hover:bg-purple-50 text-xs sm:text-sm bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200"
              disabled={flashcardsNeedingReview.length === 0}
              onClick={handleStudyCards}
            >
              <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              <span className="text-center leading-tight text-purple-700">Study Cards ({flashcardsNeedingReview.length})</span>
            </Button>
            
            <Button 
              variant="outline"
              className="h-16 sm:h-20 flex flex-col gap-2 hover:bg-indigo-50 text-xs sm:text-sm bg-gradient-to-r from-indigo-100 to-purple-100 border-indigo-200"
              onClick={handleUploadMaterial}
            >
              <FolderOpen className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" />
              <span className="text-center leading-tight text-indigo-700">Upload Material</span>
            </Button>
            
            <Button 
              variant="outline"
              className="h-16 sm:h-20 flex flex-col gap-2 hover:bg-green-50 text-xs sm:text-sm bg-gradient-to-r from-green-100 to-emerald-100 border-green-200"
              onClick={handleViewProgress}
            >
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              <span className="text-center leading-tight text-green-700">View Progress</span>
            </Button>

            <Button 
              variant="outline"
              className="h-16 sm:h-20 flex flex-col gap-2 hover:bg-purple-50 text-xs sm:text-sm bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200"
              onClick={handleAIAssistant}
            >
              <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              <span className="text-center leading-tight text-purple-700">AI Assistant </span>
            </Button>

            <Button 
              variant="outline"
              className="h-16 sm:h-20 flex flex-col gap-2 hover:bg-red-50 text-xs sm:text-sm bg-gradient-to-r from-red-100 to-orange-100 border-red-200"
              onClick={handlePomodoroTimer}
            >
              <Timer className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              <span className="text-center leading-tight text-red-700">Pomodoro Timer </span>
            </Button>

            <Button 
              variant="outline"
              className="h-16 sm:h-20 flex flex-col gap-2 hover:bg-blue-50 text-xs sm:text-sm bg-gradient-to-r from-blue-100 to-purple-100 border-blue-200"
              onClick={handleFlashcards}
            >
              <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <span className="text-center leading-tight text-blue-700">Flashcards </span>
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
          
          <ScheduleView compactMode={true} showHeader={true} />
        </div>

        {/* Right Column - Pomodoro, Flashcards and Materials */}
        <div className="space-y-6">
          <PomodoroTimer compactMode={false} showTaskSelection={true} />
          
          <MaterialsManager compactMode={true} showHeader={true} />
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
  
  console.log('Dashboard mounted with activeTab:', activeTab)
  console.log('Dashboard component rendering...')

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview setActiveTab={setActiveTab} />
      case 'ai-assistant':
        return <AIAssistant />
      case 'study-planner':
        return <ScheduleView />
      case 'task-manager':
        return <TaskManager />
      case 'pomodoro-timer':
        return <PomodoroTimer />
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
    <div className="flex h-screen bg-background">
      <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-auto">
        {/* Database Setup Warning */}
        <DatabaseSetupWarning />
        
        {/* Sync Status Indicator */}
        <div className="fixed top-4 right-4 z-50">
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
    </div>
  )
}