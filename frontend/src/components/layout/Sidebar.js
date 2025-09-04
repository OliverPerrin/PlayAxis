import React from 'react';
import { NavLink } from 'react-router-dom';
import { XMarkIcon, HomeIcon, CalendarIcon, MagnifyingGlassIcon, ChartBarIcon, TrophyIcon, UsersIcon, Cog6ToothIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const links = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/discover', label: 'Discover', icon: MagnifyingGlassIcon },
  { to: '/events', label: 'Events', icon: CalendarIcon },
  { to: '/stats', label: 'My Stats', icon: ChartBarIcon },
  { to: '/leaderboards', label: 'Leaderboards', icon: TrophyIcon },
  { to: '/community', label: 'Community', icon: UsersIcon },
  { to: '/profile', label: 'Profile', icon: UserCircleIcon },
  { to: '/settings', label: 'Settings', icon: Cog6ToothIcon },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/50 transition-opacity ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-950 border-r border-white/10 transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="inline-flex items-center gap-2">
            <img src="/logo-mark.svg" alt="PlayAxis" className="w-8 h-8 rounded-md" />
            <span className="text-white font-bold">PlayAxis</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'bg-emerald-600/20 text-emerald-300' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;