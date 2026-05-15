import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Trophy, Clock, CheckCircle2, BookOpen, PlusCircle as PlusIcon, FileText, Bell, Trash2, X, Plus, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VERSES } from "../constants/assets";
import Modal from "../components/Modal";

const getLocalDateString = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - offset);
  return local.toISOString().split('T')[0];
};

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const REMINDER_COLORS = [
  { id: 'accent', bg: 'bg-accent', text: 'text-white', dot: 'bg-accent' },
  { id: 'blue', bg: 'bg-blue-500', text: 'text-white', dot: 'bg-blue-500' },
  { id: 'purple', bg: 'bg-purple-600', text: 'text-white', dot: 'bg-purple-600' },
  { id: 'emerald', bg: 'bg-emerald-500', text: 'text-white', dot: 'bg-emerald-500' },
  { id: 'rose', bg: 'bg-rose-500', text: 'text-white', dot: 'bg-rose-500' },
  { id: 'amber', bg: 'bg-amber-500', text: 'text-white', dot: 'bg-amber-500' },
  { id: 'indigo', bg: 'bg-indigo-600', text: 'text-white', dot: 'bg-indigo-600' },
];

export default function CalendarView({ isDark }: { isDark: boolean }) {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({ title: '', time: '', color: 'accent' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const { data: habits = [] } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data, error } = await supabase.from("habits").select("*");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("reminders").select("*").order("time", { ascending: true });
        if (error) {
          if (error.code === 'PGRST116' || error.message.includes('reminders')) return [];
          throw error;
        }
        return data || [];
      } catch (e) {
        return [];
      }
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

  // Mutations
  const addReminderMutation = useMutation({
    mutationFn: async (reminderData: any) => {
      if (!user) throw new Error("Sesión no encontrada");
      
      const payload = {
        title: reminderData.title.trim(),
        time: reminderData.time || null,
        color: reminderData.color,
        user_id: user.id,
        date: getLocalDateString(currentDate),
        completed: false
      };

      const { data, error } = await supabase.from("reminders").insert(payload).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setIsReminderModalOpen(false);
      setNewReminder({ title: '', time: '', color: 'accent' });
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Error al crear recordatorio");
    }
  });

  const handleReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminder.title.trim()) return;
    addReminderMutation.mutate(newReminder);
  };

  const toggleReminderMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string, completed: boolean }) => {
      const { error } = await supabase.from("reminders").update({ completed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] })
  });

  const deleteReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] })
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
            const dayReminders = Array.isArray(reminders) ? reminders.filter(r => r.date === dateStr) : [];
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
                  <div className="flex gap-0.5">
                    {dayReminders.slice(0, 3).map(r => {
                      const colorCfg = REMINDER_COLORS.find(c => c.id === r.color) || REMINDER_COLORS[0];
                      return <div key={r.id} className={`w-1 h-1 rounded-full ${colorCfg.dot}`} />;
                    })}
                  </div>
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
          const dayReminders = Array.isArray(reminders) ? reminders.filter(r => r.date === dateStr) : [];
          const isToday = dateStr === getLocalDateString(new Date());

          return (
            <div key={dateStr} onClick={() => { setCurrentDate(d); setView('day'); }} className={`border rounded-[1.5rem] p-4 flex flex-col gap-3 hover:scale-[1.02] transition-all cursor-pointer group ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10 shadow-md'} ${isToday ? 'ring-1 ring-accent' : ''}`}>
              <div className="text-center border-b border-black/5 pb-2">
                 <p className="text-[9px] uppercase font-bold opacity-30 tracking-widest">{DAY_NAMES[d.getDay()]}</p>
                 <p className={`text-xl font-bold mt-0.5 ${isToday ? 'text-accent' : 'opacity-80'}`}>{d.getDate()}</p>
              </div>
              <div className="flex-1 space-y-2">
                 <div className="flex flex-wrap gap-1 justify-center">
                    {dayLogs.map(l => <div key={l.id} className="w-2 h-2 rounded-sm bg-accent shadow-sm" />)}
                 </div>
                 {dayReminders.length > 0 && (
                   <div className="flex justify-center gap-0.5">
                     {dayReminders.slice(0, 3).map(r => {
                       const colorCfg = REMINDER_COLORS.find(c => c.id === r.color) || REMINDER_COLORS[0];
                       return <div key={r.id} className={`w-1 h-1 rounded-full ${colorCfg.dot}`} />;
                     })}
                   </div>
                 )}
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
    const dayReminders = Array.isArray(reminders) ? reminders.filter(r => r.date === dateStr) : [];
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className={`border rounded-[1.5rem] p-6 lg:p-8 space-y-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10 shadow-lg'}`}>
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

          <div className={`border rounded-[1.5rem] p-6 lg:p-8 space-y-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10 shadow-lg'}`}>
             <div className="flex items-center justify-between">
                <p className="text-[10px] opacity-30 font-bold uppercase tracking-widest flex items-center gap-2">
                  <Bell size={12} /> Planificación y Eventos
                </p>
                <button onClick={() => { setIsReminderModalOpen(true); setErrorMsg(null); }} className="p-2 rounded-xl bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all scale-90">
                   <Plus size={18} />
                </button>
             </div>

             <div className="space-y-3">
                {dayReminders.length > 0 ? dayReminders.map(reminder => {
                  const colorCfg = REMINDER_COLORS.find(c => c.id === reminder.color) || REMINDER_COLORS[0];
                  return (
                    <div key={reminder.id} className={`p-4 rounded-2xl border flex items-center gap-4 transition-all group ${isDark ? 'bg-black/20 border-white/5' : 'bg-black/[0.02] border-black/5'} ${reminder.completed ? 'opacity-30 grayscale' : ''}`}>
                       <button 
                         onClick={() => toggleReminderMutation.mutate({ id: reminder.id, completed: !reminder.completed })}
                         className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${reminder.completed ? `${colorCfg.bg} border-transparent text-white` : `border-${colorCfg.id === 'accent' ? 'accent' : colorCfg.id}-500/30 hover:border-${colorCfg.id === 'accent' ? 'accent' : colorCfg.id}-500`}`}
                       >
                          {reminder.completed && <CheckCircle2 size={12} />}
                       </button>
                       <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm ${reminder.completed ? 'line-through' : ''}`}>{reminder.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                             <div className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${colorCfg.bg} text-white`}>
                                {colorCfg.id}
                             </div>
                             {reminder.time && (
                               <p className="text-[10px] opacity-40 font-bold uppercase flex items-center gap-1">
                                  <Clock size={10} className={isDark ? 'text-white/60' : 'text-black/60'} /> {reminder.time}
                               </p>
                             )}
                          </div>
                       </div>
                       <button onClick={() => deleteReminderMutation.mutate(reminder.id)} className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={14} />
                       </button>
                    </div>
                  );
                }) : (
                  <div className="text-center py-8 opacity-20">
                     <p className="text-[10px] font-bold uppercase tracking-widest">No hay eventos para este día</p>
                  </div>
                )}
             </div>
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
    <div className={`p-3 md:p-6 max-w-7xl mx-auto font-inter space-y-4 lg:space-y-6 ${isDark ? 'dark' : ''}`}>
      <style>{`
        .dark-time-picker::-webkit-calendar-picker-indicator {
          filter: invert(1) !important;
          opacity: 0.7;
          cursor: pointer;
        }
        .dark-time-picker::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
      `}</style>
      
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

      <Modal isOpen={isReminderModalOpen} onClose={() => setIsReminderModalOpen(false)} title="Nuevo Recordatorio" isDark={isDark}>
         <div className={isDark ? 'dark' : ''}>
           <form onSubmit={handleReminderSubmit} className="space-y-6">
              {errorMsg && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-[10px] font-bold">
                   <AlertCircle size={16} />
                   <span>{errorMsg}</span>
                </motion.div>
              )}

              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">¿Qué necesitas recordar?</label>
                 <input 
                   autoFocus
                   type="text" 
                   placeholder="Ej: Reunión de proyecto..."
                   value={newReminder.title}
                   onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                   className={`w-full bg-transparent border-b-2 border-accent/20 focus:border-accent outline-none py-2 text-xl font-bold transition-all ${isDark ? 'text-white' : 'text-black'}`}
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Hora (Opcional)</label>
                    <div className="relative">
                      <input 
                        type="time" 
                        value={newReminder.time}
                        onChange={(e) => setNewReminder({...newReminder, time: e.target.value})}
                        className={`w-full p-3 rounded-xl border transition-all outline-none ${isDark ? 'bg-white/10 border-white/20 text-white dark-time-picker' : 'bg-black/5 border-black/10 text-black'}`}
                      />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Categoría</label>
                    <div className="flex flex-wrap gap-2 pt-1">
                       {REMINDER_COLORS.map(c => (
                          <button 
                            key={c.id} 
                            type="button"
                            onClick={() => setNewReminder({...newReminder, color: c.id})}
                            className={`w-7 h-7 rounded-full transition-all ${c.bg} ${newReminder.color === c.id ? 'ring-2 ring-offset-2 ring-accent scale-110' : 'opacity-30 hover:opacity-100 hover:scale-105'}`}
                          />
                       ))}
                    </div>
                 </div>
              </div>

              <div className="flex gap-3 pt-4">
                 <button type="button" onClick={() => setIsReminderModalOpen(false)} className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all ${isDark ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}>Cancelar</button>
                 <button 
                   type="submit"
                   disabled={!newReminder.title.trim() || addReminderMutation.isPending}
                   className="flex-2 py-4 bg-accent text-white rounded-2xl font-bold text-sm shadow-xl shadow-accent/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                 >
                   {addReminderMutation.isPending ? 'Guardando...' : 'Añadir Recordatorio'}
                 </button>
              </div>
           </form>
         </div>
      </Modal>
    </div>
  );
}
