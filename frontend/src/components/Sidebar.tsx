import { 
  LayoutDashboard, Target, Calendar, BookOpen, 
  Settings, Home, Plus, Palette, Camera, 
  ChevronsUpDown, UserCircle, LogOut, Sun, Moon,
  ChevronRight,
  UserCog,
  Blocks,
  FileClock,
  MessageSquareText,
  UserSearch,
  GraduationCap
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Modal from "./Modal";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { Loader2 } from "lucide-react";

interface SidebarProps {
  toggleTheme: () => void;
  isDark: boolean;
  setAccentColor: (color: string) => void;
  accentColor: string;
}

const ACCENT_PRESETS = [
  { name: "Rojo Vivo", hex: "#f94144" },
  { name: "Naranja Fuego", hex: "#f3722c" },
  { name: "Ámbar", hex: "#f8961e" },
  { name: "Amarillo Maíz", hex: "#f9c74f" },
  { name: "Verde Pistacho", hex: "#90be6d" },
  { name: "Zircón", hex: "#43aa8b" },
  { name: "Azul Pizarra", hex: "#577590" },
];

const sidebarVariants = {
  open: { width: "16rem" },
  closed: { width: "4.5rem" },
};

const itemVariants = {
  open: { x: 0, opacity: 1, display: "block" },
  closed: { x: -10, opacity: 0, transitionEnd: { display: "none" } },
};

const staggerVariants = {
  open: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
  closed: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
};

export default function Sidebar({ toggleTheme, isDark, setAccentColor, accentColor }: SidebarProps) {
  const { profile, signOut, fetchProfile } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const [customImage, setCustomImage] = useState(() => localStorage.getItem("hero-custom-image") || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: "Inicio", path: "/", icon: Home },
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Objetivos", path: "/goals", icon: Target },
    { name: "Hábitos", path: "/habits", icon: Calendar },
    { name: "Diario", path: "/journal", icon: BookOpen },
    { name: "Calendario", path: "/calendar", icon: Calendar },
  ];

  const handleImageChange = (url: string) => {
    setCustomImage(url);
    localStorage.setItem("hero-custom-image", url);
    window.dispatchEvent(new Event('storage'));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploadingAvatar(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}/avatar-${Date.now()}.${fileExt}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update Profile Table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // 4. Refresh Profile in Context
      await fetchProfile(profile.id);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error al subir la imagen. Por favor, intenta de nuevo.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const themeColors = {
    bg: isDark ? 'bg-black/40 backdrop-blur-3xl' : 'bg-white/40 backdrop-blur-3xl',
    border: isDark ? 'border-white/10' : 'border-black/10',
    text: isDark ? 'text-white/60' : 'text-[#2A1D11]/60',
    textActive: isDark ? 'text-white' : 'text-[#2A1D11]',
    hover: isDark ? 'hover:bg-white/5' : 'hover:bg-black/5',
  };

  return (
    <>
      <motion.div
        className={`relative h-full border-r ${themeColors.bg} ${themeColors.border} transition-colors duration-500`}
        initial="closed"
        animate={isCollapsed ? "closed" : "open"}
        variants={sidebarVariants}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => {
          setIsCollapsed(true);
          setIsAccountOpen(false);
        }}
      >
        <div className="flex flex-col h-full">
          {/* Navigation Items */}
          <div className="flex-1 px-3 py-10 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <motion.ul variants={staggerVariants} className="space-y-1.5">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <li className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                      isActive 
                        ? `bg-accent/10 ${isDark ? 'text-white' : 'text-black'}` 
                        : `${themeColors.text} ${themeColors.hover}`
                    }`}>
                      {isActive && (
                        <motion.div 
                          layoutId="activeTab"
                          className="absolute left-0 w-1 h-6 rounded-full bg-accent"
                          style={{ backgroundColor: accentColor }}
                        />
                      )}
                      <item.icon size={20} className="shrink-0" style={{ color: isActive ? accentColor : undefined }} />
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.span 
                            variants={itemVariants}
                            className={`text-[13px] font-medium whitespace-nowrap ${isActive ? 'opacity-100' : 'opacity-80'}`}
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </li>
                  </Link>
                );
              })}
            </motion.ul>
          </div>

          {/* Footer Section */}
          <div className={`p-3 space-y-2 border-t ${themeColors.border}`}>
            <button 
              onClick={() => setIsGlobalModalOpen(true)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl bg-accent text-white transition-all shadow-lg hover:brightness-110 active:scale-95 ${isCollapsed ? 'justify-center px-0' : ''}`}
              style={{ backgroundColor: accentColor, boxShadow: `0 10px 20px -5px ${accentColor}40` }}
            >
              <Plus size={20} className="shrink-0" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span 
                    variants={itemVariants}
                    className="text-[11px] font-bold uppercase tracking-widest whitespace-nowrap"
                  >
                    Acceso Rápido
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button 
              onClick={toggleTheme}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${themeColors.text} ${themeColors.hover} ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="shrink-0">
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span 
                    variants={itemVariants}
                    className="text-[13px] font-medium whitespace-nowrap"
                  >
                    {isDark ? "Modo Claro" : "Modo Oscuro"}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${themeColors.text} ${themeColors.hover} ${isCollapsed ? 'justify-center' : ''}`}
            >
              <Settings size={20} className="shrink-0" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span 
                    variants={itemVariants}
                    className="text-[13px] font-medium whitespace-nowrap"
                  >
                    Ajustes
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <div className="relative pt-2">
              <div className="group/avatar relative">
                <button 
                  onClick={() => setIsAccountOpen(!isAccountOpen)}
                  className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${themeColors.hover}`}
                >
                  <div 
                    onClick={(e) => {
                      if (!isCollapsed) {
                        e.stopPropagation();
                        document.getElementById('avatar-upload')?.click();
                      }
                    }}
                    className={`size-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 overflow-hidden relative ${!isCollapsed ? 'cursor-pointer hover:border-accent transition-colors' : ''}`}
                  >
                    {isUploadingAvatar ? (
                      <Loader2 size={16} className="animate-spin text-accent" />
                    ) : profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle size={20} style={{ color: accentColor }} />
                    )}
                    {!isCollapsed && !isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                  {!isCollapsed && (
                    <motion.div 
                      variants={itemVariants}
                      className="flex items-center justify-between w-full overflow-hidden"
                    >
                      <div className="flex flex-col items-start overflow-hidden">
                        <span className={`text-[12px] font-bold truncate w-full ${isDark ? 'text-white' : 'text-[#2A1D11]'}`}>
                          {profile?.username || "Usuario"}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </button>
                <input 
                  type="file" 
                  id="avatar-upload" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleAvatarUpload} 
                />
              </div>

              {/* Account Popover (Floating to the right) */}
              <AnimatePresence>
                {isAccountOpen && !isCollapsed && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.95 }}
                    className={`absolute left-[calc(100%+12px)] bottom-0 w-48 p-1.5 rounded-2xl border backdrop-blur-2xl ${themeColors.bg} ${themeColors.border} shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100]`}
                  >
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <p className="text-[10px] uppercase font-bold opacity-30 tracking-tighter">Sesión Activa</p>
                    </div>
                    <button 
                      onClick={() => signOut().then(() => navigate("/"))}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all group`}
                    >
                      <div className="size-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <LogOut size={16} />
                      </div>
                      Cerrar Sesión
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modals (Preserved from original) */}
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
               { name: "Nuevo Objetivo", path: "/goals", icon: Target },
               { name: "Nuevo Hábito", path: "/habits", icon: Calendar },
               { name: "Nueva Nota", path: "/journal", icon: BookOpen }
            ].map(item => (
               <Link 
                 key={item.name}
                 to={item.path} 
                 onClick={() => setIsGlobalModalOpen(false)} 
                 className={`flex items-center gap-3 p-3 rounded-lg border transition-all group ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-black/5 border-black/5 hover:bg-black/10'}`}
               >
                  <div className={`p-2 rounded-lg bg-accent/10 text-accent group-hover:scale-110 transition-transform`} style={{ color: accentColor, backgroundColor: `${accentColor}15` }}>
                     <item.icon size={16} />
                  </div>
                  <span className={`font-bold text-[12px]`}>{item.name}</span>
               </Link>
            ))}
          </div>
      </Modal>
    </>
  );
}
