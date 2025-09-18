import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence } from 'framer-motion';

// Layout
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import LoadingScreen from './components/common/LoadingScreen';

// Pages
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import DiscoverPage from './pages/DiscoverPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ContactPage from './pages/ContactPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import MyStatsPage from './pages/MyStatsPage';
import ComparePage from './pages/ComparePage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardsPage from './pages/LeaderboardsPage';
import MatchesPage from './pages/MatchesPage';
import CommunityPage from './pages/CommunityPage';
import SettingsPage from './pages/SettingsPage';
import AuthPage from './pages/AuthPage';
import LogWorkoutPage from './pages/LogWorkoutPage';
import EventsMapPage from './pages/EventsMapPage.jsx';
import NotFoundPage from './pages/NotFoundPage';

// Context
import { ThemeProvider, ThemeContext } from './contexts/ThemeContext';
import { UIProvider, UIContext } from './contexts/UIContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

function AppContent() {
  const { user, loading } = useAuth();
  const { theme } = useContext(ThemeContext);
  const { sidebarCollapsed, setSidebarOpen } = useContext(UIContext);
  const isDark = theme === 'dark';
  const [firstLoad, setFirstLoad] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const onLanding = location.pathname === '/landing';
  const showLayout = user && !onLanding;

  // Initial landing redirect (once per tab)
  useEffect(() => {
    if (!loading && firstLoad) {
      const alreadyVisited = sessionStorage.getItem('visitedOnce');
      if (!alreadyVisited && !onLanding) {
        sessionStorage.setItem('visitedOnce', '1');
        navigate('/landing', { replace: true });
      }
      const t = setTimeout(() => setFirstLoad(false), 600);
      return () => clearTimeout(t);
    }
  }, [loading, firstLoad, navigate, onLanding]);

  // Ensure sidebar closes when entering landing page
  useEffect(() => {
    if (onLanding) setSidebarOpen(false);
  }, [onLanding, setSidebarOpen]);

  // Dynamic document title per route
  useEffect(() => {
    const path = location.pathname;
    const titleFor = (p) => {
      if (p === '/' || p === '/home') return 'Home';
      if (p.startsWith('/events/')) return 'Event Details';
      if (p === '/events') return 'Events';
      if (p === '/discover') return 'Discover';
      if (p === '/map') return 'Map';
      if (p === '/leaderboards') return 'Leaderboards';
      if (p === '/mystats') return 'My Stats';
      if (p === '/compare') return 'Compare';
      if (p === '/community') return 'Community';
  if (p === '/settings') return 'Settings';
  if (p === '/about') return 'About';
  if (p === '/privacy') return 'Privacy';
  if (p === '/terms') return 'Terms';
  if (p === '/contact') return 'Contact';
      if (p === '/profile') return 'Profile';
      if (p === '/log-workout') return 'Log Workout';
      if (p === '/landing') return 'Welcome';
      if (p === '/auth') return 'Sign In';
      return 'PlayAxis';
    };
    const page = titleFor(path);
    document.title = page === 'PlayAxis' ? 'PlayAxis' : `PlayAxis — ${page}`;
  }, [location.pathname]);

  if (loading || firstLoad) return <LoadingScreen />;

  const backgroundClasses = isDark
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
    : 'bg-gradient-to-br from-white via-slate-50 to-emerald-50';

  // Adjust left padding only when layout is visible
  const mainLeftPad = showLayout
    ? sidebarCollapsed
      ? 'lg:pl-20'
      : 'lg:pl-64'
    : '';

  return (
    <div className={`min-h-screen transition-colors duration-500 ${backgroundClasses}`}>
      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute -top-6 -right-10 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute -bottom-12 -left-10 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700" />
          </>
        ) : (
          <>
            <div className="absolute -top-8 -right-12 w-72 h-72 bg-emerald-300 rounded-full blur-3xl opacity-10" />
            <div className="absolute -bottom-16 -left-14 w-80 h-80 bg-cyan-300 rounded-full blur-3xl opacity-10" />
          </>
        )}
      </div>

      {showLayout && (
        <>
          <Navbar />
          <Sidebar />
        </>
      )}

      <main className={`${mainLeftPad} pt-16 relative z-10`}>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public */}
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />

            {user ? (
              <>
                <Route path="/" element={<HomePage />} />
                <Route path="/map" element={<EventsMapPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/leaderboards" element={<LeaderboardsPage />} />
                <Route path="/matches" element={<MatchesPage />} />
                <Route path="/mystats" element={<MyStatsPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/log-workout" element={<LogWorkoutPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/contact" element={<ContactPage />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Navigate to="/landing" replace />} />
                <Route path="/map" element={<Navigate to="/landing" replace />} />
                <Route path="/events" element={<Navigate to="/landing" replace />} />
                <Route path="/events/:id" element={<Navigate to="/landing" replace />} />
                <Route path="/discover" element={<Navigate to="/landing" replace />} />
                <Route path="/leaderboards" element={<Navigate to="/landing" replace />} />
                <Route path="/matches" element={<Navigate to="/landing" replace />} />
                <Route path="/mystats" element={<Navigate to="/landing" replace />} />
                <Route path="/compare" element={<Navigate to="/landing" replace />} />
                <Route path="/community" element={<Navigate to="/landing" replace />} />
                <Route path="/settings" element={<Navigate to="/landing" replace />} />
                <Route path="/profile" element={<Navigate to="/landing" replace />} />
                <Route path="/log-workout" element={<Navigate to="/landing" replace />} />
                <Route path="/about" element={<Navigate to="/landing" replace />} />
                <Route path="/privacy" element={<Navigate to="/landing" replace />} />
                <Route path="/terms" element={<Navigate to="/landing" replace />} />
                <Route path="/contact" element={<Navigate to="/landing" replace />} />
              </>
            )}

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
      </main>

      {showLayout && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <UIProvider>
            <Router>
              <AppContent />
            </Router>
          </UIProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}