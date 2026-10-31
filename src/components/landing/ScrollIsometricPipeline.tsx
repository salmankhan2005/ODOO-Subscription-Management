import React, { useRef, useState } from 'react';
import { motion, useScroll, useMotionValueEvent, useTransform } from 'motion/react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PipelineStage {
  index: number;
  stepNum: string;
  title: string;
  headline: string;
  description: string;
  ledgerRef: string;
  ledgerEntity: string;
  ledgerAmount: string;
  ledgerStatus: string;
  statusTone: 'teal' | 'coral';
  workspaceTab: string;
  ctaLabel: string;
}

const STAGES: PipelineStage[] = [
  {
    index: 0,
    stepNum: '01',
    title: 'Variant Quotation & Pricing Math',
    headline: 'Configure brand editions and multi-seat markups without spreadsheet drift.',
    description:
      'Sales reps select pre-approved product templates, attach edition markups such as the +$560 Odoo Brand adder, and lock Net 30 terms with instant margin visibility.',
    ledgerRef: 'QT-2026-089',
    ledgerEntity: 'Apex Global Logistics · 5 Seats (Odoo Edition)',
    ledgerAmount: '$10,384.00',
    ledgerStatus: 'Proposal Confirmed',
    statusTone: 'teal',
    workspaceTab: 'quotations',
    ctaLabel: 'Inspect Quotation Wizard'
  },
  {
    index: 1,
    stepNum: '02',
    title: 'Zero-Touch Subscription Activation',
    headline: 'Convert accepted proposals into recurring contracts in a single click.',
    description:
      'Approving a quotation provisions the live subscription record, sets the monthly or annual cadence anchor, and enforces pause, renewal, and early-cancellation policies.',
    ledgerRef: 'SUB-2026-0042',
    ledgerEntity: 'Enterprise Monthly Cadence · Auto-Renew Active',
    ledgerAmount: '$8,800.00 / mo',
    ledgerStatus: 'Active Contract',
    statusTone: 'teal',
    workspaceTab: 'subscriptions',
    ctaLabel: 'Open Subscription Lifecycle'
  },
  {
    index: 2,
    stepNum: '03',
    title: 'Statutory Tax & Batch Invoicing',
    headline: 'Generate tax-compliant statements across every due contract simultaneously.',
    description:
      'On billing day, the batch engine evaluates all due subscriptions, appends statutory 18% GST/VAT and eligible promo codes, and dispatches synchronized PDF statements.',
    ledgerRef: 'INV-2026-1050',
    ledgerEntity: 'Statutory 18% GST Applied · Dispatched via Webhook',
    ledgerAmount: '$10,384.00',
    ledgerStatus: 'Billed & Dispatched',
    statusTone: 'teal',
    workspaceTab: 'invoices',
    ctaLabel: 'View Invoice Ledger'
  },
  {
    index: 3,
    stepNum: '04',
    title: 'Smart Dunning & Multi-Rail Recovery',
    headline: 'Intercept failed card captures before they become involuntary churn.',
    description:
      'When a primary card hits a soft limit decline, Brightloop schedules timed retries and routes settlement across backup ACH or secondary card rails automatically.',
    ledgerRef: 'DUN-RAIL-02',
    ledgerEntity: 'Marcus Chen (Nexus Cloud) · Fallback Rail Settlement',
    ledgerAmount: '$1,760.00',
    ledgerStatus: 'Recovered via Backup Rail',
    statusTone: 'coral',
    workspaceTab: 'billing',
    ctaLabel: 'Launch Dunning Studio'
  }
];

