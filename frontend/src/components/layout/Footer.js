import React, { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';

const Footer = () => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const container = isDark
    ? 'border-white/10 bg-slate-950/60'
    : 'border-slate-200/70 bg-white/70';
  const copyText = isDark ? 'text-slate-300' : 'text-slate-600';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';
  const hoverLink = isDark ? 'hover:text-white' : 'hover:text-slate-900';

  return (
    <footer className={`mt-10 border-t supports-[backdrop-filter]:backdrop-blur-md backdrop-blur ${container} transition-colors`}> 
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-6 h-6 rounded-md bg-gradient-to-r from-emerald-500 to-cyan-500 shadow ring-1 ring-black/10" />
          <span className={`text-sm ${copyText}`}>© {new Date().getFullYear()} PlayAxis</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs font-medium tracking-wide uppercase">
          <a href="/about" className={`${subText} ${hoverLink} transition`}>About</a>
          <a href="/privacy" className={`${subText} ${hoverLink} transition`}>Privacy</a>
          <a href="/terms" className={`${subText} ${hoverLink} transition`}>Terms</a>
          <a href="/contact" className={`${subText} ${hoverLink} transition`}>Contact</a>
        </div>
        <div className={`text-sm ${subText} text-left sm:text-right`}>Built for athletes of every level.</div>
      </div>
    </footer>
  );
};

export default Footer;