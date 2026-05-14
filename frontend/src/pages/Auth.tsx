import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Mail, Lock, User } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const images = [
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=1920",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1920",
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=1920"
    ];
    setBgImage(images[Math.floor(Math.random() * images.length)]);

    // Listen for OAuth callback from Electron main process
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.on('auth-callback', async (_event: any, url: string) => {
        const hash = url.split('#')[1];
        if (hash) {
          const { data, error } = await supabase.auth.getSession();
          if (data.session) {
            navigate("/dashboard");
          } else {
            // Manual session set if needed
            const params = new URLSearchParams(hash);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            if (access_token && refresh_token) {
              await supabase.auth.setSession({ access_token, refresh_token });
              navigate("/dashboard");
            }
          }
        }
      });
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username }
          }
        });
        if (error) throw error;
        setError("Revisa tu correo para confirmar tu cuenta.");
        return;
      }
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider,
      options: {
        redirectTo: window.require ? 'scrittapp://auth-callback' : window.location.origin
      }
    });
    if (error) setError(error.message);
  };

  return (
    <div className="h-screen w-full relative overflow-hidden flex items-center justify-center bg-[#050505] selection:bg-white/20 selection:text-white">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.4 }}
          transition={{ duration: 2 }}
          src={bgImage}
          alt="Background"
          className="w-full h-full object-cover grayscale-[20%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/50" />
      </div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="backdrop-blur-3xl bg-white/5 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-serif text-white tracking-tight mb-2">
              {isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}
            </h1>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={18} />
                    <input
                      type="text"
                      placeholder="Nombre de usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={18} />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={18} />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                required
              />
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-xs font-bold text-center mt-2"
              >
                {error}
              </motion.p>
            )}

            <button
              disabled={loading}
              className="w-full bg-[#FDFCF0] text-[#111] font-bold py-4 rounded-2xl mt-6 flex items-center justify-center gap-2 hover:bg-white active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-black/20"
            >
              {loading ? "Cargando..." : isLogin ? "Entrar" : "Empezar"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Social Auth */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-[1px] bg-white/10" />
              <span className="text-[10px] uppercase font-bold text-white/20 tracking-widest">o continúa con</span>
              <div className="flex-1 h-[1px] bg-white/10" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => handleSocialAuth('google')}
                className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl py-3 hover:bg-white/10 transition-all"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="size-4" alt="Google" />
                <span className="text-xs font-bold text-white">Google</span>
              </button>
              <button 
                type="button"
                onClick={() => handleSocialAuth('github')}
                className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl py-3 hover:bg-white/10 transition-all"
              >
                <svg className="size-4 fill-white" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                <span className="text-xs font-bold text-white">GitHub</span>
              </button>
            </div>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-white/40 text-sm font-medium hover:text-white transition-colors"
            >
              {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
