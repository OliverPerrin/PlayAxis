import React, { useContext, useEffect, useState, useCallback } from 'react';
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
  const [geo, setGeo] = useState({ lat: null, lon: null, tried: false });

  useEffect(() => {
    if (!navigator.geolocation) { setGeo(g => ({ ...g, tried: true })); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setGeo({ lat: pos.coords.latitude, lon: pos.coords.longitude, tried: true }),
      () => setGeo(g => ({ ...g, tried: true })),
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getEvents(q, geo.lat, geo.lon);
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
  }, [q, geo.lat, geo.lon]);

  // Light/Dark adaptive styles similar to HomePage
  const surface = isDark
    ? 'bg-white/10 border border-white/15 hover:border-cyan-400/40 hover:bg-white/15'
    : 'bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300';
  const inputCls = isDark
    ? 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-cyan-500'
    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const subText = isDark ? 'text-gray-300' : 'text-slate-600';
  const muted = isDark ? 'text-gray-400' : 'text-slate-500';

  const formatUrlDisplay = useCallback((u) => {
    if (!u) return '';
    try {
      const urlObj = new URL(u);
      let path = urlObj.pathname === '/' ? '' : urlObj.pathname;
      if (path.length > 24) path = path.slice(0, 24) + '…';
      return urlObj.hostname + path;
    } catch {
      return u.length > 40 ? u.slice(0, 40) + '…' : u;
    }
  }, []);

  const isLikelyUrlOnly = (text) => {
    if (!text) return false;
    const trimmed = text.trim();
    return /^https?:\/\//i.test(trimmed) && !trimmed.includes(' ');
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${muted}`} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search events..."
              className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none transition ${inputCls}`}
            />
          </div>
          <div className={`text-xs sm:text-sm ${muted} pl-1 sm:pl-0`}>{geo.lat != null ? 'Using your location for nearby events' : geo.tried ? 'Location unavailable (showing general results)' : 'Detecting location…'}</div>
        </div>

        {loading ? (
          <div className={subText}>Loading...</div>
        ) : (
          <div className="space-y-4">
            {events.map(ev => (
              <div
                key={ev.id}
                onClick={() => navigate(`/events/${encodeURIComponent(ev.id)}`, { state: { event: ev } })}
                className={`${surface} rounded-xl p-5 cursor-pointer transition-colors group relative overflow-hidden`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`font-semibold text-lg leading-snug break-words ${heading} group-hover:text-emerald-500 transition-colors`}>{ev.title}</div>
                  {ev.image && (
                    <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden hidden sm:block bg-slate-200/20 flex items-center justify-center">
                      <img src={ev.image} alt="thumb" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                </div>
                <div className={`flex flex-wrap gap-x-6 gap-y-2 text-xs mt-2 ${subText}`}>
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{ev.start ? new Date(ev.start).toLocaleString() : 'TBA'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{ev.venue}</span>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {ev.description && (
                    isLikelyUrlOnly(ev.description) ? (
                      <a
                        href={ev.description}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`text-sm inline-block max-w-full break-words underline decoration-dotted underline-offset-2 ${isDark ? 'text-cyan-300 hover:text-cyan-200' : 'text-emerald-600 hover:text-emerald-500'}`}
                      >
                        {formatUrlDisplay(ev.description)}
                      </a>
                    ) : (
                      <p className={`text-sm leading-relaxed line-clamp-3 break-words ${subText}`}>{ev.description}</p>
                    )
                  )}
                  {ev.url && !isLikelyUrlOnly(ev.description) && (
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`text-xs inline-block max-w-full truncate hover:underline ${isDark ? 'text-cyan-300 hover:text-cyan-200' : 'text-emerald-600 hover:text-emerald-500'}`}
                      title={ev.url}
                    >
                      {formatUrlDisplay(ev.url)}
                    </a>
                  )}
                </div>
                <div className="absolute inset-0 pointer-events-none rounded-xl ring-1 opacity-0 group-hover:opacity-100 transition-all duration-300 ring-emerald-500/40" />
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
