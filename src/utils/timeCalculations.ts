import { setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';

/**
 * Convert time slot string (HH:mm) to minutes since midnight
 */
export const timeToMinutes = (timeSlot: string): number => {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Round minutes to nearest 15-minute interval for snapping
 */
export const snapToQuarterHour = (minutes: number): number => {
  return Math.round(minutes / 15) * 15;
};

/**
 * Calculate minutes from midnight for a Date object
 */
export const getMinutesFromMidnight = (date: Date): number => {
  return date.getHours() * 60 + date.getMinutes();
};

/**
 * Create a new Date with specific time on a given day
 * Ensures proper timezone handling
 */
export const setTimeOnDate = (date: Date, hours: number, minutes: number): Date => {
  let result = new Date(date);
  result = setHours(result, hours);
  result = setMinutes(result, minutes);
  result = setSeconds(result, 0);
  result = setMilliseconds(result, 0);
  return result;
};

/**
 * Validate resize operation constraints
 */
export const validateResize = (
  startTime: Date,
  endTime: Date
): { valid: boolean; error?: string } => {
  const duration = endTime.getTime() - startTime.getTime();
  const durationMinutes = duration / (60 * 1000);
  
  if (durationMinutes < 15) {
    return {
      valid: false,
      error: 'Event duration must be at least 15 minutes'
    };
  }
  
  if (durationMinutes > 1440) {
    return {
      valid: false,
      error: 'Event duration cannot exceed 24 hours'
    };
  }
  
  if (startTime >= endTime) {
    return {
      valid: false,
      error: 'Start time must be before end time'
    };
  }
  
  return { valid: true };
};
