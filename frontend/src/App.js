import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from 'framer-motion';

// Layout Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';

// Pages
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import MyStatsPage from './pages/MyStatsPage';
import ComparePage from './pages/ComparePage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardsPage from './pages/LeaderboardsPage';
import AuthPage from './pages/AuthPage';

// Context
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Hooks
import { useLocalStorage } from './hooks/UseLocalStorage';

function AppContent() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useLocalStorage('theme', 'dark');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-white border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {user && (
        <>
          <Navbar setSidebarOpen={setSidebarOpen} theme={theme} setTheme={setTheme} />
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </>
      )}
      
      <main className={user ? "lg:pl-64 pt-16" : ""}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/auth" element={
              user ? <Navigate to="/" replace /> : <AuthPage />
            } />
            <Route path="/" element={
              user ? <HomePage /> : <Navigate to="/auth" replace />
            } />
            <Route path="/events" element={
              user ? <EventsPage /> : <Navigate to="/auth" replace />
            } />
            <Route path="/stats" element={
              user ? <MyStatsPage /> : <Navigate to="/auth" replace />
            } />
            <Route path="/compare" element={
              user ? <ComparePage /> : <Navigate to="/auth" replace />
            } />
            <Route path="/profile" element={
              user ? <ProfilePage /> : <Navigate to="/auth" replace />
            } />
            <Route path="/leaderboards" element={
              user ? <LeaderboardsPage /> : <Navigate to="/auth" replace />
            } />
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
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;