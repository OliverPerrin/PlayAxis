import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bars3Icon, 
  BellIcon, 
  SunIcon, 
  MoonIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = ({ setSidebarOpen, theme, setTheme }) => {
  const { user } = useAuth();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 right-0 left-0 lg:left-64 z-40 bg-gray-800/80 backdrop-blur-lg border-b border-gray-700"
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          {/* Search (hidden on mobile) */}
          <div className="hidden md:block flex-1 max-w-md mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
            >
              {theme === 'dark' ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all">
              <BellIcon className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* Profile */}
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition-all cursor-pointer">
              <UserCircleIcon className="w-8 h-8 text-gray-400" />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white">{user?.full_name || 'User'}</p>
                <p className="text-xs text-gray-400">Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;