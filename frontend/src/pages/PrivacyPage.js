import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export default function PrivacyPage() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const surface = isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const body = isDark ? 'text-slate-300' : 'text-slate-600';
  const sub = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className={`rounded-2xl p-6 border ${surface}`}>
        <h1 className={`text-2xl font-bold mb-3 ${heading}`}>Privacy Policy</h1>
        <p className={`text-sm leading-relaxed ${body}`}>
          We collect only the data required to provide personalized event recommendations, leaderboard context, and account features. Third-party integrations (Eventbrite, Twitch, weather and odds providers) are scoped to the minimum permissions necessary.
        </p>
        <ul className="mt-5 space-y-3 text-xs list-disc pl-5">
          <li className={sub}>We never sell personal data.</li>
            <li className={sub}>OAuth tokens are encrypted at rest.</li>
            <li className={sub}>You can request deletion of your account at any time.</li>
            <li className={sub}>Anonymous analytics help improve feature relevance.</li>
        </ul>
      </div>
    </div>
  );
}
