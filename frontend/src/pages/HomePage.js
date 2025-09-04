import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarIcon, 
  ChartBarIcon, 
  TrophyIcon, 
  UserGroupIcon,
  FireIcon,
  ClockIcon,
  MapPinIcon,
  ArrowRightIcon,
  PlayIcon,
  PlusIcon,
  BoltIcon,
  SparklesIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [streak, setStreak] = useState(15);
  const [todayStats, setTodayStats] = useState({
    workouts: 2,
    calories: 450,
    distance: 5.2,
    time: 45
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const quickActions = [
    {
      title: "Log Workout",
      icon: PlusIcon,
      color: "from-green-500 to-emerald-500",
      action: () => navigate('/stats')
    },
    {
      title: "Find Events",
      icon: CalendarIcon,
      color: "from-blue-500 to-cyan-500",
      action: () => navigate('/discover')
    },
    {
      title: "View Stats",
      icon: ChartBarIcon,
      color: "from-purple-500 to-pink-500",
      action: () => navigate('/stats')
    },
    {
      title: "Leaderboards",
      icon: TrophyIcon,
      color: "from-yellow-500 to-orange-500",
      action: () => navigate('/leaderboards')
    }
  ];

  const recentActivities = [
    {
      type: "workout",
      title: "Morning Run",
      time: "2 hours ago",
      details: "5.2 km • 28 min",
      icon: "🏃‍♂️"
    },
    {
      type: "event",
      title: "Basketball Tournament",
      time: "Tomorrow",
      details: "Downtown Court • 2:00 PM",
      icon: "🏀"
    },
    {
      type: "achievement",
      title: "New Personal Best!",
      time: "Yesterday",
      details: "10K Run • 42:15",
      icon: "🏆"
    }
  ];

  const upcomingEvents = [
    {
      title: "City Marathon",
      date: "Dec 15",
      location: "Central Park",
      participants: 2500,
      image: "🏃‍♀️"
    },
    {
      title: "Tennis Open",
      date: "Dec 18",
      location: "Sports Complex",
      participants: 64,
      image: "🎾"
    },
    {
      title: "Swimming Meet",
      date: "Dec 20",
      location: "Aquatic Center",
      participants: 128,
      image: "🏊‍♂️"
    }
  ];

  const weeklyProgress = [
    { day: 'Mon', value: 80 },
    { day: 'Tue', value: 65 },
    { day: 'Wed', value: 90 },
    { day: 'Thu', value: 75 },
    { day: 'Fri', value: 95 },
    { day: 'Sat', value: 100 },
    { day: 'Sun', value: 45 }
  ];

  return (
    <div className="min-h-screen bg-transparent p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, {user?.username || 'Athlete'}! 🎯
              </h1>
              <p className="text-gray-300 text-lg">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} • {currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
            
            <div className="flex items-center space-x-6 mt-4 lg:mt-0">
              <div className="text-center">
                <div className="flex items-center space-x-2 mb-1">
                  <FireIcon className="w-6 h-6 text-orange-400" />
                  <span className="text-2xl font-bold text-white">{streak}</span>
                </div>
                <p className="text-gray-300 text-sm">Day Streak</p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/stats')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
              >
                Quick Log
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {quickActions.map((action, index) => (
            <motion.button
              key={action.title}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.action}
              className="group bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300"
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg">{action.title}</h3>
            </motion.button>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Today's Stats */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Today's Performance</h2>
              <div className="flex items-center space-x-2 text-green-400">
                <BoltIcon className="w-5 h-5" />
                <span className="font-semibold">On Fire!</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{todayStats.workouts}</div>
                <p className="text-gray-300">Workouts</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{todayStats.calories}</div>
                <p className="text-gray-300">Calories</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{todayStats.distance}</div>
                <p className="text-gray-300">KM Distance</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{todayStats.time}</div>
                <p className="text-gray-300">Minutes</p>
              </div>
            </div>

            {/* Weekly Progress Chart */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">This Week's Activity</h3>
              <div className="flex items-end space-x-3 h-32">
                {weeklyProgress.map((day, index) => (
                  <motion.div
                    key={day.day}
                    initial={{ height: 0 }}
                    animate={{ height: `${day.value}%` }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                    className="flex-1 bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-lg relative"
                    style={{ height: `${day.value}%` }}
                  >
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-gray-300 text-sm">
                      {day.day}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20"
          >
            <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
            
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="text-2xl">{activity.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{activity.title}</h3>
                    <p className="text-gray-300 text-sm">{activity.details}</p>
                    <p className="text-gray-400 text-xs">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate('/stats')}
              className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>View All Activity</span>
              <ArrowRightIcon className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>

        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Upcoming Events</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate('/events')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all duration-300 flex items-center space-x-2"
            >
              <span>View All</span>
              <ArrowRightIcon className="w-4 h-4" />
            </motion.button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {upcomingEvents.map((event, index) => (
              <motion.div
                key={event.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/5 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer border border-white/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">{event.image}</div>
                  <div className="text-right">
                    <div className="text-white font-bold">{event.date}</div>
                    <div className="text-gray-300 text-sm">{event.participants} joining</div>
                  </div>
                </div>
                
                <h3 className="text-white font-semibold text-lg mb-2">{event.title}</h3>
                <div className="flex items-center text-gray-300 text-sm">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  {event.location}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Achievement Spotlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl p-8 border border-white/20 backdrop-blur-lg"
        >
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center">
              <TrophyIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Achievement Unlocked!</h2>
              <p className="text-gray-300">You're on a 15-day workout streak!</p>
            </div>
            <div className="flex-1"></div>
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="w-6 h-6 text-yellow-400 fill-current" />
              ))}
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">🔥</div>
              <div className="text-white font-semibold">Consistency Master</div>
              <div className="text-gray-300 text-sm">15 day streak</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">💪</div>
              <div className="text-white font-semibold">Distance Destroyer</div>
              <div className="text-gray-300 text-sm">50km this week</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">⚡</div>
              <div className="text-white font-semibold">Speed Demon</div>
              <div className="text-gray-300 text-sm">New PR achieved</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;