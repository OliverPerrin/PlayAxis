import React, { useEffect, useState } from 'react';
import { getSportsEvents, searchTeams, teamUpcomingEvents } from '../api';
import { useTheme } from '../contexts/ThemeContext';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import SportSelector from '../components/SportSelector';

const MatchesPage = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [sportKey, setSportKey] = useState('soccer');
  const [snapshot, setSnapshot] = useState({ upcoming: [], recent: [] });
  const [loading, setLoading] = useState(false);
  const [teamQuery, setTeamQuery] = useState('');
  const [teamResults, setTeamResults] = useState([]);
  const [teamUpcoming, setTeamUpcoming] = useState([]);
  const [searchingTeams, setSearchingTeams] = useState(false);

  // sport list handled in SportSelector

  useEffect(() => {
    setLoading(true);
    getSportsEvents(sportKey).then(s => { setSnapshot(s); setLoading(false); }).catch(() => setLoading(false));
  }, [sportKey]);

  useEffect(() => {
    if (teamQuery.trim().length < 2) { setTeamResults([]); return; }
    const h = setTimeout(() => {
      setSearchingTeams(true);
      searchTeams(teamQuery).then(r => { setTeamResults(r.players || []); setSearchingTeams(false); }).catch(() => setSearchingTeams(false));
    }, 350);
    return () => clearTimeout(h);
  }, [teamQuery]);

  const selectTeam = (t) => {
    setTeamQuery(t.strTeam || t.strPlayer || '');
    setTeamResults([]);
    if (t.idTeam) {
      teamUpcomingEvents(t.idTeam).then(res => setTeamUpcoming(res.upcoming || []));
    } else {
      setTeamUpcoming([]);
    }
  };

  const heading = isDark ? 'text-white' : 'text-slate-900';
  const surface = isDark ? 'bg-white/10 border-white/20' : 'bg-white border-slate-200 shadow-sm';
  const surfaceCls = `rounded-2xl p-4 border ${surface}`;

  const EventCard = ({ ev }) => (
    <div className={`rounded-xl p-3 text-sm flex flex-col gap-1 border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'} shadow-sm`}> 
      <div className="font-semibold">{ev.home_team} vs {ev.away_team}</div>
      <div className="opacity-70">{ev.date} {ev.time || ''}</div>
      <div className="opacity-60 text-xs">{ev.venue || ev.city || ev.league}</div>
      {ev.status && <div className="text-xs uppercase tracking-wide opacity-70">{ev.status}</div>}
    </div>
  );

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${heading}`}>Matches</h1>
            <p className={isDark ? 'text-gray-300' : 'text-slate-600'}>Browse upcoming and recent events across all sports.</p>
          </div>
          <div className="flex gap-3 items-start">
            <SportSelector value={sportKey} onChange={setSportKey} condensed />
            <div className="relative w-64">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 opacity-60" />
              <input value={teamQuery} onChange={e => setTeamQuery(e.target.value)} placeholder="Search team" className={`w-full pl-10 px-4 py-2 rounded-xl ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border border-slate-300 text-slate-900'}`} />
              {teamResults.length > 0 && (
                <div className={`absolute z-10 mt-1 max-h-56 overflow-y-auto w-full rounded-xl ${isDark ? 'bg-gray-900 border border-white/10' : 'bg-white border border-slate-200'} shadow-lg`}>
                  {teamResults.slice(0, 15).map(t => (
                    <button key={t.idTeam || t.id} type="button" onClick={() => selectTeam(t)} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-500/10">
                      {(t.strTeam || t.strPlayer || 'Team')} <span className="opacity-60">{t.strLeague || ''}</span>
                    </button>
                  ))}
                  {searchingTeams && <div className="px-3 py-2 text-xs opacity-60">Searching...</div>}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className={surfaceCls}>
            <h2 className={`font-semibold mb-3 ${heading}`}>Upcoming ({snapshot.upcoming.length})</h2>
            <div className="space-y-3">
              {loading && <div className="text-xs opacity-60 animate-pulse">Loading...</div>}
              {!loading && snapshot.upcoming.slice(0, 15).map(e => <EventCard key={e.id} ev={e} />)}
              {!loading && snapshot.upcoming.length === 0 && <div className="text-xs opacity-50">No upcoming events.</div>}
            </div>
          </div>
          <div className={surfaceCls}>
            <h2 className={`font-semibold mb-3 ${heading}`}>Recent ({snapshot.recent.length})</h2>
            <div className="space-y-3">
              {loading && <div className="text-xs opacity-60 animate-pulse">Loading...</div>}
              {!loading && snapshot.recent.slice(0, 15).map(e => <EventCard key={e.id} ev={e} />)}
              {!loading && snapshot.recent.length === 0 && <div className="text-xs opacity-50">No recent events.</div>}
            </div>
          </div>
          <div className={surfaceCls}>
            <h2 className={`font-semibold mb-3 ${heading}`}>Team Upcoming</h2>
            <div className="space-y-3">
              {teamUpcoming.map(e => <EventCard key={e.id} ev={e} />)}
              {teamUpcoming.length === 0 && <div className="text-xs opacity-50">Select a team to view.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchesPage;