
import React, { useEffect, useState } from 'react';
import { getSportsEvents } from '../api';

function SportsList() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSportsEvents = async () => {
      try {
        // Using a hardcoded sport for now. You can make this dynamic.
        const data = await getSportsEvents('nfl');
        setEvents(data);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchSportsEvents();
  }, []);

  return (
    <div className="bg-white shadow rounded-lg p-4 mt-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Sports Events</h2>
      {error && <p className="text-red-500">{error}</p>}
      <ul>
        {events && events.map(event => (
          <li key={event.GameKey} className="border-b py-2">
            <p className="font-semibold">{event.HomeTeam} vs {event.AwayTeam}</p>
            <p className="text-sm text-gray-600">{new Date(event.Date).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SportsList;
