import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LayerSpec {
  id: number;
  code: string;
  title: string;
  metricLabel: string;
  metricValue: string;
  detail: string;
  targetTab: string;
  accent: string;
}

const LAYERS: LayerSpec[] = [
  {
    id: 0,
    code: '01',
    title: 'Variant Quote & Catalog Plane',
    metricLabel: 'Odoo Brand Markup',
    metricValue: '+$560 / seat',
    detail: 'Configures base SaaS licenses, brand edition adders, and multi-seat discounts in real time.',
    targetTab: 'quotations',
    accent: '#2E9F92'
  },
  {
    id: 1,
    code: '02',
    title: 'Recurring Ledger & Statutory Tax',
    metricLabel: 'Active Recognized MRR',
    metricValue: '$94,820.00',
    detail: 'Converts approved quotes into scheduled subscriptions with automated 18% GST/VAT computation.',
    targetTab: 'subscriptions',
    accent: '#345C64'
  },
  {
    id: 2,
    code: '03',
    title: 'Multi-Rail Dunning & Settlement',
    metricLabel: 'Autonomous Collection',
    metricValue: '99.2% Settled',
    detail: 'Intercepts soft card declines and routes retries across backup settlement rails automatically.',
    targetTab: 'billing',
    accent: '#E96F50'
  }
];

