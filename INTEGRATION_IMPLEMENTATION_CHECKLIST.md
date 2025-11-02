# ✅ Task & Planner Integration - Implementation Checklist

## 🚀 Quick Start Guide

### Step 1: Run Database Migration (5 minutes)

```bash
# Navigate to your Supabase dashboard
# Go to SQL Editor
# Copy and paste the contents of: supabase/migrations/TASK_PLANNER_INTEGRATION.sql
# Click "Run"
```

**What this does:**
- ✅ Adds `status`, `started_at`, `completed_at` columns to `schedule_events`
- ✅ Adds `status` column to `tasks`
- ✅ Creates foreign key constraint between tasks and events
- ✅ Creates indexes for performance
- ✅ Creates unified view `task_schedule_view`
- ✅ Creates automatic status sync trigger
- ✅ Creates helper functions for scheduling

---

### Step 2: Update StudyPlannerContext (15 minutes)

Add the integration helper functions to your context:

```typescript
// In src/contexts/StudyPlannerContext.tsx

import {
  getScheduleEventsByTask,
  getTaskForEvent,
  getUnscheduledTasks,
  getSuggestedTimeSlots,
  autoScheduleTasks,
  syncTaskEventStatus,
  checkTimeSlotConflict,
  getProductivityStats,
  type TimeSlot,
  type ScheduleSuggestion
} from './TaskPlannerIntegration';

// Add to context interface
interface StudyPlannerContextType {
  // ... existing properties
  
  // New integration functions
  getScheduleEventsByTask: (taskId: string) => ScheduleEvent[]
  getTaskForEvent: (eventId: string) => Task | undefined
  getUnscheduledTasks: () => Task[]
  getSuggestedTimeSlots: (task: Task) => TimeSlot[]
  autoScheduleTasks: () => ScheduleSuggestion[]
  linkTaskToEvent: (taskId: string, eventId: string) => void
  unlinkTaskFromEvent: (eventId: string) => void
  completeScheduleEvent: (eventId: string) => void
  startScheduleEvent: (eventId: string) => void
  checkTimeSlotConflict: (startTime: Date, endTime: Date) => boolean
}

// Implement in provider
export function StudyPlannerProvider({ children }: { children: ReactNode }) {
  // ... existing code
  
  // New integration functions
  const getScheduleEventsByTaskFn = (taskId: string) => {
    return getScheduleEventsByTask(state.scheduleEvents, taskId);
  };
  
  const getTaskForEventFn = (eventId: string) => {
    return getTaskForEvent(state.tasks, eventId, state.scheduleEvents);
  };
  
  const getUnscheduledTasksFn = () => {
    return getUnscheduledTasks(state.tasks, state.scheduleEvents);
  };
  
  const getSuggestedTimeSlotsFn = (task: Task) => {
    return getSuggestedTimeSlots(task, state.scheduleEvents);
  };
  
  const autoScheduleTasksFn = () => {
    return autoScheduleTasks(state.tasks, state.scheduleEvents);
  };
  
  const linkTaskToEvent = (taskId: string, eventId: string) => {
    const event = state.scheduleEvents.find(e => e.id === eventId);
    if (event) {
      updateScheduleEvent({ ...event, taskId });
    }
  };
  
  const unlinkTaskFromEvent = (eventId: string) => {
    const event = state.scheduleEvents.find(e => e.id === eventId);
    if (event) {
      updateScheduleEvent({ ...event, taskId: undefined });
    }
  };
  
  const completeScheduleEvent = (eventId: string) => {
    const event = state.scheduleEvents.find(e => e.id === eventId);
    if (event) {
      const updatedEvent = {
        ...event,
        status: 'completed' as const,
        completedAt: new Date().toISOString()
      };
      updateScheduleEvent(updatedEvent);
      
      // Sync task status
      if (event.taskId) {
        const task = state.tasks.find(t => t.id === event.taskId);
        if (task) {
          updateTask({
            ...task,
            completed: true,
            status: 'completed',
            updatedAt: new Date().toISOString()
          });
        }
      }
    }
  };
  
  const startScheduleEvent = (eventId: string) => {
    const event = state.scheduleEvents.find(e => e.id === eventId);
    if (event) {
      const updatedEvent = {
        ...event,
        status: 'in_progress' as const,
        startedAt: new Date().toISOString()
      };
      updateScheduleEvent(updatedEvent);
      
      // Sync task status
      if (event.taskId) {
        const task = state.tasks.find(t => t.id === event.taskId);
        if (task && task.status === 'pending') {
          updateTask({
            ...task,
            status: 'in_progress',
            updatedAt: new Date().toISOString()
          });
        }
      }
    }
  };
  
  const checkTimeSlotConflictFn = (startTime: Date, endTime: Date) => {
    const conflict = checkTimeSlotConflict(state.scheduleEvents, startTime, endTime);
    return conflict.hasConflict;
  };
  
  // Add to context value
  const value = {
    // ... existing values
    getScheduleEventsByTask: getScheduleEventsByTaskFn,
    getTaskForEvent: getTaskForEventFn,
    getUnscheduledTasks: getUnscheduledTasksFn,
    getSuggestedTimeSlots: getSuggestedTimeSlotsFn,
    autoScheduleTasks: autoScheduleTasksFn,
    linkTaskToEvent,
    unlinkTaskFromEvent,
    completeScheduleEvent,
    startScheduleEvent,
    checkTimeSlotConflict: checkTimeSlotConflictFn
  };
  
  return (
    <StudyPlannerContext.Provider value={value}>
      {children}
    </StudyPlannerContext.Provider>
  );
}
```

