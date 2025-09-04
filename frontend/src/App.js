import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { AnimatePresence } from 'framer-motion';

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

  const backgroundClasses = theme === 'dark'
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
    : 'bg-gradient-to-br from-slate-50 via-cyan-50 to-emerald-50';

  return (
    <div className={`min-h-screen transition-all duration-500 ${backgroundClasses}`}>
      {/* Soft blobs updated to greens/blues */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-6 -right-10 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-12 -left-10 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700" />
      </div>

      {user && (
        <>
          <Navbar setSidebarOpen={setSidebarOpen} theme={theme} setTheme={setTheme} />
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </>
      )}

      <main className={user ? "lg:pl-64 pt-16 relative z-10" : "relative z-10"}>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public */}
            <Route path="/landing" element={user ? <Navigate to="/" replace /> : <LandingPage />} />
            <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />

            {/* Protected */}
            <Route path="/" element={user ? <HomePage /> : <Navigate to="/landing" replace />} />
            <Route path="/discover" element={user ? <DiscoverPage /> : <Navigate to="/landing" replace />} />
            <Route path="/events" element={user ? <EventsPage /> : <Navigate to="/landing" replace />} />
            <Route path="/events/:id" element={user ? <EventDetailPage /> : <Navigate to="/landing" replace />} />
            <Route path="/stats" element={user ? <MyStatsPage /> : <Navigate to="/landing" replace />} />
            <Route path="/compare" element={user ? <ComparePage /> : <Navigate to="/landing" replace />} />
            <Route path="/leaderboards" element={user ? <LeaderboardsPage /> : <Navigate to="/landing" replace />} />
            <Route path="/community" element={user ? <CommunityPage /> : <Navigate to="/landing" replace />} />
            <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/landing" replace />} />
            <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/landing" replace />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
      </main>

      {user && <Footer />}
    </div>
  );
}

function App() {
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

export default App;