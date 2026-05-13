import { Calendar, Plus, Settings2, Trash2, Check, Target, Hash, Clock, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

const THEMES = [
  { name: "Esmeralda", value: "emerald", hex: "#10b981" },
  { name: "Cian", value: "cyan", hex: "#06b6d4" },
  { name: "Azul", value: "blue", hex: "#3b82f6" },
  { name: "Indigo", value: "indigo", hex: "#6366f1" },
  { name: "Púrpura", value: "purple", hex: "#a855f7" },
  { name: "Rosa", value: "pink", hex: "#ec4899" },
  { name: "Rojo", value: "red", hex: "#ef4444" },
  { name: "Naranja", value: "orange", hex: "#f97316" },
  { name: "Amarillo", value: "yellow", hex: "#eab308" },
];

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function HabitsView({ isDark }: { isDark: boolean }) {
  const [habits, setHabits] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalId, setGoalId] = useState("");
  const [frequency, setFrequency] = useState("7");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [colorTheme, setColorTheme] = useState(THEMES[0].value);
  const [measureType, setMeasureType] = useState("boolean");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");

  const fetchData = async () => {
    if (!user) return;
    try {
      const [hRes, gRes] = await Promise.all([
        supabase.from("habits").select("*").order("created_at", { ascending: false }),
        supabase.from("goals").select("id, title")
      ]);
      
      if (hRes.data) setHabits(hRes.data);
      if (gRes.data) setGoals(gRes.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { 
    if (user) fetchData(); 
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    
    const habitData = {
      user_id: user.id,
      title,
      description,
      goal_id: goalId || null,
      frequency: selectedDays.length > 0 ? selectedDays.length : parseInt(frequency),
      specific_days: selectedDays.length > 0 ? JSON.stringify(selectedDays) : null,
      color_theme: colorTheme,
      measure_type: measureType,
      target_value: targetValue ? parseFloat(targetValue) : null,
      unit
    };

    try {
      let error;
      if (editingHabit) {
        const { error: err } = await supabase.from("habits").update(habitData).eq("id", editingHabit.id);
        error = err;
      } else {
        const { error: err } = await supabase.from("habits").insert([habitData]);
        error = err;
      }

      if (error) throw error;

      fetchData();
      setIsModalOpen(false);
      resetForm();
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setGoalId(""); setFrequency("7"); setSelectedDays([]); setColorTheme(THEMES[0].value);
    setMeasureType("boolean"); setTargetValue(""); setUnit(""); setEditingHabit(null);
  };

  const handleEdit = (habit: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingHabit(habit);
    setTitle(habit.title);
    setDescription(habit.description || "");
    setGoalId(habit.goal_id ? habit.goal_id.toString() : "");
    setFrequency(habit.frequency.toString());
    setSelectedDays(habit.specific_days ? JSON.parse(habit.specific_days) : []);
    setColorTheme(habit.color_theme);
    setMeasureType(habit.measure_type || "boolean");
    setTargetValue(habit.target_value ? habit.target_value.toString() : "");
    setUnit(habit.unit || "");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(!confirm("¿Eliminar este hábito?")) return;
    const { error } = await supabase.from("habits").delete().eq("id", id);
    if (error) console.error(error);
    else fetchData();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-inter">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className={`text-4xl font-bold flex items-center gap-4 ${isDark ? 'text-white' : 'text-[#2A1D11]'}`}>
            <Calendar className="text-accent w-10 h-10" /> Gestión de Hábitos
          </h1>
          <p className={`mt-2 text-lg font-light ${isDark ? 'text-white/60' : 'text-black/40'}`}>Perfecciona tus rutinas y automatiza tu éxito.</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="px-8 py-4 rounded-xl bg-accent hover:brightness-110 text-white font-bold shadow-[0_10px_20px_rgba(var(--accent-color-rgb),0.3)] transition-all active:scale-95 flex items-center gap-2">
          <Plus size={20} /> Nuevo Hábito
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.map((habit) => {
          const themeHex = THEMES.find(t => t.value === habit.color_theme)?.hex || '#ccc';
          const goalTitle = goals.find(g => g.id === habit.goal_id)?.title;

          return (
            <div key={habit.id} onClick={() => navigate(`/habits/${habit.id}`)} className={`group cursor-pointer border rounded-[2rem] p-8 transition-all relative overflow-hidden backdrop-blur-3xl ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/60 border-black/10 hover:bg-white/80 shadow-lg'}`}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: themeHex }}>
                    {habit.measure_type === 'boolean' ? <Check size={20} /> : habit.measure_type === 'time' ? <Clock size={20} /> : <Hash size={20} />}
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold font-sf ${isDark ? 'text-white' : 'text-[#2A1D11]'}`}>{habit.title}</h3>
                    <p className={`text-[10px] font-bold uppercase tracking-widest opacity-30 ${isDark ? 'text-white' : 'text-black'}`}>{habit.measure_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={(e) => handleEdit(habit, e)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10 text-white/40 hover:text-white' : 'hover:bg-black/5 text-black/40 hover:text-black'}`}><Settings2 size={16} /></button>
                  <button onClick={(e) => handleDelete(habit.id, e)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-red-500/10 text-red-500/40 hover:text-red-500' : 'hover:bg-red-500/5 text-red-500/60 hover:text-red-500'}`}><Trash2 size={16} /></button>
                </div>
              </div>

              <p className={`text-sm opacity-40 line-clamp-2 mb-8 h-10 ${isDark ? 'text-white' : 'text-black'}`}>{habit.description || "Sin descripción"}</p>
              
              <div className="space-y-4">
                {goalTitle && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest w-fit ${isDark ? 'bg-white/5 border-white/5 text-white/40' : 'bg-black/5 border-black/5 text-black/40'}`}>
                    <Target size={12} /> {goalTitle}
                  </div>
                )}
                
                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-20 ${isDark ? 'text-white' : 'text-black'}`}>
                   <Calendar size={12} /> {habit.specific_days ? JSON.parse(habit.specific_days).join(', ') : `${habit.frequency} días por semana`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingHabit ? "Refinar Hábito" : "Forjar Nuevo Hábito"} isDark={isDark}>
        <form onSubmit={handleCreate} className="space-y-8 px-1">
          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.2); border-radius: 10px; }
            input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
            input[type=number] { -moz-appearance: textfield; }
            .premium-select {
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${isDark ? 'white' : 'black'}' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E");
              background-repeat: no-repeat;
              background-position: right 1.25rem center;
              background-size: 1rem;
            }
            select option {
              background: ${isDark ? '#1a1a1a' : '#ffffff'};
              color: ${isDark ? '#ffffff' : '#000000'};
            }
          `}</style>

          <div className="space-y-6">
            <div>
              <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Nombre del Hábito</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Meditación Profunda..." className={`w-full border rounded-xl px-5 py-4 mt-2 focus:border-accent outline-none transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
            </div>

            <div>
              <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Propósito (Opcional)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="¿Por qué este hábito transformará tu vida?" rows={2} className={`w-full border rounded-xl px-5 py-4 mt-2 resize-none focus:border-accent outline-none transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div>
                  <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Vincular Meta</label>
                  <select value={goalId} onChange={(e) => setGoalId(e.target.value)} className={`w-full border rounded-xl px-5 py-4 mt-2 appearance-none focus:border-accent outline-none transition-colors premium-select ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`}>
                     <option value="">Ninguna</option>
                     {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                  </select>
               </div>
               <div>
                  <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Identidad Visual</label>
                  <div className="flex flex-wrap gap-2.5 mt-3">
                     {THEMES.map(t => (
                        <button key={t.value} type="button" onClick={() => setColorTheme(t.value)} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${colorTheme === t.value ? 'scale-125 ring-2 ring-accent ring-offset-2 ring-offset-transparent' : 'opacity-60 hover:opacity-100'}`} style={{ backgroundColor: t.hex }}>
                           {colorTheme === t.value && <Check size={14} className="text-white" />}
                        </button>
                     ))}
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-4">
             <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Método de Medición</label>
             <div className="grid grid-cols-3 gap-2">
                {[
                   { id: 'boolean', name: 'Presencia', icon: Check, desc: 'Completado o no' },
                   { id: 'quantity', name: 'Cantidad', icon: Hash, desc: 'Ej: 5km, 2L' },
                   { id: 'time', name: 'Tiempo', icon: Clock, desc: 'Ej: 30 min' }
                ].map(t => (
                   <button key={t.id} type="button" onClick={() => setMeasureType(t.id)} className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${measureType === t.id ? 'bg-accent/10 border-accent shadow-[0_0_15px_rgba(var(--accent-color-rgb),0.1)]' : isDark ? 'bg-white/5 border-white/5 text-white/40' : 'bg-black/5 border-black/5 text-black/40'}`}>
                      <t.icon size={20} className={measureType === t.id ? 'text-accent' : ''} />
                      <div className="text-center">
                        <p className={`text-[9px] font-bold uppercase tracking-wider ${measureType === t.id ? 'text-accent' : isDark ? 'text-white/30' : 'text-black/30'}`}>{t.name}</p>
                        <p className="text-[7px] opacity-40 leading-none mt-1">{t.desc}</p>
                      </div>
                   </button>
                ))}
             </div>
             {measureType !== 'boolean' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 pt-2">
                   <div>
                      <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/30' : 'text-black/30'}`}>Objetivo {measureType === 'time' ? '(Minutos)' : ''}</label>
                      <input type="number" required value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="Ej: 30" className={`w-full border rounded-xl px-5 py-4 mt-2 focus:border-accent outline-none transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
                   </div>
                   <div>
                      <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/30' : 'text-black/30'}`}>Unidad</label>
                      <input required value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Ej: km, pág, min" className={`w-full border rounded-xl px-5 py-4 mt-2 focus:border-accent outline-none transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
                   </div>
                </div>
             )}
          </div>

          <div className="space-y-4">
             <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Programación Semanal</label>
             <div className="flex justify-between gap-2">
                {WEEKDAYS.map(day => (
                   <button key={day} type="button" onClick={() => setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])} className={`flex-1 py-4 rounded-xl text-[10px] font-bold uppercase border transition-all ${selectedDays.includes(day) ? 'bg-accent border-accent text-white shadow-lg scale-105' : isDark ? 'bg-white/5 border-white/5 text-white/30' : 'bg-black/5 border-black/5 text-black/30'}`}>{day}</button>
                ))}
             </div>
             <p className="text-[10px] opacity-30 italic text-center">Deja vacío para marcar como "Hábito Diario" (7 días).</p>
          </div>

          <button disabled={loading} className="w-full bg-accent hover:brightness-110 text-white font-bold py-6 rounded-xl text-lg shadow-[0_10px_20px_rgba(var(--accent-color-rgb),0.3)] transition-all active:scale-95">
             {editingHabit ? "Actualizar Hábito" : "Forjar Hábito"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
