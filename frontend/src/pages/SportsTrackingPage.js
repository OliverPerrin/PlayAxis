import React, { useState } from 'react';

const SportsTrackingPage = () => {
  const [selectedSport, setSelectedSport] = useState('running');

  const sports = [
    { id: 'running', name: 'Running', emoji: '🏃‍♂️', color: 'from-green-400 to-green-600' },
    { id: 'cycling', name: 'Cycling', emoji: '🚴‍♂️', color: 'from-blue-400 to-blue-600' },
    { id: 'swimming', name: 'Swimming', emoji: '🏊‍♂️', color: 'from-cyan-400 to-cyan-600' },
    { id: 'tennis', name: 'Tennis', emoji: '🎾', color: 'from-yellow-400 to-yellow-600' },
    { id: 'soccer', name: 'Soccer', emoji: '⚽', color: 'from-orange-400 to-orange-600' },
    { id: 'basketball', name: 'Basketball', emoji: '🏀', color: 'from-red-400 to-red-600' },
  ];

  const statsData = {
    running: {
      totalDistance: '245.8 km',
      totalTime: '32h 15m',
      avgPace: '5:23 min/km',
      personalBest: '21:15 (5K)',
      activities: 28,
      calories: 12450
    },
    cycling: {
      totalDistance: '892.3 km',
      totalTime: '45h 32m',
      avgSpeed: '19.6 km/h',
      personalBest: '2:45:30 (100K)',
      activities: 15,
      calories: 22100
    },
    swimming: {
      totalDistance: '45.2 km',
      totalTime: '28h 45m',
      avgPace: '2:15 min/100m',
      personalBest: '1:35:20 (1.5K)',
      activities: 22,
      calories: 8900
    },
    tennis: {
      totalMatches: 24,
      totalTime: '36h 20m',
      winRate: '67%',
      personalBest: 'Beat club champion',
      activities: 24,
      calories: 7200
    }
  };

  const recentActivities = [
    { date: '2024-01-15', sport: 'Running', duration: '45m', distance: '8.5 km', emoji: '🏃‍♂️' },
    { date: '2024-01-13', sport: 'Tennis', duration: '1h 30m', details: 'Won 6-4, 6-2', emoji: '🎾' },
    { date: '2024-01-12', sport: 'Cycling', duration: '2h 15m', distance: '42 km', emoji: '🚴‍♂️' },
    { date: '2024-01-10', sport: 'Swimming', duration: '55m', distance: '2.5 km', emoji: '🏊‍♂️' },
    { date: '2024-01-08', sport: 'Running', duration: '35m', distance: '6.2 km', emoji: '🏃‍♂️' },
  ];

  const currentSport = sports.find(sport => sport.id === selectedSport);
  const currentStats = statsData[selectedSport];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Sports Tracking 📊
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Monitor your athletic performance, track progress, and compare with professional standards.
          </p>
        </div>

        {/* Sport Selection */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Choose Your Sport 🎯</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {sports.map(sport => (
              <button
                key={sport.id}
                onClick={() => setSelectedSport(sport.id)}
                className={`p-4 rounded-2xl text-center transition-all duration-200 transform hover:scale-105 ${
                  selectedSport === sport.id
                    ? `bg-gradient-to-br ${sport.color} text-white shadow-lg`
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <div className="text-3xl mb-2">{sport.emoji}</div>
                <div className="font-semibold text-sm">{sport.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats Overview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex items-center mb-6">
                <span className="text-4xl mr-4">{currentSport?.emoji}</span>
                <h2 className="text-3xl font-bold text-gray-900">{currentSport?.name} Stats</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {Object.entries(currentStats || {}).map(([key, value]) => (
                  <div key={key} className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
                    <div className="text-sm text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Charts */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="mr-2">📈</span>
                Performance Trends
              </h3>
              
              {/* Mock Chart */}
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-8 text-center">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-700 text-lg">Interactive charts and analytics coming soon!</p>
                <p className="text-gray-600 mt-2">Track your improvements over time with detailed visualizations.</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">⚡</span>
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center space-x-2">
                  <span>➕</span>
                  <span>Log Activity</span>
                </button>
                <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2">
                  <span>🎯</span>
                  <span>Set Goal</span>
                </button>
                <button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2">
                  <span>🏆</span>
                  <span>Compare with Pros</span>
                </button>
              </div>
            </div>

            {/* Goals */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🎯</span>
                Current Goals
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-green-800">Run 300km this month</span>
                    <span className="text-green-600 font-bold">82%</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full w-4/5"></div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-blue-800">Sub-21 min 5K</span>
                    <span className="text-blue-600 font-bold">65%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full w-3/5"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pro Comparison */}
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <span className="mr-2">🏆</span>
                Pro Comparison
              </h3>
              <div className="space-y-3">
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-sm opacity-90 mb-1">Marathon World Record</div>
                  <div className="font-bold">2:01:09 (Kipchoge)</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-sm opacity-90 mb-1">Your Marathon PB</div>
                  <div className="font-bold">Target: Sub-3:00</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-sm opacity-90 mb-1">Gap to Elite</div>
                  <div className="font-bold">48% faster needed</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="mt-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">📅</span>
              Recent Activities
            </h2>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                  <span className="text-3xl mr-4">{activity.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-gray-900">{activity.sport}</h4>
                      <span className="text-sm text-gray-500">{activity.date}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {activity.duration} • {activity.distance || activity.details}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-500 hover:text-blue-700 font-medium text-sm">View</button>
                    <button className="text-green-500 hover:text-green-700 font-medium text-sm">Share</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SportsTrackingPage;