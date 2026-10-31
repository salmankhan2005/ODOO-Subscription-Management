import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'subscription' | 'invoice' | 'quotation' | 'payment';
  onDark?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, onDark = false }) => {
  const norm = status.toLowerCase();

  let colorClass = onDark ? 'text-[#DDF3F0]' : 'text-[#56666B]';
  let dotClass = onDark ? 'bg-[#DDF3F0]' : 'bg-[#56666B]';

  if (['active', 'paid', 'confirmed', 'completed', 'recovered'].includes(norm)) {
    colorClass = onDark ? 'text-[#8CE6DB]' : 'text-[#1E7A70]';
    dotClass = 'bg-[#2E9F92]';
  } else if (['draft', 'quotation', 'pending', 'partially_paid', 'converted'].includes(norm)) {
    colorClass = onDark ? 'text-[#DDF3F0]' : 'text-[#345C64]';
    dotClass = onDark ? 'bg-[#DDF3F0]' : 'bg-[#345C64]';
  } else if (['paused', 'grace_period', 'retrying'].includes(norm)) {
    colorClass = onDark ? 'text-[#FBD0C4]' : 'text-[#B85035]';
    dotClass = 'bg-[#E96F50]';
  } else if (['overdue', 'cancelled', 'failed', 'closed', 'expired', 'inactive'].includes(norm)) {
    colorClass = onDark ? 'text-[#FFBFB0]' : 'text-[#C94A29]';
    dotClass = 'bg-[#E96F50]';
  }

  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
