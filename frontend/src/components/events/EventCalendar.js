import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const EventCalendar = ({ events = [] }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  
  // Get calendar data for current month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => {
      if (!event.start?.local) return false;
      const eventDate = new Date(event.start.local);
      return eventDate.toDateString() === dayDate.toDateString();
    });
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goToPreviousMonth}
            className="p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-400" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goToNextMonth}
            className="p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          </motion.button>
        </div>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isToday = day && 
            new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
          
          return (
            <motion.div
              key={index}
              whileHover={day ? { scale: 1.02 } : {}}
              className={`min-h-[100px] p-2 rounded-lg transition-all duration-200 ${
                day 
                  ? `bg-gray-700/30 hover:bg-gray-700/50 cursor-pointer ${
                      isToday ? 'ring-2 ring-emerald-500 bg-purple-500/10' : ''
                    }`
                  : 'bg-transparent'
              }`}
            >
              {day && (
                <>
                  <div className={`text-sm font-semibold mb-1 ${
                    isToday ? 'text-emerald-400' : 'text-white'
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        className="text-xs bg-purple-600 text-white px-2 py-1 rounded truncate"
                        title={event.name?.text || event.title}
                      >
                        {event.name?.text || event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-400">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default EventCalendar;