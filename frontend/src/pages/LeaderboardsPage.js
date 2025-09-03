import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrophyIcon, 
  FireIcon, 
  ClockIcon,
  UserIcon,
  StarIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  FlagIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const LeaderboardsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('overall');
  const [selectedTimeframe, setSelectedTimeframe] = useState('monthly');
  const [showMyRank, setShowMyRank] = useState(false);

  const categories = [
    { id: 'overall', name: 'Overall', icon: TrophyIcon },
    { id: 'running', name: 'Running', icon: '🏃‍♂️' },
    { id: 'cycling', name: 'Cycling', icon: '🚴‍♂️' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'swimming', name: 'Swimming', icon: '🏊‍♂️' }
  ];

  const timeframes = [
    { id: 'weekly', name: 'This Week' },
    { id: 'monthly', name: 'This Month' },
    { id: 'yearly', name: 'This Year' },
    { id: 'alltime', name: 'All Time' }
  ];

  // Mock leaderboard data
  const leaderboardData = {
    overall: [
      { rank: 1, name: 'Alex Runner', avatar: '🏃‍♂️', score: 2450, streak: 45, change: 0, country: '🇺🇸' },
      { rank: 2, name: 'Sarah Cyclist', avatar: '🚴‍♀️', score: 2380, streak: 32, change: 1, country: '🇨🇦' },
      { rank: 3, name: 'Mike Swimmer', avatar: '🏊‍♂️', score: 2210, streak: 28, change: -1, country: '🇦🇺' },
      { rank: 4, name: 'Emma Tennis', avatar: '🎾', score: 2150, streak: 21, change: 2, country: '🇬🇧' },
      { rank: 5, name: 'David Climber', avatar: '🧗‍♂️', score: 2100, streak: 19, change: -1, country: '🇩🇪' },
      { rank: 6, name: 'Lisa Yoga', avatar: '🧘‍♀️', score: 2050, streak: 35, change: 0, country: '🇯🇵' },
      { rank: 7, name: 'Tom Hiker', avatar: '🥾', score: 1980, streak: 14, change: 3, country: '🇫🇷' },
      { rank: 8, name: 'Anna Dancer', avatar: '💃', score: 1920, streak: 25, change: -2, country: '🇪🇸' },
      { rank: 9, name: 'Chris Boxer', avatar: '🥊', score: 1850, streak: 12, change: 1, country: '🇮🇹' },
      { rank: 10, name: 'You', avatar: '👤', score: 1780, streak: 18, change: 0, country: '🌍', isCurrentUser: true }
    ]
  };

  const achievements = [
    { name: 'Speed Demon', description: 'Top 10 in running this month', icon: '⚡', rarity: 'legendary' },
    { name: 'Consistency King', description: '30-day workout streak', icon: '👑', rarity: 'epic' },
    { name: 'Marathon Master', description: 'Completed 5 marathons', icon: '🏃‍♂️', rarity: 'rare' },
    { name: 'Early Bird', description: '50 morning workouts', icon: '🌅', rarity: 'common' }
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

  const getRankColor = (rank) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-400 to-gray-600';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    return 'from-blue-400 to-purple-600';
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary': return 'from-orange-500 to-red-500';
      case 'epic': return 'from-purple-500 to-pink-500';
      case 'rare': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const currentLeaderboard = leaderboardData[selectedCategory] || leaderboardData.overall;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen p-6 space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">
          Leaderboards & Achievements
        </h1>
        <p className="text-gray-400 text-lg">Compete with athletes worldwide and track your progress</p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          {/* Category Selection */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Category</h3>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => {
                const IconComponent = typeof category.icon === 'string' ? null : category.icon;
                return (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                      selectedCategory === category.id
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                        : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 hover:text-white'
                    }`}
                  >
                    {typeof category.icon === 'string' ? (
                      <span className="text-xl">{category.icon}</span>
                    ) : (
                      <IconComponent className="w-5 h-5" />
                    )}
                    <span className="font-semibold">{category.name}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Timeframe Selection */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Timeframe</h3>
            <div className="flex flex-wrap gap-2">
              {timeframes.map((timeframe) => (
                <button
                  key={timeframe.id}
                  onClick={() => setSelectedTimeframe(timeframe.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedTimeframe === timeframe.id
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {timeframe.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Leaderboard */}
      <motion.div variants={itemVariants} className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50 overflow-hidden">
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              {categories.find(c => c.id === selectedCategory)?.name} Leaderboard
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <ClockIcon className="w-4 h-4" />
              <span>Updated 5 min ago</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-700/50">
          {currentLeaderboard.map((user, index) => (
            <motion.div
              key={user.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-6 hover:bg-gray-700/20 transition-all duration-300 ${
                user.isCurrentUser ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-l-4 border-purple-500' : ''
              }`}
            >
              <div className="flex items-center space-x-4">
                {/* Rank */}
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getRankColor(user.rank)} flex items-center justify-center font-bold text-white shadow-lg`}>
                    {user.rank <= 3 && user.rank === 1 && <TrophyIcon className="w-6 h-6" />}
                    {user.rank <= 3 && user.rank !== 1 && <span className="text-lg">{user.rank}</span>}
                    {user.rank > 3 && <span className="text-sm">{user.rank}</span>}
                  </div>
                  
                  {/* Rank Change Indicator */}
                  {user.change !== 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        user.change > 0
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {user.change > 0 ? (
                        <ChevronUpIcon className="w-3 h-3" />
                      ) : (
                        <ChevronDownIcon className="w-3 h-3" />
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Avatar & Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{user.avatar}</span>
                    <div>
                      <h4 className={`font-bold ${user.isCurrentUser ? 'text-purple-400' : 'text-white'}`}>
                        {user.name}
                        {user.isCurrentUser && <span className="text-xs ml-2 bg-purple-500 text-white px-2 py-1 rounded-full">YOU</span>}
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <span>{user.country}</span>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <FireIcon className="w-3 h-3 text-orange-400" />
                          <span>{user.streak} day streak</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-white mb-1">
                    {user.score.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">points</div>
                </div>

                {/* Action Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors"
                >
                  <UserIcon className="w-5 h-5 text-gray-400" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Show More Button */}
        <div className="p-6 border-t border-gray-700/50 text-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="text-orange-400 hover:text-orange-300 font-semibold"
          >
            Show More Rankings
          </motion.button>
        </div>
      </motion.div>

      {/* Achievements Section */}
      <motion.div variants={itemVariants} className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Recent Achievements</h3>
          <SparklesIcon className="w-6 h-6 text-yellow-400" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="p-4 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-all duration-300 cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getRarityColor(achievement.rarity)} flex items-center justify-center text-2xl mb-3 mx-auto`}>
                {achievement.icon}
              </div>
              <h4 className="font-bold text-white text-center mb-2 text-sm">{achievement.name}</h4>
              <p className="text-xs text-gray-400 text-center leading-tight">{achievement.description}</p>
              <div className={`mt-2 text-xs font-medium text-center ${
                achievement.rarity === 'legendary' ? 'text-orange-400' :
                achievement.rarity === 'epic' ? 'text-purple-400' :
                achievement.rarity === 'rare' ? 'text-blue-400' : 'text-gray-400'
              }`}>
                {achievement.rarity.toUpperCase()}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-8">
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block mb-4"
          >
            <TrophyIcon className="w-16 h-16 text-yellow-400" />
          </motion.div>
          <h3 className="text-3xl font-bold text-white mb-4">Climb the Rankings!</h3>
          <p className="text-gray-300 text-lg mb-6 max-w-2xl mx-auto">
            Complete more workouts, maintain your streak, and compete with athletes from around the world to reach the top!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-yellow-700 hover:to-orange-700 transition-all duration-300"
            >
              Start Training
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border-2 border-yellow-500 text-yellow-400 px-8 py-3 rounded-xl font-semibold hover:bg-yellow-500 hover:text-white transition-all duration-300"
            >
              View All Achievements
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LeaderboardsPage;