import React, { useState, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  useReducedMotion
} from 'motion/react';
import { ArrowUpRight, Layers, Calculator, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface Tilt3DCardProps {
  children: React.ReactNode;
  className?: string;
  tone?: 'white' | 'teal';
}

const Tilt3DCard: React.FC<Tilt3DCardProps> = ({
  children,
  className = '',
  tone = 'white'
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const sheenX = useMotionValue(50);
  const sheenY = useMotionValue(50);
  const sheenOpacity = useMotionValue(0);

  const springConfig = { stiffness: 260, damping: 24, mass: 0.6 };
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [6.5, -6.5]), springConfig);
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-6.5, 6.5]), springConfig);
  const smoothSheenOpacity = useSpring(sheenOpacity, { stiffness: 240, damping: 28 });

  const sheenBackground = useMotionTemplate`radial-gradient(420px circle at ${sheenX}% ${sheenY}%, ${
    tone === 'teal' ? 'rgba(221, 243, 240, 0.14)' : 'rgba(52, 92, 100, 0.08)'
  }, transparent 70%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    pointerX.set(nx);
    pointerY.set(ny);
    sheenX.set(((e.clientX - rect.left) / rect.width) * 100);
    sheenY.set(((e.clientY - rect.top) / rect.height) * 100);
    sheenOpacity.set(1);
  };

  const handleMouseLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
    sheenOpacity.set(0);
  };

  const baseSurface =
    tone === 'teal'
      ? 'bg-[#345C64] border-[#27484F] text-white shadow-[0_24px_44px_-18px_rgba(11,26,32,0.34)]'
      : 'bg-white border-[#E5ECEC] text-[#252B2E] shadow-[0_18px_36px_-18px_rgba(19,41,48,0.12)] hover:border-[#345C64]/45';

  return (
    <div className={`perspective-stage ${className}`}>
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
        className={`relative h-full rounded-2xl border p-6 sm:p-7 preserve-3d transition-colors duration-150 ${baseSurface}`}
      >
        {/* Specular pointer highlight */}
        <motion.div
          aria-hidden="true"
          style={{
            background: sheenBackground,
            opacity: smoothSheenOpacity
          }}
          className="pointer-events-none absolute inset-0 rounded-2xl"
        />

        {children}
      </motion.div>
    </div>
  );
};

export const ThreeDBentoGrid: React.FC = () => {
  const { launchWorkspace } = useAuth();

  // Cell 1 interactive state: Active 3D Variant Card
  const [focusedEdition, setFocusedEdition] = useState<'std' | 'odoo' | 'ent'>('odoo');

  // Cell 2 interactive state: Tax Regime Cube
  const [taxRegime, setTaxRegime] = useState<'gst' | 'vat' | 'us'>('gst');

  // Cell 3 interactive state: 3D Payment Rail Failover
  const [railState, setRailState] = useState<'decline' | 'recovered'>('recovered');

  const editions = [
    {
      id: 'std' as const,
      label: 'Standard Core',
      markup: 'Base Tier',
      seatRate: 1200,
      seats: 10
    },
    {
      id: 'odoo' as const,
      label: 'Odoo Brand Edition',
      markup: '+$560 / seat',
      seatRate: 1760,
      seats: 10
    },
    {
      id: 'ent' as const,
      label: 'Global Enterprise',
      markup: '+$1,450 / seat',
      seatRate: 2650,
      seats: 10
    }
  ];

  const activeEditionObj = editions.find((e) => e.id === focusedEdition) || editions[1];

  const taxSchedules = {
    gst: { code: 'IN / APAC GST', rate: 18, base: 8800, authority: 'Statutory 18.0% Ledger' },
    vat: { code: 'EU Cross-Border VAT', rate: 20, base: 8800, authority: 'Reverse-Charge Ready' },
    us: { code: 'US SaaS Nexus', rate: 8.8, base: 8800, authority: 'State-Level Apportioned' }
  };

  const activeTax = taxSchedules[taxRegime];
  const computedTax = Math.round((activeTax.base * activeTax.rate) / 100);

  const rolePortals: Array<{
    role: UserRole;
    tab: string;
    code: string;
    title: string;
    scope: string;
    metric: string;
    depthClass: string;
  }> = [
    {
      role: 'admin',
      tab: 'overview',
      code: 'PORTAL 01',
      title: 'Admin Revenue Console',
      scope: 'Full catalog, tax rules & batch dunning',
      metric: '10 Modules',
      depthClass: 'depth-layer-3'
    },
    {
      role: 'staff',
      tab: 'quotations',
      code: 'PORTAL 02',
      title: 'Sales Operations Desk',
      scope: 'Quotation drafting & contract conversion',
      metric: 'CPQ Scoped',
      depthClass: 'depth-layer-2'
    },
    {
      role: 'customer',
      tab: 'customer_overview',
      code: 'PORTAL 03',
      title: 'Subscriber Self-Service',
      scope: 'Plan upgrades, pause & PDF statements',
      metric: 'Zero-Ticket',
      depthClass: 'depth-layer-1'
    }
  ];

  return (
    <section
      id="three-d-bento"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24"
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold text-[#345C64]">
            Spatial Product Architecture · Interactive 3D Bento
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#252B2E] font-display tracking-tight mt-1 text-balance">
            Engineered as composable 3D financial primitives
          </h2>
          <p className="text-xs sm:text-sm text-[#56666B] mt-1.5 leading-relaxed">
            Move across any module to inspect its layered depth, toggle live pricing and statutory tax states, or jump straight into the corresponding operational ledger.
          </p>
        </div>

        <div className="text-xs text-[#56666B] font-mono whitespace-nowrap shrink-0">
          4 Core Engines · Live State Bound
        </div>
      </div>

      {/* Asymmetric 12-Column 3D Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* CELL 1 (7 Cols, Primary Teal): 3D Multi-Edition Variant Matrix */}
        <Tilt3DCard tone="teal" className="lg:col-span-7">
          <div className="h-full flex flex-col justify-between gap-6 preserve-3d">
            <div className="flex flex-wrap items-start justify-between gap-4 depth-layer-1">
              <div className="max-w-md">
                <div className="flex items-center gap-2 text-xs text-[#DDF3F0]">
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span>01. Multi-Edition Catalog &amp; Variant Engine</span>
                </div>
                <h3 className="text-xl font-bold text-white font-display mt-1.5">
                  Instant brand &amp; tier markups without SKU sprawl
                </h3>
              </div>

              <button
                type="button"
                onClick={() => launchWorkspace('admin', 'products')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
              >
                <span>Open Catalog</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3D Layered Edition Cards Floating in Z-Space */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 preserve-3d my-1">
              {editions.map((ed) => {
                const isSelected = focusedEdition === ed.id;
                return (
                  <button
                    key={ed.id}
                    type="button"
                    onClick={() => setFocusedEdition(ed.id)}
                    className={`text-left rounded-xl p-4 border transition-all duration-150 ${
                      isSelected
                        ? 'depth-layer-3 bg-white text-[#1F3F47] border-white shadow-[0_18px_30px_-10px_rgba(9,23,28,0.45)]'
                        : 'depth-layer-1 bg-[#1F3F47]/75 text-white border-white/15 hover:bg-[#1F3F47]'
                    }`}
                  >
                    <div
                      className={`text-[11px] font-mono font-semibold ${
                        isSelected ? 'text-[#2E9F92]' : 'text-[#8CE6DB]'
                      }`}
                    >
                      {ed.markup}
                    </div>
                    <div className="text-xs font-bold mt-1">{ed.label}</div>
                    <div
                      className={`text-lg font-extrabold font-mono tabular-nums mt-3 ${
                        isSelected ? 'text-[#1F3F47]' : 'text-white'
                      }`}
                    >
                      ${ed.seatRate.toLocaleString()}
                      <span
                        className={`text-[11px] font-normal ${
                          isSelected ? 'text-[#56666B]' : 'text-[#DDF3F0]/75'
                        }`}
                      >
                        /seat
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Synchronized Bottom Computation Strip */}
            <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs depth-layer-2">
              <div className="text-[#DDF3F0]">
                10-Seat Contract Preview ({activeEditionObj.label})
              </div>
              <div className="font-mono tabular-nums font-bold text-base text-white">
                ${(activeEditionObj.seatRate * 10).toLocaleString()}.00 / mo
              </div>
            </div>
          </div>
        </Tilt3DCard>

        {/* CELL 2 (5 Cols, Pure White): 3D Statutory Tax & Proration Cube */}
        <Tilt3DCard tone="white" className="lg:col-span-5">
          <div className="h-full flex flex-col justify-between gap-5 preserve-3d">
            <div className="flex items-start justify-between gap-3 depth-layer-1">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#345C64]">
                  <Calculator className="w-3.5 h-3.5 shrink-0" />
                  <span>02. Statutory Tax &amp; Proration</span>
                </div>
                <h3 className="text-lg font-bold text-[#252B2E] font-display mt-1">
                  Zero-drift regional tax computation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => launchWorkspace('admin', 'discounts_taxes')}
                className="text-xs font-semibold text-[#1F3F47] hover:text-[#2E9F92] inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <span>Tax Rules</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Regime Segmented Selector */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC] depth-layer-2">
              {[
                { id: 'gst' as const, label: 'GST 18%' },
                { id: 'vat' as const, label: 'EU VAT 20%' },
                { id: 'us' as const, label: 'US Tax 8.8%' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTaxRegime(t.id)}
                  className={`flex-1 py-1.5 px-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    taxRegime === t.id
                      ? 'bg-[#1F3F47] text-white'
                      : 'text-[#56666B] hover:text-[#252B2E]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Extruded 3D Tax Ledger Card */}
            <div className="rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] p-4 space-y-2.5 depth-layer-3 shadow-[0_14px_26px_-12px_rgba(19,41,48,0.16)]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#252B2E]">{activeTax.code}</span>
                <span className="font-mono text-[11px] text-[#2E9F92] font-semibold">
                  {activeTax.authority}
                </span>
              </div>
              <div className="pt-2 border-t border-[#E5ECEC] space-y-1 text-xs font-mono tabular-nums">
                <div className="flex justify-between text-[#56666B]">
                  <span>Prorated Base</span>
                  <span>${activeTax.base.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between text-[#345C64] font-semibold">
                  <span>Statutory Tax ({activeTax.rate}%)</span>
                  <span>+${computedTax.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between text-[#1F3F47] font-bold text-sm pt-1.5 border-t border-[#E5ECEC]">
                  <span>Settled Statement</span>
                  <span>${(activeTax.base + computedTax).toLocaleString()}.00</span>
                </div>
              </div>
            </div>
          </div>
        </Tilt3DCard>

        {/* CELL 3 (5 Cols, Pure White): 3D Autonomous Payment Rail Failover */}
        <Tilt3DCard tone="white" className="lg:col-span-5">
          <div className="h-full flex flex-col justify-between gap-5 preserve-3d">
            <div className="flex items-start justify-between gap-3 depth-layer-1">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#E96F50]">
                  <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                  <span>03. Multi-Rail Dunning Router</span>
                </div>
                <h3 className="text-lg font-bold text-[#252B2E] font-display mt-1">
                  3D failover from card decline to ACH
                </h3>
              </div>

              <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC]">
                <button
                  type="button"
                  onClick={() => setRailState('decline')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    railState === 'decline'
                      ? 'bg-[#E96F50] text-white'
                      : 'text-[#56666B] hover:text-[#252B2E]'
                  }`}
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => setRailState('recovered')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    railState === 'recovered'
                      ? 'bg-[#2E9F92] text-white'
                      : 'text-[#56666B] hover:text-[#252B2E]'
                  }`}
                >
                  Failover
                </button>
              </div>
            </div>

            {/* Z-Stacked Payment Cards */}
            <div className="space-y-2.5 preserve-3d">
              <div
                className={`p-3.5 rounded-xl border transition-all duration-150 ${
                  railState === 'decline'
                    ? 'depth-layer-3 bg-white border-[#E96F50] shadow-[0_14px_24px_-12px_rgba(233,111,80,0.28)]'
                    : 'depth-layer-1 bg-[#F7FAFA] border-[#E5ECEC] opacity-75'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#252B2E]">Primary Rail · Corporate Visa ••4821</span>
                  <span className="font-mono text-[11px] font-semibold text-[#C85234]">
                    Soft Decline
                  </span>
                </div>
                <div className="text-[11px] text-[#56666B] font-mono mt-1">
                  Velocity cap triggered · Grace window active
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border transition-all duration-150 ${
                  railState === 'recovered'
                    ? 'depth-layer-3 bg-[#DDF3F0]/65 border-[#2E9F92] shadow-[0_16px_28px_-12px_rgba(46,159,146,0.28)]'
                    : 'depth-layer-1 bg-[#F7FAFA] border-[#E5ECEC]'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1F3F47]">Backup Rail · Verified ACH Mandate</span>
                  <span className="font-mono text-[11px] font-bold text-[#1E7A70]">
                    {railState === 'recovered' ? 'Settled $1,760' : 'Standby Route'}
                  </span>
                </div>
                <div className="text-[11px] text-[#345C64] font-mono mt-1">
                  Auto-routed in 180ms without subscriber friction
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5ECEC] flex items-center justify-between text-xs depth-layer-1">
              <span className="text-[#56666B]">Batch recovery rate: 99.2%</span>
              <button
                type="button"
                onClick={() => launchWorkspace('admin', 'billing')}
                className="font-semibold text-[#1F3F47] hover:text-[#2E9F92] inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <span>Open Billing Engine</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </Tilt3DCard>

        {/* CELL 4 (7 Cols, Pure White): 3D Multi-Role Governance Portals */}
        <Tilt3DCard tone="white" className="lg:col-span-7">
          <div className="h-full flex flex-col justify-between gap-5 preserve-3d">
            <div className="flex flex-wrap items-start justify-between gap-3 depth-layer-1">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#345C64]">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>04. Role-Isolated Operational Workspaces</span>
                </div>
                <h3 className="text-xl font-bold text-[#252B2E] font-display mt-1">
                  Three tailored perspectives over one single source of truth
                </h3>
              </div>
              <span className="text-xs font-mono text-[#56666B] whitespace-nowrap shrink-0">
                Click any plane to launch
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 preserve-3d">
              {rolePortals.map((portal) => (
                <button
                  key={portal.role}
                  type="button"
                  onClick={() => launchWorkspace(portal.role, portal.tab)}
                  className={`group text-left rounded-xl p-4 bg-[#F7FAFA] hover:bg-[#DDF3F0]/55 border border-[#E5ECEC] hover:border-[#1F3F47] transition-all duration-150 shadow-[0_14px_24px_-14px_rgba(11,26,32,0.18)] ${portal.depthClass}`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#345C64] font-semibold">
                    <span>{portal.code}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#1F3F47] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                  <div className="text-sm font-bold text-[#252B2E] font-display mt-2">
                    {portal.title}
                  </div>
                  <p className="text-[11px] text-[#56666B] leading-relaxed mt-1">
                    {portal.scope}
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-[#E5ECEC] text-[11px] font-mono font-semibold text-[#1F3F47]">
                    {portal.metric}
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-[#E5ECEC] flex flex-wrap items-center justify-between gap-2 text-xs text-[#56666B] depth-layer-1">
              <span>Granular RBAC permissions enforced across quotations, taxes, and customer statements</span>
              <span className="font-mono font-semibold text-[#2E9F92]">SOC 2 Type II</span>
            </div>
          </div>
        </Tilt3DCard>
      </div>
    </section>
  );
};
