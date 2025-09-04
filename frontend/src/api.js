// Determine API base URL safely
const getAPIUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, '') + '/api/v1';
  }
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return '/api/v1';
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')) {
    return 'https://raw-minne-multisportsandevents-7f82c207.koyeb.app/api/v1';
  }
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

// Streams
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

// Weather (Open-Meteo, public)
const getWeatherApiBase = () => {
  // Allow an intentional public override via REACT_APP_*, otherwise default
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

// Leaderboards
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

// Optional: Auth helpers
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