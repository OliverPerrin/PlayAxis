import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, PlayIcon, StopIcon, BoltIcon, FireIcon, ClockIcon, MapPinIcon, ArrowTrendingUpIcon, TrophyIcon } from '@heroicons/react/24/outline';

const MyStatsPage = () => {
  const [selectedSport, setSelectedSport] = useState('running');
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [isTracking, setIsTracking] = useState(false);

  const sports = [
    { id: 'running', name: 'Running', icon: '🏃‍♂️', color: 'from-blue-500 to-cyan-500' },
    { id: 'cycling', name: 'Cycling', icon: '🚴‍♂️', color: 'from-green-500 to-emerald-500' },
    { id: 'swimming', name: 'Swimming', icon: '🏊‍♂️', color: 'from-purple-500 to-pink-500' },
    { id: 'tennis', name: 'Tennis', icon: '🎾', color: 'from-yellow-500 to-orange-500' },
    { id: 'basketball', name: 'Basketball', icon: '🏀', color: 'from-orange-500 to-red-500' },
    { id: 'soccer', name: 'Soccer', icon: '⚽', color: 'from-indigo-500 to-purple-500' }
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

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Performance</h1>
            <p className="text-gray-300">Track your athletic journey and progress</p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <button className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl"><PlusIcon className="w-5 h-5" /> Quick Log</button>
            {!isTracking ? (
              <button onClick={() => setIsTracking(true)} className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold"><PlayIcon className="w-5 h-5" /> Start Workout</button>
            ) : (
              <button onClick={() => setIsTracking(false)} className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-semibold"><StopIcon className="w-5 h-5" /> Stop Workout</button>
            )}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {sports.map((s) => (
              <button key={s.id} onClick={() => setSelectedSport(s.id)} className={`flex flex-col items-center gap-1 p-4 rounded-xl ${selectedSport === s.id ? `bg-gradient-to-r ${s.color} text-white` : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
                <span className="text-2xl">{s.icon}</span>
                <span className="text-sm font-medium">{s.name}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            {periods.map((p) => (
              <button key={p.id} onClick={() => setSelectedPeriod(p.id)} className={`py-2.5 px-4 rounded-xl font-medium ${selectedPeriod === p.id ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center"><MapPinIcon className="w-6 h-6 text-white" /></div>
              <div className="flex items-center gap-1 text-green-400"><ArrowTrendingUpIcon className="w-4 h-4" /><span className="text-sm font-medium">+{currentStats.trend}%</span></div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{currentStats.distance} km</div>
            <div className="text-gray-300">Total Distance</div>
          </div>

          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center"><ClockIcon className="w-6 h-6 text-white" /></div>
              <div className="flex items-center gap-1 text-green-400"><ArrowTrendingUpIcon className="w-4 h-4" /><span className="text-sm font-medium">+5.2%</span></div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{Math.floor((currentStats.time || 0) / 60)}h {(currentStats.time || 0) % 60}m</div>
            <div className="text-gray-300">Active Time</div>
          </div>

          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center"><FireIcon className="w-6 h-6 text-white" /></div>
              <div className="flex items-center gap-1 text-green-400"><ArrowTrendingUpIcon className="w-4 h-4" /><span className="text-sm font-medium">+18.7%</span></div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{(currentStats.calories || 0).toLocaleString()}</div>
            <div className="text-gray-300">Calories Burned</div>
          </div>

          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center"><TrophyIcon className="w-6 h-6 text-white" /></div>
              <div className="flex items-center gap-1 text-green-400"><ArrowTrendingUpIcon className="w-4 h-4" /><span className="text-sm font-medium">+12.5%</span></div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{currentStats.sessions || 0}</div>
            <div className="text-gray-300">Training Sessions</div>
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Weekly Progress</h3>
            <div className="flex items-center gap-2 text-green-400"><BoltIcon className="w-5 h-5" /> <span className="font-semibold">+15% vs last week</span></div>
          </div>

          <div className="flex items-end gap-4 h-40">
            {weeklyProgress.map((d, i) => (
              <motion.div key={d.day} initial={{ height: 0 }} animate={{ height: `${d.value}%` }} transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }} className="flex-1 relative group">
                <div className="bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-lg w-full" style={{ height: `${d.value}%` }} />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-gray-300 text-sm">{d.day}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyStatsPage;