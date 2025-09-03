import React, { useState, useEffect } from 'react';
import { getEvents } from '../api';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Events', emoji: '🌟' },
    { id: 'sports', name: 'Sports', emoji: '⚽' },
    { id: 'esports', name: 'Esports', emoji: '🎮' },
    { id: 'racing', name: 'Racing', emoji: '🏎️' },
    { id: 'outdoor', name: 'Outdoor', emoji: '🏔️' },
    { id: 'fitness', name: 'Fitness', emoji: '💪' },
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const data = await getEvents('sports events activities');
        if (data && data.events && Array.isArray(data.events)) {
          const formattedEvents = data.events.map(event => ({
            id: event.id,
            title: event.name?.text || event.title || 'Untitled Event',
            startTime: event.start?.local || event.start_time,
            endTime: event.end?.local || event.end_time,
            url: event.url,
            description: event.description?.text || 'No description available',
            location: event.venue?.name || 'Location TBD',
            category: 'sports', // Default category
          })).filter(event => event.startTime);
          
          setEvents(formattedEvents);
          setFilteredEvents(formattedEvents);
        } else {
          setEvents([]);
          setFilteredEvents([]);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    let filtered = events;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => 
        event.category === selectedCategory || 
        event.title.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  }, [events, selectedCategory, searchTerm]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Discover Amazing Events 🎉
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find sports events, competitions, and activities that match your interests. 
            From local tournaments to international championships.
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">🔍</span>
                <input
                  type="text"
                  placeholder="Search events, locations, or activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-200 flex items-center space-x-1 ${
                    selectedCategory === category.id
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{category.emoji}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin text-6xl mb-4">⚽</div>
              <p className="text-xl text-gray-600">Loading amazing events...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <span className="text-6xl mb-4 block">⚠️</span>
              <h3 className="text-xl font-semibold text-red-800 mb-2">Oops! Something went wrong</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
              <span className="text-6xl mb-4 block">🔍</span>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No events found</h3>
              <p className="text-gray-600">Try adjusting your search or filters to find more events.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event, index) => (
                <div key={event.id || index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  {/* Event Header */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
                    <h3 className="font-bold text-lg line-clamp-2 group-hover:text-gray-100 transition-colors">
                      {event.title}
                    </h3>
                  </div>
                  
                  {/* Event Content */}
                  <div className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <span className="mr-2">📅</span>
                        <span className="text-sm">{formatDate(event.startTime)}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <span className="mr-2">📍</span>
                        <span className="text-sm">{event.location}</span>
                      </div>
                      
                      <p className="text-gray-700 text-sm line-clamp-3 mt-3">
                        {event.description}
                      </p>
                    </div>
                    
                    {/* Event Actions */}
                    <div className="mt-6 flex space-x-3">
                      {event.url && (
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center space-x-1"
                        >
                          <span>🎫</span>
                          <span>Get Tickets</span>
                        </a>
                      )}
                      <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center space-x-1">
                        <span>❤️</span>
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load More Button (if we had pagination) */}
        {!loading && !error && filteredEvents.length > 0 && (
          <div className="text-center mt-12">
            <button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
              Load More Events 🔄
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;