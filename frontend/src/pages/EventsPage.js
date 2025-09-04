import React, { useEffect, useState } from 'react';
import { getEvents } from '../api';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, MapPinIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const EventsPage = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('sports events');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getEvents(q);
        if (!mounted) return;
        const list = Array.isArray(data?.events) ? data.events : [];
        const normalized = list.map((e, idx) => ({
          id: e?.id || `${idx}`,
          title: e?.title || e?.name?.text || 'Untitled Event',
          date: e?.start?.local || e?.date || null,
          location: e?.venue?.name || e?.location || 'Location TBA',
          description: e?.description?.text || e?.description || '',
        }));
        setEvents(normalized);
      } catch (err) {
        console.error('EventsPage getEvents error:', err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [q]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-gray-300">Loading...</div>
        ) : (
          <div className="space-y-4">
            {events.map(ev => (
              <div
                key={ev.id}
                onClick={() => navigate(`/events/${encodeURIComponent(ev.id)}`, { state: { event: {
                  id: ev.id,
                  title: ev.title,
                  description: ev.description,
                  start: { local: ev.date },
                  venue: { name: ev.location },
                } } })}
                className="bg-white/10 border border-white/20 rounded-xl p-4 hover:bg-white/15 cursor-pointer"
              >
                <div className="text-white font-semibold text-lg">{ev.title}</div>
                <div className="flex items-center gap-4 text-sm text-gray-300 mt-1">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{ev.date ? new Date(ev.date).toLocaleString() : 'TBA'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{ev.location}</span>
                  </div>
                </div>
                {ev.description && (
                  <p className="text-gray-300 text-sm mt-2">{ev.description}</p>
                )}
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-gray-400">No events found for “{q}”.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;