// Determine API base URL safely
const getAPIUrl = () => {
  // Prefer explicit environment var
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, '') + '/api/v1';
  }

  // Dev: use CRA proxy (set "proxy" in frontend/package.json e.g. http://localhost:8000)
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return '/api/v1';
  }

  // Netlify deploy — ensure HTTPS to avoid mixed content and redirect issues
  if (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')) {
    return 'https://raw-minne-multisportsandevents-7f82c207.koyeb.app/api/v1';
  }

  // Default production (Koyeb app)
  const koyebAppName = 'raw-minne-multisportsandevents-7f82c207';
  return `https://${koyebAppName}.koyeb.app/api/v1`;
};

const API_URL = getAPIUrl();

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let message = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const data = await response.json();
      message = data.detail || data.message || message;
    } catch (_) {}
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
};

const fetchWithTimeout = async (url, options = {}, timeout = 15000) => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal, redirect: 'follow' });
    clearTimeout(t);
    return res;
  } catch (err) {
    clearTimeout(t);
    if (err.name === 'AbortError') throw new Error('Request timeout');
    throw err;
  }
};

// Events
export const getEvents = async (query = 'sports', lat = null, lon = null) => {
  try {
    let url = `${API_URL}/events?q=${encodeURIComponent(query)}`;
    if (lat && lon) url += `&lat=${lat}&lon=${lon}`;
    const res = await fetchWithTimeout(url, { method: 'GET', headers: getAuthHeaders() });
    return await handleResponse(res);
  } catch (error) {
    console.error('getEvents error:', error);
    return { events: [] };
  }
};

export const getEventById = async (id) => {
  // If your backend exposes /events/:id, use that; otherwise return null and let UI fall back to navigation state.
  try {
    const res = await fetchWithTimeout(`${API_URL}/events/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await handleResponse(res);
  } catch (error) {
    console.warn('getEventById fallback:', error.message);
    return null;
  }
};

// Streams (Twitch or similar)
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

// Weather (Open-Meteo)
const getWeatherApiBase = () => {
  const env = process.env.WEATHER_API_URL || 'https://api.open-meteo.com/v1';
  return env.replace(/\/$/, '');
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

// Leaderboards
export const getLeaderboards = async (category = 'overall', timeframe = 'monthly') => {
  try {
    const url = `${API_URL}/leaderboards?category=${encodeURIComponent(category)}&timeframe=${encodeURIComponent(timeframe)}`;
    const res = await fetchWithTimeout(url, { method: 'GET', headers: getAuthHeaders() });
    return await handleResponse(res);
  } catch (error) {
    // Graceful fallback handled by page
    console.warn('getLeaderboards error:', error.message);
    return null;
  }
};

// Optional: Auth helpers (use if your AuthContext delegates to api.js)
export const login = async (username, password) => {
  const res = await fetchWithTimeout(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
};

export const register = async (username, email, password) => {
  const res = await fetchWithTimeout(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  return handleResponse(res);
};

export const getMe = async () => {
  const res = await fetchWithTimeout(`${API_URL}/auth/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};