---

### Step 3: Update TaskModal (20 minutes)

Add scheduling section to TaskModal:

```typescript
// In src/components/modals/TaskModal.tsx

import { useState, useEffect } from 'react';
import { formatTimeSlot } from '@/contexts/TaskPlannerIntegration';

export function TaskModal({ isOpen, onClose, editingTaskId }: TaskModalProps) {
  const { getSuggestedTimeSlots, addScheduleEvent } = useStudyPlanner();
  
  const [showScheduling, setShowScheduling] = useState(false);
  const [suggestedSlots, setSuggestedSlots] = useState<TimeSlot[]>([]);
  
  // Get suggestions when task details change
  useEffect(() => {
    if (formData.title && formData.priority && formData.dueDate) {
      const mockTask = {
        id: 'temp',
        title: formData.title,
        priority: formData.priority,
        dueDate: formData.dueDate,
        // ... other fields
      };
      
      const slots = getSuggestedTimeSlots(mockTask);
      setSuggestedSlots(slots);
    }
  }, [formData.title, formData.priority, formData.dueDate]);
  
  const handleScheduleTask = (slot: TimeSlot, taskId: string) => {
    const startDateTime = new Date(`${slot.date}T${slot.startTime}:00`);
    const endDateTime = new Date(`${slot.date}T${slot.endTime}:00`);
    
    addScheduleEvent({
      title: formData.title,
      description: formData.description,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      type: 'task',
      taskId: taskId,
      status: 'scheduled'
    });
    
    toast({
      title: '✅ Task Scheduled',
      description: `Scheduled for ${formatTimeSlot(slot)}`
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        {/* Existing tabs */}
        <Tabs defaultValue="basic">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="schedule">📅 Schedule</TabsTrigger>
          </TabsList>
          
          {/* Existing tabs content */}
          
          {/* New Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <div>
              <h3 className="font-medium mb-3">Schedule This Task</h3>
              
              {suggestedSlots.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-muted-foreground">
                    Suggested time slots:
                  </p>
                  {suggestedSlots.map(slot => (
                    <Button
                      key={slot.id}
                      variant="outline"
                      onClick={() => {
                        // Save task first, then schedule
                        const taskId = handleSubmit(); // Modified to return taskId
                        handleScheduleTask(slot, taskId);
                      }}
                      className="w-full justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatTimeSlot(slot)}
                      </span>
                      <Badge variant="secondary">{slot.reason}</Badge>
                    </Button>
                  ))}
                </div>
              )}
              
              <Button
                variant="outline"
                onClick={() => {
                  // Open schedule picker
                  setShowScheduling(true);
                }}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Choose Custom Time
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Step 4: Update ScheduleView (30 minutes)

Add unscheduled tasks sidebar:

```typescript
// In src/components/features/ScheduleView.tsx

