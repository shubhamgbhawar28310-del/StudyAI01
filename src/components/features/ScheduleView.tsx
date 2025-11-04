import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScheduleEventModal } from '@/components/modals/ScheduleEventModal'
import { StudySessionModal } from '@/components/modals/StudySessionModal'
import { InteractiveCalendar } from './InteractiveCalendar'
import { useStudyPlanner } from '@/contexts/StudyPlannerContext'
import { 
  Calendar, 
  Plus, 
  Clock,
  CheckSquare,
  Timer,
  BookOpen
} from 'lucide-react'

interface ScheduleViewProps {
  compactMode?: boolean
  showHeader?: boolean
}

export function ScheduleView({ compactMode = false, showHeader = true }: ScheduleViewProps) {
  const { state, addScheduleEvent } = useStudyPlanner()
  
  const [showEventModal, setShowEventModal] = useState(false)
  
  // Study Session Modal state
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  // Get events for current view
  const getEventsForDate = (date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return state.scheduleEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= startOfDay && eventDate <= endOfDay;
    });
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'task': return 'bg-blue-500'
      case 'study': return 'bg-green-500'
      case 'break': return 'bg-yellow-500'
      case 'other': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const handleAutoSchedule = () => {
    // Auto-schedule pending tasks
    const pendingTasks = state.tasks.filter(t => !t.completed && t.dueDate)
    let scheduledCount = 0
    
    pendingTasks.forEach((task, index) => {
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate)
        const startTime = new Date(dueDate)
        startTime.setHours(9 + (index * 2), 0, 0, 0) // Schedule at 9am, 11am, 1pm, etc.
        
        const endTime = new Date(startTime)
        endTime.setHours(startTime.getHours() + 1) // 1 hour duration
        
        // Check if there's already an event at this time
        const existingEvent = state.scheduleEvents.find(event => {
          const eventStart = new Date(event.startTime)
          return eventStart.getTime() === startTime.getTime()
        })
        
        if (!existingEvent) {
          addScheduleEvent({
            title: task.title,
            description: task.description,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            type: 'task',
            taskId: task.id,
            color: getEventColor('task')
          })
          scheduledCount++
        }
      }
    })
    
    alert(`Auto-scheduled ${scheduledCount} tasks!`)
  }

  // Compact mode - show today's events in a simple list
  if (compactMode) {
    const todayEvents = getEventsForDate(new Date())
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-4 w-4" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayEvents.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">
                No events scheduled for today
              </p>
              <Button
                size="sm"
                onClick={() => setShowEventModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Event
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {todayEvents.slice(0, 3).map(event => (
                <div 
                  key={event.id} 
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => {
                    setSelectedEventId(event.id);
                    setShowSessionModal(true);
                  }}
                >
                  <div className={`w-3 h-3 rounded-full ${getEventColor(event.type)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(event.startTime)}
                    </p>
                  </div>
                </div>
              ))}
              {todayEvents.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{todayEvents.length - 3} more events
                </p>
              )}
            </div>
          )}
          
          <ScheduleEventModal
            isOpen={showEventModal}
            onClose={() => setShowEventModal(false)}
          />
          
          <StudySessionModal
            isOpen={showSessionModal}
            onClose={() => {
              setShowSessionModal(false)
              setSelectedEventId(null)
            }}
            eventId={selectedEventId}
          />
        </CardContent>
      </Card>
    )
  }

  // Full calendar view with interactive features
  return (
    <div className="space-y-4">
      {showHeader && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Study Planner
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Click to create, drag to move, resize to adjust duration
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAutoSchedule}
                  variant="outline"
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white border-0"
                >
                  <Timer className="h-4 w-4 mr-2" />
                  Auto Schedule
                </Button>
                <Button 
                  onClick={() => setShowEventModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Interactive Calendar */}
      <Card>
        <CardContent className="p-4">
          <div className="min-h-[600px]">
            <InteractiveCalendar />
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Today's Events</p>
                <p className="text-2xl font-bold">{getEventsForDate(new Date()).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Task Events</p>
                <p className="text-2xl font-bold">
                  {state.scheduleEvents.filter(e => e.type === 'task').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Study Sessions</p>
                <p className="text-2xl font-bold">
                  {state.scheduleEvents.filter(e => e.type === 'study').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ScheduleEventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
      />
      
      <StudySessionModal
        isOpen={showSessionModal}
        onClose={() => {
          setShowSessionModal(false)
          setSelectedEventId(null)
        }}
        eventId={selectedEventId}
      />
    </div>
  )
}

// Export for backward compatibility
export { ScheduleView as DynamicScheduleView }