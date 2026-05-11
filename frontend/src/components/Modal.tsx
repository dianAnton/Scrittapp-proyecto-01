import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  isDark?: boolean;
}

export default function Modal({ isOpen, onClose, title, children, isDark = true }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-xl border rounded-3xl shadow-2xl overflow-hidden transition-colors duration-300 ${
              isDark 
                ? 'bg-[#111] border-white/10 text-white' 
                : 'bg-[#FDFCF0] border-black/10 text-[#2A1D11]'
            }`}
          >
            <div className={`p-6 border-b flex items-center justify-between ${
              isDark ? 'border-white/5 bg-white/5' : 'border-black/5 bg-black/5'
            }`}>
              <h3 className="text-xl font-bold font-sf">{title}</h3>
              <button 
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors ${
                  isDark ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-black/10 text-black/50 hover:text-black'
                }`}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 max-h-[80vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
