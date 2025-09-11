import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export default function AboutPage() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const surface = isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const body = isDark ? 'text-slate-300' : 'text-slate-600';
  const sub = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className={`rounded-2xl p-6 border ${surface}`}>
        <h1 className={`text-2xl font-bold mb-3 ${heading}`}>About PlayAxis</h1>
        <p className={`text-sm leading-relaxed ${body}`}>
          PlayAxis unifies event discovery, training metrics, esports engagement, real-world weather context, and betting market insights into a single multi-sport hub. Our goal is to help athletes and fans move seamlessly between preparing, competing, learning, and spectating.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className={`p-4 rounded-xl border ${surface}`}>
            <p className={`text-sm font-semibold ${heading}`}>What We Solve</p>
            <p className={`text-xs mt-1 ${sub}`}>Fragmented tools across training logs, event platforms, live streams, and odds boards.</p>
          </div>
          <div className={`p-4 rounded-xl border ${surface}`}>
            <p className={`text-sm font-semibold ${heading}`}>Vision</p>
            <p className={`text-xs mt-1 ${sub}`}>A contextual sport layer that adapts to what you watch, plan, and perform.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
