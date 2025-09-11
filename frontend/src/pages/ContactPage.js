import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export default function ContactPage() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const surface = isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const body = isDark ? 'text-slate-300' : 'text-slate-600';
  const sub = isDark ? 'text-slate-400' : 'text-slate-500';
  const inputBase = isDark ? 'bg-white/10 border-white/20 placeholder-slate-400 text-white' : 'bg-white border-slate-300 placeholder-slate-400 text-slate-900';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className={`rounded-2xl p-6 border ${surface}`}>
        <h1 className={`text-2xl font-bold mb-3 ${heading}`}>Contact</h1>
        <p className={`text-sm leading-relaxed mb-6 ${body}`}>Have feedback, partnership interest, or a feature request? Reach out below.</p>
        <form onSubmit={(e) => { e.preventDefault(); /* placeholder */ }} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-medium uppercase tracking-wide ${body}`}>Name</label>
              <input required className={`rounded-xl px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${inputBase}`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-medium uppercase tracking-wide ${body}`}>Email</label>
              <input type="email" required className={`rounded-xl px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${inputBase}`} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium uppercase tracking-wide ${body}`}>Message</label>
            <textarea rows={4} required className={`rounded-xl px-3 py-2 border text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500 ${inputBase}`} />
          </div>
          <button type="submit" className="inline-flex items-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-semibold hover:shadow transition">Send Message</button>
        </form>
        <p className={`text-xs mt-6 ${sub}`}>Form is non-functional in this prototype build. Wire to backend or email service as needed.</p>
      </div>
    </div>
  );
}
