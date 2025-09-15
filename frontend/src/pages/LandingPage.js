import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, CheckIcon, UserPlusIcon, MapIcon, BoltIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { ThemeContext } from '../contexts/ThemeContext';

const FEATURES = [
  { title: 'Find your first event', desc: 'Discover nearby runs, rides, and community activities.', icon: MapIcon },
  { title: 'Set your goals', desc: 'Pick sports, distances, and habits you want to build.', icon: BoltIcon },
  { title: 'Meet people', desc: 'Clubs and groups to help you get moving together.', icon: UserPlusIcon },
  { title: 'Own your data', desc: 'Privacy-first, with simple controls and exports.', icon: CheckIcon },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  // Shared style tokens similar to other pages
  const bgClass = isDark
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
    : 'bg-gradient-to-br from-white via-emerald-50 to-cyan-50';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const subText = isDark ? 'text-gray-300' : 'text-slate-600';
  const featureCard = isDark
    ? 'bg-white/5 border border-white/10'
    : 'bg-white border border-slate-200 shadow-sm';
  const secondaryBtn = isDark
    ? 'bg-white/10 text-white hover:bg-white/15'
    : 'bg-slate-200 text-slate-700 hover:bg-slate-300';
  const navBtn = secondaryBtn;
  const navBrand = heading;
  const ctaPanel = isDark
    ? 'bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border border-white/10'
    : 'bg-gradient-to-r from-emerald-100 to-cyan-100 border border-emerald-200';
  const footerText = isDark ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className={`min-h-screen overflow-hidden ${bgClass}`}>
      {/* Nav */}
      <nav className="p-6 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center space-x-2">
            <img src="/logo-mark.svg" alt="PlayAxis" className="w-10 h-10 rounded-xl" />
            <span className={`text-2xl font-bold ${navBrand}`}>PlayAxis</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle light/dark mode"
              className={`p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/60 ${navBtn} flex items-center justify-center w-11 h-11`}
            >
              {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <button onClick={() => navigate('/auth')} className={`px-5 py-2.5 rounded-xl transition-colors ${navBtn}`}>
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative z-10 pt-10 pb-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`text-6xl md:text-7xl font-black ${heading}`}
          >
            Welcome to your new start
          </motion.h1>
          <p className={`mt-6 text-lg md:text-xl max-w-3xl mx-auto ${subText}`}>
            PlayAxis helps you discover events, set goals, and find accountability — without needing a history or past stats. Let’s take your first step today.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/auth')}
              className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-2xl font-semibold hover:shadow-lg"
            >
              Create your account
            </button>
            <button onClick={() => navigate('/discover')} className={`px-8 py-4 rounded-2xl transition-colors ${secondaryBtn}`}>
              Browse events
            </button>
          </div>
        </div>
      </header>

      {/* New-user friendly value props */}
      <section className="relative z-10 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className={`text-4xl font-bold text-center mb-10 ${heading}`}>Get started in minutes</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`rounded-2xl p-6 ${featureCard}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`${heading} font-semibold text-lg`}>{f.title}</div>
                  <div className={`${subText} mt-1`}>{f.desc}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className={`${ctaPanel} rounded-3xl p-10 text-center`}>            
            <h3 className={`text-4xl font-bold mb-3 ${heading}`}>We’re just getting started</h3>
            <p className={`mb-6 ${subText}`}>No leaderboards to chase yet — just a simple place to build momentum. Join us and help shape what comes next.</p>
            <button onClick={() => navigate('/auth')} className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-2xl font-semibold inline-flex items-center gap-2">
              Join now <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
      <footer className={`pb-10 text-center ${footerText}`}>© 2025 PlayAxis. All rights reserved.</footer>
    </div>
  );
};

export default LandingPage;