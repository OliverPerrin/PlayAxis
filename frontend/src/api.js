
const API_URL = '/api/v1';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

export const getEvents = async (query, lat, lon) => {
  let url = `${API_URL}/events?q=${query}`;
  if (lat && lon) {
    url += `&lat=${lat}&lon=${lon}`;
  }
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }
  return response.json();
};

export const getStreams = async (gameId) => {
  const response = await fetch(`${API_URL}/streams?game_id=${gameId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch streams');
  }
  return response.json();
};

export const getSportsEvents = async (sport) => {
  const response = await fetch(`${API_URL}/sports/${sport}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch sports events');
  }
  return response.json();
};

export const getWeather = async (lat, lon) => {
  const response = await fetch(`${API_URL}/weather?lat=${lat}&lon=${lon}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch weather');
  }
  return response.json();
};

export const getRecommendations = async () => {
  const response = await fetch(`${API_URL}/recommendations`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch recommendations');
  }
  return response.json();
};
