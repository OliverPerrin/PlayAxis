import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { listSports } from '../api';
import { TrophyIcon } from '@heroicons/react/24/outline';
import { buildUnifiedSports } from '../utils/sports';

const fetchStandings = async (sportKey) => {
  try {
    const base = (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/$/, '') : '') + '/api/v1';
    let url = '/api/v1';
    if (typeof window !== 'undefined') {
      // rely on same-origin proxy for local / netlify
      url = '/api/v1';
    } else if (base) {
      url = base;
    }
    const res = await fetch(`${url}/sports/${encodeURIComponent(sportKey)}/standings`);
    if (!res.ok) throw new Error('Failed');
    return res.json();
  } catch (e) {
    return { sport: sportKey, league_id: null, tables: [] };
  }
};

const LeaderboardsPage = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [sports, setSports] = useState([]);
  const [selectedSport, setSelectedSport] = useState('soccer');
  const [data, setData] = useState({ tables: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    listSports().then(d => { if (active && d && Array.isArray(d.sports)) setSports(d.sports); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchStandings(selectedSport).then(r => { if (active) setData(r || { tables: [] }); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedSport]);

  const heading = isDark ? 'text-white' : 'text-slate-900';
  const sub = isDark ? 'text-gray-300' : 'text-slate-600';
  const surface = isDark ? 'bg-white/10 border border-white/20 backdrop-blur-sm' : 'bg-white border border-slate-200 shadow-sm';
  const surfaceCls = `${surface} rounded-2xl`;
  const tableHead = isDark ? 'bg-white/10 text-gray-200' : 'bg-slate-100 text-slate-700';
  const rowBorder = isDark ? 'border-t border-white/10' : 'border-t border-slate-200';
  const cellBase = 'py-2.5 px-3 whitespace-nowrap align-middle';
  const zebraDark = 'odd:bg-white/0 even:bg-white/[0.03] hover:bg-white/10';
  const zebraLight = 'odd:bg-white even:bg-slate-50 hover:bg-emerald-50/60';

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${heading}`}>Standings</h1>
            <p className={sub}>Multi-sport standings: league tables, championships & placeholders where data is pending.</p>
          </div>
          <div className="flex flex-wrap gap-2 max-w-3xl justify-end">
            {buildUnifiedSports(sports).map(sp => {
              const active = sp.key === selectedSport;
              return (
                <button
                  key={sp.key}
                  type="button"
                  onClick={() => setSelectedSport(sp.key)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition border
                    ${active ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white border-transparent shadow' : (isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300' : 'bg-white border-slate-200 hover:border-emerald-400 hover:text-emerald-700')}`}
                >
                  <span>{sp.icon}</span>
                  <span>{sp.label}</span>
                </button>
              );
            })}
          </div>
        </div>

  {loading && <div className={`${sub} flex items-center gap-2 text-sm md:text-base`}><TrophyIcon className="w-5 h-5" /> Loading standings...</div>}
        {!loading && data.tables && data.tables.length === 0 && (
          <div className={`${surfaceCls} p-6 text-sm ${sub}`}>No standings available for this sport yet.</div>
        )}

        {!loading && data.tables && data.tables.map(tbl => {
          const empty = tbl.rows.length === 0;
          const rows = empty ? [{ __placeholder: true }] : tbl.rows;
          return (
            <div key={tbl.kind} className={`${surfaceCls} p-6 space-y-4`}> 
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className={`text-xl md:text-2xl font-semibold tracking-wide ${heading}`}>{tbl.name}</h2>
                <span className={`text-[10px] md:text-xs uppercase tracking-wide ${sub}`}>{tbl.kind}</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-transparent">
                <table className="w-full text-left text-[13px] md:text-sm lg:text-base">
                  <thead className={`${tableHead} sticky top-0 z-10 text-xs md:text-sm lg:text-base`}> 
                    <tr>
                      {tbl.columns.map(col => (
                        <th key={col} className="py-2.5 px-3 font-semibold tracking-wide first:rounded-tl-xl last:rounded-tr-xl">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`${isDark ? zebraDark : zebraLight} text-[13px] md:text-sm`}>
                    {rows.map((r, idx) => (
                      <tr key={idx} className={`${rowBorder} transition-colors`}>
                        {tbl.columns.map(col => {
                          if (r.__placeholder) {
                            return idx === 0 ? (
                              <td key={col} colSpan={tbl.columns.length} className={`${cellBase} text-center text-xs md:text-sm italic opacity-70`}>Data updating – check back soon.</td>
                            ) : null;
                          }
                          const val = r[col] !== undefined ? r[col] : (r[col.toLowerCase()] || r[col.replace(/ /g,'_').toLowerCase()] || '');
                          return <td key={col} className={`${cellBase} text-slate-800 dark:text-gray-100`}>{val}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeaderboardsPage;