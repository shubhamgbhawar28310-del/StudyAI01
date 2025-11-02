# 🚀 Dynamic Study Planner - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies (1 minute)

```bash
npm install react-big-calendar date-fns
npm install @types/react-big-calendar --save-dev
```

### Step 2: Add CSS Import (30 seconds)

Add to your main CSS file (`src/index.css` or `src/App.css`):

```css
/* React Big Calendar Styles */
@import 'react-big-calendar/lib/css/react-big-calendar.css';

/* Custom Calendar Overrides */
.rbc-calendar {
  font-family: inherit;
}

.rbc-event {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.875rem;
}

.rbc-event:hover {
  opacity: 0.9;
  transform: scale(1.02);
  transition: all 0.2s;
}

.rbc-today {
  background-color: rgba(59, 130, 246, 0.1);
}

.rbc-time-slot {
  min-height: 40px;
}

.rbc-current-time-indicator {
  background-color: #ef4444;
  height: 2px;
}
```

### Step 3: Update Dashboard (2 minutes)

Replace the old ScheduleView with DynamicScheduleView:

```typescript
// In src/pages/Dashboard.tsx

import { DynamicScheduleView } from '@/components/features/DynamicScheduleView';

// Replace this:
// <ScheduleView />

// With this:
<DynamicScheduleView />
```

### Step 4: Test It! (1 minute)

1. Run your app: `npm run dev`
2. Navigate to the Study Planner
3. You should see:
   - ✅ Dynamic calendar (no empty slots!)
   - ✅ Unscheduled tasks sidebar
   - ✅ Auto-schedule button
   - ✅ Drag-and-drop functionality

---

## 🎯 Key Features

### 1. **Dynamic Calendar View**
- Shows only actual events (no empty slots)
- Multiple views: Day, Week, Month
- Real-time updates

### 2. **Task Integration**
- Unscheduled tasks sidebar
- Drag tasks to calendar
- Automatic linking

### 3. **Auto-Schedule AI**
- Click "Auto Schedule" button
- AI suggests optimal time slots
- Batch schedule multiple tasks

### 4. **Interactive Events**
- Click to edit
- Drag to reschedule
- Resize to adjust duration
- Hover for details

### 5. **Visual Status**
- 🟢 Green = Completed
- 🟡 Yellow = In Progress
- 🔴 Red = Missed
- 🔵 Blue = Auto-scheduled

---

## 📊 Usage Examples

### Example 1: Schedule a Task

1. See unscheduled task in sidebar
2. Drag task to calendar
3. Drop on desired time slot
4. Task automatically scheduled!

### Example 2: Auto-Schedule

1. Click "Auto Schedule" button
2. Review AI suggestions
3. Select/deselect tasks
4. Click "Schedule X Tasks"
5. All tasks scheduled instantly!

### Example 3: Edit Event

1. Click on calendar event
2. Modal opens with details
3. Edit time, description, etc.
4. Save changes
5. Calendar updates immediately

### Example 4: Complete Event

1. Click on event
2. Click "Mark Complete"
3. Event turns green
4. Linked task also completed
5. XP awarded!

---

## 🎨 Customization

### Change Calendar Colors

Edit `eventStyleGetter` in `DynamicScheduleView.tsx`:

```typescript
const eventStyleGetter = (event: CalendarEvent) => {
  // Customize colors here
  let backgroundColor = '#your-color';
  
  return {
    style: {
      backgroundColor,
      // ... other styles
    }
  };
};
```

### Adjust Time Range

Change min/max hours in Calendar component:

```typescript
<Calendar
  min={new Date(2024, 0, 1, 6, 0, 0)}  // Start at 6 AM
  max={new Date(2024, 0, 1, 23, 0, 0)} // End at 11 PM
  // ...
/>
```

### Modify Auto-Schedule Logic

Edit `getSuggestedTimeSlots` in `TaskPlannerIntegration.ts`:

```typescript
export function getSuggestedTimeSlots(task: Task, ...): TimeSlot[] {
  // Customize suggestion algorithm
  // ...
}
```

---

## 🐛 Troubleshooting

### Issue: Calendar not showing

**Solution**: Check that you imported the CSS:
```css
@import 'react-big-calendar/lib/css/react-big-calendar.css';
```

### Issue: Drag-and-drop not working

**Solution**: Ensure `draggableAccessor` is set:
```typescript
<Calendar
  draggableAccessor={() => true}
  // ...
/>
```

### Issue: Events not updating

**Solution**: Check that context is properly syncing:
```typescript
// In StudyPlannerContext
useEffect(() => {
  // Sync to Supabase
  dataSyncService.syncScheduleEvent(event, user.id, 'update');
}, [state.scheduleEvents]);
```

### Issue: Sidebar not showing tasks

**Solution**: Verify `getUnscheduledTasks` is working:
```typescript
const unscheduledTasks = getUnscheduledTasks();
console.log('Unscheduled:', unscheduledTasks);
```

---

## 📈 Performance Tips

### 1. Memoize Calendar Events

```typescript
const calendarEvents = useMemo(() => {
  return state.scheduleEvents.map(event => 
    convertToCalendarEvent(event, getTaskForEvent(event.id))
  );
}, [state.scheduleEvents, state.tasks]);
```

### 2. Debounce Drag Updates

