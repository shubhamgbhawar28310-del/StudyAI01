import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useTheme } from '@/components/theme-provider'
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Settings,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
  Compass,
  Bot,
  Brain,
  TrendingUp,
  FolderOpen,
  Timer,
  GraduationCap
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface ModernSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const mainTools = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'study-planner', label: 'Study Planner', icon: Calendar, featured: true },
  { id: 'task-manager', label: 'Task Manager', icon: CheckSquare },
]

const explorerTools = [
  { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, badge: 'Beta' },
  { id: 'flashcards', label: 'Flashcards', icon: Brain },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'materials', label: 'Materials', icon: FolderOpen },
  { id: 'pomodoro-timer', label: 'Pomodoro Timer', icon: Timer },
]

export function ModernSidebar({ activeTab, setActiveTab }: ModernSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isExplorerOpen, setIsExplorerOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  
  const actualTheme = theme === 'system' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme
  
  const userProfile = {
    displayName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
    email: user?.email || 'user@example.com'
  }
  
  const handleLogout = async () => {
    await signOut()
  }

  const cycleTheme = async () => {
    let newTheme: 'light' | 'dark' | 'system'
    if (theme === 'light') {
      newTheme = 'dark'
    } else if (theme === 'dark') {
      newTheme = 'system'
    } else {
      newTheme = 'light'
    }
    
    setTheme(newTheme)
    
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
        className={cn(
          "fixed md:relative z-40 h-screen bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
          isCollapsed ? "w-0 md:w-16" : "w-64",
          isMobileOpen ? "left-0" : "-left-full md:left-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={cn(
            "border-b border-gray-200 dark:border-gray-800 flex items-center",
            isCollapsed ? "justify-center p-4" : "justify-between p-6"
          )}>
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => {
                if (isCollapsed) {
                  setIsCollapsed(false)
                }
              }}
            >
              <img src="/aivyapp1.png" alt="Aivy Logo" className="w-[32px] h-[32px] object-contain" />
              {!isCollapsed && (
                <h2 className="font-bold text-[20px] text-gray-900 dark:text-white leading-none">
                  Aivy
                </h2>
              )}
            </div>
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsCollapsed(true)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
            {/* Main Tools */}
            <div className="space-y-1">
              {mainTools.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                      "w-full h-11 transition-all duration-200",
                      isCollapsed ? "justify-center px-0" : "justify-start px-4",
                      isActive 
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 text-blue-700 dark:text-blue-400 shadow-sm" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300",
                      item.featured && !isActive && "hover:shadow-md"
                    )}
                    onClick={() => {
                      setActiveTab(item.id)
                      setIsMobileOpen(false)
                    }}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={cn(
                      "w-5 h-5",
                      !isCollapsed && "mr-3",
                      item.featured && !isActive && "text-blue-600 dark:text-blue-400"
                    )} />
                    {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    {!isCollapsed && item.featured && !isActive && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    )}
                  </Button>
                )
              })}
            </div>

            {/* Explorer Section */}
            <div className="space-y-1">
              {isCollapsed ? (
                // Collapsed: Show single Explorer icon that opens Explorer page
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full h-11 justify-center px-0 transition-all duration-200",
                    activeTab === 'explorer'
                      ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 text-blue-700 dark:text-blue-400 shadow-sm"
                      : "hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400"
                  )}
                  onClick={() => {
                    setActiveTab('explorer')
                    setIsMobileOpen(false)
                  }}
                  title="Explorer"
                >
                  <Compass className="w-5 h-5" />
                </Button>
              ) : (
                // Expanded: Show collapsible menu
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-10 px-4 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
                    onClick={() => setIsExplorerOpen(!isExplorerOpen)}
                  >
                    <Compass className="w-4 h-4 mr-3" />
                    <span className="font-medium text-sm">Explorer</span>
                    <ChevronRight className={cn(
                      "w-4 h-4 ml-auto transition-transform duration-200",
                      isExplorerOpen && "rotate-90"
                    )} />
                  </Button>

                  {isExplorerOpen && (
                    <div className="ml-4 space-y-1 border-l-2 border-gray-200 dark:border-gray-800 pl-2">
                      {explorerTools.map((item) => {
                        const Icon = item.icon
                        const isActive = activeTab === item.id
                        return (
                          <Button
                            key={item.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start h-10 px-3 text-sm transition-all duration-200",
                              isActive 
                                ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 text-blue-700 dark:text-blue-400" 
                                : "hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400"
                            )}
                            onClick={() => {
                              setActiveTab(item.id)
                              setIsMobileOpen(false)
                            }}
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            <span>{item.label}</span>
                            {item.badge && (
                              <Badge 
                                variant="secondary" 
                                className="ml-auto text-xs px-1.5 py-0 h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </Button>
                        )
                      })}
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-10 px-3 text-sm text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900"
                        onClick={() => {
                          setActiveTab('explorer')
                          setIsMobileOpen(false)
                        }}
                      >
                        <span className="text-xs">View All Tools →</span>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </nav>

          {/* Bottom Section */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-2">
            {/* Settings */}
            <Button
              variant="ghost"
              className={cn(
                "w-full h-10 transition-all duration-200",
                isCollapsed ? "justify-center px-0" : "justify-start px-4",
                activeTab === 'settings'
                  ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 text-blue-700 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300"
              )}
              onClick={() => {
                setActiveTab('settings')
                setIsMobileOpen(false)
              }}
              title={isCollapsed ? "Settings" : undefined}
            >
              <Settings className={cn("w-5 h-5", !isCollapsed && "mr-3")} />
              {!isCollapsed && <span className="font-medium">Settings</span>}
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              className={cn(
                "w-full h-10 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300",
                isCollapsed ? "justify-center px-0" : "justify-start px-4"
              )}
              onClick={cycleTheme}
              title={isCollapsed ? `Theme: ${theme}` : `Current: ${theme}. Click to switch.`}
            >
              {theme === 'light' && <Sun className={cn("w-5 h-5", !isCollapsed && "mr-3")} />}
              {theme === 'dark' && <Moon className={cn("w-5 h-5", !isCollapsed && "mr-3")} />}
              {theme === 'system' && <Laptop className={cn("w-5 h-5", !isCollapsed && "mr-3")} />}
              {!isCollapsed && (
                <span className="font-medium capitalize">
                  {theme === 'system' ? 'System' : theme}
                </span>
              )}
            </Button>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={cn(
                    "w-full justify-start h-auto p-3 hover:bg-gray-100 dark:hover:bg-gray-900",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <Avatar className={cn("h-9 w-9", !isCollapsed && "mr-3")}>
                    <AvatarImage src="https://github.com/shadcn.png" alt={userProfile.displayName} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                      {userProfile.displayName
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                          {userProfile.displayName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {userProfile.email}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 ml-2 text-gray-500" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('settings')}>
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
