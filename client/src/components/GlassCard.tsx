import type { HTMLAttributes } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  bright?: boolean;
}

export function GlassCard({ bright, className = '', ...rest }: GlassCardProps) {
  return <div className={`${bright ? 'glass-bright' : 'glass'} rounded-xl ${className}`} {...rest} />;
}
