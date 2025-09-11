import React, { useContext, useEffect, useState } from 'react';
import { getEvents } from '../api';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, MapPinIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Panel from '../components/common/Panel';
import { ThemeContext } from '../contexts/ThemeContext';

const EventsPage = () => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getEvents(q);
        if (!mounted) return;
        const list = Array.isArray(data?.events) ? data.events : [];
        setEvents(list);
      } catch (err) {
        console.error('EventsPage getEvents error:', err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [q]);

  // Light/Dark adaptive styles similar to HomePage
  const surface = isDark ? 'bg-white/10 border border-white/20 hover:bg-white/15' : 'bg-white border border-slate-200 hover:bg-slate-50';
  const inputCls = isDark
    ? 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-cyan-500'
    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const subText = isDark ? 'text-gray-300' : 'text-slate-600';
  const muted = isDark ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${muted}`} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search events..."
              className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none transition ${inputCls}`}
            />
          </div>
        </div>

        {loading ? (
          <div className={subText}>Loading...</div>
        ) : (
          <div className="space-y-4">
            {events.map(ev => (
              <div
                key={ev.id}
                onClick={() => navigate(`/events/${encodeURIComponent(ev.id)}`, { state: { event: ev } })}
                className={`${surface} rounded-xl p-4 cursor-pointer transition-colors`}
              >
                <div className={`font-semibold text-lg ${heading}`}>{ev.title}</div>
                <div className={`flex items-center gap-4 text-sm mt-1 ${subText}`}>
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{ev.start ? new Date(ev.start).toLocaleString() : 'TBA'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{ev.venue}</span>
                  </div>
                </div>
                {ev.description && (
                  <p className={`text-sm mt-2 line-clamp-2 ${subText}`}>{ev.description}</p>
                )}
              </div>
            ))}
            {events.length === 0 && (
              <div className={muted}>No events found for “{q}”.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
