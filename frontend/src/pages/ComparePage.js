import React, { useState, useContext, useEffect } from 'react';
import { ArrowsRightLeftIcon, TrophyIcon, BoltIcon } from '@heroicons/react/24/outline';
import { ThemeContext } from '../contexts/ThemeContext';

const ComparePage = () => {
  const [left, setLeft] = useState('You');
  const [right, setRight] = useState('Pro Athlete');

  const [rows, setRows] = useState([
    { metric: 'Upcoming Game', left: '—', right: '—' },
    { metric: 'Recent Result', left: '—', right: '—' },
    { metric: 'Home Team', left: '—', right: '—' },
    { metric: 'Away Team', left: '—', right: '—' },
  ]);
  useEffect(() => {
    // Lazy import to avoid circular imports at build time
    import('../api').then(({ getSportsEvents }) => {
      getSportsEvents('nfl').then(snapshot => {
        const up = snapshot.upcoming?.[0];
        const recent = snapshot.recent?.[0];
        setRows([
          { metric: 'Upcoming Game', left: left, right: up ? `${up.home_team} vs ${up.away_team}` : '—' },
          { metric: 'Recent Result', left: left, right: recent ? `${recent.home_team} ${recent.home_score ?? ''} - ${recent.away_score ?? ''} ${recent.away_team}` : '—' },
          { metric: 'Home Team', left: 'You', right: up?.home_team || recent?.home_team || '—' },
          { metric: 'Away Team', left: 'Competition', right: up?.away_team || recent?.away_team || '—' },
        ]);
      });
    });
  }, [left, right]);

  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const surface = isDark ? 'bg-white/10 border border-white/20' : 'bg-white border border-slate-200 shadow-sm';
  const inputCls = isDark ? 'bg-white/10 border-white/20 text-white placeholder-gray-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400';
  const sub = isDark ? 'text-gray-300' : 'text-slate-600';
  const tableHead = isDark ? 'text-gray-300' : 'text-slate-600';
  const rowBorder = isDark ? 'border-t border-white/10' : 'border-t border-slate-200';

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className={`text-4xl font-bold mb-6 ${heading}`}>Compare Performance</h1>

        <div className={`${surface} rounded-2xl p-6`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label className={`block mb-2 ${heading}`}>Left</label>
              <input value={left} onChange={e => setLeft(e.target.value)} className={`w-full px-4 py-2 rounded-xl ${inputCls}`} />
            </div>
            <div className="flex items-center justify-center">
              <ArrowsRightLeftIcon className="w-8 h-8 text-cyan-300" />
            </div>
            <div>
              <label className={`block mb-2 ${heading}`}>Right</label>
              <input value={right} onChange={e => setRight(e.target.value)} className={`w-full px-4 py-2 rounded-xl ${inputCls}`} />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className={tableHead}>
                  <th className="py-3">Metric</th>
                  <th className="py-3">{left}</th>
                  <th className="py-3">{right}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.metric} className={`${rowBorder} ${isDark ? 'text-white/90' : 'text-slate-800'}`}>
                    <td className="py-3 font-medium">{r.metric}</td>
                    <td className="py-3">{r.left}</td>
                    <td className="py-3">{r.right}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex gap-4">
            <div className={`flex items-center gap-2 ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}><BoltIcon className="w-5 h-5" /> Strength: Speed Workouts</div>
            <div className={`flex items-center gap-2 ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`}><TrophyIcon className="w-5 h-5" /> Target: New 10K PR</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparePage;