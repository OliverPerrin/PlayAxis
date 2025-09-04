import React, { useState } from 'react';
import { ArrowsRightLeftIcon, TrophyIcon, BoltIcon } from '@heroicons/react/24/outline';

const ComparePage = () => {
  const [left, setLeft] = useState('You');
  const [right, setRight] = useState('Pro Athlete');

  const rows = [
    { metric: '5K Time', left: '24:30', right: '13:00' },
    { metric: '10K Time', left: '52:10', right: '27:10' },
    { metric: 'Half Marathon', left: '1:58:42', right: '58:01' },
    { metric: 'VO2 Max', left: '48', right: '80' },
    { metric: 'Weekly Distance', left: '35 km', right: '160 km' },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-6">Compare Performance</h1>

        <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-white mb-2">Left</label>
              <input value={left} onChange={e => setLeft(e.target.value)} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white" />
            </div>
            <div className="flex items-center justify-center">
              <ArrowsRightLeftIcon className="w-8 h-8 text-cyan-300" />
            </div>
            <div>
              <label className="block text-white mb-2">Right</label>
              <input value={right} onChange={e => setRight(e.target.value)} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white" />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-300">
                  <th className="py-3">Metric</th>
                  <th className="py-3">{left}</th>
                  <th className="py-3">{right}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.metric} className="text-white/90 border-t border-white/10">
                    <td className="py-3">{r.metric}</td>
                    <td className="py-3">{r.left}</td>
                    <td className="py-3">{r.right}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex gap-4">
            <div className="flex items-center gap-2 text-emerald-300"><BoltIcon className="w-5 h-5" /> Strength: Speed Workouts</div>
            <div className="flex items-center gap-2 text-cyan-300"><TrophyIcon className="w-5 h-5" /> Target: New 10K PR</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparePage;