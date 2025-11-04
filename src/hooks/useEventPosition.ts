import { useMemo } from 'react';

interface EventPosition {
  top: number;
  height: number;
}

interface ScheduleEvent {
  id: string;
  startTime: string;
  endTime: string;
  [key: string]: any;
}

// Constants
const PIXELS_PER_MINUTE = 40 / 30; // 1.33px per minute (40px per 30-min slot)

/**
 * Custom hook to calculate event position and height based on start/end times
 * Used for absolute positioning of events in the calendar grid
 */
export const useEventPosition = (event: ScheduleEvent): EventPosition => {
  return useMemo(() => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    
    // Calculate minutes from midnight
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const duration = endMinutes - startMinutes;
    
    return {
      top: startMinutes * PIXELS_PER_MINUTE,
      height: Math.max(duration * PIXELS_PER_MINUTE, 20) // Minimum 20px for 15-min events
    };
  }, [event.startTime, event.endTime]);
};
