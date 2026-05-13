import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Command, ArrowRight } from "lucide-react";

const COMMANDS: Record<string, string> = {
  "dashboard": "/dashboard",
  "objetivos": "/goals",
  "metas": "/goals",
  "habitos": "/habits",
  "rutinas": "/habits",
  "diario": "/journal",
  "notas": "/journal",
  "calendario": "/calendar",
  "inicio": "/",
};

export default function CommandPalette({ isDark }: { isDark: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setInput("");
      setSuggestion("");
    }
  }, [isOpen]);

  useEffect(() => {
    const val = input.toLowerCase().trim();
    if (val.length > 0) {
      const match = Object.keys(COMMANDS).find(cmd => cmd.startsWith(val));
      if (match && match !== val) {
        setSuggestion(match);
      } else {
        setSuggestion("");
      }
    } else {
      setSuggestion("");
    }
  }, [input]);

  const filteredCommands = Object.keys(COMMANDS).filter(c => 
    c.startsWith(input.toLowerCase().trim())
  );

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Tab" || e.key === "ArrowRight") && suggestion) {
      e.preventDefault();
      setInput(suggestion);
      setSuggestion("");
    }
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.toLowerCase().trim();
    
    // 1. Try exact match
    if (COMMANDS[cmd]) {
      navigate(COMMANDS[cmd]);
      setIsOpen(false);
      return;
    }

    // 2. Try current suggestion
    if (suggestion) {
      navigate(COMMANDS[suggestion]);
      setIsOpen(false);
      return;
    }

    // 3. Error if no match
    setIsError(true);
    setTimeout(() => setIsError(false), 500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Palette Container */}
          <motion.form
            onSubmit={handleCommand}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`w-full max-w-xl relative group ${isError ? 'animate-shake' : ''}`}
          >
            <div className="absolute inset-0 bg-accent/20 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            
            <div 
              className={`relative flex items-center border rounded-2xl p-2 focus-within:border-accent/50 transition-all duration-300 ${
                isDark 
                  ? 'bg-[#1a1a1a]/90 border-white/10 backdrop-blur-3xl' 
                  : 'bg-white/90 border-black/10 backdrop-blur-3xl shadow-2xl'
              }`}
            >
              <div className={`pl-4 pr-3 ${isDark ? 'text-white/20' : 'text-black/20'}`}>
                <Command size={20} />
              </div>

              <div className="relative flex-1 flex items-center h-full">
                {/* Ghost Text Suggestion */}
                <div className="absolute inset-0 flex items-center pointer-events-none text-lg md:text-xl font-light pl-0">
                  <span className="text-transparent">{input}</span>
                  {suggestion && (
                    <span className={isDark ? 'text-white/10' : 'text-black/10'}>
                      {suggestion.slice(input.length)}
                    </span>
                  )}
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="¿A dónde quieres ir?"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  className={`relative z-10 w-full bg-transparent border-none focus:ring-0 text-lg md:text-xl py-3 outline-none font-light ${
                    isDark ? 'text-white placeholder:text-white/20' : 'text-black placeholder:text-black/20'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="p-3 rounded-xl bg-accent text-white hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-accent/20"
              >
                <ArrowRight size={20} />
              </button>
            </div>

            {/* Suggestions list */}
            <AnimatePresence>
              {input.trim() && filteredCommands.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`absolute top-full left-0 w-full mt-4 flex flex-wrap gap-2 justify-center p-4 rounded-2xl border backdrop-blur-3xl shadow-2xl ${
                    isDark ? 'bg-[#1a1a1a]/80 border-white/10 text-white' : 'bg-white/70 border-black/10 text-black'
                  }`}
                >
                  {filteredCommands.map(c => (
                      <span 
                        key={c} 
                        onClick={() => { setInput(c); setTimeout(() => inputRef.current?.focus(), 10); }}
                        className={`px-3 py-1 rounded-full border text-[10px] uppercase font-bold tracking-widest transition-colors cursor-pointer ${
                          c === suggestion 
                            ? 'bg-accent text-white border-accent' 
                            : isDark ? 'bg-white/5 border-white/10 text-white/40 hover:text-white' : 'bg-black/5 border-black/10 text-black/40 hover:text-black'
                        }`}
                      >
                        {c}
                      </span>
                    ))
                  }
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>

          <style>{`
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-10px); }
              75% { transform: translateX(10px); }
            }
            .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
          `}</style>
        </div>
      )}
    </AnimatePresence>
  );
}
