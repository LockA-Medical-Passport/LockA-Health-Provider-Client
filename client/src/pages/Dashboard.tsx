import { Link } from 'react-router-dom';
import { GlassCard } from '../components/GlassCard';
import { StatCard } from '../components/StatCard';
import { Spinner } from '../components/Spinner';
import { Badge, statusToBadgeTone } from '../components/Badge';
import {
  AccessIcon,
  AuditIcon,
  ProviderIcon,
  RecordsIcon,
  SearchIcon,
} from '../components/Icons';
import { getAuditLog, getDashboardStats, getProvider } from '../lib/api';
import { formatDate } from '../lib/format';
import { ErrorState } from '../components/ErrorState';
import { useAsyncResource } from '../hooks/useAsyncResource';

async function loadDashboard() {
  const [provider, stats, audit] = await Promise.all([
    getProvider(), getDashboardStats(), getAuditLog({ page: 1, pageSize: 5 }),
  ]);
  return { provider, stats, recentActivity: audit.items };
}

export function Dashboard() {
  const { data, loading, error, reload } = useAsyncResource(loadDashboard);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Spinner size={32} borderWidth={3} />
        <p className="text-slate-400 mt-4">Loading provider dashboard…</p>
      </div>
    );
  }

  if (error || !data) return <div className="max-w-7xl mx-auto px-4 py-8"><ErrorState onRetry={reload} /></div>;
  const { provider, stats, recentActivity } = data;

  const quickLinks = [
    { to: '/search', icon: SearchIcon, label: 'Patient Search', desc: 'Look up patients & request access', color: '#3b82f6' },
    { to: '/records', icon: RecordsIcon, label: 'Medical Records', desc: 'View & upload patient records', color: '#06b6d4' },
    { to: '/access', icon: AccessIcon, label: 'Access Management', desc: 'Track and revoke active grants', color: '#10b981' },
    { to: '/audit', icon: AuditIcon, label: 'Audit Log', desc: 'Review access history', color: '#94a3b8' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Provider <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-slate-400 text-sm">{provider.name} — patient-consented record access</p>
        </div>
        <GlassCard className="px-4 py-3 text-right">
          <div className="text-xs text-slate-500 mb-1">Verification Status</div>
          <Badge tone={statusToBadgeTone(provider.verificationStatus)}>{provider.verificationStatus}</Badge>
        </GlassCard>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Access Grants"
          value={String(stats.activeGrants)}
          icon={<AccessIcon className="w-4 h-4" />}
          color="#10b981"
          sub="patients currently granting access"
        />
        <StatCard
          label="Pending Requests"
          value={String(stats.pendingRequests)}
          icon={<SearchIcon className="w-4 h-4" />}
          color="#f59e0b"
          sub="awaiting patient approval"
        />
        <StatCard
          label="Records on File"
          value={String(stats.recordCount)}
          icon={<RecordsIcon className="w-4 h-4" />}
          color="#06b6d4"
          sub="uploaded by this provider"
        />
        <StatCard
          label="Staff Accounts"
          value={String(provider.staffCount)}
          icon={<ProviderIcon className="w-4 h-4" />}
          color="#3b82f6"
          sub="registered under this org"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickLinks.map((item) => (
          <Link key={item.to} to={item.to}>
            <GlassCard className="p-4 h-full hover:border-blue-500/40 transition-colors cursor-pointer">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{ background: `${item.color}20`, border: `1px solid ${item.color}40`, color: item.color }}
              >
                <item.icon className="w-4 h-4" />
              </div>
              <div className="text-sm font-semibold text-white mb-1">{item.label}</div>
              <div className="text-xs text-slate-400">{item.desc}</div>
            </GlassCard>
          </Link>
        ))}
      </div>

      <GlassCard className="p-5">
        <div className="section-header">Recent Activity</div>
        <div className="space-y-3">
          {recentActivity.map((event) => (
            <div key={event.id} className="flex items-start justify-between gap-3 text-sm">
              <div>
                <span className="text-white font-medium">{event.patientDisplayName}</span>
                <span className="text-slate-400"> — {event.detail}</span>
              </div>
              <span className="text-xs text-slate-500 whitespace-nowrap">{formatDate(event.timestamp)}</span>
            </div>
          ))}
          {recentActivity.length === 0 && <p className="text-sm text-slate-500">No recent activity yet.</p>}
        </div>
      </GlassCard>
    </div>
  );
}
