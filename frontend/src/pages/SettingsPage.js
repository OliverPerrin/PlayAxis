import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

const SettingsPage = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className={`rounded-2xl p-6 border
        ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}
      `}>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Settings
        </h1>

        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Appearance
              </div>
              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Toggle light / dark mode
              </div>
            </div>
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="px-4 py-2 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500"
            >
              Switch to {isDark ? 'Light' : 'Dark'}
            </button>
          </div>

          {/* Add other settings sections here */}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;