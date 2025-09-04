import React from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  TrophyIcon,
  FireIcon,
  MapPinIcon,
  ChartBarIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline';

const RecentActivity = () => {
  const activities = [
    {
      type: 'achievement',
      title: 'New Personal Best!',
      description: '5K Run - 22:35',
      time: '2 hours ago',
      icon: TrophyIcon,
      color: 'yellow',
      gradient: 'from-yellow-400 to-orange-500'
    },
    {
      type: 'workout',
      title: 'Morning Tennis Session',
      description: 'Central Park Courts',
      time: '1 day ago',
      icon: MapPinIcon,
      color: 'green',
      gradient: 'from-green-400 to-emerald-500'
    },
    {
      type: 'streak',
      title: '7-Day Streak!',
      description: 'Keep it up, champion!',
      time: '2 days ago',
      icon: FireIcon,
      color: 'orange',
      gradient: 'from-orange-400 to-red-500'
    },
    {
      type: 'progress',
      title: 'Weekly Goal Reached',
      description: '150% of target distance',
      time: '3 days ago',
      icon: ChartBarIcon,
      color: 'blue',
      gradient: 'from-blue-400 to-purple-500'
    }
  ];

  return (
    <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Recent Activity</h3>
        <div className="flex items-center space-x-1 text-green-400 text-sm font-medium">
          <ArrowUpIcon className="w-4 h-4" />
          <span>+15% this week</span>
        </div>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const IconComponent = activity.icon;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-4 p-4 bg-gray-700/20 rounded-xl hover:bg-gray-700/40 transition-all duration-300 group cursor-pointer"
            >
              {/* Icon */}
              <div className={`p-3 rounded-xl bg-gradient-to-br ${activity.gradient} bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300`}>
                <IconComponent className="w-5 h-5 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  {activity.title}
                </h4>
                <p className="text-sm text-gray-400 mt-1">
                  {activity.description}
                </p>
                <div className="flex items-center space-x-1 mt-2">
                  <ClockIcon className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              </div>

              {/* Activity indicator */}
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${activity.gradient}`} />
            </motion.div>
          );
        })}
      </div>

      {/* Activity summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl border border-purple-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">This Week's Summary</p>
            <p className="text-xs text-gray-400 mt-1">4 workouts, 2 achievements</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-emerald-400">92%</p>
            <p className="text-xs text-gray-400">Goal completion</p>
          </div>
        </div>
        
        <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '92%' }}
            transition={{ delay: 0.5, duration: 1 }}
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;