import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { CloseIcon } from './Icons';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const originalOverflow = document.body.style.overflow;

    function getFocusableElements() {
      return Array.from(dialog?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        e.preventDefault();
        dialog?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || active === dialog || !dialog?.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || active === dialog || !dialog?.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    (getFocusableElements()[0] ?? dialog)?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="glass-bright rounded-2xl w-full min-w-0 max-w-lg max-h-[calc(100dvh-2rem)] sm:max-h-[85dvh] overflow-y-auto animate-slide-up outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-blue-900/30 sticky top-0 z-10 glass-bright">
          <h3 id={titleId} className="min-w-0 break-words text-base font-semibold text-white">{title}</h3>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="text-slate-400 hover:text-white min-w-11 min-h-11 shrink-0 flex items-center justify-center"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
