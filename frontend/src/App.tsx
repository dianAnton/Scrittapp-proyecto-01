import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "./Layout";
import Dashboard from "./pages/Dashboard";
import GoalsView from "./pages/GoalsView";
import GoalDetail from "./pages/GoalDetail";
import HabitsView from "./pages/HabitsView";
import HabitDetail from "./pages/HabitDetail";
import JournalView from "./pages/JournalView";
import CalendarView from "./pages/CalendarView";

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  .font-inter { font-family: 'Inter', sans-serif; }
  .font-sf { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }

  :root {
    --bg-cream: #F3EFE0; /* Even warmer bone/cream color */
    --text-dark: #2A1D11;
    --accent-color: #F97316; /* Default orange, but will be overridden */
  }

  /* Accent Color Application */
  .text-accent { color: var(--accent-color) !important; }
  .bg-accent { background-color: var(--accent-color) !important; }
  .border-accent { border-color: var(--accent-color) !important; }
  .shadow-accent { shadow-color: var(--accent-color) !important; }
  .ring-accent { --tw-ring-color: var(--accent-color) !important; }

  /* BASE STYLES - DARK MODE DEFAULT */
  body {
    background-color: #0d0d0d;
    color: white;
    transition: background-color 0.3s ease;
  }

  /* PROTECT HERO & LANDING - ALWAYS DARK & COLOR ACCURATE */
  .hero-section-container, .landing-portal-container {
    --portal-white: #ffffff;
    --portal-dim: rgba(255, 255, 255, 0.1);
  }

  /* Specific color locks for Landing Portal elements */
  .landing-portal-container .text-accent { color: var(--accent-color) !important; }
  .landing-portal-container .text-white\/10 { color: var(--portal-dim) !important; }
  .landing-portal-container .text-white\/20 { color: rgba(255, 255, 255, 0.2) !important; }
  .landing-portal-container .text-white\/40 { color: rgba(255, 255, 255, 0.4) !important; }
  .landing-portal-container .text-white\/60 { color: rgba(255, 255, 255, 0.6) !important; }
  .landing-portal-container .bg-white\/5 { background-color: rgba(255, 255, 255, 0.05) !important; }

  /* Input Lock */
  .landing-portal-container input {
    color: var(--portal-white) !important;
    -webkit-text-fill-color: var(--portal-white) !important;
    caret-color: white !important;
  }
  .landing-portal-container input::placeholder {
    color: var(--portal-dim) !important;
    -webkit-text-fill-color: var(--portal-dim) !important;
  }

  /* Ensure main text elements don't inherit light-theme brown, but allow specific colors */
  .landing-portal-container p:not(.text-accent), 
  .landing-portal-container span:not(.text-accent):not(.text-white\/10) {
    color: white !important;
  }

  /* LIGHT MODE SPECIFICS */
  body.light-theme {
    background-color: var(--bg-cream);
    color: var(--text-dark);
  }

  /* Scope everything NOT in hero-section or landing-portal to be light-themed when body has the class */
  body.light-theme .flex-1.relative:not(.hero-section-container):not(.landing-portal-container) {
    color: var(--text-dark);
  }

  /* Text Color Helpers for Light Mode */
  body.light-theme .flex-1.relative:not(.hero-section-container):not(.landing-portal-container) .text-white { color: var(--text-dark) !important; }
  body.light-theme .flex-1.relative:not(.hero-section-container):not(.landing-portal-container) .text-white\/20 { color: rgba(42, 29, 17, 0.2) !important; }
  body.light-theme .flex-1.relative:not(.hero-section-container):not(.landing-portal-container) .text-white\/30 { color: rgba(42, 29, 17, 0.3) !important; }
  body.light-theme .flex-1.relative:not(.hero-section-container):not(.landing-portal-container) .text-white\/40 { color: rgba(42, 29, 17, 0.4) !important; }
  body.light-theme .flex-1.relative:not(.hero-section-container):not(.landing-portal-container) .text-white\\/60 { color: rgba(42, 29, 17, 0.6) !important; }
  body.light-theme .flex-1.relative:not(.hero-section-container):not(.landing-portal-container) .text-white\\/70 { color: rgba(42, 29, 17, 0.7) !important; }
  body.light-theme .flex-1.relative:not(.hero-section-container):not(.landing-portal-container) .text-white\\/80 { color: rgba(42, 29, 17, 0.8) !important; }
  body.light-theme .flex-1.relative:not(.hero-section-container):not(.landing-portal-container) .text-white\\/90 { color: rgba(42, 29, 17, 0.9) !important; }

  /* Border & Background Helpers for Light Mode */
  body.light-theme .flex-1.relative:not(.hero-section-container) .border-white\\/10 { border-color: rgba(0, 0, 0, 0.1) !important; }
  body.light-theme .flex-1.relative:not(.hero-section-container) .border-white\\/5 { border-color: rgba(0, 0, 0, 0.05) !important; }
  body.light-theme .flex-1.relative:not(.hero-section-container) .bg-white\\/5 { background-color: rgba(0, 0, 0, 0.05) !important; }
  body.light-theme .flex-1.relative:not(.hero-section-container) .bg-white\\/10 { background-color: rgba(0, 0, 0, 0.1) !important; }
  body.light-theme .flex-1.relative:not(.hero-section-container) .bg-black\\/20 { background-color: rgba(0, 0, 0, 0.03) !important; }
  body.light-theme .flex-1.relative:not(.hero-section-container) .bg-black\\/30 { background-color: rgba(0, 0, 0, 0.05) !important; }

  /* Ensure transparency/glassmorphism works in light mode */
  body.light-theme .backdrop-blur-3xl {
    backdrop-filter: blur(60px);
    background-color: rgba(255, 255, 255, 0.4) !important;
  }

  /* DARK MODE REPAIR - Ensure absolute visibility */
  body:not(.light-theme) .text-white\\/80 { color: rgba(255, 255, 255, 0.8) !important; }
  body:not(.light-theme) .text-white\\/40 { color: rgba(255, 255, 255, 0.4) !important; }
  body:not(.light-theme) .text-white\\/60 { color: rgba(255, 255, 255, 0.6) !important; }
`;

import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null; // Or a loading spinner
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <LandingPage /> : <Navigate to="/auth" />;
}

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") !== "light";
  });

  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem("accent-color") || "#F97316";
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--accent-color", accentColor);
    localStorage.setItem("accent-color", accentColor);
  }, [accentColor]);

  useEffect(() => {
    if (isDark) {
      document.body.classList.remove("light-theme");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.add("light-theme");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <AuthProvider>
      <style>{fontStyles}</style>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/auth" element={<Auth />} />
          <Route element={
            <ProtectedRoute>
              <Layout toggleTheme={toggleTheme} isDark={isDark} setAccentColor={setAccentColor} accentColor={accentColor} />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard isDark={isDark} />} />
            <Route path="/goals" element={<GoalsView isDark={isDark} />} />
            <Route path="/goals/:id" element={<GoalDetail isDark={isDark} />} />
            <Route path="/habits" element={<HabitsView isDark={isDark} />} />
            <Route path="/habits/:id" element={<HabitDetail isDark={isDark} />} />
            <Route path="/journal" element={<JournalView isDark={isDark} />} />
            <Route path="/calendar" element={<CalendarView isDark={isDark} />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
