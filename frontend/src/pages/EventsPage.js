import React, { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { getEvents } from '../api';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, MapPinIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ThemeContext } from '../contexts/ThemeContext';

const EventsPage = () => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [events, setEvents] = useState([]);
  const [flags, setFlags] = useState({ serpapi_exhausted: false, scraper_fallback: false, scraper_limited: false });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const debounceTimer = useRef(null);
  const [geo, setGeo] = useState({ lat: null, lon: null, tried: false });

  useEffect(() => {
    if (!navigator.geolocation) { setGeo(g => ({ ...g, tried: true })); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setGeo({ lat: pos.coords.latitude, lon: pos.coords.longitude, tried: true }),
      () => setGeo(g => ({ ...g, tried: true })),
      { timeout: 8000 }
    );
  }, []);

  // Debounce query input
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQ(q), 500);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [q]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getEvents(debouncedQ, geo.lat, geo.lon);
        if (!mounted) return;
        const list = Array.isArray(data?.events) ? data.events : [];
        setEvents(list);
        setFlags({
          serpapi_exhausted: !!data.serpapi_exhausted,
            scraper_fallback: !!data.scraper_fallback,
            scraper_limited: !!data.scraper_limited,
        });
      } catch (err) {
        console.error('EventsPage getEvents error:', err);
        setEvents([]);
        setFlags(f => ({ ...f }));
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [debouncedQ, geo.lat, geo.lon]);

  // Light/Dark adaptive styles similar to HomePage
  const surface = isDark
    ? 'bg-white/10 border border-white/15 hover:border-cyan-400/40 hover:bg-white/15'
    : 'bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300';
  const inputCls = isDark
    ? 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-cyan-500'
    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const subText = isDark ? 'text-gray-300' : 'text-slate-600';
  const muted = isDark ? 'text-gray-400' : 'text-slate-500';
  const isLikelyUrlOnly = useCallback((text) => {
    if (!text) return false;
    const t = String(text).trim();
    const urlRegex = /^(https?:\/\/|www\.)\S+$/i;
    return urlRegex.test(t);
  }, []);

  const formatUrlDisplay = useCallback((u) => {
    if (!u) return '';
    try {
      const url = new URL(u.startsWith('http') ? u : `https://${u}`);
      const host = url.hostname.replace(/^www\./, '');
      let path = url.pathname || '';
      if (path && path !== '/' && path.length > 28) path = path.slice(0, 25) + '…';
      return `${host}${path && path !== '/' ? path : ''}`;
    } catch {
      return u;
    }
  }, []);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className={`text-3xl font-bold ${heading}`}>Events</h1>
          <p className={`mt-1 ${subText}`}>Browse and find events {geo.lat != null ? 'near you' : ''}</p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className={`${muted} absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5`} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search events (e.g. running, concerts, expo)"
              className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none transition ${inputCls}`}
              onKeyDown={(e) => e.key === 'Enter' && setQ(e.target.value)}
            />
          </div>
          <button
            onClick={() => setQ(q)}
            className={`px-5 py-3 rounded-xl font-medium transition shadow-sm ${isDark ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white hover:from-cyan-500 hover:to-emerald-500' : 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-500 hover:to-cyan-500'}`}
          >
            Search
          </button>
          <div className={`text-xs sm:text-sm ${muted} sm:ml-auto`}>
            {geo.lat != null ? 'Using your location for nearby events' : geo.tried ? 'Location unavailable (showing general results)' : 'Detecting location…'}
          </div>
        </div>

        {/* Status / mode banner */}
        {!loading && (flags.serpapi_exhausted || flags.scraper_fallback) && (
          <div className={`mb-4 text-xs sm:text-sm rounded-lg px-4 py-3 border ${isDark ? 'bg-yellow-400/10 border-yellow-300/30 text-yellow-200' : 'bg-amber-50 border-amber-300 text-amber-700'} flex flex-wrap gap-3`}> 
            {flags.serpapi_exhausted && <span>Primary provider quota exhausted – showing fallback results.</span>}
            {flags.scraper_fallback && !flags.serpapi_exhausted && <span>Using fallback data source.</span>}
            {flags.scraper_limited && <span>Limited event data (retry later for more).</span>}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`${isDark ? 'bg-white/10 border-white/15' : 'bg-white border-slate-200'} border rounded-xl p-5 animate-pulse`}>
                <div className={`h-4 w-2/3 ${isDark ? 'bg-white/20' : 'bg-slate-200'} rounded`} />
                <div className="h-3 w-1/3 mt-3 bg-slate-200/50 rounded" />
                <div className="h-3 w-1/2 mt-2 bg-slate-200/50 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {events.map(ev => (
              <div
                key={ev.id}
                onClick={() => navigate(`/events/${encodeURIComponent(ev.id)}`, { state: { event: ev } })}
                className={`${surface} rounded-xl p-5 cursor-pointer transition-colors group relative overflow-hidden`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-lg leading-snug break-words ${heading} group-hover:text-emerald-600 transition-colors`}>{ev.title}</div>
                    {ev.source && (
                      <span className={`inline-block mt-1 text-[10px] tracking-wide uppercase font-medium px-2 py-0.5 rounded ${
                        ev.source.includes('scraper') ? (isDark ? 'bg-fuchsia-600/30 text-fuchsia-200 border border-fuchsia-400/30' : 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-300')
                        : (isDark ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-400/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-300')
                      }`}>{ev.source.replace('_google','')}</span>
                    )}
                  </div>
                  {ev.image && (
                    <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden hidden sm:block bg-slate-100 flex items-center justify-center">
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
            {events.length === 0 && !loading && (
              <div className={`col-span-full ${muted}`}>
                {flags.serpapi_exhausted || flags.scraper_fallback ? 'No fallback events available right now. Try again in a minute.' : `No events found for “${debouncedQ}”.`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
