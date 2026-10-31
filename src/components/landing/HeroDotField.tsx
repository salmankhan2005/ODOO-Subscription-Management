import React, { useEffect, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';

interface MatrixNode {
  id: string;
  x: number;
  y: number;
  kind: 'dot' | 'squareBit' | 'capsuleBit';
  r: number;
  width: number;
  height: number;
  opacity: number;
  fill: string;
  shimmerClass: string;
  isActiveBit: boolean;
}

export const HeroDotField: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  // Subtle pointer-driven spatial parallax across the two bit layers
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const smoothX = useSpring(pointerX, { stiffness: 120, damping: 26, mass: 0.8 });
  const smoothY = useSpring(pointerY, { stiffness: 120, damping: 26, mass: 0.8 });

  const baseTranslateX = useTransform(smoothX, [-0.5, 0.5], [-3, 3]);
  const baseTranslateY = useTransform(smoothY, [-0.5, 0.5], [-2.5, 2.5]);
  const activeTranslateX = useTransform(smoothX, [-0.5, 0.5], [-8.5, 8.5]);
  const activeTranslateY = useTransform(smoothY, [-0.5, 0.5], [-6.5, 6.5]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleMove = (e: MouseEvent) => {
      const nx = e.clientX / Math.max(window.innerWidth, 1) - 0.5;
      const ny = e.clientY / Math.max(window.innerHeight, 1) - 0.5;
      pointerX.set(nx);
      pointerY.set(ny);
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, [pointerX, pointerY, prefersReducedMotion]);

  const { passiveNodes, activeNodes } = useMemo(() => {
    const passive: MatrixNode[] = [];
    const active: MatrixNode[] = [];

    const cols = 46;
    const rows = 22;
    const spacingX = 1440 / cols;
    const spacingY = 680 / rows;

    for (let rIdx = 0; rIdx < rows; rIdx++) {
      for (let cIdx = 0; cIdx < cols; cIdx++) {
        // Stagger odd rows slightly for an architectural halftone bit-matrix weave
        const rowOffset = rIdx % 2 === 1 ? spacingX * 0.25 : 0;
        const x = Number(((cIdx + 0.5) * spacingX + rowOffset).toFixed(1));
        const y = Number(((rIdx + 0.5) * spacingY).toFixed(1));

        const nx = cIdx / (cols - 1);
        const ny = rIdx / (rows - 1);

        // Intersecting diagonal harmonic wave envelopes inspired by Dribbble "Bits"
        const wavePrimary = Math.sin(nx * 8.6 - ny * 5.1 + 0.75);
        const waveSecondary = Math.cos(nx * 4.9 + ny * 6.3 - 1.1);
        const fineHarmonic = (Math.sin((nx * 1.3 + ny * 0.9) * 14.5) + 1) * 0.5;

        const rawEnvelope = (wavePrimary * 0.62 + waveSecondary * 0.38 + 1) * 0.5;
        const waveCrest = Math.pow(rawEnvelope, 1.38) * (0.76 + 0.24 * fineHarmonic);

        // Elliptical legibility sanctuary behind left-column hero headline & subcopy
        const dxHeadline = (x - 285) / 385;
        const dyHeadline = (y - 250) / 235;
        const headlineDistSq = dxHeadline * dxHeadline + dyHeadline * dyHeadline;
        const textSanctuary =
          headlineDistSq < 1 ? 0.16 + 0.84 * Math.pow(headlineDistSq, 1.25) : 1;

        // Deterministic hash for binary bit shape & active telemetry selection
        const hash = (cIdx * 73 + rIdx * 137 + cIdx * rIdx * 19) % 97;

        const isWavePeak = waveCrest > 0.56;
        const isOutsideCoreCopy = headlineDistSq > 0.68;

        // Select crisp binary square/capsule "bits" along harmonic wave crests
        let kind: MatrixNode['kind'] = 'dot';
        if (isWavePeak && hash % 7 === 0) {
          kind = 'capsuleBit';
        } else if (waveCrest > 0.48 && hash % 5 === 0) {
          kind = 'squareBit';
        }

        const radius = Number((0.75 + waveCrest * 2.15).toFixed(2));
        const width = kind === 'capsuleBit' ? Number((6.4 + waveCrest * 4.2).toFixed(1)) : Number((radius * 1.95).toFixed(1));
        const height = kind === 'capsuleBit' ? 2.8 : Number((radius * 1.95).toFixed(1));

        // Active shimmering telemetry bits along high-energy wave crests
        const isActiveBit = isWavePeak && isOutsideCoreCopy && (hash % 11 === 0 || hash % 17 === 0);

        let fill = '#345C64';
        if (isActiveBit) {
          fill = hash % 17 === 0 ? '#E96F50' : '#2E9F92';
        } else if (waveCrest > 0.62) {
          fill = hash % 3 === 0 ? '#2E9F92' : '#1F3F47';
        } else if (hash % 2 === 0) {
          fill = '#1F3F47';
        }

        const rawOpacity = isActiveBit
          ? 0.72
          : 0.065 + Math.pow(waveCrest, 1.15) * 0.29;
        const opacity = Number(Math.min(0.88, rawOpacity * textSanctuary).toFixed(3));

        const shimmerClass = isActiveBit
          ? hash % 3 === 0
            ? 'bit-shimmer-a'
            : hash % 3 === 1
              ? 'bit-shimmer-b'
              : 'bit-shimmer-c'
          : '';

        const node: MatrixNode = {
          id: `${rIdx}-${cIdx}`,
          x,
          y,
          kind,
          r: radius,
          width,
          height,
          opacity,
          fill,
          shimmerClass,
          isActiveBit
        };

        if (isActiveBit) {
          active.push(node);
        } else {
          passive.push(node);
        }
      }
    }

    return { passiveNodes: passive, activeNodes: active };
  }, []);

  const renderShape = (node: MatrixNode) => {
    if (node.kind === 'capsuleBit') {
      return (
        <rect
          key={node.id}
          x={node.x - node.width / 2}
          y={node.y - node.height / 2}
          width={node.width}
          height={node.height}
          rx={1.4}
          fill={node.fill}
          fillOpacity={node.opacity}
          className={node.shimmerClass || undefined}
        />
      );
    }

    if (node.kind === 'squareBit') {
      return (
        <rect
          key={node.id}
          x={node.x - node.width / 2}
          y={node.y - node.height / 2}
          width={node.width}
          height={node.height}
          rx={0.9}
          fill={node.fill}
          fillOpacity={node.opacity}
          className={node.shimmerClass || undefined}
        />
      );
    }

    return (
      <circle
        key={node.id}
        cx={node.x}
        cy={node.y}
        r={node.r}
        fill={node.fill}
        fillOpacity={node.opacity}
        className={node.shimmerClass || undefined}
      />
    );
  };

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 680"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        <defs>
          <radialGradient id="heroBitsPerimeterMask" cx="56%" cy="46%" r="64%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="78%" stopColor="#FFFFFF" stopOpacity="0.86" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.14" />
          </radialGradient>
          <linearGradient id="heroWaveThread" x1="0%" y1="85%" x2="100%" y2="18%">
            <stop offset="0%" stopColor="#345C64" stopOpacity="0" />
            <stop offset="45%" stopColor="#2E9F92" stopOpacity="0.14" />
            <stop offset="82%" stopColor="#2E9F92" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#1F3F47" stopOpacity="0" />
          </linearGradient>
          <mask id="heroBitsMask">
            <rect width="1440" height="680" fill="url(#heroBitsPerimeterMask)" />
          </mask>
        </defs>

        <g mask="url(#heroBitsMask)">
          {/* Subtle harmonic carrier contour linking left ledger inputs to the floating 3D isometric stack */}
          <path
            d="M 80 560 C 420 510, 660 210, 1020 245 C 1210 264, 1330 175, 1420 130"
            fill="none"
            stroke="url(#heroWaveThread)"
            strokeWidth="1.25"
            strokeDasharray="4 8"
          />

          {/* Base Halftone Wave Bit-Matrix Layer */}
          <motion.g
            style={
              prefersReducedMotion
                ? undefined
                : {
                    x: baseTranslateX,
                    y: baseTranslateY
                  }
            }
          >
            {passiveNodes.map(renderShape)}
          </motion.g>

          {/* Elevated Shimmering Active Telemetry Bits Layer */}
          <motion.g
            style={
              prefersReducedMotion
                ? undefined
                : {
                    x: activeTranslateX,
                    y: activeTranslateY
                  }
            }
          >
            {activeNodes.map(renderShape)}
          </motion.g>
        </g>
      </svg>
    </div>
  );
};
