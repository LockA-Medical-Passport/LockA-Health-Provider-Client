export type BadgeTone = 'green' | 'amber' | 'red' | 'cyan' | 'gray';

export function Badge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function statusToBadgeTone(status: string): BadgeTone {
  switch (status) {
    case 'active':
    case 'approved':
    case 'verified':
      return 'green';
    case 'pending':
    case 'expiring_soon':
      return 'amber';
    case 'denied':
    case 'revoked':
    case 'suspended':
      return 'red';
    case 'expired':
      return 'gray';
    default:
      return 'cyan';
  }
}
