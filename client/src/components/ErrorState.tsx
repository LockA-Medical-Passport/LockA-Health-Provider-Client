import { GlassCard } from './GlassCard';
import { AlertIcon, RefreshIcon } from './Icons';

export function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <GlassCard role="alert" className="p-8 text-center">
      <AlertIcon className="w-8 h-8 text-red-400 mx-auto mb-3" />
      <p className="text-sm text-slate-300 mb-4">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="btn-secondary rounded-lg px-4 py-2 text-sm inline-flex items-center gap-2 mx-auto"
      >
        <RefreshIcon className="w-4 h-4" />
        Retry
      </button>
    </GlassCard>
  );
}
