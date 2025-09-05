import React, { useContext } from 'react';
import {
  Bars3Icon,
  MoonIcon,
  SunIcon,
  MapIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../contexts/ThemeContext';

const Navbar = ({ setSidebarOpen }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const surface = isDark
    ? 'bg-slate-950/70 border-white/10'
    : 'bg-white/80 border-slate-200';

  const button = isDark
    ? 'bg-white/10 text-white hover:bg-white/15'
    : 'bg-slate-100 text-slate-700 hover:bg-slate-200';

  const textPrimary = isDark ? 'text-white' : 'text-slate-900';

  return (
    <header className={`fixed top-0 inset-x-0 z-40 backdrop-blur border-b ${surface}`}>
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen?.(true)}
          className={`p-2 rounded-lg ${button} lg:hidden`}
          aria-label="Open sidebar"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2"
          >
            <img src="/logo-mark.svg" alt="PlayAxis" className="w-8 h-8 rounded-md" />
            <span className={`font-bold text-lg ${textPrimary}`}>PlayAxis</span>
          </button>
          <button
            onClick={() => navigate('/map')}
            className={`hidden md:inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition ${button}`}
          >
            <MapIcon className="w-4 h-4" />
            Map
          </button>
        </div>

        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg ${button}`}
          aria-label="Toggle theme"
        >
          {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;