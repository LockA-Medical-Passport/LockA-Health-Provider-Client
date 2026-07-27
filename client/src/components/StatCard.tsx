import { GlassCard } from './GlassCard';
import type { BadgeTone } from './Badge';
import { Badge } from './Badge';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
  badgeTone?: BadgeTone | null;
}

export function StatCard({ label, value, icon, color, sub, badgeTone }: StatCardProps) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}
        >
          {icon}
        </div>
        {badgeTone && <Badge tone={badgeTone}>{value}</Badge>}
      </div>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      {!badgeTone && <div className="text-lg font-bold text-white">{value}</div>}
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </GlassCard>
  );
}
