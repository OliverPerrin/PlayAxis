import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPinIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const EventMap = ({ events = [] }) => {
  const mapRef = useRef(null);
  const [selectedEvent, setSelectedEvent] = React.useState(null);

  // For this demo, we'll create a simple coordinate-based map
  // In a real implementation, you'd use MapBox, Google Maps, or similar
  const mockLocations = [
    { id: 1, name: 'Madison Square Garden', lat: 40.7505, lng: -73.9934, events: [] },
    { id: 2, name: 'Staples Center', lat: 34.043, lng: -118.2673, events: [] },
    { id: 3, name: 'Wembley Stadium', lat: 51.556, lng: -0.2817, events: [] },
    { id: 4, name: 'Tokyo Dome', lat: 35.7056, lng: 139.7519, events: [] },
  ];

  useEffect(() => {
    // Group events by location
    const eventsWithLocations = events.filter(event => event.venue?.name);
    
    // In a real implementation, you'd geocode addresses or use venue coordinates
    eventsWithLocations.forEach((event, index) => {
      const locationIndex = index % mockLocations.length;
      mockLocations[locationIndex].events.push(event);
    });
  }, [events]);

  const getMarkerPosition = (lat, lng) => {
    // Convert lat/lng to percentage position (simplified projection)
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 rounded-xl overflow-hidden">
      {/* Map Background */}
      <div 
        ref={mapRef}
        className="relative w-full h-full bg-gradient-to-br from-blue-800 to-purple-800 opacity-80"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {/* World Map Outline (Simplified) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <GlobeAltIcon className="w-96 h-96 text-white" />
        </div>

        {/* Event Markers */}
        {mockLocations.map((location) => {
          const position = getMarkerPosition(location.lat, location.lng);
          
          if (location.events.length === 0) return null;
          
          return (
            <motion.div
              key={location.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.2 }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`
              }}
              onClick={() => setSelectedEvent(location)}
            >
              <div className="relative">
                <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <MapPinIcon className="w-3 h-3 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border border-white text-xs font-bold text-black flex items-center justify-center">
                  {location.events.length}
                </div>
                
                {/* Pulse animation */}
                <div className="absolute inset-0 w-6 h-6 bg-red-500 rounded-full animate-ping opacity-25"></div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Event Details Panel */}
      {selectedEvent && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="absolute bottom-4 left-4 right-4 bg-gray-800/90 backdrop-blur-lg border border-gray-700/50 rounded-xl p-4 max-h-48 overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-white">{selectedEvent.name}</h4>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            {selectedEvent.events.map((event, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-white font-medium text-sm">
                    {event.name?.text || event.title}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {event.start?.local ? 
                      new Date(event.start.local).toLocaleDateString() : 
                      'Date TBA'
                    }
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                >
                  View
                </motion.button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg flex items-center justify-center text-white hover:bg-gray-700/80 transition-colors"
        >
          +
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg flex items-center justify-center text-white hover:bg-gray-700/80 transition-colors"
        >
          -
        </motion.button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3">
        <h5 className="text-white font-semibold mb-2 text-sm">Event Locations</h5>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span className="text-gray-300 text-xs">Events available</span>
        </div>
      </div>
    </div>
  );
};

export default EventMap;