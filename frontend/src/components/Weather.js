
import React, { useEffect, useState } from 'react';
import { getWeather } from '../api';

function Weather() {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = (lat, lon) => {
      getWeather(lat, lon)
        .then(data => {
          setWeather(data);
        })
        .catch(error => {
          setError(error.message);
        });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        error => {
          setError('Error getting location: ' + error.message);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  }, []);

  return (
    <div className="bg-white shadow rounded-lg p-4 mt-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Current Weather</h2>
      {error && <p className="text-red-500">{error}</p>}
      {weather && (
        <div>
          <p className="font-semibold">{weather.name}</p>
          <p>{weather.weather[0].main} - {weather.weather[0].description}</p>
          <p>Temperature: {weather.main.temp}°K</p>
          <p>Humidity: {weather.main.humidity}%</p>
        </div>
      )}
    </div>
  );
}

export default Weather;
