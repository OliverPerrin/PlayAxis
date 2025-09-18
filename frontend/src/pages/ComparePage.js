import React, { useState, useContext, useEffect } from 'react';
import { ArrowsRightLeftIcon, TrophyIcon, BoltIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ThemeContext } from '../contexts/ThemeContext';
import { searchAthletes, compareAthlete } from '../api';
import SportSelector from '../components/SportSelector';

const ComparePage = () => {
  const [left, setLeft] = useState('You');
  const [right, setRight] = useState('Pro Athlete');
  const [selectedSport, setSelectedSport] = useState('running');
  const [query, setQuery] = useState('');
  const [athleteResults, setAthleteResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState(null);
  // Dynamic metrics per sport (simple starter set)
  const metricTemplates = {
    running: { '5k_sec': 1800, '10k_sec': 4000, 'marathon_sec': 4 * 3600 },
    cycling: { 'ftp_wkg': 3.0, 'vo2max_mlkgmin': 45 },
    skiing: { 'giant_slalom_sec': 95, 'slalom_sec': 70 },
  };
  const [userMetrics, setUserMetrics] = useState(metricTemplates['running']);

  // Update metric set when sport changes
  useEffect(() => {
    setUserMetrics(metricTemplates[selectedSport] || {});
    setSelectedAthlete(null);
    setComparison(null);
    setQuery('');
    setAthleteResults([]);
  }, [selectedSport]);

  // Debounced athlete search
  useEffect(() => {
    if (!query.trim()) { setAthleteResults([]); return; }
    const h = setTimeout(() => {
      setSearching(true);
      searchAthletes(selectedSport, query, 25).then(res => {
        setAthleteResults(res.athletes || []);
        setSearching(false);
      }).catch(() => setSearching(false));
    }, 350);
    return () => clearTimeout(h);
  }, [query, selectedSport]);

  const submitComparison = () => {
    if (!selectedAthlete) return;
    setComparing(true);
    compareAthlete({ sport: selectedSport, athlete_id: selectedAthlete.id, user_metrics: userMetrics })
      .then(resp => setComparison(resp))
      .finally(() => setComparing(false));
  };

  const updateMetric = (k, v) => {
    setUserMetrics(m => ({ ...m, [k]: v }));
  };

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

        <div className={`${surface} rounded-2xl p-6 space-y-6`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div>
              <label className={`block mb-2 ${heading}`}>Your Label</label>
              <input value={left} onChange={e => setLeft(e.target.value)} className={`w-full px-4 py-2 rounded-xl ${inputCls}`} />
            </div>
            <div>
              <label className={`block mb-2 ${heading}`}>Sport</label>
              <SportSelector value={selectedSport} onChange={setSelectedSport} condensed />
            </div>
            <div>
              <label className={`block mb-2 ${heading}`}>Search Athlete</label>
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 opacity-60" />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Type athlete name" className={`w-full pl-10 px-4 py-2 rounded-xl ${inputCls}`} />
                {athleteResults.length > 0 && (
                  <div className={`absolute z-10 mt-1 max-h-56 overflow-y-auto w-full rounded-xl ${isDark ? 'bg-gray-900 border border-white/10' : 'bg-white border border-slate-200'} shadow-lg`}> 
                    {athleteResults.map(a => (
                      <button key={a.id} type="button" onClick={() => { setSelectedAthlete(a); setQuery(a.name); setAthleteResults([]); }} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-500/10">
                        {a.name} <span className="opacity-60">{a.country || a.team || ''}</span>
                      </button>
                    ))}
                    {searching && <div className="px-3 py-2 text-xs opacity-60">Searching...</div>}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <ArrowsRightLeftIcon className="w-8 h-8 text-cyan-300" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Object.keys(userMetrics).map(k => (
              <div key={k}>
                <label className={`block mb-2 ${heading}`}>{k.replace(/_/g,' ').replace(/sec$/,' (sec)')}</label>
                <input type="number" value={userMetrics[k]} onChange={e => updateMetric(k, Number(e.target.value))} className={`w-full px-4 py-2 rounded-xl ${inputCls}`} />
              </div>
            ))}
            <div className="flex items-end">
              <button disabled={comparing || !selectedAthlete} onClick={submitComparison} className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold py-2 rounded-xl shadow disabled:opacity-50">{comparing ? 'Comparing...' : 'Compare'}</button>
            </div>
          </div>

          {comparison && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm md:text-base">
                <thead>
                  <tr className={tableHead}>
                    <th className="py-3">Metric</th>
                    <th className="py-3">You</th>
                    <th className="py-3">Reference</th>
                    <th className="py-3">Delta</th>
                    <th className="py-3">Approx %</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.metrics.map(m => (
                    <tr key={m.metric} className={`${rowBorder} ${isDark ? 'text-white/80' : 'text-slate-800'}`}>
                      <td className="py-3 font-medium">{m.metric}</td>
                      <td className="py-3">{m.user_value}</td>
                      <td className="py-3">{m.athlete_value ?? m.player_value}</td>
                      <td className="py-3">{m.delta != null ? m.delta : ''}</td>
                      <td className="py-3">{m.percentile != null ? m.percentile.toFixed(1)+'%' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className={`${isDark ? 'text-emerald-300' : 'text-emerald-700'} flex items-center gap-2`}><BoltIcon className="w-5 h-5" /> Add more sport-specific metrics soon</div>
            <div className={`${isDark ? 'text-cyan-300' : 'text-cyan-600'} flex items-center gap-2`}><TrophyIcon className="w-5 h-5" /> Percentiles approximate vs world-class benchmarks</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparePage;