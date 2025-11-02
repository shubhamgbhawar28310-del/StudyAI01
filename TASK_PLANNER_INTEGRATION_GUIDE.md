# 🔗 Task Manager & Study Planner Integration Guide

## 📋 Overview

This guide outlines the complete integration of the Task Manager and Study Planner modules into a unified productivity system.

---

## 🎯 Integration Goals

### 1. **Bidirectional Sync**
- Tasks ↔ Schedule Events linked via `task_id`
- Real-time updates across both modules
- Automatic status synchronization

### 2. **Unified User Experience**
- Seamless flow from task creation to scheduling
- Drag-and-drop task scheduling
- Inline task details in planner view

### 3. **Smart Scheduling**
- AI-powered time slot suggestions
- Priority-based auto-scheduling
- Conflict detection and resolution

### 4. **Enhanced Data Model**
- Proper foreign key relationships
- Status tracking across both systems
- Progress synchronization

---

## 🗄️ Database Schema Updates

### **Current Schema Issues**
1. `study_sessions` table doesn't exist (using `schedule_events`)
2. Missing proper foreign key constraints
3. No status synchronization fields

### **Required Migrations**

```sql
-- Migration 1: Add missing columns to schedule_events
ALTER TABLE schedule_events
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled'
  CHECK (status IN ('scheduled', 'in_progress', 'completed', 'missed')),
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS missed_count INTEGER DEFAULT 0;

-- Migration 2: Add proper foreign key constraint
ALTER TABLE schedule_events
ADD CONSTRAINT fk_schedule_events_task
  FOREIGN KEY (task_id)
  REFERENCES tasks(id)
  ON DELETE SET NULL;

-- Migration 3: Add index for performance
CREATE INDEX IF NOT EXISTS idx_schedule_events_task_id 
  ON schedule_events(task_id);

CREATE INDEX IF NOT EXISTS idx_schedule_events_user_date 
  ON schedule_events(user_id, start_time);

-- Migration 4: Add status column to tasks if missing
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
  CHECK (status IN ('pending', 'in_progress', 'completed', 'missed'));

-- Migration 5: Create view for unified task-schedule data
CREATE OR REPLACE VIEW task_schedule_view AS
SELECT 
  t.id as task_id,
  t.title as task_title,
  t.description as task_description,
  t.priority,
  t.subject,
  t.due_date,
  t.due_time,
  t.completed as task_completed,
  t.status as task_status,
  se.id as schedule_id,
  se.title as schedule_title,
  se.start_time,
  se.end_time,
  se.type as event_type,
  se.status as schedule_status,
  se.started_at,
  se.completed_at,
  (SELECT COUNT(*) FROM task_files WHERE task_id = t.id) as file_count,
  (SELECT COUNT(*) FROM task_notes WHERE task_id = t.id) as note_count
FROM tasks t
LEFT JOIN schedule_events se ON t.id = se.task_id
WHERE t.user_id = auth.uid();
```

---

## 🔄 Context Updates

### **Enhanced StudyPlannerContext**

Add new helper functions:

```typescript
// Get schedule events for a specific task
getScheduleEventsByTask: (taskId: string) => ScheduleEvent[]

// Get task for a schedule event
getTaskForEvent: (eventId: string) => Task | undefined

// Link existing task to schedule event
linkTaskToEvent: (taskId: string, eventId: string) => void

// Unlink task from schedule event
unlinkTaskFromEvent: (eventId: string) => void

// Smart scheduling suggestions
getSuggestedTimeSlots: (task: Task) => TimeSlot[]

// Mark event as complete (also completes task)
completeScheduleEvent: (eventId: string) => void

// Start event (updates status)
startScheduleEvent: (eventId: string) => void

// Sync task and event statuses
syncTaskEventStatus: (taskId: string) => void
```

---

## 🎨 UI/UX Enhancements

### **1. Enhanced TaskModal**

Add scheduling section:

```typescript
// After task details, show scheduling option
<div className="border-t pt-4">
  <h3 className="font-medium mb-3">📅 Schedule This Task</h3>
  
  {suggestedSlots.length > 0 && (
    <div className="mb-3">
      <p className="text-sm text-muted-foreground mb-2">
        Suggested time slots:
      </p>
      <div className="space-y-2">
        {suggestedSlots.map(slot => (
          <Button
            key={slot.id}
            variant="outline"
            onClick={() => scheduleTask(slot)}
            className="w-full justify-start"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {slot.date} at {slot.time}
            <Badge className="ml-auto">{slot.reason}</Badge>
          </Button>
        ))}
      </div>
    </div>
  )}
  
  <Button
    variant="outline"
    onClick={() => setShowSchedulePicker(true)}
    className="w-full"
  >
    <Plus className="h-4 w-4 mr-2" />
    Choose Custom Time
  </Button>
</div>
```

