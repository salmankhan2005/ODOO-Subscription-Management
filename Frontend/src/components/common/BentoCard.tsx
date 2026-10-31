import React from 'react';

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  id?: string;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className = '',
  glow = false,
  onClick,
  title,
  subtitle,
  headerAction,
  id
}) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`relative rounded-2xl bg-white border border-slate-800/80 p-5 md:p-6 shadow-sm transition-all duration-200 overflow-hidden ${
        glow ? 'hover:border-indigo-500/40 hover:shadow-[0_8px_24px_-8px_rgba(46,159,146,0.22)]' : 'hover:border-slate-700/80'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-gradient-to-br from-indigo-100/70 to-transparent" />

      {(title || headerAction) && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/60">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-100 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      {children}
    </div>
  );
};
