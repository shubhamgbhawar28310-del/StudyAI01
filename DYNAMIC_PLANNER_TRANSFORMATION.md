# 🚀 Dynamic Study Planner Transformation Guide

## 📋 Overview

Transform the static timetable into a dynamic, data-driven Study Planner that:
- Shows actual user events (not empty slots)
- Integrates seamlessly with Task Manager
- Supports drag-and-drop scheduling
- Provides AI-powered auto-scheduling
- Updates in real-time

---

## 🎯 Transformation Goals

### ❌ Remove
- Static time slot grid (6:00-22:00 empty slots)
- Predefined weekly structure
- Meaningless empty cells

### ✅ Add
- Dynamic calendar view (react-big-calendar)
- Real-time event display
- Drag-and-drop scheduling
- Task integration sidebar
- Auto-schedule AI feature
- Interactive event editing

---

## 📦 Required Dependencies

```bash
npm install react-big-calendar date-fns
npm install @types/react-big-calendar --save-dev
```

**Why react-big-calendar?**
- Mature, well-maintained library
- Built-in drag-and-drop support
- Multiple view modes (day, week, month)
- Customizable styling
- TypeScript support

---

## 🗄️ Database Schema (Already Done!)

The `TASK_PLANNER_INTEGRATION.sql` migration already set up:
- ✅ Foreign key: `schedule_events.task_id → tasks.id`
- ✅ Status tracking: `scheduled`, `in_progress`, `completed`, `missed`
- ✅ Timestamps: `started_at`, `completed_at`
- ✅ Unified view: `task_schedule_view`
- ✅ Auto-sync trigger

---

## 🎨 New Component Structure

```
src/components/features/
├── DynamicScheduleView.tsx          # Main calendar component
├── ScheduleEventModal.tsx           # Create/Edit event modal (enhanced)
├── TaskScheduleSidebar.tsx          # Unscheduled tasks sidebar
├── AutoScheduleDialog.tsx           # Auto-schedule confirmation
└── EventTooltip.tsx                 # Hover tooltip for events
```

---

## 🔧 Implementation Steps

### Step 1: Install Dependencies

```bash
npm install react-big-calendar date-fns
npm install @types/react-big-calendar --save-dev
```

### Step 2: Create Calendar Event Type

```typescript
// src/types/calendar.ts

import { ScheduleEvent, Task } from '@/contexts/StudyPlannerContext';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    scheduleEvent: ScheduleEvent;
    task?: Task;
    status: 'scheduled' | 'in_progress' | 'completed' | 'missed';
    type: 'task' | 'study' | 'break' | 'other';
    hasAttachments: boolean;
    isAutoScheduled: boolean;
  };
}

export function convertToCalendarEvent(
  event: ScheduleEvent,
  task?: Task
): CalendarEvent {
  return {
    id: event.id,
    title: event.title,
    start: new Date(event.startTime),
    end: new Date(event.endTime),
    resource: {
      scheduleEvent: event,
      task,
      status: event.status || 'scheduled',
      type: event.type,
      hasAttachments: task ? (task.materialIds?.length || 0) > 0 : false,
      isAutoScheduled: event.color === 'bg-blue-500' // or add a flag
    }
  };
}
```

### Step 3: Create Dynamic Schedule View

