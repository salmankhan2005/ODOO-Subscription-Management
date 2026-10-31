import React, { useEffect, useState } from 'react';
import { useMotionValue, useSpring, useMotionValueEvent, useReducedMotion } from 'motion/react';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = ''
}) => {
  const prefersReducedMotion = useReducedMotion();
  const motionVal = useMotionValue(prefersReducedMotion ? value : 0);
  const springVal = useSpring(motionVal, {
    stiffness: 140,
    damping: 24,
    mass: 0.8
  });

  const [display, setDisplay] = useState<string>(() =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  );

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplay(
        value.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        })
      );
      return;
    }
    motionVal.set(value);
  }, [value, decimals, motionVal, prefersReducedMotion]);

  useMotionValueEvent(springVal, 'change', (latest) => {
    const rounded = decimals === 0 ? Math.round(latest) : Number(latest.toFixed(decimals));
    setDisplay(
      rounded.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })
    );
  });

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
};
