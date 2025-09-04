import React from 'react';

const Footer = () => {
  return (
    <footer className="mt-10 border-t border-white/10 bg-slate-950/60 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-6 h-6 rounded-md bg-gradient-to-r from-emerald-500 to-cyan-500" />
          <span className="text-gray-300 text-sm">© {new Date().getFullYear()} PlayAxis</span>
        </div>
        <div className="text-gray-400 text-sm">
          Built for athletes of every level.
        </div>
      </div>
    </footer>
  );
};

export default Footer;