### **2. Enhanced ScheduleView**

Add unscheduled tasks sidebar:

```typescript
<div className="grid grid-cols-[300px_1fr] gap-4">
  {/* Unscheduled Tasks Sidebar */}
  <Card>
    <CardHeader>
      <CardTitle className="text-sm">Unscheduled Tasks</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {unscheduledTasks.map(task => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => handleDragStart(e, task)}
            className="p-3 border rounded-lg cursor-move hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <Badge className={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
              <p className="text-sm font-medium truncate">{task.title}</p>
            </div>
            {task.dueDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Due: {formatDate(task.dueDate)}
              </p>
            )}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>

  {/* Calendar Grid */}
  <Card>
    {/* Existing calendar view with drop zones */}
  </Card>
</div>
```

### **3. Enhanced Event Display**

Show task details in schedule blocks:

```typescript
<div className="event-block">
  <div className="flex items-center gap-2 mb-1">
    <p className="font-medium">{event.title}</p>
    {event.taskId && (
      <>
        <Badge variant="outline" className="text-xs">
          {task?.priority}
        </Badge>
        {hasAttachments && (
          <PaperclipIcon className="h-3 w-3 text-muted-foreground" />
        )}
      </>
    )}
  </div>
  
  <p className="text-xs opacity-90">
    {formatTime(event.startTime)} - {formatTime(event.endTime)}
  </p>
  
  {event.status === 'completed' && (
    <CheckCircle className="h-4 w-4 text-green-500 absolute top-1 right-1" />
  )}
  
  {/* Hover actions */}
  <div className="event-actions">
    <Button size="sm" onClick={() => viewTaskDetails(event.taskId)}>
      <Eye className="h-3 w-3" />
    </Button>
    <Button size="sm" onClick={() => markComplete(event.id)}>
      <CheckCircle className="h-3 w-3" />
    </Button>
  </div>
</div>
```

### **4. Task Detail Modal Integration**

Add schedule information:

```typescript
<TabsContent value="schedule">
  <div className="space-y-4">
    <h3 className="font-medium">Scheduled Sessions</h3>
    
    {scheduledEvents.length === 0 ? (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground mb-4">
          This task hasn't been scheduled yet
        </p>
        <Button onClick={() => openSchedulePicker(task.id)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Now
        </Button>
      </div>
    ) : (
      <div className="space-y-2">
        {scheduledEvents.map(event => (
          <div key={event.id} className="p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{formatDate(event.startTime)}</p>
                <p className="text-sm text-muted-foreground">
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </p>
              </div>
              <Badge className={getStatusColor(event.status)}>
                {event.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</TabsContent>
```

---

## 🔧 Implementation Steps

### **Phase 1: Database Setup** (Day 1)

1. Run database migrations
2. Update RLS policies
3. Test foreign key constraints
4. Verify data integrity

### **Phase 2: Context Enhancement** (Day 2)

1. Add new helper functions to StudyPlannerContext
2. Implement bidirectional sync logic
3. Add status synchronization
4. Test state updates

### **Phase 3: UI Components** (Days 3-4)

1. Update TaskModal with scheduling section
2. Add unscheduled tasks sidebar to ScheduleView
3. Implement drag-and-drop functionality
4. Enhance event display with task details

### **Phase 4: Smart Scheduling** (Day 5)

1. Implement time slot suggestion algorithm
2. Add conflict detection
3. Create auto-schedule feature
4. Test scheduling logic

### **Phase 5: Integration Testing** (Day 6)

1. Test task creation → scheduling flow
2. Test schedule → task completion sync
3. Test drag-and-drop scheduling
4. Test status synchronization

### **Phase 6: Polish & Optimization** (Day 7)

1. Add loading states
2. Improve error handling
3. Optimize performance
4. Add user feedback (toasts, animations)

---

## 🧪 Testing Checklist

### **Functional Tests**

