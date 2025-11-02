/**
 * Calendar Event Types
 * 
 * Type definitions for the dynamic calendar system
 */

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

/**
 * Convert a ScheduleEvent to a CalendarEvent
 */
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
      isAutoScheduled: event.color === 'bg-blue-500' // Mark auto-scheduled events
    }
  };
}

/**
 * Convert multiple ScheduleEvents to CalendarEvents
 */
export function convertToCalendarEvents(
  events: ScheduleEvent[],
  tasks: Task[]
): CalendarEvent[] {
  return events.map(event => {
    const task = event.taskId 
      ? tasks.find(t => t.id === event.taskId)
      : undefined;
    return convertToCalendarEvent(event, task);
  });
}

/**
 * Get event color based on status
 */
export function getEventColor(status: string, type: string, isAutoScheduled: boolean): string {
  if (status === 'completed') return '#10b981'; // green
  if (status === 'in_progress') return '#f59e0b'; // yellow
  if (status === 'missed') return '#ef4444'; // red
  if (isAutoScheduled) return '#6366f1'; // indigo
  if (type === 'break') return '#8b5cf6'; // purple
  return '#3174ad'; // default blue
}

/**
 * Calculate event duration in minutes
 */
export function getEventDuration(event: CalendarEvent): number {
  return Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 60));
}

/**
 * Check if event is happening now
 */
export function isEventNow(event: CalendarEvent): boolean {
  const now = new Date();
  return event.start <= now && event.end >= now;
}

/**
 * Check if event is upcoming (within next hour)
 */
export function isEventUpcoming(event: CalendarEvent): boolean {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  return event.start > now && event.start <= oneHourLater;
}

/**
 * Group events by date
 */
export function groupEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();
  
  events.forEach(event => {
    const dateKey = event.start.toISOString().split('T')[0];
    const existing = grouped.get(dateKey) || [];
    grouped.set(dateKey, [...existing, event]);
  });
  
  return grouped;
}

/**
 * Get events for a specific date
 */
export function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  return events.filter(event => {
    const eventDate = new Date(event.start);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() === targetDate.getTime();
  });
}

/**
 * Get events for a date range
 */
export function getEventsForRange(
  events: CalendarEvent[],
  startDate: Date,
  endDate: Date
): CalendarEvent[] {
  return events.filter(event => 
    event.start >= startDate && event.start <= endDate
  );
}

/**
 * Sort events by start time
 */
export function sortEventsByTime(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
}
