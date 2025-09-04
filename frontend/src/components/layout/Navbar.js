import React from 'react';
import { Bars3Icon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ setSidebarOpen, theme = 'dark', setTheme = () => {} }) => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-slate-950/70 backdrop-blur border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen?.(true)} className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white" aria-label="Open sidebar">
          <Bars3Icon className="w-6 h-6" />
        </button>

        <button onClick={() => navigate('/')} className="inline-flex items-center gap-2" aria-label="Go home">
          <img src="/logo-mark.svg" alt="PlayAxis" className="w-8 h-8 rounded-md" />
          <span className="text-white font-bold text-lg">PlayAxis</span>
        </button>

        <button onClick={() => setTheme?.(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white" aria-label="Toggle theme">
          {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;