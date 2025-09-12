// Determine API base URL safely and avoid CORS on Netlify by using the proxy redirect.
const getAPIUrl = () => {
  // If you set this in local dev or intentionally in Netlify, it will be used.
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, '') + '/api/v1';
  }

  // Local dev: use CRA proxy (add "proxy": "http://localhost:8000" in package.json)
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return '/api/v1';
  }

  // Netlify: prefer the redirect so requests are same-origin (/api/*)
  if (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')) {
    return '/api/v1';
  }

  // Default production (direct Koyeb)
  const koyebAppName = 'raw-minne-multisportsandevents-7f82c207';
  return `https://${koyebAppName}.koyeb.app/api/v1`;
};

const API_URL = getAPIUrl();

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const handleResponse = async (response) => {
  // Network layer already succeeded; now inspect status
  if (!response.ok) {
    let message = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const data = await response.json();
      message = data.detail || data.message || message;
    } catch (_) {}
    // Translate common auth errors
    if (response.status === 401) message = 'Invalid username or password.';
    if (response.status === 404) message = 'Endpoint not found.';
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
};

const fetchWithTimeout = async (url, options = {}, timeout = 20000) => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal, redirect: 'follow', mode: 'cors' });
    clearTimeout(t);
    return res;
  } catch (err) {
    clearTimeout(t);
    if (err.name === 'AbortError') throw new Error('Request timed out. Please try again.');
    // Normalize network errors to helpful message
    throw new Error(`Can’t reach the server. Please check your connection and try again.`);
  }
};

// --- Event helpers ---
const normalizeEventItem = (e, idx=0) => {
  if (!e) return null;
  // Support backend normalized Event schema and raw Eventbrite payloads
  const title = e.name || e.title || e?.name?.text || 'Untitled Event';
  const start = e.start || e?.start_time || e?.start?.local || e?.date || null;
  const end = e.end || e?.end_time || e?.end?.local || null;
  const venueName = e.venue || e?.venue?.name || e?.location || 'Location TBA';
  return {
    id: String(e.id ?? e.event_id ?? `${idx}-${title}`),
  source: e.source || 'google',
    title,
    description: e.description?.text || e.description || '',
    url: e.url || null,
    start,
    end,
    venue: venueName,
    city: e.city || e?.venue?.address?.city || null,
    country: e.country || e?.venue?.address?.country || null,
    latitude: e.latitude ?? e?.venue?.latitude ?? null,
    longitude: e.longitude ?? e?.venue?.longitude ?? null,
    image: e.image || e?.logo?.url || null,
  };
};

// Events
export const getEvents = async (query = '', lat = null, lon = null, extra = {}) => {
  const q = encodeURIComponent(query || '');
  // If geolocation provided, use aggregate endpoint which already normalizes
  const baseUrl = (lat != null && lon != null)
    ? `${API_URL}/aggregate/events?q=${q}&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
    : `${API_URL}/events/?q=${q}`;
  try {
    const res = await fetchWithTimeout(baseUrl, {
      method: 'GET',
      headers: getAuthHeaders(),
      ...extra
    });
    const data = await handleResponse(res);
    // Normalize into consistent shape for UI
    let list = [];
    if (Array.isArray(data?.events)) list = data.events;
    else if (Array.isArray(data?.data)) list = data.data;

    // Fallback: if no events from /events, try /aggregate/events for broader sources
    if (!list.length && (lat == null || lon == null)) {
      const res2 = await fetchWithTimeout(`${API_URL}/aggregate/events?q=${q}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data2 = await handleResponse(res2);
      if (Array.isArray(data2?.events)) list = data2.events;
    }
    return { events: list.map((e, i) => normalizeEventItem(e, i)) };
  } catch (e) {
    console.error('getEvents error:', e);
    return { events: [] };
  }
};

export const getEventsInViewport = async (query = '', bbox = null) => {
  // bbox: {min_lat, max_lat, min_lon, max_lon}
  const q = encodeURIComponent(query || '');
  let url = `${API_URL}/events/viewport?q=${q}`;
  if (bbox && Object.values(bbox).every(v => typeof v === 'number')) {
    url += `&min_lat=${bbox.min_lat}&max_lat=${bbox.max_lat}&min_lon=${bbox.min_lon}&max_lon=${bbox.max_lon}`;
  }
  try {
    const res = await fetchWithTimeout(url, { method: 'GET', headers: getAuthHeaders() });
    const data = await handleResponse(res);
    const eventsArr = Array.isArray(data?.events) ? data.events : [];
    return {
      viewport: data.viewport || {},
      total: data.total || eventsArr.length,
      events: eventsArr.map((e,i) => normalizeEventItem(e,i)),
    };
  } catch (err) {
    console.error('getEventsInViewport error', err);
    return { viewport: {}, events: [], total: 0 };
  }
};

export const getEventById = async (id) => {
  try {
    // Backend likely expects /events/{id}
    const res = await fetchWithTimeout(`${API_URL}/events/${encodeURIComponent(id)}`);
    const data = await handleResponse(res);
    return normalizeEventItem(data, 0);
  } catch (error) {
    console.warn('getEventById fallback:', error.message);
    return null;
  }
};

// Auth: try the canonical path, then fall back to a couple of common alternatives
export const login = async (username, password) => {
  const payloads = [
    { username, password },
    { email: username, password }, // in case backend expects email field
  ];
  const paths = [`${API_URL}/auth/login`, `${API_URL}/login`, `${API_URL}/auth/token`];

  for (const body of payloads) {
    for (const path of paths) {
      try {
        const res = await fetchWithTimeout(path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await handleResponse(res);
        if (data?.access_token || data?.token) return data;
      } catch (e) {
        // try next
      }
    }
  }
  throw new Error('Invalid username or password.');
};

export const register = async (username, email, password) => {
  const primary = `${API_URL}/auth/register`;
  const fallbacks = [`${API_URL}/register`, `${API_URL}/users`];
  let lastErr = null;
  // Try primary first
  try {
    const res = await fetchWithTimeout(primary, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await handleResponse(res);
    if (data) return data;
  } catch (e) {
    lastErr = e;
  }
  // Optional fallbacks
  for (const path of fallbacks) {
    try {
      const res = await fetchWithTimeout(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await handleResponse(res);
      if (data) return data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Unable to create account right now.');
};

export const getMe = async () => {
  const res = await fetchWithTimeout(`${API_URL}/auth/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// Streams, Weather, Leaderboards
export const getStreams = async (gameId) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/streams?game_id=${encodeURIComponent(gameId)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error('getStreams error:', error);
    return { data: [] };
  }
};

const getWeatherApiBase = () => {
  const publicOverride = process.env.REACT_APP_WEATHER_API_URL;
  return (publicOverride && publicOverride.replace(/\/$/, '')) || 'https://api.open-meteo.com/v1';
};

export const getWeather = async (lat, lon) => {
  try {
    const base = getWeatherApiBase();
    const url = `${base}/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current_weather=true`;
    const res = await fetchWithTimeout(url, { method: 'GET' });
    return await handleResponse(res);
  } catch (error) {
    console.error('getWeather error:', error);
    throw error;
  }
};

export const getBackendWeather = async (lat, lon, hourly=false, hours=0) => {
  const url = `${API_URL}/weather?lat=${lat}&lon=${lon}&hourly=${hourly}&hours=${hours}`;
  const res = await fetchWithTimeout(url, { method: 'GET', headers: getAuthHeaders() });
  return handleResponse(res);
};

export const getLeaderboards = async (category = 'overall', timeframe = 'monthly') => {
  try {
    const url = `${API_URL}/leaderboards?category=${encodeURIComponent(category)}&timeframe=${encodeURIComponent(timeframe)}`;
    const res = await fetchWithTimeout(url, { method: 'GET', headers: getAuthHeaders() });
    return await handleResponse(res);
  } catch (error) {
    console.warn('getLeaderboards error:', error.message);
    return null;
  }
};

// Sports events via Sportsbook proxy
export const getSportsEvents = async (sport = 'nfl') => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/sports/${encodeURIComponent(sport)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(res);
    // Ensure array
    return Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
  } catch (error) {
    console.error('getSportsEvents error:', error);
    return [];
  }
};