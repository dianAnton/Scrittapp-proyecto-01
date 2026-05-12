import { LayoutDashboard, Target, Calendar, BookOpen, ChevronLeft, ChevronRight, Sun, Moon, Plus, Settings, Camera, Palette, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import Modal from "./Modal";

interface SidebarProps {
  toggleTheme: () => void;
  isDark: boolean;
  setAccentColor: (color: string) => void;
  accentColor: string;
}

const ACCENT_PRESETS = [
  { name: "Naranja", hex: "#F97316" },
  { name: "Esmeralda", hex: "#10B981" },
  { name: "Azul", hex: "#3B82F6" },
  { name: "Púrpura", hex: "#8B5CF6" },
  { name: "Rosa", hex: "#EC4899" },
  { name: "Rojo", hex: "#EF4444" },
];

export default function Sidebar({ toggleTheme, isDark, setAccentColor, accentColor }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const location = useLocation();

  const [customImage, setCustomImage] = useState(() => localStorage.getItem("hero-custom-image") || "");

  const menuItems = [
    { name: "Inicio", path: "/", icon: Home }, // Back to landing
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Objetivos", path: "/goals", icon: Target },
    { name: "Hábitos", path: "/habits", icon: Calendar },
    { name: "Diario", path: "/journal", icon: BookOpen },
    { name: "Calendario", path: "/calendar", icon: Calendar },
  ];

  const handleImageChange = (url: string) => {
    setCustomImage(url);
    localStorage.setItem("hero-custom-image", url);
    window.dispatchEvent(new Event('storage')); // Notify HeroSection
  };

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
                  ? 'bg-accent/20 text-accent border border-accent/20' 
                  : `${isDark ? 'text-white/60 hover:bg-white/5 hover:text-white' : 'text-black/60 hover:bg-black/5 hover:text-black'}`
              }`}
              style={{ color: isActive ? accentColor : undefined }}
            >
              <item.icon size={18} style={{ color: isActive ? accentColor : undefined }} />
              {!isCollapsed && <span className="font-medium text-[13px]">{item.name}</span>}
            </Link>
          );
        })}
      </div>

      <div className="p-4 space-y-3 border-t border-black/5">
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/70' : 'bg-black/5 hover:bg-black/10 text-black/70'} ${isCollapsed ? 'justify-center' : ''}`}
        >
          <Settings size={18} />
          {!isCollapsed && <span className="font-medium text-[13px]">Ajustes</span>}
        </button>

        <button 
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/70' : 'bg-black/5 hover:bg-black/10 text-black/70'} ${isCollapsed ? 'justify-center' : ''}`}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {!isCollapsed && <span className="font-medium text-[13px]">{isDark ? "Modo Claro" : "Modo Oscuro"}</span>}
        </button>

        <button 
          onClick={() => setIsGlobalModalOpen(true)}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-accent hover:opacity-90 text-white transition-all shadow-xl shadow-accent/20 ${isCollapsed ? 'justify-center px-0' : ''}`}
          style={{ backgroundColor: accentColor }}
        >
          <Plus size={18} />
          {!isCollapsed && <span className="font-bold text-[12px] uppercase tracking-wider">Acceso Rápido</span>}
        </button>
      </div>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Ajustes de la Aplicación" isDark={isDark}>
         <div className="space-y-8">
            <section>
               <label className="text-[10px] uppercase font-bold opacity-40 tracking-widest flex items-center gap-2 mb-4">
                  <Palette size={12} /> Color Acento
               </label>
               <div className="grid grid-cols-6 gap-2">
                  {ACCENT_PRESETS.map(color => (
                     <button 
                        key={color.hex} 
                        onClick={() => setAccentColor(color.hex)}
                        className={`w-full aspect-square rounded-lg border-2 transition-all ${accentColor === color.hex ? 'border-accent scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        style={{ backgroundColor: color.hex, borderColor: accentColor === color.hex ? accentColor : 'transparent' }}
                     />
                  ))}
               </div>
            </section>

            <section>
               <label className="text-[10px] uppercase font-bold opacity-40 tracking-widest flex items-center gap-2 mb-4">
                  <Camera size={12} /> Imagen de Portada (Hero)
               </label>
               <div className="space-y-3">
                  <input 
                     type="text" 
                     placeholder="URL de la imagen..."
                     value={customImage}
                     onChange={(e) => handleImageChange(e.target.value)}
                     className={`w-full border rounded-xl px-4 py-3 text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`}
                  />
                  <p className="text-[10px] opacity-40 italic">Introduce una URL de Unsplash o deja vacío para usar imágenes aleatorias.</p>
               </div>
            </section>
         </div>
      </Modal>

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
      `}</style>
    </div>
  );
}
