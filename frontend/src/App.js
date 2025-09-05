import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { AnimatePresence } from 'framer-motion';
import EventsMapPage from './pages/EventsMapPage.jsx';

// Layout Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import LoadingScreen from './components/common/LoadingScreen';

// Pages
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import DiscoverPage from './pages/DiscoverPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import MyStatsPage from './pages/MyStatsPage';
import ComparePage from './pages/ComparePage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardsPage from './pages/LeaderboardsPage';
import CommunityPage from './pages/CommunityPage';
import SettingsPage from './pages/SettingsPage';
import AuthPage from './pages/AuthPage';
import NotFoundPage from './pages/NotFoundPage';
import LogWorkoutPage from './pages/LogWorkoutPage.jsx';

// Context
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Hooks
import { useLocalStorage } from './hooks/UseLocalStorage';

function AppContent() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useLocalStorage('theme', 'dark');
  const [firstLoad, setFirstLoad] = useState(true);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setFirstLoad(false), 600);
      return () => clearTimeout(t);
    }
  }, [loading]);

  if (loading || firstLoad) {
    return <LoadingScreen />;
  }

  const isDark = theme === 'dark';
  const backgroundClasses = isDark
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
    : 'bg-gradient-to-br from-white via-slate-50 to-emerald-50';

  return (
    <div className={`min-h-screen transition-colors duration-500 ${backgroundClasses}`}>
      {/* Decorative blobs (dimmer or removed in light mode) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute -top-6 -right-10 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute -bottom-12 -left-10 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700" />
          </>
        ) : (
          <>
            <div className="absolute -top-8 -right-12 w-72 h-72 bg-emerald-300 rounded-full mix-blend-normal blur-3xl opacity-10" />
            <div className="absolute -bottom-16 -left-14 w-80 h-80 bg-cyan-300 rounded-full mix-blend-normal blur-3xl opacity-10" />
          </>
        )}
      </div>

      {user && (
        <>
          <Navbar
            setSidebarOpen={setSidebarOpen}
            theme={theme}
            setTheme={setTheme}
          />
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            theme={theme}
          />
        </>
      )}

      <main className={user ? "lg:pl-64 pt-16 relative z-10" : "relative z-10"}>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public */}
            <Route path="/landing" element={user ? <Navigate to="/" replace /> : <LandingPage />} />
            <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />

            {/* Protected */}
            <Route path="/" element={<HomePage />} />
            <Route path="/map" element={<EventsMapPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/leaderboards" element={<LeaderboardsPage />} />
            <Route path="/mystats" element={<MyStatsPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/log-workout" element={<LogWorkoutPage />} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
      </main>

      {user && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <AppContent />
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}