import React, { useContext } from 'react';
import {
  XMarkIcon,
  HomeIcon,
  CalendarIcon,
  MapIcon,
  GlobeAltIcon,
  TrophyIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  UsersIcon,
  Cog6ToothIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { NavLink, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../contexts/ThemeContext';
import { UIContext } from '../../contexts/UIContext';

const navItems = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/map', label: 'Map', icon: MapIcon },
  { to: '/events', label: 'Events', icon: CalendarIcon },
  { to: '/discover', label: 'Discover', icon: GlobeAltIcon },
  { to: '/leaderboards', label: 'Leaderboards', icon: TrophyIcon },
  { to: '/mystats', label: 'My Stats', icon: ChartBarIcon },
  { to: '/log-workout', label: 'Log Workout', icon: CalendarIcon },
  { to: '/compare', label: 'Compare', icon: AdjustmentsHorizontalIcon },
  { to: '/community', label: 'Community', icon: UsersIcon },
  { to: '/settings', label: 'Settings', icon: Cog6ToothIcon },
  { to: '/profile', label: 'Profile', icon: UserCircleIcon },
];

const Sidebar = () => {
  const { theme } = useContext(ThemeContext);
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = useContext(UIContext);
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const surface = isDark
    ? 'bg-slate-900/90 border-white/10'
    : 'bg-white/95 border-slate-200';

  const activeClasses = isDark
    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
    : 'bg-emerald-100 text-emerald-800 border-emerald-400';

  const baseLink = isDark
    ? 'text-slate-300 hover:text-white hover:bg-white/5'
    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100';

  const widthClass = sidebarCollapsed ? 'w-20' : 'w-64';

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className={`fixed z-40 top-0 left-0 h-full ${widthClass} flex flex-col border-r backdrop-blur transition-all duration-300
          ${surface}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-3 h-16 border-b border-white/10 dark:border-slate-800">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <img src="/logo-mark.svg" alt="PlayAxis" className="w-8 h-8 rounded" />
            {!sidebarCollapsed && (
              <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                PlayAxis
              </span>
            )}
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 lg:hidden"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={sidebarCollapsed ? label : undefined}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2 rounded-md border text-sm font-medium transition
                 ${isActive ? activeClasses : baseLink + ' border-transparent'}
                 ${sidebarCollapsed ? 'justify-center' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
              end={to === '/'}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span
                className={`whitespace-nowrap transition-opacity duration-200
                  ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
              >
                {label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className={`p-3 text-[10px] tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <p>&copy; {new Date().getFullYear()} PlayAxis</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;