import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScheduleEventModal } from '@/components/modals/ScheduleEventModal';
import { StudySessionModal } from '@/components/modals/StudySessionModal';
import { useStudyPlanner } from '@/contexts/StudyPlannerContext';
import { EventBlock } from '@/components/calendar/EventBlock';
import { useEventPosition } from '@/hooks/useEventPosition';
import { useEventResize } from '@/hooks/useEventResize';
import '@/styles/calendar-resize.css';
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
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: string; time: string; startTime?: string; endTime?: string } | null>(null);
  
  // Study Session Modal state
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  // Drag and Drop state for existing events
  const [draggedEvent, setDraggedEvent] = useState<any>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{day: number; time: string} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Drag to create state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{day: number; time: string} | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{day: number; time: string} | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Resize hook
  const { resizeState, handleResizeStart, getResizeTimeLabel } = useEventResize(updateScheduleEvent);
  
  // Scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      // Scroll to 2 hours before current time (adjusted for 30-min slots)
      const currentSlot = (currentHour * 2) + (currentMinute >= 30 ? 1 : 0);
      const scrollPosition = Math.max(0, (currentSlot - 4) * 40); // 40px per 30-min slot
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, [viewMode]);
  
  // Generate time slots for 24 hours in 30-minute intervals (48 slots)
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
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
  
  // Memoize week events calculation
  const weekEvents = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const events = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      events.push({
        date: new Date(date),
        events: getEventsForDate(date)
      });
    }
    return events;
  }, [currentDate, state.scheduleEvents]);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const formatTime = (timeString: string) => {
    return format(new Date(timeString), 'h:mm a'); // 12-hour format with AM/PM
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
    const [hours, minutes] = timeSlot.split(':').map(Number);
    
    // Create start time
    let startTime = new Date(date);
    startTime = setHours(startTime, hours);
    startTime = setMinutes(startTime, minutes);
    startTime = setSeconds(startTime, 0);
    startTime = setMilliseconds(startTime, 0);
    
    // Create end time (1 hour later by default)
    let endTime = new Date(startTime);
    endTime = setHours(endTime, hours + 1);
    
    setSelectedTimeSlot({
      date: format(date, 'yyyy-MM-dd'),
      time: timeSlot,
      startTime: format(startTime, "yyyy-MM-dd'T'HH:mm:ss"),
      endTime: format(endTime, "yyyy-MM-dd'T'HH:mm:ss"),
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

  // Drag existing event handlers
  const handleDragStart = (e: React.DragEvent, event: any) => {
    setDraggedEvent(event);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setIsDragging(false);
    setDragOverSlot(null);
  };

  const handleDragOver = (e: React.DragEvent, dayIndex: number, timeSlot: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot({ day: dayIndex, time: timeSlot });
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = async (e: React.DragEvent, date: Date, timeSlot: string) => {
    e.preventDefault();
    
    if (!draggedEvent) return;

    try {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      
      // Snap to 15-minute intervals
      const totalMinutes = hours * 60 + minutes;
      const snappedMinutes = roundToQuarterHour(totalMinutes);
      const snappedHours = Math.floor(snappedMinutes / 60);
      const snappedMins = snappedMinutes % 60;
      
      // Create new start time using date-fns to avoid timezone issues
      let newStartTime = new Date(date);
      newStartTime = setHours(newStartTime, snappedHours);
      newStartTime = setMinutes(newStartTime, snappedMins);
      newStartTime = setSeconds(newStartTime, 0);
      newStartTime = setMilliseconds(newStartTime, 0);

      const originalStart = new Date(draggedEvent.startTime);
      const originalEnd = new Date(draggedEvent.endTime);
      const duration = originalEnd.getTime() - originalStart.getTime();

      const newEndTime = new Date(newStartTime.getTime() + duration);

      const updatedEvent = {
        ...draggedEvent,
        startTime: newStartTime.toISOString(),
        endTime: newEndTime.toISOString()
      };

      updateScheduleEvent(updatedEvent);
    } catch (error) {
      console.error('Error moving event:', error);
    } finally {
      setDraggedEvent(null);
      setDragOverSlot(null);
    }
  };

  // Helper: Convert time slot to minutes since midnight
  const timeToMinutes = (timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper: Round to nearest 15 minutes for snapping
  const roundToQuarterHour = (minutes: number) => {
    return Math.round(minutes / 15) * 15;
  };

  // Drag to create handlers with 15-minute snapping
  const handleMouseDown = (e: React.MouseEvent, dayIndex: number, timeSlot: string) => {
    if ((e.target as HTMLElement).closest('.event-block')) return;
    
    setIsSelecting(true);
    setSelectionStart({ day: dayIndex, time: timeSlot });
    setSelectionEnd({ day: dayIndex, time: timeSlot });
  };

  const handleMouseEnter = (dayIndex: number, timeSlot: string) => {
    if (isSelecting && selectionStart && selectionStart.day === dayIndex) {
      setSelectionEnd({ day: dayIndex, time: timeSlot });
    }
  };

  const handleMouseUp = () => {
    if (isSelecting && selectionStart && selectionEnd) {
      const startMinutes = timeToMinutes(selectionStart.time);
      const endMinutes = timeToMinutes(selectionEnd.time);
      
      // Snap to 15-minute intervals
      const snappedStart = roundToQuarterHour(Math.min(startMinutes, endMinutes));
      const snappedEnd = roundToQuarterHour(Math.max(startMinutes, endMinutes) + 30); // Add 30 to include end slot
      
      const startHour = Math.floor(snappedStart / 60);
      const startMin = snappedStart % 60;
      const endHour = Math.floor(snappedEnd / 60);
      const endMin = snappedEnd % 60;
      
      const selectedDate = weekEvents[selectionStart.day].date;
      
      // Create start and end times with 15-minute precision using date-fns
      let startTime = new Date(selectedDate);
      startTime = setHours(startTime, startHour);
      startTime = setMinutes(startTime, startMin);
      startTime = setSeconds(startTime, 0);
      startTime = setMilliseconds(startTime, 0);
      
      let endTime = new Date(selectedDate);
      endTime = setHours(endTime, endHour);
      endTime = setMinutes(endTime, endMin);
      endTime = setSeconds(endTime, 0);
      endTime = setMilliseconds(endTime, 0);
      
      setSelectedTimeSlot({
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`,
        startTime: format(startTime, "yyyy-MM-dd'T'HH:mm:ss"),
        endTime: format(endTime, "yyyy-MM-dd'T'HH:mm:ss"),
      });
      
      setEditingEventId(null);
      setShowEventModal(true);
    }
    
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  useEffect(() => {
    if (isSelecting) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isSelecting, selectionStart, selectionEnd]);

  const isInSelection = (dayIndex: number, timeSlot: string) => {
    if (!isSelecting || !selectionStart || !selectionEnd || selectionStart.day !== dayIndex) {
      return false;
    }
    
    const currentMinutes = timeToMinutes(timeSlot);
    const startMinutes = timeToMinutes(selectionStart.time);
    const endMinutes = timeToMinutes(selectionEnd.time);
    
    const minMinutes = Math.min(startMinutes, endMinutes);
    const maxMinutes = Math.max(startMinutes, endMinutes);
    
    return currentMinutes >= minMinutes && currentMinutes <= maxMinutes;
  };

  // Get floating time label for drag selection
  const getSelectionTimeLabel = () => {
    if (!isSelecting || !selectionStart || !selectionEnd) return '';
    
    const startMinutes = timeToMinutes(selectionStart.time);
    const endMinutes = timeToMinutes(selectionEnd.time);
    
    const snappedStart = roundToQuarterHour(Math.min(startMinutes, endMinutes));
    const snappedEnd = roundToQuarterHour(Math.max(startMinutes, endMinutes) + 30);
    
    const formatTimeLabel = (totalMinutes: number) => {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      
      // Create a date object for proper formatting
      const selectedDate = weekEvents[selectionStart.day].date;
      let tempDate = new Date(selectedDate);
      tempDate = setHours(tempDate, hours);
      tempDate = setMinutes(tempDate, mins);
      
      return format(tempDate, 'h:mm a'); // 12-hour format
    };
    
    return `${formatTimeLabel(snappedStart)} – ${formatTimeLabel(snappedEnd)}`;
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
  
  // Calculate event style for absolute positioning
  const calculateEventStyle = (event: any): React.CSSProperties => {
    const PIXELS_PER_MINUTE = 40 / 30; // 1.33px per minute
    
    // Use temp event if this event is being resized
    const activeEvent = resizeState.resizingEventId === event.id && resizeState.tempEvent 
      ? resizeState.tempEvent 
      : event;
    
    const start = new Date(activeEvent.startTime);
    const end = new Date(activeEvent.endTime);
    
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const duration = endMinutes - startMinutes;
    
    return {
      position: 'absolute',
      top: `${startMinutes * PIXELS_PER_MINUTE}px`,
      height: `${Math.max(duration * PIXELS_PER_MINUTE, 20)}px`,
      width: 'calc(100% - 8px)',
      left: '4px',
      right: '4px',
      zIndex: resizeState.resizingEventId === event.id ? 20 : 10
    };
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
            defaultStartTime={selectedTimeSlot?.startTime}
            defaultEndTime={selectedTimeSlot?.endTime}
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
            <p className="text-muted-foreground">
              Plan and organize your study time • 
              <span className="text-blue-600 dark:text-blue-400 font-medium"> ✨ Drag to create or move events!</span>
            </p>
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
                {weekEvents.map(({ date }, index) => {
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
                className="max-h-[600px] overflow-y-auto relative"
              >
                {/* Floating time label during drag selection */}
                {isSelecting && selectionStart && (
                  <div 
                    className="fixed z-50 bg-blue-600 text-white px-3 py-1 rounded-md shadow-lg text-sm font-medium pointer-events-none"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {getSelectionTimeLabel()}
                  </div>
                )}
                
                {/* Floating time label during resize */}
                {resizeState.isResizing && resizeState.tempEvent && (
                  <div 
                    className="resize-time-label"
                    style={{
                      left: '50%',
                      top: '50%'
                    }}
                  >
                    {getResizeTimeLabel()}
                  </div>
                )}
                
                <div className="grid grid-cols-8 gap-0">
                  {/* Time column */}
                  <div className="border-r">
                    {timeSlots.map((timeSlot) => {
                      const isHourMark = timeSlot.endsWith(':00');
                      return (
                        <div 
                          key={timeSlot}
                          className={`p-2 ${isHourMark ? 'bg-muted/20 border-b-2' : 'bg-muted/5 border-b'} h-[40px] flex items-start`}
                        >
                          <p className={`text-xs ${isHourMark ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground'}`}>
                            {format(new Date(`2000-01-01T${timeSlot}`), 'h:mm a')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Day columns with grid and events layers */}
                  {weekEvents.map(({ date, events }, dayIndex) => (
                    <div key={dayIndex} className="calendar-day-column border-r">
                      {/* Grid layer for clicking */}
                      <div className="grid-layer">
                        {timeSlots.map((timeSlot) => {
                          const isHourMark = timeSlot.endsWith(':00');
                          const isCurrentSlot = isCurrentTimeSlot(date, timeSlot);
                          
                          return (
                            <div
                              key={timeSlot}
                              className={`grid-cell ${isHourMark ? 'border-b-2' : ''} hover:bg-muted/20 cursor-pointer transition-colors ${
                                isCurrentSlot ? 'bg-blue-50/50 dark:bg-blue-950/50' : ''
                              } ${
                                isInSelection(dayIndex, timeSlot) 
                                  ? 'bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-400 border-dashed' 
                                  : ''
                              } ${
                                dragOverSlot?.day === dayIndex && dragOverSlot?.time === timeSlot 
                                  ? 'bg-green-100 dark:bg-green-900/50 border-2 border-green-400 border-dashed' 
                                  : ''
                              }`}
                              onClick={() => handleTimeSlotClick(date, timeSlot)}
                              onMouseDown={(e) => handleMouseDown(e, dayIndex, timeSlot)}
                              onMouseEnter={() => handleMouseEnter(dayIndex, timeSlot)}
                              onDragOver={(e) => handleDragOver(e, dayIndex, timeSlot)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, date, timeSlot)}
                            >
                              {isCurrentSlot && (
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-10" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Events layer with absolute positioning */}
                      <div className="events-layer">
                        {events.map(event => (
                          <EventBlock
                            key={event.id}
                            event={event}
                            style={calculateEventStyle(event)}
                            onResizeStart={handleResizeStart}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onClick={() => {
                              setSelectedEventId(event.id);
                              setShowSessionModal(true);
                            }}
                            onEdit={() => handleEditEvent(event.id)}
                            onDelete={() => {
                              if (confirm('Delete this event?')) {
                                deleteScheduleEvent(event.id);
                              }
                            }}
                            isResizing={resizeState.resizingEventId === event.id}
                            isDragging={isDragging && draggedEvent?.id === event.id}
                            getEventColor={getEventColor}
                            getStatusColor={getStatusColor}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
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
        defaultStartTime={selectedTimeSlot?.startTime}
        defaultEndTime={selectedTimeSlot?.endTime}
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
