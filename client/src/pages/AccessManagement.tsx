import { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Spinner } from '../components/Spinner';
import { Badge, statusToBadgeTone } from '../components/Badge';
import { listAccessGrants, listAccessRequests, revokeAccessGrant } from '../lib/api';
import { useToast } from '../components/Toast';
import { formatDateOnly, daysUntil } from '../lib/format';
import { RECORD_CATEGORY_LABELS } from '../lib/types';
import type { AccessGrant, AccessRequest } from '../lib/types';

type Tab = 'grants' | 'requests';

export function AccessManagement() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('grants');
  const [loading, setLoading] = useState(true);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    const [g, r] = await Promise.all([listAccessGrants(), listAccessRequests()]);
    setGrants(g);
    setRequests(r);
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleRevoke(grant: AccessGrant) {
    setRevokingId(grant.id);
    await revokeAccessGrant(grant.id);
    await reload();
    setRevokingId(null);
    toast('info', `Access to ${grant.patientDisplayName} revoked`);
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

      {loading ? (
        <div className="text-center py-10">
          <Spinner size={24} />
        </div>
      ) : tab === 'grants' ? (
        <div className="space-y-3">
          {grants.length === 0 && (
            <GlassCard className="p-8 text-center">
              <p className="text-slate-400 text-sm">No access grants yet.</p>
            </GlassCard>
          )}
          {grants.map((grant) => (
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
                {(grant.status === 'active' || grant.status === 'expiring_soon') && (
                  <button
                    onClick={() => handleRevoke(grant)}
                    disabled={revokingId === grant.id}
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
          {requests.length === 0 && (
            <GlassCard className="p-8 text-center">
              <p className="text-slate-400 text-sm">No access requests yet.</p>
            </GlassCard>
          )}
          {requests.map((request) => (
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
    </div>
  );
}
