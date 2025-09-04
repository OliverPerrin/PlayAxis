import React from 'react';
import { useLocalStorage } from '../hooks/UseLocalStorage';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

const SettingsPage = () => {
  const [theme, setTheme] = useLocalStorage('theme', 'dark');

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-300">Personalize your PlayAxis experience</p>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-semibold">Theme</div>
              <div className="text-gray-300 text-sm">Switch between light and dark</div>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white inline-flex items-center gap-2"
            >
              {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-semibold">Notifications</div>
              <div className="text-gray-300 text-sm">Receive updates about events and friends</div>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-purple-600 relative">
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all peer-checked:translate-x-5" />
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-semibold">Privacy</div>
              <div className="text-gray-300 text-sm">Manage profile visibility</div>
            </div>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">Open</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;