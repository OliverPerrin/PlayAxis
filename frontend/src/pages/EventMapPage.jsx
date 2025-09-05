import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const API_BASE = '/api/v1';

const fetchAggregate = async ({ q, lat, lon }) => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (lat != null && lon != null) {
    params.set('lat', lat);
    params.set('lon', lon);
  }
  const res = await fetch(`${API_BASE}/aggregate/events?${params.toString()}`, {
    headers: {
      'Accept': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
  });
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

export default function EventsMapPage() {
  const me = useGeolocation();
  const [query, setQuery] = useState('sports');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  const center = useMemo(() => [me.lat, me.lon], [me.lat, me.lon]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchAggregate({ q: query, lat: me.ok ? me.lat : undefined, lon: me.ok ? me.lon : undefined });
      setEvents(data.events || []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [me.ok]);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="w-full md:w-1/2 h-full">
        <div className="p-3 flex gap-2">
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Search events (e.g. Formula 1, skiing, trail running)"
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
                  <div className="font-semibold">{e.title || '(no title)'} <span className="text-xs text-gray-500">[{e.source}]</span></div>
                  {e.start_time && <div className="text-sm text-gray-600">{new Date(e.start_time).toLocaleString()}</div>}
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
          {(events || [])
            .filter(e => e.latitude != null && e.longitude != null)
            .map(e => (
              <Marker key={e.id} position={[e.latitude, e.longitude]}>
                <Popup>
                  <div className="space-y-1">
                    <div className="font-semibold">{e.title || '(no title)'}</div>
                    {e.start_time && <div className="text-sm">{new Date(e.start_time).toLocaleString()}</div>}
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