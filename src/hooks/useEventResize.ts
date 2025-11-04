import { useState, useCallback } from 'react';
import { format } from 'date-fns';

interface ResizeState {
  isResizing: boolean;
  resizingEventId: string | null;
  resizeHandle: 'top' | 'bottom' | null;
  tempEvent: any | null;
}

interface ScheduleEvent {
  id: string;
  startTime: string;
  endTime: string;
  [key: string]: any;
}

const PIXELS_PER_MINUTE = 40 / 30; // 1.33px per minute

export const useEventResize = (
  updateScheduleEvent: (event: ScheduleEvent) => void | Promise<void>
) => {
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    resizingEventId: null,
    resizeHandle: null,
    tempEvent: null
  });

  const handleResizeStart = useCallback((
    e: React.MouseEvent,
    event: ScheduleEvent,
    handle: 'top' | 'bottom'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    
    const startY = e.clientY;
    const originalStart = new Date(event.startTime);
    const originalEnd = new Date(event.endTime);
    
    // Store the latest temp event in a ref-like variable
    let latestTempEvent: ScheduleEvent | null = { ...event };
    
    setResizeState({
      isResizing: true,
      resizingEventId: event.id,
      resizeHandle: handle,
      tempEvent: latestTempEvent
    });
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      // Convert pixels to minutes
      const deltaMinutes = Math.round((deltaY / 40) * 30);
      // Snap to 15-minute intervals
      const snappedDelta = Math.round(deltaMinutes / 15) * 15;
      
      let newStart = new Date(originalStart);
      let newEnd = new Date(originalEnd);
      
      if (handle === 'top') {
        // Adjust start time
        newStart = new Date(originalStart.getTime() + snappedDelta * 60 * 1000);
        
        // Enforce minimum duration (15 minutes)
        const minDuration = 15 * 60 * 1000;
        if (newEnd.getTime() - newStart.getTime() < minDuration) {
          newStart = new Date(newEnd.getTime() - minDuration);
        }
        
        // Prevent going before midnight
        const midnight = new Date(newStart);
        midnight.setHours(0, 0, 0, 0);
        if (newStart < midnight) {
          newStart = midnight;
        }
      } else {
        // Adjust end time
        newEnd = new Date(originalEnd.getTime() + snappedDelta * 60 * 1000);
        
        // Enforce minimum duration (15 minutes)
        const minDuration = 15 * 60 * 1000;
        if (newEnd.getTime() - newStart.getTime() < minDuration) {
          newEnd = new Date(newStart.getTime() + minDuration);
        }
        
        // Prevent going past end of day
        const endOfDay = new Date(newEnd);
        endOfDay.setHours(23, 59, 59, 999);
        if (newEnd > endOfDay) {
          newEnd = endOfDay;
        }
      }
      
      // Enforce maximum duration (24 hours)
      const duration = newEnd.getTime() - newStart.getTime();
      const maxDuration = 24 * 60 * 60 * 1000;
      if (duration > maxDuration) {
        return;
      }
      
      // Update latest temp event
      latestTempEvent = {
        ...event,
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString()
      };
      
      // Update temp event for optimistic UI
      setResizeState(prev => ({
        ...prev,
        tempEvent: latestTempEvent
      }));
    };
    
    const handleMouseUp = async () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Save the resized event using the latest temp event
      if (latestTempEvent && latestTempEvent.id === event.id) {
        try {
          const result = updateScheduleEvent(latestTempEvent);
          if (result instanceof Promise) {
            await result;
          }
          
          // Only reset state after successful save
          setResizeState({
            isResizing: false,
            resizingEventId: null,
            resizeHandle: null,
            tempEvent: null
          });
        } catch (error) {
          console.error('Failed to update event:', error);
          
          // Reset state even on error to unlock UI
          setResizeState({
            isResizing: false,
            resizingEventId: null,
            resizeHandle: null,
            tempEvent: null
          });
        }
      } else {
        // No changes, just reset
        setResizeState({
          isResizing: false,
          resizingEventId: null,
          resizeHandle: null,
          tempEvent: null
        });
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [updateScheduleEvent]);

  // Get formatted time label for floating display
  const getResizeTimeLabel = useCallback(() => {
    if (!resizeState.tempEvent) return '';
    
    const startTime = format(new Date(resizeState.tempEvent.startTime), 'h:mm a');
    const endTime = format(new Date(resizeState.tempEvent.endTime), 'h:mm a');
    
    return `${startTime} – ${endTime}`;
  }, [resizeState.tempEvent]);

  return {
    resizeState,
    handleResizeStart,
    getResizeTimeLabel
  };
};
