
import React, { useEffect, useState } from 'react';
import { getStreams } from '../api';

function StreamList() {
  const [streams, setStreams] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        // Using a hardcoded game ID for now. You can make this dynamic.
        const data = await getStreams('509658'); // Apex Legends
        setStreams(data.data);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchStreams();
  }, []);

  return (
    <div className="bg-white shadow rounded-lg p-4 mt-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Live Streams</h2>
      {error && <p className="text-red-500">{error}</p>}
      <ul>
        {streams && streams.map(stream => (
          <li key={stream.id} className="border-b py-2">
            <p className="font-semibold">{stream.title}</p>
            <p className="text-sm text-gray-600">{stream.user_name}</p>
            <p className="text-sm text-gray-600">Viewers: {stream.viewer_count}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StreamList;
