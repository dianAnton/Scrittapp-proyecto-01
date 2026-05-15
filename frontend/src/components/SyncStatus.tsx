import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function SyncStatus({ isDark, isCollapsed }: { isDark: boolean, isCollapsed: boolean }) {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isSyncing = isFetching > 0 || isMutating > 0;

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!isOnline ? (
          <motion.div
            key="offline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
              isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50/80 border-red-200 text-red-600'
            } ${isCollapsed ? 'justify-center' : ''}`}
            title="Modo Local"
          >
            <CloudOff size={18} className="shrink-0" />
            {!isCollapsed && (
              <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Modo Local</span>
            )}
          </motion.div>
        ) : isSyncing ? (
          <motion.div
            key="syncing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
              isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-orange-50/80 border-orange-200 text-orange-600'
            } ${isCollapsed ? 'justify-center' : ''}`}
            title="Sincronizando..."
          >
            <RefreshCw size={18} className="animate-spin shrink-0" />
            {!isCollapsed && (
              <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Sincronizando</span>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="synced"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
              isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50/80 border-emerald-200 text-emerald-600'
            } ${isCollapsed ? 'justify-center' : ''}`}
            title="Sincronizado"
          >
            <Cloud size={18} className="shrink-0" />
            {!isCollapsed && (
              <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Sincronizado</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
