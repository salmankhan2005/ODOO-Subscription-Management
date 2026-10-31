import React, { useState } from 'react';
import { BentoCard } from '../common/BentoCard';
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Layers,
  Repeat,
  Receipt,
  Users,
  Radio,
  Sliders,
  DollarSign,
  TrendingUp,
  Cpu,
  Server,
  HelpCircle,
  Check,
  X as XIcon,
  PhoneCall
} from 'lucide-react';
import { UserRole } from '../../types';
import { IsometricDotGrid } from './IsometricDotGrid';
import { IsometricSubscriptionEngine } from './IsometricSubscriptionEngine';
import { IsometricInvoicePipeline } from './IsometricInvoicePipeline';
import { IsometricDunningVault } from './IsometricDunningVault';

interface ShowcaseLandingProps {
  onLaunch: (role: UserRole) => void;
}

export const ShowcaseLanding: React.FC<ShowcaseLandingProps> = ({ onLaunch }) => {
  // Interactive Variant Pricing Calculator State
  const [selectedVariant, setSelectedVariant] = useState<'std' | 'odoo' | 'ent'>('odoo');
  const [includeDunning, setIncludeDunning] = useState(true);
  const [includeSla, setIncludeSla] = useState(false);
  const [seats, setSeats] = useState(5);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  // Interactive Dunning Simulator State
  const [simState, setSimState] = useState<'idle' | 'running' | 'recovered'>('idle');

  // ROI Simulator State
  const [roiSubscribers, setRoiSubscribers] = useState(240);
  const [roiBasePrice, setRoiBasePrice] = useState(1200);
  const [roiIncludeOdoo, setRoiIncludeOdoo] = useState(true);
  const [roiDunningRate, setRoiDunningRate] = useState(92);

  // Active Isometric View Tab
  const [activeIsoTab, setActiveIsoTab] = useState<'all' | 'recurring' | 'pipeline' | 'dunning'>('all');

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Calculate pricing live
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

  // ROI Calculations
  const effectivePerSub = roiBasePrice + (roiIncludeOdoo ? 560 : 0);
  const totalMonthlyRev = roiSubscribers * effectivePerSub;
  const totalAnnualRev = totalMonthlyRev * 12;
  const annualSavedDunning = Math.round((totalMonthlyRev * 0.08 * (roiDunningRate / 100)) * 12);
  const adminHoursSaved = Math.round(roiSubscribers * 0.75);

  const runDunningSimulation = () => {
    setSimState('running');
    setTimeout(() => {
      setSimState('recovered');
    }, 1800);
  };

  const faqs = [
    {
      q: 'How does the +$560 Odoo Variant Adder work?',
      a: 'The Odoo variant calculates automatically during quote creation or plan assignment. It appends the $560 monthly add-on fee to software base prices, auto-provisions two-way journal sync, and flags invoices for ERP reconciliation.',
    },
    {
      q: 'How does the LiveKit AI Voice Agent support customers?',
      a: 'Customers can tap the fixed AI Voice button in their portal. Powered by WebRTC via LiveKit Cloud (wss://oddoo-hackathon-ulmfmcmg.livekit.cloud), the voice agent answers questions about plan statuses, outstanding invoice balances, and billing schedules in real time.',
    },
    {
      q: 'How are statutory GST and VAT taxes calculated?',
      a: 'Brightloop evaluates jurisdiction rules dynamically on quotation lines and recurring billing items. Products mapped to 18% GST have their statutory tax amounts segregated and itemized in generated PDF invoices.',
    },
    {
      q: 'Can staff and sales representatives convert quotes to subscriptions?',
      a: 'Yes. Sales teams generate proposals from pre-configured templates. Once confirmed by the customer, a single click converts the quotation into an active subscription and queues the initial settlement invoice.',
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 pb-24 overflow-x-hidden">
      {/* ── Background Isometric Dot Grid ───────────────────────────── */}
      <IsometricDotGrid />

      {/* Atmospheric Ambient Glows */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-indigo-600/15 blur-[140px] rounded-full" />
      <div className="pointer-events-none absolute top-1/3 right-10 w-[450px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full" />

      {/* ── Hero Section ────────────────────────────────────────────── */}
      <section className="relative pt-16 md:pt-24 pb-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-xs font-semibold text-indigo-300 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Brightloop Software · Recurly-Grade Recurring Billing</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight font-display text-balance leading-tight">
            Autonomous Subscription Billing & Revenue Recovery
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed text-balance">
            Inspired by Recurly and built for modern enterprises. Replace spreadsheet chaos with
            automated quote-to-cash workflows, dynamic Odoo variant pricing, and an integrated
            LiveKit AI voice support agent.
          </p>

          {/* Quick Portal Launch Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onLaunch('admin')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-xl shadow-indigo-600/30 active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Launch Admin Console</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <button
              onClick={() => onLaunch('staff')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-sm transition-all shadow-lg active:scale-95"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Staff / Sales View</span>
            </button>
            <button
              onClick={() => onLaunch('customer')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-sm transition-all shadow-lg active:scale-95"
            >
              <Repeat className="w-4 h-4 text-amber-400" />
              <span>Customer Self-Service</span>
            </button>
          </div>
        </div>

        {/* ── Realtime System Telemetry & SLA Strip ────────────────── */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-white">99.99% SLA</div>
              <div className="text-[10px] text-slate-400">Continuous Uptime</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-white">&lt; 120ms Latency</div>
              <div className="text-[10px] text-slate-400">JWT Token Validation</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-white">LiveKit Cloud</div>
              <div className="text-[10px] text-slate-400">WebRTC Voice Bridge</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-white">+$560 Adder</div>
              <div className="text-[10px] text-slate-400">Odoo Variant Sync</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3D Isometric Animation Section ──────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/70 border border-indigo-700/50 text-indigo-300">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Interactive 3D Isometric Engines</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Triple Autonomous Execution Architectures
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time visual telemetry representing Brightloop's three core computational pipelines.
          </p>

          {/* View Filter Pill */}
          <div className="pt-2 flex items-center justify-center gap-1.5">
            <button
              onClick={() => setActiveIsoTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition ${
                activeIsoTab === 'all'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              All Engines
            </button>
            <button
              onClick={() => setActiveIsoTab('recurring')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition ${
                activeIsoTab === 'recurring'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              1. Ledger Stack
            </button>
            <button
              onClick={() => setActiveIsoTab('pipeline')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition ${
                activeIsoTab === 'pipeline'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              2. Invoice Pipeline
            </button>
            <button
              onClick={() => setActiveIsoTab('dunning')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition ${
                activeIsoTab === 'dunning'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              3. Dunning Vault
            </button>
          </div>
        </div>

        {/* 3D Isometric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(activeIsoTab === 'all' || activeIsoTab === 'recurring') && (
            <div className={activeIsoTab !== 'all' ? 'md:col-span-3 max-w-xl mx-auto w-full' : ''}>
              <IsometricSubscriptionEngine />
            </div>
          )}
          {(activeIsoTab === 'all' || activeIsoTab === 'pipeline') && (
            <div className={activeIsoTab !== 'all' ? 'md:col-span-3 max-w-xl mx-auto w-full' : ''}>
              <IsometricInvoicePipeline />
            </div>
          )}
          {(activeIsoTab === 'all' || activeIsoTab === 'dunning') && (
            <div className={activeIsoTab !== 'all' ? 'md:col-span-3 max-w-xl mx-auto w-full' : ''}>
              <IsometricDunningVault />
            </div>
          )}
        </div>
      </section>

      {/* ── Interactive ROI & Revenue Margin Simulator ─────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <BentoCard glow className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold font-mono">
                Interactive Economics Engine
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                Subscription ROI & Revenue Acceleration Calculator
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Model real recurring yields with Odoo adders, statutory tax modeling, and AI dunning recovery.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                LIVE SIMULATOR
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
            {/* Controls */}
            <div className="lg:col-span-7 space-y-6">
              {/* Slider 1: Subscriber Count */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                  <span>Active Subscribers</span>
                  <span className="font-mono text-indigo-400 font-bold">{roiSubscribers} Accounts</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="1000"
                  step="10"
                  value={roiSubscribers}
                  onChange={(e) => setRoiSubscribers(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider 2: Base Subscription Tier */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                  <span>Base Subscription Price ($/mo)</span>
                  <span className="font-mono text-cyan-400 font-bold">${roiBasePrice}/mo</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="3000"
                  step="50"
                  value={roiBasePrice}
                  onChange={(e) => setRoiBasePrice(Number(e.target.value))}
                  className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Toggle 3: Odoo Edition Adder */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Odoo Edition Variant Adder (+ $560/mo)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      CHALLENGE SPEC
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Includes automatic 2-way journal synchronization and ERP ledger reconciliation.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRoiIncludeOdoo(!roiIncludeOdoo)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    roiIncludeOdoo ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      roiIncludeOdoo ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Slider 4: Dunning Recovery Rate */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                  <span>AI Dunning Neural Recovery Rate</span>
                  <span className="font-mono text-emerald-400 font-bold">{roiDunningRate}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="99"
                  step="1"
                  value={roiDunningRate}
                  onChange={(e) => setRoiDunningRate(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Results Bento Metrics */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/40 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-mono">
                  Projected Financial Yield
                </span>

                <div>
                  <div className="text-xs text-slate-400">Monthly Recurring Revenue (MRR)</div>
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white mt-1">
                    ${totalMonthlyRev.toLocaleString()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                  <div>
                    <div className="text-[11px] text-slate-400">Annual Run-Rate (ARR)</div>
                    <div className="text-lg font-bold font-mono text-indigo-400 mt-0.5">
                      ${(totalAnnualRev / 1000000).toFixed(2)}M
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Recovered from Churn</div>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                      +${annualSavedDunning.toLocaleString()}/yr
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saves approximately <strong>{adminHoursSaved} manual admin hours</strong> each year.</span>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => onLaunch('admin')}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  <span>Deploy Pricing to Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </BentoCard>
      </section>

      {/* ── Enterprise Comparison Matrix ────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Brightloop vs Traditional ERP Billing
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Why modern enterprises choose autonomous quote-to-cash over legacy spreadsheet manual operations.
          </p>
        </div>

        <BentoCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Capability</th>
                  <th className="px-6 py-4 font-semibold text-indigo-400">Brightloop SMS</th>
                  <th className="px-6 py-4 font-semibold text-slate-400">Legacy ERP / Spreadsheets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-medium text-white">
                    Automated Recurring Execution
                    <div className="text-[11px] text-slate-400">Daily cron dispatcher with auto-invoice creation</div>
                  </td>
                  <td className="px-6 py-4 font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> 100% Autonomous (0 min)
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-400">
                    Manual batch runs (3-5 days/mo)
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-medium text-white">
                    Dynamic Variant Pricing (+560 Adder)
                    <div className="text-[11px] text-slate-400">Odoo edition adders applied with real-time margins</div>
                  </td>
                  <td className="px-6 py-4 font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Native Catalog Rules
                  </td>
                  <td className="px-6 py-4 font-mono text-rose-400 flex items-center gap-1.5">
                    <XIcon className="w-4 h-4" /> Hardcoded Excel formulas
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-medium text-white">
                    LiveKit Real-time Voice Support
                    <div className="text-[11px] text-slate-400">WebRTC voice agent for instant customer billing help</div>
                  </td>
                  <td className="px-6 py-4 font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Built-in LiveKit Cloud
                  </td>
                  <td className="px-6 py-4 font-mono text-rose-400 flex items-center gap-1.5">
                    <XIcon className="w-4 h-4" /> None / Separate ticketing
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-medium text-white">
                    AI Dunning Recovery Pipeline
                    <div className="text-[11px] text-slate-400">Adaptive retry cascading across Stripe, Wire, and UPI</div>
                  </td>
                  <td className="px-6 py-4 font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> 99.2% Recovery
                  </td>
                  <td className="px-6 py-4 font-mono text-rose-400 flex items-center gap-1.5">
                    <XIcon className="w-4 h-4" /> Manual collections chasing
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </BentoCard>
      </section>

      {/* ── Interactive FAQ Section ─────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-8 space-y-1">
          <h2 className="text-2xl font-bold text-white">Frequently Answered Questions</h2>
          <p className="text-xs text-slate-400">Everything you need to know about the Brightloop billing architecture.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div
              key={i}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between font-semibold text-xs text-white">
                <span>{f.q}</span>
                <span className="text-indigo-400 text-sm font-mono">{openFaq === i ? '−' : '+'}</span>
              </div>
              {openFaq === i && (
                <div className="mt-2.5 text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom Call To Action ───────────────────────────────────── */}
      <section className="mt-12 px-4 max-w-5xl mx-auto text-center">
        <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/40 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Ready to automate recurring billing with Recurly-grade speed?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Sign in with your admin, staff, or customer account to explore the fully functional application.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => onLaunch('admin')}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/40 transition active:scale-95"
              >
                Open Admin Portal
              </button>
              <button
                onClick={() => onLaunch('customer')}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition active:scale-95 border border-slate-700"
              >
                Customer Portal & LiveKit Voice
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
