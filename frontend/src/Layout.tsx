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
    <div className={`min-h-screen flex flex-col overflow-y-auto transition-colors duration-500 ${isDark ? 'bg-[#050505]' : 'bg-[var(--bg-cream)]'}`}>
      <div className="flex flex-1 relative">
        <Sidebar toggleTheme={toggleTheme} isDark={isDark} setAccentColor={setAccentColor} accentColor={accentColor} />
        <main className="flex-1 relative overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
