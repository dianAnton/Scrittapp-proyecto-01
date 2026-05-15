import { useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, Target, ArrowRight, Zap, Dumbbell, Clock, Hash, Timer, Plus, X } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import Modal from "../components/Modal";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const getLocalDateString = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - offset);
  return local.toISOString().split('T')[0];
};

export default function Dashboard({ isDark }: { isDark: boolean }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [offsetDays, setOffsetDays] = useState(0);
  const [logModal, setLogModal] = useState<{ isOpen: boolean, habit: any, date: string, value: string, workoutData?: any[], duration?: string } | null>(null);

  // Queries
  const { data: habits = [] } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data, error } = await supabase.from("habits").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data, error } = await supabase.from("goals").select("*").eq("completed", false).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['logs'],
    queryFn: async () => {
      const { data, error } = await supabase.from("habit_logs").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const daysCount = 14;
  const today = new Date();
  today.setDate(today.getDate() - offsetDays);
  
  const last14Days = Array.from({ length: daysCount }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (daysCount - 1 - i));
    return getLocalDateString(d);
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ habitId, date, isCompleted, val }: any) => {
      const { error } = await supabase
        .from("habit_logs")
        .upsert({
          user_id: user!.id,
          habit_id: habitId,
          date,
          completed: !isCompleted,
          value: !isCompleted ? val : 0
        }, { onConflict: 'habit_id, date' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });

  const logMutation = useMutation({
    mutationFn: async (logData: any) => {
      const { error } = await supabase
        .from("habit_logs")
        .upsert(logData, { onConflict: 'habit_id, date' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });

  const logsMap = logs.reduce((acc: any, log: any) => {
    acc[`${log.habit_id}-${log.date}`] = !!log.completed;
    return acc;
  }, {});

  const toggleHabit = async (habitId: string, date: string) => {
    if (!user) return;
    const isCompleted = logsMap[`${habitId}-${date}`];
    const habit = habits.find(h => h.id === habitId);
    
    if (!isCompleted && habit && habit.measure_type !== 'boolean') {
      const initialWorkoutData = habit.measure_type === 'training' 
        ? (habit.exercise_template || []).map((ex: any) => ({ ...ex, actualSets: ex.sets, actualReps: ex.reps, actualRest: ex.rest }))
        : undefined;

      setLogModal({ 
        isOpen: true, 
        habit, 
        date, 
        value: habit.target_value?.toString() || "",
        workoutData: initialWorkoutData,
        duration: ""
      });
      return;
    }

    toggleMutation.mutate({ 
      habitId, 
      date, 
      isCompleted, 
      val: habit?.target_value || 1 
    });
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !logModal) return;

    const val = logModal.habit.measure_type === 'training' ? 1 : parseFloat(logModal.value);
    const isCompleted = logModal.habit.measure_type === 'training' ? true : val >= (logModal.habit.target_value || 0);

    logMutation.mutate({
      user_id: user.id,
      habit_id: logModal.habit.id,
      date: logModal.date,
      completed: isCompleted,
      value: val,
      workout_data: logModal.workoutData || [],
      duration: logModal.duration ? parseInt(logModal.duration) : null
    });
    
    setLogModal(null);
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
      <div className={`backdrop-blur-3xl border rounded-2xl p-8 transition-all ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/10 shadow-xl'}`}>
         <div className="flex items-center justify-between mb-8">
            <h2 className={`text-2xl font-bold flex items-center gap-3 font-sf ${isDark ? 'text-white' : 'text-[#2A1D11]'}`}><Target className="text-accent" /> Metas y Objetivos</h2>
            <button onClick={() => navigate('/goals')} className="text-accent font-bold text-sm hover:underline flex items-center gap-2">Ver todas <ArrowRight size={16} /></button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map(goal => {
               const progress = calculateGoalProgress(goal);
               return (
                  <div key={goal.id} onClick={() => navigate(`/goals/${goal.id}`)} className={`p-4 rounded-2xl border flex items-center gap-4 hover:scale-[1.02] transition-all cursor-pointer group ${isDark ? 'bg-black/20 border-white/5' : 'bg-black/5 border-black/5'}`}>
                     <div className={`p-3 rounded-xl ${goal.color?.replace('bg-', 'bg-opacity-20 text-') || 'bg-accent/20 text-accent'} text-white`}>
                        {goal.type === 'amount' ? <Zap size={20} /> : <Target size={20} />}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                           <div className="flex items-center gap-2 truncate">
                              <div className={`w-1.5 h-1.5 rounded-full ${goal.color || 'bg-accent'}`} />
                              <p className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-[#2A1D11]'}`}>{goal.title}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>

      <div className={`backdrop-blur-3xl border rounded-2xl p-8 shadow-2xl transition-all ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/10 shadow-xl'}`}>
        <div className="flex items-center justify-between mb-8">
          <h2 className={`text-2xl font-bold flex items-center gap-3 font-sf ${isDark ? 'text-white' : 'text-[#2A1D11]'}`}><Zap className="text-accent" /> Hábitos Diarios</h2>
          <div className="flex items-center gap-4 bg-black/5 p-1 rounded-xl border border-black/5 shrink-0">
             <button onClick={() => setOffsetDays(offsetDays + 7)} className={`p-2 rounded-lg transition-all ${isDark ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-black/40 hover:text-black hover:bg-black/10'}`}><ChevronLeft size={18} /></button>
             <button onClick={() => setOffsetDays(Math.max(0, offsetDays - 7))} disabled={offsetDays === 0} className={`p-2 rounded-lg transition-all disabled:opacity-10 ${isDark ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-black/40 hover:text-black hover:bg-black/10'}`}><ChevronRight size={18} /></button>
          </div>
        </div>

        <div className="overflow-x-auto pb-4 custom-scrollbar-thin relative">
          <div className="min-w-fit">
            {/* Header Row */}
            <div className="flex mb-4 relative">
              {/* Sticky Habit Label Header */}
              <div className={`sticky left-0 z-30 w-[140px] md:w-[180px] pr-4 flex-shrink-0 font-bold text-[9px] uppercase tracking-widest opacity-20 ${isDark ? 'text-white' : 'text-black'}`}>
                Hábitos
              </div>
              
              {/* Scrolling Days Header */}
              <div className="flex gap-1" style={{ maskImage: 'linear-gradient(to right, transparent, black 20px)' }}>
                {last14Days.map(date => {
                  const d = new Date(date + "T00:00:00");
                  const isToday = date === getLocalDateString(new Date());
                  return (
                    <div key={date} className="flex flex-col items-center min-w-[32px] md:min-w-[38px]">
                      <span className={`text-[9px] uppercase font-bold ${isToday ? 'text-accent' : 'opacity-30'}`}>{d.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                      <span className={`text-xs font-bold ${isToday ? 'opacity-100' : 'opacity-50'}`} style={{ color: isToday ? 'var(--accent-color)' : undefined }}>{d.getDate()}</span>
                    </div>
                  );
                })}
              </div>

              {/* Fixed Stats Header */}
              <div className="grid grid-cols-3 gap-2 text-center text-[8px] uppercase font-bold opacity-20 tracking-widest pl-4 min-w-[120px]">
                <span>Racha</span><span>Máx</span><span>Total</span>
              </div>
            </div>

            {/* Habit Rows */}
            <div className="space-y-1">
              {habits.map(habit => {
                const stats = calculateStats(habit.id);
                return (
                  <div key={habit.id} className="flex items-center group">
                    {/* Sticky Habit Name */}
                    <div 
                      className={`sticky left-0 z-20 w-[140px] md:w-[180px] pr-4 transition-colors cursor-pointer font-bold text-[12px] md:text-[13px] truncate ${isDark ? 'text-white/70 group-hover:text-emerald-400' : 'text-[#2A1D11]/70 group-hover:text-emerald-600'}`} 
                      onClick={() => navigate(`/habits/${habit.id}`)}
                    >
                      {habit.title}
                    </div>

                    {/* Scrolling History with Mask */}
                    <div className="flex gap-1" style={{ maskImage: 'linear-gradient(to right, transparent, black 20px)' }}>
                      {last14Days.map(date => (
                        <div key={date} onClick={() => toggleHabit(habit.id, date)} className={`w-8 h-8 md:w-9.5 md:h-9.5 rounded-sm transition-all cursor-pointer border border-transparent flex-shrink-0 ${getCellStyle(habit.id, date)}`} />
                      ))}
                    </div>

                    {/* Fixed Stats */}
                    <div className="grid grid-cols-3 gap-2 pl-4 text-center items-center min-w-[120px]">
                       <div className="flex flex-col items-center"><div className="w-7 h-7 rounded-lg border border-emerald-500/20 flex items-center justify-center text-[9px] font-bold">{stats.current}</div></div>
                       <div className="flex flex-col items-center"><div className="w-7 h-7 rounded-lg border border-black/5 flex items-center justify-center text-[9px] font-bold opacity-30">{stats.longest}</div></div>
                       <div className="text-xs font-bold opacity-20">{stats.total}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      <Modal isOpen={!!logModal?.isOpen} onClose={() => setLogModal(null)} title={logModal?.habit?.measure_type === 'training' ? "Resumen de Entrenamiento" : "Registrar Progreso"} isDark={isDark}>
        <form onSubmit={handleLogSubmit} className="space-y-6">
          {logModal?.habit?.measure_type === 'training' ? (
            <div className="space-y-6">
              <div className={`flex items-center gap-4 p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                <div className="bg-accent/20 p-3 rounded-xl">
                   <Clock className="text-accent" size={20} />
                </div>
                <div className="flex-1">
                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Duración Total (Minutos)</label>
                  <input 
                    type="number"
                    placeholder="Ej: 45"
                    value={logModal.duration}
                    onChange={(e) => setLogModal({...logModal, duration: e.target.value})}
                    className={`w-full bg-transparent text-xl font-bold outline-none no-spinner ${isDark ? 'text-white' : 'text-black'}`}
                  />
                </div>
              </div>

              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {logModal.workoutData?.map((ex, idx) => (
                  <div key={idx} className={`border rounded-2xl p-5 space-y-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10 shadow-sm'}`}>
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                        <Dumbbell size={16} className="text-accent" /> {ex.name}
                      </h4>
                      <button 
                        type="button"
                        onClick={() => {
                          const newData = logModal.workoutData?.filter((_, i) => i !== idx);
                          setLogModal({...logModal, workoutData: newData});
                        }}
                        className={`transition-colors ${isDark ? 'text-white/20 hover:text-red-400' : 'text-black/20 hover:text-red-400'}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className={`text-[8px] font-bold uppercase tracking-wider ${isDark ? 'text-white/30' : 'text-black/30'}`}>Series</label>
                        <input 
                          type="number"
                          value={ex.actualSets}
                          onChange={(e) => {
                            const newData = [...logModal.workoutData!];
                            newData[idx].actualSets = e.target.value;
                            setLogModal({...logModal, workoutData: newData});
                          }}
                          className={`w-full bg-black/5 rounded-lg py-2 px-3 text-sm font-bold outline-none no-spinner ${isDark ? 'text-white bg-white/5' : 'text-black bg-black/5'}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={`text-[8px] font-bold uppercase tracking-wider ${isDark ? 'text-white/30' : 'text-black/30'}`}>Reps</label>
                        <input 
                          type="number"
                          value={ex.actualReps}
                          onChange={(e) => {
                            const newData = [...logModal.workoutData!];
                            newData[idx].actualReps = e.target.value;
                            setLogModal({...logModal, workoutData: newData});
                          }}
                          className={`w-full bg-black/5 rounded-lg py-2 px-3 text-sm font-bold outline-none no-spinner ${isDark ? 'text-white bg-white/5' : 'text-black bg-black/5'}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={`text-[8px] font-bold uppercase tracking-wider ${isDark ? 'text-white/30' : 'text-black/30'}`}>Descanso</label>
                        <input 
                          type="number"
                          value={ex.actualRest}
                          onChange={(e) => {
                            const newData = [...logModal.workoutData!];
                            newData[idx].actualRest = e.target.value;
                            setLogModal({...logModal, workoutData: newData});
                          }}
                          className={`w-full bg-black/5 rounded-lg py-2 px-3 text-sm font-bold outline-none no-spinner ${isDark ? 'text-white bg-white/5' : 'text-black bg-black/5'}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button 
                  type="button"
                  onClick={() => {
                    const newData = [...(logModal.workoutData || []), { name: "", actualSets: "", actualReps: "", actualRest: "" }];
                    setLogModal({...logModal, workoutData: newData});
                  }}
                  className={`w-full py-4 border-2 border-dashed rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isDark ? 'border-white/10 text-white/20 hover:border-accent/40 hover:text-accent/60' : 'border-black/10 text-black/20 hover:border-accent/40 hover:text-accent/60'}`}
                >
                  <Plus size={14} /> Añadir Ejercicio Extra
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                Valor registrado ({logModal?.habit?.unit || 'cantidad'})
              </label>
              <input 
                type="number"
                autoFocus
                value={logModal?.value}
                onChange={(e) => setLogModal(prev => prev ? {...prev, value: e.target.value} : null)}
                className={`w-full text-4xl font-bold bg-transparent outline-none no-spinner ${isDark ? 'text-white' : 'text-black'}`}
              />
              <p className="text-xs opacity-40">Meta diaria: {logModal?.habit?.target_value} {logModal?.habit?.unit}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={() => setLogModal(null)}
              className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all ${isDark ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-2 py-4 bg-accent text-white rounded-2xl font-bold text-sm shadow-xl shadow-accent/20 hover:brightness-110 active:scale-95 transition-all"
            >
              Finalizar Registro
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
