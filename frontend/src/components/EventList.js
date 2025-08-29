import React, { useEffect, useState } from 'react';
import { getRecommendations } from '../api';

function EventList({ selectedInterests }) {
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const data = await getRecommendations();
        setRecommendations(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [selectedInterests]);

  return (
    <div className="bg-white shadow rounded-lg p-4 mt-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Recommended Events</h2>
      {error && <p className="text-red-500">{error}</p>}
      {loading ? (
        <p>Loading recommendations...</p>
      ) : (
        <ul>
          {recommendations.map((item, index) => (
            <li key={index} className="border-b py-2">
              {item.type === 'eventbrite' && (
                <>
                  <p className="font-semibold">{item.data.name.text}</p>
                  <p className="text-sm text-gray-600">{new Date(item.data.start.local).toLocaleString()}</p>
                </>
              )}
              {item.type === 'twitch' && (
                <>
                  <p className="font-semibold">{item.data.title}</p>
                  <p className="text-sm text-gray-600">{item.data.user_name}</p>
                  <p className="text-sm text-gray-600">Viewers: {item.data.viewer_count}</p>
                </>
              )}
              {item.type === 'sportsbook' && (
                <>
                  <p className="font-semibold">{item.data.home_team} vs {item.data.away_team}</p>
                  <p className="text-sm text-gray-600">{new Date(item.data.commence_time).toLocaleString()}</p>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default EventList;