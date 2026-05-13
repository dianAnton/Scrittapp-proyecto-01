import { useState, useEffect, useRef } from "react";
import { FileText, ChevronLeft, Plus, Bold, Italic, Type, Download, Folder, Trash2 } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

const getLocalDateString = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - offset);
  return local.toISOString().split('T')[0];
};

export default function JournalView({ isDark }: { isDark: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const dateParam = searchParams.get("date");
  const noteIdParam = searchParams.get("id");
  const todayStr = getLocalDateString(new Date());
  const activeDate = dateParam || todayStr;

  const [title, setTitle] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [isVaultOpen, setIsVaultOpen] = useState(true);
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState(18);

  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });

  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchDayNotes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notes")
      .select("id, title, date")
      .eq("date", activeDate)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setHistory(data || []);
    
    // If no note selected but notes exist, select first
    if (!noteIdParam && data && data.length > 0) {
      setSearchParams({ date: activeDate, id: data[0].id });
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchDayNotes();
  }, [activeDate, user]);

  useEffect(() => {
    if (!user || !noteIdParam) {
      setTitle(activeDate);
      if (editorRef.current) editorRef.current.innerHTML = "";
      return;
    }

    const fetchCurrentNote = async () => {
      const { data } = await supabase
        .from("notes")
        .select("*")
        .eq("id", noteIdParam)
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setTitle(data.title || "Nota sin título");
        if (editorRef.current) {
          editorRef.current.innerHTML = data.content || "";
        }
      }
    };

    fetchCurrentNote();
  }, [noteIdParam, user]);

  const handleSave = async () => {
    if (!editorRef.current || !user || !noteIdParam) return;
    setIsSaving(true);
    const content = editorRef.current.innerHTML;
    
    const { error } = await supabase
      .from("notes")
      .update({ 
        content, 
        title: title || "Nota sin título" 
      })
      .eq("id", noteIdParam)
      .eq("user_id", user.id);

    if (error) console.error(error);
    setTimeout(() => setIsSaving(false), 500);
    
    // Refresh sidebar titles
    setHistory(prev => prev.map(n => n.id === noteIdParam ? { ...n, title: title || "Nota sin título" } : n));
  };

  const createNewNote = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("notes")
      .insert([{ 
        user_id: user.id, 
        date: activeDate, 
        content: "", 
        title: newNoteTitle || "Nueva Nota" 
      }])
      .select()
      .single();

    if (!error && data) {
       setIsNewNoteModalOpen(false);
       setNewNoteTitle("");
       setSearchParams({ date: activeDate, id: data.id });
       fetchDayNotes();
    } else {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!noteIdParam || !confirm("¿Eliminar esta nota permanentemente?") || !user) return;
    const { error } = await supabase.from("notes").delete().eq("id", noteIdParam).eq("user_id", user.id);
    if (!error) {
       const newHistory = history.filter(n => n.id !== noteIdParam);
       setHistory(newHistory);
       if (newHistory.length > 0) {
         setSearchParams({ date: activeDate, id: newHistory[0].id });
       } else {
         setSearchParams({ date: activeDate });
       }
    }
  };

  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setToolbarPos({
        top: rect.top - 50 + window.scrollY,
        left: rect.left + rect.width / 2 - 50
      });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  };

  const execCommand = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    handleSave();
  };

  return (
    <div className={`flex h-screen font-inter overflow-hidden journal-container ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#FDFCF0]'}`} onMouseUp={handleSelection}>
      {/* SIDEBAR */}
      <div className={`transition-all duration-500 border-r flex flex-col vault-sidebar relative overflow-hidden ${isVaultOpen ? 'w-72' : 'w-0'} ${isDark ? 'bg-[#161616] border-white/5' : 'bg-[#F5F4E8] border-black/5'}`}>
        <div className="p-6 flex items-center justify-between border-b border-black/5">
          <div className="flex flex-col">
            <span className={`text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] flex items-center gap-3 ${isDark ? 'text-white' : 'text-black'}`}>
              <Folder size={14} className="text-accent" /> Notas del Día
            </span>
            <span className="text-[9px] opacity-30 mt-1 font-bold">{activeDate}</span>
          </div>
          <button onClick={() => setIsNewNoteModalOpen(true)} className="w-8 h-8 flex items-center justify-center hover:bg-accent/10 rounded-full text-accent transition-all"><Plus size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
           {history.map(item => (
             <div key={item.id} onClick={() => setSearchParams({ date: activeDate, id: item.id })} className={`group flex items-center gap-3 px-4 py-3 text-[13px] rounded-xl cursor-pointer transition-all ${item.id === noteIdParam ? 'bg-accent text-white shadow-lg' : isDark ? 'text-white/40 hover:bg-white/5 hover:text-white' : 'text-black/40 hover:bg-black/5 hover:text-black'}`}>
               <FileText size={14} className={item.id === noteIdParam ? 'text-white' : 'opacity-30'} />
               <div className="flex-1 truncate">
                  <p className="font-bold truncate">{item.title || "Sin título"}</p>
               </div>
             </div>
           ))}
           {history.length === 0 && (
             <div className="py-20 text-center opacity-20">
                <FileText size={32} className="mx-auto mb-4" />
                <p className="text-[10px] uppercase font-bold tracking-widest">No hay notas hoy</p>
             </div>
           )}
        </div>
      </div>

      {/* EDITOR */}
      <div className="flex-1 flex flex-col min-w-0 editor-main relative">
        {/* TOP BAR */}
        <div className={`h-16 border-b flex items-center px-6 justify-between ${isDark ? 'bg-[#161616] border-white/5' : 'bg-[#F5F4E8] border-black/5'} print:hidden`}>
           <div className="flex items-center gap-4">
              <button onClick={() => setIsVaultOpen(!isVaultOpen)} className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}><ChevronLeft size={20} className={isVaultOpen ? '' : 'rotate-180'} /></button>
              <div className="h-4 w-[1px] bg-black/10 mx-1" />
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full transition-all duration-500 ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                 <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">{isSaving ? 'Guardando...' : 'Guardado'}</span>
              </div>
           </div>
           
           <div className="flex items-center gap-2">
              <button onClick={handleDelete} className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
           </div>
        </div>

        {/* FLOATING TOOLBAR */}
        {showToolbar && (
          <div 
            ref={toolbarRef}
            className={`fixed z-[100] flex items-center gap-1 p-1.5 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 border backdrop-blur-xl ${isDark ? 'bg-black/80 border-white/10' : 'bg-white/80 border-black/10'}`}
            style={{ top: toolbarPos.top, left: toolbarPos.left }}
          >
             <button onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }} className={`p-2.5 rounded-xl transition-all ${isDark ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/10'}`}><Bold size={16} /></button>
             <button onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }} className={`p-2.5 rounded-xl transition-all ${isDark ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/10'}`}><Italic size={16} /></button>
             <div className="w-[1px] h-4 bg-black/10 mx-1" />
             <button onMouseDown={(e) => { e.preventDefault(); setFontSize(Math.min(32, fontSize + 2)); }} className={`p-2.5 rounded-xl transition-all ${isDark ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/10'}`}><Type size={18} /></button>
             <button onMouseDown={(e) => { e.preventDefault(); setFontSize(Math.max(12, fontSize - 2)); }} className={`p-2.5 rounded-xl transition-all ${isDark ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/10'}`}><Type size={14} /></button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-8 md:px-20 lg:px-40 py-20 custom-scrollbar scroll-smooth">
           <div className="max-w-3xl mx-auto print-content">
              {noteIdParam ? (
                <>
                  <input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    onBlur={handleSave} 
                    className={`text-6xl font-bold w-full bg-transparent border-none outline-none font-sf tracking-tighter mb-16 ${isDark ? 'text-white' : 'text-black'}`} 
                    placeholder="Título de la nota..." 
                  />
                  <div 
                    ref={editorRef}
                    contentEditable
                    onBlur={handleSave}
                    onInput={handleSave}
                    style={{ fontSize: `${fontSize}px` }}
                    className={`w-full min-h-[700px] outline-none font-inter leading-[1.8] prose prose-2xl max-w-none ${isDark ? 'prose-invert text-white/80' : 'text-black/80'}`}
                  />
                </>
              ) : (
                <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
                   <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                      <Plus size={40} />
                   </div>
                   <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Crea tu primera nota de hoy</h2>
                   <p className="opacity-40 max-w-xs mx-auto text-sm">Cada pensamiento cuenta. Registra lo que has aprendido o planeado para este día.</p>
                   <button onClick={() => setIsNewNoteModalOpen(true)} className="bg-accent text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:brightness-110 transition-all active:scale-95">Empezar a escribir</button>
                </div>
              )}
           </div>
        </div>
      </div>

      <Modal isOpen={isNewNoteModalOpen} onClose={() => setIsNewNoteModalOpen(false)} title="Nueva Nota para Hoy" isDark={isDark}>
         <div className="space-y-6">
            <div>
               <label className={`text-[10px] uppercase font-bold tracking-[0.2em] ml-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Título de la Nota</label>
               <input autoFocus value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createNewNote()} placeholder="Ej: Ideas de la mañana..." className={`w-full border rounded-xl px-5 py-4 mt-2 focus:border-accent outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
            </div>
            <button onClick={createNewNote} className="w-full bg-accent hover:brightness-110 text-white font-bold py-5 rounded-2xl text-lg shadow-[0_10px_20px_rgba(var(--accent-color-rgb),0.3)] transition-all active:scale-95">Crear Nota</button>
         </div>
      </Modal>

      <style>{`
        [contenteditable]:empty:before {
          content: "Empieza a escribir...";
          opacity: 0.15;
          font-style: italic;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.2); border-radius: 10px; }
        
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            padding: 2cm !important;
            background: white !important;
            color: black !important;
          }
          .editor-main { background: white !important; }
          input { border: none !important; color: black !important; font-size: 24pt !important; }
          [contenteditable] { color: black !important; font-size: 12pt !important; line-height: 1.6 !important; }
        }
      `}</style>
    </div>
  );
}
