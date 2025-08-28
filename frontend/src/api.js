// Dynamically determine API URL based on environment
const getAPIUrl = () => {
  // Check if we're in development (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '/api/v1'; // Use proxy in development
  }
  
  // In production, construct the API URL
  const koyebAppName = 'raw-minne-multisportsandevents-7f82c207';
  return `https://${koyebAppName}.koyeb.app/api/v1`;
};

const API_URL = getAPIUrl();

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (token) {
    return { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  return {
    'Content-Type': 'application/json'
  };
};

// Enhanced error handling function
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (e) {
      // If parsing JSON fails, stick with the HTTP status message
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

// Add timeout utility
const fetchWithTimeout = async (url, options = {}, timeout = 15000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

export const getEvents = async (query = 'sports', lat = null, lon = null) => {
  try {
    let url = `${API_URL}/events?q=${encodeURIComponent(query)}`;
    if (lat && lon) {
      url += `&lat=${lat}&lon=${lon}`;
    }
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('getEvents error:', error);
    // Return empty events structure instead of throwing
    return { events: [] };
  }
};

export const getStreams = async (gameId) => {
  try {
    const response = await fetchWithTimeout(`${API_URL}/streams?game_id=${encodeURIComponent(gameId)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('getStreams error:', error);
    return { data: [] };
  }
};

export const getSportsEvents = async (sport) => {
  try {
    const response = await fetchWithTimeout(`${API_URL}/sports/${encodeURIComponent(sport)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('getSportsEvents error:', error);
    return [];
  }
};

export const getWeather = async (lat, lon) => {
  try {
    if (!lat || !lon) {
      throw new Error('Latitude and longitude are required');
    }
    
    const response = await fetchWithTimeout(`${API_URL}/weather?lat=${lat}&lon=${lon}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('getWeather error:', error);
    throw error; // Re-throw for weather component to handle
  }
};

export const getRecommendations = async () => {
  try {
    const response = await fetchWithTimeout(`${API_URL}/recommendations`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('getRecommendations error:', error);
    return [];
  }
};

// Auth functions
export const login = async (email, password) => {
  const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      username: email,
      password: password,
    }),
  });
  
  return await handleResponse(response);
};

export const signup = async (email, password, fullName) => {
  const response = await fetchWithTimeout(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      full_name: fullName,
    }),
  });
  
  return await handleResponse(response);
};

export const getCurrentUser = async () => {
  const response = await fetchWithTimeout(`${API_URL}/users/me`, {
    headers: getAuthHeaders(),
  });
  
  return await handleResponse(response);
};

export const updateUserInterests = async (interests) => {
  const response = await fetchWithTimeout(`${API_URL}/users/me/interests`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(interests.map(name => ({ name }))),
  });
  
  return await handleResponse(response);
};

export const updateUser = async (userData) => {
  const response = await fetchWithTimeout(`${API_URL}/users/me`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });
  
  return await handleResponse(response);
};