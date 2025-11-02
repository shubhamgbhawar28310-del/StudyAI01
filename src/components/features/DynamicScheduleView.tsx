import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScheduleEventModal } from '@/components/modals/ScheduleEventModal';
import { StudySessionModal } from '@/components/modals/StudySessionModal';
import { useStudyPlanner } from '@/contexts/StudyPlannerContext';
import { 
  Calendar, 
  Plus, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  CalendarDays,
  Timer,
  Edit,
  Trash2
} from 'lucide-react';

interface DynamicScheduleViewProps {
  compactMode?: boolean;
  showHeader?: boolean;
}

export function DynamicScheduleView({ compactMode = false, showHeader = true }: DynamicScheduleViewProps) {
  const { state, addScheduleEvent, updateScheduleEvent, deleteScheduleEvent } = useStudyPlanner();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: string; time: string } | null>(null);
  
  // Study Session Modal state
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      // Scroll to 2 hours before current time
      const scrollPosition = Math.max(0, (currentHour - 2 - 6) * 80); // 80px per hour, starting from 6am
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, [viewMode]);
  
  // Generate time slots from 6 AM to 11 PM
  const timeSlots = Array.from({ length: 18 }, (_, i) => {
    const hour = i + 6; // Start from 6 AM
    return `${hour.toString().padStart(2, '0')}:00`;
  });
  
  // Get events for current view
  const getEventsForDate = (date: Date) => {
    // Create start and end of day in local timezone
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return state.scheduleEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= startOfDay && eventDate <= endOfDay;
    });
  };
  
  const getEventsForWeek = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekEvents = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekEvents.push({
        date: new Date(date),
        events: getEventsForDate(date)
      });
    }
    return weekEvents;
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const getEventColor = (type: string) => {
    switch (type) {
      case 'task': return 'bg-blue-500';
      case 'study': return 'bg-green-500';
      case 'break': return 'bg-yellow-500';
      case 'other': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'missed': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };
  
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
    }
    
    setCurrentDate(newDate);
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  const handleTimeSlotClick = (date: Date, timeSlot: string) => {
    setSelectedTimeSlot({
      date: date.toISOString().split('T')[0],
      time: timeSlot
    });
    setShowEventModal(true);
  };
  
  const handleEditEvent = (eventId: string) => {
    setEditingEventId(eventId);
    setShowEventModal(true);
  };
  
  const handleEventModalClose = () => {
    setShowEventModal(false);
    setEditingEventId(null);
    setSelectedTimeSlot(null);
  };
  
  const isCurrentTimeSlot = (date: Date, timeSlot: string) => {
    const now = new Date();
    const slotDate = new Date(date);
    const slotHour = parseInt(timeSlot.split(':')[0]);
    
    return (
      slotDate.toDateString() === now.toDateString() &&
      slotHour === now.getHours()
    );
  };
  
  if (compactMode) {
    const todayEvents = getEventsForDate(new Date());
    
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
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(event.status || 'scheduled')}`} />
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
    );
  }
  
  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Schedule</h2>
            <p className="text-muted-foreground">Plan and organize your study time</p>
          </div>
          <Button 
            onClick={() => setShowEventModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
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
                {viewMode === 'week'
                  ? `Week of ${formatDate(currentDate)}`
                  : formatDate(currentDate)
                }
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(value: 'day' | 'week') => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
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
            <>
              {/* Week Header */}
              <div className="grid grid-cols-8 gap-0 border-b sticky top-0 bg-background z-10">
                <div className="p-4 border-r bg-muted/30">
                  <p className="text-sm font-medium">Time</p>
                </div>
                {getEventsForWeek().map(({ date }, index) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <div 
                      key={index} 
                      className={`p-4 border-r text-center ${isToday ? 'bg-blue-50 dark:bg-blue-950' : 'bg-muted/30'}`}
                    >
                      <p className={`text-sm font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                        {formatDate(date)}
                      </p>
                    </div>
                  );
                })}
              </div>
              
              {/* Scrollable Time Grid */}
              <div 
                ref={scrollContainerRef}
                className="max-h-[600px] overflow-y-auto"
              >
                {timeSlots.map(timeSlot => (
                  <div key={timeSlot} className="grid grid-cols-8 gap-0 border-b min-h-[80px]">
                    <div className="p-2 border-r bg-muted/10 flex items-start">
                      <p className="text-xs text-muted-foreground font-medium">{timeSlot}</p>
                    </div>
                    {getEventsForWeek().map(({ date, events }, dayIndex) => {
                      const dayEvents = events.filter(event => {
                        const eventHour = new Date(event.startTime).getHours();
                        const slotHour = parseInt(timeSlot.split(':')[0]);
                        return eventHour === slotHour;
                      });
                      
                      const isCurrentSlot = isCurrentTimeSlot(date, timeSlot);
                      
                      return (
                        <div 
                          key={dayIndex} 
                          className={`border-r p-1 hover:bg-muted/20 cursor-pointer transition-colors relative ${
                            isCurrentSlot ? 'bg-blue-50/50 dark:bg-blue-950/50' : ''
                          }`}
                          onClick={() => handleTimeSlotClick(date, timeSlot)}
                        >
                          {isCurrentSlot && (
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-10" />
                          )}
                          {dayEvents.map(event => (
                            <div
                              key={event.id}
                              className={`relative text-xs p-2 rounded mb-1 text-white ${getEventColor(event.type)} cursor-pointer hover:opacity-90 group`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEventId(event.id);
                                setShowSessionModal(true);
                              }}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{event.title}</p>
                                  <p className="opacity-90 text-[10px]">{formatTime(event.startTime)}</p>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(event.status || 'scheduled')} flex-shrink-0`} />
                              </div>
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditEvent(event.id);
                                  }}
                                  className="h-5 w-5 p-0 text-white hover:text-blue-300"
                                  title="Edit"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Delete this event?')) {
                                      deleteScheduleEvent(event.id);
                                    }
                                  }}
                                  className="h-5 w-5 p-0 text-white hover:text-red-300"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
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
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedEventId(event.id);
                        setShowSessionModal(true);
                      }}
                    >
                      <div className={`w-4 h-4 rounded-full ${getEventColor(event.type)}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{event.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {event.type}
                          </Badge>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(event.status || 'scheduled')}`} />
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
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEvent(event.id)}
                          className="h-8 w-8 p-0"
                          title="Edit Event"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this event?')) {
                              deleteScheduleEvent(event.id);
                            }
                          }}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          title="Delete Event"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))
              )}
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
              <Timer className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">
                  {state.scheduleEvents.filter(e => e.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {state.scheduleEvents.filter(e => e.status === 'completed').length}
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
      
      <StudySessionModal
        isOpen={showSessionModal}
        onClose={() => {
          setShowSessionModal(false);
          setSelectedEventId(null);
        }}
        eventId={selectedEventId}
      />
    </div>
  );
}
