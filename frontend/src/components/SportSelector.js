import React, { useEffect, useState, useMemo } from 'react';
import { listSports } from '../api';
import { useTheme } from '../contexts/ThemeContext';
import { buildUnifiedSports } from '../utils/sports';

// Reusable pill-based sport selector
// Props: value (string), onChange (fn), className (optional), condensed (bool)
const SportSelector = ({ value, onChange, className = '', condensed = false }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [apiSports, setApiSports] = useState([]);

  useEffect(() => {
    let active = true;
    listSports().then(d => { if (active && d && Array.isArray(d.sports)) setApiSports(d.sports); });
    return () => { active = false; };
  }, []);

  const sports = useMemo(() => buildUnifiedSports(apiSports), [apiSports]);

  // Auto-select default if current value not present
  useEffect(() => {
    if (sports.length > 0 && !sports.some(s => s.key === value)) {
      onChange(sports[0].key);
    }
  }, [sports, value, onChange]);

  return (
    <div className={`flex gap-2 flex-wrap ${condensed ? 'max-w-full' : 'max-w-4xl'} ${className}`}> 
      {sports.map(sp => {
        const active = sp.key === value;
        return (
          <button
            key={sp.key}
            type="button"
            onClick={() => onChange(sp.key)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-2 transition border
              ${active ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white border-transparent shadow' : (isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300' : 'bg-white border-slate-200 hover:border-emerald-400 hover:text-emerald-700')}`}
            aria-pressed={active}
          >
            <span>{sp.icon}</span>
            <span>{sp.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default SportSelector;
