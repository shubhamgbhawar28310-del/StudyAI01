# 🎯 Google Calendar-Style Dynamic Events Implementation Plan

## Current Status
✅ 30-minute grid (48 rows)
✅ 15-minute snapping
✅ Drag to create
✅ Drag to move
✅ 12-hour AM/PM format in grid labels
✅ Correct date handling

## 🚀 Next Phase: Dynamic Event Sizing & Resize

### Goal
Make events scale visually based on duration and add resize handles, exactly like Google Calendar.

---

## 📐 Architecture Changes Needed

### 1. Event Rendering Strategy

**Current:** Events render in grid cells (limited to cell height)
**New:** Events use absolute positioning with calculated height

```typescript
// Calculate event position and height
const getEventStyle = (event) => {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  
  // Calculate minutes from midnight
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const duration = endMinutes - startMinutes;
  
  // Each 30-min slot = 40px, so 1 minute = 40/30 = 1.33px
  const pixelsPerMinute = 40 / 30;
  
  return {
    top: `${(startMinutes / 30) * 40}px`,
    height: `${duration * pixelsPerMinute}px`,
    position: 'absolute',
    width: 'calc(100% - 8px)'
  };
};
```

### 2. Grid Structure Change

**Current:**
```jsx
<div className="grid-cell">
  {events.map(event => <EventBlock />)}
</div>
```

**New:**
```jsx
<div className="grid-cell relative" style={{ minHeight: '40px' }}>
  {/* Empty cell for clicking */}
</div>
<div className="absolute inset-0 pointer-events-none">
  {allDayEvents.map(event => (
    <EventBlock 
      style={getEventStyle(event)}
      className="pointer-events-auto"
    />
  ))}
</div>
```

---

## 🔧 Implementation Steps

### Step 1: Refactor Event Rendering

**File:** `DynamicScheduleView.tsx`

```typescript
// Add state for resize
const [resizingEvent, setResizingEvent] = useState(null);
const [resizeHandle, setResizeHandle] = useState<'top' | 'bottom' | null>(null);

// Render events with absolute positioning
const renderDayEvents = (date: Date, dayIndex: number) => {
  const dayEvents = getEventsForDate(date);
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {dayEvents.map(event => {
        const style = getEventStyle(event);
        return (
          <div
            key={event.id}
            style={style}
            className="pointer-events-auto"
          >
            {/* Resize handle top */}
            <div 
              className="resize-handle-top"
              onMouseDown={(e) => handleResizeStart(e, event, 'top')}
            />
            
            {/* Event content */}
            <div className="event-content">
              {event.title}
            </div>
            
            {/* Resize handle bottom */}
            <div 
              className="resize-handle-bottom"
              onMouseDown={(e) => handleResizeStart(e, event, 'bottom')}
            />
          </div>
        );
      })}
    </div>
  );
};
```

### Step 2: Implement Resize Logic

```typescript
const handleResizeStart = (e: React.MouseEvent, event: any, handle: 'top' | 'bottom') => {
  e.stopPropagation();
  e.preventDefault();
  
  setResizingEvent(event);
  setResizeHandle(handle);
  
  const startY = e.clientY;
  const originalStart = new Date(event.startTime);
  const originalEnd = new Date(event.endTime);
  
  const handleMouseMove = (moveEvent: MouseEvent) => {
    const deltaY = moveEvent.clientY - startY;
    const deltaMinutes = Math.round((deltaY / 40) * 30); // Convert pixels to minutes
    const snappedDelta = Math.round(deltaMinutes / 15) * 15; // Snap to 15 min
    
    if (handle === 'top') {
      // Adjust start time
      const newStart = new Date(originalStart);
      newStart.setMinutes(newStart.getMinutes() + snappedDelta);
      
      // Update event (optimistic)
      updateScheduleEvent({
        ...event,
        startTime: newStart.toISOString()
      });
    } else {
      // Adjust end time
      const newEnd = new Date(originalEnd);
      newEnd.setMinutes(newEnd.getMinutes() + snappedDelta);
      
      updateScheduleEvent({
        ...event,
        endTime: newEnd.toISOString()
      });
    }
  };
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    setResizingEvent(null);
    setResizeHandle(null);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};
```

### Step 3: Add CSS for Resize Handles

**File:** `src/styles/calendar-grid.css` (new file)

```css
.resize-handle-top,
.resize-handle-bottom {
  position: absolute;
  left: 0;
  right: 0;
  height: 8px;
  cursor: ns-resize;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s;
}

.resize-handle-top {
  top: 0;
}

.resize-handle-bottom {
  bottom: 0;
}

.event-block:hover .resize-handle-top,
.event-block:hover .resize-handle-bottom {
  opacity: 1;
  background: rgba(255, 255, 255, 0.3);
}

.resize-handle-top::after,
.resize-handle-bottom::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 3px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 2px;
  top: 50%;
  margin-top: -1.5px;
}
```

