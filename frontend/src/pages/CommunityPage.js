import React from 'react';
import { UserGroupIcon, ChatBubbleLeftRightIcon, FireIcon } from '@heroicons/react/24/outline';

const CommunityPage = () => {
  const posts = [
    { id: 1, user: 'Alex', content: 'Crushed my interval session today! 🔥', likes: 24, comments: 6 },
    { id: 2, user: 'Sam', content: 'Anyone joining the City Marathon next week?', likes: 12, comments: 9 },
    { id: 3, user: 'Maya', content: 'Just hit a new 5K PR — 21:44!', likes: 31, comments: 11 },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Community</h1>
          <p className="text-gray-300">Share your progress, ask questions, and find training buddies</p>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-cyan-300 mb-4">
            <UserGroupIcon className="w-6 h-6" /> <span>Latest Posts</span>
          </div>
          <div className="space-y-4">
            {posts.map(p => (
              <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-white font-semibold">{p.user}</div>
                <div className="text-gray-200 mt-1">{p.content}</div>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-300">
                  <div className="flex items-center gap-1"><FireIcon className="w-4 h-4 text-amber-400" /> {p.likes}</div>
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