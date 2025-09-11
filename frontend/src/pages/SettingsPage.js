import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className={`rounded-2xl p-6 border
        ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}
      `}>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Settings
        </h1>

        <div className="mt-6 space-y-8">
          {/* Appearance */}
          <section className="flex items-center justify-between">
            <div>
              <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Appearance</div>
              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Toggle light / dark mode</div>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500"
            >
              Switch to {isDark ? 'Light' : 'Dark'}
            </button>
          </section>

          {/* Info Pages */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Platform Pages</div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Legal & informational references</div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: 'About', desc: 'Learn what PlayAxis is building', to: '/about' },
                { title: 'Privacy', desc: 'How we handle your data', to: '/privacy' },
                { title: 'Terms', desc: 'Usage rules & responsibilities', to: '/terms' },
                { title: 'Contact', desc: 'Reach the team', to: '/contact' }
              ].map(card => (
                <button
                  key={card.to}
                  onClick={() => navigate(card.to)}
                  className={`text-left p-4 rounded-xl border transition group ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-white'} `}
                >
                  <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{card.title}</div>
                  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{card.desc}</div>
                  <div className={`mt-3 text-xs font-medium inline-flex items-center gap-1 ${isDark ? 'text-emerald-300 group-hover:text-emerald-200' : 'text-emerald-600 group-hover:text-emerald-500'}`}>Open <span aria-hidden>→</span></div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;