- [ ] Create task and schedule it immediately
- [ ] Create schedule event and link existing task
- [ ] Drag unscheduled task to calendar
- [ ] Mark schedule event complete → task completes
- [ ] Delete task → schedule event unlinks
- [ ] Delete schedule event → task remains
- [ ] Edit task → schedule event updates
- [ ] Edit schedule event → task updates
- [ ] Auto-schedule multiple tasks
- [ ] Conflict detection works
- [ ] Time slot suggestions are accurate

### **UI/UX Tests**

- [ ] Smooth drag-and-drop experience
- [ ] Clear visual feedback for actions
- [ ] Loading states display correctly
- [ ] Error messages are helpful
- [ ] Mobile responsive
- [ ] Keyboard navigation works
- [ ] Accessibility (ARIA labels)

### **Performance Tests**

- [ ] Large task list (100+ tasks) renders quickly
- [ ] Calendar with many events (50+) is smooth
- [ ] Real-time sync doesn't lag
- [ ] No memory leaks
- [ ] Optimistic updates work

---

## 📊 Smart Scheduling Algorithm

### **Time Slot Suggestion Logic**

```typescript
function getSuggestedTimeSlots(task: Task): TimeSlot[] {
  const suggestions: TimeSlot[] = [];
  const now = new Date();
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  
  // Priority-based urgency
  const urgencyHours = {
    urgent: 2,    // Schedule within 2 hours
    high: 24,     // Schedule within 24 hours
    medium: 72,   // Schedule within 3 days
    low: 168      // Schedule within 1 week
  };
  
  const maxHours = urgencyHours[task.priority];
  
  // Get user's available time slots
  const availableSlots = getAvailableTimeSlots(now, maxHours);
  
  // Filter by user preferences (study hours, break times)
  const preferredSlots = availableSlots.filter(slot => 
    isWithinStudyHours(slot) && !isBreakTime(slot)
  );
  
  // Score each slot
  const scoredSlots = preferredSlots.map(slot => ({
    ...slot,
    score: calculateSlotScore(slot, task, dueDate)
  }));
  
  // Sort by score and return top 3
  return scoredSlots
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(slot => ({
      ...slot,
      reason: getSlotReason(slot, task)
    }));
}

function calculateSlotScore(
  slot: TimeSlot, 
  task: Task, 
  dueDate: Date | null
): number {
  let score = 100;
  
  // Prefer earlier slots for urgent tasks
  if (task.priority === 'urgent') {
    const hoursUntilSlot = (slot.start.getTime() - Date.now()) / (1000 * 60 * 60);
    score += Math.max(0, 50 - hoursUntilSlot * 10);
  }
  
  // Prefer slots before due date
  if (dueDate) {
    const hoursBeforeDue = (dueDate.getTime() - slot.start.getTime()) / (1000 * 60 * 60);
    if (hoursBeforeDue > 0) {
      score += Math.min(30, hoursBeforeDue / 24 * 10);
    } else {
      score -= 50; // Penalize slots after due date
    }
  }
  
  // Prefer optimal study times (9am-12pm, 2pm-5pm)
  const hour = slot.start.getHours();
  if ((hour >= 9 && hour < 12) || (hour >= 14 && hour < 17)) {
    score += 20;
  }
  
  // Prefer slots with no adjacent events (focus time)
  if (!hasAdjacentEvents(slot)) {
    score += 15;
  }
  
  // Match subject with recent study patterns
  if (matchesStudyPattern(slot, task.subject)) {
    score += 10;
  }
  
  return score;
}
```

---

## 🎯 User Flows

### **Flow 1: Create Task → Schedule**

```
1. User clicks "Add Task"
2. Fills in task details (title, priority, due date)
3. System shows suggested time slots
4. User selects a slot or chooses custom time
5. Task created + Schedule event created (linked)
6. Both appear in respective views
7. Toast: "Task created and scheduled for [time]"
```

### **Flow 2: Drag Task to Calendar**

```
1. User sees unscheduled task in sidebar
2. Drags task to calendar time slot
3. Drop zone highlights on hover
4. On drop, schedule event modal opens (pre-filled)
5. User confirms or adjusts time
6. Schedule event created (linked to task)
7. Task moves from sidebar to calendar
8. Toast: "Task scheduled for [time]"
```

### **Flow 3: Complete Schedule Event**

```
1. User clicks "Mark Complete" on schedule event
2. Event status → 'completed'
3. Linked task status → 'completed'
4. Both update in real-time
5. XP awarded
6. Event turns green
7. Task shows checkmark
8. Toast: "Great job! Task completed. +20 XP"
```

