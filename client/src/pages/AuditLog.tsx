import { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Spinner } from '../components/Spinner';
import { Badge, type BadgeTone } from '../components/Badge';
import { getAuditLog } from '../lib/api';
import { formatDate } from '../lib/format';
import type { AuditEvent, AuditEventType } from '../lib/types';

const EVENT_TONE: Record<AuditEventType, BadgeTone> = {
  access_requested: 'cyan',
  access_approved: 'green',
  access_denied: 'red',
  access_revoked: 'red',
  record_viewed: 'gray',
  record_uploaded: 'amber',
};

const EVENT_LABEL: Record<AuditEventType, string> = {
  access_requested: 'Requested',
  access_approved: 'Approved',
  access_denied: 'Denied',
  access_revoked: 'Revoked',
  record_viewed: 'Viewed',
  record_uploaded: 'Uploaded',
};

export function AuditLog() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<AuditEvent[]>([]);

  useEffect(() => {
    getAuditLog().then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Audit Log</h1>
        <p className="text-slate-400 text-sm">Timestamped history of access requests, approvals, revocations, and record views.</p>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <Spinner size={24} />
        </div>
      ) : (
        <GlassCard className="p-5">
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="flex items-start justify-between gap-4 border-b border-blue-900/20 pb-4 last:border-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <Badge tone={EVENT_TONE[event.type]}>{EVENT_LABEL[event.type]}</Badge>
                  <div>
                    <div className="text-sm text-white">{event.patientDisplayName}</div>
                    <div className="text-xs text-slate-400">{event.detail}</div>
                    <div className="text-xs text-slate-500 mt-0.5">by {event.actor}</div>
                  </div>
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">{formatDate(event.timestamp)}</span>
              </div>
            ))}
            {events.length === 0 && <p className="text-sm text-slate-500">No audit events recorded yet.</p>}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
