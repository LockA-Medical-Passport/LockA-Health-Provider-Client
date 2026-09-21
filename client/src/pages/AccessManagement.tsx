import { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Spinner } from '../components/Spinner';
import { Badge, statusToBadgeTone } from '../components/Badge';
import { listAccessGrants, listAccessRequests, revokeAccessGrant } from '../lib/api';
import { useToast } from '../components/Toast';
import { formatDateOnly, daysUntil } from '../lib/format';
import { RECORD_CATEGORY_LABELS } from '../lib/types';
import type { AccessGrant } from '../lib/types';
import { ErrorState } from '../components/ErrorState';
import { Pagination } from '../components/Pagination';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { canRevokeAccess, useCurrentRole } from '../lib/roleContext';

type Tab = 'grants' | 'requests';

export function AccessManagement() {
  const { toast } = useToast();
  const { role } = useCurrentRole();
  const [tab, setTab] = useState<Tab>('grants');
  const grants = usePaginatedList(listAccessGrants);
  const requests = usePaginatedList(listAccessRequests);
  const current = tab === 'grants' ? grants : requests;
  const [revokingId, setRevokingId] = useState<string | null>(null);

  async function handleRevoke(grant: AccessGrant) {
    if (!canRevokeAccess(role) || revokingId) return;
    setRevokingId(grant.id);
    try {
      await revokeAccessGrant(grant.id);
      toast('info', `Access to ${grant.patientDisplayName} revoked`);
      grants.reload();
    } catch {
      toast('error', 'Failed to revoke access. Please try again.');
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Access Management</h1>
        <p className="text-slate-400 text-sm">Track active access grants and monitor your pending or resolved requests.</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button className={`tab-btn ${tab === 'grants' ? 'active' : ''}`} onClick={() => setTab('grants')}>
          Active Grants
        </button>
        <button className={`tab-btn ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
          My Access Requests
        </button>
      </div>

      {current.initialLoading ? (
        <div className="text-center py-10">
          <Spinner size={24} />
        </div>
      ) : current.error && !current.data ? (
        <ErrorState onRetry={current.reload} />
      ) : tab === 'grants' ? (
        <div className="space-y-3">
          {grants.items.length === 0 && (
            <GlassCard className="p-8 text-center">
              <p className="text-slate-400 text-sm">No access grants yet.</p>
            </GlassCard>
          )}
          {grants.items.map((grant) => (
            <GlassCard key={grant.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-white font-medium">{grant.patientDisplayName}</div>
                <div className="text-xs text-slate-500">
                  {grant.categories.map((c) => RECORD_CATEGORY_LABELS[c]).join(', ')}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Expires {formatDateOnly(grant.expiresAt)}
                  {grant.status === 'active' || grant.status === 'expiring_soon'
                    ? ` (${Math.max(daysUntil(grant.expiresAt), 0)} days left)`
                    : ''}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={statusToBadgeTone(grant.status)}>{grant.status.replace('_', ' ')}</Badge>
                {canRevokeAccess(role) && (grant.status === 'active' || grant.status === 'expiring_soon') && (
                  <button
                    onClick={() => handleRevoke(grant)}
                    disabled={!!revokingId || grants.loading || grants.error}
                    className="btn-danger rounded-lg px-4 py-2 text-sm flex items-center gap-2"
                  >
                    {revokingId === grant.id && <Spinner size={12} />}
                    Revoke
                  </button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {requests.items.length === 0 && (
            <GlassCard className="p-8 text-center">
              <p className="text-slate-400 text-sm">No access requests yet.</p>
            </GlassCard>
          )}
          {requests.items.map((request) => (
            <GlassCard key={request.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-white font-medium">{request.patientDisplayName}</div>
                <div className="text-xs text-slate-500">
                  {request.requestedCategories.map((c) => RECORD_CATEGORY_LABELS[c]).join(', ')} · {request.durationDays} days
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{request.purpose}</div>
              </div>
              <Badge tone={statusToBadgeTone(request.status)}>{request.status}</Badge>
            </GlassCard>
          ))}
        </div>
      )}
      {current.data && <Pagination {...current} />}
    </div>
  );
}
