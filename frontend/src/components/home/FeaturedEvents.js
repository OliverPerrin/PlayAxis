import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon,
  UserGroupIcon,
  StarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { getEvents } from '../../api';

const FeaturedEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        const data = await getEvents('featured sports');
        setEvents(data.events?.slice(0, 3) || []);
      } catch (error) {
        console.error('Error fetching featured events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedEvents();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3" />
          {[1, 2, 3].map(i => (
            <div key={i} className="flex space-x-4">
              <div className="h-16 w-16 bg-gray-700 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Featured Events</h3>
        <motion.button
          whileHover={{ x: 5 }}
          className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 transition-colors"
        >
          <span>View All</span>
          <ArrowRightIcon className="w-4 h-4" />
        </motion.button>
      </div>

      <div className="space-y-4">
        {events.length > 0 ? events.map((event, index) => (
          <motion.div
            key={event.id || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="flex items-center space-x-4 p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all duration-300 cursor-pointer group"
          >
            {/* Event Image/Icon */}
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {index + 1}
                </span>
              </div>
            </div>

            {/* Event Details */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                {event.name?.text || event.title || 'Event Title'}
              </h4>
              
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <ClockIcon className="w-4 h-4" />
                  <span>
                    {event.start?.local ? 
                      new Date(event.start.local).toLocaleDateString() : 
                      'Date TBA'
                    }
                  </span>
                </div>
                
                {event.venue && (
                  <div className="flex items-center space-x-1">
                    <MapPinIcon className="w-4 h-4" />
                    <span className="truncate">
                      {event.venue.name || 'Online'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 mt-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-4 h-4 ${i < 4 ? 'text-yellow-400' : 'text-gray-600'}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400">4.0 · 120 attending</span>
              </div>
            </div>

            {/* Action Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
            >
              <ArrowRightIcon className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )) : (
          <div className="text-center py-8 text-gray-400">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No featured events available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedEvents;