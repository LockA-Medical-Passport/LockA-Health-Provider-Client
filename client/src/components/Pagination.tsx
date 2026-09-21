import { Spinner } from './Spinner';
import { ErrorState } from './ErrorState';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
  error: boolean;
  requestedPage: number;
  previous: () => void;
  next: () => void;
  reload: () => void;
}

export function Pagination({ page, pageSize, total, hasMore, loading, error, requestedPage, previous, next, reload }: PaginationProps) {
  return (
    <div className="mt-5 space-y-4">
      {error && <ErrorState onRetry={reload} />}
      <nav aria-label="Pagination" className="flex items-center justify-between gap-3 flex-wrap">
        <button type="button" className="btn-secondary rounded-lg px-4 py-2 text-sm" disabled={loading || error || page <= 1} onClick={previous}>
          Previous
        </button>
        <span role="status" className="text-xs text-slate-400 flex items-center gap-2">
          {loading ? <><Spinner size={14} /> Loading page {requestedPage}…</> : `Page ${page} of ${Math.max(1, Math.ceil(total / pageSize))} · ${total} total`}
        </span>
        <button type="button" className="btn-secondary rounded-lg px-4 py-2 text-sm" disabled={loading || error || !hasMore} onClick={next}>
          Next
        </button>
      </nav>
    </div>
  );
}
