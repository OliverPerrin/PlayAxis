import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';

export default function LogWorkoutPage() {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  // Style tokens
  const surface = isDark ? 'bg-white/10 border border-white/20' : 'bg-white border border-slate-200 shadow-sm';
  const card = isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const bodyText = isDark ? 'text-slate-300' : 'text-slate-600';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';
  const inputBase = isDark ? 'bg-white/10 border-white/20 placeholder-gray-400 text-white' : 'bg-white border-slate-300 placeholder-slate-400 text-slate-900';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className={`rounded-2xl p-6 ${surface}`}>
        <h1 className={`text-2xl font-bold mb-2 ${heading}`}>Log Workout</h1>
        <p className={`text-sm mb-4 ${bodyText}`}>
          Plan & record a training session. This form is a scaffold you can extend with sets, reps, distance, tempo, RPE, and notes.
        </p>

        {/* Basic scaffold form */}
        <form
          onSubmit={(e) => { e.preventDefault(); /* placeholder submit */ }}
          className="space-y-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-medium uppercase tracking-wide ${bodyText}`}>Workout Type</label>
              <select className={`rounded-xl px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${inputBase}`} defaultValue="run">
                <option value="run" className={isDark ? 'bg-slate-900' : 'bg-white'}>Run</option>
                <option value="cycle" className={isDark ? 'bg-slate-900' : 'bg-white'}>Cycle</option>
                <option value="swim" className={isDark ? 'bg-slate-900' : 'bg-white'}>Swim</option>
                <option value="strength" className={isDark ? 'bg-slate-900' : 'bg-white'}>Strength</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-medium uppercase tracking-wide ${bodyText}`}>Date</label>
              <input type="date" className={`rounded-xl px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${inputBase}`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-medium uppercase tracking-wide ${bodyText}`}>Duration (min)</label>
              <input type="number" min="0" placeholder="0" className={`rounded-xl px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${inputBase}`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-medium uppercase tracking-wide ${bodyText}`}>Distance (km)</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" className={`rounded-xl px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${inputBase}`} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium uppercase tracking-wide ${bodyText}`}>Notes</label>
            <textarea rows={4} placeholder="Intervals felt strong, keep cadence high..." className={`rounded-xl px-3 py-2 border text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500 ${inputBase}`} />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-semibold hover:shadow transition"
            >
              Save Workout
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Placeholder info card */}
        <div className={`mt-8 p-4 rounded-xl ${card}`}>
          <p className={`text-sm font-medium ${heading}`}>Roadmap</p>
          <p className={`text-xs mt-1 ${subText}`}>Upcoming: exercise library, set builder, effort (RPE), pace zones, and auto weather tag.</p>
        </div>
      </div>
    </div>
  );
}