import React, { useEffect, useMemo, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import {
  TrophyIcon,
  FireIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  GlobeAltIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { getLeaderboards } from '../api';
import { ThemeContext } from '../contexts/ThemeContext';

const normalizeLeaderboard = (payload, fallbackCategory) => {
  const MOCK_DATA = {
    overall: [
      { rank: 1, name: 'Alex Runner', avatar: '🏃‍♂️', score: 2450, streak: 45, change: 0, country: '🇺🇸' },
      { rank: 2, name: 'Sarah Cyclist', avatar: '🚴‍♀️', score: 2380, streak: 32, change: 1, country: '🇨🇦' },
      { rank: 3, name: 'Mike Swimmer', avatar: '🏊‍♂️', score: 2210, streak: 28, change: -1, country: '🇦🇺' },
      { rank: 4, name: 'Emma Tennis', avatar: '🎾', score: 2150, streak: 21, change: 2, country: '🇬🇧' },
      { rank: 5, name: 'David Climber', avatar: '🧗‍♂️', score: 2100, streak: 19, change: -1, country: '🇩🇪' },
      { rank: 6, name: 'Lisa Yoga', avatar: '🧘‍♀️', score: 2050, streak: 35, change: 0, country: '🇯🇵' },
      { rank: 7, name: 'Tom Hiker', avatar: '🥾', score: 1980, streak: 14, change: 3, country: '🇫🇷' },
      { rank: 8, name: 'Anna Dancer', avatar: '💃', score: 1920, streak: 25, change: -2, country: '🇪🇸' },
    ],
  };
  if (!payload) return MOCK_DATA[fallbackCategory] || MOCK_DATA.overall;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.leaderboard)) return payload.leaderboard;
  if (payload.results && Array.isArray(payload.results)) return payload.results;
  return MOCK_DATA[fallbackCategory] || MOCK_DATA.overall;
};

