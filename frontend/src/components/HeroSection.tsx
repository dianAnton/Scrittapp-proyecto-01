import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { User, Activity, Sparkles } from "lucide-react";
import { NATURE_IMAGES, VERSES } from "../constants/assets";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";

const textContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const charItem = {
  hidden: { opacity: 0, y: 40, rotateX: -45 },
  show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } },
};

function AnimatedLine({ line }: { line: string }) {
  return (
    <span className="inline-block overflow-hidden py-2 -my-2">
      {line.split(" ").map((word, i, arr) => (
        <span key={i} className="inline-block mr-[0.3em]">
          {word.split("").map((char, j) => (
            <motion.span key={j} variants={charItem} className="inline-block">
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </span>
  );
}

export default function HeroSection() {
  const [verseIndex, setVerseIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [customImage, setCustomImage] = useState(() => localStorage.getItem("hero-custom-image") || "");
  const [streak, setStreak] = useState(0);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (profile?.cover_url) {
      setCustomImage(profile.cover_url);
    }
    const dayOfYear = Math.floor(Date.now() / 86400000);
    setVerseIndex(dayOfYear % VERSES.length);
    const hour = new Date().getHours();
    setImageIndex(Math.floor(hour / 6) % NATURE_IMAGES.length);

    const calculateStreak = async () => {
      if (!user) return;
      
      const { data: logs } = await supabase
        .from("habit_logs")
        .select("date")
        .eq("completed", true)
        .order("date", { ascending: false });

      if (logs && logs.length > 0) {
        const uniqueDates = Array.from(new Set(logs.map(l => l.date)));
        let currentStreak = 0;
        const dateStr = (d: Date) => d.toISOString().split('T')[0];
        
        let checkDate = new Date();
        // Check if there's a log today or yesterday to continue streak
        if (uniqueDates.includes(dateStr(checkDate)) || uniqueDates.includes(dateStr(new Date(Date.now() - 86400000)))) {
          while (uniqueDates.includes(dateStr(checkDate))) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          }
        }
        setStreak(currentStreak);
      }
    };

    calculateStreak();

    const handleStorage = () => setCustomImage(localStorage.getItem("hero-custom-image") || "");
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full relative p-3 gap-3 font-sans bg-[#050505]">
      
      {/* LEFT CONTAINER - "Your mind is always on" inspiration */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full bg-accent rounded-3xl relative overflow-hidden flex flex-col items-center md:items-start justify-center px-8 md:px-16 lg:px-24">
        
        {/* Spinning Decorative Circle */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -left-20 -bottom-20 w-80 h-80 border border-black/5 rounded-full flex items-center justify-center opacity-40 pointer-events-none"
        >
          <div className="w-60 h-60 border border-black/5 rounded-full" />
          <div className="w-40 h-40 border border-black/5 rounded-full" />
        </motion.div>

        <div className="relative z-10 space-y-6 md:space-y-8 max-w-lg">
          <motion.div variants={textContainer} initial="hidden" animate="show" className="space-y-1">
            <h1 className="text-[42px] sm:text-[52px] md:text-[60px] lg:text-[72px] leading-[0.95] font-serif text-[#2A1D11] tracking-tightest">
              <AnimatedLine line="Tu mente" /><br />
              <AnimatedLine line="siempre" /><br />
              <AnimatedLine line="está activa." />
            </h1>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="flex flex-col gap-3"
          >
            <p className="text-[#2A1D11]/60 text-sm md:text-base font-medium leading-relaxed max-w-[320px]">
              {VERSES[verseIndex]?.text}
            </p>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#2A1D11]/30">
              — {VERSES[verseIndex]?.author}
            </span>
          </motion.div>
        </div>

        {/* Small floating element */}
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-12 bottom-12 p-4 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 hidden md:block"
        >
          <Sparkles className="text-[#2A1D11]/40" size={20} />
        </motion.div>
      </div>

      {/* RIGHT CONTAINER - "Your support should be, too" inspiration */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full relative rounded-3xl overflow-hidden bg-[#0c0c0c] flex flex-col items-center md:items-start justify-center px-8 md:px-16 lg:px-24">
        
        {/* Background Image with Scrittapp Gradient */}
        <div className="absolute inset-0 z-0">
          <img 
            src={customImage || NATURE_IMAGES[imageIndex]} 
            alt="Fondo" 
            className="w-full h-full object-cover opacity-60 scale-110 blur-[2px] md:blur-0" 
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        </div>

        {/* USER PROFILE BADGE (Integrated) */}
        <div className="absolute top-10 right-10 z-20 flex items-center gap-4 group">
           <div className="flex flex-col items-end leading-none">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{profile?.username || "Usuario"}</span>
              <div className="flex items-center gap-2 text-white">
                 <Activity size={12} className="text-accent" />
                 <span className="text-sm font-bold tracking-tight">{streak} DÍAS ACTIVO</span>
              </div>
           </div>
           <div className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 overflow-hidden relative">
              <User size={20} className="text-white/40 relative z-10" />
              <div className="absolute inset-0 bg-accent opacity-0 group-hover:opacity-20 transition-opacity" />
           </div>
        </div>

        <div className="relative z-10 space-y-6 md:space-y-8 max-w-lg">
          <motion.div variants={textContainer} initial="hidden" animate="show" className="space-y-1">
            <h2 className="text-[42px] sm:text-[52px] md:text-[60px] lg:text-[72px] leading-[0.95] font-serif text-white tracking-tightest">
              <AnimatedLine line="Tu guía" /><br />
              <AnimatedLine line="también" /><br />
              <AnimatedLine line="debería estarlo." />
            </h2>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="space-y-6"
          >
            <p className="text-white/60 text-base md:text-lg font-light leading-relaxed max-w-[380px]">
              Scrittapp es tu espacio personal para organizar pensamientos, registrar hábitos y alcanzar tus metas paso a paso.
            </p>
            
            <div className="flex items-center gap-4 pt-2">
               <div className="h-[1px] w-12 bg-accent" />
               <span className="text-accent font-bold text-xs uppercase tracking-widest">Bienvenido, {profile?.username || "Usuario"}</span>
            </div>
          </motion.div>
        </div>

        {/* Decorative Scroller Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 md:left-24 md:translate-x-0">
           <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-px h-12 bg-white/20 relative"
           >
              <div className="absolute top-0 left-0 w-full h-1/2 bg-accent" />
           </motion.div>
        </div>
      </div>
    </div>
  );
}
