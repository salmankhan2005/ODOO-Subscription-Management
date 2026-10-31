import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'subscription' | 'invoice' | 'quotation' | 'payment';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'subscription' }) => {
  const norm = status.toLowerCase();

  let colorClass = 'text-slate-400';
  let dotClass = 'bg-slate-400';

  if (['active', 'paid', 'confirmed', 'completed'].includes(norm)) {
    colorClass = 'text-emerald-400';
    dotClass = 'bg-emerald-400';
  } else if (['draft', 'quotation', 'pending', 'partially_paid'].includes(norm)) {
    colorClass = 'text-indigo-400';
    dotClass = 'bg-indigo-400';
  } else if (['paused', 'grace_period', 'retrying'].includes(norm)) {
    colorClass = 'text-amber-400';
    dotClass = 'bg-amber-400';
  } else if (['overdue', 'cancelled', 'failed', 'closed', 'expired'].includes(norm)) {
    colorClass = 'text-rose-400';
    dotClass = 'bg-rose-400';
  }

  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  // Clean unboxed metadata with semantic dot indicator, following Anti-Slop Zero-Pill rules
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium tracking-wide ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
