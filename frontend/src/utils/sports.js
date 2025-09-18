// Utility to build a unified sports list (API + manual extras) with icons
// Each item: { key, label, icon }

const MANUAL_SPORTS = [
  { key: 'f1', label: 'F1', icon: '🏎️' },
  { key: 'skiing', label: 'Skiing', icon: '🎿' },
  { key: 'tennis', label: 'Tennis', icon: '🎾' },
  { key: 'golf', label: 'Golf', icon: '⛳' },
  { key: 'cricket', label: 'Cricket', icon: '🏏' },
  { key: 'rugby', label: 'Rugby', icon: '🏉' },
  { key: 'cycling', label: 'Cycling', icon: '🚴‍♂️' },
  { key: 'running', label: 'Running', icon: '🏃‍♂️' },
  { key: 'esports', label: 'Esports', icon: '🎮' },
];

// Basic icon mapping for common API sports (fallback medal)
const ICON_MAP = {
  soccer: '⚽',
  basketball: '🏀',
  baseball: '⚾',
  american_football: '🏈',
  ice_hockey: '🏒',
  hockey: '🏒',
  volleyball: '🏐',
  fighting: '🥊',
  boxing: '🥊',
  mma: '🥋',
  golf: '⛳',
  tennis: '🎾',
  cricket: '🏏',
  rugby: '🏉',
  cycling: '🚴‍♂️',
  athletics: '🏃‍♂️',
  running: '🏃‍♂️'
};

export function buildUnifiedSports(apiSports = []) {
  const base = (apiSports || []).map(s => {
    const raw = (s.strSport || '').trim();
    if (!raw) return null;
    const key = raw.toLowerCase().replace(/\s+/g, '_');
    return { key, label: raw, icon: ICON_MAP[key] || '🏅' };
  }).filter(Boolean);
  const merged = [...base];
  MANUAL_SPORTS.forEach(m => { if (!merged.some(x => x.key === m.key)) merged.push(m); });
  return merged.sort((a, b) => a.label.localeCompare(b.label));
}

export { MANUAL_SPORTS };
