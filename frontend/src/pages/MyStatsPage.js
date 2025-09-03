import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChartBarIcon, 
  TrophyIcon, 
  ClockIcon,
  FireIcon,
  PlusIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const MyStatsPage = () => {
  const [selectedSport, setSelectedSport] = useState('running');
  const [timeRange, setTimeRange] = useState('month');
  const [showAddModal, setShowAddModal] = useState(false);

  // Mock data - replace with real API calls
  const runningData = [
    { date: '2025-01-01', distance: 5.2, duration: 28 },
    { date: '2025-01-03', distance: 8.1, duration: 45 },
    { date: '2025-01-05', distance: 3.5, duration: 22 },
    { date: '2025-01-07', distance: 10.0, duration: 58 },
    { date: '2025-01-10', distance: 6.8, duration: 38 },
    { date: '2025-01-12', distance: 12.5, duration: 72 },
    { date: '2025-01-15', distance: 4.2, duration: 26 },
  ];

  const sportsData = [
    { name: 'Running', hours: 45, color: '#8B5CF6' },
    { name: 'Tennis', hours: 12, color: '#06D6A0' },
    { name: 'Cycling', hours: 18, color: '#F59E0B' },
    { name: 'Swimming', hours: 8, color: '#EF4444' },
  ];

  const achievements = [
    {
      id: 1,
      title: '5K Personal Best',
      description: 'New record: 22:35',
      date: '2025-01-15',
      icon: TrophyIcon,
      color: 'from-yellow-400 to-orange-500'
    },
    {
      id: 2,
      title: 'Weekly Goal',
      description: '3 workouts completed',
      date: '2025-01-14',
      icon: FireIcon,
      color: 'from-red-400 to-pink-500'
    },
    {
      id: 3,
      title: 'Marathon Training',
      description: 'Week 8 completed',
      date: '2025-01-12',
      icon: CalendarIcon,
      color: 'from-blue-400 to-purple-500'
    }
  ];

  const sports = [
    { id: 'running', name: 'Running', icon: '🏃‍♂️' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'cycling', name: 'Cycling', icon: '🚴‍♂️' },
    { id: 'swimming', name: 'Swimming', icon: '🏊‍♂️' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen p-6 space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            My Stats & Progress
          </h1>
          <p className="text-gray-400 text-lg">Track your athletic journey and celebrate your achievements</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Log Workout</span>
        </motion.button>
      </motion.div>

      {/* Sport Selection */}
      <motion.div variants={itemVariants} className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Select Sport</h3>
          <div className="flex items-center space-x-2 bg-gray-700/50 p-1 rounded-xl">
            {['week', 'month', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === range
                    ? 'bg-green-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-600/50'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sports.map((sport) => (
            <motion.button
              key={sport.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedSport(sport.id)}
              className={`p-4 rounded-xl transition-all duration-300 ${
                selectedSport === sport.id
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                  : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              <div className="text-3xl mb-2">{sport.icon}</div>
              <p className="font-semibold">{sport.name}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { title: 'Total Distance', value: '156.3 km', change: '+12%', changeType: 'increase', icon: ChartBarIcon },
            { title: 'Total Time', value: '28h 45m', change: '+8%', changeType: 'increase', icon: ClockIcon },
            { title: 'Avg Pace', value: '5:32/km', change: '-3%', changeType: 'decrease', icon: PlayIcon },
            { title: 'Workouts', value: '24', change: '+5', changeType: 'increase', icon: FireIcon }
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 bg-opacity-10">
                    <IconComponent className="w-6 h-6 text-green-400" />
                  </div>
                  <div className={`flex items-center space-x-1 text-sm font-medium ${
                    stat.changeType === 'increase' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stat.changeType === 'increase' ? (
                      <ArrowUpIcon className="w-4 h-4" />
                    ) : (
                      <ArrowDownIcon className="w-4 h-4" />
                    )}
                    <span>{stat.change}</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.title}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Progress Chart */}
        <motion.div variants={itemVariants} className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-6">Progress Over Time</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={runningData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    color: '#F3F4F6'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="distance" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Sport Distribution */}
        <motion.div variants={itemVariants} className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-6">Activity Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sportsData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="hours"
                  label={({ name, value }) => `${name}: ${value}h`}
                >
                  {sportsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    color: '#F3F4F6'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent Achievements */}
      <motion.div variants={itemVariants} className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
        <h3 className="text-xl font-bold text-white mb-6">Recent Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {achievements.map((achievement, index) => {
            const IconComponent = achievement.icon;
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="p-6 bg-gradient-to-br from-gray-700/30 to-gray-600/30 rounded-xl border border-gray-600/20 hover:border-gray-500/30 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${achievement.color} flex items-center justify-center mb-4`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-2">{achievement.title}</h4>
                <p className="text-gray-400 text-sm mb-2">{achievement.description}</p>
                <p className="text-xs text-gray-500">{achievement.date}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Add Workout Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-white mb-6">Log New Workout</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">Sport</label>
                  <select className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all">
                    <option>Running</option>
                    <option>Tennis</option>
                    <option>Cycling</option>
                    <option>Swimming</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    placeholder="5.0"
                  />
                </div>
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all"
                  >
                    Save Workout
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MyStatsPage;