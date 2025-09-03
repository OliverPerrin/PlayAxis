import React from 'react';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="lg:pl-64 bg-gray-800/30 backdrop-blur-lg border-t border-gray-700/50"
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            © 2025 PlayAxis. Built with ❤️ for athletes and sports fans.
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <button className="hover:text-white transition-colors">Privacy</button>
            <button className="hover:text-white transition-colors">Terms</button>
            <button className="hover:text-white transition-colors">Support</button>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;