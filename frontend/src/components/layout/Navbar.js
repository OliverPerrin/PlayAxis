import React, { useContext } from 'react';
import {
  Bars3Icon,
  MoonIcon,
  SunIcon,
  MapIcon,
  SidebarCollapseIcon // (optional placeholder if you want a custom icon)
} from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../contexts/ThemeContext';
import { UIContext } from '../../contexts/UIContext';

const Navbar = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } = useContext(UIContext);
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
    <header className={`fixed top-0 inset-x-0 z-50 backdrop-blur border-b ${surface}`}>
      <div className="mx-auto max-w-7xl px-3 md:px-4 py-2.5 flex items-center gap-3">
        {/* Desktop collapse toggle */}
        <button
          onClick={toggleSidebarCollapsed}
          className={`hidden lg:inline-flex p-2 rounded-lg ${button} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed
            ? <ChevronRightIcon className="w-5 h-5" />
            : <ChevronLeftIcon className="w-5 h-5" />}
        </button>

        {/* Mobile open button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className={`inline-flex lg:hidden p-2 rounded-lg ${button} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
          aria-label="Open navigation"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        {/* Brand */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2"
        >
          <img src="/logo-mark.svg" alt="PlayAxis" className="w-8 h-8 rounded-md" />
          <span className={`font-bold text-lg ${textPrimary}`}>PlayAxis</span>
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Inline Map link (optional) */}
        <button
          onClick={() => navigate('/map')}
          className={`hidden md:inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition ${button}`}
        >
          <MapIcon className="w-4 h-4" />
          Map
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg ${button} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
          aria-label="Toggle theme"
        >
          {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;