export const ScrollIsometricPipeline: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStage, setActiveStage] = useState<number>(0);
  const { launchWorkspace } = useAuth();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  const progressBarScaleY = useTransform(scrollYProgress, [0, 1], [0.12, 1]);

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    if (latest < 0.25) setActiveStage(0);
    else if (latest < 0.52) setActiveStage(1);
    else if (latest < 0.78) setActiveStage(2);
    else setActiveStage(3);
  });

  const currentStage = STAGES[activeStage];

  // Isometric node coordinates inside 600x410 viewBox
  const isoNodes = [
    { id: 0, cx: 145, cy: 115, code: '01', label: 'QUOTE', sub: '+$560 Adder' },
    { id: 1, cx: 295, cy: 185, code: '02', label: 'CONTRACT', sub: 'Auto Cadence' },
    { id: 2, cx: 445, cy: 115, code: '03', label: 'INVOICE', sub: '18% GST/VAT' },
    { id: 3, cx: 295, cy: 295, code: '04', label: 'DUNNING', sub: 'Rail Recovery' }
  ];

  return (
    <section
      id="isometric-pipeline"
      ref={containerRef}
      className="relative border-y border-[#E5ECEC] bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Section Intro */}
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-semibold text-[#2E9F92] mb-2">
            Scroll-Choreographed Quote-to-Cash Engine
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#252B2E] font-display tracking-tight text-balance">
            Every revenue stage connected on one deterministic ledger.
          </h2>
          <p className="text-sm sm:text-base text-[#56666B] mt-3 leading-relaxed">
            Scroll through the four operational stages—or select any node directly—to inspect how Brightloop moves enterprise deals from custom variant quotes to settled cash.
          </p>
        </div>

        {/* Sticky Scroll Two-Column Track */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start lg:min-h-[210vh]">
          {/* Left Column: Scrolling Narrative Steps */}
          <div className="lg:col-span-5 relative pl-6 space-y-10 lg:space-y-28 py-2">
            {/* Vertical Scroll Progress Track */}
            <div className="hidden lg:block absolute left-0 top-2 bottom-2 w-0.5 bg-[#E5ECEC] overflow-hidden rounded-full">
              <motion.div
                style={{ scaleY: progressBarScaleY, transformOrigin: 'top' }}
                className="w-full h-full bg-[#2E9F92]"
              />
            </div>

            {STAGES.map((stage) => {
              const isCurrent = activeStage === stage.index;
              return (
                <div
                  key={stage.index}
                  onClick={() => setActiveStage(stage.index)}
                  className={`cursor-pointer rounded-xl p-5 sm:p-6 border transition-all duration-200 ${
                    isCurrent
                      ? 'bg-[#F7FAFA] border-[#345C64] shadow-sm'
                      : 'bg-white border-[#E5ECEC] opacity-65 hover:opacity-95'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-2">
                    <span className="font-mono font-bold text-[#1F3F47]">
                      {stage.stepNum}. {stage.title}
                    </span>
                    <span className="font-mono text-[11px] text-[#56666B]">{stage.ledgerRef}</span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-[#252B2E] font-display leading-snug text-balance">
                    {stage.headline}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#56666B] mt-2.5 leading-relaxed">
                    {stage.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-[#E5ECEC] flex items-center justify-between gap-3">
                    <span className="text-xs font-mono font-semibold text-[#345C64]">
                      {stage.ledgerAmount}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        launchWorkspace('admin', stage.workspaceTab);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F3F47] hover:text-[#2E9F92] transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>{stage.ctaLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Sticky 3D Axonometric Pipeline Stage */}
          <div className="lg:col-span-7 lg:sticky lg:top-24">
            <div className="rounded-2xl bg-[#345C64] border border-[#27484F] p-5 sm:p-7 text-white iso-grid-dark overflow-hidden">
              {/* Stage Top Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/15">
                <div>
                  <div className="text-[11px] font-mono text-[#DDF3F0]/80">
                    AXONOMETRIC PIPELINE · STAGE 0{activeStage + 1} OF 04
                  </div>
                  <div className="text-base sm:text-lg font-bold font-display text-white mt-0.5">
                    {currentStage.title}
                  </div>
                </div>

                {/* Quick clickable stage selector tabs */}
                <div className="flex items-center gap-1 bg-[#1F3F47] p-1 rounded-lg">
                  {STAGES.map((st) => (
                    <button
                      key={st.index}
                      type="button"
                      onClick={() => setActiveStage(st.index)}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        activeStage === st.index
                          ? 'bg-[#DDF3F0] text-[#1F3F47]'
                          : 'text-[#DDF3F0]/75 hover:text-white'
                      }`}
                    >
                      {st.stepNum}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3D Isometric Pipeline SVG */}
              <div className="my-4 flex items-center justify-center select-none">
                <svg
                  viewBox="0 0 600 390"
                  className="w-full h-auto max-h-[360px] overflow-visible"
                  role="img"
                  aria-label="Isometric Quote to Cash and Dunning Recovery Pipeline"
                >
                  {/* Isometric Base Platform */}
                  <polygon
                    points="300,35 565,180 300,365 35,180"
                    fill="#1F3F47"
                    fillOpacity="0.65"
                    stroke="#DDF3F0"
                    strokeOpacity="0.18"
                    strokeWidth="1.2"
                  />
                  {/* Platform Thickness Rim */}
                  <polygon points="35,180 300,365 300,378 35,193" fill="#173138" />
                  <polygon points="565,180 300,365 300,378 565,193" fill="#12272D" />

                  {/* Conduit 1: Quote (145,115) -> Contract (295,185) */}
                  <line
                    x1="145"
                    y1="115"
                    x2="295"
                    y2="185"
                    stroke="#2E9F92"
                    strokeWidth={activeStage >= 1 ? '3.5' : '2'}
                    strokeOpacity={activeStage >= 0 ? '0.95' : '0.35'}
                  />
                  {/* Conduit 2: Contract (295,185) -> Invoice (445,115) */}
                  <line
                    x1="295"
                    y1="185"
                    x2="445"
                    y2="115"
                    stroke="#2E9F92"
                    strokeWidth={activeStage >= 2 ? '3.5' : '2'}
                    strokeOpacity={activeStage >= 1 ? '0.95' : '0.35'}
                  />
                  {/* Conduit 3 (Dunning Fallback Loop): Invoice (445,115) -> Dunning (295,295) -> Contract (295,185) */}
                  <polyline
                    points="445,115 445,225 295,295"
                    fill="none"
                    stroke="#E96F50"
                    strokeWidth={activeStage === 3 ? '3.5' : '2'}
                    strokeDasharray="6 4"
                    strokeOpacity={activeStage === 3 ? '1' : '0.45'}
                  />
                  <line
                    x1="295"
                    y1="295"
                    x2="295"
                    y2="185"
                    stroke="#2E9F92"
                    strokeWidth={activeStage === 3 ? '3' : '1.5'}
                    strokeDasharray="4 4"
                    strokeOpacity={activeStage === 3 ? '0.95' : '0.35'}
                  />

                  {/* Live Animated Data Packets along Active Conduit */}
                  {activeStage === 0 && (
                    <motion.circle
                      r="5.5"
                      fill="#DDF3F0"
                      animate={{ cx: [145, 295], cy: [115, 185], opacity: [0, 1, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  {activeStage === 1 && (
                    <motion.circle
                      r="5.5"
                      fill="#2E9F92"
                      animate={{ cx: [295, 445], cy: [185, 115], opacity: [0, 1, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  {activeStage === 2 && (
                    <motion.circle
                      r="6"
                      fill="#DDF3F0"
                      animate={{ cx: [295, 445], cy: [185, 115], opacity: [0, 1, 1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  {activeStage === 3 && (
                    <>
                      <motion.circle
                        r="6"
                        fill="#E96F50"
                        animate={{
                          cx: [445, 445, 295],
                          cy: [115, 225, 295],
                          opacity: [0, 1, 0]
                        }}
                        transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <motion.circle
                        r="5.5"
                        fill="#2E9F92"
                        animate={{
                          cx: [295, 295],
                          cy: [295, 185],
                          opacity: [0, 1, 0]
                        }}
                        transition={{ duration: 1.6, repeat: Infinity, delay: 0.8, ease: 'easeInOut' }}
                      />
                    </>
                  )}

                  {/* Render 4 Isometric 3D Pedestal Nodes */}
                  {isoNodes.map((node) => {
                    const isFocused = activeStage === node.id;
                    const isCoralNode = node.id === 3;
                    const topFill = isFocused
                      ? '#FFFFFF'
                      : isCoralNode
                        ? '#2A4E56'
                        : '#264951';
                    const strokeCol = isFocused
                      ? isCoralNode
                        ? '#E96F50'
                        : '#2E9F92'
                      : '#6A949C';

                    return (
                      <motion.g
                        key={node.id}
                        onClick={() => setActiveStage(node.id)}
                        animate={{ y: isFocused ? -12 : 0 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="cursor-pointer"
                      >
                        {/* Drop shadow under elevated block */}
                        <polygon
                          points={`${node.cx},${node.cy - 22} ${node.cx + 68},${node.cy + 12} ${node.cx},${node.cy + 46} ${node.cx - 68},${node.cy + 12}`}
                          fill="#0E2126"
                          fillOpacity={isFocused ? '0.45' : '0.2'}
                          transform="translate(0, 16)"
                        />

                        {/* Left 3D Wall */}
                        <polygon
                          points={`${node.cx - 68},${node.cy} ${node.cx},${node.cy + 34} ${node.cx},${node.cy + 52} ${node.cx - 68},${node.cy + 18}`}
                          fill={isFocused ? '#DDF3F0' : '#1B383F'}
                        />
                        {/* Right 3D Wall */}
                        <polygon
                          points={`${node.cx + 68},${node.cy} ${node.cx},${node.cy + 34} ${node.cx},${node.cy + 52} ${node.cx + 68},${node.cy + 18}`}
                          fill={isFocused ? '#B7DBD6' : '#142B31'}
                        />
                        {/* Top Isometric Diamond */}
                        <polygon
                          points={`${node.cx},${node.cy - 34} ${node.cx + 68},${node.cy} ${node.cx},${node.cy + 34} ${node.cx - 68},${node.cy}`}
                          fill={topFill}
                          stroke={strokeCol}
                          strokeWidth={isFocused ? '2.5' : '1.2'}
                        />

                        {/* Node Code & Label */}
                        <text
                          x={node.cx}
                          y={node.cy - 4}
                          textAnchor="middle"
                          fill={isFocused ? '#1F3F47' : '#DDF3F0'}
                          fontSize="11"
                          fontWeight="700"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {node.code} · {node.label}
                        </text>
                        <text
                          x={node.cx}
                          y={node.cy + 12}
                          textAnchor="middle"
                          fill={isFocused ? (isCoralNode ? '#E96F50' : '#2E9F92') : '#9BC0C6'}
                          fontSize="9.5"
                          fontWeight="600"
                          fontFamily="Public Sans, sans-serif"
                        >
                          {node.sub}
                        </text>
                      </motion.g>
                    );
                  })}
                </svg>
              </div>

              {/* Crisp Pure White Synchronized Ledger Strip at Bottom of Isometric Viewport */}
              <motion.div
                key={currentStage.ledgerRef}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16 }}
                className="rounded-xl bg-white text-[#252B2E] p-4 border border-[#E5ECEC] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-[#1F3F47]">{currentStage.ledgerRef}</span>
                    <span className="text-[#9AB0B4]">·</span>
                    <span className="font-medium text-[#56666B]">{currentStage.ledgerEntity}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${
                        currentStage.statusTone === 'coral' ? 'text-[#E96F50]' : 'text-[#2E9F92]'
                      }`}
                    />
                    <span
                      className={`text-xs font-semibold ${
                        currentStage.statusTone === 'coral' ? 'text-[#C85234]' : 'text-[#1E7A70]'
                      }`}
                    >
                      {currentStage.ledgerStatus}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-[#E5ECEC] pt-2 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] text-[#56666B]">Ledger Value</div>
                    <div className="text-base font-extrabold font-mono text-[#252B2E]">
                      {currentStage.ledgerAmount}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => launchWorkspace('admin', currentStage.workspaceTab)}
                    className="px-3.5 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    Open Live View
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
