import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Trophy, Clock, CheckCircle2, BookOpen, PlusCircle as PlusIcon, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { VERSES } from "../constants/assets";

const getLocalDateString = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - offset);
  return local.toISOString().split('T')[0];
};

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function CalendarView({ isDark }: { isDark: boolean }) {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [dayNotes, setDayNotes] = useState<any[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchData = async () => {
    if (!user) return;
    const [lRes, gRes, hRes] = await Promise.all([
      supabase.from("habit_logs").select("*"),
      supabase.from("goals").select("*"),
      supabase.from("habits").select("*")
    ]);
    setLogs(lRes.data || []);
    setGoals(gRes.data || []);
    setHabits(hRes.data || []);
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  useEffect(() => {
    if (!user || view !== 'day') return;
    const fetchDayNotes = async () => {
      const dateStr = getLocalDateString(currentDate);
      const { data } = await supabase
        .from("notes")
        .select("*")
        .eq("date", dateStr)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      setDayNotes(data || []);
    };
    fetchDayNotes();
  }, [currentDate, view, user]);

  const getVerseForDate = (date: Date) => {
    const dayTimestamp = Math.floor(date.getTime() / 86400000);
    return VERSES[dayTimestamp % VERSES.length];
  };

  const dayVerse = getVerseForDate(currentDate);

  const prev = () => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const next = () => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);

    return (
      <div className={`border rounded-2xl overflow-hidden shadow-xl transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'}`}>
        <div className={`grid grid-cols-7 border-b ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
          {DAY_NAMES.map(d => (
            <div key={d} className="py-3 text-center text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {blanks.map(b => <div key={`b-${b}`} className={`h-20 border-b border-r ${isDark ? 'border-white/5' : 'border-black/5'}`} />)}
          {days.map(day => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayLogs = logs.filter(l => l.date === dateStr && l.completed);
            const isToday = dateStr === getLocalDateString(new Date());
            return (
              <div key={day} onClick={() => { setCurrentDate(new Date(dateStr + "T00:00:00")); setView('day'); }} className={`h-20 border-b border-r p-2 flex flex-col gap-1.5 hover:bg-accent/5 transition-all cursor-pointer group ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                <span className={`text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-lg transition-all ${isToday ? 'bg-accent text-white shadow-lg' : 'opacity-40 group-hover:opacity-80 group-hover:text-accent'}`}>{day}</span>
                <div className="flex flex-wrap gap-1">
                  {dayLogs.map(l => {
                    const h = habits.find(hab => hab.id === l.habit_id);
                    return <div key={l.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: h ? `var(--accent-color)` : '#ccc' }} />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 min-h-[400px]">
        {weekDays.map(d => {
          const dateStr = getLocalDateString(d);
          const dayLogs = logs.filter(l => l.date === dateStr && l.completed);
          const isToday = dateStr === getLocalDateString(new Date());

          return (
            <div key={dateStr} onClick={() => { setCurrentDate(d); setView('day'); }} className={`border rounded-2xl p-6 flex flex-col gap-4 hover:scale-[1.02] transition-all cursor-pointer group ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10 shadow-lg'} ${isToday ? 'ring-2 ring-accent' : ''}`}>
              <div className="text-center border-b border-black/5 pb-4">
                 <p className="text-[10px] uppercase font-bold opacity-30 tracking-widest">{DAY_NAMES[d.getDay()]}</p>
                 <p className={`text-2xl font-bold ${isToday ? 'text-accent' : 'opacity-80'}`}>{d.getDate()}</p>
              </div>
              <div className="flex-1 space-y-3">
                 <div className="flex flex-wrap gap-1.5">
                    {dayLogs.map(l => <div key={l.id} className="w-3 h-3 rounded-sm bg-accent shadow-[0_0_10px_rgba(var(--accent-color-rgb),0.3)]" />)}
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dateStr = getLocalDateString(currentDate);
    const dayLogs = logs.filter(l => l.date === dateStr && l.completed);
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className={`lg:col-span-2 border rounded-3xl p-10 space-y-10 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10 shadow-xl'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-5xl font-bold font-sf capitalize mb-2">{currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
              <p className="text-sm opacity-30 font-bold uppercase tracking-widest">Resumen del Día</p>
            </div>
            <button onClick={() => navigate(`/journal?date=${dateStr}`)} className="flex items-center gap-3 bg-accent text-white px-8 py-4 rounded-2xl font-bold hover:brightness-110 transition-all shadow-[0_10px_20px_rgba(var(--accent-color-rgb),0.3)] active:scale-95">
              <BookOpen size={20} /> Ir al Diario
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {dayNotes.length > 0 ? dayNotes.map(note => (
               <div key={note.id} onClick={() => navigate(`/journal?date=${dateStr}&id=${note.id}`)} className={`p-6 rounded-2xl border transition-all hover:scale-[1.02] cursor-pointer group relative overflow-hidden ${isDark ? 'bg-black/20 border-white/5 hover:border-accent/30' : 'bg-black/[0.02] border-black/5 hover:border-accent/30'}`}>
                  <div className="flex items-center gap-3 mb-4 opacity-30 group-hover:opacity-100 transition-all">
                     <FileText size={16} className="text-accent" />
                     <span className="text-[9px] font-bold uppercase tracking-widest">Nota</span>
                  </div>
                  <h3 className={`text-lg font-bold mb-2 truncate ${isDark ? 'text-white' : 'text-black'}`}>{note.title}</h3>
                  <div 
                    className={`text-xs line-clamp-4 opacity-40 group-hover:opacity-60 transition-all ${isDark ? 'text-white' : 'text-black'}`}
                    dangerouslySetInnerHTML={{ __html: note.content }}
                  />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all">
                     <BookOpen size={14} className="text-accent" />
                  </div>
               </div>
             )) : (
               <div className={`col-span-2 py-20 rounded-2xl border border-dashed flex flex-col items-center justify-center opacity-20 ${isDark ? 'border-white/20' : 'border-black/20'}`}>
                  <FileText size={48} className="mb-4" />
                  <p className="text-sm font-bold uppercase tracking-[0.2em]">Sin reflexiones registradas</p>
               </div>
             )}
          </div>
        </div>

        <div className="space-y-6">
           <div className={`p-8 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10 shadow-xl'}`}>
              <p className="opacity-30 text-[10px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2"><CheckCircle2 size={14} /> Hábitos Completados</p>
              <div className="space-y-4">
                 {dayLogs.map(l => {
                    const h = habits.find(hab => hab.id === l.habit_id);
                    return (
                      <div key={l.id} className="flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-accent shadow-lg scale-90 group-hover:scale-100 transition-all">
                          <CheckCircle2 size={18} />
                        </div>
                        <span className={`font-bold text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>{h?.title}</span>
                      </div>
                    );
                 })}
                 {dayLogs.length === 0 && (
                   <div className="py-10 text-center opacity-20">
                      <Clock size={32} className="mx-auto mb-3" />
                      <p className="italic text-xs">Sin actividad registrada.</p>
                   </div>
                 )}
              </div>
           </div>

           <div className={`p-8 rounded-3xl border bg-gradient-to-br from-accent/10 to-transparent ${isDark ? 'border-white/5' : 'border-black/5'}`}>
              <p className="text-accent text-[10px] font-bold uppercase tracking-widest mb-4">Versículo del Día</p>
              <p className={`text-lg font-light italic leading-relaxed mb-4 ${isDark ? 'text-white/80' : 'text-black/80'}`}>"{dayVerse?.text}"</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">— {dayVerse?.author}</p>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-inter space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <h1 className={`text-4xl font-bold flex items-center gap-4 ${isDark ? 'text-white' : 'text-black'}`}>
            <CalendarIcon className="text-accent w-10 h-10" /> Tu Línea del Tiempo
          </h1>
          <p className="opacity-40 text-sm mt-1 ml-14">Revive tus progresos y aprendizajes pasados.</p>
        </div>
        <div className="flex items-center gap-4 bg-black/5 p-1.5 rounded-2xl border border-black/5">
          <button onClick={prev} className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/5 text-white/40 hover:text-white' : 'hover:bg-black/5 text-black/40 hover:text-black'}`}><ChevronLeft size={22} /></button>
          <span className={`font-bold min-w-[220px] text-center uppercase tracking-[0.2em] text-[11px] ${isDark ? 'text-white' : 'text-black'}`}>
            {view === 'month' ? currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : view === 'week' ? `Semana ${currentDate.getDate()} ${currentDate.toLocaleDateString('es-ES', { month: 'short' })}` : currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
          </span>
          <button onClick={next} className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/5 text-white/40 hover:text-white' : 'hover:bg-black/5 text-black/40 hover:text-black'}`}><ChevronRight size={22} /></button>
          <div className="h-6 w-[1px] bg-black/10 mx-2" />
          <div className="flex gap-1">
            {['month', 'week', 'day'].map(v => (
               <button key={v} onClick={() => setView(v as any)} className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${view === v ? 'bg-accent text-white shadow-[0_5px_15px_rgba(var(--accent-color-rgb),0.3)]' : 'opacity-40 hover:opacity-80'}`}>{v === 'month' ? 'Mes' : v === 'week' ? 'Sem' : 'Día'}</button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
         <motion.div key={view + currentDate.toISOString()} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: "easeOut" }}>
            {view === 'month' ? renderMonthView() : view === 'week' ? renderWeekView() : renderDayView()}
         </motion.div>
      </AnimatePresence>
    </div>
  );
}
