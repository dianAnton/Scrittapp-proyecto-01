import { useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, Target, ArrowRight, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

const getLocalDateString = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - offset);
  return local.toISOString().split('T')[0];
};

export default function Dashboard({ isDark }: { isDark: boolean }) {
  const [habits, setHabits] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [offsetDays, setOffsetDays] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  const daysCount = 14;
  const today = new Date();
  today.setDate(today.getDate() - offsetDays);
  
  const last14Days = Array.from({ length: daysCount }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (daysCount - 1 - i));
    return getLocalDateString(d);
  });

  const fetchData = async () => {
    if (!user) return;
    try {
      const [hRes, gRes, lRes] = await Promise.all([
        supabase.from("habits").select("*"),
        supabase.from("goals").select("*").order("created_at", { ascending: false }),
        supabase.from("habit_logs").select("*")
      ]);
      
      if (hRes.data) setHabits(hRes.data);
      if (gRes.data) setGoals(gRes.data);
      if (lRes.data) setLogs(lRes.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { 
    if (user) fetchData(); 
  }, [user]);

  const logsMap = logs.reduce((acc: any, log: any) => {
    acc[`${log.habit_id}-${log.date}`] = !!log.completed;
    return acc;
  }, {});

  const toggleHabit = async (habitId: string, date: string) => {
    if (!user) return;
    const isCompleted = logsMap[`${habitId}-${date}`];
    const habit = habits.find(h => h.id === habitId);
    
    try {
      const { error } = await supabase
        .from("habit_logs")
        .upsert({
          user_id: user.id,
          habit_id: habitId,
          date,
          completed: !isCompleted,
          value: !isCompleted ? (habit?.target_value || 1) : 0
        }, { onConflict: 'habit_id, date' });

      if (error) throw error;
      fetchData();
    } catch (e) { console.error(e); }
  };

  const getStreakAtDate = (habitId: string, dateStr: string) => {
    let streak = 0;
    const d = new Date(dateStr + "T00:00:00");
    while (logsMap[`${habitId}-${getLocalDateString(d)}`]) { streak++; d.setDate(d.getDate() - 1); }
    return streak;
  };

  const getCellStyle = (habitId: string, date: string) => {
    const isCompleted = logsMap[`${habitId}-${date}`];
    if (!isCompleted) return isDark ? "bg-white/5" : "bg-black/5";
    
    const streak = getStreakAtDate(habitId, date);
    const opacities = ['opacity-40', 'opacity-55', 'opacity-70', 'opacity-85', 'opacity-100'];
    const opacity = opacities[Math.min(streak - 1, 4)];
    const color = habits.find(h => h.id === habitId)?.color_theme || 'emerald';
    const colorClasses: Record<string, string> = {
      emerald: 'bg-emerald-500', blue: 'bg-blue-500', cyan: 'bg-cyan-500', red: 'bg-red-500', orange: 'bg-accent', purple: 'bg-purple-500', pink: 'bg-pink-500', indigo: 'bg-indigo-500', yellow: 'bg-yellow-500'
    };
    return `${colorClasses[color] || 'bg-accent'} ${opacity}`;
  };

  const calculateStats = (habitId: string) => {
    let current = 0, longest = 0, total = logs.filter(l => l.habit_id === habitId && l.completed).length;
    let d = new Date();
    while (logsMap[`${habitId}-${getLocalDateString(d)}`]) { current++; d.setDate(d.getDate() - 1); }
    const sortedLogs = logs.filter(l => l.habit_id === habitId && l.completed).map(l => l.date).sort();
    let temp = 0, prevD: Date | null = null;
    sortedLogs.forEach(ds => {
       const cd = new Date(ds + "T00:00:00");
       if (prevD && (cd.getTime() - prevD.getTime()) === 86400000) temp++; else temp = 1;
       if (temp > longest) longest = temp; prevD = cd;
    });
    return { current, longest, total };
  };

  const calculateGoalProgress = (goal: any) => {
    const goalHabits = habits.filter(h => h.goal_id === goal.id);
    const habitIds = goalHabits.map(h => h.id);
    const goalLogs = logs.filter(l => habitIds.includes(l.habit_id) && l.completed);
    
    if (goal.type === 'amount' && goal.target_number) {
      const totalAmount = goalLogs.reduce((acc, curr) => acc + (curr.value || 0), 0);
      return Math.min(100, Math.round((totalAmount / goal.target_number) * 100));
    }
    return Math.min(100, goalLogs.length * 5);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-inter">
      <div className={`backdrop-blur-3xl border rounded-2xl p-10 transition-all ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/10 shadow-xl'}`}>
         <div className="flex items-center justify-between mb-8">
            <h2 className={`text-2xl font-bold flex items-center gap-3 font-sf ${isDark ? 'text-white' : 'text-[#2A1D11]'}`}><Target className="text-accent" /> Metas y Objetivos</h2>
            <button onClick={() => navigate('/goals')} className="text-accent font-bold text-sm hover:underline flex items-center gap-2">Ver todas <ArrowRight size={16} /></button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map(goal => {
               const progress = calculateGoalProgress(goal);
               return (
                  <div key={goal.id} onClick={() => navigate(`/goals/${goal.id}`)} className={`p-6 rounded-2xl border flex items-center gap-6 hover:scale-[1.02] transition-all cursor-pointer group ${isDark ? 'bg-black/20 border-white/5' : 'bg-black/5 border-black/5'}`}>
                     <div className={`p-4 rounded-xl ${goal.color?.replace('bg-', 'bg-opacity-20 text-') || 'bg-accent/20 text-accent'} text-white`}>
                        {goal.type === 'amount' ? <Zap size={20} /> : <Target size={20} />}
                     </div>
                     <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                           <div className="flex items-center gap-2 truncate">
                              <div className={`w-1.5 h-1.5 rounded-full ${goal.color || 'bg-accent'}`} />
                              <p className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-[#2A1D11]'}`}>{goal.title}</p>
                           </div>
                           <span className="text-[10px] font-bold opacity-30">{progress}%</span>
                        </div>
                        <div className="w-full h-1 bg-black/5 rounded-full overflow-hidden">
                           <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              className={`h-full ${goal.color || 'bg-accent'} rounded-full`} 
                           />
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>

      <div className={`backdrop-blur-3xl border rounded-2xl p-10 shadow-2xl transition-all ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/10 shadow-xl'}`}>
        <div className="flex items-center justify-between mb-10">
          <h2 className={`text-2xl font-bold flex items-center gap-3 font-sf ${isDark ? 'text-white' : 'text-[#2A1D11]'}`}><Zap className="text-accent" /> Hábitos Diarios</h2>
          <div className="flex items-center gap-4 bg-black/5 p-1 rounded-xl border border-black/5">
             <button onClick={() => setOffsetDays(offsetDays + 7)} className={`p-2 rounded-lg transition-all ${isDark ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-black/40 hover:text-black hover:bg-black/10'}`}><ChevronLeft size={18} /></button>
             <button onClick={() => setOffsetDays(Math.max(0, offsetDays - 7))} disabled={offsetDays === 0} className={`p-2 rounded-lg transition-all disabled:opacity-10 ${isDark ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-black/40 hover:text-black hover:bg-black/10'}`}><ChevronRight size={18} /></button>
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="min-w-[950px]">
            <div className="grid grid-cols-[220px_repeat(14,44px)_1fr] gap-1 mb-6">
              <div />
              {last14Days.map(date => {
                const d = new Date(date + "T00:00:00");
                const isToday = date === getLocalDateString(new Date());
                return (
                  <div key={date} className="flex flex-col items-center">
                    <span className={`text-[10px] uppercase font-bold ${isToday ? 'text-accent' : 'opacity-40'}`}>{d.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                    <span className={`text-sm font-bold ${isToday ? 'opacity-100' : 'opacity-60'}`} style={{ color: isToday ? 'var(--accent-color)' : undefined }}>{d.getDate()}</span>
                  </div>
                );
              })}
              <div className="grid grid-cols-3 gap-2 text-center text-[9px] uppercase font-bold opacity-30 tracking-widest pl-6"><span>Racha</span><span>Máx</span><span>Total</span></div>
            </div>

            <div className="space-y-1.5">
              {habits.map(habit => {
                const stats = calculateStats(habit.id);
                return (
                  <div key={habit.id} className="grid grid-cols-[220px_repeat(14,44px)_1fr] gap-1 items-center group">
                    <div className={`font-bold text-sm truncate pr-4 transition-colors cursor-pointer opacity-70 group-hover:opacity-100 ${isDark ? 'text-white group-hover:text-emerald-400' : 'text-[#2A1D11] group-hover:text-emerald-600'}`} onClick={() => navigate(`/habits/${habit.id}`)}>{habit.title}</div>
                    {last14Days.map(date => (
                      <div key={date} onClick={() => toggleHabit(habit.id, date)} className={`w-11 h-11 rounded-sm transition-all cursor-pointer border border-transparent ${getCellStyle(habit.id, date)}`} />
                    ))}
                    <div className="grid grid-cols-3 gap-2 pl-6 text-center items-center">
                       <div className="flex flex-col items-center"><div className="w-9 h-9 rounded-lg border border-emerald-500/20 flex items-center justify-center text-[11px] font-bold">{stats.current}</div></div>
                       <div className="flex flex-col items-center"><div className="w-9 h-9 rounded-lg border border-black/5 flex items-center justify-center text-[11px] font-bold opacity-40">{stats.longest}</div></div>
                       <div className="text-base font-bold opacity-20">{stats.total}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RESTORED SUMMARY ROW */}
            <div className="grid grid-cols-[220px_repeat(14,44px)_1fr] gap-1 mt-6 pt-6 border-t border-black/5">
               <div className={`text-[10px] uppercase font-bold tracking-widest opacity-30 ${isDark ? 'text-white' : 'text-black'}`}>Habitos Realizados</div>
               {last14Days.map(date => (
                  <div key={date} className={`text-center text-sm font-bold opacity-30 ${isDark ? 'text-white' : 'text-black'}`}>
                     {habits.filter(h => logsMap[`${h.id}-${date}`]).length}
                  </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
