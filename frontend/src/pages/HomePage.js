import React, { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  ChartBarIcon,
  TrophyIcon,
  FireIcon,
  MapPinIcon,
  ArrowRightIcon,
  PlusIcon,
  BoltIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const [currentTime, setCurrentTime] = useState(new Date());
  const [streak] = useState(0);
  const [todayStats] = useState({
    workouts: 0,
    calories: 0,
    distance: 0.0,
    time: 0
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const quickActions = [
    { title: "Log Workout", icon: PlusIcon, color: "from-emerald-500 to-teal-500", action: () => navigate('/log-workout') },
    { title: "Find Events", icon: CalendarIcon, color: "from-blue-500 to-cyan-500", action: () => navigate('/discover') },
    { title: "View Stats", icon: ChartBarIcon, color: "from-cyan-500 to-emerald-500", action: () => navigate('/mystats') },
    { title: "Leaderboards", icon: TrophyIcon, color: "from-indigo-500 to-blue-500", action: () => navigate('/leaderboards') }
  ];

  const upcomingEvents = [
    { title: "City Marathon", date: "Dec 15", location: "Central Park", participants: 2500, image: "🏃‍♀️" },
    { title: "Tennis Open", date: "Dec 18", location: "Sports Complex", participants: 64, image: "🎾" },
    { title: "Swimming Meet", date: "Dec 20", location: "Aquatic Center", participants: 128, image: "🏊‍♂️" }
  ];

  // Reusable surface classes
  const panel = isDark
    ? "bg-white/10 backdrop-blur-lg border border-white/20"
    : "bg-white border border-slate-200 shadow-sm";

  const subtleText = isDark ? "text-gray-300" : "text-slate-600";
  const heading = isDark ? "text-white" : "text-slate-900";

  return (
    <div className="min-h-screen bg-transparent p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-8 ${panel}`}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div>
              <h1 className={`text-4xl font-bold mb-2 ${heading}`}>
                Hi {user?.username || 'there'} — let’s get you moving
              </h1>
              <p className={`text-lg ${subtleText}`}>
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                {' • '}
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="flex items-center space-x-6 mt-4 lg:mt-0">
              <div className="text-center">
                <div className={`text-3xl font-bold ${heading}`}>{streak}</div>
                <div className={`text-xs uppercase tracking-wide ${subtleText}`}>Day Streak</div>
              </div>
              <div className="hidden sm:block w-px h-10 bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent" />
              <div className="flex gap-6">
                <div>
                  <div className={`text-sm ${subtleText}`}>Workouts</div>
                  <div className={`text-xl font-semibold ${heading}`}>{todayStats.workouts}</div>
                </div>
                <div>
                  <div className={`text-sm ${subtleText}`}>Calories</div>
                  <div className={`text-xl font-semibold ${heading}`}>{todayStats.calories}</div>
                </div>
                <div>
                  <div className={`text-sm ${subtleText}`}>Distance</div>
                  <div className={`text-xl font-semibold ${heading}`}>{todayStats.distance} km</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map(({ title, icon: Icon, color, action }) => (
            <button
              key={title}
              onClick={action}
              className={`group relative overflow-hidden rounded-2xl p-[2px] focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-70 group-hover:opacity-100 transition`} />
              <div className={`relative rounded-2xl h-full w-full p-5 flex flex-col justify-between
                ${isDark ? 'bg-slate-950/80' : 'bg-white'}
                border ${isDark ? 'border-white/10' : 'border-slate-200'}
              `}>
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${heading}`}>{title}</span>
                  <Icon className={`w-6 h-6 ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`} />
                </div>
                <div className="flex justify-end">
                  <ArrowRightIcon className={`w-5 h-5 opacity-0 group-hover:opacity-100 transition ${isDark ? 'text-emerald-200' : 'text-emerald-600'}`} />
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className={`rounded-2xl p-6 ${panel}`}>
            <h2 className={`text-xl font-semibold mb-4 ${heading}`}>Upcoming Events</h2>
            <div className="space-y-4">
              {upcomingEvents.map(ev => (
                <div
                  key={ev.title}
                  className={`flex items-center gap-4 rounded-xl p-4
                    ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200'}
                  `}
                >
                  <div className="text-3xl">{ev.image}</div>
                  <div className="flex-1">
                    <div className={`font-medium ${heading}`}>{ev.title}</div>
                    <div className={`text-xs ${subtleText}`}>
                      {ev.date} • {ev.location} • {ev.participants} ppl
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/discover')}
                    className="text-xs font-medium text-emerald-500 hover:text-emerald-400"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-2xl p-6 ${panel}`}>
            <h2 className={`text-xl font-semibold mb-4 ${heading}`}>Highlights</h2>
            <div className="grid gap-3">
              {[
                { icon: FireIcon, label: "Consistency", value: "0 days active this week" },
                { icon: BoltIcon, label: "Energy", value: "Log a workout to start tracking" },
                { icon: StarIcon, label: "Milestones", value: "No milestones yet" },
              ].map(h => (
                <div
                  key={h.label}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2
                    ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200'}
                  `}
                >
                  <h.icon className={`w-5 h-5 ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`} />
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${heading}`}>{h.label}</span>
                    <span className={`text-xs ${subtleText}`}>{h.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-2xl p-6 ${panel}`}>
            <h2 className={`text-xl font-semibold mb-4 ${heading}`}>Locations</h2>
            <div className="space-y-3">
              {[
                { name: "Central Park Loop", distance: "6.1 km", icon: "🛤️" },
                { name: "Riverside Sprint", distance: "3.4 km", icon: "🌊" },
                { name: "Gym District", distance: "Indoor", icon: "🏋️" },
              ].map(loc => (
                <div
                  key={loc.name}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2
                    ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200'}
                  `}
                >
                  <div className="text-xl">{loc.icon}</div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${heading}`}>{loc.name}</div>
                    <div className={`text-xs ${subtleText}`}>{loc.distance}</div>
                  </div>
                  <MapPinIcon className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-500'}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomePage;