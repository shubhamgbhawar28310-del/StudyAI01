# Fix: Resized Events Reverting After Release

## Problem
Events were reverting to their original times after being resized because the `handleMouseUp` closure was capturing stale state from the `resizeState.tempEvent` dependency.

## Root Cause
The `useCallback` dependency array included `resizeState.tempEvent`, which caused the closure to capture the initial (null) value. When `handleMouseUp` executed, it was checking against this stale value instead of the latest temp event.

## Solution
Changed the implementation to use a closure variable (`latestTempEvent`) that gets updated during mouse move and is accessible in the `handleMouseUp` handler without relying on state dependencies.

### Key Changes

**Before:**
```typescript
const handleResizeStart = useCallback((e, event, handle) => {
  // ... setup code ...
  
  const handleMouseUp = async () => {
    // This was using stale resizeState.tempEvent
    if (resizeState.tempEvent && resizeState.tempEvent.id === event.id) {
      await updateScheduleEvent(resizeState.tempEvent);
    }
  };
}, [updateScheduleEvent, resizeState.tempEvent]); // ❌ Stale dependency
```

**After:**
```typescript
const handleResizeStart = useCallback((e, event, handle) => {
  // Store latest temp event in closure variable
  let latestTempEvent: ScheduleEvent | null = { ...event };
  
  const handleMouseMove = (moveEvent) => {
    // ... calculate new times ...
    
    // Update closure variable
    latestTempEvent = {
      ...event,
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString()
    };
    
    // Update state for UI
    setResizeState(prev => ({
      ...prev,
      tempEvent: latestTempEvent
    }));
  };
  
  const handleMouseUp = async () => {
    // Use closure variable instead of state
    if (latestTempEvent && latestTempEvent.id === event.id) {
      await updateScheduleEvent(latestTempEvent);
    }
    
    // Reset state after save
    setResizeState({
      isResizing: false,
      resizingEventId: null,
      resizeHandle: null,
      tempEvent: null
    });
  };
}, [updateScheduleEvent]); // ✅ No stale dependencies
```

## Benefits

1. **Correct State Management**: The latest temp event is always available in `handleMouseUp`
2. **No Stale Closures**: Removed problematic dependency from useCallback
3. **Proper Save Flow**: Event is saved with the final resized times
4. **Clean State Reset**: State is reset only after successful save

## Testing

To verify the fix:

1. Resize an event by dragging top or bottom handle
2. Release the mouse
3. Event should maintain the new size
4. Check browser console - no errors
5. Refresh page - event should still have new times (persisted to Supabase)

## Files Modified

- `src/hooks/useEventResize.ts` - Fixed closure variable handling in handleResizeStart

## Status

✅ **FIXED** - Events now persist their resized times correctly
