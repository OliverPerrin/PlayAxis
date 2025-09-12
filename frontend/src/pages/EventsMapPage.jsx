import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvent } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getMe } from '../api';

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
        <div className="p-3 flex gap-2">
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Search events (e.g. concerts in Austin, festivals in Chicago)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
          />
          <button onClick={load} className="px-4 py-2 bg-blue-600 text-white rounded">Search</button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-56px)] p-3">
          {loading ? <p>Loading…</p> : error ? <p className="text-red-600">{error}</p> : (
            <ul className="divide-y">
              {(events || []).map((e) => (
                <li key={e.id} className="py-3">
                  <div className="font-semibold">{e.name || e.title || '(no title)'} <span className="text-xs text-gray-500">[{e.source}]</span></div>
                  {e.start && <div className="text-sm text-gray-600">{new Date(e.start).toLocaleString()}</div>}
                  {(e.city || e.country) && <div className="text-sm text-gray-600">{[e.city, e.country].filter(Boolean).join(', ')}</div>}
                  {e.url && <a className="text-blue-600 text-sm" href={e.url} target="_blank" rel="noreferrer">Details</a>}
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
                  <div className="space-y-1">
                    <div className="font-semibold">{e.name || e.title || '(no title)'}</div>
                    {e.start && <div className="text-sm">{new Date(e.start).toLocaleString()}</div>}
                    {(e.city || e.country) && <div className="text-sm text-gray-600">{[e.city, e.country].filter(Boolean).join(', ')}</div>}
                    {e.url && <a className="text-blue-600 text-sm" href={e.url} target="_blank" rel="noreferrer">Open</a>}
                  </div>
                </Popup>
              </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}