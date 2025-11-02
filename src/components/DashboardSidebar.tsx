import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/components/theme-provider'
import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  Brain,
  Calendar,
  TrendingUp,
  FolderOpen,
  GraduationCap,
  Settings,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  BookOpen,
  Sun,
  Moon,
  Laptop,
  Bot
} from 'lucide-react'
import { useStudyPlanner } from '@/contexts/StudyPlannerContext'
import { useAuth } from '@/contexts/AuthContext'

interface DashboardSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
    { id: 'study-planner', label: 'Study Planner', icon: Calendar },
    { id: 'task-manager', label: 'Task Manager', icon: CheckSquare },
    { id: 'pomodoro-timer', label: 'Pomodoro Timer', icon: Timer },
    { id: 'flashcards', label: 'Flashcards', icon: Brain },
    { id: 'materials', label: 'Materials', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

export function DashboardSidebar({ activeTab, setActiveTab }: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { state } = useStudyPlanner()
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  
  // Detect actual theme when in system mode
  const actualTheme = theme === 'system' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme
  
  // Get user profile from Supabase auth
  const userProfile = {
    displayName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
    email: user?.email || 'user@example.com'
  }
  
  const handleLogout = async () => {
    await signOut()
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        data-sidebar="dashboard"
        className={cn(
          "fixed md:relative z-40 h-screen bg-card border-r transition-all duration-300",
          isCollapsed ? "w-0 md:w-16" : "w-64",
          isMobileOpen ? "left-0" : "-left-full md:left-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b">
            <div 
              className="flex items-center justify-between"
              onClick={() => {
                if (isCollapsed) {
                  setIsCollapsed(false)
                }
              }}
            >
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <h2 className={cn(
                  "font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent transition-all",
                  isCollapsed && "hidden"
                )}>
                  StudyAI
                </h2>
              </div>
              {!isCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex"
                  onClick={() => setIsCollapsed(true)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>


          {/* Navigation Items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <Button
                  key={item.id}
                  variant="transparent"
                  className={cn(
                    "w-full justify-start sidebar-item",
                    isActive && "selected-item",
                    isCollapsed && "px-3"
                  )}
                  onClick={() => {
                    setActiveTab(item.id)
                    setIsMobileOpen(false)
                  }}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {!isCollapsed && item.label}
                </Button>
              )
            })}
            
            {/* Theme Toggle Section */}
            <div className="pt-3 mt-3 border-t">
              <Button
                variant="transparent"
                size="sm"
                className={cn(
                  "w-full justify-start transition-all group",
                  isCollapsed && "justify-center px-2"
                )}
                onClick={async () => {
                  // Cycle through themes: light -> dark -> system -> light
                  let newTheme: 'light' | 'dark' | 'system'
                  if (theme === 'light') {
                    newTheme = 'dark'
                  } else if (theme === 'dark') {
                    newTheme = 'system'
                  } else {
                    newTheme = 'light'
                  }
                  
                  // Apply theme immediately
                  setTheme(newTheme)
                  
                  // Save to database in background
                  if (user?.id) {
                    try {
                      const { supabase } = await import('@/lib/supabase')
                      await supabase
                        .from('user_settings')
                        .upsert({
                          user_id: user.id,
                          theme: newTheme
                        }, {
                          onConflict: 'user_id',
                          ignoreDuplicates: false
                        })
                    } catch (error) {
                      console.error('Error saving theme:', error)
                    }
                  }
                }}
                title={`Current theme: ${theme}. Click to switch.`}
              >
                <div className="relative">
                  {theme === 'light' && <Sun className={cn("h-4 w-4 transition-all", !isCollapsed && "mr-3")} />}
                  {theme === 'dark' && <Moon className={cn("h-4 w-4 transition-all", !isCollapsed && "mr-3")} />}
                  {theme === 'system' && <Laptop className={cn("h-4 w-4 transition-all", !isCollapsed && "mr-3")} />}
                </div>
                {!isCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <div className="flex items-center gap-2">
                      <span className="capitalize">
                        {theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'}
                      </span>
                      {theme === 'system' && (
                        <span className="text-xs text-muted-foreground">
                          ({actualTheme === 'dark' ? 'Dark' : 'Light'})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <Sun className="h-3 w-3" />
                      <span>→</span>
                      <Moon className="h-3 w-3" />
                      <span>→</span>
                      <Laptop className="h-3 w-3" />
                    </div>
                  </div>
                )}
              </Button>
            </div>
          </nav>

          {/* Footer - Profile Section */}
          <div className="border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="transparent" className="w-full justify-start p-2 h-auto">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarImage src="https://github.com/shadcn.png" alt={userProfile.displayName} />
                    <AvatarFallback>
                      {userProfile.displayName
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate">{userProfile.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{userProfile.email}</p>
                    </div>
                  )}
                  {!isCollapsed && <ChevronDown className="h-4 w-4 ml-auto" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
    </>
  )
}