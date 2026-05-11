import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import HeroSection from "./components/HeroSection";

interface LayoutProps {
  toggleTheme: () => void;
  isDark: boolean;
}

export default function Layout({ toggleTheme, isDark }: LayoutProps) {
  const location = useLocation();
  const isDashboard = location.pathname === "/";

  return (
    <div className={`min-h-screen flex flex-col overflow-y-auto transition-colors duration-500 ${isDark ? 'bg-[#050505]' : 'bg-[#FDFCF0]'}`}>
      {/* Hero Section at the very top */}
      {isDashboard && <HeroSection />}
      
      {/* App Interface below the Hero */}
      <div className="flex flex-1 relative">
        <Sidebar toggleTheme={toggleTheme} isDark={isDark} />
        <main className="flex-1 relative overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
