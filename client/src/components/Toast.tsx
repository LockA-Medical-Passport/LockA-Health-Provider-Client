import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { CloseIcon } from './Icons';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  toast: (kind: ToastKind, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_STYLES: Record<ToastKind, { border: string; icon: string; color: string }> = {
  success: { border: 'rgba(16,185,129,0.35)', icon: '✓', color: '#10b981' },
  error: { border: 'rgba(239,68,68,0.35)', icon: '✕', color: '#ef4444' },
  info: { border: 'rgba(59,130,246,0.35)', icon: 'ℹ', color: '#3b82f6' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (kind: ToastKind, message: string) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, kind, message }]);
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => {
          const style = KIND_STYLES[t.kind];
          return (
            <div
              key={t.id}
              className="glass-bright rounded-xl px-4 py-3 flex items-start gap-3 animate-slide-up shadow-lg"
              style={{ borderColor: style.border }}
            >
              <span className="font-bold" style={{ color: style.color }}>
                {style.icon}
              </span>
              <span className="text-sm text-slate-200 flex-1">{t.message}</span>
              <button onClick={() => removeToast(t.id)} className="text-slate-500 hover:text-slate-300">
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
