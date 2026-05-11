import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Target, ArrowLeft, Calendar, BarChart3, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { motion } from "motion/react";

const API_URL = "http://localhost:3001/api";

export default function GoalDetail({ isDark }: { isDark: boolean }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/goals/${id}`)
      .then(r => r.json())
      .then(data => { setGoal(data); setLoading(false); })
      .catch(console.error);
  }, [id]);

  if (loading) return <div className="p-20 text-center opacity-20">Cargando meta...</div>;
  if (!goal) return <div className="p-20 text-center">Meta no encontrada.</div>;

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

  return (
    <div className="p-8 max-w-7xl mx-auto font-inter space-y-10">
      <button onClick={() => navigate('/goals')} className={`flex items-center gap-2 transition-colors group ${isDark ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black'}`}>
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Regresar a Metas
      </button>

      <div className={`border rounded-[2rem] p-10 backdrop-blur-3xl transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/10 shadow-xl'}`}>
         <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
               <div className={`p-6 rounded-2xl ${goal.color.replace('bg-', 'bg-opacity-20 text-')} text-white shadow-xl`}><Target size={40} /></div>
               <div>
                  <h1 className={`text-4xl font-bold font-sf ${isDark ? 'text-white' : 'text-[#2A1D11]'}`}>{goal.title}</h1>
                  <p className="opacity-40 flex items-center gap-2 text-sm mt-1"><Calendar size={14} /> Plazo: {goal.target_date || "Sin definir"}</p>
               </div>
            </div>
            <div className="flex gap-4">
               <div className={`px-10 py-6 rounded-2xl border text-center ${isDark ? 'bg-black/30 border-white/5' : 'bg-black/5 border-black/5'}`}>
                  <p className="text-[10px] opacity-30 uppercase font-bold tracking-widest mb-1">Progreso</p>
                  <p className="text-4xl font-bold">42%</p>
               </div>
            </div>
         </div>
      </div>

      <div className={`border rounded-[2rem] p-10 backdrop-blur-3xl transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/10 shadow-xl'}`}>
         <h2 className="text-2xl font-bold mb-10 flex items-center gap-3 font-sf"><BarChart3 className="text-orange-500" /> Línea de Tiempo</h2>
         <div className="space-y-4">
            <div className="flex justify-between px-2 opacity-20 text-[10px] uppercase font-bold tracking-widest">
               {monthLabels.map(m => <span key={m}>{m}</span>)}
            </div>
            <div className="flex flex-wrap gap-[4px]">
               {heatmapDays.map(date => (
                  <div key={date} className={`w-[14px] h-[14px] rounded-sm transition-all ${isDark ? 'bg-white/5' : 'bg-black/5'} hover:scale-150 cursor-pointer`} title={date} />
               ))}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className={`border rounded-[2rem] p-10 backdrop-blur-3xl transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/10 shadow-xl'}`}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3"><TrendingUp className="text-blue-500" /> Análisis de Impacto</h2>
            <div className="space-y-6">
               {[
                  { label: "Consistencia Semanal", val: "85%", col: "bg-blue-500" },
                  { label: "Días con actividad", val: "14/30", col: "bg-emerald-500" },
               ].map(stat => (
                  <div key={stat.label}>
                     <div className="flex justify-between mb-2"><span className="text-sm opacity-50">{stat.label}</span><span className="text-sm font-bold">{stat.val}</span></div>
                     <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden"><div className={`h-full ${stat.col} rounded-full`} style={{ width: stat.val }} /></div>
                  </div>
               ))}
            </div>
         </div>

         <div className={`border rounded-[2rem] p-10 backdrop-blur-3xl transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/10 shadow-xl'}`}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3"><CheckCircle2 className="text-purple-500" /> Hábitos Vinculados</h2>
            <div className="space-y-3">
               {goal.habits?.map((h: any) => (
                  <div key={h.id} className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-black/5 border-black/5'}`}>
                     <span className="font-bold">{h.title}</span>
                     <span className="text-xs opacity-30">{h.frequency}x sem</span>
                  </div>
               ))}
               {(!goal.habits || goal.habits.length === 0) && <p className="opacity-20 italic text-sm">No hay hábitos vinculados a esta meta.</p>}
            </div>
         </div>
      </div>
    </div>
  );
}