export const IsometricHeroStack: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<number>(1);
  const { launchWorkspace } = useAuth();

  const current = LAYERS[activeLayer];

  return (
    <div className="h-full flex flex-col justify-between bg-transparent">
      {/* Unboxed Floating Layer Controls */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-semibold text-[#345C64]">
          Interactive 3D Revenue Stack
        </span>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/85 backdrop-blur-sm border border-[#E5ECEC]">
          {LAYERS.map((layer) => (
            <button
              key={layer.id}
              type="button"
              onClick={() => setActiveLayer(layer.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeLayer === layer.id
                  ? 'bg-[#1F3F47] text-white'
                  : 'text-[#56666B] hover:text-[#1F3F47]'
              }`}
            >
              {layer.code}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Unboxed 3D Axonometric SVG Sculpture with Grounded Dark Shadow */}
      <div className="relative my-1 flex items-center justify-center py-2 select-none">
        <svg
          viewBox="0 0 540 390"
          className="w-full max-w-[510px] h-auto overflow-visible iso-dark-ambient-shadow"
          role="img"
          aria-label="Three-layer floating isometric subscription billing architecture"
        >
          <defs>
            <linearGradient id="slabTopWhite" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#EAF3F3" />
            </linearGradient>
            <linearGradient id="slabTopTeal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3F6E77" />
              <stop offset="100%" stopColor="#345C64" />
            </linearGradient>
            <linearGradient id="slabTopDeep" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#284F58" />
              <stop offset="100%" stopColor="#1F3F47" />
            </linearGradient>

            {/* Deep diffused dark ground shadow */}
            <filter id="darkGroundAmbient" x="-30%" y="-30%" width="160%" height="170%">
              <feGaussianBlur stdDeviation="20" />
            </filter>

            {/* Grounded dark contact shadow directly under bottom isometric slab */}
            <filter id="darkGroundContact" x="-20%" y="-20%" width="140%" height="150%">
              <feGaussianBlur stdDeviation="8" />
            </filter>

            {/* Inter-slab elevation shadow */}
            <filter id="slabCastShadow" x="-15%" y="-10%" width="130%" height="135%">
              <feDropShadow dx="0" dy="12" stdDeviation="7" floodColor="#09181D" floodOpacity="0.28" />
            </filter>
          </defs>

          {/* STAGE 1: Diffused Dark Ambient Floor Shadow (Replaces boxed background) */}
          <motion.polygon
            points="270,378 468,282 270,188 72,282"
            fill="#07151A"
            filter="url(#darkGroundAmbient)"
            animate={{
              fillOpacity: activeLayer === 2 ? 0.34 : 0.42
            }}
            transition={{ duration: 0.22 }}
          />

          {/* STAGE 2: Crisp-Soft Dark Contact Shadow Anchoring the Stack */}
          <motion.polygon
            points="270,362 442,277 270,194 98,277"
            fill="#0B1D24"
            filter="url(#darkGroundContact)"
            animate={{
              fillOpacity: activeLayer === 2 ? 0.38 : 0.48
            }}
            transition={{ duration: 0.22 }}
          />

          {/* Vertical optical data conduits connecting all 3 planes */}
          {[
            { x: 175, yTop: 108, yBot: 248, color: '#2E9F92', delay: 0 },
            { x: 270, yTop: 154, yBot: 295, color: '#2E9F92', delay: 0.6 },
            { x: 365, yTop: 108, yBot: 248, color: '#E96F50', delay: 1.2 }
          ].map((pipe, i) => (
            <g key={i}>
              <line
                x1={pipe.x}
                y1={pipe.yTop}
                x2={pipe.x}
                y2={pipe.yBot}
                stroke={pipe.color}
                strokeWidth="1.6"
                strokeDasharray="4 4"
                strokeOpacity="0.55"
              />
              <motion.circle
                cx={pipe.x}
                r="4"
                fill={pipe.color}
                initial={{ cy: pipe.yTop, opacity: 0 }}
                animate={{
                  cy: [pipe.yTop, pipe.yBot],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  delay: pipe.delay,
                  ease: 'easeInOut'
                }}
              />
            </g>
          ))}

          {/* PLANE 3 (Bottom): Multi-Rail Dunning & Settlement (#1F3F47) */}
          <motion.g
            onClick={() => setActiveLayer(2)}
            onMouseEnter={() => setActiveLayer(2)}
            animate={{
              y: activeLayer === 2 ? -9 : 0,
              opacity: activeLayer === 2 ? 1 : 0.92
            }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="cursor-pointer"
          >
            {/* Left Bevel */}
            <polygon points="100,242 270,327 270,344 100,259" fill="#132930" />
            {/* Right Bevel */}
            <polygon points="440,242 270,327 270,344 440,259" fill="#0C1C21" />
            {/* Top Isometric Surface */}
            <polygon
              points="270,157 440,242 270,327 100,242"
              fill="url(#slabTopDeep)"
              stroke={activeLayer === 2 ? '#E96F50' : '#3C6A73'}
              strokeWidth={activeLayer === 2 ? '2.2' : '1.2'}
            />
            {/* Inner Rail Illustration on Bottom Slab */}
            <polyline
              points="165,242 235,277 315,237 375,242"
              fill="none"
              stroke="#2E9F92"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <polyline
              points="235,277 270,294 335,261"
              fill="none"
              stroke="#E96F50"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
            <circle cx="165" cy="242" r="4.5" fill="#DDF3F0" />
            <circle cx="235" cy="277" r="4.5" fill="#E96F50" />
            <circle cx="315" cy="237" r="5" fill="#2E9F92" />
            <text
              x="270"
              y="226"
              textAnchor="middle"
              fill="#DDF3F0"
              fontSize="11"
              fontWeight="600"
              fontFamily="JetBrains Mono, monospace"
            >
              03 · SETTLEMENT &amp; DUNNING RAILS
            </text>
          </motion.g>

          {/* PLANE 2 (Middle): Recurring Ledger & Statutory Tax (#345C64) */}
          <motion.g
            onClick={() => setActiveLayer(1)}
            onMouseEnter={() => setActiveLayer(1)}
            filter="url(#slabCastShadow)"
            animate={{
              y: activeLayer === 1 ? -11 : 0,
              opacity: activeLayer === 1 ? 1 : 0.95
            }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="cursor-pointer"
          >
            {/* Left Bevel */}
            <polygon points="100,172 270,257 270,273 100,188" fill="#25444B" />
            {/* Right Bevel */}
            <polygon points="440,172 270,257 270,273 440,188" fill="#183339" />
            {/* Top Isometric Surface */}
            <polygon
              points="270,87 440,172 270,257 100,172"
              fill="url(#slabTopTeal)"
              stroke={activeLayer === 1 ? '#DDF3F0' : '#4E7D86'}
              strokeWidth={activeLayer === 1 ? '2.2' : '1.2'}
            />
            {/* Isometric Bar Metrics on Middle Slab */}
            <polygon points="195,180 215,190 215,164 195,154" fill="#DDF3F0" fillOpacity="0.9" />
            <polygon points="230,197 250,207 250,170 230,160" fill="#2E9F92" />
            <polygon points="265,214 285,224 285,174 265,164" fill="#2E9F92" />
            <polygon points="300,197 320,207 320,166 300,156" fill="#E96F50" />
            <text
              x="270"
              y="140"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="11"
              fontWeight="600"
              fontFamily="JetBrains Mono, monospace"
            >
              02 · RECURRING LEDGER · 18% TAX
            </text>
          </motion.g>

          {/* PLANE 1 (Top): Variant Quote & Catalog Engine (#FFFFFF) */}
          <motion.g
            onClick={() => setActiveLayer(0)}
            onMouseEnter={() => setActiveLayer(0)}
            filter="url(#slabCastShadow)"
            animate={{
              y: activeLayer === 0 ? -12 : 0,
              opacity: 1
            }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="cursor-pointer"
          >
            {/* Left Bevel */}
            <polygon points="115,100 270,178 270,192 115,114" fill="#CEDEDE" />
            {/* Right Bevel */}
            <polygon points="425,100 270,178 270,192 425,114" fill="#AFC7C7" />
            {/* Top Isometric Surface */}
            <polygon
              points="270,22 425,100 270,178 115,100"
              fill="url(#slabTopWhite)"
              stroke={activeLayer === 0 ? '#2E9F92' : '#345C64'}
              strokeWidth={activeLayer === 0 ? '2.2' : '1.4'}
            />
            {/* Isometric UI Module Tiles on Top Slab */}
            <polygon
              points="270,46 335,78 270,110 205,78"
              fill="#DDF3F0"
              stroke="#2E9F92"
              strokeWidth="1.2"
            />
            <circle cx="270" cy="78" r="6" fill="#1F3F47" />
            <text
              x="270"
              y="138"
              textAnchor="middle"
              fill="#1F3F47"
              fontSize="11"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              01 · VARIANT QUOTE ENGINE
            </text>
          </motion.g>
        </svg>
      </div>

      {/* Synchronized Floating Readout Dock with Dark Elevation Shadow */}
      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.16 }}
        className="rounded-xl bg-[#345C64] text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#27484F] shadow-[0_22px_36px_-14px_rgba(9,23,28,0.38)]"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#DDF3F0]">
            <span className="font-mono font-bold">LAYER {current.code}</span>
            <span>·</span>
            <span className="font-semibold text-white">{current.title}</span>
          </div>
          <p className="text-xs text-[#DDF3F0]/85 leading-relaxed">{current.detail}</p>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 border-white/15 pt-2.5 sm:pt-0">
          <div className="text-left sm:text-right">
            <div className="text-[11px] text-[#DDF3F0]/80">{current.metricLabel}</div>
            <div className="text-base font-bold font-mono tabular-nums text-white">
              {current.metricValue}
            </div>
          </div>
          <button
            type="button"
            onClick={() => launchWorkspace('admin', current.targetTab)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#DDF3F0] hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <span>Open Module</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
