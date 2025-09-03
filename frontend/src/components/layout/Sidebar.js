import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  CalendarIcon,
  ChartBarIcon,
  ScaleIcon,
  UserIcon,
  TrophyIcon,
  XMarkIcon,
  FireIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon, gradient: 'from-blue-500 to-cyan-500' },
    { name: 'Events', href: '/events', icon: CalendarIcon, gradient: 'from-purple-500 to-pink-500' },
    { name: 'My Stats', href: '/stats', icon: ChartBarIcon, gradient: 'from-green-500 to-emerald-500' },
    { name: 'Compare', href: '/compare', icon: ScaleIcon, gradient: 'from-orange-500 to-red-500' },
    { name: 'Leaderboards', href: '/leaderboards', icon: TrophyIcon, gradient: 'from-yellow-500 to-orange-500' },
    { name: 'Profile', href: '/profile', icon: UserIcon, gradient: 'from-indigo-500 to-purple-500' }
  ];

  const sidebarVariants = {
    hidden: { x: -300 },
    visible: { 
      x: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }
    }
  };

  const itemVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div 
              className="fixed inset-0 bg-gray-600 bg-opacity-75" 
              onClick={() => setSidebarOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition duration-300 ease-in-out lg:static lg:inset-0`}>
        <motion.div
          variants={sidebarVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col h-full bg-gray-900/95 backdrop-blur-lg border-r border-gray-700/50"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
                >
                  <BoltIcon className="w-6 h-6 text-white" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  PlayAxis
                </h1>
                <p className="text-xs text-gray-400">Multi-Sport Hub</p>
              </div>
            </div>
            
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2">
            {navigation.map((item, index) => {
              const isActive = location.pathname === item.href;
              const IconComponent = item.icon;
              
              return (
                <motion.div
                  key={item.name}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg scale-105'
                        : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                    }`}
                  >
                    <IconComponent 
                      className={`mr-3 h-5 w-5 transition-transform duration-300 ${
                        isActive ? 'scale-110' : 'group-hover:scale-105'
                      }`} 
                    />
                    {item.name}
                    
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="ml-auto w-2 h-2 bg-white rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700/50">
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <FireIcon className="w-8 h-8 text-orange-500" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white">Pro Features</h3>
                  <p className="text-xs text-gray-400 mt-1">Unlock advanced analytics</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
              >
                Upgrade Now
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Sidebar;