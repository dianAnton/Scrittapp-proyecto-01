import { LayoutDashboard, Target, Calendar, BookOpen, ChevronLeft, ChevronRight, Sun, Moon, Plus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import Modal from "./Modal";

interface SidebarProps {
  toggleTheme: () => void;
  isDark: boolean;
}

export default function Sidebar({ toggleTheme, isDark }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Objetivos", path: "/goals", icon: Target },
    { name: "Hábitos", path: "/habits", icon: Calendar },
    { name: "Diario", path: "/journal", icon: BookOpen },
    { name: "Calendario", path: "/calendar", icon: Calendar },
  ];

  return (
    <div 
      className={`h-screen flex flex-col transition-all duration-300 relative z-50 sidebar-container border-r ${isCollapsed ? 'w-20' : 'w-64'} ${isDark ? 'bg-black/40 backdrop-blur-2xl border-white/10' : 'bg-white/40 backdrop-blur-2xl border-black/10'}`}
    >
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <span className={`text-xl font-serif tracking-tight ${isDark ? 'text-white' : 'text-[#2A1D11]'}`}>Scrittapp</span>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/70' : 'bg-black/5 hover:bg-black/10 text-black/70'}`}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                isActive 
                  ? 'bg-orange-500/20 text-orange-500 border border-orange-500/20' 
                  : `${isDark ? 'text-white/60 hover:bg-white/5 hover:text-white' : 'text-black/60 hover:bg-black/5 hover:text-black'}`
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-orange-500' : ''} />
              {!isCollapsed && <span className="font-medium text-[13px]">{item.name}</span>}
            </Link>
          );
        })}
      </div>

      <div className="p-4 space-y-3 border-t border-black/5">
        <button 
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/70' : 'bg-black/5 hover:bg-black/10 text-black/70'} ${isCollapsed ? 'justify-center' : ''}`}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {!isCollapsed && <span className="font-medium text-[13px]">{isDark ? "Modo Claro" : "Modo Oscuro"}</span>}
        </button>

        <button 
          onClick={() => setIsGlobalModalOpen(true)}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-xl shadow-orange-500/20 ${isCollapsed ? 'justify-center px-0' : ''}`}
        >
          <Plus size={18} />
          {!isCollapsed && <span className="font-bold text-[12px] uppercase tracking-wider">Acceso Rápido</span>}
        </button>
      </div>

      <Modal isOpen={isGlobalModalOpen} onClose={() => setIsGlobalModalOpen(false)} title="Acceso Rápido" isDark={isDark}>
         <div className="grid grid-cols-1 gap-1.5">
            {[
               { name: "Nuevo Objetivo", path: "/goals", icon: Target, color: "text-orange-500", bg: "bg-orange-500/10" },
               { name: "Nuevo Hábito", path: "/habits", icon: Calendar, color: "text-emerald-500", bg: "bg-emerald-500/10" },
               { name: "Nueva Nota", path: "/journal", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" }
            ].map(item => (
               <Link 
                 key={item.name}
                 to={item.path} 
                 onClick={() => setIsGlobalModalOpen(false)} 
                 className={`flex items-center gap-3 p-3 rounded-lg border transition-all group ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-black/5 border-black/5 hover:bg-black/10'}`}
               >
                  <div className={`p-2 rounded-lg ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                     <item.icon size={16} />
                  </div>
                  <span className={`font-bold text-[12px]`}>{item.name}</span>
               </Link>
            ))}
         </div>
      </Modal>

      <style>{`
        .light-theme .sidebar-container { background-color: rgba(255, 255, 255, 0.4) !important; border-right-color: rgba(42, 29, 17, 0.1) !important; }
        .light-theme .sidebar-container * { color: #2A1D11 !important; }
        .light-theme .sidebar-container .bg-orange-500 { background-color: #F97316 !important; color: white !important; }
        .light-theme .sidebar-container .bg-orange-500 * { color: white !important; }
      `}</style>
    </div>
  );
}
