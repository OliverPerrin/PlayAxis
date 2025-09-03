import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  CalendarIcon, 
  ChartBarIcon, 
  TrophyIcon, 
  FireIcon,
  ArrowRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

// Components
import StatsCards from '../components/home/StatsCards';
import FeaturedEvents from '../components/home/FeaturedEvents';
import RecentActivity from '../components/home/RecentActivity';
import QuickActions from '../components/home/QuickActions';
import WeatherWidget from '../components/widgets/WeatherWidget';

const HomePage = () => {
  const [greeting, setGreeting] = useState('');
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

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
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl p-8 text-white relative">
          <div className="absolute inset-0 bg-black opacity-20 rounded-3xl"></div>
          <div className="relative z-10">
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-4"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {greeting}, Champion! 🏆
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl opacity-90 mb-8"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Ready to dominate today's events and crush your personal records?
            </motion.p>
            
            <div className="flex flex-wrap gap-4">
              <Link
                to="/events"
                className="bg-white text-purple-600 px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-opacity-90 transition-all transform hover:scale-105"
              >
                <CalendarIcon className="w-5 h-5" />
                Explore Events
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                to="/stats"
                className="border-2 border-white text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-white hover:text-purple-600 transition-all transform hover:scale-105"
              >
                <ChartBarIcon className="w-5 h-5" />
                View Stats
              </Link>
            </div>
          </div>

          {/* Animated Background Elements */}
          <div className="absolute top-10 right-10 opacity-30">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-32 h-32 border-4 border-white rounded-full"
            />
          </div>
          <div className="absolute bottom-10 left-10 opacity-20">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-24 h-24 bg-white rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Quick Stats & Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <StatsCards />
        </motion.div>
        <motion.div variants={itemVariants}>
          <WeatherWidget />
        </motion.div>
      </div>

      {/* Featured Events & Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <motion.div variants={itemVariants}>
          <FeaturedEvents />
        </motion.div>
        <motion.div variants={itemVariants}>
          <RecentActivity />
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <QuickActions />
      </motion.div>
    </motion.div>
  );
};

export default HomePage;