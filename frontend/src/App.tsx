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
    --bg-cream: #FDFCF0;
    --text-dark: #2A1D11;
  }

  /* BASE STYLES - DARK MODE DEFAULT */
  body {
    background-color: #0d0d0d;
    color: white;
    transition: background-color 0.3s ease;
  }

  /* PROTECT HERO SECTION - ALWAYS DARK */
  .hero-section-container, .hero-section-container * {
    color: white !important;
  }
  .hero-section-container .text-white\\/40 { color: rgba(255,255,255,0.4) !important; }
  .hero-section-container .text-white\\/60 { color: rgba(255,255,255,0.6) !important; }
  .hero-section-container .bg-white\\/5 { background-color: rgba(255,255,255,0.05) !important; }

  /* LIGHT MODE SPECIFICS */
  body.light-theme {
    background-color: var(--bg-cream);
    color: var(--text-dark);
  }

  /* Scope everything NOT in hero-section to be light-themed when body has the class */
  body.light-theme .flex-1.relative:not(.hero-section-container) {
    color: var(--text-dark);
  }

  /* Text Color Helpers for Light Mode */
  body.light-theme .flex-1.relative:not(.hero-section-container) .text-white { color: var(--text-dark) !important; }
  body.light-theme .flex-1.relative:not(.hero-section-container) .text-white\\/20 { color: rgba(42, 29, 17, 0.2) !important; }
  body.light-theme .flex-1.relative:not(.hero-section-container) .text-white\\/30 { color: rgba(42, 29, 17, 0.3) !important; }
  body.light-theme .flex-1.relative:not(.hero-section-container) .text-white\\/40 { color: rgba(42, 29, 17, 0.4) !important; }
  body.light-theme .flex-1.relative:not(.hero-section-container) .text-white\\/60 { color: rgba(42, 29, 17, 0.6) !important; }
  body.light-theme .flex-1.relative:not(.hero-section-container) .text-white\\/70 { color: rgba(42, 29, 17, 0.7) !important; }
  body.light-theme .flex-1.relative:not(.hero-section-container) .text-white\\/80 { color: rgba(42, 29, 17, 0.8) !important; }
  body.light-theme .flex-1.relative:not(.hero-section-container) .text-white\\/90 { color: rgba(42, 29, 17, 0.9) !important; }

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

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") !== "light";
  });

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
    <>
      <style>{fontStyles}</style>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout toggleTheme={toggleTheme} isDark={isDark} />}>
            <Route path="/" element={<Dashboard isDark={isDark} />} />
            <Route path="/goals" element={<GoalsView isDark={isDark} />} />
            <Route path="/goals/:id" element={<GoalDetail isDark={isDark} />} />
            <Route path="/habits" element={<HabitsView isDark={isDark} />} />
            <Route path="/habits/:id" element={<HabitDetail isDark={isDark} />} />
            <Route path="/journal" element={<JournalView isDark={isDark} />} />
            <Route path="/calendar" element={<CalendarView isDark={isDark} />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}
