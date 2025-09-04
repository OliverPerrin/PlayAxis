import React, { useEffect, useState } from 'react';
import { getWeather } from '../api';

function Weather() {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async (lat, lon) => {
      try {
        setLoading(true);
        setError(null);
        const data = await getWeather(lat, lon);
        if (data && data.current_weather) {
          const currentWeather = data.current_weather;
          setWeather({
            temperature: currentWeather.temperature,
            windspeed: currentWeather.windspeed,
            weathercode: currentWeather.weathercode,
            time: currentWeather.time
          });
        } else {
          setError('Weather data format not recognized');
        }
      } catch (error) {
        console.error('Weather fetch error:', error);
        setError('Unable to fetch weather data');
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => fetchWeather(position.coords.latitude, position.coords.longitude),
        geErr => {
          console.error('Geolocation error:', geErr);
          setError('Location access denied. Weather unavailable.');
          setLoading(false);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    } else {
      setError('Geolocation not supported by browser');
      setLoading(false);
    }
  }, []);

  const getWeatherDescription = (code) => {
    const weatherCodes = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      95: 'Thunderstorm'
    };
    return weatherCodes[code] || 'Unknown weather';
  };

  return (
    <div className="bg-white/10 border border-white/20 rounded-lg p-4 mt-4">
      <h2 className="text-lg font-bold text-white mb-4">Current Weather</h2>
      
      {loading && (
        <div className="text-center py-4">
          <p className="text-gray-300">Loading weather...</p>
        </div>
      )}
      
      {error && !loading && (
        <div className="text-center py-4">
          <p className="text-red-300">{error}</p>
        </div>
      )}
      
      {weather && !loading && (
        <div className="space-y-2 text-white">
          <p className="text-lg font-semibold">{weather.temperature}°C</p>
          <p className="text-gray-300">{getWeatherDescription(weather.weathercode)}</p>
          <p className="text-sm text-gray-300">Wind: {weather.windspeed} km/h</p>
          <p className="text-xs text-gray-400">
            Last updated: {new Date(weather.time).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}

export default Weather;