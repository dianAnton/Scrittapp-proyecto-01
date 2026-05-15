import { Target, Plus, Calendar as CalendarIcon, Hash, CheckCircle2, Trash2, ArrowRight, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const COLORS = [
  { name: "Esmeralda", value: "bg-emerald-500" },
  { name: "Cian", value: "bg-cyan-500" },
  { name: "Azul", value: "bg-blue-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Púrpura", value: "bg-purple-500" },
  { name: "Rosa", value: "bg-pink-500" },
  { name: "Rojo", value: "bg-red-500" },
  { name: "Naranja", value: "bg-orange-500" },
  { name: "Amarillo", value: "bg-yellow-500" },
];


export default function GoalsView({ isDark }: { isDark: boolean }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Queries
  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("generic");
  const [priority, setPriority] = useState("low");
  const [dateType, setDateType] = useState<"specific" | "none">("none");
  const [targetDate, setTargetDate] = useState("");
  const [targetNumber, setTargetNumber] = useState("");

  const PRIORITY_COLORS: any = {
    high: "bg-red-500",
    medium: "bg-amber-500",
    low: "bg-blue-500"
  };

  const TYPES = [
    { id: 'generic', name: 'No definido', icon: Target },
    { id: 'amount', name: 'Cantidad', icon: Hash },
  ];

  const goalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      const { error } = await supabase.from("goals").insert([goalData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setDeleteConfirmId(null);
    },
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ id, completed }: any) => {
      const { error } = await supabase
        .from("goals")
        .update({ completed: !completed })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    goalMutation.mutate({
      user_id: user.id,
      title,
      description,
      type,
      priority,
      target_date: dateType === 'specific' ? targetDate : null,
      target_number: targetNumber ? parseFloat(targetNumber) : null,
      color: PRIORITY_COLORS[priority]
    });
  };

  const resetForm = () => { 
    setTitle(""); 
    setDescription("");
    setType("generic"); 
    setPriority("low");
    setTargetDate(""); 
    setTargetNumber(""); 
    setDateType("none"); 
  };

  const handleDelete = () => {
    if (!deleteConfirmId) return;
    deleteMutation.mutate(deleteConfirmId);
  };

  const handleToggleComplete = (goal: any, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCompleteMutation.mutate({ id: goal.id, completed: goal.completed });
  };

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);


  return (
    <div className="p-8 max-w-7xl mx-auto font-inter">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className={`text-4xl font-bold flex items-center gap-4 ${isDark ? 'text-white' : 'text-[#2A1D11]'}`}>
            <Target className="text-accent w-10 h-10" /> Objetivos y Metas
          </h1>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent hover:brightness-110 text-white font-bold shadow-[0_10px_20px_rgba(var(--accent-color-rgb),0.3)] transition-all active:scale-95">
          <Plus size={20} /> Nueva Meta
        </button>
      </div>       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeGoals.map((goal) => {
          const colorMap: any = {
            'bg-red-500': 'bg-red-500/20 text-red-500 border-red-500/20',
            'bg-amber-500': 'bg-amber-500/20 text-amber-500 border-amber-500/20',
            'bg-blue-500': 'bg-blue-500/20 text-blue-500 border-blue-500/20',
          };
          const colorClass = colorMap[goal.color] || 'bg-accent/20 text-accent border-accent/20';

          return (
            <div key={goal.id} onClick={() => navigate(`/goals/${goal.id}`)} className={`group cursor-pointer border rounded-2xl p-8 transition-all relative overflow-hidden backdrop-blur-3xl ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/60 border-black/10 hover:bg-white/80 shadow-lg'}`}>
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className={`px-4 py-2 rounded-full ${colorClass} font-bold text-[9px] uppercase tracking-widest border`}>
                   {goal.priority === 'high' ? 'Alta Prioridad' : goal.priority === 'medium' ? 'Prioridad Media' : 'Prioridad Baja'}
                </div>
                 <div className="flex items-center gap-1">
                  <button onClick={(e) => handleToggleComplete(goal, e)} className={`p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${isDark ? 'hover:bg-emerald-500/10 text-emerald-500/60 hover:text-emerald-500' : 'hover:bg-emerald-500/5 text-emerald-600/60 hover:text-emerald-600'}`} title="Marcar como completado"><Check size={18} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(goal.id); }} className={`p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${isDark ? 'text-red-500/60 hover:text-red-500' : 'text-red-600/60 hover:text-red-600'}`} title="Eliminar meta"><Trash2 size={18} /></button>
                </div>
              </div>
              <h3 className={`text-xl font-bold mb-2 font-sf truncate block ${isDark ? 'text-white' : 'text-[#2A1D11]'}`}>{goal.title}</h3>
              <p className={`text-sm opacity-40 line-clamp-2 mb-6 ${isDark ? 'text-white' : 'text-black'}`}>{goal.description || "Sin descripción"}</p>
              <div className={`pt-6 border-t flex items-center justify-between text-[11px] font-bold uppercase tracking-widest opacity-40 ${isDark ? 'border-white/5 text-white' : 'border-black/5 text-black'}`}>
                 <span className="flex items-center gap-2"><CalendarIcon size={12} /> {goal.target_date || "Sin plazo"}</span>
                 <ArrowRight size={14} className="text-accent" />
              </div>
            </div>
          );
        })}
      </div>

      {completedGoals.length > 0 && (
        <div className="mt-20">
          <h2 className={`text-2xl font-bold mb-8 opacity-40 flex items-center gap-3 ${isDark ? 'text-white' : 'text-black'}`}>Metas Completadas ({completedGoals.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-40 hover:opacity-100 transition-opacity">
            {completedGoals.map((goal) => (
              <div key={goal.id} onClick={() => navigate(`/goals/${goal.id}`)} className={`group cursor-pointer border rounded-2xl p-8 transition-all relative overflow-hidden backdrop-blur-3xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/10 hover:bg-white/80'}`}>
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className={`px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[9px] uppercase tracking-widest border`}>
                     Completado
                  </div>
                   <div className="flex items-center gap-1">
                    <button onClick={(e) => handleToggleComplete(goal, e)} className={`p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${isDark ? 'hover:bg-blue-500/10 text-blue-500/60 hover:text-blue-500' : 'hover:bg-blue-500/5 text-blue-600/60 hover:text-blue-600'}`} title="Desmarcar"><ArrowRight size={18} className="rotate-180" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(goal.id); }} className={`p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${isDark ? 'text-red-500/60 hover:text-red-500' : 'text-red-600/60 hover:text-red-600'}`}><Trash2 size={18} /></button>
                  </div>
                </div>
                <h3 className={`text-xl font-bold mb-2 font-sf line-through ${isDark ? 'text-white' : 'text-[#2A1D11]'}`}>{goal.title}</h3>
                <p className={`text-sm opacity-40 line-clamp-2 mb-6 ${isDark ? 'text-white' : 'text-black'}`}>{goal.description || "Sin descripción"}</p>
                <div className={`pt-6 border-t flex items-center justify-between text-[11px] font-bold uppercase tracking-widest opacity-40 ${isDark ? 'border-white/5 text-white' : 'border-black/5 text-black'}`}>
                   <span className="flex items-center gap-2">Completado</span>
                   <ArrowRight size={14} className="text-accent" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Meta" isDark={isDark}>
        <form onSubmit={handleCreate} className="space-y-6">
          <style>{`
            input[type=number]::-webkit-inner-spin-button, 
            input[type=number]::-webkit-outer-spin-button { 
              -webkit-appearance: none; 
              margin: 0; 
            }
            input[type=number] {
              -moz-appearance: textfield;
            }
          `}</style>

          <div>
            <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>¿Qué quieres lograr?</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Libertad financiera..." className={`w-full border rounded-xl px-6 py-5 mt-2 transition-colors focus:border-accent outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
          </div>

          <div>
            <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Descripción (Opcional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalla tu objetivo..." rows={4} className={`w-full border rounded-xl px-6 py-5 mt-2 transition-colors focus:border-accent outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
          </div>

          <div className="space-y-4">
             <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Tipo de Medición</label>
             <div className="grid grid-cols-3 gap-2">
                {TYPES.map(t => (
                   <button key={t.id} type="button" onClick={() => setType(t.id)} className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${type === t.id ? 'bg-accent/10 border-accent shadow-[0_0_15px_rgba(var(--accent-color-rgb),0.1)]' : isDark ? 'bg-white/5 border-white/5 text-white/40' : 'bg-black/5 border-black/5 text-black/40'}`}>
                      <t.icon size={20} className={type === t.id ? 'text-accent' : ''} />
                      <span className={`text-[9px] font-bold uppercase tracking-wider text-center ${type === t.id ? 'text-accent' : isDark ? 'text-white/30' : 'text-black/30'}`}>{t.name}</span>
                   </button>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-4">
                <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Prioridad</label>
                <div className="flex gap-2">
                   {[
                      { id: 'high', label: 'Alta', col: 'bg-red-500' },
                      { id: 'medium', label: 'Media', col: 'bg-amber-500' },
                      { id: 'low', label: 'Baja', col: 'bg-blue-500' }
                   ].map(p => (
                      <button key={p.id} type="button" onClick={() => setPriority(p.id)} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase border transition-all ${priority === p.id ? `${p.col} text-white border-transparent shadow-lg scale-105` : isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-black/5 border-black/10 text-black/40'}`}>{p.label}</button>
                   ))}
                </div>
             </div>

             <div className="space-y-4">
                <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Plazo</label>
                <div className="flex gap-2">
                   {[
                      { id: 'none', label: 'Sin Plazo' },
                      { id: 'specific', label: 'Fecha' }
                   ].map(v => (
                      <button key={v.id} type="button" onClick={() => setDateType(v.id as any)} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase border transition-all ${dateType === v.id ? 'bg-accent text-white border-transparent shadow-lg scale-105' : isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-black/5 border-black/10 text-black/30'}`}>{v.label}</button>
                   ))}
                </div>
             </div>
          </div>

          {type === 'amount' && (
             <div className="animate-in fade-in slide-in-from-top-2">
                <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Número Objetivo</label>
                <input type="number" required value={targetNumber} onChange={(e) => setTargetNumber(e.target.value)} placeholder="Ej: 5000" className={`w-full border rounded-xl px-6 py-5 mt-2 focus:border-accent outline-none transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
             </div>
          )}

          {dateType === 'specific' && (
             <div className="animate-in fade-in slide-in-from-top-2">
                <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Fecha Límite</label>
                <input type="date" required value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className={`w-full border rounded-xl px-6 py-5 mt-2 focus:border-accent outline-none transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
             </div>
          )}

          <button disabled={loading} className="w-full bg-accent hover:brightness-110 text-white font-bold py-5 rounded-xl text-lg shadow-[0_10px_20px_rgba(var(--accent-color-rgb),0.3)] transition-all active:scale-95">Crear Meta</button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal (Premium Style) */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Eliminar Meta" isDark={isDark}>
        <div className="space-y-6 text-center py-4">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trash2 size={40} className="text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>¿Eliminar este objetivo?</h3>
            <p className={`text-sm opacity-60 ${isDark ? 'text-white' : 'text-black'}`}>Esta acción borrará la meta y desvinculará todos los hábitos asociados. No se puede deshacer.</p>
          </div>
          <div className="flex gap-4 pt-6">
            <button 
              onClick={() => setDeleteConfirmId(null)}
              className={`flex-1 py-4 rounded-xl font-bold transition-all ${isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-black/5 text-black hover:bg-black/10'}`}
            >
              Cancelar
            </button>
            <button 
              onClick={handleDelete}
              className="flex-1 bg-red-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
            >
              Confirmar Eliminación
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
