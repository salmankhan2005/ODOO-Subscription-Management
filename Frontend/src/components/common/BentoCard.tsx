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
  spatial?: boolean;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className = '',
  glow = false,
  onClick,
  title,
  subtitle,
  headerAction,
  id,
  spatial = true,
}) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`group relative rounded-2xl bg-slate-900/80 border border-slate-800/90 p-5 md:p-6 shadow-xl backdrop-blur-md transition-all duration-300 overflow-hidden ${
        spatial
          ? 'hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-950/50 hover:border-indigo-500/40'
          : ''
      } ${
        glow
          ? 'border-indigo-500/30 shadow-[0_10px_30px_-10px_rgba(99,102,241,0.2)] hover:border-indigo-400/60'
          : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* 3D Top Specular Light Reflection */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />

      {/* Ambient Corner Radial Light */}
      <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-gradient-to-bl from-indigo-500/10 via-cyan-500/5 to-transparent transition-opacity group-hover:opacity-100 opacity-60" />

      {(title || headerAction) && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
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
