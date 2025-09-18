import React, { useState, useContext, useEffect } from 'react';
import { ArrowsRightLeftIcon, TrophyIcon, BoltIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ThemeContext } from '../contexts/ThemeContext';
import { searchTeams, getSportsEvents, comparePlayer, teamUpcomingEvents } from '../api';
import SportSelector from '../components/SportSelector';

const ComparePage = () => {
  const [left, setLeft] = useState('You');
  const [right, setRight] = useState('Pro Athlete');

  const [rows, setRows] = useState([]);
  const [snapshot, setSnapshot] = useState({ upcoming: [], recent: [] });
  const [teamUpcoming, setTeamUpcoming] = useState([]);
  const [selectedSport, setSelectedSport] = useState('soccer');
  const [teamQuery, setTeamQuery] = useState('');
  const [teamResults, setTeamResults] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [userMetrics, setUserMetrics] = useState({ speed: 0, endurance: 0, power: 0 });
  const [comparison, setComparison] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [searchingTeams, setSearchingTeams] = useState(false);
  const [comparing, setComparing] = useState(false);

  // sport list handled inside SportSelector component

  // Fetch league snapshot events for selected sport
  useEffect(() => {
    let active = true;
    setLoadingEvents(true);
    getSportsEvents(selectedSport)
      .then(snap => { if (active) setSnapshot(snap); })
      .finally(() => { if (active) setLoadingEvents(false); });
    return () => { active = false; };
  }, [selectedSport]);

  // Fetch team upcoming when team selected
  useEffect(() => {
    if (!selectedTeam?.idTeam) { setTeamUpcoming([]); return; }
    let mounted = true;
    teamUpcomingEvents(selectedTeam.idTeam).then(res => { if (mounted) setTeamUpcoming(res.upcoming || []); });
    return () => { mounted = false; };
  }, [selectedTeam]);

  // Build comparison rows whenever inputs change
  useEffect(() => {
    const nextLeague = snapshot.upcoming?.[0];
    const recentLeague = snapshot.recent?.[0];
    const nextTeam = teamUpcoming?.[0];
    const secondTeam = teamUpcoming?.[1];

    const opponent = (ev) => {
      if (!ev || !selectedTeam?.strTeam) return '—';
      if (ev.home_team === selectedTeam.strTeam) return ev.away_team || '—';
      if (ev.away_team === selectedTeam.strTeam) return ev.home_team || '—';
      return `${ev.home_team} vs ${ev.away_team}`;
    };

    const formatResult = (ev) => {
      if (!ev) return '—';
      if (ev.home_score != null && ev.away_score != null) {
        return `${ev.home_team} ${ev.home_score} - ${ev.away_score} ${ev.away_team}`;
      }
      return `${ev.home_team} vs ${ev.away_team}`;
    };

    const newRows = [
      { metric: 'Team Next Event', left: left, right: nextTeam ? formatResult(nextTeam) : '—' },
      { metric: 'Team Opponent', left: left, right: nextTeam ? opponent(nextTeam) : '—' },
      { metric: 'Following Opponent', left: left, right: secondTeam ? opponent(secondTeam) : '—' },
      { metric: 'League Next Event', left: left, right: nextLeague ? formatResult(nextLeague) : '—' },
      { metric: 'League Recent Result', left: left, right: formatResult(recentLeague) },
    ];
    setRows(newRows);
  }, [snapshot, teamUpcoming, selectedTeam, left]);

  // Debounced team search
  useEffect(() => {
    if (teamQuery.trim().length < 2) { setTeamResults([]); return; }
    const handle = setTimeout(() => {
      setSearchingTeams(true);
      searchTeams(teamQuery).then(res => {
        setTeamResults(res.players || []); // reusing schema
        setSearchingTeams(false);
      }).catch(() => setSearchingTeams(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [teamQuery]);

  const submitComparison = () => {
    setComparing(true);
    comparePlayer({ sport: selectedSport, player_id: selectedTeam?.idTeam || 'unknown', user_metrics: userMetrics })
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
              <label className={`block mb-2 ${heading}`}>Search Team</label>
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 opacity-60" />
                <input value={teamQuery} onChange={e => setTeamQuery(e.target.value)} placeholder="Type team name" className={`w-full pl-10 px-4 py-2 rounded-xl ${inputCls}`} />
                {teamResults.length > 0 && (
                  <div className={`absolute z-10 mt-1 max-h-48 overflow-y-auto w-full rounded-xl ${isDark ? 'bg-gray-900 border border-white/10' : 'bg-white border border-slate-200'} shadow-lg`}> 
                    {teamResults.slice(0, 12).map(t => (
                      <button key={t.idTeam || t.id} type="button" onClick={() => { setSelectedTeam(t); setTeamQuery(t.strTeam || t.strPlayer || ''); setTeamResults([]); }} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-500/10">
                        {(t.strTeam || t.strPlayer || 'Team')} <span className="opacity-60">{t.strLeague || ''}</span>
                      </button>
                    ))}
                    {searchingTeams && <div className="px-3 py-2 text-xs opacity-60">Searching...</div>}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <ArrowsRightLeftIcon className="w-8 h-8 text-cyan-300" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.keys(userMetrics).map(k => (
              <div key={k}>
                <label className={`block mb-2 ${heading}`}>{k.charAt(0).toUpperCase() + k.slice(1)}</label>
                <input type="number" value={userMetrics[k]} onChange={e => updateMetric(k, Number(e.target.value))} className={`w-full px-4 py-2 rounded-xl ${inputCls}`} />
              </div>
            ))}
            <div className="flex items-end">
              <button disabled={comparing} onClick={submitComparison} className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold py-2 rounded-xl shadow disabled:opacity-50">{comparing ? 'Comparing...' : 'Compare'}</button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className={tableHead}>
                  <th className="py-3">Metric</th>
                  <th className="py-3">Label</th>
                  <th className="py-3">{selectedTeam?.strTeam || 'Team / Context'}</th>
                </tr>
              </thead>
              <tbody>
                {loadingEvents && (
                  <tr><td colSpan={3} className="py-4 text-center text-xs opacity-60 animate-pulse">Loading events...</td></tr>
                )}
                {rows.map(r => (
                  <tr key={r.metric} className={`${rowBorder} ${isDark ? 'text-white/90' : 'text-slate-800'}`}>
                    <td className="py-3 font-medium">{r.metric}</td>
                    <td className="py-3">{r.left}</td>
                    <td className="py-3">{r.right}</td>
                  </tr>
                ))}
                {comparison && comparison.metrics.map(m => (
                  <tr key={m.metric} className={`${rowBorder} ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                    <td className="py-3 font-medium">{m.metric}</td>
                    <td className="py-3">{m.user_value}</td>
                    <td className="py-3">{m.player_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className={`${isDark ? 'text-emerald-300' : 'text-emerald-700'} flex items-center gap-2`}><BoltIcon className="w-5 h-5" /> Add more custom metrics soon</div>
            <div className={`${isDark ? 'text-cyan-300' : 'text-cyan-600'} flex items-center gap-2`}><TrophyIcon className="w-5 h-5" /> Comparison is illustrative only</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparePage;