import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import { Loading } from "./components/ui";
import HomePage from "./pages/HomePage";
import LocalEventsPage from "./pages/LocalEventsPage";
import CreateSessionPage from "./pages/CreateSessionPage";
import SavedPage from "./pages/SavedPage";
import GoalsPage from "./pages/GoalsPage";
import WatchPage from "./pages/WatchPage";
import ClubsPage, { ClubDetailPage } from "./pages/ClubsPage";
import DiscoverPage from "./pages/DiscoverPage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import EventsMapPage from "./pages/EventsMapPage";
import MatchesPage from "./pages/MatchesPage";
import LeaderboardsPage from "./pages/LeaderboardsPage";
import MyStatsPage from "./pages/MyStatsPage";
import LogWorkoutPage from "./pages/LogWorkoutPage";
import ComparePage from "./pages/ComparePage";
import CommunityPage from "./pages/CommunityPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";
import AboutPage from "./pages/AboutPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import ContactPage from "./pages/ContactPage";
import NotFoundPage from "./pages/NotFoundPage";
class PageBoundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <section className="panel empty-state" role="alert">
        <h2>This page needs another try.</h2>
        <p>Something unexpected happened while loading it.</p>
        <button
          className="button primary"
          onClick={() => window.location.reload()}
        >
          Reload page
        </button>
      </section>
    ) : (
      this.props.children
    );
  }
}
function Content() {
  const location = useLocation();
  const { user, loading } = useAuth();
  useEffect(() => {
    const titles = {
      "/": "Overview",
      "/local": "Local events",
      "/sessions/new": "Organise a session",
      "/saved": "Saved plans",
      "/goals": "My goals",
      "/watch": "Watch live",
      "/clubs": "Clubs & groups",
      "/discover": "Discover",
      "/events": "Events",
      "/map": "Places to play",
      "/matches": "Match centre",
      "/leaderboards": "Standings",
      "/mystats": "My activity",
      "/log-workout": "Log activity",
      "/compare": "Compare",
      "/community": "Community",
      "/settings": "Settings",
      "/profile": "My profile",
      "/auth": "Sign in",
      "/about": "About",
      "/privacy": "Privacy",
      "/terms": "Terms",
      "/contact": "Contact",
    };
    document.title = `${titles[location.pathname] || (location.pathname.startsWith("/events/") ? "Event details" : location.pathname.startsWith("/clubs/") ? "Club details" : "Page not found")} | PlayAxis`;
  }, [location.pathname]);
  return (
    <AppShell>
      <PageBoundary key={location.pathname}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/landing" element={<Navigate to="/" replace />} />
          <Route path="/local" element={<LocalEventsPage />} />
          <Route path="/sessions/new" element={<CreateSessionPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/watch" element={<WatchPage />} />
          <Route path="/clubs" element={<ClubsPage />} />
          <Route path="/clubs/:id" element={<ClubDetailPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/map" element={<EventsMapPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/leaderboards" element={<LeaderboardsPage />} />
          <Route path="/mystats" element={<MyStatsPage />} />
          <Route path="/log-workout" element={<LogWorkoutPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route
            path="/auth"
            element={
              loading ? (
                <Loading />
              ) : user ? (
                <Navigate to="/profile" replace />
              ) : (
                <AuthPage />
              )
            }
          />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </PageBoundary>
    </AppShell>
  );
}
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PreferencesProvider>
          <BrowserRouter>
            <Content />
          </BrowserRouter>
        </PreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
