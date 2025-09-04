import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-white/30 border-t-white/90 rounded-full"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-sm" />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;