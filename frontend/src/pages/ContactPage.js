import React, { useContext, useState } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export default function ContactPage() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [useInline, setUseInline] = useState(true); // try an in-browser compose (Gmail) before full client

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
        {sent && (
          <div className={`mb-4 text-sm rounded-md px-4 py-2 border ${isDark ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>Opening your email client… You can edit & send there. Thanks!</div>
        )}
        <form onSubmit={(e) => {
          e.preventDefault();
          const { name, email, subject, message } = form;
          const body = `Name: ${name}\nEmail: ${email}\nMessage: ${message}`;
          if (useInline) {
            // Try opening a centered popup using Gmail compose URL (works if user logged into Gmail)
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent('oliver.t.perrin@gmail.com')}&su=${encodeURIComponent(subject || 'Contact from PlayAxis')}&body=${encodeURIComponent(body)}`;
            const w = 720; const h = 640;
            const left = window.screenX + (window.outerWidth - w) / 2;
            const top = window.screenY + (window.outerHeight - h) / 2;
            const popup = window.open(gmailUrl, 'composeWindow', `width=${w},height=${h},left=${left},top=${top},noopener,noreferrer`);
            if (!popup) {
              // Popup blocked: fallback to mailto
              const mailto = `mailto:oliver.t.perrin@gmail.com?subject=${encodeURIComponent(subject || 'Contact from PlayAxis')}&body=${encodeURIComponent(body)}`;
              window.location.href = mailto;
            }
          } else {
            const mailto = `mailto:oliver.t.perrin@gmail.com?subject=${encodeURIComponent(subject || 'Contact from PlayAxis')}&body=${encodeURIComponent(body)}`;
            window.location.href = mailto;
          }
          setSent(true);
          // Soft reset after brief delay so user can re-open if needed
          setTimeout(() => setForm({ name: '', email: '', subject: '', message: '' }), 400);
        }} className="space-y-4" id="contactForm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-medium uppercase tracking-wide ${body}`}>Name</label>
              <input id="name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={`rounded-xl px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${inputBase}`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-medium uppercase tracking-wide ${body}`}>Email</label>
              <input id="email" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={`rounded-xl px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${inputBase}`} />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className={`text-xs font-medium uppercase tracking-wide ${body}`}>Subject</label>
              <input id="subject" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Feature request, feedback, etc." className={`rounded-xl px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${inputBase}`} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium uppercase tracking-wide ${body}`}>Message</label>
            <textarea id="message" rows={4} required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className={`rounded-xl px-3 py-2 border text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500 ${inputBase}`} />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button type="submit" className={`inline-flex items-center px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:shadow transition bg-gradient-to-r from-emerald-600 to-cyan-600`}>
              {useInline ? 'Compose in Popup' : 'Open Email Client'}
            </button>
            <button type="button" onClick={() => setUseInline(u => !u)} className={`px-4 py-2 rounded-xl text-sm font-medium border ${isDark ? 'border-white/20 text-slate-200 hover:bg-white/10' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}>
              {useInline ? 'Use Mail App Instead' : 'Use Gmail Popup'}
            </button>
          </div>
        </form>
        <p className={`text-xs mt-6 ${sub}`}>
          {useInline
            ? 'We try a Gmail popup first; if blocked or not logged in, switch modes or allow popups.'
            : 'Using a standard mailto link will launch your system mail handler.'}
        </p>
      </div>
    </div>
  );
}
