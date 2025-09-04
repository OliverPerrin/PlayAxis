import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PencilSquareIcon, ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const ProfilePage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Profile</h1>
            <p className="text-gray-300">Manage your account and preferences</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white inline-flex items-center gap-2"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Sign out
          </button>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
            <UserCircleIcon className="w-14 h-14 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-white text-xl font-semibold">{user?.username || 'User'}</div>
            <div className="text-gray-300">{user?.email || 'email@domain.com'}</div>
          </div>
          <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white inline-flex items-center gap-2">
            <PencilSquareIcon className="w-5 h-5" />
            Edit
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="text-white font-semibold mb-2">Preferences</div>
            <div className="text-gray-300 text-sm">Sport interests, units, notifications</div>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="text-white font-semibold mb-2">Connected Apps</div>
            <div className="text-gray-300 text-sm">Connect Strava, Garmin, Twitch</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;