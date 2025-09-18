import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function Header() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/v1/users/me', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (error) {
        console.error('Failed to fetch user', error);
      }
    };

    if (localStorage.getItem('token')) {
      fetchUser();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <header className="bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold text-gray-900"><Link to="/">MultiSportApp</Link></h1>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            <Link to="/leaderboards" className="hover:text-slate-900">Leaderboards</Link>
            <Link to="/matches" className="hover:text-slate-900">Matches</Link>
            <Link to="/compare" className="hover:text-slate-900">Compare</Link>
          </nav>
        </div>
        {user ? (
          <div className="flex items-center gap-4">
            <p className="text-sm">Hi, <Link to="/profile" className="text-blue-600 hover:underline font-semibold">{user.full_name}</Link></p>
            <button onClick={handleLogout} className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold py-2 px-4 rounded-lg shadow">
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-3 text-sm">
            <Link to="/login" className="text-blue-600 font-medium">Login</Link>
            <Link to="/signup" className="text-blue-600 font-medium">Sign Up</Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;