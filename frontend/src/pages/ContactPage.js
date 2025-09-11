import React, { useContext, useState } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { API_URL_OVERRIDE } from '../utils/constants';

// Simple helper to resolve API base (reuse logic if needed)
const getApiBase = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, '') + '/api/v1';
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return '/api/v1';
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')) {
    return '/api/v1';
  }
  const koyebAppName = 'raw-minne-multisportsandevents-7f82c207';
  return `https://${koyebAppName}.koyeb.app/api/v1`;
};

export default function ContactPage() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const apiBase = getApiBase();

  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [error, setError] = useState(null);

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
        {status === 'success' && (
          <div className={`mb-4 text-sm rounded-md px-4 py-2 border ${isDark ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>Message sent. Thanks for reaching out!</div>
        )}
        {status === 'error' && error && (
          <div className={`mb-4 text-sm rounded-md px-4 py-2 border ${isDark ? 'bg-red-500/10 border-red-400/30 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>{error}</div>
        )}
        <form onSubmit={async (e) => {
          e.preventDefault();
          setStatus('sending');
          setError(null);
          try {
            const res = await fetch(`${apiBase}/contact/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify(form)
            });
            if (!res.ok) {
              let msg = 'Failed to send.';
              try { const data = await res.json(); msg = data.detail || msg; } catch (_) {}
              throw new Error(msg);
            }
            setStatus('success');
            setForm({ name: '', email: '', message: '' });
          } catch (err) {
            setError(err.message);
            setStatus('error');
          }
        }} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-medium uppercase tracking-wide ${body}`}>Name</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={`rounded-xl px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${inputBase}`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-medium uppercase tracking-wide ${body}`}>Email</label>
              <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={`rounded-xl px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${inputBase}`} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium uppercase tracking-wide ${body}`}>Message</label>
            <textarea rows={4} required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className={`rounded-xl px-3 py-2 border text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500 ${inputBase}`} />
          </div>
          <button disabled={status==='sending'} type="submit" className={`inline-flex items-center px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:shadow transition bg-gradient-to-r from-emerald-600 to-cyan-600 disabled:opacity-60 disabled:cursor-not-allowed`}>
            {status==='sending' ? 'Sending...' : 'Send Message'}
          </button>
        </form>
        <p className={`text-xs mt-6 ${sub}`}>Messages are queued for delivery. Configure SMTP env vars to enable outbound email.</p>
      </div>
    </div>
  );
}
