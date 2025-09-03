import React from 'react';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ClockIcon,
  TrophyIcon,
  FireIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

const StatsCards = () => {
  const stats = [
    {
      name: 'Events This Month',
      value: '24',
      change: '+12%',
      changeType: 'increase',
      icon: CalendarIcon,
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Hours Tracked',
      value: '156',
      change: '+8%',
      changeType: 'increase',
      icon: ClockIcon,
      color: 'green',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      name: 'Personal Bests',
      value: '7',
      change: '+2',
      changeType: 'increase',
      icon: TrophyIcon,
      color: 'yellow',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      name: 'Streak Days',
      value: '18',
      change: '-2',
      changeType: 'decrease',
      icon: FireIcon,
      color: 'red',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="relative overflow-hidden bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600/50 transition-all duration-300"
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5`} />
            
            {/* Content */}
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} bg-opacity-10 border border-gray-600/20`}>
                  <IconComponent className="w-6 h-6 text-white" />
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
              
              <div className="mt-4">
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400 mt-1">{stat.name}</p>
              </div>

              {/* Animated progress bar */}
              <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '70%' }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                  className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full`}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default StatsCards;