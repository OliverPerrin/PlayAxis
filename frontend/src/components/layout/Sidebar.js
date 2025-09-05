import React from 'react';
import { XMarkIcon, GlobeAltIcon, HomeIcon, CalendarIcon, MapIcon } from '@heroicons/react/24/outline';
import { NavLink, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/events', label: 'Events', icon: CalendarIcon },
  { to: '/map', label: 'Map', icon: MapIcon },
  { to: '/discover', label: 'Discover', icon: GlobeAltIcon },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen, theme = 'dark' }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const surface = isDark
    ? 'bg-slate-900/90 border-white/10'
    : 'bg-white border-slate-200';

  const activeClasses = isDark
    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
    : 'bg-emerald-100 text-emerald-800 border-emerald-400';

  const baseLink = isDark
    ? 'text-slate-300 hover:text-white hover:bg-white/5'
    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100';

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Drawer / Static Sidebar */}
      <aside
        className={`fixed z-50 top-0 left-0 h-full w-64 flex flex-col border-r backdrop-blur transition-transform duration-300
          ${surface}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:z-30`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/10 dark:border-slate-800">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <img src="/logo-mark.svg" alt="PlayAxis" className="w-8 h-8 rounded" />
            <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>PlayAxis</span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 lg:hidden"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md border text-sm font-medium transition
                 ${isActive ? activeClasses : baseLink + ' border-transparent'}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} PlayAxis</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;