import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { getEvents } from '../api';

function Calendar({ selectedInterests }) {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      
      try {
  const query = selectedInterests.length > 0 ? selectedInterests.join(' OR ') : '';
        const data = await getEvents(query);

        // Check if data has events property and it's an array
        if (data && data.events && Array.isArray(data.events)) {
          const formattedEvents = data.events.map(event => ({
            title: event.title || event.name?.text || 'Untitled Event',
            start: event.start || event.start_time || event?.start?.local,
            end: event.end || event.end_time || event?.end?.local,
            url: event.url,
          })).filter(event => event.start); // Only include events with start time

          setEvents(formattedEvents);
        } else {
          // If no events or wrong format, set empty array
          setEvents([]);
          if (data && !data.events) {
            console.warn('API response missing events property:', data);
          }
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events. Please try again later.');
        setEvents([]); // Set empty events on error
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [selectedInterests]);

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Event Calendar</h2>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Event Calendar</h2>
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading events...</p>
        </div>
      ) : (
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={events}
          height="auto"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth'
          }}
          eventDisplay="block"
          dayMaxEvents={3}
          moreLinkClick="popover"
        />
      )}
    </div>
  );
}

export default Calendar;