### **Flow 4: Auto-Schedule**

```
1. User clicks "Auto Schedule" button
2. System analyzes:
   - Unscheduled tasks
   - Available time slots
   - Task priorities
   - Due dates
3. Generates optimal schedule
4. Shows preview modal with suggested schedule
5. User can accept all, modify, or reject
6. On accept, all events created
7. Calendar updates with new events
8. Toast: "Scheduled 5 tasks for this week"
```

---

## 🚀 Performance Optimizations

### **1. Memoization**

```typescript
// Memoize expensive calculations
const unscheduledTasks = useMemo(() => 
  state.tasks.filter(task => 
    !state.scheduleEvents.some(event => event.taskId === task.id)
  ),
  [state.tasks, state.scheduleEvents]
);

const taskEventMap = useMemo(() => {
  const map = new Map<string, ScheduleEvent[]>();
  state.scheduleEvents.forEach(event => {
    if (event.taskId) {
      const events = map.get(event.taskId) || [];
      events.push(event);
      map.set(event.taskId, events);
    }
  });
  return map;
}, [state.scheduleEvents]);
```

### **2. Debounced Sync**

```typescript
const debouncedSync = useMemo(
  () => debounce((data) => {
    dataSyncService.syncScheduleEvent(data, user.id, 'update');
  }, 500),
  [user]
);
```

### **3. Optimistic Updates**

```typescript
const completeScheduleEvent = (eventId: string) => {
  // Update UI immediately
  dispatch({ 
    type: 'UPDATE_SCHEDULE_EVENT', 
    payload: { ...event, status: 'completed' } 
  });
  
  // Sync to backend
  dataSyncService.syncScheduleEvent(event, user.id, 'update')
    .catch(error => {
      // Rollback on error
      dispatch({ 
        type: 'UPDATE_SCHEDULE_EVENT', 
        payload: originalEvent 
      });
      toast({ title: 'Error', description: 'Failed to update event' });
    });
};
```

---

## 📱 Mobile Considerations

### **Responsive Design**

```typescript
// Mobile: Stack sidebar above calendar
<div className="flex flex-col lg:grid lg:grid-cols-[300px_1fr] gap-4">
  {/* Sidebar */}
  <div className="lg:sticky lg:top-4 lg:h-fit">
    {/* Unscheduled tasks */}
  </div>
  
  {/* Calendar */}
  <div>
    {/* Schedule view */}
  </div>
</div>
```

### **Touch Gestures**

- Long press to drag tasks
- Swipe to delete events
- Pinch to zoom calendar
- Pull to refresh

---

## 🎨 Visual Design

### **Color Coding**

```typescript
const statusColors = {
  scheduled: 'bg-blue-100 border-blue-300',
  in_progress: 'bg-yellow-100 border-yellow-300',
  completed: 'bg-green-100 border-green-300',
  missed: 'bg-red-100 border-red-300'
};

const priorityColors = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-blue-500',
  low: 'bg-green-500'
};
```

### **Animations**

```typescript
// Task scheduling animation
<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.8 }}
  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
>
  {/* Event block */}
</motion.div>

// Drag feedback
<motion.div
  drag
  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
  whileDrag={{ scale: 1.05, opacity: 0.8 }}
>
  {/* Draggable task */}
</motion.div>
```

---

## 📈 Success Metrics

### **User Engagement**

- % of tasks that get scheduled
- Average time from task creation to scheduling
- % of scheduled events completed
- Daily active users

### **System Performance**

- Page load time < 2s
- Sync latency < 500ms
- Calendar render time < 100ms
- Zero data loss incidents

### **User Satisfaction**

- Task completion rate increase
- User retention rate
- Feature usage statistics
- User feedback scores

---

## 🔮 Future Enhancements

### **Phase 2 Features**

1. **Recurring Tasks & Events**
   - Daily, weekly, monthly patterns
   - Custom recurrence rules
   - Bulk scheduling

2. **Team Collaboration**
   - Shared tasks
   - Group study sessions
   - Calendar sharing

3. **Advanced AI**
   - Predictive scheduling
   - Workload balancing
   - Study pattern analysis

4. **Integrations**
   - Google Calendar sync
   - Notion integration
   - Todoist import

5. **Analytics Dashboard**
   - Productivity insights
   - Time tracking
   - Goal progress
   - Study patterns

---

**Last Updated**: November 2, 2025
**Status**: 🚧 Implementation Ready
**Priority**: 🔥 High
