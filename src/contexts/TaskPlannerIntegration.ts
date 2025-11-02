/**
 * Task & Planner Integration Helper Functions
 * 
 * This file contains helper functions for integrating the Task Manager
 * and Study Planner modules. Import these into StudyPlannerContext.
 */

import { Task, ScheduleEvent } from './StudyPlannerContext';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  score?: number;
  reason?: string;
}

export interface ScheduleSuggestion {
  task: Task;
  suggestedSlots: TimeSlot[];
}

export interface ConflictInfo {
  hasConflict: boolean;
  conflictingEvents: ScheduleEvent[];
  message?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all schedule events for a specific task
 */
export function getScheduleEventsByTask(
  scheduleEvents: ScheduleEvent[],
  taskId: string
): ScheduleEvent[] {
  return scheduleEvents.filter(event => event.taskId === taskId);
}

/**
 * Get the task associated with a schedule event
 */
export function getTaskForEvent(
  tasks: Task[],
  eventId: string,
  scheduleEvents: ScheduleEvent[]
): Task | undefined {
  const event = scheduleEvents.find(e => e.id === eventId);
  if (!event || !event.taskId) return undefined;
  return tasks.find(t => t.id === event.taskId);
}

/**
 * Get all unscheduled tasks
 */
export function getUnscheduledTasks(
  tasks: Task[],
  scheduleEvents: ScheduleEvent[]
): Task[] {
  return tasks.filter(task => {
    if (task.completed) return false;
    
    // Check if task has any non-missed schedule events
    const hasSchedule = scheduleEvents.some(
      event => event.taskId === task.id && event.status !== 'missed'
    );
    
    return !hasSchedule;
  });
}

/**
 * Check if a time slot has conflicts with existing events
 */
export function checkTimeSlotConflict(
  scheduleEvents: ScheduleEvent[],
  startTime: Date,
  endTime: Date,
  excludeEventId?: string
): ConflictInfo {
  const conflictingEvents = scheduleEvents.filter(event => {
    if (excludeEventId && event.id === excludeEventId) return false;
    if (event.status === 'missed') return false;
    
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    // Check for overlap
    return (
      (startTime >= eventStart && startTime < eventEnd) ||
      (endTime > eventStart && endTime <= eventEnd) ||
      (startTime <= eventStart && endTime >= eventEnd)
    );
  });
  
  return {
    hasConflict: conflictingEvents.length > 0,
    conflictingEvents,
    message: conflictingEvents.length > 0
      ? `Conflicts with ${conflictingEvents.length} existing event(s)`
      : undefined
  };
}

/**
 * Get available time slots for a date range
 */
export function getAvailableTimeSlots(
  scheduleEvents: ScheduleEvent[],
  startDate: Date,
  endDate: Date,
  slotDurationMinutes: number = 60,
  studyHoursStart: number = 8,
  studyHoursEnd: number = 22
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Generate slots for each hour in study hours
    for (let hour = studyHoursStart; hour < studyHoursEnd; hour++) {
      const slotStart = new Date(currentDate);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDurationMinutes);
      
      // Check if slot is in the past
      if (slotStart < new Date()) continue;
      
      // Check for conflicts
      const conflict = checkTimeSlotConflict(scheduleEvents, slotStart, slotEnd);
      
      slots.push({
        id: `${slotStart.toISOString()}-${slotEnd.toISOString()}`,
        date: slotStart.toISOString().split('T')[0],
        startTime: slotStart.toTimeString().slice(0, 5),
        endTime: slotEnd.toTimeString().slice(0, 5),
        isAvailable: !conflict.hasConflict
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return slots;
}

/**
 * Calculate a score for a time slot based on task properties
 */
export function calculateSlotScore(
  slot: TimeSlot,
  task: Task,
  scheduleEvents: ScheduleEvent[]
): number {
  let score = 100;
  
  const slotDateTime = new Date(`${slot.date}T${slot.startTime}:00`);
  const now = new Date();
  const hoursUntilSlot = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  // Priority-based scoring
  if (task.priority === 'urgent') {
    score += Math.max(0, 50 - hoursUntilSlot * 10);
  } else if (task.priority === 'high') {
    score += Math.max(0, 30 - hoursUntilSlot * 5);
  }
  
  // Due date proximity
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const hoursBeforeDue = (dueDate.getTime() - slotDateTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursBeforeDue > 0) {
      // Prefer slots closer to due date but not too close
      if (hoursBeforeDue < 24) {
        score += 40; // Very close to due date
      } else if (hoursBeforeDue < 72) {
        score += 30; // Within 3 days
      } else {
        score += 20; // More than 3 days
      }
    } else {
      score -= 50; // After due date (bad!)
    }
  }
  
  // Optimal study times (9am-12pm, 2pm-5pm)
  const hour = parseInt(slot.startTime.split(':')[0]);
  if ((hour >= 9 && hour < 12) || (hour >= 14 && hour < 17)) {
    score += 20;
  }
  
  // Prefer slots with buffer time (no adjacent events)
  const slotStart = new Date(`${slot.date}T${slot.startTime}:00`);
  const slotEnd = new Date(slotStart);
  slotEnd.setHours(slotEnd.getHours() + 1);
  
  const hasAdjacentEvents = scheduleEvents.some(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    // Check if event is within 30 minutes before or after
    const timeDiff = Math.abs(eventStart.getTime() - slotEnd.getTime()) / (1000 * 60);
    return timeDiff < 30 || Math.abs(eventEnd.getTime() - slotStart.getTime()) / (1000 * 60) < 30;
  });
  
  if (!hasAdjacentEvents) {
    score += 15;
  }
  
  // Difficulty-based duration preference
  if (task.difficulty === 'hard') {
    // Prefer morning slots for hard tasks
    if (hour >= 9 && hour < 12) {
      score += 10;
    }
  }
  
  return score;
}

/**
 * Get suggested time slots for a task
 */
export function getSuggestedTimeSlots(
  task: Task,
  scheduleEvents: ScheduleEvent[],
  maxSuggestions: number = 3
): TimeSlot[] {
  const now = new Date();
  const endDate = new Date();
  
  // Look ahead based on priority
  const lookAheadDays = {
    urgent: 1,
    high: 3,
    medium: 7,
    low: 14
  };
  
  endDate.setDate(endDate.getDate() + lookAheadDays[task.priority]);
  
  // Get available slots
  const availableSlots = getAvailableTimeSlots(
    scheduleEvents,
    now,
    endDate
  ).filter(slot => slot.isAvailable);
  
  // Score each slot
  const scoredSlots = availableSlots.map(slot => ({
    ...slot,
    score: calculateSlotScore(slot, task, scheduleEvents)
  }));
  
  // Sort by score and return top suggestions
  const topSlots = scoredSlots
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, maxSuggestions);
  
