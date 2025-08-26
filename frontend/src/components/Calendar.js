
import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { getEvents } from '../api';

function Calendar({ selectedInterests }) {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const query = selectedInterests.join(' OR ') || 'sports';
        const data = await getEvents(query);
        const formattedEvents = data.events.map(event => ({
          title: event.name.text,
          start: event.start.local,
          end: event.end.local,
          url: event.url,
        }));
        setEvents(formattedEvents);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchEvents();
  }, [selectedInterests]);

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Event Calendar</h2>
      {error && <p className="text-red-500">{error}</p>}
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
      />
    </div>
  );
}

export default Calendar;
