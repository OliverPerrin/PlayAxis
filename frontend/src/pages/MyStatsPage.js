import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, PlayIcon, StopIcon, BoltIcon, FireIcon, ClockIcon, MapPinIcon, ArrowTrendingUpIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { ThemeContext } from '../contexts/ThemeContext';

const MyStatsPage = () => {
  const [selectedSport, setSelectedSport] = useState('running');
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [isTracking, setIsTracking] = useState(false);

  const sports = [
    { id: 'running', name: 'Running', icon: '🏃‍♂️', color: 'from-cyan-500 to-emerald-500' },
    { id: 'cycling', name: 'Cycling', icon: '🚴‍♂️', color: 'from-emerald-500 to-teal-500' },
    { id: 'swimming', name: 'Swimming', icon: '🏊‍♂️', color: 'from-blue-500 to-cyan-500' },
    { id: 'tennis', name: 'Tennis', icon: '🎾', color: 'from-lime-500 to-emerald-500' },
    { id: 'basketball', name: 'Basketball', icon: '🏀', color: 'from-amber-500 to-yellow-500' },
    { id: 'soccer', name: 'Soccer', icon: '⚽', color: 'from-indigo-500 to-blue-500' }
  ];

  const periods = [
    { id: 'week', name: 'This Week' },
    { id: 'month', name: 'This Month' },
    { id: 'year', name: 'This Year' },
    { id: 'all', name: 'All Time' }
  ];

  const mockStats = {
    running: { week: { distance: 42.5, time: 285, calories: 3200, sessions: 5, trend: 12.5 } },
    cycling: { week: { distance: 120.8, time: 420, calories: 2800, sessions: 3, trend: 15.2 } }
  };

  const currentStats = mockStats[selectedSport]?.[selectedPeriod] || { distance: 0, time: 0, calories: 0, sessions: 0, trend: 0 };
  const weeklyProgress = [
    { day: 'Mon', value: 85 }, { day: 'Tue', value: 92 }, { day: 'Wed', value: 78 },
    { day: 'Thu', value: 95 }, { day: 'Fri', value: 88 }, { day: 'Sat', value: 100 }, { day: 'Sun', value: 65 }
  ];

  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const sub = isDark ? 'text-gray-300' : 'text-slate-600';
  const surface = isDark ? 'bg-white/10 border border-white/20' : 'bg-white border border-slate-200 shadow-sm';
  const pillOn = 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white';
  const pillOff = isDark ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200';
  const metricSurface = isDark ? 'bg-white/10 border border-white/20' : 'bg-white border border-slate-200 shadow-sm';
  const metricLabel = isDark ? 'text-gray-300' : 'text-slate-600';
  const bigNumber = isDark ? 'text-white' : 'text-slate-900';

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${heading}`}>My Performance</h1>
            <p className={sub}>Track your athletic journey and progress</p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <button className={`flex items-center gap-2 px-5 py-3 rounded-xl ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}><PlusIcon className="w-5 h-5" /> Quick Log</button>
            {!isTracking ? (
              <button onClick={() => setIsTracking(true)} className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl font-semibold"><PlayIcon className="w-5 h-5" /> Start Workout</button>
            ) : (
              <button onClick={() => setIsTracking(false)} className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold"><StopIcon className="w-5 h-5" /> Stop Workout</button>
            )}
          </div>
        </div>

        <div className={`${surface} backdrop-blur-lg rounded-2xl p-6`}>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {sports.map((s) => (
              <button key={s.id} onClick={() => setSelectedSport(s.id)} className={`flex flex-col items-center gap-1 p-4 rounded-xl ${selectedSport === s.id ? `bg-gradient-to-r ${s.color} text-white` : pillOff}`}>
                <span className="text-2xl">{s.icon}</span>
                <span className="text-sm font-medium">{s.name}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            {periods.map((p) => (
              <button key={p.id} onClick={() => setSelectedPeriod(p.id)} className={`py-2.5 px-4 rounded-xl font-medium ${selectedPeriod === p.id ? pillOn : pillOff}`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`${metricSurface} rounded-2xl p-6`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center"><MapPinIcon className="w-6 h-6 text-white" /></div>
              <div className="flex items-center gap-1 text-emerald-400"><ArrowTrendingUpIcon className="w-4 h-4" /><span className="text-sm font-medium">+{currentStats.trend}%</span></div>
            </div>
            <div className={`text-3xl font-bold mb-1 ${bigNumber}`}>{currentStats.distance} km</div>
            <div className={metricLabel}>Total Distance</div>
          </div>

          <div className={`${metricSurface} rounded-2xl p-6`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl flex items-center justify-center"><ClockIcon className="w-6 h-6 text-white" /></div>
              <div className="flex items-center gap-1 text-emerald-400"><ArrowTrendingUpIcon className="w-4 h-4" /><span className="text-sm font-medium">+5.2%</span></div>
            </div>
            <div className={`text-3xl font-bold mb-1 ${bigNumber}`}>{Math.floor((currentStats.time || 0) / 60)}h {(currentStats.time || 0) % 60}m</div>
            <div className={metricLabel}>Active Time</div>
          </div>

          <div className={`${metricSurface} rounded-2xl p-6`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center"><FireIcon className="w-6 h-6 text-white" /></div>
              <div className="flex items-center gap-1 text-emerald-400"><ArrowTrendingUpIcon className="w-4 h-4" /><span className="text-sm font-medium">+18.7%</span></div>
            </div>
            <div className={`text-3xl font-bold mb-1 ${bigNumber}`}>{(currentStats.calories || 0).toLocaleString()}</div>
            <div className={metricLabel}>Calories Burned</div>
          </div>

          <div className={`${metricSurface} rounded-2xl p-6`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center"><TrophyIcon className="w-6 h-6 text-white" /></div>
              <div className="flex items-center gap-1 text-emerald-400"><ArrowTrendingUpIcon className="w-4 h-4" /><span className="text-sm font-medium">+12.5%</span></div>
            </div>
            <div className={`text-3xl font-bold mb-1 ${bigNumber}`}>{currentStats.sessions || 0}</div>
            <div className={metricLabel}>Training Sessions</div>
          </div>
        </div>

        <div className={`${surface} rounded-2xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-bold ${heading}`}>Weekly Progress</h3>
            <div className="flex items-center gap-2 text-emerald-300"><BoltIcon className="w-5 h-5" /> <span className="font-semibold">+15% vs last week</span></div>
          </div>

          <div className="flex items-end gap-4 h-40">
            {weeklyProgress.map((d, i) => (
              <motion.div key={d.day} initial={{ height: 0 }} animate={{ height: `${d.value}%` }} transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }} className="flex-1 relative group">
                <div className="bg-gradient-to-t from-cyan-600 to-emerald-500 rounded-t-lg w-full" style={{ height: `${d.value}%` }} />
                <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm ${metricLabel}`}>{d.day}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyStatsPage;