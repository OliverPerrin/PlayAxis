import React, { useEffect, useMemo, useState, useCallback, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvent } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getMe } from '../api';
import { ThemeContext } from '../contexts/ThemeContext';

// Use the same base as the rest of the app through the proxy
const API_BASE = (() => {
  const env = process.env.REACT_APP_API_URL;
  if (env) return env.replace(/\/$/, '') + '/api/v1';
  if (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')) return '/api/v1';
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) return '/api/v1';
  return 'https://raw-minne-multisportsandevents-7f82c207.koyeb.app/api/v1';
})();

const fetchViewportEvents = async ({ q, bbox }) => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (bbox) {
    params.set('min_lat', bbox.min_lat);
    params.set('max_lat', bbox.max_lat);
    params.set('min_lon', bbox.min_lon);
    params.set('max_lon', bbox.max_lon);
  }
  const headers = { 'Accept': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/events/viewport?${params.toString()}`, { headers });
  if (!res.ok) throw new Error('Failed to load events');
  return res.json();
};

const useGeolocation = () => {
  const [pos, setPos] = useState({ lat: 40.7128, lon: -74.0060, ok: false }); // default NYC
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lon: p.coords.longitude, ok: true }),
      () => {}, // ignore errors (stay default)
      { timeout: 8000 }
    );
  }, []);
  return pos;
};

const Recenter = ({ lat, lon }) => {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lon != null) map.setView([lat, lon], 11);
  }, [lat, lon, map]);
  return null;
};

const ViewportWatcher = ({ onChange }) => {
  const map = useMapEvent('moveend', () => {
    const b = map.getBounds();
    const bbox = {
      min_lat: b.getSouth(),
      max_lat: b.getNorth(),
      min_lon: b.getWest(),
      max_lon: b.getEast(),
    };
    onChange(bbox);
  });
  return null;
};

export default function EventsMapPage() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const me = useGeolocation();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  const center = useMemo(() => [me.lat, me.lon], [me.lat, me.lon]);

  const [bbox, setBbox] = useState(null);

  const load = useCallback(async (opts = {}) => {
    try {
      setLoading(true);
      const data = await fetchViewportEvents({ q: query, bbox: opts.bbox || bbox });
      setEvents(data.events || []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [query, bbox]);

  // Initial load once geolocation known or after slight delay
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [me.ok]);

  const handleViewportChange = useCallback((nextBbox) => {
    setBbox(nextBbox);
    // Debounce lightly using setTimeout
    setTimeout(() => {
      load({ bbox: nextBbox });
    }, 150);
  }, [load]);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="w-full md:w-1/2 h-full">
        <div className="p-3 flex gap-2 border-b border-slate-200 dark:border-white/10">
          <input
            className={`rounded px-3 py-2 w-full outline-none transition text-sm ${isDark ? 'bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-cyan-400' : 'bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-emerald-500'}`}
            placeholder="Search events (e.g. concerts in Austin, festivals in Chicago)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
          />
          <button onClick={load} className={`px-4 py-2 rounded text-sm font-medium shadow-sm transition ${isDark ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white hover:from-cyan-500 hover:to-emerald-500' : 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-500 hover:to-cyan-500'}`}>Search</button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-56px)] p-0">
          {loading ? (
            <p className={`px-4 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Loading…</p>
          ) : error ? (
            <p className="px-4 py-4 text-sm text-red-600">{error}</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-white/10">
              {(events || []).map((e) => (
                <li
                  key={e.id}
                  className={`p-4 text-sm cursor-pointer group transition relative ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                  onClick={() => {
                    const lat = e.latitude, lon = e.longitude;
                    if (lat != null && lon != null) {
                      // optional: could pan map via custom event or context
                    }
                  }}
                >
                  <div className={`font-medium mb-1 leading-snug break-words ${isDark ? 'text-white group-hover:text-cyan-300' : 'text-slate-900 group-hover:text-emerald-600'}`}>{e.name || e.title || '(no title)'}</div>
                  {e.start && <div className={`mb-1 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{new Date(e.start).toLocaleString()}</div>}
                  {(e.city || e.country) && <div className={`${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{[e.city, e.country].filter(Boolean).join(', ')}</div>}
                  {e.url && <a className={`mt-1 inline-block truncate max-w-full ${isDark ? 'text-cyan-300 hover:text-cyan-200' : 'text-emerald-600 hover:text-emerald-500'}`} href={e.url} target="_blank" rel="noreferrer">Details</a>}
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 ring-1 ring-emerald-500/40 rounded" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="hidden md:block md:w-1/2 h-full">
        <MapContainer center={center} zoom={me.ok ? 11 : 3} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter lat={me.ok ? me.lat : null} lon={me.ok ? me.lon : null} />
          <ViewportWatcher onChange={handleViewportChange} />
          {(events || [])
            .filter(e => e.latitude != null && e.longitude != null)
            .map(e => (
              <Marker key={e.id} position={[e.latitude, e.longitude]}>
                <Popup>
                  <div className="space-y-1 text-sm">
                    <div className={`font-semibold mb-1 ${isDark ? 'text-slate-900' : 'text-slate-900'}`}>{e.name || e.title || '(no title)'}</div>
                    {e.start && <div className="text-xs text-slate-600">{new Date(e.start).toLocaleString()}</div>}
                    {(e.city || e.country) && <div className="text-xs text-slate-600">{[e.city, e.country].filter(Boolean).join(', ')}</div>}
                    {e.url && <a className="text-xs text-emerald-600 hover:underline" href={e.url} target="_blank" rel="noreferrer">Open</a>}
                  </div>
                </Popup>
              </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}