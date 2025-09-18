
import React, { useEffect, useState } from 'react';
import { getSportsEvents } from '../api';

function SportsList() {
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSportsEvents = async () => {
      try {
        // Using a hardcoded sport for now. You can make this dynamic.
  const data = await getSportsEvents('nfl');
  setUpcoming(data.upcoming || []);
  setRecent(data.recent || []);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchSportsEvents();
  }, []);

  return (
    <div className="bg-white shadow rounded-lg p-4 mt-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Sports Events (NFL)</h2>
      {error && <p className="text-red-500">{error}</p>}
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Upcoming</h3>
          <ul>
            {upcoming.map(ev => (
              <li key={ev.id} className="border-b py-2">
                <p className="font-semibold">{ev.home_team} vs {ev.away_team}</p>
                <p className="text-sm text-gray-600">{ev.date} {ev.time}</p>
              </li>
            ))}
            {upcoming.length === 0 && <li className="text-sm text-gray-500">No upcoming events.</li>}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Recent</h3>
          <ul>
            {recent.map(ev => (
              <li key={ev.id} className="border-b py-2">
                <p className="font-semibold">{ev.home_team} {ev.home_score ?? ''} - {ev.away_score ?? ''} {ev.away_team}</p>
                <p className="text-sm text-gray-600">{ev.date} {ev.time}</p>
              </li>
            ))}
            {recent.length === 0 && <li className="text-sm text-gray-500">No recent events.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SportsList;
