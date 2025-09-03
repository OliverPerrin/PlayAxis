import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const featuredSports = [
    { name: 'Formula 1', emoji: '🏎️', color: 'from-red-500 to-red-600' },
    { name: 'Soccer', emoji: '⚽', color: 'from-green-500 to-green-600' },
    { name: 'Tennis', emoji: '🎾', color: 'from-yellow-400 to-yellow-500' },
    { name: 'American Football', emoji: '🏈', color: 'from-orange-500 to-orange-600' },
    { name: 'Esports', emoji: '🎮', color: 'from-purple-500 to-purple-600' },
    { name: 'Skiing', emoji: '⛷️', color: 'from-blue-400 to-blue-500' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-pulse">
              🏆 MultiSportApp
            </h1>
            <p className="text-xl md:text-2xl text-gray-100 mb-8 max-w-3xl mx-auto">
              Discover events, track your progress, and connect with the world of sports.
              From Formula 1 to esports, from hiking trails to tennis courts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard" className="bg-white text-purple-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg">
                Get Started 🚀
              </Link>
              <Link to="/events" className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-purple-600 transform hover:scale-105 transition-all duration-200">
                Explore Events 📅
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Sports */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Sports & Activities</h2>
            <p className="text-xl text-gray-600">Track your performance across multiple sports and discover new events</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {featuredSports.map((sport, index) => (
              <div key={index} className={`bg-gradient-to-br ${sport.color} rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl`}>
                <div className="text-4xl mb-3">{sport.emoji}</div>
                <h3 className="text-white font-semibold text-sm">{sport.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose MultiSportApp? 🌟</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Track Your Progress</h3>
              <p className="text-gray-600 text-lg">Monitor your performance across multiple sports and compare with professional athletes.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Discover Events</h3>
              <p className="text-gray-600 text-lg">Find sports events, concerts, and activities near you or matching your interests.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Connect & Compete</h3>
              <p className="text-gray-600 text-lg">Join a community of athletes and enthusiasts from around the world.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Start Your Journey? 🏃‍♂️</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of athletes already tracking their progress and discovering amazing events.
          </p>
          <Link to="/dashboard" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-12 py-4 rounded-full font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg">
            Start Now - It's Free! ✨
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;