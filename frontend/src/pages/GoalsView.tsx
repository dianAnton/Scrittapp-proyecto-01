import { Target, Plus, Calendar as CalendarIcon, Hash, CheckCircle2, Trash2, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";

const API_URL = "http://localhost:3001/api";

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

const TYPES = [
  { id: 'generic', name: 'Ambiciosa / Ambigua', icon: Target },
  { id: 'boolean', name: 'Completado / No Completado', icon: CheckCircle2 },
  { id: 'amount', name: 'Por Cantidad / Número', icon: Hash },
  { id: 'date_deadline', name: 'Fecha Límite Específica', icon: CalendarIcon },
];

export default function GoalsView({ isDark }: { isDark: boolean }) {
  const [goals, setGoals] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [type, setType] = useState("generic");
  const [dateType, setDateType] = useState("specific");
  const [targetDate, setTargetDate] = useState("");
  const [targetNumber, setTargetNumber] = useState("");
  const [color, setColor] = useState(COLORS[0].value);

  const fetchGoals = () => {
    fetch(`${API_URL}/goals`).then(r => r.json()).then(setGoals).catch(console.error);
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${API_URL}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type, target_date: targetDate, target_number: targetNumber ? parseFloat(targetNumber) : null, color })
      });
      fetchGoals();
      setIsModalOpen(false);
      resetForm();
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const resetForm = () => { setTitle(""); setType("generic"); setTargetDate(""); setTargetNumber(""); setDateType("specific"); };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Eliminar meta?")) return;
    await fetch(`${API_URL}/goals/${id}`, { method: "DELETE" });
    fetchGoals();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-inter">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className={`text-4xl font-bold flex items-center gap-4 ${isDark ? 'text-white' : 'text-[#2A1D11]'}`}>
            <Target className="text-orange-500 w-10 h-10" /> Objetivos y Metas
          </h1>
          <p className={`mt-2 text-lg font-light ${isDark ? 'text-white/60' : 'text-black/40'}`}>Estructura tus ambiciones de forma clara.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-xl shadow-orange-500/20 transition-all active:scale-95"><Plus size={20} /> Nueva Meta</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <div key={goal.id} onClick={() => navigate(`/goals/${goal.id}`)} className={`group cursor-pointer border rounded-2xl p-8 transition-all relative overflow-hidden backdrop-blur-3xl ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/60 border-black/10 hover:bg-white/80'}`}>
            <div className="flex items-start justify-between mb-6 relative z-10">
              <div className={`p-4 rounded-xl ${goal.color.replace('bg-', 'bg-opacity-20 text-')} text-white`}>{goal.type === 'date_deadline' ? <CalendarIcon size={24} /> : goal.type === 'amount' ? <Hash size={24} /> : goal.type === 'boolean' ? <CheckCircle2 size={24} /> : <Target size={24} />}</div>
              <button onClick={(e) => handleDelete(goal.id, e)} className={`p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${isDark ? 'text-red-500/60 hover:text-red-500' : 'text-red-600/60 hover:text-red-600'}`}><Trash2 size={18} /></button>
            </div>
            <h3 className={`text-xl font-bold mb-6 font-sf ${isDark ? 'text-white' : 'text-[#2A1D11]'}`}>{goal.title}</h3>
            <div className={`pt-6 border-t flex items-center justify-between text-[11px] font-bold uppercase tracking-widest opacity-40 ${isDark ? 'border-white/5 text-white' : 'border-black/5 text-black'}`}><span>{goal.target_date || "Sin plazo"}</span><ArrowRight size={14} className="text-orange-500" /></div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Meta" isDark={isDark}>
        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>¿Qué quieres lograr?</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Libertad financiera..." className={`w-full border rounded-xl px-5 py-4 mt-2 transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
          </div>
          <div className="space-y-4">
             <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Tipo de Medición</label>
             <div className="grid grid-cols-2 gap-2">
                {TYPES.map(t => (
                   <button key={t.id} type="button" onClick={() => setType(t.id)} className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${type === t.id ? 'bg-orange-500/20 border-orange-500' : isDark ? 'bg-white/5 border-white/5 text-white/40' : 'bg-black/5 border-black/5 text-black/40'}`}>
                      <t.icon size={20} className={type === t.id ? 'text-orange-500' : ''} />
                      <span className={`text-[10px] font-bold text-center ${isDark ? 'text-white/70' : 'text-black/70'}`}>{t.name}</span>
                   </button>
                ))}
             </div>
          </div>
          <div className="space-y-4">
             <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Plazo de Tiempo</label>
             <div className="flex gap-2">
                {['specific', 'month'].map(v => (
                   <button key={v} type="button" onClick={() => setDateType(v)} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase border transition-all ${dateType === v ? 'bg-orange-500/10 border-orange-500 text-orange-500' : isDark ? 'bg-white/5 border-transparent text-white/30' : 'bg-black/5 border-transparent text-black/30'}`}>{v === 'specific' ? 'Fecha Exacta' : 'Mes Objetivo'}</button>
                ))}
             </div>
             {dateType === 'specific' ? <input type="date" required value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className={`w-full border rounded-xl px-5 py-4 mt-2 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} /> : <input type="month" required value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className={`w-full border rounded-xl px-5 py-4 mt-2 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />}
          </div>
          <button disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-5 rounded-xl text-lg">Crear Meta</button>
        </form>
      </Modal>
    </div>
  );
}
