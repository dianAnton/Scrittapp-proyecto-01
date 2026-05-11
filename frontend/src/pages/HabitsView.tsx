import { Calendar, Plus, Settings2, Trash2, Check, Target, Hash, Clock, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";

const API_URL = "http://localhost:3001/api";

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
    try {
      const [hRes, gRes] = await Promise.all([
        fetch(`${API_URL}/habits`),
        fetch(`${API_URL}/goals`)
      ]);
      setHabits(await hRes.json());
      setGoals(await gRes.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const method = editingHabit ? "PUT" : "POST";
    const url = editingHabit ? `${API_URL}/habits/${editingHabit.id}` : `${API_URL}/habits`;
    
    try {
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          goal_id: goalId ? parseInt(goalId) : null,
          frequency: selectedDays.length > 0 ? selectedDays.length : parseInt(frequency),
          specific_days: selectedDays.length > 0 ? JSON.stringify(selectedDays) : null,
          color_theme: colorTheme,
          measure_type: measureType,
          target_value: targetValue ? parseFloat(targetValue) : null,
          unit
        })
      });
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

  return (
    <div className="p-8 max-w-7xl mx-auto font-inter">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className={`text-4xl font-bold flex items-center gap-4 ${isDark ? 'text-white' : 'text-[#2A1D11]'}`}>
            <Calendar className="text-emerald-500 w-10 h-10" /> Gestión de Hábitos
          </h1>
          <p className={`mt-2 text-lg font-light ${isDark ? 'text-white/60' : 'text-black/40'}`}>Estructura tus rutinas con precisión.</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2">
          <Plus size={20} /> Nuevo Hábito
        </button>
      </div>

      <div className={`border rounded-2xl overflow-hidden backdrop-blur-3xl transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/10 shadow-xl'}`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`text-[10px] uppercase tracking-[0.3em] font-bold ${isDark ? 'bg-white/5 text-white/30' : 'bg-black/5 text-black/30'}`}>
              <th className="px-10 py-6">Hábito</th>
              <th className="px-10 py-6">Meta Vinculada</th>
              <th className="px-10 py-6">Medición</th>
              <th className="px-10 py-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-black/5'}`}>
            {habits.map((habit) => (
              <tr key={habit.id} onClick={() => navigate(`/habits/${habit.id}`)} className={`group cursor-pointer transition-all ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-black/[0.03]'}`}>
                <td className="px-10 py-8">
                  <div className="flex items-center gap-5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: THEMES.find(t => t.value === habit.color_theme)?.hex || '#10b981' }} />
                    <div>
                      <p className={`font-bold text-xl ${isDark ? 'text-white' : 'text-[#2A1D11]'}`}>{habit.title}</p>
                      <p className="opacity-20 text-xs mt-1">{habit.description || "Sin descripción"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-8">
                   <div className="flex items-center gap-2 opacity-40">
                      <Target size={14} />
                      <span className="text-sm font-bold">{goals.find(g => g.id === habit.goal_id)?.title || "Ninguna"}</span>
                   </div>
                </td>
                <td className="px-10 py-8">
                   <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/10 w-fit capitalize">{habit.measure_type}</span>
                      <span className="text-[10px] opacity-20 font-bold">{habit.specific_days ? JSON.parse(habit.specific_days).join(', ') : `${habit.frequency} x sem`}</span>
                   </div>
                </td>
                <td className="px-10 py-8 text-right">
                  <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={(e) => handleEdit(habit, e)} className={`p-3 rounded-xl transition-all ${isDark ? 'bg-white/10 text-white/60 hover:text-white' : 'bg-black/10 text-black/60 hover:text-black'}`}><Settings2 size={18} /></button>
                    <button onClick={(e) => { e.stopPropagation(); if(confirm("¿Eliminar?")) fetch(`${API_URL}/habits/${habit.id}`, {method: 'DELETE'}).then(fetchData); }} className="p-3 rounded-xl bg-red-500/10 text-red-500/60 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingHabit ? "Editar Hábito" : "Nuevo Hábito"} isDark={isDark}>
        <form onSubmit={handleCreate} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
          <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2">
                <label className="text-[10px] uppercase font-bold opacity-40 tracking-widest ml-1">Nombre</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Meditar..." className={`w-full border rounded-xl px-5 py-4 mt-2 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
             </div>
             <div className="col-span-2">
                <label className="text-[10px] uppercase font-bold opacity-40 tracking-widest ml-1">Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="¿Por qué es importante?" className={`w-full border rounded-xl px-5 py-4 mt-2 h-20 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
             </div>
             <div>
                <label className="text-[10px] uppercase font-bold opacity-40 tracking-widest ml-1">Meta Relacionada</label>
                <select value={goalId} onChange={(e) => setGoalId(e.target.value)} className={`w-full border rounded-xl px-5 py-4 mt-2 appearance-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`}>
                   <option value="">Ninguna</option>
                   {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                </select>
             </div>
             <div>
                <label className="text-[10px] uppercase font-bold opacity-40 tracking-widest ml-1">Color</label>
                <div className="flex flex-wrap gap-2 mt-3">
                   {THEMES.map(t => (
                      <button key={t.value} type="button" onClick={() => setColorTheme(t.value)} className={`w-6 h-6 rounded-sm border-2 transition-all ${colorTheme === t.value ? 'border-emerald-500 scale-125' : 'border-transparent opacity-40'}`} style={{ backgroundColor: t.hex }} />
                   ))}
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <label className="text-[10px] uppercase font-bold opacity-40 tracking-widest ml-1">Tipo de Hábito</label>
             <div className="flex gap-2">
                {[
                   { id: 'boolean', name: 'Check', icon: Check },
                   { id: 'quantity', name: 'Cantidad', icon: Hash },
                   { id: 'time', name: 'Tiempo', icon: Clock }
                ].map(t => (
                   <button key={t.id} type="button" onClick={() => setMeasureType(t.id)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${measureType === t.id ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-black/5 border-transparent opacity-40'}`}>
                      <t.icon size={16} /> <span className="text-[10px] font-bold uppercase">{t.name}</span>
                   </button>
                ))}
             </div>
             {measureType !== 'boolean' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                   <div>
                      <label className="text-[10px] uppercase font-bold opacity-40 tracking-widest">Objetivo ({measureType === 'time' ? 'Min' : 'Cant'})</label>
                      <input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="Ej: 30" className={`w-full border rounded-xl px-5 py-3 mt-2 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
                   </div>
                   <div>
                      <label className="text-[10px] uppercase font-bold opacity-40 tracking-widest">Unidad</label>
                      <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Ej: km, min, pag" className={`w-full border rounded-xl px-5 py-3 mt-2 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
                   </div>
                </div>
             )}
          </div>

          <div className="space-y-4">
             <label className="text-[10px] uppercase font-bold opacity-40 tracking-widest ml-1">Programación</label>
             <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map(day => (
                   <button key={day} type="button" onClick={() => setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])} className={`px-4 py-3 rounded-xl text-[10px] font-bold uppercase border transition-all ${selectedDays.includes(day) ? 'bg-emerald-500 border-emerald-500 text-white' : isDark ? 'bg-white/5 border-white/5 text-white/30' : 'bg-black/5 border-black/5 text-black/30'}`}>{day}</button>
                ))}
             </div>
          </div>

          <button disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-5 rounded-xl text-lg shadow-xl shadow-emerald-500/20">
             {editingHabit ? "Actualizar Hábito" : "Crear Hábito"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
