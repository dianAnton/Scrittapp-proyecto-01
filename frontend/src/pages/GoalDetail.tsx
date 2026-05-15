import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Target, ArrowLeft, Calendar, BarChart3, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "../lib/supabaseClient";

export default function GoalDetail({ isDark }: { isDark: boolean }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState<any>(null);
  const [habits, setHabits] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoalDetail = async () => {
      if (!id) return;
      
      const { data: goalData, error: goalError } = await supabase
        .from("goals")
        .select("*")
        .eq("id", id)
        .single();
      
      if (goalError) {
        console.error(goalError);
        setLoading(false);
        return;
      }

      const { data: habitGoalLinks } = await supabase
        .from("habit_goals")
        .select(`
          habits (*)
        `)
        .eq("goal_id", id);
      
      const habitsData = habitGoalLinks?.map((link: any) => link.habits).filter(Boolean) || [];
      const habitIds = habitsData.map((h: any) => h.id);
      let logsData: any[] = [];
      if (habitIds.length > 0) {
        const { data } = await supabase
          .from("habit_logs")
          .select("*")
          .in("habit_id", habitIds)
          .eq("completed", true);
        logsData = data || [];
      }
      
      setGoal(goalData);
      setHabits(habitsData || []);
      setLogs(logsData);
      setLoading(false);
    };

    fetchGoalDetail();
  }, [id]);

  if (loading) return <div className="p-20 text-center opacity-20">Cargando meta...</div>;
  if (!goal) return <div className="p-20 text-center">Meta no encontrada.</div>;

  // Real Data Calculations
  const totalLogs = logs.length;
  const uniqueLogDays = new Set(logs.map(l => l.date)).size;
  
  let progress = 0;
  if (goal.type === 'amount' && goal.target_number) {
    const totalAmount = logs.reduce((acc, curr) => acc + (curr.value || 0), 0);
    progress = Math.min(100, Math.round((totalAmount / goal.target_number) * 100));
  } else {
    // If not amount, progress is based on consistency vs time if deadline exists, 
    // or simply total completions vs a relative "target" of habits.
    // Let's use a simpler metric: total completions / 100 (cap at 100)
    progress = Math.min(100, totalLogs * 5); 
  }

  const today = new Date();
  const heatmapDays = Array.from({ length: 180 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (179 - i));
    return d.toISOString().split('T')[0];
  });

  const monthLabels = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
    return d.toLocaleDateString('es-ES', { month: 'short' });
  });

  const colorClasses: any = {
    'bg-red-500': { bg: 'bg-red-500', text: 'text-red-500', lightBg: 'bg-red-500/20', border: 'border-red-500/20' },
    'bg-amber-500': { bg: 'bg-amber-500', text: 'text-amber-500', lightBg: 'bg-amber-500/20', border: 'border-amber-500/20' },
    'bg-blue-500': { bg: 'bg-blue-500', text: 'text-blue-500', lightBg: 'bg-blue-500/20', border: 'border-blue-500/20' },
  };
  const goalTheme = colorClasses[goal.color] || { bg: 'bg-accent', text: 'text-accent', lightBg: 'bg-accent/20', border: 'border-accent/20' };

  return (
    <div className="p-8 max-w-7xl mx-auto font-inter space-y-10">
      <button onClick={() => navigate('/goals')} className={`flex items-center gap-2 transition-colors group ${isDark ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black'}`}>
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Regresar a Metas
      </button>

      <div className={`border rounded-[2rem] p-10 backdrop-blur-3xl transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/10 shadow-xl'}`}>
         <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
               <div className={`p-6 rounded-2xl ${goalTheme.lightBg} ${goalTheme.text} shadow-xl`}><Target size={40} /></div>
               <div>
                  <h1 className={`text-4xl font-bold font-sf ${isDark ? 'text-white' : 'text-[#2A1D11]'}`}>{goal.title}</h1>
                  <div className="flex flex-wrap gap-4 mt-2">
                     <p className="opacity-40 flex items-center gap-2 text-sm"><Calendar size={14} /> Plazo: {goal.target_date || "Sin definir"}</p>
                     <p className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${goalTheme.border} ${goalTheme.text}`}>{goal.priority} prioridad</p>
                  </div>
               </div>
            </div>
          </div>
         {goal.description && (
            <div className={`mt-10 p-6 rounded-xl border ${isDark ? 'bg-white/5 border-white/5 text-white/60' : 'bg-black/5 border-black/5 text-black/60'} text-sm leading-relaxed italic`}>
               "{goal.description}"
            </div>
         )}
      </div>

      <div className={`border rounded-[2rem] p-10 backdrop-blur-3xl transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/10 shadow-xl'}`}>
         <h2 className="text-2xl font-bold mb-10 flex items-center gap-3 font-sf"><BarChart3 className={goalTheme.text} /> Línea de Tiempo</h2>
         <div className="space-y-4">
            <div className="flex justify-between px-2 opacity-20 text-[10px] uppercase font-bold tracking-widest">
               {monthLabels.map(m => <span key={m}>{m}</span>)}
            </div>
            <div className="flex flex-wrap gap-[4px]">
               {heatmapDays.map(date => {
                  const hasActivity = logs.some(l => l.date === date);
                  return (
                    <div 
                      key={date} 
                      className={`w-[14px] h-[14px] rounded-sm transition-all hover:scale-150 cursor-pointer ${hasActivity ? goalTheme.bg : isDark ? 'bg-white/5' : 'bg-black/5'}`} 
                      title={date} 
                    />
                  );
               })}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className={`border rounded-[2rem] p-10 backdrop-blur-3xl transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/10 shadow-xl'}`}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3"><TrendingUp className={goalTheme.text} /> Análisis de Impacto</h2>
            <div className="space-y-6">
               {[
                  { label: "Días con actividad", val: `${uniqueLogDays} días`, percentage: Math.min(100, (uniqueLogDays/30)*100), col: goalTheme.bg },
                  { label: "Total de registros", val: `${totalLogs} logs`, percentage: Math.min(100, (totalLogs/50)*100), col: goalTheme.bg },
               ].map(stat => (
                  <div key={stat.label}>
                     <div className="flex justify-between mb-2"><span className="text-sm opacity-50">{stat.label}</span><span className="text-sm font-bold">{stat.val}</span></div>
                  </div>
               ))}
            </div>
         </div>

         <div className={`border rounded-[2rem] p-10 backdrop-blur-3xl transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/10 shadow-xl'}`}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3"><CheckCircle2 className={goalTheme.text} /> Hábitos Vinculados</h2>
            <div className="space-y-3">
               {habits?.map((h: any) => (
                  <div key={h.id} className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-black/5 border-black/5'}`}>
                     <span className="font-bold">{h.title}</span>
                     <span className="text-xs opacity-30 capitalize">{h.measurement_type}</span>
                  </div>
               ))}
               {(!habits || habits.length === 0) && <p className="opacity-20 italic text-sm">No hay hábitos vinculados a esta meta.</p>}
            </div>
         </div>
      </div>
    </div>
  );
}
