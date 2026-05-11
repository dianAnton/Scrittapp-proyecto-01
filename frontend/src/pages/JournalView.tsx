import { useState, useEffect, useRef } from "react";
import { FileText, ChevronDown, Plus, Bold, Italic, Type, Download, Folder, Trash2 } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Modal from "../components/Modal";

const API_URL = "http://localhost:3001/api";

export default function JournalView({ isDark }: { isDark: boolean }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dateParam = searchParams.get("date");
  const todayStr = new Date().toISOString().split('T')[0];
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

  const [newNoteDate, setNewNoteDate] = useState(todayStr);
  const [newNoteTitle, setNewNoteTitle] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/notes?date=${activeDate}`)
      .then(r => r.json())
      .then(data => {
        setTitle(data.title || activeDate);
        if (editorRef.current) {
          editorRef.current.innerHTML = data.content || "";
        }
      })
      .catch(console.error);

    fetch(`${API_URL}/notes`)
      .then(r => r.json())
      .then(data => setHistory(data))
      .catch(console.error);
  }, [activeDate]);

  const handleSave = async () => {
    if (!editorRef.current) return;
    try {
      await fetch(`${API_URL}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: activeDate, content: editorRef.current.innerHTML, title })
      });
      fetch(`${API_URL}/notes`).then(r => r.json()).then(setHistory);
    } catch (e) { console.error(e); }
  };

  const createNewNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
       await fetch(`${API_URL}/notes`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ date: newNoteDate, content: "", title: newNoteTitle || newNoteDate })
       });
       setIsNewNoteModalOpen(false);
       navigate(`/journal?date=${newNoteDate}`);
    } catch (e) { console.error(e); }
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
      <div className={`transition-all duration-300 border-r flex flex-col vault-sidebar ${isVaultOpen ? 'w-64' : 'w-0'} ${isDark ? 'bg-[#161616] border-white/5' : 'bg-[#F5F4E8] border-black/5'}`}>
        <div className="p-4 flex items-center justify-between border-b border-white/5">
          <span className={`text-[10px] font-bold opacity-40 uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
            <Folder size={12} className="text-orange-500/50" /> Vault
          </span>
          <button onClick={() => setIsNewNoteModalOpen(true)} className="p-1 hover:bg-black/5 rounded text-orange-500"><Plus size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
           {history.map(item => (
             <a key={item.date} href={`/journal?date=${item.date}`} className={`flex items-center gap-2 px-3 py-2 text-[13px] rounded-md transition-all ${item.date === activeDate ? 'bg-orange-500/10 text-orange-600 font-bold' : 'opacity-40 hover:bg-black/5 hover:opacity-80'}`}>
               <FileText size={12} className={item.date === activeDate ? 'text-orange-500' : 'opacity-20'} />
               <span className="truncate">{item.title || item.date}</span>
             </a>
           ))}
        </div>
      </div>

      {/* EDITOR */}
      <div className="flex-1 flex flex-col min-w-0 editor-main relative">
        {/* TAB BAR */}
        <div className={`h-12 border-b flex items-center px-4 justify-between ${isDark ? 'bg-[#161616] border-white/5' : 'bg-[#F5F4E8] border-black/5'} print:hidden`}>
           <div className={`h-full border-r px-4 flex items-center gap-2 text-[12px] font-bold border-t-2 border-t-orange-500 ${isDark ? 'bg-[#0d0d0d] text-orange-400 border-white/5' : 'bg-[#FDFCF0] text-orange-600 border-black/5'}`}>
              <FileText size={12} /> {title}.note
           </div>
           <div className="flex items-center gap-3">
              <button onClick={() => window.print()} className={`text-[11px] px-3 py-1.5 rounded flex items-center gap-2 border transition-all ${isDark ? 'border-white/10 text-white/40 hover:text-white' : 'border-black/10 text-black/40 hover:text-black'}`}><Download size={14} /> Exportar</button>
           </div>
        </div>

        {/* FLOATING TOOLBAR */}
        {showToolbar && (
          <div 
            ref={toolbarRef}
            className={`fixed z-[100] flex items-center gap-1 p-1 rounded-lg shadow-2xl animate-in zoom-in-95 duration-200 border ${isDark ? 'bg-[#222] border-white/10' : 'bg-white border-black/10'}`}
            style={{ top: toolbarPos.top, left: toolbarPos.left }}
          >
             <button onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }} className={`p-2 rounded hover:bg-black/5 ${isDark ? 'text-white' : 'text-black'}`}><Bold size={16} /></button>
             <button onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }} className={`p-2 rounded hover:bg-black/5 ${isDark ? 'text-white' : 'text-black'}`}><Italic size={16} /></button>
             <div className="w-[1px] h-4 bg-black/10 mx-1" />
             <button onMouseDown={(e) => { e.preventDefault(); setFontSize(Math.min(32, fontSize + 2)); }} className={`p-2 rounded hover:bg-black/5 ${isDark ? 'text-white' : 'text-black'}`}><Type size={16} /></button>
             <button onMouseDown={(e) => { e.preventDefault(); setFontSize(Math.max(12, fontSize - 2)); }} className={`p-2 rounded hover:bg-black/5 ${isDark ? 'text-white' : 'text-black'}`}><Type size={12} /></button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-8 md:px-20 lg:px-32 py-16">
           <div className="max-w-3xl mx-auto">
              <input 
                 value={title} 
                 onChange={(e) => setTitle(e.target.value)} 
                 onBlur={handleSave} 
                 className={`text-5xl font-bold w-full bg-transparent border-none outline-none font-sf tracking-tight mb-12 ${isDark ? 'text-white' : 'text-black'}`} 
                 placeholder="Sin título" 
              />
              <div 
                ref={editorRef}
                contentEditable
                onBlur={handleSave}
                onInput={handleSave}
                style={{ fontSize: `${fontSize}px` }}
                className={`w-full min-h-[600px] outline-none font-inter leading-relaxed prose prose-lg max-w-none ${isDark ? 'prose-invert text-white/80' : 'text-black/80'}`}
              />
           </div>
        </div>
      </div>

      <Modal isOpen={isNewNoteModalOpen} onClose={() => setIsNewNoteModalOpen(false)} title="Nueva Nota" isDark={isDark}>
         <form onSubmit={createNewNote} className="space-y-6">
            <div>
               <label className="text-[10px] uppercase font-bold opacity-40 tracking-widest ml-1">Fecha</label>
               <input type="date" required value={newNoteDate} onChange={(e) => setNewNoteDate(e.target.value)} className={`w-full border rounded-xl px-5 py-4 mt-2 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
            </div>
            <div>
               <label className="text-[10px] uppercase font-bold opacity-40 tracking-widest ml-1">Título</label>
               <input value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} placeholder="Título opcional..." className={`w-full border rounded-xl px-5 py-4 mt-2 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
            </div>
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-5 rounded-xl text-lg">Crear Nota</button>
         </form>
      </Modal>

      <style>{`
        [contenteditable]:empty:before {
          content: "Empieza a escribir aquí...";
          opacity: 0.2;
          font-style: italic;
        }
        @media print {
          .vault-sidebar, .tab-bar, .fixed { display: none !important; }
          .editor-main { width: 100% !important; background: white !important; color: black !important; }
        }
      `}</style>
    </div>
  );
}
