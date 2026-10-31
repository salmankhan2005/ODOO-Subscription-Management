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
      className={`relative rounded-2xl bg-[#111827]/70 backdrop-blur-xl border border-slate-800/80 p-5 md:p-6 transition-all duration-200 overflow-hidden ${
        glow ? 'hover:border-indigo-500/40 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.15)]' : 'hover:border-slate-700/80'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Subtle illuminated corner accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />

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