export function ScheduleView() {
  const { getUnscheduledTasks, addScheduleEvent } = useStudyPlanner();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  
  const unscheduledTasks = getUnscheduledTasks();
  
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e: React.DragEvent, date: Date, timeSlot: string) => {
    e.preventDefault();
    
    if (!draggedTask) return;
    
    const [hours, minutes] = timeSlot.split(':');
    const startTime = new Date(date);
    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);
    
    addScheduleEvent({
      title: draggedTask.title,
      description: draggedTask.description,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      type: 'task',
      taskId: draggedTask.id,
      status: 'scheduled'
    });
    
    setDraggedTask(null);
    
    toast({
      title: '✅ Task Scheduled',
      description: `${draggedTask.title} scheduled for ${formatDate(date)} at ${timeSlot}`
    });
  };
  
  return (
    <div className="grid grid-cols-[300px_1fr] gap-4">
      {/* Unscheduled Tasks Sidebar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Unscheduled Tasks</span>
            <Badge variant="secondary">{unscheduledTasks.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {unscheduledTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              All tasks are scheduled! 🎉
            </p>
          ) : (
            unscheduledTasks.map(task => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                className="p-3 border rounded-lg cursor-move hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={getPriorityColor(task.priority)} size="sm">
                    {task.priority}
                  </Badge>
                  <p className="text-sm font-medium truncate flex-1">
                    {task.title}
                  </p>
                </div>
                {task.dueDate && (
                  <p className="text-xs text-muted-foreground">
                    Due: {formatDate(task.dueDate)}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
      
      {/* Calendar Grid with Drop Zones */}
      <Card>
        <CardContent className="p-0">
          {/* Week view with drop zones */}
          <div className="max-h-96 overflow-y-auto">
            {timeSlots.map(timeSlot => (
              <div key={timeSlot} className="grid grid-cols-8 gap-0 border-b">
                <div className="p-2 border-r bg-muted/10">
                  <p className="text-xs">{timeSlot}</p>
                </div>
                {getEventsForWeek().map(({ date, events }, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="border-r p-1 hover:bg-muted/20 cursor-pointer relative"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, date, timeSlot)}
                  >
                    {/* Existing events */}
                    {events.map(event => (
                      <EventBlock key={event.id} event={event} />
                    ))}
                    
                    {/* Drop zone indicator */}
                    {draggedTask && (
                      <div className="absolute inset-0 border-2 border-dashed border-blue-400 bg-blue-50/50 rounded pointer-events-none" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Step 5: Enhance Event Display (15 minutes)

Show task details in schedule blocks:

```typescript
// Create EventBlock component
function EventBlock({ event }: { event: ScheduleEvent }) {
  const { getTaskForEvent, completeScheduleEvent } = useStudyPlanner();
  const [showDetails, setShowDetails] = useState(false);
  
  const task = event.taskId ? getTaskForEvent(event.id) : undefined;
  const hasAttachments = task && (task.materialIds?.length || 0) > 0;
  
  return (
    <div
      className={`relative text-xs p-2 rounded mb-1 text-white ${getEventColor(event.type)} group`}
      onClick={() => setShowDetails(true)}
    >
      {/* Status indicator */}
      {event.status === 'completed' && (
        <CheckCircle className="h-3 w-3 text-green-300 absolute top-1 right-1" />
      )}
      {event.status === 'in_progress' && (
        <Clock className="h-3 w-3 text-yellow-300 absolute top-1 right-1 animate-pulse" />
      )}
      
      {/* Event info */}
      <div className="flex items-center gap-1 mb-1">
        <p className="font-medium truncate flex-1">{event.title}</p>
        {task && (
          <Badge variant="outline" className="text-[10px] px-1 py-0">
            {task.priority}
          </Badge>
        )}
        {hasAttachments && (
          <PaperclipIcon className="h-3 w-3 opacity-70" />
        )}
      </div>
      
      <p className="opacity-90 text-[10px]">
        {formatTime(event.startTime)} - {formatTime(event.endTime)}
      </p>
      
      {/* Hover actions */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        {event.status !== 'completed' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              completeScheduleEvent(event.id);
            }}
            className="h-5 w-5 p-0 text-white hover:bg-white/20"
            title="Mark Complete"
          >
            <CheckCircle className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {/* Detail Modal */}
      {showDetails && (
        <EventDetailModal
          event={event}
          task={task}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
}
```

---

## 📋 Complete Implementation Checklist

### Database (Day 1)
- [ ] Run migration SQL in Supabase
- [ ] Verify foreign key constraint
- [ ] Test trigger functionality
- [ ] Check RLS policies
- [ ] Verify indexes created

### Context (Day 2)
- [ ] Import integration helpers
- [ ] Add new functions to context interface
- [ ] Implement all integration functions
- [ ] Test state updates
- [ ] Verify Supabase sync

### TaskModal (Day 3)
- [ ] Add schedule tab
- [ ] Implement time slot suggestions
- [ ] Add schedule button
- [ ] Test task creation + scheduling
- [ ] Add validation

### ScheduleView (Day 4)
- [ ] Add unscheduled tasks sidebar
- [ ] Implement drag-and-drop
- [ ] Add drop zones
- [ ] Test scheduling flow
- [ ] Add visual feedback

### Event Display (Day 5)
- [ ] Create EventBlock component
- [ ] Show task details
- [ ] Add status indicators
- [ ] Add quick actions
- [ ] Test completion flow

### TaskDetailModal (Day 6)
- [ ] Add schedule tab
- [ ] Show scheduled events
- [ ] Add schedule button
- [ ] Test integration
- [ ] Add error handling

### Testing (Day 7)
- [ ] Test all user flows
- [ ] Test status synchronization
- [ ] Test drag-and-drop
- [ ] Test auto-schedule
- [ ] Test edge cases
- [ ] Performance testing
- [ ] Mobile testing

---

## 🧪 Testing Scenarios

### Scenario 1: Create Task and Schedule
1. Click "Add Task"
2. Fill in task details
3. Go to Schedule tab
4. See suggested time slots
5. Click a suggestion
6. Verify task created
7. Verify event created
8. Check both views updated

### Scenario 2: Drag Task to Calendar
1. See unscheduled task in sidebar
2. Drag to calendar slot
3. See drop zone highlight
4. Drop task
5. Verify event created
6. Verify task removed from sidebar
7. Check task linked to event

### Scenario 3: Complete Event
1. Click event in calendar
2. Click "Mark Complete"
3. Verify event status updated
4. Verify task status updated
5. Check XP awarded
6. Verify both views updated

### Scenario 4: Auto-Schedule
1. Have multiple unscheduled tasks
2. Click "Auto Schedule"
3. See preview of suggestions
4. Accept suggestions
5. Verify all events created
6. Check calendar updated
7. Verify no conflicts

---

## 🚨 Common Issues & Solutions

### Issue: Foreign key constraint fails
**Solution**: Run the cleanup query in the migration to remove orphaned references

### Issue: Status not syncing
**Solution**: Check that the trigger is created and enabled

### Issue: Drag-and-drop not working
**Solution**: Ensure `draggable` attribute is set and event handlers are correct

### Issue: Suggestions not showing
**Solution**: Verify task has priority and due date set

### Issue: Performance slow with many events
**Solution**: Check indexes are created, use memoization

---

## 📊 Success Metrics

After implementation, you should see:
- ✅ 80%+ of tasks get scheduled
- ✅ < 2s page load time
- ✅ < 500ms sync latency
- ✅ 90%+ task completion rate
- ✅ Zero data inconsistencies

---

## 🎉 You're Done!

Once all checkboxes are complete, you'll have a fully integrated Task Manager and Study Planner system!

**Next Steps:**
1. Monitor user feedback
2. Iterate on UX improvements
3. Add advanced features (recurring tasks, team collaboration)
4. Optimize performance
5. Add analytics

---

**Last Updated**: November 2, 2025
**Estimated Time**: 7 days
**Difficulty**: Intermediate
**Priority**: High
