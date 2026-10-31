import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (title: string, options?: { type?: ToastType; message?: string }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((title: string, options?: { type?: ToastType; message?: string }) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const newToast: ToastItem = {
      id,
      title,
      type: options?.type || 'success',
      message: options?.message
    };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-white border border-[#E5ECEC] shadow-lg text-[#252B2E]"
            >
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#2E9F92] shrink-0 mt-0.5" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-[#E96F50] shrink-0 mt-0.5" />}
              {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-[#E96F50] shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-[#345C64] shrink-0 mt-0.5" />}

              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold tracking-tight text-[#252B2E]">{toast.title}</div>
                {toast.message && <div className="text-xs text-[#56666B] mt-0.5 leading-relaxed">{toast.message}</div>}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-[#56666B] hover:text-[#1F3F47] transition-colors p-1 rounded hover:bg-[#F7FAFA]"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
