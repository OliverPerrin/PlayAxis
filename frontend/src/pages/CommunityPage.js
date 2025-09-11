import React, { useContext } from 'react';
import { UserGroupIcon, ChatBubbleLeftRightIcon, FireIcon } from '@heroicons/react/24/outline';
import { ThemeContext } from '../contexts/ThemeContext';

const CommunityPage = () => {
  const posts = [
    { id: 1, user: 'Alex', content: 'Crushed my interval session today! 🔥', likes: 24, comments: 6 },
    { id: 2, user: 'Sam', content: 'Anyone joining the City Marathon next week?', likes: 12, comments: 9 },
    { id: 3, user: 'Maya', content: 'Just hit a new 5K PR — 21:44!', likes: 31, comments: 11 },
  ];

  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const sub = isDark ? 'text-gray-300' : 'text-slate-600';
  const surface = isDark ? 'bg-white/10 border border-white/20' : 'bg-white border border-slate-200 shadow-sm';
  const postSurface = isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200';
  const meta = isDark ? 'text-gray-200' : 'text-slate-700';
  const muted = isDark ? 'text-gray-300' : 'text-slate-500';

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className={`text-4xl font-bold mb-2 ${heading}`}>Community</h1>
          <p className={sub}>Share your progress, ask questions, and find training buddies</p>
        </div>

        <div className={`${surface} rounded-2xl p-6`}>
          <div className={`flex items-center gap-2 mb-4 ${isDark ? 'text-cyan-300' : 'text-emerald-600'}`}>
            <UserGroupIcon className="w-6 h-6" /> <span>Latest Posts</span>
          </div>
          <div className="space-y-4">
            {posts.map(p => (
              <div key={p.id} className={`${postSurface} rounded-xl p-4`}>
                <div className={`font-semibold ${heading}`}>{p.user}</div>
                <div className={`${meta} mt-1`}>{p.content}</div>
                <div className={`flex items-center gap-4 mt-3 text-sm ${muted}`}>
                  <div className="flex items-center gap-1"><FireIcon className="w-4 h-4 text-amber-500" /> {p.likes}</div>
                  <div className="flex items-center gap-1"><ChatBubbleLeftRightIcon className="w-4 h-4" /> {p.comments}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;