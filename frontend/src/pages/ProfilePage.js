import React, { useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      // Clear visited flag so next load shows landing again
      sessionStorage.removeItem('visitedOnce');
      navigate('/landing', { replace: true });
    }
  };

  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const surface = isDark ? 'bg-white/10 border border-white/20' : 'bg-white border border-slate-200 shadow-sm';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const label = isDark ? 'text-gray-300' : 'text-slate-700';
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className={`rounded-2xl p-6 ${surface}`}>
        <h1 className={`text-2xl font-bold mb-4 ${heading}`}>Profile</h1>
        <div className="space-y-2 text-sm">
          <div className={label}>
            <strong>Username:</strong> {user?.username}
          </div>
          <div className={label}>
            <strong>Email:</strong> {user?.email}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-6 inline-flex items-center px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-500"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;