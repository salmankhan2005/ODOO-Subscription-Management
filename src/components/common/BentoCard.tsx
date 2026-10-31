import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  variant?: 'white' | 'teal' | 'subtle';
  onClick?: () => void;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  id?: string;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className = '',
  variant = 'white',
  onClick,
  title,
  subtitle,
  headerAction,
  id
}) => {
  const prefersReducedMotion = useReducedMotion();
  const isTeal = variant === 'teal';
  const isSubtle = variant === 'subtle';

  const surfaceClasses = isTeal
    ? 'bg-[#345C64] border-[#27484F] text-white shadow-[0_14px_28px_-16px_rgba(11,26,32,0.32)]'
    : isSubtle
      ? 'bg-[#F7FAFA] border-[#E5ECEC] text-[#252B2E]'
      : 'bg-white border-[#E5ECEC] text-[#252B2E] shadow-[0_8px_22px_-16px_rgba(19,41,48,0.1)]';

  const hoverClasses = onClick
    ? isTeal
      ? 'cursor-pointer hover:bg-[#2D5158]'
      : 'cursor-pointer hover:border-[#345C64]/50 hover:shadow-[0_16px_30px_-16px_rgba(19,41,48,0.18)]'
    : '';

  return (
    <motion.div
      id={id}
      onClick={onClick}
      whileHover={
        onClick && !prefersReducedMotion
          ? { y: -3, transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] } }
          : undefined
      }
      whileTap={
        onClick && !prefersReducedMotion
          ? { scale: 0.992, transition: { duration: 0.1 } }
          : undefined
      }
      className={`group relative rounded-xl border p-5 md:p-6 transition-colors duration-150 ease-out ${surfaceClasses} ${hoverClasses} ${className}`}
    >
      {(title || headerAction) && (
        <div
          className={`flex items-start sm:items-center justify-between gap-3 mb-4 pb-3.5 border-b ${
            isTeal ? 'border-white/15' : 'border-[#E5ECEC]'
          }`}
        >
          <div>
            {title && (
              <h3
                className={`text-base font-semibold tracking-tight font-display ${
                  isTeal ? 'text-white' : 'text-[#252B2E]'
                }`}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p className={`text-xs mt-0.5 ${isTeal ? 'text-[#DDF3F0]/85' : 'text-[#56666B]'}`}>
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}

      {children}
    </motion.div>
  );
};
