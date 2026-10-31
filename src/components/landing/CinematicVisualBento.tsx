import React, { useState, useRef } from 'react';
import {
  motion,
  MotionValue,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useMotionTemplate,
  useReducedMotion
} from 'motion/react';
import {
  ArrowUpRight,
  Globe,
  Zap,
  Lock,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import treasuryCoreImg from '../../assets/images/treasury_core_3d_1793422818447.jpg';
import dunningRouterImg from '../../assets/images/dunning_router_3d_1793422818667.jpg';
import auditVaultImg from '../../assets/images/audit_vault_3d_1793422819838.jpg';
import cpqMonolithImg from '../../assets/images/cpq_monolith_3d_1793422820351.jpg';

type FocusDomain = 'all' | 'treasury' | 'recovery' | 'governance';

interface CinematicFrameProps {
  children: React.ReactNode;
  className?: string;
  isDimmed?: boolean;
  isHighlighted?: boolean;
  onFocusCard?: () => void;
}

const CinematicFrame: React.FC<CinematicFrameProps> = ({
  children,
  className = '',
  isDimmed = false,
  isHighlighted = false,
  onFocusCard
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rimX = useMotionValue(50);
  const rimY = useMotionValue(35);
  const rimOpacity = useMotionValue(0);

  const springCfg = { stiffness: 250, damping: 26, mass: 0.65 };
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [5.5, -5.5]), springCfg);
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-5.5, 5.5]), springCfg);
  const smoothRimOpacity = useSpring(rimOpacity, { stiffness: 220, damping: 28 });

  const rimGlow = useMotionTemplate`radial-gradient(480px circle at ${rimX}% ${rimY}%, rgba(221, 243, 240, 0.16), transparent 68%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    pointerX.set(nx);
    pointerY.set(ny);
    rimX.set(((e.clientX - rect.left) / rect.width) * 100);
    rimY.set(((e.clientY - rect.top) / rect.height) * 100);
    rimOpacity.set(1);
  };

  const handleMouseLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
    rimOpacity.set(0);
  };

  return (
    <div
      className={`perspective-stage transition-opacity duration-200 ${
        isDimmed ? 'opacity-50 hover:opacity-90' : 'opacity-100'
      } ${className}`}
      onClick={isDimmed ? onFocusCard : undefined}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={
          prefersReducedMotion
            ? undefined
            : {
                rotateX,
                rotateY
              }
        }
        className={`group relative h-full rounded-2xl overflow-hidden bg-[#152D34] border preserve-3d transition-colors duration-200 shadow-[0_28px_60px_-20px_rgba(4,12,15,0.72)] ${
          isHighlighted
            ? 'border-[#2E9F92]/80'
            : 'border-[#DDF3F0]/15 hover:border-[#DDF3F0]/35'
        }`}
      >
        {children}

        {/* Studio rim specular highlight following pointer */}
        <motion.div
          aria-hidden="true"
          style={{
            background: rimGlow,
            opacity: smoothRimOpacity
          }}
          className="pointer-events-none absolute inset-0 rounded-2xl z-20"
        />
      </motion.div>
    </div>
  );
};

interface VisualBackdropProps {
  src: string;
  alt: string;
  parallaxY: MotionValue<number>;
  hasError: boolean;
  onError: () => void;
  accentHex?: string;
}

const VisualBackdrop: React.FC<VisualBackdropProps> = ({
  src,
  alt,
  parallaxY,
  hasError,
  onError,
  accentHex = '#2E9F92'
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0D1E24]">
      {!hasError ? (
        <motion.img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={onError}
          style={
            prefersReducedMotion
              ? undefined
              : {
                  y: parallaxY,
                  scale: 1.08
                }
          }
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.11]"
        />
      ) : (
        /* Resilient architectural isometric fallback if image ever fails */
        <div className="w-full h-full iso-grid-dark bg-gradient-to-br from-[#1B3A42] via-[#13282E] to-[#0B191E] flex items-center justify-center">
          <svg viewBox="0 0 240 160" className="w-48 h-32 opacity-45" aria-hidden="true">
            <polygon
              points="120,24 204,68 120,112 36,68"
              fill="#1F3F47"
              stroke={accentHex}
              strokeWidth="1.5"
            />
            <polygon
              points="36,68 120,112 120,138 36,94"
              fill="#13282E"
              stroke="#DDF3F0"
              strokeOpacity="0.25"
            />
            <polygon
              points="204,68 120,112 120,138 204,94"
              fill="#0E2026"
              stroke={accentHex}
              strokeOpacity="0.45"
            />
          </svg>
        </div>
      )}

      {/* Measured multi-stop studio contrast scrim guaranteeing >7:1 WCAG AAA text contrast */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#091519] via-[#0C1D23]/82 to-[#0C1D23]/30"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#091519]/80 to-transparent"
      />
    </div>
  );
};

export const CinematicVisualBento: React.FC = () => {
  const { launchWorkspace } = useAuth();
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Interactive Focus Filter
  const [focusDomain, setFocusDomain] = useState<FocusDomain>('all');

  // Card 1 Interactive State: Global Treasury Clearing Corridor
  const [corridor, setCorridor] = useState<'usd' | 'eur' | 'inr'>('usd');

  // Card 2 Interactive State: Optical Dunning Signal Mode
  const [signalMode, setSignalMode] = useState<'intercept' | 'grace'>('intercept');

  // Card 3 Interactive State: Cryptographic Compliance Regime
  const [auditRegime, setAuditRegime] = useState<'soc2' | 'asc606' | 'gst'>('soc2');

  // Card 4 Interactive State: Modular CPQ Monolith Tier
  const [monolithTier, setMonolithTier] = useState<'core' | 'odoo' | 'ent'>('odoo');

  // Resilient per-card image error state
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Scroll-linked entrance & internal 3D render parallax
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start']
  });

  const artworkParallaxY = useTransform(scrollYProgress, [0, 1], [-18, 18]);
  const stageScale = useTransform(scrollYProgress, [0, 0.22, 0.85, 1], [0.975, 1, 1, 0.99]);

  const corridors = {
    usd: {
      label: 'USD · FedNow',
      rail: 'FedNow + Same-Day ACH',
      latency: '380ms Finality',
      fxStatus: '0.00% FX Spread',
      volume: '$64,200.00'
    },
    eur: {
      label: 'EUR · SEPA',
      rail: 'SEPA Instant Mandate',
      latency: '1.12s Finality',
      fxStatus: 'ECB Mid-Market Locked',
      volume: '€21,450.00'
    },
    inr: {
      label: 'INR · e-GST',
      rail: 'UPI AutoPay + IRN Sync',
      latency: '740ms Finality',
      fxStatus: '18.0% GST Auto-Split',
      volume: '₹7,85,000'
    }
  };

  const activeCorridor = corridors[corridor];

  const auditSpecs = {
    soc2: {
      label: 'SOC 2 Type II',
      hash: 'SHA256 · 9F4A...82C1',
      proof: 'Role-isolated ledger writes & immutable event trail',
      closeSpeed: '142ms Query'
    },
    asc606: {
      label: 'ASC 606 RevRec',
      hash: 'SCHED · DEFERRED-12M',
      proof: 'Daily ratable recognition across mid-term seat upgrades',
      closeSpeed: 'Zero Drift'
    },
    gst: {
      label: '18% GST / VAT',
      hash: 'TAX · STATUTORY-LOCKED',
      proof: 'Jurisdictional reverse-charge & line-level tax schedules',
      closeSpeed: '1-Click CSV'
    }
  };

  const activeAudit = auditSpecs[auditRegime];

  const monolithTiers = {
    core: {
      label: 'Core Slab',
      rate: '$1,200/seat',
      arr: '$144,000 ARR',
      clause: '10-seat base block · Net 30 statutory terms'
    },
    odoo: {
      label: 'Odoo Edition',
      rate: '$1,760/seat',
      arr: '$211,200 ARR',
      clause: '+$560 brand markup · Bi-directional ERP sync'
    },
    ent: {
      label: 'Enterprise',
      rate: '$2,650/seat',
      arr: '$318,000 ARR',
      clause: '+$1,450 tier adder · Dedicated 15-min SLA vault'
    }
  };

  const activeMonolith = monolithTiers[monolithTier];

  const filterTabs: Array<{ id: FocusDomain; label: string }> = [
    { id: 'all', label: 'All Architecture (04)' },
    { id: 'treasury', label: 'Global Treasury' },
    { id: 'recovery', label: 'Optical Recovery' },
    { id: 'governance', label: 'Audit & CPQ Vault' }
  ];

  const isCardDimmed = (domain: Exclude<FocusDomain, 'all'>) =>
    focusDomain !== 'all' && focusDomain !== domain;

  const isCardHighlighted = (domain: Exclude<FocusDomain, 'all'>) =>
    focusDomain === domain;

  return (
    <section
      ref={sectionRef}
      id="cinematic-vault"
      className="relative overflow-hidden bg-gradient-to-b from-[#102329] via-[#152E36] to-[#102329] text-white border-y border-[#244750] py-20 lg:py-28"
    >
      {/* Subtle architectural dark isometric grid + studio ambient radial illumination */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 iso-grid-dark opacity-70" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-1/4 w-[620px] h-[620px] rounded-full bg-[#2E9F92]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 left-1/5 w-[540px] h-[540px] rounded-full bg-[#345C64]/20 blur-3xl"
      />

      <motion.div
        style={prefersReducedMotion ? undefined : { scale: stageScale }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* Cinematic Stage Header & Interactive Focus Filter */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-semibold text-[#8CE6DB]">
              Cinematic Infrastructure Vault · Studio 3D Architecture
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-display tracking-tight leading-[1.1] text-balance">
              Precision financial hardware logic, rendered in living 3D space.
            </h2>
            <p className="text-xs sm:text-sm text-[#DDF3F0]/80 leading-relaxed max-w-xl">
              Inspect how multi-currency clearing cores, optical decline routers, cryptographic tax vaults, and modular CPQ editions interlock underneath every subscription contract.
            </p>
          </div>

          {/* Interactive Focus Segmented Control with Shared-Layout Spring Indicator */}
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#0C1B20]/90 border border-[#DDF3F0]/15 self-start lg:self-auto">
            {filterTabs.map((tab) => {
              const active = focusDomain === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFocusDomain(tab.id)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    active ? 'text-[#102329]' : 'text-[#DDF3F0]/75 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="cinematic-focus-tab"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-lg bg-[#DDF3F0]"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Asymmetric 12-Column Cinematic 3D Visual Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* CARD 01 (7 Cols, 16:9 3D Render): Global Multi-Currency Settlement Core */}
          <CinematicFrame
            className="lg:col-span-7 min-h-[430px] sm:min-h-[460px]"
            isDimmed={isCardDimmed('treasury')}
            isHighlighted={isCardHighlighted('treasury')}
            onFocusCard={() => setFocusDomain('treasury')}
          >
            <VisualBackdrop
              src={treasuryCoreImg}
              alt="3D isometric multi-currency optical financial settlement core"
              parallaxY={artworkParallaxY}
              hasError={Boolean(imgErrors.treasury)}
              onError={() => setImgErrors((prev) => ({ ...prev, treasury: true }))}
              accentHex="#2E9F92"
            />

            <div className="relative z-10 h-full p-6 sm:p-7 flex flex-col justify-between gap-8 preserve-3d">
              {/* Top Floating Metadata & Workspace Action */}
              <div className="flex flex-wrap items-center justify-between gap-3 depth-layer-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8CE6DB]">
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span>01 · Global Multi-Currency Treasury Core</span>
                </div>

                <button
                  type="button"
                  onClick={() => launchWorkspace('admin', 'payments')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D1E24]/85 hover:bg-[#1F3F47] border border-[#DDF3F0]/20 text-xs font-semibold text-white backdrop-blur-md transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Inspect Treasury</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#8CE6DB]" />
                </button>
              </div>

              {/* Bottom Scrim-Protected Editorial Copy + Floating Z-Layer Corridor HUD */}
              <div className="space-y-4 preserve-3d">
                <div className="max-w-xl depth-layer-1">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-display tracking-tight">
                    Deterministic clearing across USD, EUR, and statutory GST corridors
                  </h3>
                  <p className="text-xs sm:text-sm text-[#DDF3F0]/85 mt-1 leading-relaxed">
                    Direct bank mandates and instant settlement rails reconcile automatically to invoice IDs without intermediary FX spreadsheet drift.
                  </p>
                </div>

                {/* Floating Glass Telemetry Control Plane */}
                <div className="rounded-xl bg-[#0A181D]/88 backdrop-blur-md border border-[#DDF3F0]/18 p-4 space-y-3 depth-layer-3 shadow-[0_18px_34px_-12px_rgba(0,0,0,0.65)]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#132930] border border-[#DDF3F0]/12">
                      {(['usd', 'eur', 'inr'] as const).map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setCorridor(code)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-colors whitespace-nowrap shrink-0 ${
                            corridor === code
                              ? 'bg-[#2E9F92] text-[#08171A]'
                              : 'text-[#DDF3F0]/75 hover:text-white'
                          }`}
                        >
                          {corridors[code].label}
                        </button>
                      ))}
                    </div>

                    <span className="text-xs font-mono font-semibold text-[#8CE6DB] tabular-nums">
                      {activeCorridor.latency}
                    </span>
                  </div>

                  <div className="pt-2.5 border-t border-[#DDF3F0]/12 grid grid-cols-3 gap-3 text-xs font-mono tabular-nums">
                    <div>
                      <div className="text-[10px] text-[#DDF3F0]/65 font-sans">Active Rail</div>
                      <div className="text-white font-semibold truncate mt-0.5">{activeCorridor.rail}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#DDF3F0]/65 font-sans">Rate Policy</div>
                      <div className="text-[#8CE6DB] font-semibold truncate mt-0.5">{activeCorridor.fxStatus}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-[#DDF3F0]/65 font-sans">Cleared Batch</div>
                      <div className="text-white font-bold mt-0.5">{activeCorridor.volume}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CinematicFrame>

          {/* CARD 02 (5 Cols, 4:3 3D Render): Optical Decline-to-ACH Signal Router */}
          <CinematicFrame
            className="lg:col-span-5 min-h-[430px] sm:min-h-[460px]"
            isDimmed={isCardDimmed('recovery')}
            isHighlighted={isCardHighlighted('recovery')}
            onFocusCard={() => setFocusDomain('recovery')}
          >
            <VisualBackdrop
              src={dunningRouterImg}
              alt="3D isometric autonomous payment prism router redirecting coral decline beam to emerald settlement rail"
              parallaxY={artworkParallaxY}
              hasError={Boolean(imgErrors.recovery)}
              onError={() => setImgErrors((prev) => ({ ...prev, recovery: true }))}
              accentHex="#E96F50"
            />

            <div className="relative z-10 h-full p-6 sm:p-7 flex flex-col justify-between gap-8 preserve-3d">
              <div className="flex items-center justify-between gap-2 depth-layer-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#F6A18B]">
                  <Zap className="w-3.5 h-3.5 shrink-0 text-[#E96F50]" />
                  <span>02 · Autonomous Dunning Prism</span>
                </div>

                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#0D1E24]/85 border border-[#DDF3F0]/18 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => setSignalMode('intercept')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      signalMode === 'intercept'
                        ? 'bg-[#2E9F92] text-[#08171A]'
                        : 'text-[#DDF3F0]/75 hover:text-white'
                    }`}
                  >
                    Intercept
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignalMode('grace')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      signalMode === 'grace'
                        ? 'bg-[#E96F50] text-white'
                        : 'text-[#DDF3F0]/75 hover:text-white'
                    }`}
                  >
                    Grace Hold
                  </button>
                </div>
              </div>

              <div className="space-y-4 preserve-3d">
                <div className="depth-layer-1">
                  <h3 className="text-xl font-extrabold text-white font-display tracking-tight">
                    Sub-second soft-decline refraction into backup ACH
                  </h3>
                  <p className="text-xs text-[#DDF3F0]/85 mt-1 leading-relaxed">
                    Intercepts card velocity limits before renewal suspension ever reaches customer operations.
                  </p>
                </div>

                <div className="rounded-xl bg-[#0A181D]/88 backdrop-blur-md border border-[#DDF3F0]/18 p-4 space-y-2.5 depth-layer-3 shadow-[0_18px_34px_-12px_rgba(0,0,0,0.65)]">
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-[#DDF3F0]/80">
                      {signalMode === 'intercept' ? 'Backup ACH Mandate' : 'Smart Retry Window'}
                    </span>
                    <span
                      className={`font-bold ${
                        signalMode === 'intercept' ? 'text-[#8CE6DB]' : 'text-[#F6A18B]'
                      }`}
                    >
                      {signalMode === 'intercept' ? '+$412K ARR Saved' : '72h Grace Protected'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#DDF3F0]/12 flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-[#DDF3F0]/75">
                      {signalMode === 'intercept'
                        ? '99.2% Batch Recovery Rate'
                        : 'Zero Premature Seat Lockouts'}
                    </span>
                    <button
                      type="button"
                      onClick={() => launchWorkspace('admin', 'billing')}
                      className="inline-flex items-center gap-1 font-semibold text-[#8CE6DB] hover:text-white transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Billing Studio</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </CinematicFrame>

          {/* CARD 03 (5 Cols, 4:3 3D Render): Cryptographic Tax & SOC 2 Audit Vault */}
          <CinematicFrame
            className="lg:col-span-5 min-h-[430px] sm:min-h-[450px]"
            isDimmed={isCardDimmed('governance')}
            isHighlighted={isCardHighlighted('governance')}
            onFocusCard={() => setFocusDomain('governance')}
          >
            <VisualBackdrop
              src={auditVaultImg}
              alt="3D isometric cutaway cryptographic tax and compliance vault"
              parallaxY={artworkParallaxY}
              hasError={Boolean(imgErrors.audit)}
              onError={() => setImgErrors((prev) => ({ ...prev, audit: true }))}
              accentHex="#8CE6DB"
            />

            <div className="relative z-10 h-full p-6 sm:p-7 flex flex-col justify-between gap-8 preserve-3d">
              <div className="flex items-center justify-between gap-2 depth-layer-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8CE6DB]">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>03 · Immutable Audit &amp; Tax Vault</span>
                </div>

                <button
                  type="button"
                  onClick={() => launchWorkspace('admin', 'invoices')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0D1E24]/85 hover:bg-[#1F3F47] border border-[#DDF3F0]/20 text-xs font-semibold text-white backdrop-blur-md transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Invoices</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#8CE6DB]" />
                </button>
              </div>

              <div className="space-y-4 preserve-3d">
                <div className="depth-layer-1">
                  <h3 className="text-xl font-extrabold text-white font-display tracking-tight">
                    Audit-sealed statutory ledgers ready in 142 milliseconds
                  </h3>
                  <p className="text-xs text-[#DDF3F0]/85 mt-1 leading-relaxed">
                    Every quotation conversion, discount override, and tax line writes to a tamper-evident financial schedule.
                  </p>
                </div>

                <div className="rounded-xl bg-[#0A181D]/88 backdrop-blur-md border border-[#DDF3F0]/18 p-4 space-y-2.5 depth-layer-3 shadow-[0_18px_34px_-12px_rgba(0,0,0,0.65)]">
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#132930] border border-[#DDF3F0]/12">
                    {(['soc2', 'asc606', 'gst'] as const).map((reg) => (
                      <button
                        key={reg}
                        type="button"
                        onClick={() => setAuditRegime(reg)}
                        className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          auditRegime === reg
                            ? 'bg-[#DDF3F0] text-[#102329]'
                            : 'text-[#DDF3F0]/75 hover:text-white'
                        }`}
                      >
                        {auditSpecs[reg].label}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[#DDF3F0]/12 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                      <span className="text-[#8CE6DB] font-semibold">{activeAudit.hash}</span>
                      <span className="text-white font-bold">{activeAudit.closeSpeed}</span>
                    </div>
                    <p className="text-[11px] text-[#DDF3F0]/75 leading-snug">
                      {activeAudit.proof}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CinematicFrame>

          {/* CARD 04 (7 Cols, 16:9 3D Render): Modular CPQ Edition Monolith */}
          <CinematicFrame
            className="lg:col-span-7 min-h-[430px] sm:min-h-[450px]"
            isDimmed={isCardDimmed('governance')}
            isHighlighted={isCardHighlighted('governance')}
            onFocusCard={() => setFocusDomain('governance')}
          >
            <VisualBackdrop
              src={cpqMonolithImg}
              alt="3D isometric modular frosted glass and dark teal enterprise software contract tiers"
              parallaxY={artworkParallaxY}
              hasError={Boolean(imgErrors.cpq)}
              onError={() => setImgErrors((prev) => ({ ...prev, cpq: true }))}
              accentHex="#2E9F92"
            />

            <div className="relative z-10 h-full p-6 sm:p-7 flex flex-col justify-between gap-8 preserve-3d">
              <div className="flex flex-wrap items-center justify-between gap-3 depth-layer-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8CE6DB]">
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span>04 · Modular CPQ Edition Monolith</span>
                </div>

                <button
                  type="button"
                  onClick={() => launchWorkspace('admin', 'quotations')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E9F92] hover:bg-[#268B7F] text-xs font-bold text-[#08171A] transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Launch CPQ Studio</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-4 preserve-3d">
                <div className="max-w-xl depth-layer-1">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-display tracking-tight">
                    Interlocking edition slabs from draft proposal to active subscription
                  </h3>
                  <p className="text-xs sm:text-sm text-[#DDF3F0]/85 mt-1 leading-relaxed">
                    Stack Standard Core, Odoo Brand markups, and SLA commitments into a single proration-aware schedule that converts with one click.
                  </p>
                </div>

                <div className="rounded-xl bg-[#0A181D]/88 backdrop-blur-md border border-[#DDF3F0]/18 p-4 space-y-3 depth-layer-3 shadow-[0_18px_34px_-12px_rgba(0,0,0,0.65)]">
                  <div className="grid grid-cols-3 gap-2">
                    {(['core', 'odoo', 'ent'] as const).map((tierId) => {
                      const active = monolithTier === tierId;
                      return (
                        <button
                          key={tierId}
                          type="button"
                          onClick={() => setMonolithTier(tierId)}
                          className={`p-2.5 rounded-lg text-left border transition-colors ${
                            active
                              ? 'bg-[#1F3F47] border-[#8CE6DB]/70 text-white'
                              : 'bg-[#11242B] border-[#DDF3F0]/10 text-[#DDF3F0]/75 hover:text-white'
                          }`}
                        >
                          <div className="text-[11px] font-bold truncate">
                            {monolithTiers[tierId].label}
                          </div>
                          <div className="text-xs font-mono tabular-nums text-[#8CE6DB] font-semibold mt-0.5">
                            {monolithTiers[tierId].rate}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-[#DDF3F0]/12 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[#DDF3F0]/80">{activeMonolith.clause}</span>
                    <span className="font-mono tabular-nums font-bold text-white">
                      {activeMonolith.arr}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CinematicFrame>
        </div>
      </motion.div>
    </section>
  );
};
