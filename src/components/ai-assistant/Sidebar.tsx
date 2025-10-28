import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Trash2, 
  GraduationCap, 
  X, 
  Menu 
} from 'lucide-react'
import { ChatSession } from '@/components/ai-assistant/types'
import { cn } from "@/lib/utils"

interface SidebarProps {
  chatSessions: ChatSession[]
  currentChatId: string | null
  sidebarOpen: boolean
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
  onNewChat: () => void
  onSelectChat: (id: string) => void
  onDeleteChat: (id: string) => void
  onDeleteAllChats: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  chatSessions,
  currentChatId,
  sidebarOpen,
  setSidebarOpen,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onDeleteAllChats
}) => {
  return (
    <aside data-sidebar="ai-assistant" className={`${sidebarOpen ? 'w-80' : 'w-0 lg:w-16'} transition-all duration-300 bg-card border-r border-border flex flex-col overflow-hidden fixed lg:static z-50 h-full`}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-6 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <h1 className={`text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent transition-all truncate ${!sidebarOpen ? 'lg:hidden' : ''}`}>
              StudyAI
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden focus:outline-none focus:ring-0 focus:ring-offset-0"
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>
        
        <Button
          onClick={onNewChat}
          variant="default"
          className={`w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white ${!sidebarOpen ? 'lg:px-2 lg:justify-center' : ''}`}
        >
          <Plus className="w-4 h-4 mr-3" />
          <span className={`${!sidebarOpen ? 'lg:hidden' : ''}`}>New Chat</span>
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          <span className={`text-xs font-semibold text-muted-foreground uppercase tracking-wider ${!sidebarOpen ? 'lg:hidden' : ''}`}>
            Recent Chats
          </span>
          <div className="space-y-1 mt-3">
            {chatSessions.length === 0 ? (
              <p className={`text-sm text-muted-foreground text-center py-4 ${!sidebarOpen ? 'lg:hidden' : ''}`}>
                No conversations yet
              </p>
            ) : (
              [...chatSessions].reverse().map(session => (
                <div key={session.id} className="group relative">
                  <Button
                    variant="transparent"
                    onClick={() => onSelectChat(session.id)}
                    className={cn(
                      "w-full justify-start text-left h-auto p-3 rounded-lg pr-10 sidebar-item",
                      session.id === currentChatId && "selected-item",
                      !sidebarOpen && "lg:px-2 lg:justify-center"
                    )}
                  >
                    <div className={cn(
                      "flex flex-col items-start gap-1 min-w-0",
                      !sidebarOpen && "lg:items-center"
                    )}>
                      <span className={cn(
                        "font-medium truncate w-full",
                        !sidebarOpen && "lg:hidden"
                      )}>
                        {session.title}
                      </span>
                      <span className={cn(
                        "text-xs text-muted-foreground",
                        !sidebarOpen && "lg:hidden"
                      )}>
                        {session.messages.length} messages
                      </span>
                      {!sidebarOpen && (
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                      )}
                    </div>
                  </Button>
                  <Button
                    variant="transparent"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteChat(session.id)
                    }}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive",
                      !sidebarOpen && "lg:hidden"
                    )}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        <Button 
          variant="transparent"
          onClick={onDeleteAllChats}
          className={`w-full justify-start text-muted-foreground hover:text-destructive ${!sidebarOpen ? 'lg:px-2 lg:justify-center' : ''}`}
        >
          <Trash2 className="w-4 h-4 mr-3" />
          <span className={`${!sidebarOpen ? 'lg:hidden' : ''}`}>Clear All Chats</span>
        </Button>
      </div>
    </aside>
  )
}