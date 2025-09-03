import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  SunIcon,
  CloudIcon,
  CloudRainIcon,
  SnowflakeIcon,
  BoltIcon,
  EyeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { getWeather } from '../../api';

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState('Getting location...');

  useEffect(() => {
    const fetchWeatherData = async (lat, lon) => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getWeather(lat, lon);
        
        if (data && data.current_weather) {
          setWeather(data.current_weather);
          
          // Get location name using reverse geocoding (simplified)
          setLocation(`${lat.toFixed(1)}, ${lon.toFixed(1)}`);
        } else {
          setError('Weather data not available');
        }
      } catch (error) {
        console.error('Weather fetch error:', error);
        setError('Unable to fetch weather');
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          fetchWeatherData(position.coords.latitude, position.coords.longitude);
        },
        error => {
          console.error('Geolocation error:', error);
          setError('Location access denied');
          setLoading(false);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    } else {
      setError('Geolocation not supported');
      setLoading(false);
    }
  }, []);

  const getWeatherIcon = (code) => {
    if (code === 0 || code === 1) return SunIcon;
    if (code === 2 || code === 3) return CloudIcon;
    if (code >= 61 && code <= 67) return CloudRainIcon;
    if (code >= 71 && code <= 77) return SnowflakeIcon;
    if (code >= 95) return BoltIcon;
    return CloudIcon;
  };

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
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      95: 'Thunderstorm'
    };
    return weatherCodes[code] || 'Unknown';
  };

  const getActivitySuggestion = (temp, code) => {
    if (temp > 25 && (code === 0 || code === 1)) {
      return { activity: '🏃‍♂️ Perfect for running!', color: 'text-green-400' };
    } else if (temp > 15 && temp <= 25) {
      return { activity: '🚴‍♀️ Great cycling weather!', color: 'text-blue-400' };
    } else if (temp > 5 && temp <= 15) {
      return { activity: '🥾 Good for hiking!', color: 'text-yellow-400' };
    } else if (code >= 61 && code <= 67) {
      return { activity: '🏋️‍♀️ Indoor workout day!', color: 'text-purple-400' };
    } else {
      return { activity: '🧘‍♀️ Yoga at home!', color: 'text-pink-400' };
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/2 mb-4" />
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-8 bg-gray-700 rounded" />
              <div className="h-4 bg-gray-700 rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
        <h3 className="text-lg font-bold text-white mb-4">Weather</h3>
        <div className="text-center py-4">
          <EyeIcon className="w-12 h-12 mx-auto text-gray-500 mb-2" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const IconComponent = getWeatherIcon(weather.weathercode);
  const suggestion = getActivitySuggestion(weather.temperature, weather.weathercode);

  return (
    <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Weather</h3>
        <div className="flex items-center space-x-1 text-gray-400 text-xs">
          <MapPinIcon className="w-3 h-3" />
          <span>{location}</span>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="relative"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            <IconComponent className="w-8 h-8 text-white" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800"
          />
        </motion.div>

        <div className="flex-1">
          <div className="flex items-baseline space-x-2">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-white"
            >
              {Math.round(weather.temperature)}°C
            </motion.span>
            <span className="text-gray-400 text-sm">
              {getWeatherDescription(weather.weathercode)}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
            <span>💨 {weather.windspeed} km/h</span>
          </div>
        </div>
      </div>

      {/* Activity Suggestion */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-gray-700/30 to-gray-600/30 rounded-xl p-4 border border-gray-600/20"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1">Activity Suggestion</p>
            <p className={`text-sm font-semibold ${suggestion.color}`}>
              {suggestion.activity}
            </p>
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center opacity-50"
          >
            <SunIcon className="w-4 h-4 text-white" />
          </motion.div>
        </div>
      </motion.div>

      {/* Last Updated */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Updated: {new Date(weather.time).toLocaleTimeString()}
      </div>
    </div>
  );
}

export default WeatherWidget;