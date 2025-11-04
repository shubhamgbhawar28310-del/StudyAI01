// Simple test calendar - Use this to verify react-big-calendar works
// Copy this to src/components/features/InteractiveCalendar.tsx temporarily to test

import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export function InteractiveCalendar() {
  // Test events
  const events = [
    {
      title: 'Test Event 1',
      start: new Date(2024, 10, 20, 10, 0),
      end: new Date(2024, 10, 20, 11, 0),
    },
    {
      title: 'Test Event 2',
      start: new Date(2024, 10, 21, 14, 0),
      end: new Date(2024, 10, 21, 15, 30),
    },
  ];

  return (
    <div style={{ height: '700px', padding: '20px' }}>
      <h2 style={{ marginBottom: '10px' }}>Simple Calendar Test</h2>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        If you see a calendar with 2 test events, react-big-calendar is working!
      </p>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        defaultView="week"
        views={['week', 'day', 'month']}
      />
    </div>
  );
}
