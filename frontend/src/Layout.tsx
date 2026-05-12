import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import HeroSection from "./components/HeroSection";

interface LayoutProps {
  toggleTheme: () => void;
  isDark: boolean;
  setAccentColor: (color: string) => void;
  accentColor: string;
}

export default function Layout({ toggleTheme, isDark, setAccentColor, accentColor }: LayoutProps) {
  return (
    <div className={`min-h-screen flex transition-colors duration-500 ${isDark ? 'bg-[#050505]' : 'bg-[var(--bg-cream)]'}`}>
      <div className="sticky top-0 h-screen z-50">
        <Sidebar toggleTheme={toggleTheme} isDark={isDark} setAccentColor={setAccentColor} accentColor={accentColor} />
      </div>
      <main className="flex-1 relative min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
