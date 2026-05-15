import { Calendar, Plus, Settings2, Trash2, Check, Target, Hash, Clock, Info, Dumbbell, Timer, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Queries
  const { data: habits = [] } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data, error } = await supabase.from("habits").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data, error } = await supabase.from("goals").select("id, title");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

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
  const [exerciseTemplate, setExerciseTemplate] = useState<any[]>([]);

  const habitMutation = useMutation({
    mutationFn: async (habitData: any) => {
      let error;
      if (editingHabit) {
        const { error: err } = await supabase.from("habits").update(habitData).eq("id", editingHabit.id);
        error = err;
      } else {
        const { error: err } = await supabase.from("habits").insert([habitData]);
        error = err;
      }
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("habits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setDeleteConfirmId(null);
    },
  });

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
      unit,
      exercise_template: measureType === 'training' ? exerciseTemplate : []
    };

    habitMutation.mutate(habitData);
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setGoalId(""); setFrequency("7"); setSelectedDays([]); setColorTheme(THEMES[0].value);
    setMeasureType("boolean"); setTargetValue(""); setUnit(""); setEditingHabit(null);
    setExerciseTemplate([]);
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
    setExerciseTemplate(habit.exercise_template || []);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    deleteMutation.mutate(deleteConfirmId);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-inter">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className={`text-4xl font-bold flex items-center gap-4 ${isDark ? 'text-white' : 'text-[#2A1D11]'}`}>
            <Calendar className="text-accent w-10 h-10" /> Gestión de Hábitos
          </h1>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent hover:brightness-110 text-white font-bold shadow-[0_10px_20px_rgba(var(--accent-color-rgb),0.3)] transition-all active:scale-95">
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
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0" style={{ backgroundColor: themeHex }}>
                    {habit.measure_type === 'boolean' ? <Check size={20} /> : habit.measure_type === 'time' ? <Clock size={20} /> : <Hash size={20} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-xl font-bold font-sf truncate ${isDark ? 'text-white' : 'text-[#2A1D11]'}`} title={habit.title}>{habit.title}</h3>
                    <p className={`text-[10px] font-bold uppercase tracking-widest opacity-30 ${isDark ? 'text-white' : 'text-black'}`}>{habit.measure_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                  <button onClick={(e) => handleEdit(habit, e)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10 text-white/40 hover:text-white' : 'hover:bg-black/5 text-black/40 hover:text-black'}`}><Settings2 size={16} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(habit.id); }} className={`p-2 rounded-lg ${isDark ? 'hover:bg-red-500/10 text-red-500/40 hover:text-red-500' : 'hover:bg-red-500/5 text-red-500/60 hover:text-red-500'}`}><Trash2 size={16} /></button>
                </div>
              </div>

              <p className={`text-sm opacity-40 line-clamp-2 mb-8 h-10 ${isDark ? 'text-white' : 'text-black'}`}>{habit.description || "Sin descripción"}</p>
              
              <div className="space-y-4">
                {goalTitle && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest w-fit max-w-full ${isDark ? 'bg-white/5 border-white/5 text-white/40' : 'bg-black/5 border-black/5 text-black/40'}`}>
                    <Target size={12} className="flex-shrink-0" /> 
                    <span className="truncate">{goalTitle}</span>
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
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Meditación Profunda..." className={`w-full border rounded-xl px-6 py-5 mt-2 focus:border-accent outline-none transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
            </div>

            <div>
              <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Propósito (Opcional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="¿Por qué este hábito transformará tu vida?" rows={4} className={`w-full border rounded-xl px-6 py-5 mt-2 focus:border-accent outline-none transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div>
                  <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Vincular Meta</label>
                  <select value={goalId} onChange={(e) => setGoalId(e.target.value)} className={`w-full border rounded-xl pl-6 pr-12 py-5 mt-2 appearance-none focus:border-accent outline-none transition-colors premium-select ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`}>
                     <option value="">Ninguna</option>
                     {goals.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.title.length > 40 ? g.title.substring(0, 40) + '...' : g.title}
                        </option>
                      ))}
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
             <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                   { id: 'boolean', name: 'Presencia', icon: Check, desc: 'Completado o no' },
                   { id: 'quantity', name: 'Cantidad', icon: Hash, desc: 'Ej: 5km, 2L' },
                   { id: 'time', name: 'Tiempo', icon: Clock, desc: 'Ej: 30 min' },
                   { id: 'training', name: 'Entrenamiento', icon: Dumbbell, desc: 'Reps, series...' }
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
             
             {measureType === 'training' && (
                <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Rutina de Ejercicios</label>
                    <button 
                      type="button"
                      onClick={() => setExerciseTemplate([...exerciseTemplate, { name: "", sets: "", reps: "", rest: "" }])}
                      className="text-[10px] bg-accent/20 text-accent px-4 py-2 rounded-xl font-bold hover:bg-accent/30 transition-all flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Añadir Ejercicio
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-64 overflow-y-auto p-2 custom-scrollbar">
                    {exerciseTemplate.map((ex, idx) => (
                      <div key={idx} className={`border rounded-2xl p-4 relative group transition-all ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/10 shadow-sm'}`}>
                        <button 
                          type="button"
                          onClick={() => setExerciseTemplate(exerciseTemplate.filter((_, i) => i !== idx))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90 z-10"
                        >
                          <X size={14} />
                        </button>
                        <div className="space-y-3">
                          <input 
                            placeholder="Nombre del ejercicio (Ej: Flexiones)"
                            value={ex.name}
                            onChange={(e) => {
                              const newTemp = [...exerciseTemplate];
                              newTemp[idx].name = e.target.value;
                              setExerciseTemplate(newTemp);
                            }}
                            className={`w-full border rounded-lg py-3 px-4 text-sm outline-none focus:border-accent transition-colors ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-black/5 border-black/10 text-black'}`}
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <div className="flex flex-col gap-1">
                              <span className={`text-[8px] uppercase font-bold ml-1 ${isDark ? 'text-white/20' : 'text-black/20'}`}>Series</span>
                              <input 
                                type="number"
                                placeholder="Sets"
                                value={ex.sets}
                                onChange={(e) => {
                                  const newTemp = [...exerciseTemplate];
                                  newTemp[idx].sets = e.target.value;
                                  setExerciseTemplate(newTemp);
                                }}
                                className={`border rounded-lg py-2 px-3 text-xs outline-none focus:border-accent no-spinner ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-black/5 border-black/10 text-black'}`}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className={`text-[8px] uppercase font-bold ml-1 ${isDark ? 'text-white/20' : 'text-black/20'}`}>Reps</span>
                              <input 
                                type="number"
                                placeholder="Reps"
                                value={ex.reps}
                                onChange={(e) => {
                                  const newTemp = [...exerciseTemplate];
                                  newTemp[idx].reps = e.target.value;
                                  setExerciseTemplate(newTemp);
                                }}
                                className={`border rounded-lg py-2 px-3 text-xs outline-none focus:border-accent no-spinner ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-black/5 border-black/10 text-black'}`}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className={`text-[8px] uppercase font-bold ml-1 ${isDark ? 'text-white/20' : 'text-black/20'}`}>Descanso (s)</span>
                              <input 
                                type="number"
                                placeholder="Secs"
                                value={ex.rest}
                                onChange={(e) => {
                                  const newTemp = [...exerciseTemplate];
                                  newTemp[idx].rest = e.target.value;
                                  setExerciseTemplate(newTemp);
                                }}
                                className={`border rounded-lg py-2 px-3 text-xs outline-none focus:border-accent no-spinner ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-black/5 border-black/10 text-black'}`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {exerciseTemplate.length === 0 && (
                      <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-[2rem]">
                        <Dumbbell className="mx-auto text-white/10 mb-3" size={32} />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Define tu rutina de entrenamiento</p>
                      </div>
                    )}
                  </div>
                </div>
             )}

             {measureType !== 'boolean' && measureType !== 'training' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 pt-2">
                   <div>
                      <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/30' : 'text-black/30'}`}>Objetivo {measureType === 'time' ? '(Minutos)' : ''}</label>
                      <input type="number" required value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="Ej: 30" className={`w-full border rounded-xl px-6 py-5 mt-2 focus:border-accent outline-none transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
                   </div>
                   <div>
                      <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/30' : 'text-black/30'}`}>Unidad</label>
                      <input required value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Ej: km, pág, min" className={`w-full border rounded-xl px-6 py-5 mt-2 focus:border-accent outline-none transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Eliminar Hábito" isDark={isDark}>
        <div className="space-y-6 text-center py-4">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trash2 size={40} className="text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>¿Estás completamente seguro?</h3>
            <p className={`text-sm opacity-60 ${isDark ? 'text-white' : 'text-black'}`}>Esta acción es irreversible y se perderá todo el historial de este hábito.</p>
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
              Eliminar Permanentemente
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
