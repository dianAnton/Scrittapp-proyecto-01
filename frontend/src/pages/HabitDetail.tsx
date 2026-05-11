import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Calendar, ArrowLeft, Zap, Clock, CalendarDays, LineChart as LineChartIcon, Target, TrendingUp, Info, Hash } from "lucide-react";
import { motion } from "motion/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const API_URL = "http://localhost:3001/api";

const getLocalDateString = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - offset);
  return local.toISOString().split('T')[0];
};

export default function HabitDetail({ isDark }: { isDark: boolean }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [habit, setHabit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [heatmapView, setHeatmapView] = useState<'annual' | 'monthly'>('annual');

  useEffect(() => {
    fetch(`${API_URL}/habits/${id}`).then(r => r.json()).then(data => { setHabit(data); setLoading(false); }).catch(console.error);
  }, [id]);

  if (loading) return <div className="p-20 text-center opacity-20">Cargando estadísticas...</div>;
  if (!habit) return <div className="p-20 text-center">Hábito no encontrado.</div>;

  const logsMap = habit.logs.reduce((acc: any, log: any) => { acc[log.date] = log; return acc; }, {});

  const today = new Date();
  const daysToShow = heatmapView === 'annual' ? 365 : 30;
  const heatmapDays = Array.from({ length: daysToShow }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (daysToShow - 1 - i));
    return getLocalDateString(d);
  });

  const monthLabels = Array.from({ length: 12 }).map((_, i) => {
     const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
     return d.toLocaleDateString('es-ES', { month: 'short' });
  });

  // Chart Data preparation
  const chartData = Array.from({ length: 14 }).map((_, i) => {
     const d = new Date(today);
     d.setDate(d.getDate() - (13 - i));
     const ds = getLocalDateString(d);
     const log = logsMap[ds];
     return {
        date: d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        value: habit.measure_type === 'boolean' ? (log?.completed ? 1 : 0) : (log?.value || 0),
        fullDate: ds
     };
  });

  const totalCompletions = habit.logs.filter((l: any) => l.completed).length;
  const averageValue = habit.measure_type !== 'boolean' ? (habit.logs.reduce((acc: any, l: any) => acc + (l.value || 0), 0) / (habit.logs.length || 1)).toFixed(1) : null;

  return (
    <div className="p-8 max-w-7xl mx-auto font-inter space-y-10">
      <button onClick={() => navigate('/habits')} className={`flex items-center gap-2 transition-colors group ${isDark ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black'}`}>
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Regresar
      </button>

      {/* HEADER CARD */}
      <div className={`border rounded-[2rem] p-10 backdrop-blur-3xl transition-all ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/10 shadow-xl'}`}>
         <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
               <div className="p-6 rounded-2xl bg-emerald-500/20 text-emerald-500 shadow-xl"><Zap size={32} /></div>
               <div>
                  <h1 className={`text-4xl font-bold font-sf ${isDark ? 'text-white' : 'text-[#2A1D11]'}`}>{habit.title}</h1>
                  <p className={`opacity-40 flex items-center gap-4 text-sm mt-2 ${isDark ? 'text-white' : 'text-black'}`}>
                     <span className="flex items-center gap-1"><Clock size={14} /> {habit.specific_days ? JSON.parse(habit.specific_days).join(', ') : `${habit.frequency} x sem`}</span>
                     {habit.goal_title && <span className="flex items-center gap-1 text-orange-500 font-bold"><Target size={14} /> {habit.goal_title}</span>}
                  </p>
               </div>
            </div>
            <div className="flex gap-4">
               <div className={`px-8 py-5 rounded-2xl border text-center ${isDark ? 'bg-black/30 border-white/5' : 'bg-black/5 border-black/5'}`}>
                  <p className="text-[10px] opacity-30 uppercase font-bold tracking-widest mb-1">Total</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{totalCompletions}</p>
               </div>
               {averageValue && (
                  <div className={`px-8 py-5 rounded-2xl border text-center ${isDark ? 'bg-black/30 border-white/5' : 'bg-black/5 border-black/5'}`}>
                     <p className="text-[10px] opacity-30 uppercase font-bold tracking-widest mb-1">Promedio</p>
                     <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{averageValue} <span className="text-xs opacity-30">{habit.unit}</span></p>
                  </div>
               )}
            </div>
         </div>
         {habit.description && <p className={`mt-8 text-sm opacity-40 italic max-w-2xl leading-relaxed ${isDark ? 'text-white' : 'text-black'}`}>"{habit.description}"</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* CHART SECTION */}
         <div className={`border rounded-[2rem] p-10 backdrop-blur-3xl transition-all ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/10 shadow-xl'}`}>
            <h2 className={`text-xl font-bold mb-8 flex items-center gap-3 font-sf ${isDark ? 'text-white' : 'text-black'}`}><LineChartIcon className="text-emerald-500" /> {habit.measure_type === 'boolean' ? 'Tasa de Completitud' : 'Progreso en el Tiempo'}</h2>
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                     <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} vertical={false} />
                     <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, opacity: 0.3, fill: isDark ? '#fff' : '#000'}} />
                     <YAxis hide={habit.measure_type === 'boolean'} axisLine={false} tickLine={false} tick={{fontSize: 10, opacity: 0.3, fill: isDark ? '#fff' : '#000'}} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: isDark ? '#161616' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                     />
                     <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* HEATMAP SECTION */}
         <div className={`border rounded-[2rem] p-10 backdrop-blur-3xl transition-all ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/10 shadow-xl'}`}>
            <div className="flex items-center justify-between mb-8">
               <h2 className={`text-xl font-bold flex items-center gap-3 font-sf ${isDark ? 'text-white' : 'text-black'}`}><CalendarDays className="text-emerald-500" /> Consistencia</h2>
               <div className="flex gap-1 p-1 bg-black/5 rounded-lg">
                  <button onClick={() => setHeatmapView('annual')} className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${heatmapView === 'annual' ? 'bg-emerald-500 text-white shadow-lg' : 'opacity-30'}`}>Año</button>
                  <button onClick={() => setHeatmapView('monthly')} className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${heatmapView === 'monthly' ? 'bg-emerald-500 text-white shadow-lg' : 'opacity-30'}`}>Mes</button>
               </div>
            </div>
            <div className="space-y-4">
               {heatmapView === 'annual' ? (
                  <div className="flex justify-between px-1 opacity-20 text-[9px] uppercase font-bold tracking-tighter">
                     {monthLabels.map(m => <span key={m}>{m}</span>)}
                  </div>
               ) : (
                  <div className={`text-center text-[10px] uppercase font-bold tracking-widest opacity-30 mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                     {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </div>
               )}
               <div className="flex flex-wrap gap-[4px] justify-center md:justify-start">
                  {heatmapDays.map(date => {
                     const log = logsMap[date];
                     return (
                        <motion.div 
                           key={date} 
                           whileHover={{ scale: 1.5, zIndex: 10 }} 
                           className={`rounded-[2px] transition-all cursor-pointer ${heatmapView === 'annual' ? 'w-[10px] h-[10px]' : 'w-[24px] h-[24px]'} ${log?.completed ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : isDark ? 'bg-white/5' : 'bg-black/5'}`} 
                           title={`${date}: ${log?.value || 0} ${habit.unit || ''}`} 
                        />
                     );
                  })}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
