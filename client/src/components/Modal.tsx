import { useEffect, useId } from 'react';
import type { ReactNode } from 'react';
import { CloseIcon } from './Icons';

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="glass-bright rounded-2xl w-full min-w-0 max-w-lg max-h-[calc(100dvh-2rem)] sm:max-h-[85dvh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-blue-900/30 sticky top-0 z-10 glass-bright">
          <h3 id={titleId} className="min-w-0 break-words text-base font-semibold text-white">{title}</h3>
          <button aria-label="Close dialog" onClick={onClose} className="text-slate-400 hover:text-white min-w-11 min-h-11 shrink-0 flex items-center justify-center">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
