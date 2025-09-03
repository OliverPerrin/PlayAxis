import React, { useState } from 'react';
import Calendar from '../components/Calendar';
import UserProfile from '../components/UserProfile';
import Weather from '../components/Weather';
import EventList from '../components/EventList';

const Dashboard = () => {
  const [selectedInterests, setSelectedInterests] = useState([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 mb-8 text-white">
          <h1 className="text-4xl font-bold mb-2">Welcome to Your Dashboard! 🎯</h1>
          <p className="text-lg opacity-90">Track your progress, discover events, and stay up to date with your interests.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <Calendar selectedInterests={selectedInterests} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Interests */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <UserProfile 
                selectedInterests={selectedInterests} 
                setSelectedInterests={setSelectedInterests} 
              />
            </div>

            {/* Weather */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <Weather />
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <span className="mr-2">📈</span>
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Events This Month</span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full font-semibold">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Active Sports</span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full font-semibold">{selectedInterests.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Progress Score</span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full font-semibold">85%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Events Section */}
        <div className="mt-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <EventList selectedInterests={selectedInterests} />
          </div>
        </div>

        {/* Activity Feed */}
        <div className="mt-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">⚡</span>
              Recent Activity
            </h2>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-blue-50 rounded-xl">
                <span className="text-2xl mr-4">🏃‍♂️</span>
                <div>
                  <p className="font-semibold text-gray-900">Completed 5K run</p>
                  <p className="text-sm text-gray-600">2 hours ago • Personal best: 22:15</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-green-50 rounded-xl">
                <span className="text-2xl mr-4">🎾</span>
                <div>
                  <p className="font-semibold text-gray-900">Joined tennis tournament</p>
                  <p className="text-sm text-gray-600">1 day ago • Central Park Courts</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-purple-50 rounded-xl">
                <span className="text-2xl mr-4">📊</span>
                <div>
                  <p className="font-semibold text-gray-900">Updated fitness goals</p>
                  <p className="text-sm text-gray-600">3 days ago • Marathon training plan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;