```typescript
// src/components/features/DynamicScheduleView.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStudyPlanner } from '@/contexts/StudyPlannerContext';
import { ScheduleEventModal } from '@/components/modals/ScheduleEventModal';
import { TaskScheduleSidebar } from './TaskScheduleSidebar';
import { AutoScheduleDialog } from './AutoScheduleDialog';
import { EventTooltip } from './EventTooltip';
import { CalendarEvent, convertToCalendarEvent } from '@/types/calendar';
import {
  Calendar as CalendarIcon,
  Plus,
  Sparkles,
  Filter,
  Download,
  Settings,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Setup date-fns localizer
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface DynamicScheduleViewProps {
  compactMode?: boolean;
  showHeader?: boolean;
}

export function DynamicScheduleView({ 
  compactMode = false, 
  showHeader = true 
}: DynamicScheduleViewProps) {
  const {
    state,
    addScheduleEvent,
    updateScheduleEvent,
    deleteScheduleEvent,
    getTaskForEvent,
    getUnscheduledTasks,
    completeScheduleEvent,
    startScheduleEvent
  } = useStudyPlanner();
  
  const { toast } = useToast();
  
  // State
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAutoSchedule, setShowAutoSchedule] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null);
  
  // Convert schedule events to calendar events
  const calendarEvents = useMemo(() => {
    return state.scheduleEvents.map(event => {
      const task = event.taskId ? getTaskForEvent(event.id) : undefined;
      return convertToCalendarEvent(event, task);
    });
  }, [state.scheduleEvents, state.tasks]);
  
  // Get unscheduled tasks
  const unscheduledTasks = getUnscheduledTasks();
  
  // Event style getter
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const { status, type, isAutoScheduled } = event.resource;
    
    let backgroundColor = '#3174ad'; // default blue
    let borderColor = '#265985';
    
    // Status-based colors
    if (status === 'completed') {
      backgroundColor = '#10b981'; // green
      borderColor = '#059669';
    } else if (status === 'in_progress') {
      backgroundColor = '#f59e0b'; // yellow
      borderColor = '#d97706';
    } else if (status === 'missed') {
      backgroundColor = '#ef4444'; // red
      borderColor = '#dc2626';
    } else if (isAutoScheduled) {
      backgroundColor = '#6366f1'; // indigo
      borderColor = '#4f46e5';
    }
    
    // Type-based adjustments
    if (type === 'break') {
      backgroundColor = '#8b5cf6'; // purple
      borderColor = '#7c3aed';
    }
    
    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '6px',
        color: 'white',
        fontSize: '0.875rem',
        padding: '4px 8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }
    };
  }, []);
  
  // Handle slot selection (click on empty space)
  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    setSelectedSlot(slotInfo);
    setSelectedEvent(null);
    setShowEventModal(true);
  }, []);
  
  // Handle event selection (click on existing event)
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedSlot(null);
    setShowEventModal(true);
  }, []);
  
  // Handle event drag and drop
  const handleEventDrop = useCallback(({ event, start, end }: {
    event: CalendarEvent;
    start: Date;
    end: Date;
  }) => {
    const updatedEvent = {
      ...event.resource.scheduleEvent,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };
    
    updateScheduleEvent(updatedEvent);
    
    toast({
      title: '✅ Event Rescheduled',
      description: `Moved to ${format(start, 'MMM d, h:mm a')}`,
    });
  }, [updateScheduleEvent, toast]);
  
  // Handle event resize
  const handleEventResize = useCallback(({ event, start, end }: {
    event: CalendarEvent;
    start: Date;
    end: Date;
  }) => {
    const updatedEvent = {
      ...event.resource.scheduleEvent,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };
    
    updateScheduleEvent(updatedEvent);
    
    toast({
      title: '✅ Event Updated',
      description: 'Duration changed',
    });
  }, [updateScheduleEvent, toast]);
  
  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const { task, hasAttachments, isAutoScheduled, status } = event.resource;
    
    return (
      <div
        className="flex items-center gap-1 h-full"
        onMouseEnter={() => setHoveredEvent(event)}
        onMouseLeave={() => setHoveredEvent(null)}
      >
        {/* Status icon */}
        {status === 'completed' && <span className="text-xs">✓</span>}
        {status === 'in_progress' && <span className="text-xs animate-pulse">⏱</span>}
        {status === 'missed' && <span className="text-xs">✗</span>}
        
        {/* Event title */}
        <span className="flex-1 truncate font-medium">{event.title}</span>
        
        {/* Indicators */}
        <div className="flex items-center gap-0.5">
          {task && <span className="text-xs">📎</span>}
          {isAutoScheduled && <span className="text-xs">⚡</span>}
          {hasAttachments && <span className="text-xs">📁</span>}
        </div>
      </div>
    );
  };
  
  // Custom toolbar
  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
    };
    
    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };
    
    const goToToday = () => {
      toolbar.onNavigate('TODAY');
    };
    
    return (
      <div className="flex items-center justify-between mb-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToBack}>
            ←
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNext}>
            →
          </Button>
          <h3 className="text-lg font-semibold ml-4">
            {toolbar.label}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('day')}
          >
            Day
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('week')}
          >
            Week
          </Button>
          <Button
            variant={view === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('month')}
          >
            Month
          </Button>
        </div>
      </div>
    );
  };
  
  if (compactMode) {
    // Compact view for dashboard
    const todayEvents = calendarEvents.filter(event => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDate = new Date(event.start);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime();
    });
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="h-4 w-4" />
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
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted"
                  onClick={() => handleSelectEvent(event)}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: eventStyleGetter(event).style.backgroundColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                    </p>
                  </div>
                  {event.resource.task && (
                    <Badge variant="outline" className="text-xs">
                      {event.resource.task.priority}
                    </Badge>
                  )}
                </div>
              ))}
              {todayEvents.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{todayEvents.length - 3} more events
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Study Planner</h2>
            <p className="text-muted-foreground">
              Dynamic calendar with {calendarEvents.length} scheduled events
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowSidebar(!showSidebar)}
              variant="outline"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showSidebar ? 'Hide' : 'Show'} Tasks
              {unscheduledTasks.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unscheduledTasks.length}
                </Badge>
              )}
            </Button>
            <Button
              onClick={() => setShowAutoSchedule(true)}
              variant="outline"
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0"
              disabled={unscheduledTasks.length === 0}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Auto Schedule
            </Button>
            <Button
              onClick={() => {
                setSelectedEvent(null);
                setSelectedSlot(null);
                setShowEventModal(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{calendarEvents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {calendarEvents.filter(e => e.resource.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">
                  {calendarEvents.filter(e => e.resource.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Unscheduled</p>
                <p className="text-2xl font-bold">{unscheduledTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Calendar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <TaskScheduleSidebar
                tasks={unscheduledTasks}
                onTaskSchedule={(task, slot) => {
                  // Handle task drop from sidebar
                  addScheduleEvent({
                    title: task.title,
                    description: task.description,
                    startTime: slot.start.toISOString(),
                    endTime: slot.end.toISOString(),
                    type: 'task',
                    taskId: task.id,
                    status: 'scheduled'
                  });
                  
                  toast({
                    title: '✅ Task Scheduled',
                    description: `${task.title} scheduled for ${format(slot.start, 'MMM d, h:mm a')}`,
                  });
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Calendar */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div style={{ height: '700px' }} className="p-4">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                selectable
                resizable
                draggableAccessor={() => true}
                eventPropGetter={eventStyleGetter}
                components={{
                  event: EventComponent,
                  toolbar: CustomToolbar,
                }}
                step={30}
                timeslots={2}
                min={new Date(2024, 0, 1, 6, 0, 0)}
                max={new Date(2024, 0, 1, 23, 0, 0)}
                formats={{
                  timeGutterFormat: 'h a',
                  eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
                    `${localizer?.format(start, 'h:mm a', culture)} - ${localizer?.format(end, 'h:mm a', culture)}`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Event Tooltip */}
      {hoveredEvent && (
        <EventTooltip event={hoveredEvent} />
      )}
      
      {/* Modals */}
      <ScheduleEventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
          setSelectedSlot(null);
        }}
        editingEvent={selectedEvent}
        defaultSlot={selectedSlot}
      />
      
      <AutoScheduleDialog
        isOpen={showAutoSchedule}
        onClose={() => setShowAutoSchedule(false)}
        unscheduledTasks={unscheduledTasks}
      />
    </div>
  );
}
```

---

## 📝 Summary

This transformation:
1. ✅ Removes static time slots
2. ✅ Shows only actual user events
3. ✅ Enables drag-and-drop scheduling
4. ✅ Integrates with Task Manager
5. ✅ Provides auto-schedule feature
6. ✅ Real-time updates
7. ✅ Visual status indicators
8. ✅ Interactive event editing

The planner is now a **living, breathing calendar** that adapts to user data!

---

**Next**: Implement the supporting components (TaskScheduleSidebar, AutoScheduleDialog, EventTooltip)