### Step 4: Update Event Filtering

Instead of filtering by slot, render all events for the day with absolute positioning:

```typescript
// In week view, for each day column:
<div className="relative" style={{ minHeight: '1920px' }}> {/* 48 slots * 40px */}
  {/* Grid cells for clicking */}
  {timeSlots.map(slot => (
    <div key={slot} className="h-[40px] border-b" />
  ))}
  
  {/* Events layer */}
  {renderDayEvents(date, dayIndex)}
</div>
```

---

## 🎨 Visual Enhancements

### Event Sizing Examples

| Duration | Height | Visual |
|----------|--------|--------|
| 15 min | 20px | Small block |
| 30 min | 40px | One slot |
| 1 hour | 80px | Two slots |
| 2 hours | 160px | Four slots |

### Resize Behavior

1. **Hover** → Resize handles appear (top & bottom)
2. **Click handle** → Cursor changes to resize
3. **Drag** → Event height changes in real-time
4. **Release** → Snaps to 15-minute interval
5. **Auto-save** → Updates Supabase

---

## ⚡ Performance Considerations

### Optimizations Needed

1. **Throttle resize updates** - Use requestAnimationFrame
2. **Debounce Supabase writes** - Save after resize completes
3. **Memoize event calculations** - Use useMemo for getEventStyle
4. **Virtual scrolling** - Only render visible time range

```typescript
// Throttle resize updates
const throttledResize = useCallback(
  throttle((event, newTime) => {
    updateScheduleEvent({ ...event, ...newTime });
  }, 100),
  []
);
```

---

## 🧩 Component Structure

### Suggested File Organization

```
src/components/features/
├── DynamicScheduleView.tsx (main component)
├── EventBlock.tsx (individual event with resize)
├── ResizeHandle.tsx (top/bottom handles)
└── hooks/
    ├── useEventResize.ts (resize logic)
    ├── useEventDrag.ts (drag logic)
    └── useEventPosition.ts (calculate position/height)

src/styles/
└── calendar-grid.css (resize handles, transitions)
```

---

## 📋 Implementation Checklist

### Phase 1: Dynamic Sizing
- [ ] Calculate event height based on duration
- [ ] Use absolute positioning for events
- [ ] Render events in separate layer above grid
- [ ] Handle overlapping events (side-by-side)

### Phase 2: Resize Handles
- [ ] Add top and bottom resize handles
- [ ] Implement mouse tracking for resize
- [ ] Snap to 15-minute intervals
- [ ] Update event times during resize

### Phase 3: Visual Polish
- [ ] Smooth transitions during drag/resize
- [ ] Show time preview during resize
- [ ] Highlight affected time slots
- [ ] Add subtle shadows and hover effects

### Phase 4: Edge Cases
- [ ] Prevent events from going negative
- [ ] Handle midnight crossing
- [ ] Minimum event duration (15 min)
- [ ] Maximum event duration (24 hours)

---

## 🎯 Expected Behavior

### Creating Event
1. Drag from 9:00 AM to 10:30 AM
2. Event appears with height = 90px (1.5 hours)
3. Shows "Study Session" and "9:00 AM"

### Resizing Event
1. Hover over event → Handles appear
2. Drag bottom handle down
3. Event grows in real-time
4. Release → Snaps to nearest 15 min
5. Auto-saves to database

### Moving Event
1. Drag event (not handle)
2. Event follows cursor
3. Snaps to 15-min grid
4. Drops at new position
5. Height stays same

---

## 💻 Code Estimate

- **Event positioning logic:** ~100 lines
- **Resize handle implementation:** ~150 lines
- **Mouse tracking & snapping:** ~100 lines
- **CSS styling:** ~50 lines
- **Helper functions:** ~50 lines

**Total:** ~450 lines of new/modified code

---

## ⏱️ Time Estimate

- **Phase 1 (Sizing):** 30-45 minutes
- **Phase 2 (Resize):** 45-60 minutes
- **Phase 3 (Polish):** 20-30 minutes
- **Phase 4 (Testing):** 15-20 minutes

**Total:** 2-3 hours of focused development

---

## 🚦 Decision Point

Given the complexity, I recommend:

**Option A:** Implement this in the next session with fresh context
**Option B:** Continue now (will be a long session)
**Option C:** Use react-big-calendar library (faster, proven solution)

Which would you prefer?

For now, your calendar has:
- ✅ 12-hour time labels
- ✅ Correct date handling
- ✅ Drag to create/move
- ✅ 15-minute precision

The dynamic sizing and resize handles would be the next major enhancement.