const changeBadge = (n) => {
  if (!n) return <span className="text-gray-400">—</span>;
  if (n > 0) {
    return (
      <span className="inline-flex items-center text-emerald-400">
        <ArrowTrendingUpIcon className="w-4 h-4 mr-0.5" />+{n}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-rose-400">
      <ArrowTrendingDownIcon className="w-4 h-4 mr-0.5" />
      {n}
    </span>
  );
};

const CATEGORIES = [
  { id: 'overall', name: 'Overall', icon: TrophyIcon },
  { id: 'running', name: 'Running', icon: () => <span>🏃‍♂️</span> },
  { id: 'cycling', name: 'Cycling', icon: () => <span>🚴‍♂️</span> },
  { id: 'tennis', name: 'Tennis', icon: () => <span>🎾</span> },
  { id: 'swimming', name: 'Swimming', icon: () => <span>🏊‍♂️</span> },
];

const TIMEFRAMES = [
  { id: 'weekly', name: 'This Week' },
  { id: 'monthly', name: 'This Month' },
  { id: 'yearly', name: 'This Year' },
  { id: 'alltime', name: 'All Time' },
];

const LeaderboardsPage = () => {
  const [category, setCategory] = useState('overall');
  const [timeframe, setTimeframe] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getLeaderboards(category, timeframe);
        if (!mounted) return;
        const normalized = normalizeLeaderboard(data, category).map((r, idx) => ({
          rank: r.rank ?? idx + 1,
          name: r.name || r.username || 'Athlete',
          avatar: r.avatar || '🏅',
          score: r.score ?? r.points ?? r.value ?? 0,
            streak: r.streak ?? r.current_streak ?? 0,
          change: r.change ?? r.rank_change ?? 0,
          country: r.country || r.flag || '🌍',
        }));
        setRows(normalized);
      } catch (e) {
        if (!mounted) return;
        setError('Showing demo leaderboard.');
        setRows(normalizeLeaderboard(null, category));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [category, timeframe]);

  // Style tokens
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const sub = isDark ? 'text-gray-300' : 'text-slate-600';
  const surface = isDark ? 'bg-white/10 border border-white/20' : 'bg-white border border-slate-200 shadow-sm';
  const pod = surface; // same visual treatment
  const toggleBase = isDark ? 'text-gray-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100';
  const toggleActive = 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white';
  const tableHead = isDark ? 'bg-white/5' : 'bg-slate-100';
  const tableRow = isDark ? 'border-t border-white/10 hover:bg-white/5' : 'border-t border-slate-200 hover:bg-slate-50';
  const cellMuted = isDark ? 'text-gray-300' : 'text-slate-600';

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${heading}`}>Leaderboards</h1>
            <p className={sub}>See who’s leading across categories and timeframes</p>
          </div>
          <div className="flex gap-2 mt-4 lg:mt-0">
            <div className={`${surface} rounded-xl p-2 flex`}>
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                const active = c.id === category;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${active ? toggleActive : toggleBase}`}
                  >
                    {typeof Icon === 'function' ? <Icon /> : <UserIcon className="w-4 h-4" />}
                    {c.name}
                  </button>
                );
              })}
            </div>
            <div className={`${surface} rounded-xl p-2 flex`}>
              {TIMEFRAMES.map((t) => {
                const active = t.id === timeframe;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTimeframe(t.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${active ? toggleActive : toggleBase}`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error && <div className={isDark ? 'text-yellow-300' : 'text-amber-600'}>{error}</div>}

        {/* Podium */}
  <div className="grid md:grid-cols-3 gap-4">
          {top3.map((p, i) => (
            <motion.div
              key={p.name + i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`${pod} rounded-2xl p-6 text-center`}
            >
              <div className="text-5xl mb-3">{p.avatar}</div>
              <div className={`${heading} font-bold text-xl`}>{p.name}</div>
              <div className={`${cellMuted} text-sm`}>{p.country}</div>
              <div className={`mt-3 inline-flex items-center gap-2 ${isDark ? 'text-cyan-300' : 'text-emerald-600'}`}>
                <TrophyIcon className="w-5 h-5" />
                <span className="font-semibold">{p.score.toLocaleString()}</span>
              </div>
              <div className={`mt-2 text-sm flex justify-center gap-3 ${cellMuted}`}>
                <span className="inline-flex items-center gap-1"><FireIcon className="w-4 h-4 text-amber-400" /> {p.streak}d</span>
                {changeBadge(p.change)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Full table */}
        <div className={`${surface} rounded-2xl overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className={tableHead}>
                <tr className={cellMuted}>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Athlete</th>
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Streak</th>
                  <th className="py-3 px-4">Change</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className={tableRow}>
                      <td className="py-3 px-4"><div className={`h-4 w-6 rounded ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} /></td>
                      <td className="py-3 px-4"><div className={`h-4 w-40 rounded ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} /></td>
                      <td className="py-3 px-4"><div className={`h-4 w-12 rounded ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} /></td>
                      <td className="py-3 px-4"><div className={`h-4 w-12 rounded ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} /></td>
                      <td className="py-3 px-4"><div className={`h-4 w-10 rounded ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} /></td>
                      <td className="py-3 px-4"><div className={`h-4 w-10 rounded ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} /></td>
                    </tr>
                  ))
                ) : (
                  rows.map((r) => (
                    <tr key={r.rank + r.name} className={tableRow}>
                      <td className={`py-3 px-4 font-semibold ${heading}`}>{r.rank}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{r.avatar}</div>
                          <div className={heading}>{r.name}</div>
                        </div>
                      </td>
                      <td className={`py-3 px-4 ${cellMuted}`}>{r.country}</td>
                      <td className={`py-3 px-4 font-semibold ${heading}`}>{r.score.toLocaleString()}</td>
                      <td className={`py-3 px-4 ${cellMuted}`}>{r.streak} days</td>
                      <td className="py-3 px-4">{changeBadge(r.change)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`text-sm flex items-center gap-2 ${cellMuted}`}>
          <GlobeAltIcon className="w-4 h-4" />
          Leaderboards are refreshed periodically. Live rankings may differ slightly.
        </div>
      </div>
    </div>
  );
};

export default LeaderboardsPage;