import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScheduleEventModal } from '@/components/modals/ScheduleEventModal'
import { useStudyPlanner } from '@/contexts/StudyPlannerContext'
import { 
  Calendar, 
  Plus, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  CalendarDays,
  Filter,
  CheckSquare,
  Timer,
  BookOpen,
  Edit,
  Trash2
} from 'lucide-react'

interface ScheduleViewProps {
  compactMode?: boolean
  showHeader?: boolean
}

export function ScheduleView({ compactMode = false, showHeader = true }: ScheduleViewProps) {
  const { state, addScheduleEvent, updateScheduleEvent, deleteScheduleEvent } = useStudyPlanner()
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: string; time: string } | null>(null)

  // Generate time slots for day/week view
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0')
    return `${hour}:00`
  })

  // Get events for current view
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return state.scheduleEvents.filter(event => 
      event.startTime.startsWith(dateStr)
    )
  }

  const getEventsForWeek = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    
    const weekEvents = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      weekEvents.push({
        date: new Date(date),
        events: getEventsForDate(date)
      })
    }
    return weekEvents
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
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

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1))
        break
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
        break
      case 'month':
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
        break
    }
    
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
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

  const handleTimeSlotClick = (date: Date, timeSlot: string) => {
    setSelectedTimeSlot({
      date: date.toISOString().split('T')[0],
      time: timeSlot
    })
    setShowEventModal(true)
  }

  const handleEditEvent = (eventId: string) => {
    setEditingEventId(eventId)
    setShowEventModal(true)
  }

  const handleEventModalClose = () => {
    setShowEventModal(false)
    setEditingEventId(null)
    setSelectedTimeSlot(null)
  }

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
                <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
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
            onClose={handleEventModalClose}
            editingEventId={editingEventId}
            defaultDate={selectedTimeSlot?.date}
            defaultTime={selectedTimeSlot?.time}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Schedule</h2>
            <p className="text-muted-foreground">Plan and organize your study time</p>
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
      )}

      {/* Navigation and View Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
              >
                <CalendarDays className="h-4 w-4 mr-1" />
                Today
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <h3 className="text-lg font-semibold ml-4">
                {viewMode === 'month' 
                  ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : viewMode === 'week'
                  ? `Week of ${formatDate(currentDate)}`
                  : formatDate(currentDate)
                }
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(value: 'day' | 'week' | 'month') => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Card>
        <CardContent className="p-0">
          {viewMode === 'week' && (
            <div className="grid grid-cols-8 gap-0 border-b">
              <div className="p-4 border-r bg-muted/30">
                <p className="text-sm font-medium">Time</p>
              </div>
              {getEventsForWeek().map(({ date }, index) => (
                <div key={index} className="p-4 border-r bg-muted/30 text-center">
                  <p className="text-sm font-medium">{formatDate(date)}</p>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'week' && (
            <div className="max-h-96 overflow-y-auto">
              {timeSlots.slice(6, 22).map(timeSlot => ( // Show 6am to 10pm
                <div key={timeSlot} className="grid grid-cols-8 gap-0 border-b min-h-[60px]">
                  <div className="p-2 border-r bg-muted/10 flex items-center">
                    <p className="text-xs text-muted-foreground">{timeSlot}</p>
                  </div>
                  {getEventsForWeek().map(({ date, events }, dayIndex) => {
                    const dayEvents = events.filter(event => {
                      const eventHour = new Date(event.startTime).getHours()
                      const slotHour = parseInt(timeSlot.split(':')[0])
                      return eventHour === slotHour
                    })

                    return (
                      <div 
                        key={dayIndex} 
                        className="border-r p-1 hover:bg-muted/20 cursor-pointer"
                        onClick={() => handleTimeSlotClick(date, timeSlot)}
                      >
                        {dayEvents.map(event => (
                          <div
                            key={event.id}
                            className={`relative text-xs p-1 rounded mb-1 text-white ${getEventColor(event.type)} cursor-pointer hover:opacity-80 group`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditEvent(event.id)
                            }}
                          >
                            <p className="font-medium truncate">{event.title}</p>
                            <p className="opacity-90">{formatTime(event.startTime)}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteScheduleEvent(event.id)
                              }}
                              className="absolute top-0 right-0 h-4 w-4 p-0 text-white hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {viewMode === 'day' && (
            <div className="space-y-2 p-4">
              {getEventsForDate(currentDate).length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No events scheduled</h3>
                  <p className="text-muted-foreground mb-4">
                    Add events to organize your day
                  </p>
                  <Button 
                    onClick={() => setShowEventModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </div>
              ) : (
                getEventsForDate(currentDate)
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .map(event => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30"
                    >
                      <div className={`w-4 h-4 rounded-full ${getEventColor(event.type)}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{event.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {event.type}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mb-1">
                            {event.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(event.startTime)} - {formatTime(event.endTime)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEvent(event.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteScheduleEvent(event.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))
              )}
            </div>
          )}

          {viewMode === 'month' && (
            <div className="p-4">
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Month View</h3>
                <p className="text-muted-foreground">
                  Month view coming soon! Use day or week view for now.
                </p>
              </div>
            </div>
          )}
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
        onClose={handleEventModalClose}
        editingEventId={editingEventId}
        defaultDate={selectedTimeSlot?.date}
        defaultTime={selectedTimeSlot?.time}
      />
    </div>
  )
}