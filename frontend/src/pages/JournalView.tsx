import { useState, useEffect, useRef } from "react";
import { FileText, ChevronLeft, Plus, Trash2, Hash, List, Quote, Code, Minus, X, ChevronRight, PanelLeftClose, PanelLeft, Bold, Italic, Type, Underline } from "lucide-react";
import { useSearchParams } from "react-router-dom";
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
  const { user } = useAuth();
  const dateParam = searchParams.get("date");
  const noteIdParam = searchParams.get("id");
  const todayStr = getLocalDateString(new Date());
  const activeDate = dateParam || todayStr;

  const [title, setTitle] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [openTabs, setOpenTabs] = useState<{id: string, title: string, date: string}[]>(() => {
    const saved = localStorage.getItem("journal-open-tabs");
    return saved ? JSON.parse(saved) : [];
  });
  const [isVaultOpen, setIsVaultOpen] = useState(true);
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState(18);

  const editorRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState({ words: 0, chars: 0 });
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
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
    
    if (!noteIdParam && data && data.length > 0) {
      setSearchParams({ date: activeDate, id: data[0].id });
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchDayNotes();
  }, [activeDate, user]);

  useEffect(() => {
    localStorage.setItem("journal-open-tabs", JSON.stringify(openTabs));
  }, [openTabs]);

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
      setTitle(data.title || "Sin título");
      setOpenTabs(prev => {
        if (prev.find(t => t.id === data.id)) return prev;
        return [...prev, { id: data.id, title: data.title || "Sin título", date: data.date }];
      });
      if (editorRef.current && editorRef.current.innerHTML !== data.content) {
        editorRef.current.innerHTML = data.content || "";
        updateStats();
      }
    }
  };

    fetchCurrentNote();
  }, [noteIdParam, user]);

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t.id !== id);
    setOpenTabs(newTabs);
    
    if (id === noteIdParam) {
      if (newTabs.length > 0) {
        const lastTab = newTabs[newTabs.length - 1];
        setSearchParams({ date: lastTab.date, id: lastTab.id });
      } else {
        setSearchParams({ date: activeDate });
      }
    }
  };

  const updateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    setStats({ words, chars });
  };

  const handleSave = async () => {
    if (!editorRef.current || !user || !noteIdParam) return;
    setIsSaving(true);
    const content = editorRef.current.innerHTML;
    
    await supabase
      .from("notes")
      .update({ content, title: title || "Sin título" })
      .eq("id", noteIdParam)
      .eq("user_id", user.id);

    setIsSaving(false);
    setHistory(prev => prev.map(n => n.id === noteIdParam ? { ...n, title: title || "Sin título" } : n));
    updateStats();
  };

  const createNewNote = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("notes")
      .insert([{ user_id: user.id, date: activeDate, content: "", title: newNoteTitle || "Nueva Nota" }])
      .select().single();

    if (!error && data) {
       setIsNewNoteModalOpen(false);
       setNewNoteTitle("");
       setOpenTabs(prev => [...prev, { id: data.id, title: data.title || "Nueva Nota", date: data.date }]);
       setSearchParams({ date: activeDate, id: data.id });
       fetchDayNotes();
    }
  };

  const handleDelete = async () => {
    if (!noteIdParam || !confirm("¿Eliminar esta nota?") || !user) return;
    const { error } = await supabase.from("notes").delete().eq("id", noteIdParam).eq("user_id", user.id);
    if (!error) {
       const newHistory = history.filter(n => n.id !== noteIdParam);
       setHistory(newHistory);
       if (newHistory.length > 0) setSearchParams({ date: activeDate, id: newHistory[0].id });
       else setSearchParams({ date: activeDate });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      document.execCommand('bold', false);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.execCommand('italic', false);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      document.execCommand('underline', false);
    }
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (selection && selection.focusNode) {
        const parent = selection.focusNode.parentElement;
        if (parent && (parent.tagName === 'H1' || parent.tagName === 'H2' || parent.tagName === 'H3' || parent.tagName === 'BLOCKQUOTE')) {
          // If we are at the end of a header, pressing enter should create a normal paragraph
          setTimeout(() => {
            document.execCommand('formatBlock', false, 'p');
          }, 0);
        }
      }
    }
  };

  const handleInput = () => {
    updateStats();
    handleSave();
  };

  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width > 0) {
        setToolbarPos({ 
          top: rect.top - 80 + window.scrollY, 
          left: rect.left + rect.width / 2 - 100 
        });
        setShowToolbar(true);
      }
    } else {
      setShowToolbar(false);
    }
  };

  const changeFontSize = (increase: boolean) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    // We use a cycle of sizes (1-7) for document.execCommand fontSize
    // 3 is normal, 5 is large, 7 is very large
    const currentSize = document.queryCommandValue("fontSize") || "3";
    let nextSize = "3";
    
    if (increase) {
      if (currentSize === "3") nextSize = "5";
      else if (currentSize === "5") nextSize = "7";
      else nextSize = "7";
    } else {
      if (currentSize === "7") nextSize = "5";
      else if (currentSize === "5") nextSize = "3";
      else nextSize = "1";
    }

    document.execCommand("fontSize", false, nextSize);
    handleSave();
  };

  const execCommand = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    setShowSlashMenu(false);
    handleSave();
  };

  const insertBlock = (type: string) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.focusNode) {
        const text = selection.focusNode.textContent || "";
        selection.focusNode.textContent = text.replace("/", "");
      }
      execCommand(type === 'h1' || type === 'h2' || type === 'blockquote' ? 'formatBlock' : type, type);
    }
  };

  return (
    <div className={`flex h-screen font-inter overflow-hidden obsidian-theme ${isDark ? 'bg-[#0f0f0f] text-[#b3b3b3]' : 'bg-[#FDFCF0] text-[#333]'}`} onMouseUp={handleSelection}>
      
      {/* OBSIDIAN SIDEBAR */}
      <div className={`transition-all duration-300 flex flex-col relative overflow-hidden border-r ${isVaultOpen ? 'w-[300px]' : 'w-0'} ${isDark ? 'bg-[#1e1e1e] border-white/5' : 'bg-[#F8F7EB] border-black/5'}`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-5 border-b border-black/5">
           <div className="flex items-center gap-3">
              <span className="text-[13px] font-black uppercase tracking-[0.2em] opacity-50">Explorador</span>
           </div>
           <div className="flex items-center gap-1">
              <button onClick={() => setIsNewNoteModalOpen(true)} className="p-2 hover:bg-black/5 rounded-md transition-colors"><Plus size={16} strokeWidth={2.5} /></button>
              <button onClick={() => setIsVaultOpen(false)} className="p-2 hover:bg-black/5 rounded-md transition-colors"><PanelLeftClose size={16} strokeWidth={1.5} /></button>
           </div>
        </div>

        {/* File Tree */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
           <div className="pl-4 py-2 flex items-center gap-3 text-[11px] font-bold opacity-30 uppercase tracking-[0.2em]">
              <ChevronRight size={12} strokeWidth={3} /> {activeDate}
           </div>
           {history.map(item => (
             <div key={item.id} 
               onClick={() => {
                 if (!openTabs.find(t => t.id === item.id)) {
                   setOpenTabs(prev => [...prev, { id: item.id, title: item.title || "Sin título", date: item.date }]);
                 }
                 setSearchParams({ date: activeDate, id: item.id });
               }} 
               className={`group flex items-center gap-3 px-5 py-3 rounded-sm cursor-pointer transition-all ${item.id === noteIdParam ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'hover:bg-black/5 opacity-80 hover:opacity-100'}`}>
               <FileText size={15} strokeWidth={1.5} className={item.id === noteIdParam ? 'text-white' : 'opacity-30'} />
               <p className={`text-[14px] truncate flex-1 font-semibold ${item.id === noteIdParam ? 'text-white' : ''}`}>{item.title || "Sin título"}</p>
             </div>
           ))}
        </div>
      </div>

      {/* EDITOR MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        {/* OBSIDIAN TABSBAR */}
        <div className={`h-14 flex items-center px-4 border-b z-20 ${isDark ? 'bg-[#0f0f0f] border-white/5' : 'bg-[#F8F7EB] border-black/5'}`}>
        {/* SELECTION TOOLBAR */}
        {showToolbar && (
          <div 
            className={`fixed z-[100] flex items-center gap-1 p-1.5 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 border backdrop-blur-3xl ${isDark ? 'bg-black/95 border-white/10' : 'bg-white/95 border-black/10'}`}
            style={{ top: toolbarPos.top, left: toolbarPos.left }}
          >
             <button onMouseDown={(e) => { e.preventDefault(); changeFontSize(true); }} className={`p-2.5 hover:bg-accent/10 hover:text-accent rounded-xl transition-all flex items-center gap-1`}>
               <Type size={14} strokeWidth={2.5} />
               <span className="text-[10px] font-bold">↑</span>
             </button>
             <button onMouseDown={(e) => { e.preventDefault(); changeFontSize(false); }} className={`p-2.5 hover:bg-accent/10 hover:text-accent rounded-xl transition-all flex items-center gap-1`}>
               <Type size={14} strokeWidth={2.5} />
               <span className="text-[10px] font-bold">↓</span>
             </button>
             <div className="w-[1px] h-4 bg-black/10 mx-1.5" />
             <button onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }} className={`p-2.5 hover:bg-accent/10 hover:text-accent rounded-xl transition-all`}><Bold size={16} strokeWidth={2.5} /></button>
             <button onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }} className={`p-2.5 hover:bg-accent/10 hover:text-accent rounded-xl transition-all`}><Italic size={16} strokeWidth={2.5} /></button>
             <button onMouseDown={(e) => { e.preventDefault(); execCommand('underline'); }} className={`p-2.5 hover:bg-accent/10 hover:text-accent rounded-xl transition-all`}><Underline size={16} strokeWidth={2.5} /></button>
          </div>
        )}
           {/* Sidebar Toggle when closed */}
           {!isVaultOpen && (
             <button onClick={() => setIsVaultOpen(true)} className="p-2 mr-4 hover:bg-black/5 rounded-lg transition-all"><PanelLeft size={20} strokeWidth={1.5} /></button>
           )}

           {/* Dynamic Tabs */}
           <div className="flex items-center overflow-x-auto no-scrollbar">
             {openTabs.map(tab => (
               <div 
                 key={tab.id} 
                 onClick={() => setSearchParams({ date: tab.date, id: tab.id })}
                 className={`h-14 flex items-center gap-4 px-6 border-r border-black/5 relative transition-all group cursor-pointer ${tab.id === noteIdParam ? (isDark ? 'bg-[#1e1e1e]' : 'bg-[#FDFCF0] shadow-sm') : 'opacity-50 hover:opacity-100'}`}
               >
                  <FileText size={14} strokeWidth={1.5} className="opacity-40" />
                  <span className="text-[13px] font-bold truncate max-w-[150px]">{tab.title}</span>
                  <X 
                    size={12} 
                    onClick={(e) => closeTab(tab.id, e)}
                    className="opacity-0 group-hover:opacity-40 hover:opacity-100 cursor-pointer transition-all" 
                  />
                  {tab.id === noteIdParam && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-accent" />
                  )}
               </div>
             ))}
           </div>
           
           <div className="flex items-center h-full ml-1">
              <button onClick={() => setIsNewNoteModalOpen(true)} className="p-2.5 opacity-40 hover:opacity-100 hover:bg-black/5 rounded-lg transition-all"><Plus size={18} strokeWidth={1.5} /></button>
           </div>
           
           <div className="flex-1" />
           <div className="flex items-center gap-2 px-2">
              <button onClick={handleDelete} className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all active:scale-95"><Trash2 size={20} strokeWidth={1.5} /></button>
           </div>
        </div>

        {/* BREADCRUMBS */}
        <div className={`px-8 py-4 border-b text-[10px] font-black uppercase tracking-[0.2em] opacity-20 flex items-center gap-3 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
           <span>Diario</span>
           <ChevronRight size={12} strokeWidth={3} />
           <span>{activeDate}</span>
           <ChevronRight size={12} strokeWidth={3} />
           <span className="opacity-100 text-accent">{title}</span>
        </div>

        {/* EDITOR AREA */}
      <div className="flex-1 overflow-y-auto px-6 py-12 custom-scrollbar scroll-smooth bg-transparent relative">
           <div className="max-w-5xl mx-auto">
              {noteIdParam ? (
                <>
                  <input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    onBlur={handleSave} 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        editorRef.current?.focus();
                      }
                    }}
                    className={`text-6xl font-black w-full bg-transparent border-none outline-none tracking-tight mb-16 ${isDark ? 'text-white' : 'text-[#111]'}`} 
                    placeholder="Sin título" 
                  />
                    <div 
                      ref={editorRef}
                      contentEditable
                      onInput={handleInput}
                      onKeyDown={handleKeyDown}
                      onMouseUp={handleSelection}
                      onKeyUp={handleSelection}
                      onBlur={handleSave}
                      style={{ fontSize: `${fontSize}px` }}
                      className={`obsidian-canvas w-full min-h-[75vh] outline-none leading-[1.9] prose prose-xl max-w-none ${isDark ? 'prose-invert text-white/70' : 'text-[#222]'}`}
                    />
                </>
              ) : (
                <div className="h-[75vh] flex flex-col items-center justify-center text-center space-y-10">
                   <div className="w-24 h-24 rounded-3xl border-4 border-dashed border-current flex items-center justify-center opacity-20">
                      <Plus size={40} strokeWidth={1} />
                   </div>
                   <div className="space-y-4 opacity-20">
                      <p className="text-sm font-black uppercase tracking-[0.4em]">Núcleo de Escritura</p>
                   </div>
                   <button 
                     onClick={() => setIsNewNoteModalOpen(true)} 
                     className={`px-12 py-5 rounded-xl bg-accent border-2 border-accent text-white transition-all text-xs font-black uppercase tracking-widest active:scale-95 hover:brightness-110`}
                   >
                     Nueva Entrada
                   </button>
                </div>
              )}
           </div>
        </div>

        {/* OBSIDIAN STATUS BAR */}
        <div className={`h-10 border-t px-10 flex items-center justify-end text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ${isDark ? 'bg-[#1e1e1e] border-white/5' : 'bg-[#F8F7EB] border-black/5'}`}>
           <div className="flex gap-10 items-center">
              <span>{stats.words} palabras</span>
              <span>{stats.chars} caracteres</span>
              <div className="flex items-center gap-3">
                 <div className={`w-2 h-2 rounded-full transition-all duration-500 ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                 <span>{isSaving ? 'Sincronizando' : 'Sincronizado'}</span>
              </div>
           </div>
        </div>

      </div>

      <Modal isOpen={isNewNoteModalOpen} onClose={() => setIsNewNoteModalOpen(false)} title="Nueva Nota" isDark={isDark}>
         <div className="space-y-10 py-4">
            <div className="space-y-4">
               <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Título de la Nota</label>
               <input 
                  autoFocus 
                  value={newNoteTitle} 
                  onChange={(e) => setNewNoteTitle(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && createNewNote()} 
                  placeholder="Ej: Ideas para el proyecto..." 
                  className={`w-full border rounded-xl px-5 py-4 mt-2 focus:border-accent outline-none transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} 
               />
               <p className={`text-[10px] opacity-30 italic ml-1 mt-1 ${isDark ? 'text-white' : 'text-black'}`}>Se guardará automáticamente en: {activeDate}</p>
            </div>
            <div className="flex flex-col gap-3">
               <button 
                  onClick={createNewNote} 
                  className="w-full bg-accent text-white font-bold py-5 rounded-xl text-lg transition-all active:scale-95 uppercase tracking-widest"
               >
                  Crear
               </button>
               <button 
                  onClick={() => setIsNewNoteModalOpen(false)} 
                  className={`w-full py-4 rounded-xl text-xs font-bold opacity-40 hover:opacity-100 transition-all uppercase tracking-widest ${isDark ? 'text-white' : 'text-black'}`}
               >
                  Cancelar
               </button>
            </div>
         </div>
      </Modal>

      <style>{`
        .obsidian-canvas:empty:before {
          content: "Escribe algo extraordinario hoy...";
          opacity: 0.1;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.2); border-radius: 10px; }
        
        .obsidian-canvas h1 { font-size: 3.5rem; font-weight: 900; letter-spacing: -0.06em; border-bottom: 2px solid rgba(128,128,128,0.1); padding-bottom: 0.75rem; margin-bottom: 2.5rem; color: inherit; }
        .obsidian-canvas h2 { font-size: 2.25rem; font-weight: 800; letter-spacing: -0.04em; margin-top: 3.5rem; border-bottom: 1px solid rgba(128,128,128,0.05); }
        .obsidian-canvas blockquote { border-left: 5px solid var(--accent-color); padding-left: 2.5rem; color: inherit; opacity: 0.7; font-style: italic; }
        .obsidian-canvas pre { background: rgba(128,128,128,0.05); padding: 2rem; border-radius: 12px; font-family: ui-monospace, SFMono-Regular, monospace; font-size: 0.95em; }
        
        .obsidian-theme {
          --accent-color-rgb: 79, 70, 229;
        }
      `}</style>
    </div>
  );
}