  // Add reasons
  return topSlots.map(slot => ({
    ...slot,
    reason: getSlotReason(slot, task)
  }));
}

/**
 * Get a human-readable reason for why a slot was suggested
 */
function getSlotReason(slot: TimeSlot, task: Task): string {
  const hour = parseInt(slot.startTime.split(':')[0]);
  const slotDate = new Date(slot.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysUntil = Math.floor((slotDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (task.priority === 'urgent' && daysUntil === 0) {
    return 'Urgent - Today';
  }
  
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const daysUntilDue = Math.floor((dueDate.getTime() - slotDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue <= 1) {
      return 'Due Soon';
    } else if (daysUntilDue <= 3) {
      return 'Before Deadline';
    }
  }
  
  if (hour >= 9 && hour < 12) {
    return 'Peak Focus Time';
  }
  
  if (hour >= 14 && hour < 17) {
    return 'Afternoon Slot';
  }
  
  if (daysUntil === 0) {
    return 'Available Today';
  }
  
  if (daysUntil === 1) {
    return 'Tomorrow';
  }
  
  return `In ${daysUntil} days`;
}

/**
 * Auto-schedule multiple tasks
 */
export function autoScheduleTasks(
  tasks: Task[],
  scheduleEvents: ScheduleEvent[],
  maxTasksToSchedule: number = 10
): ScheduleSuggestion[] {
  // Get unscheduled tasks
  const unscheduled = getUnscheduledTasks(tasks, scheduleEvents);
  
  // Sort by priority and due date
  const sortedTasks = unscheduled
    .sort((a, b) => {
      // Priority order
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      
      return 0;
    })
    .slice(0, maxTasksToSchedule);
  
  // Get suggestions for each task
  return sortedTasks.map(task => ({
    task,
    suggestedSlots: getSuggestedTimeSlots(task, scheduleEvents, 1)
  }));
}

/**
 * Sync task and event statuses
 */
export function syncTaskEventStatus(
  task: Task,
  scheduleEvents: ScheduleEvent[]
): { updatedTask?: Task; updatedEvents?: ScheduleEvent[] } {
  const taskEvents = getScheduleEventsByTask(scheduleEvents, task.id);
  
  // If task is completed, mark all events as completed
  if (task.completed || task.status === 'completed') {
    const updatedEvents = taskEvents.map(event => ({
      ...event,
      status: 'completed' as const,
      completed_at: new Date().toISOString()
    }));
    
    return { updatedEvents };
  }
  
  // If all events are completed, mark task as completed
  if (taskEvents.length > 0 && taskEvents.every(e => e.status === 'completed')) {
    return {
      updatedTask: {
        ...task,
        completed: true,
        status: 'completed',
        updatedAt: new Date().toISOString()
      }
    };
  }
  
  // If any event is in progress, mark task as in progress
  if (taskEvents.some(e => e.status === 'in_progress')) {
    return {
      updatedTask: {
        ...task,
        status: 'in_progress',
        updatedAt: new Date().toISOString()
      }
    };
  }
  
  return {};
}

/**
 * Format time slot for display
 */
export function formatTimeSlot(slot: TimeSlot): string {
  const date = new Date(slot.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  let dateStr = '';
  if (date.getTime() === today.getTime()) {
    dateStr = 'Today';
  } else if (date.getTime() === tomorrow.getTime()) {
    dateStr = 'Tomorrow';
  } else {
    dateStr = date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  return `${dateStr} at ${slot.startTime}`;
}

/**
 * Get productivity stats for a date range
 */
export function getProductivityStats(
  tasks: Task[],
  scheduleEvents: ScheduleEvent[],
  startDate: Date,
  endDate: Date
) {
  const tasksInRange = tasks.filter(task => {
    const createdAt = new Date(task.createdAt);
    return createdAt >= startDate && createdAt <= endDate;
  });
  
  const eventsInRange = scheduleEvents.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate >= startDate && eventDate <= endDate;
  });
  
  return {
    totalTasks: tasksInRange.length,
    completedTasks: tasksInRange.filter(t => t.completed).length,
    inProgressTasks: tasksInRange.filter(t => t.status === 'in_progress').length,
    missedTasks: tasksInRange.filter(t => t.status === 'missed').length,
    totalEvents: eventsInRange.length,
    completedEvents: eventsInRange.filter(e => e.status === 'completed').length,
    missedEvents: eventsInRange.filter(e => e.status === 'missed').length,
    scheduledTasks: tasksInRange.filter(t => 
      scheduleEvents.some(e => e.taskId === t.id)
    ).length,
    unscheduledTasks: getUnscheduledTasks(tasksInRange, scheduleEvents).length,
    completionRate: tasksInRange.length > 0
      ? Math.round((tasksInRange.filter(t => t.completed).length / tasksInRange.length) * 100)
      : 0
  };
}

/**
 * Validate schedule event data
 */
export function validateScheduleEvent(
  title: string,
  startTime: Date,
  endTime: Date
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!title || title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (startTime >= endTime) {
    errors.push('End time must be after start time');
  }
  
  if (startTime < new Date()) {
    errors.push('Cannot schedule events in the past');
  }
  
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  if (duration < 15) {
    errors.push('Event must be at least 15 minutes long');
  }
  
  if (duration > 480) {
    errors.push('Event cannot be longer than 8 hours');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
