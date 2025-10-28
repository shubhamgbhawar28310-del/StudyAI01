import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { useTheme } from '@/components/theme-provider'
import { useStudyPlanner } from '@/contexts/StudyPlannerContext'
import {
  LayoutDashboard,
  GraduationCap,
  Settings,
  CheckSquare,
  Moon,
  Sun,
  Menu,
  X,
  Timer,
  TrendingUp,
  Brain,
  Calendar,
  LogOut,
  FolderOpen,
  Bot
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'pomodoro', label: 'Pomodoro', icon: Timer },
  { id: 'flashcards', label: 'Flashcards', icon: Brain },
  { id: 'materials', label: 'Materials', icon: FolderOpen },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { theme, setTheme } = useTheme()
  const { state } = useStudyPlanner()

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-card border-r border-border h-screen flex flex-col shadow-lg relative z-10"
    >
      {/* Header */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" /> {/* Changed from GraduationCap to Bot */}
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              StudyAI
            </span>
          </motion.div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          
          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant={isActive ? 'default' : 'ghost'}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'w-full justify-start gap-3 h-12',
                  isActive && item.id === 'ai-assistant' && 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg',
                  isActive && item.id !== 'ai-assistant' && 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg',
                  isCollapsed && 'px-3'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-medium"
                  >
                    {item.label}
                    {item.id === 'ai-assistant' && <span className="ml-1">🤖</span>}
                  </motion.span>
                )}
              </Button>
            </motion.div>
          )
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="p-4 border-t border-border">
        <div className={cn(
          'flex items-center gap-3 p-3 rounded-lg bg-muted',
          isCollapsed && 'justify-center'
        )}>
          {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!isCollapsed && (
            <>
              <span className="text-sm font-medium flex-1">Dark Mode</span>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </>
          )}
        </div>
      </div>

      {/* Profile */}
      <div className="p-4 border-t border-border">
        <div 
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer',
            isCollapsed && 'justify-center'
          )}
          onClick={() => {
            if (!isCollapsed) {
              alert('Profile settings would open here')
            }
          }}
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              JD
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 min-w-0"
            >
              <p className="text-sm font-medium truncate">John Doe</p>
              <p className="text-xs text-muted-foreground truncate">
                Level {state.userStats.level} • {state.userStats.xp} XP
              </p>
            </motion.div>
          )}
        </div>
        
        {/* Log out */}
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2"
          >
            <Button
              variant="ghost"
              onClick={() => {
                if (window.confirm('Are you sure you want to log out?')) {
                  window.location.reload()
                }
              }}
              className="w-full justify-start gap-3 h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </motion.div>
        )}
      </div>
    </motion.aside>
  )
}