```typescript
const debouncedUpdate = useMemo(
  () => debounce((event) => {
    updateScheduleEvent(event);
  }, 500),
  []
);
```

### 3. Virtualize Long Lists

For many unscheduled tasks, use virtualization:

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={unscheduledTasks.length}
  itemSize={80}
>
  {({ index, style }) => (
    <div style={style}>
      <TaskCard task={unscheduledTasks[index]} />
    </div>
  )}
</FixedSizeList>
```

---

## 🔄 Migration from Old Planner

### Before (Static Timetable)

```typescript
// Old: Empty time slots
{timeSlots.map(slot => (
  <div className="time-slot">
    {/* Empty or hardcoded */}
  </div>
))}
```

### After (Dynamic Calendar)

```typescript
// New: Data-driven events
<Calendar
  events={calendarEvents}
  // Events come from Supabase
/>
```

### Migration Steps

1. ✅ Install dependencies
2. ✅ Add new components
3. ✅ Update Dashboard import
4. ✅ Test functionality
5. ✅ Remove old ScheduleView (optional)

---

## 🎓 Best Practices

### 1. Always Validate Dates

```typescript
const validateSchedule = (start: Date, end: Date) => {
  if (start >= end) {
    toast({ title: 'Invalid time range' });
    return false;
  }
  if (start < new Date()) {
    toast({ title: 'Cannot schedule in the past' });
    return false;
  }
  return true;
};
```

### 2. Handle Conflicts

```typescript
const hasConflict = checkTimeSlotConflict(
  state.scheduleEvents,
  startTime,
  endTime
);

if (hasConflict.hasConflict) {
  toast({
    title: 'Time Conflict',
    description: hasConflict.message
  });
  return;
}
```

### 3. Provide Feedback

```typescript
// On every action
toast({
  title: '✅ Success',
  description: 'Event scheduled'
});

// On errors
toast({
  title: '❌ Error',
  description: 'Failed to schedule',
  variant: 'destructive'
});
```

### 4. Sync to Backend

```typescript
// After every change
updateScheduleEvent(event);

// Sync to Supabase
dataSyncService.syncScheduleEvent(event, user.id, 'update');
```

---

## 📱 Mobile Optimization

### Responsive Layout

```typescript
<div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
  {/* Sidebar - hidden on mobile */}
  <div className="hidden lg:block">
    <TaskScheduleSidebar />
  </div>
  
  {/* Calendar - full width on mobile */}
  <div>
    <Calendar />
  </div>
</div>
```

### Touch Gestures

```typescript
// Long press to drag on mobile
const handleTouchStart = (e: TouchEvent) => {
  longPressTimer = setTimeout(() => {
    setDragging(true);
  }, 500);
};
```

---

## 🚀 Advanced Features

### 1. Recurring Events

```typescript
interface RecurringEvent {
  frequency: 'daily' | 'weekly' | 'monthly';
  endDate?: Date;
  daysOfWeek?: number[];
}

const createRecurringEvents = (event: ScheduleEvent, recurring: RecurringEvent) => {
  // Generate multiple events
  // ...
};
```

### 2. Event Templates

```typescript
const templates = [
  { name: 'Study Session', duration: 60, type: 'study' },
  { name: 'Break', duration: 15, type: 'break' },
  { name: 'Review', duration: 30, type: 'study' }
];

const applyTemplate = (template: Template, startTime: Date) => {
  // Create event from template
  // ...
};
```

### 3. Calendar Sync

```typescript
// Export to Google Calendar
const exportToGoogleCalendar = (event: ScheduleEvent) => {
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${event.title}&dates=${startTime}/${endTime}`;
  window.open(googleUrl, '_blank');
};
```

---

## 📊 Analytics

### Track Usage

```typescript
const trackEvent = (action: string, data: any) => {
  // Send to analytics
  analytics.track(action, {
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Usage
trackEvent('event_scheduled', {
  type: 'task',
  duration: 60,
  autoScheduled: true
});
```

### Generate Reports

```typescript
const getWeeklyReport = () => {
  const thisWeek = getEventsForRange(
    calendarEvents,
    startOfWeek(new Date()),
    endOfWeek(new Date())
  );
  
  return {
    totalEvents: thisWeek.length,
    completed: thisWeek.filter(e => e.resource.status === 'completed').length,
    totalHours: thisWeek.reduce((sum, e) => sum + getEventDuration(e) / 60, 0)
  };
};
```

---

## ✅ Success Checklist

After implementation, verify:

- [ ] Calendar shows actual events (not empty slots)
- [ ] Unscheduled tasks appear in sidebar
- [ ] Drag-and-drop works
- [ ] Auto-schedule suggests time slots
- [ ] Events can be edited
- [ ] Events can be deleted
- [ ] Status colors are correct
- [ ] Task linking works
- [ ] Real-time sync works
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Performance is smooth

---

## 🎉 You're Done!

Your Study Planner is now:
- ✅ Dynamic and data-driven
- ✅ Integrated with Task Manager
- ✅ AI-powered auto-scheduling
- ✅ Interactive and intuitive
- ✅ Real-time synchronized

**Next Steps:**
1. Customize colors and styling
2. Add more features (recurring events, templates)
3. Integrate with external calendars
4. Add analytics and insights
5. Gather user feedback

---

**Questions?** Check the full documentation in `DYNAMIC_PLANNER_TRANSFORMATION.md`

**Last Updated**: November 2, 2025
