
import React, { useEffect, useState } from 'react';
import UserProfile from './UserProfile';

function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [fullName, setFullName] = useState('');

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
          setFullName(data.full_name || '');
          setSelectedInterests(data.interests.map(i => i.name));
        } else {
          setError('Failed to fetch user');
        }
      } catch (error) {
        setError(error.message);
      }
    };

    if (localStorage.getItem('token')) {
      fetchUser();
    }
  }, []);

  const handleFullNameChange = async () => {
    try {
      const response = await fetch('/api/v1/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ full_name: fullName }),
      });
      if (!response.ok) {
        throw new Error('Failed to update full name');
      }
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Error updating full name:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">👤</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Profile</h1>
          <p className="text-xl text-gray-600">Manage your account settings and preferences</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 text-center">
            <span className="text-red-600 font-medium">{error}</span>
          </div>
        )}

        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="mr-3">📝</span>
                  Personal Information
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="full-name">
                      Full Name
                    </label>
                    <input
                      id="full-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onBlur={handleFullNameChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8">
                <UserProfile selectedInterests={selectedInterests} setSelectedInterests={setSelectedInterests} />
              </div>
            </div>

            {/* Profile Stats Sidebar */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <span className="mr-2">🏆</span>
                  Profile Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Member Since</span>
                    <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full font-semibold">
                      2024
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active Sports</span>
                    <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full font-semibold">
                      {selectedInterests.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Profile Complete</span>
                    <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full font-semibold">
                      85%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🎯</span>
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200">
                    Update Goals
                  </button>
                  <button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-200">
                    Privacy Settings
                  </button>
                  <button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200">
                    Export Data
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <span className="mr-2">🌟</span>
                  Achievements
                </h3>
                <div className="space-y-2">
                  <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">🥇</div>
                    <div className="text-sm font-semibold">First Month</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">🏃‍♂️</div>
                    <div className="text-sm font-semibold">Sports Explorer</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">📊</div>
                    <div className="text-sm font-semibold">Data Tracker</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
