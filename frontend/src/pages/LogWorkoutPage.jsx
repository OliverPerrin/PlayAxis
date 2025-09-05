import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LogWorkoutPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="rounded-2xl p-6 border
        dark:bg-white/5 dark:border-white/10
        bg-white border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold dark:text-white text-slate-900 mb-2">Log Workout</h1>
        <p className="text-sm dark:text-slate-300 text-slate-600 mb-4">
          This is a placeholder. Build the workout logging form here (exercises, sets, reps, weights, notes).
        </p>

        <div className="grid gap-4">
          <div className="p-4 rounded-lg border
            dark:border-white/10 dark:bg-white/5
            bg-slate-50 border-slate-200">
            <p className="text-sm font-medium dark:text-white text-slate-800">
              Coming soon
            </p>
            <p className="text-xs dark:text-slate-400 text-slate-500 mt-1">
              Add fields for routine selection, exercise entries, and submission.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="mt-6 inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
            bg-emerald-600 text-white hover:bg-emerald-500 transition"
        >
          Back Home
        </button>
      </div>
    </div>
  );
}