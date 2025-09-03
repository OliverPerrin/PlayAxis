import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarIcon, 
  MapPinIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon,
  ViewColumnsIcon,
  ListBulletIcon,
  ClockIcon,
  UserGroupIcon,
  StarIcon,
  TicketIcon
} from '@heroicons/react/24/outline';
import { getEvents } from '../api';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Events', count: 0 },
    { id: 'sports', name: 'Sports', count: 0 },
    { id: 'esports', name: 'Esports', count: 0 },
    { id: 'fitness', name: 'Fitness', count: 0 },
    { id: 'outdoor', name: 'Outdoor', count: 0 }
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const query = selectedCategory === 'all' ? 'sports events' : selectedCategory;
        const data = await getEvents(query);
        setEvents(data.events || []);
        setFilteredEvents(data.events || []);
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
        setFilteredEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [selectedCategory]);

  useEffect(() => {
    const filtered = events.filter(event => {
      const searchMatch = searchTerm === '' || 
        (event.name?.text || event.title || '').toLowerCase().includes(searchTerm.toLowerCase());
      return searchMatch;
    });
    setFilteredEvents(filtered);
  }, [searchTerm, events]);

  const viewModes = [
    { id: 'cards', label: 'Cards', icon: ViewColumnsIcon },
    { id: 'list', label: 'List', icon: ListBulletIcon }
  ];

  const EventCard = ({ event, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 group cursor-pointer"
    >
      {/* Event Image/Header */}
      <div className="relative mb-4">
        <div className="h-48 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-xl flex items-center justify-center relative overflow-hidden">
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
        <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2">
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
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
          >
            <TicketIcon className="w-4 h-4" />
            <span>Get Tickets</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          Discover Amazing Events
        </h1>
        <p className="text-gray-400 text-lg">Find your next adventure in sports, esports, and entertainment</p>
      </motion.div>

      {/* Search & Filters Bar */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-gray-700"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-700/50 p-1 rounded-xl">
            {viewModes.map((mode) => {
              const IconComponent = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    viewMode === mode.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-600/50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/50">
                <div className="h-48 bg-gray-700 rounded-xl mb-4" />
                <div className="space-y-3">
                  <div className="h-6 bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-700 rounded w-1/2" />
                  <div className="h-4 bg-gray-700 rounded w-full" />
                  <div className="h-4 bg-gray-700 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Event Content */}
      {!loading && (
        <AnimatePresence mode="wait">
          {viewMode === 'cards' && (
            <motion.div
              key="cards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredEvents.map((event, index) => (
                    <EventCard key={event.id || index} event={event} index={index} />
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <CalendarIcon className="w-24 h-24 mx-auto text-gray-600 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No events found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {viewMode === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event, index) => (
                  <motion.div
                    key={event.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-800/40 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CalendarIcon className="w-8 h-8 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white mb-2">
                          {event.name?.text || event.title || 'Event Title'}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="w-4 h-4" />
                            <span>
                              {event.start?.local ? 
                                new Date(event.start.local).toLocaleString() : 
                                'Date TBA'
                              }
                            </span>
                          </div>
                          {event.venue && (
                            <div className="flex items-center space-x-1">
                              <MapPinIcon className="w-4 h-4" />
                              <span>{event.venue.name || 'Online'}</span>
                            </div>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-gray-400 text-sm line-clamp-1">
                            {event.description.text || 'No description available'}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="flex items-center space-x-1 text-yellow-400 mb-1">
                            <StarIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">4.5</span>
                          </div>
                          <div className="flex items-center space-x-1 text-gray-400">
                            <UserGroupIcon className="w-4 h-4" />
                            <span className="text-xs">120</span>
                          </div>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                        >
                          View Details
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-16">
                  <CalendarIcon className="w-24 h-24 mx-auto text-gray-600 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No events found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default EventsPage;