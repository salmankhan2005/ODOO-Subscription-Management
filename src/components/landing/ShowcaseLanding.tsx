import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { HeroDotField } from './HeroDotField';
import { IsometricHeroStack } from './IsometricHeroStack';
import { ThreeDBentoGrid } from './ThreeDBentoGrid';
import { CinematicVisualBento } from './CinematicVisualBento';
import { ScrollIsometricPipeline } from './ScrollIsometricPipeline';
import { AnalyticsBentoGrid } from './AnalyticsBentoGrid';
import {
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Users,
  Repeat,
  RotateCcw
} from 'lucide-react';

export const ShowcaseLanding: React.FC = () => {
  const { launchWorkspace } = useAuth();
  const { showToast } = useToast();

  // Interactive Variant Pricing Calculator State
  const [selectedVariant, setSelectedVariant] = useState<'std' | 'odoo' | 'ent'>('odoo');
  const [includeDunning, setIncludeDunning] = useState(true);
  const [includeSla, setIncludeSla] = useState(false);
  const [seats, setSeats] = useState(5);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  // Interactive Multi-Rail Dunning Simulator State
  const [dunningStep, setDunningStep] = useState<0 | 1 | 2 | 3>(0);

  // Validated Consultation Lead Form State
  const [leadForm, setLeadForm] = useState({
    fullName: '',
    workEmail: '',
    company: '',
    monthlyVolume: '$50k – $250k MRR'
  });
  const [leadError, setLeadError] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  // Live Pricing Math
  const basePrice = 1200;
  const variantAdder = selectedVariant === 'odoo' ? 560 : selectedVariant === 'ent' ? 1450 : 0;
  const unitPrice = basePrice + variantAdder;
  const softwareSubtotal = unitPrice * seats;
  const addOnSubtotal = (includeDunning ? 380 : 0) + (includeSla ? 650 : 0);
  const rawSubtotal = softwareSubtotal + addOnSubtotal;
  const intervalDiscount = billingInterval === 'yearly' ? 0.85 : 1.0;
  const subtotalAfterInterval = Math.round(rawSubtotal * intervalDiscount);
  const taxRate = 0.18;
  const taxAmount = Math.round(subtotalAfterInterval * taxRate);
  const finalTotal = subtotalAfterInterval + taxAmount;

  const triggerDunningCascade = () => {
    setDunningStep(1);
    setTimeout(() => setDunningStep(2), 700);
    setTimeout(() => {
      setDunningStep(3);
      showToast('Invoice INV-2026-1050 ($1,760) recovered via Backup ACH Rail');
    }, 1500);
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLeadError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!leadForm.fullName.trim() || !leadForm.company.trim()) {
      setLeadError('Please enter your full name and organization name.');
      return;
    }
    if (!emailRegex.test(leadForm.workEmail)) {
      setLeadError('Please provide a valid corporate email address.');
      return;
    }
    setLeadSubmitted(true);
    showToast(`Architecture briefing scheduled for ${leadForm.company}`);
  };

  return (
    <div id="top" className="min-h-screen bg-[#F7FAFA] text-[#252B2E]">
      {/* 1. ELEGANT HERO SECTION WITH ORGANIC RANDOM DOT FIELD & FLOATING ISOMETRIC UI */}
      <section className="relative overflow-hidden border-b border-[#E5ECEC]">
        {/* Organic Stippled Random Dot Pattern Background */}
        <HeroDotField />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left Hero Copy & Role Launchers */}
            <div className="lg:col-span-6 flex flex-col justify-between py-2">
              <div className="space-y-5">
                <div className="text-xs font-semibold text-[#345C64]">
                  Enterprise Recurring Billing · Multi-Role Revenue Operations
                </div>

                <h1 className="hero-display-size font-extrabold text-[#252B2E] font-display tracking-tight leading-[1.08] text-balance">
                  Deterministic subscription billing and revenue recovery at scale.
                </h1>

                <p className="text-base text-[#56666B] leading-relaxed max-w-xl">
                  Replace fragmented billing spreadsheets with automated quote-to-subscription workflows, instant variant pricing markups, statutory tax ledgers, and multi-rail dunning recovery.
                </p>

                {/* Primary & Perspective Launch Controls */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => launchWorkspace('admin', 'overview')}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white font-semibold text-sm transition-colors whitespace-nowrap shrink-0"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Open Admin Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => launchWorkspace('staff', 'quotations')}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-white/95 hover:bg-[#DDF3F0]/60 border border-[#E5ECEC] text-[#1F3F47] font-semibold text-sm transition-colors whitespace-nowrap shrink-0"
                  >
                    <Users className="w-4 h-4 text-[#2E9F92]" />
                    <span>Sales Ops View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => launchWorkspace('customer', 'customer_overview')}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-white/95 hover:bg-[#DDF3F0]/60 border border-[#E5ECEC] text-[#1F3F47] font-semibold text-sm transition-colors whitespace-nowrap shrink-0"
                  >
                    <Repeat className="w-4 h-4 text-[#E96F50]" />
                    <span>Subscriber Portal</span>
                  </button>
                </div>
              </div>

              {/* Clean Unboxed Trust Metadata */}
              <div className="mt-8 pt-6 border-t border-[#E5ECEC] flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#56666B]">
                <span className="font-semibold text-[#252B2E]">SOC 2 Type II Audited</span>
                <span aria-hidden="true">·</span>
                <span>Automated 18% GST &amp; EU VAT Rules</span>
                <span aria-hidden="true">·</span>
                <span>Multi-Currency &amp; Net 30 Ledger Ready</span>
              </div>
            </div>

            {/* Right Hero Focal Carrier: Unboxed Floating 3D Isometric Stack + Grounded Dark Shadow */}
            <div className="lg:col-span-6">
              <IsometricHeroStack />
            </div>
          </div>

          {/* Full-Width 4-Column Quantified KPI Strip Below Hero Split */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl bg-[#345C64] text-white p-5 border border-[#27484F]">
              <div className="text-xs text-[#DDF3F0]">Active Managed MRR</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums mt-1">$94,820</div>
              <div className="text-xs text-[#8CE6DB] font-medium mt-1">
                +18.4% QoQ across 42 enterprise contracts
              </div>
            </div>

            <div className="rounded-xl bg-white/95 backdrop-blur-xs p-5 border border-[#E5ECEC]">
              <div className="text-xs text-[#56666B]">Automated Collection Rate</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[#2E9F92] mt-1">
                99.2%
              </div>
              <div className="text-xs text-[#56666B] mt-1">
                Direct card, ACH wire &amp; backup rail settlement
              </div>
            </div>

            <div className="rounded-xl bg-white/95 backdrop-blur-xs p-5 border border-[#E5ECEC]">
              <div className="text-xs text-[#56666B]">Month-End Ledger Query</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[#252B2E] mt-1">
                142ms
              </div>
              <div className="text-xs text-[#56666B] mt-1">
                Replaces 4-day manual spreadsheet reconciliation
              </div>
            </div>

            <div className="rounded-xl bg-white/95 backdrop-blur-xs p-5 border border-[#E5ECEC]">
              <div className="text-xs text-[#56666B]">Involuntary Churn Intercepted</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[#E96F50] mt-1">
                $412K
              </div>
              <div className="text-xs text-[#56666B] mt-1">
                Annualized ARR saved via timed dunning retries
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CURSOR-REACTIVE 3D CAPABILITIES BENTO GRID */}
      <ThreeDBentoGrid />

      {/* 3. DEEP TEAL CINEMATIC 3D VISUAL BENTO STAGE */}
      <CinematicVisualBento />

      {/* 4. STICKY SCROLL-LINKED ISOMETRIC QUOTE-TO-CASH PIPELINE */}
      <ScrollIsometricPipeline />

      {/* 5. INTERACTIVE SAAS ANALYTICS BENTO GRID */}
      <AnalyticsBentoGrid />

      {/* 5. INTERACTIVE VARIANT PRICING ENGINE & MULTI-RAIL DUNNING SIMULATOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 space-y-12">
        {/* Variant Configurator */}
        <div
          id="interactive-calculator"
          className="rounded-2xl bg-white border border-[#E5ECEC] p-6 sm:p-8"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#E5ECEC] mb-8 gap-4">
            <div>
              <div className="text-xs font-semibold text-[#345C64]">
                01. Dynamic Catalog &amp; Edition Pricing Configurator
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#252B2E] font-display tracking-tight mt-1">
                Model multi-seat variant contracts in real time
              </h2>
              <p className="text-xs sm:text-sm text-[#56666B] mt-1">
                Configure base software licenses, brand markups (Odoo Edition +$560), and statutory 18% tax before generating a formal quote.
              </p>
            </div>

            {/* Cadence Segmented Control */}
            <div className="flex items-center gap-1 p-1 bg-[#F7FAFA] rounded-lg border border-[#E5ECEC] self-start md:self-auto">
              <button
                type="button"
                onClick={() => setBillingInterval('monthly')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  billingInterval === 'monthly'
                    ? 'bg-[#1F3F47] text-white'
                    : 'text-[#56666B] hover:text-[#252B2E]'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval('yearly')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  billingInterval === 'yearly'
                    ? 'bg-[#1F3F47] text-white'
                    : 'text-[#56666B] hover:text-[#252B2E]'
                }`}
              >
                Annual Contract (-15%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Configuration Controls */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <label className="text-xs font-semibold text-[#252B2E] block mb-2.5">
                  Select Software Edition Variant
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'std' as const, name: 'Standard Core', adder: 'Base Price', total: '$1,200/mo' },
                    { id: 'odoo' as const, name: 'Odoo Brand Edition', adder: '+$560', total: '$1,760/mo' },
                    { id: 'ent' as const, name: 'Global Enterprise', adder: '+$1,450', total: '$2,650/mo' }
                  ].map((v) => {
                    const active = selectedVariant === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v.id)}
                        className={`p-3.5 rounded-xl text-left border transition-colors ${
                          active
                            ? 'bg-[#DDF3F0]/65 border-[#1F3F47] text-[#1F3F47]'
                            : 'bg-[#F7FAFA] border-[#E5ECEC] text-[#252B2E] hover:border-[#345C64]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold">{v.name}</span>
                          <span className="text-[11px] font-mono font-semibold text-[#2E9F92]">{v.adder}</span>
                        </div>
                        <div className="text-xs font-mono tabular-nums text-[#56666B] mt-1">
                          {v.total} per seat
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seat Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#252B2E] mb-2">
                  <span>Provisioned Operator Seats</span>
                  <span className="font-mono tabular-nums text-sm font-bold text-[#1F3F47]">
                    {seats} Seats
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  className="w-full accent-[#1F3F47] cursor-pointer h-2 bg-[#E5ECEC] rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-[#56666B] font-mono tabular-nums mt-1">
                  <span>1 Seat</span>
                  <span>15 Seats</span>
                  <span>30 Seats</span>
                  <span>50 Seats</span>
                </div>
              </div>

              {/* Modular Add-Ons */}
              <div>
                <label className="text-xs font-semibold text-[#252B2E] block mb-2.5">
                  Optional Recurring Modules
                </label>
                <div className="space-y-2.5">
                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] cursor-pointer hover:border-[#345C64]/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={includeDunning}
                        onChange={(e) => setIncludeDunning(e.target.checked)}
                        className="w-4 h-4 rounded border-[#C5D4D4] accent-[#1F3F47]"
                      />
                      <div>
                        <div className="text-xs font-semibold text-[#252B2E]">
                          Autonomous Multi-Rail Dunning &amp; Recovery
                        </div>
                        <div className="text-[11px] text-[#56666B]">
                          Smart retry timing + backup ACH settlement cascade
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono tabular-nums font-semibold text-[#345C64]">
                      +$380/mo
                    </span>
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] cursor-pointer hover:border-[#345C64]/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={includeSla}
                        onChange={(e) => setIncludeSla(e.target.checked)}
                        className="w-4 h-4 rounded border-[#C5D4D4] accent-[#1F3F47]"
                      />
                      <div>
                        <div className="text-xs font-semibold text-[#252B2E]">
                          Dedicated Solutions Engineer &amp; 15-Min SLA
                        </div>
                        <div className="text-[11px] text-[#56666B]">
                          Priority migration support and quarterly ledger audits
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono tabular-nums font-semibold text-[#345C64]">
                      +$650/mo
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Primary Teal (#345C64) Executive Quote Summary Card */}
            <div className="lg:col-span-5 rounded-xl bg-[#345C64] text-white p-6 flex flex-col justify-between border border-[#27484F]">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                  <span className="text-xs font-semibold text-[#DDF3F0]">
                    Live Contract Schedule
                  </span>
                  <span className="text-xs font-mono text-[#8CE6DB]">Statutory 18% GST/VAT</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-[#DDF3F0]">
                    <span>
                      {selectedVariant === 'odoo'
                        ? 'Odoo Brand Edition'
                        : selectedVariant === 'ent'
                          ? 'Global Enterprise'
                          : 'Standard Core'}{' '}
                      ({seats} seats)
                    </span>
                    <span className="font-mono tabular-nums text-white">
                      ${unitPrice.toLocaleString()} × {seats}
                    </span>
                  </div>

                  <div className="flex justify-between text-[#DDF3F0]/85">
                    <span>Software License Subtotal</span>
                    <span className="font-mono tabular-nums text-white">
                      ${softwareSubtotal.toLocaleString()}
                    </span>
                  </div>

                  {addOnSubtotal > 0 && (
                    <div className="flex justify-between text-[#DDF3F0]/85">
                      <span>Recurring Add-On Modules</span>
                      <span className="font-mono tabular-nums text-white">
                        +${addOnSubtotal.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {billingInterval === 'yearly' && (
                    <div className="flex justify-between text-[#8CE6DB] font-medium">
                      <span>Annual Commitment Incentive</span>
                      <span className="font-mono">-15%</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#DDF3F0]/85 pt-2.5 border-t border-white/15">
                    <span>Estimated Tax (18% Statutory)</span>
                    <span className="font-mono tabular-nums text-white">
                      +${taxAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/15 space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-xs text-[#DDF3F0]/85">
                      Total {billingInterval === 'yearly' ? 'Monthly Equivalent' : 'Monthly Invoice'}
                    </div>
                    <div className="text-3xl font-extrabold font-mono tabular-nums text-white mt-0.5">
                      ${finalTotal.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-xs text-[#DDF3F0]/80 font-mono">Net 30 Terms</span>
                </div>

                <button
                  type="button"
                  onClick={() => launchWorkspace('admin', 'quotations')}
                  className="w-full py-3 px-4 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span>Generate Proposal in Quotation Engine</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Rail Dunning Motion Simulator */}
        <div
          id="dunning-engine"
          className="rounded-2xl bg-white border border-[#E5ECEC] p-6 sm:p-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="text-xs font-semibold text-[#E96F50]">
                02. Autonomous Payment Recovery Workflow
              </div>
              <h3 className="text-2xl font-extrabold text-[#252B2E] font-display tracking-tight text-balance">
                Recover declined enterprise renewals without manual finance chases.
              </h3>
              <p className="text-xs sm:text-sm text-[#56666B] leading-relaxed">
                Test a live dunning cascade on overdue invoice{' '}
                <span className="font-mono font-semibold text-[#252B2E]">INV-2026-1050</span>. Watch Brightloop detect a card velocity decline, initiate a smart grace window, and settle via backup ACH rail.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={triggerDunningCascade}
                  disabled={dunningStep === 1 || dunningStep === 2}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white text-xs font-semibold transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
                >
                  {dunningStep === 1 || dunningStep === 2 ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Executing Fallback Rail...</span>
                    </>
                  ) : (
                    <>
                      <span>Simulate Smart Recovery</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                {dunningStep === 3 && (
                  <button
                    type="button"
                    onClick={() => setDunningStep(0)}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC] text-[#56666B] hover:text-[#252B2E] text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Motion Rail Diagram */}
            <div className="lg:col-span-7 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] p-5 sm:p-6">
              <div className="flex items-center justify-between text-xs pb-4 mb-5 border-b border-[#E5ECEC]">
                <div>
                  <span className="font-mono font-bold text-[#252B2E]">INV-2026-1050</span>
                  <span className="text-[#56666B]"> · Nexus Cloud Systems ($1,760.00)</span>
                </div>
                <span
                  className={`font-mono font-semibold ${
                    dunningStep === 3 ? 'text-[#2E9F92]' : 'text-[#E96F50]'
                  }`}
                >
                  {dunningStep === 0 && 'Primary Card Soft Declined'}
                  {dunningStep === 1 && 'Evaluating Optimal Retry Window...'}
                  {dunningStep === 2 && 'Routing to Backup ACH Rail...'}
                  {dunningStep === 3 && 'Settled ($1,760.00 Paid)'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
                {[
                  {
                    step: 0,
                    code: 'RAIL 01',
                    name: 'Corporate Visa ••4821',
                    state: 'Velocity Limit Decline'
                  },
                  {
                    step: 1,
                    code: 'ORCHESTRATOR',
                    name: 'Smart Grace & Webhook',
                    state: dunningStep >= 1 ? 'Retry Routed in 180ms' : 'Standby Policy'
                  },
                  {
                    step: 3,
                    code: 'RAIL 02',
                    name: 'Verified ACH Wire Mandate',
                    state: dunningStep === 3 ? 'Cleared · TXN-90412' : 'Backup Settlement Rail'
                  }
                ].map((node, idx) => {
                  const isReached =
                    (idx === 0 && dunningStep >= 0) ||
                    (idx === 1 && dunningStep >= 1) ||
                    (idx === 2 && dunningStep === 3);

                  return (
                    <motion.div
                      key={node.code}
                      animate={{
                        y: isReached ? -2 : 0
                      }}
                      transition={{ duration: 0.18 }}
                      className={`rounded-xl p-4 border transition-colors ${
                        idx === 2 && dunningStep === 3
                          ? 'bg-[#DDF3F0]/70 border-[#2E9F92]'
                          : idx === 0 && dunningStep < 3
                            ? 'bg-white border-[#E96F50]/60'
                            : 'bg-white border-[#E5ECEC]'
                      }`}
                    >
                      <div className="text-[10px] font-mono font-bold text-[#56666B]">{node.code}</div>
                      <div className="text-xs font-bold text-[#252B2E] mt-1">{node.name}</div>
                      <div
                        className={`text-[11px] font-mono mt-2 font-semibold ${
                          idx === 2 && dunningStep === 3
                            ? 'text-[#1E7A70]'
                            : idx === 0
                              ? 'text-[#C85234]'
                              : 'text-[#345C64]'
                        }`}
                      >
                        {node.state}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. QUANTIFIED ENTERPRISE CASE PROOF & CONSULTATION CAPTURE */}
      <section id="enterprise-proof" className="border-t border-[#E5ECEC] bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Case Studies */}
          <div>
            <div className="max-w-2xl mb-10">
              <div className="text-xs font-semibold text-[#345C64]">
                Verified Enterprise Outcomes
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#252B2E] font-display tracking-tight mt-1">
                Measured financial impact across B2B software operators
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  metric: '+99.4% Collection Rate',
                  timeframe: 'Within 60 days of migration',
                  quote:
                    'Moving 1,400 multi-seat logistics contracts off manual ERP spreadsheets eliminated billing drift and cut overdue receivables by 78%.',
                  person: 'Sarah Jenkins',
                  role: 'VP of Finance · Apex Global Logistics'
                },
                {
                  metric: '$284K ARR Recovered',
                  timeframe: 'First 2 quarters on Smart Dunning',
                  quote:
                    'Card velocity declines used to stall enterprise renewals for weeks. Automated backup ACH routing recovers failed invoices before reps even notice.',
                  person: 'Marcus Chen',
                  role: 'Head of Revenue Ops · Nexus Cloud Systems'
                },
                {
                  metric: '4 Days → 12 Minutes',
                  timeframe: 'Month-end statutory tax close',
                  quote:
                    'Automated 18% GST/VAT computation across Standard and Odoo Brand editions turned our quarterly audit prep into a single CSV export.',
                  person: 'Elena Rostova',
                  role: 'Controller · Vanguard Manufacturing SaaS'
                }
              ].map((cs) => (
                <div
                  key={cs.person}
                  className="rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="text-xl font-extrabold font-mono tabular-nums text-[#1F3F47]">
                      {cs.metric}
                    </div>
                    <div className="text-xs text-[#2E9F92] font-semibold mt-0.5">{cs.timeframe}</div>
                    <p className="text-xs sm:text-sm text-[#252B2E] leading-relaxed mt-4">
                      “{cs.quote}”
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#E5ECEC]">
                    <div className="text-xs font-bold text-[#252B2E]">{cs.person}</div>
                    <div className="text-[11px] text-[#56666B]">{cs.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validated Enterprise Consultation & Architecture Walkthrough Form */}
          <div className="rounded-2xl bg-[#345C64] text-white p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-3">
              <div className="text-xs font-semibold text-[#DDF3F0]">Enterprise Onboarding</div>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-balance">
                Ready to unify your recurring billing ledger?
              </h3>
              <p className="text-xs sm:text-sm text-[#DDF3F0]/85 leading-relaxed max-w-lg">
                Explore the full interactive workspace immediately with live sample contracts, or request a tailored migration blueprint from our billing architects.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => launchWorkspace('admin', 'overview')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#DDF3F0] hover:bg-white text-[#1F3F47] text-xs font-bold transition-colors whitespace-nowrap"
                >
                  <span>Explore Live Sandbox Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 bg-white text-[#252B2E] rounded-xl p-6 border border-[#E5ECEC]">
              {leadSubmitted ? (
                <div className="py-6 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#2E9F92] mx-auto" />
                  <h4 className="text-base font-bold font-display">Architecture Briefing Confirmed</h4>
                  <p className="text-xs text-[#56666B] max-w-sm mx-auto">
                    We have dispatched calendar availability and a custom sandbox link to{' '}
                    <span className="font-mono font-semibold text-[#252B2E]">{leadForm.workEmail}</span>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setLeadSubmitted(false)}
                    className="mt-2 text-xs font-semibold text-[#1F3F47] underline"
                  >
                    Submit another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-3.5 text-xs" noValidate>
                  <div className="text-sm font-bold text-[#252B2E] font-display">
                    Schedule Discovery Call
                  </div>
                  {leadError && (
                    <div className="p-2.5 rounded-lg bg-[#E96F50]/10 border border-[#E96F50]/30 text-[#C85234] font-medium">
                      {leadError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#252B2E] mb-1">Full Name</label>
                      <input
                        type="text"
                        value={leadForm.fullName}
                        onChange={(e) => setLeadForm({ ...leadForm, fullName: e.target.value })}
                        placeholder="Alex Rivera"
                        className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg px-3 py-2 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#252B2E] mb-1">Work Email</label>
                      <input
                        type="email"
                        value={leadForm.workEmail}
                        onChange={(e) => setLeadForm({ ...leadForm, workEmail: e.target.value })}
                        placeholder="alex@company.com"
                        className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg px-3 py-2 text-[#252B2E] font-mono focus:outline-none focus:border-[#345C64]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#252B2E] mb-1">Organization</label>
                      <input
                        type="text"
                        value={leadForm.company}
                        onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                        placeholder="Meridian Cloud Inc."
                        className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg px-3 py-2 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#252B2E] mb-1">Monthly Billing Volume</label>
                      <select
                        value={leadForm.monthlyVolume}
                        onChange={(e) => setLeadForm({ ...leadForm, monthlyVolume: e.target.value })}
                        className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg px-3 py-2 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
                      >
                        <option value="$50k – $250k MRR">$50k – $250k MRR</option>
                        <option value="$250k – $1M MRR">$250k – $1M MRR</option>
                        <option value="$1M+ Enterprise MRR">$1M+ Enterprise MRR</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white font-semibold transition-colors"
                  >
                    Request Architecture Walkthrough
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 7. QUIET CORPORATE FOOTER */}
      <footer className="border-t border-[#E5ECEC] bg-[#F7FAFA] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#56666B]">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-[#1F3F47] font-display text-sm">Brightloop</span>
            <span>·</span>
            <span>Enterprise Subscription &amp; Revenue Recovery Platform</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <a href="#three-d-bento" className="hover:text-[#1F3F47] transition-colors">
              3D Platform
            </a>
            <a href="#cinematic-vault" className="hover:text-[#1F3F47] transition-colors">
              Cinematic Vault
            </a>
            <a href="#isometric-pipeline" className="hover:text-[#1F3F47] transition-colors">
              Architecture
            </a>
            <a href="#analytics-bento" className="hover:text-[#1F3F47] transition-colors">
              Analytics
            </a>
            <button
              type="button"
              onClick={() => launchWorkspace('admin', 'overview')}
              className="hover:text-[#1F3F47] font-semibold transition-colors"
            >
              Admin Workspace
            </button>
            <span>© 2026 Brightloop Software Corp.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
