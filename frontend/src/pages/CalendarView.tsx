import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Trophy, Clock, CheckCircle2, BookOpen, PlusCircle as PlusIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

const API_URL = "http://localhost:3001/api";

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
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/habit_logs`).then(r => r.json()).then(setLogs).catch(console.error);
    fetch(`${API_URL}/goals`).then(r => r.json()).then(setGoals).catch(console.error);
    fetch(`${API_URL}/habits`).then(r => r.json()).then(setHabits).catch(console.error);
  }, []);

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
      <div className={`border rounded-2xl overflow-hidden shadow-xl transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/[0.02] border-black/10'}`}>
        <div className={`grid grid-cols-7 border-b ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
          {DAY_NAMES.map(d => (
            <div key={d} className="py-3 text-center text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {blanks.map(b => <div key={`b-${b}`} className={`h-24 border-b border-r ${isDark ? 'border-white/5' : 'border-black/5'}`} />)}
          {days.map(day => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayLogs = logs.filter(l => l.date === dateStr && l.completed);
            const isToday = dateStr === getLocalDateString(new Date());
            return (
              <div key={day} onClick={() => { setCurrentDate(new Date(dateStr + "T00:00:00")); setView('day'); }} className={`h-24 border-b border-r p-2 flex flex-col gap-1 hover:bg-black/[0.03] transition-all cursor-pointer group ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                <span className={`text-xs font-bold ${isToday ? 'bg-accent text-white w-6 h-6 flex items-center justify-center rounded-lg shadow-lg' : 'opacity-40 group-hover:opacity-80'}`}>{day}</span>
                <div className="flex flex-wrap gap-1">
                  {dayLogs.map(l => <div key={l.id} className="w-1.5 h-1.5 rounded-full bg-accent" />)}
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
      <div className="grid grid-cols-7 gap-4 min-h-[400px]">
        {weekDays.map(d => {
          const dateStr = getLocalDateString(d);
          const dayLogs = logs.filter(l => l.date === dateStr && l.completed);
          const isToday = dateStr === getLocalDateString(new Date());

          return (
            <div key={dateStr} onClick={() => { setCurrentDate(d); setView('day'); }} className={`border rounded-2xl p-6 flex flex-col gap-4 hover:scale-[1.02] transition-all cursor-pointer group ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/[0.02] border-black/10'} ${isToday ? 'ring-2 ring-accent' : ''}`}>
              <div className="text-center border-b border-black/5 pb-4">
                 <p className="text-[10px] uppercase font-bold opacity-30 tracking-widest">{DAY_NAMES[d.getDay()]}</p>
                 <p className={`text-2xl font-bold ${isToday ? 'text-accent' : 'opacity-80'}`}>{d.getDate()}</p>
              </div>
              <div className="flex-1 space-y-3">
                 <div className="flex flex-wrap gap-1.5">
                    {dayLogs.map(l => <div key={l.id} className="w-2.5 h-2.5 rounded-sm bg-accent shadow-[0_0_8px_rgba(var(--accent-color-rgb),0.3)]" />)}
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
      <div className={`border rounded-2xl p-12 flex flex-col md:flex-row gap-12 ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/[0.02] border-black/10'}`}>
        <div className="flex-1">
          <h2 className="text-5xl font-bold mb-6 font-sf capitalize">{currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
          <button onClick={() => navigate(`/journal?date=${dateStr}`)} className="flex items-center gap-2 bg-accent text-white px-8 py-4 rounded-xl font-bold hover:brightness-110 transition-all shadow-xl"><BookOpen size={20} /> Diario del día</button>
        </div>
        <div className="w-full md:w-80 space-y-4">
           <div className={`p-6 rounded-2xl border ${isDark ? 'bg-black/30 border-white/5' : 'bg-white border-black/5'}`}>
              <p className="opacity-30 text-[10px] font-bold uppercase tracking-widest mb-4">Actividad</p>
              <div className="space-y-3">
                 {dayLogs.map(l => {
                    const h = habits.find(h => h.id === l.habit_id);
                    return <div key={l.id} className="flex items-center gap-3 font-bold text-sm"><CheckCircle2 size={16} className="text-accent" /> {h?.title}</div>;
                 })}
                 {dayLogs.length === 0 && <p className="opacity-10 italic text-sm">Sin actividad.</p>}
              </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-inter space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <h1 className="text-4xl font-bold flex items-center gap-4">
          <CalendarIcon className="text-accent w-10 h-10" /> Calendario
        </h1>
        <div className="flex items-center gap-4 bg-black/5 p-1.5 rounded-xl border border-black/5">
          <button onClick={prev} className="p-2 hover:bg-black/5 rounded-lg transition-colors"><ChevronLeft size={20} /></button>
          <span className="font-bold min-w-[200px] text-center uppercase tracking-widest text-xs">
            {view === 'month' ? currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : view === 'week' ? `Semana ${currentDate.getDate()} ${currentDate.toLocaleDateString('es-ES', { month: 'short' })}` : currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
          </span>
          <button onClick={next} className="p-2 hover:bg-black/5 rounded-lg transition-colors"><ChevronRight size={20} /></button>
          <div className="h-6 w-[1px] bg-black/10 mx-2" />
          {['month', 'week', 'day'].map(v => (
             <button key={v} onClick={() => setView(v as any)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${view === v ? 'bg-accent text-white shadow-lg' : 'opacity-40 hover:opacity-80'}`}>{v === 'month' ? 'Mes' : v === 'week' ? 'Sem' : 'Día'}</button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
         <motion.div key={view + currentDate.toISOString()} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            {view === 'month' ? renderMonthView() : view === 'week' ? renderWeekView() : renderDayView()}
         </motion.div>
      </AnimatePresence>
    </div>
  );
}
