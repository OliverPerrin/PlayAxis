import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarIcon, 
  ChartBarIcon, 
  TrophyIcon, 
  FireIcon,
  MapPinIcon,
  ArrowRightIcon,
  PlusIcon,
  BoltIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [streak] = useState(0);
  const [todayStats] = useState({
    workouts: 0,
    calories: 0,
    distance: 0.0,
    time: 0
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const quickActions = [
    { title: "Log Workout", icon: PlusIcon, color: "from-emerald-500 to-teal-500", action: () => navigate('/stats') },
    { title: "Find Events", icon: CalendarIcon, color: "from-blue-500 to-cyan-500", action: () => navigate('/discover') },
    { title: "View Stats", icon: ChartBarIcon, color: "from-cyan-500 to-emerald-500", action: () => navigate('/stats') },
    { title: "Leaderboards", icon: TrophyIcon, color: "from-indigo-500 to-blue-500", action: () => navigate('/leaderboards') }
  ];

  const upcomingEvents = [
    { title: "City Marathon", date: "Dec 15", location: "Central Park", participants: 2500, image: "🏃‍♀️" },
    { title: "Tennis Open", date: "Dec 18", location: "Sports Complex", participants: 64, image: "🎾" },
    { title: "Swimming Meet", date: "Dec 20", location: "Aquatic Center", participants: 128, image: "🏊‍♂️" }
  ];

  return (
    <div className="min-h-screen bg-transparent p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Header – updated tone for new users */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Hi {user?.username || 'there'} — let’s get you moving
              </h1>
              <p className="text-gray-300 text-lg">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {' • '}
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            
            <div className="flex items-center space-x-6 mt-4 lg:mt-0">
              <div className="text-center">
                <div className="flex items-center space-x-2 mb-1">
                  <FireIcon className="w-6 h-6 text-amber-400" />
                  <span className="text-2xl font-bold text-white">{streak}</span>
                </div>
                <p className="text-gray-300 text-sm">Day Streak</p>
              </div>
              
              <button onClick={() => navigate('/stats')} className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
                Start a workout
              </button>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.button key={action.title} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + index * 0.1 }} whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }} onClick={action.action} className="group bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
              <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg">{action.title}</h3>
            </motion.button>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Stats – now neutral if new user */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Today’s Overview</h2>
              <div className="flex items-center space-x-2 text-emerald-300">
                <BoltIcon className="w-5 h-5" />
                <span className="font-semibold">Small steps count</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-2">
              <div className="text-center"><div className="text-3xl font-bold text-white mb-1">{todayStats.workouts}</div><p className="text-gray-300">Workouts</p></div>
              <div className="text-center"><div className="text-3xl font-bold text-white mb-1">{todayStats.calories}</div><p className="text-gray-300">Calories</p></div>
              <div className="text-center"><div className="text-3xl font-bold text-white mb-1">{todayStats.distance}</div><p className="text-gray-300">KM Distance</p></div>
              <div className="text-center"><div className="text-3xl font-bold text-white mb-1">{todayStats.time}</div><p className="text-gray-300">Minutes</p></div>
            </div>

            <p className="text-gray-400 text-sm">You’re new here — great time to set your first goal in Settings or browse events to get started.</p>
          </motion.div>

          {/* Upcoming Events */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-6">Upcoming Events</h2>
            <div className="space-y-4">
              {upcomingEvents.map((event, index) => (
                <motion.div key={event.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + index * 0.1 }} className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="text-2xl">{event.image}</div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{event.title}</h3>
                    <p className="text-gray-300 text-sm">{event.location}</p>
                    <p className="text-gray-400 text-xs">{event.date} • {event.participants} joining</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <button onClick={() => navigate('/events')} className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2">
              <span>Explore all events</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        {/* Friendly tip */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-3xl p-8 border border-white/20 backdrop-blur-lg">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center">
              <StarIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Welcome aboard</h2>
              <p className="text-gray-300">No records yet — that’s perfect. Your journey starts now.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;