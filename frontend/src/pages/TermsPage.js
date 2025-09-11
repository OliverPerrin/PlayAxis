import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export default function TermsPage() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const surface = isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const body = isDark ? 'text-slate-300' : 'text-slate-600';
  const sub = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className={`rounded-2xl p-6 border ${surface}`}>
        <h1 className={`text-2xl font-bold mb-3 ${heading}`}>Terms of Use</h1>
        <p className={`text-sm leading-relaxed ${body}`}>
          By using PlayAxis you agree to use the platform responsibly, comply with local regulations regarding wagering data, and respect community guidelines. Content and integrations are provided on a best-effort basis without warranty.
        </p>
        <ol className="mt-5 space-y-2 text-xs list-decimal pl-5">
          <li className={sub}>No automated scraping of internal APIs.</li>
          <li className={sub}>Don’t abuse rate-limited endpoints.</li>
          <li className={sub}>Respect other users—harassment results in suspension.</li>
          <li className={sub}>We may adjust or revoke features for security reasons.</li>
        </ol>
      </div>
    </div>
  );
}
