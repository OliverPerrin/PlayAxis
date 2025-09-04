import React from 'react';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  StarIcon,
  TicketIcon
} from '@heroicons/react/24/outline';

const EventCard = ({ event, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 group cursor-pointer"
    >
      {/* Event Image/Header */}
      <div className="relative mb-4">
        <div className="h-48 bg-gradient-to-br from-emerald-500 via-pink-500 to-blue-500 rounded-xl flex items-center justify-center relative overflow-hidden">
          <CalendarIcon className="w-16 h-16 text-white/80" />
          
          {/* Overlay Info */}
          <div className="absolute top-4 left-4">
            <span className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
              {event.category || 'Sports'}
            </span>
          </div>
          
          <div className="absolute top-4 right-4">
            <div className="flex items-center space-x-1 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
              <StarIcon className="w-3 h-3 text-yellow-400" />
              <span>4.5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
          {event.name?.text || event.title || 'Event Title'}
        </h3>

        <div className="flex items-center space-x-4 text-sm text-gray-400">
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

        {event.description && (
          <p className="text-gray-400 text-sm line-clamp-2">
            {event.description.text || 'No description available'}
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">120 attending</span>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-emerald-700 hover:to-cyan-700 transition-all duration-300"
          >
            <TicketIcon className="w-4 h-4" />
            <span>Get Tickets</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;