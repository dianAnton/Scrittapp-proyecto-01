import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Trophy, Clock, CheckCircle2, BookOpen, PlusCircle as PlusIcon, FileText } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from '@tanstack/react-query';
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
  const navigate = useNavigate();
  const { user } = useAuth();

  // Queries
  const { data: logs = [] } = useQuery({
    queryKey: ['habit_logs'],
    queryFn: async () => {
      const { data, error } = await supabase.from("habit_logs").select("*");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data, error } = await supabase.from("goals").select("*");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: habits = [] } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data, error } = await supabase.from("habits").select("*");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: dayNotes = [] } = useQuery({
    queryKey: ['notes', getLocalDateString(currentDate)],
    queryFn: async () => {
      const dateStr = getLocalDateString(currentDate);
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("date", dateStr)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && view === 'day',
  });

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
      <div className={`w-full border rounded-[1.5rem] overflow-hidden shadow-xl transition-all duration-500 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'}`}>
        <div className={`grid grid-cols-7 border-b ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
          {DAY_NAMES.map(d => (
            <div key={d} className="py-2 text-center text-[9px] font-bold opacity-30 uppercase tracking-[0.1em]">{d}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7">
          {blanks.map(b => (
            <div key={`b-${b}`} className={`aspect-[4/3] md:aspect-[2/1] lg:aspect-[2/1] border-b border-r ${isDark ? 'border-white/5' : 'border-black/5'}`} />
          ))}
          {days.map(day => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayLogs = logs.filter(l => l.date === dateStr && l.completed);
            const isToday = dateStr === getLocalDateString(new Date());
            
            return (
              <div 
                key={day} 
                onClick={() => { 
                  const newDate = new Date(year, month, day);
                  setCurrentDate(newDate); 
                  setView('day'); 
                }} 
                className={`aspect-[4/3] md:aspect-[2/1] lg:aspect-[2/1] border-b border-r p-1.5 lg:p-2.5 flex flex-col gap-1 hover:bg-accent/10 transition-all cursor-pointer group relative overflow-hidden ${isDark ? 'border-white/5' : 'border-black/5'}`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-md transition-all ${isToday ? 'bg-accent text-white shadow-md' : 'opacity-40 group-hover:opacity-100 group-hover:text-accent'}`}>{day}</span>
                </div>
                
                <div className="flex flex-wrap gap-0.5 mt-auto">
                  {dayLogs.slice(0, 8).map(l => {
                    const h = habits.find(hab => hab.id === l.habit_id);
                    return (
                      <div 
                        key={l.id} 
                        className="w-1 h-1 rounded-full" 
                        style={{ backgroundColor: h ? `var(--accent-color)` : '#ccc' }} 
                      />
                    );
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {weekDays.map(d => {
          const dateStr = getLocalDateString(d);
          const dayLogs = logs.filter(l => l.date === dateStr && l.completed);
          const isToday = dateStr === getLocalDateString(new Date());

          return (
            <div key={dateStr} onClick={() => { setCurrentDate(d); setView('day'); }} className={`border rounded-[1.5rem] p-4 flex flex-col gap-3 hover:scale-[1.02] transition-all cursor-pointer group ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10 shadow-md'} ${isToday ? 'ring-1 ring-accent' : ''}`}>
              <div className="text-center border-b border-black/5 pb-2">
                 <p className="text-[9px] uppercase font-bold opacity-30 tracking-widest">{DAY_NAMES[d.getDay()]}</p>
                 <p className={`text-xl font-bold mt-0.5 ${isToday ? 'text-accent' : 'opacity-80'}`}>{d.getDate()}</p>
              </div>
              <div className="flex-1">
                 <div className="flex flex-wrap gap-1 justify-center">
                    {dayLogs.map(l => <div key={l.id} className="w-2 h-2 rounded-sm bg-accent shadow-sm" />)}
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 border rounded-[1.5rem] p-6 lg:p-8 space-y-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10 shadow-lg'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold font-sf capitalize mb-1">{currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
              <p className="text-[10px] opacity-30 font-bold uppercase tracking-widest flex items-center gap-2">
                <FileText size={12} /> Notas del día
              </p>
            </div>
            <button onClick={() => navigate(`/journal?date=${dateStr}`)} className="flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:brightness-110 transition-all shadow-md active:scale-95">
              <BookOpen size={16} /> Ver en Diario
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             {dayNotes.length > 0 ? dayNotes.map(note => (
               <div key={note.id} onClick={() => navigate(`/journal?date=${dateStr}&id=${note.id}`)} className={`p-4 rounded-xl border transition-all hover:bg-accent/5 cursor-pointer group relative ${isDark ? 'bg-black/20 border-white/5' : 'bg-black/[0.02] border-black/5'}`}>
                  <div className="flex items-center gap-2 mb-2 opacity-30">
                     <FileText size={12} className="text-accent" />
                     <span className="text-[8px] font-bold uppercase tracking-widest">Nota</span>
                  </div>
                  <h3 className={`text-sm font-bold mb-1 truncate ${isDark ? 'text-white' : 'text-black'}`}>{note.title}</h3>
                  <div 
                    className={`text-[10px] line-clamp-3 opacity-40 leading-relaxed ${isDark ? 'text-white' : 'text-black'}`}
                    dangerouslySetInnerHTML={{ __html: note.content }}
                  />
               </div>
             )) : (
               <div className={`col-span-full py-12 rounded-2xl border border-dashed flex flex-col items-center justify-center opacity-20 ${isDark ? 'border-white/20' : 'border-black/20'}`}>
                  <FileText size={32} className="mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Sin notas</p>
               </div>
             )}
          </div>
        </div>

        <div className="space-y-4">
           <div className={`p-6 rounded-[1.5rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10 shadow-lg'}`}>
              <p className="opacity-30 text-[9px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><CheckCircle2 size={12} /> Hábitos</p>
              <div className="space-y-2">
                 {dayLogs.map(l => {
                    const h = habits.find(hab => hab.id === l.habit_id);
                    return (
                      <div key={l.id} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white bg-accent shadow-sm scale-90">
                          <CheckCircle2 size={14} />
                        </div>
                        <span className={`font-bold text-xs ${isDark ? 'text-white/80' : 'text-black/80'}`}>{h?.title}</span>
                      </div>
                    );
                 })}
                 {dayLogs.length === 0 && (
                   <p className="text-center py-4 text-[10px] opacity-20 italic">Nada por hoy.</p>
                 )}
              </div>
           </div>

           <div className={`p-6 rounded-[1.5rem] border bg-gradient-to-br from-accent/10 to-transparent relative overflow-hidden ${isDark ? 'border-white/5' : 'border-black/5'}`}>
              <div className="absolute top-[-10px] right-[-10px] opacity-5 text-accent rotate-12">
                 <Trophy size={80} />
              </div>
              <p className="text-accent text-[8px] font-bold uppercase tracking-widest mb-2">Reflexión</p>
              <p className={`text-sm font-light italic leading-relaxed mb-3 relative z-10 ${isDark ? 'text-white/90' : 'text-black/90'}`}>"{dayVerse?.text}"</p>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">— {dayVerse?.author}</p>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto font-inter space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-black'}`}>
            <CalendarIcon className="text-accent w-8 h-8" /> Calendario
          </h1>
        </div>
        
        <div className={`flex items-center gap-3 p-1.5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
          <div className="flex items-center">
            <button onClick={prev} className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-black'}`}><ChevronLeft size={20} /></button>
            <span className={`font-bold min-w-[140px] text-center uppercase tracking-widest text-[10px] ${isDark ? 'text-white' : 'text-black'}`}>
              {view === 'month' ? currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : view === 'week' ? `Sem ${currentDate.getDate()} ${currentDate.toLocaleDateString('es-ES', { month: 'short' })}` : currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
            </span>
            <button onClick={next} className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-black'}`}><ChevronRight size={20} /></button>
          </div>
          
          <div className="flex gap-1 p-0.5 bg-black/10 rounded-lg">
            {['month', 'week', 'day'].map(v => (
               <button 
                 key={v} 
                 onClick={() => setView(v as any)} 
                 className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${view === v ? 'bg-accent text-white shadow-md' : 'opacity-40 hover:opacity-100'}`}
               >
                 {v === 'month' ? 'Mes' : v === 'week' ? 'Sem' : 'Día'}
               </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
         <motion.div 
           key={view + currentDate.toISOString()} 
           initial={{ opacity: 0, y: 10 }} 
           animate={{ opacity: 1, y: 0 }} 
           exit={{ opacity: 0, y: -10 }} 
           transition={{ duration: 0.2 }}
           className="w-full"
         >
            {view === 'month' ? renderMonthView() : view === 'week' ? renderWeekView() : renderDayView()}
         </motion.div>
      </AnimatePresence>
    </div>
  );
}
