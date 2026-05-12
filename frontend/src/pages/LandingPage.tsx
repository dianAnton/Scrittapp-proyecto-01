import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Command, Search, ArrowRight, Sparkles } from "lucide-react";

const NATURE_IMAGES = [
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=1920",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1920",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=1920",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1920",
];

const COMMANDS: Record<string, string> = {
  "dashboard": "/dashboard",
  "objetivos": "/goals",
  "metas": "/goals",
  "habitos": "/habits",
  "rutinas": "/habits",
  "diario": "/journal",
  "notas": "/journal",
  "calendario": "/calendar",
};

const VERSES = [
  { text: "Camina por fe, no por vista.", author: "2 Corintios 5:7" },
  { text: "Todo lo puedo en Cristo que me fortalece.", author: "Filipenses 4:13" },
  { text: "El Señor es mi pastor, nada me faltará.", author: "Salmo 23:1" },
  { text: "No temas, porque yo estoy contigo.", author: "Isaías 41:10" },
  { text: "Confía en el Señor de todo corazón.", author: "Proverbios 3:5" },
  { text: "El amor todo lo sufre, todo lo cree, todo lo espera.", author: "1 Corintios 13:7" }
];

export default function LandingPage() {
  const [input, setInput] = useState("");
  const [bgImage, setBgImage] = useState("");
  const [isError, setIsError] = useState(false);
  const [verseIndex, setVerseIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const dayOfYear = Math.floor(Date.now() / 86400000);
    setVerseIndex(dayOfYear % VERSES.length);

    const custom = localStorage.getItem("hero-custom-image");
    if (custom) {
      setBgImage(custom);
    } else {
      const hour = new Date().getHours();
      setBgImage(NATURE_IMAGES[Math.floor(hour / 6) % NATURE_IMAGES.length]);
    }
  }, []);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.toLowerCase().trim();
    if (COMMANDS[cmd]) {
      navigate(COMMANDS[cmd]);
    } else {
      setIsError(true);
      setTimeout(() => setIsError(false), 500);
    }
  };

  return (
    <div className="h-screen w-full relative overflow-hidden flex flex-col items-center justify-center bg-[#050505] selection:bg-accent selection:text-white">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <motion.img 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.5 }}
          transition={{ duration: 2 }}
          src={bgImage} 
          alt="Background" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center gap-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-8"
        >
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-serif tracking-tightest text-white leading-none">
            Scrittapp
          </h1>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="flex flex-col gap-2"
          >
            <p className="text-white/60 text-lg md:text-xl font-light italic leading-relaxed max-w-lg mx-auto">
              "{VERSES[verseIndex]?.text}"
            </p>
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-accent">
              — {VERSES[verseIndex]?.author}
            </span>
          </motion.div>
        </motion.div>

        <motion.form 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onSubmit={handleCommand}
          className={`w-full relative group ${isError ? 'animate-shake' : ''}`}
        >
          <div className={`absolute inset-0 bg-accent/20 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500`} />
          
          <div className="relative flex items-center bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 focus-within:border-accent/50 transition-all duration-300">
            <div className="pl-4 pr-3 text-white/20">
              <Command size={20} />
            </div>
            <input 
              autoFocus
              type="text" 
              placeholder="¿A dónde quieres ir? (dashboard, objetivos, diario...)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-white text-lg md:text-xl py-3 outline-none placeholder:text-white/10 font-light"
            />
            <button 
              type="submit"
              className="p-3 rounded-xl bg-accent text-white hover:opacity-90 transition-all active:scale-95"
            >
              <ArrowRight size={20} />
            </button>
          </div>

          <AnimatePresence>
            {input.trim() && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 w-full mt-4 flex flex-wrap gap-2 justify-center"
              >
                {Object.keys(COMMANDS)
                  .filter(c => c.startsWith(input.toLowerCase().trim()))
                  .map(c => (
                    <span key={c} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase font-bold tracking-widest text-white/40">
                      {c}
                    </span>
                  ))
                }
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>
      </div>

      {/* Decorative Bottom Text */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1, duration: 2 }}
        className="absolute bottom-12 text-[10px] uppercase tracking-[0.5em] text-white font-bold"
      >
        Press Enter to navigate
      </motion.div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
}
