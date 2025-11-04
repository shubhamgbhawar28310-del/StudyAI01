// Google Calendar-Style Interactive Planner for StudyAI
// Full drag-and-drop, resize, and click-to-create functionality

import { useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, SlotInfo, View, Components } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { useStudyPlanner } from '@/contexts/StudyPlannerContext';
import { scheduleEventService } from '@/services/scheduleEventService';
import { ScheduleEventModal } from '@/components/modals/ScheduleEventModal';
import { CustomCalendarToolbar } from './CustomCalendarToolbar';
import { CustomCalendarEvent } from './CustomCalendarEvent';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Import styles
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import '@/styles/calendar.css';

// Setup localizer
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Create drag-and-drop calendar
const DnDCalendar = withDragAndDrop(Calendar);

// Event interface
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    type: string;
    description?: string;
    taskId?: string;
    color?: string;
    status?: string;
  };
}

// Custom components for calendar
const customComponents: Components<CalendarEvent> = {
  toolbar: CustomCalendarToolbar,
  event: CustomCalendarEvent,
};

export function InteractiveCalendar() {
  const { state } = useStudyPlanner();
  const { toast } = useToast();
  
  // State
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<View>('week');

  // Convert events
  const events: CalendarEvent[] = useMemo(() => {
    return state.scheduleEvents.map(event => ({
      id: event.id,
      title: event.title,
      start: new Date(event.startTime),
      end: new Date(event.endTime),
      resource: {
        type: event.type || 'other',
        description: event.description,
        taskId: event.taskId,
        color: event.color,
        status: event.status || 'scheduled',
      },
    }));
  }, [state.scheduleEvents]);

  // Handle slot selection (click to create)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlot({
      date: format(slotInfo.start, 'yyyy-MM-dd'),
      time: format(slotInfo.start, 'HH:mm'),
    });
    setEditingEventId(null);
    setShowEventModal(true);
  }, []);

  // Handle event selection (click to edit)
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setEditingEventId(event.id);
    setSelectedSlot(null);
    setShowEventModal(true);
  }, []);

  // Handle event drop (drag to move)
  const handleEventDrop = useCallback(async ({ event, start, end }: any) => {
    console.log('Event dropped:', event, start, end);
    setIsLoading(true);
    
    try {
      await scheduleEventService.updateEvent(event.id, {
        title: event.title,
        description: event.resource?.description,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        type: event.resource?.type || 'other',
        taskId: event.resource?.taskId,
        color: event.resource?.color,
      });
      
      toast({
        title: 'Event moved',
        description: `"${event.title}" has been rescheduled`,
      });
    } catch (error) {
      console.error('Error moving event:', error);
      toast({
        title: 'Error',
        description: 'Failed to move event',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Handle event resize
  const handleEventResize = useCallback(async ({ event, start, end }: any) => {
    console.log('Event resized:', event, start, end);
    setIsLoading(true);
    
    try {
      await scheduleEventService.updateEvent(event.id, {
        title: event.title,
        description: event.resource?.description,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        type: event.resource?.type || 'other',
        taskId: event.resource?.taskId,
        color: event.resource?.color,
      });
      
      toast({
        title: 'Event resized',
        description: `Duration updated for "${event.title}"`,
      });
    } catch (error) {
      console.error('Error resizing event:', error);
      toast({
        title: 'Error',
        description: 'Failed to resize event',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Custom event styling
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const type = event.resource?.type || 'other';
    return {
      className: `event-${type}`,
    };
  }, []);

  console.log('🎨 Rendering InteractiveCalendar');
  console.log('📊 Events to display:', events.length);
  console.log('📅 Current view:', currentView);

  return (
    <div className="relative h-full w-full">
      {/* Debug info */}
      <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
        <strong>Debug:</strong> InteractiveCalendar loaded | Events: {events.length} | View: {currentView}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm font-medium">Updating...</span>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="h-full">
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%', minHeight: '600px' }}
          defaultView="week"
          view={currentView}
          onView={setCurrentView}
          views={['day', 'week', 'month', 'agenda']}
          step={30}
          timeslots={2}
          min={new Date(2024, 0, 1, 6, 0, 0)}
          max={new Date(2024, 0, 1, 23, 59, 59)}
          selectable
          resizable
          draggableAccessor={() => true}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          eventPropGetter={eventStyleGetter}
          popup
          showMultiDayTimes
          scrollToTime={new Date(2024, 0, 1, 8, 0, 0)}
        />
      </div>

      {/* Event Modal */}
      <ScheduleEventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setEditingEventId(null);
          setSelectedSlot(null);
        }}
        editingEventId={editingEventId}
        defaultDate={selectedSlot?.date}
        defaultTime={selectedSlot?.time}
      />
    </div>
  );
}
