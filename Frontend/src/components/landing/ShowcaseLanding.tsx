import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  Users
} from 'lucide-react';

export const ShowcaseLanding: React.FC = () => {
  const { setAppMode, switchRole } = useAuth();

  // Interactive Variant Pricing Calculator State
  const [selectedVariant, setSelectedVariant] = useState<'std' | 'odoo' | 'ent'>('odoo');
  const [includeDunning, setIncludeDunning] = useState(true);
  const [includeSla, setIncludeSla] = useState(false);
  const [seats, setSeats] = useState(5);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  // Interactive Dunning Simulator State
  const [simState, setSimState] = useState<'idle' | 'running' | 'recovered'>('idle');

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

  const runDunningSimulation = () => {
    setSimState('running');
    setTimeout(() => {
      setSimState('recovered');
    }, 1800);
  };

  const launchWithRole = (role: 'admin' | 'staff' | 'customer') => {
    switchRole(role);
    setAppMode('workspace');
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 pb-24">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Ambient atmospheric glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[250px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-xs font-semibold text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Brightloop Software · Enterprise Recurring Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight font-display text-balance">
            Autonomous Subscription Billing & Revenue Recovery
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed text-balance">
            Inspired by Recurly and engineered for modern enterprises. Replace spreadsheet chaos with
            automated quote-to-cash workflows, dynamic variant pricing, and AI dunning recovery.
          </p>

          {/* Quick Launch Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => launchWithRole('admin')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Launch Admin Console</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <button
              onClick={() => launchWithRole('staff')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-sm transition-all"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Staff / Sales View</span>
            </button>
            <button
              onClick={() => launchWithRole('customer')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-sm transition-all"
            >
              <Repeat className="w-4 h-4 text-amber-400" />
              <span>Customer Self-Service</span>
            </button>
          </div>
        </div>

        {/* Bento Grid Showcase */}
        <div id="bento-overview" className="mt-14 grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Card 1: Real-time MRR & ARR Health */}
          <BentoCard glow className="md:col-span-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Live Recurring Telemetry
                </span>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  +18.4% QoQ Growth
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-slate-400">Monthly Recurring (MRR)</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-1">
                    $94,820
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">· 42 active contracts</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Annual Run-Rate (ARR)</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-indigo-400 mt-1">
                    $1.13M
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">· 100% automated cadence</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Collection Rate</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 mt-1">
                    99.2%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">· Automated tax & invoices</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Churn Risk Intercept</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-400 mt-1">
                    0.8%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">· Neural retry recovery</div>
                </div>
              </div>
            </div>

            {/* Simulated mini chart bar */}
            <div className="mt-6 pt-4 border-t border-slate-800/60">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Monthly Billing Pipeline Capacity</span>
                <span className="font-mono text-slate-300">Next batch: 12 days</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                <div className="w-[68%] bg-indigo-500 rounded-full" />
                <div className="w-[24%] bg-cyan-400 rounded-full" />
                <div className="w-[8%] bg-emerald-400 rounded-full" />
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" /> Business Software
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" /> Dunning Engine
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Concierge SLA
                </span>
              </div>
            </div>
          </BentoCard>

          {/* Card 2: Interactive Dunning Recovery */}
          <BentoCard glow id="dunning-engine" className="md:col-span-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">AI Dunning Orchestrator</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Recovers failed card charges before they escalate to involuntary churn.
              </p>

              <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Target Invoice</span>
                  <span className="font-mono text-slate-200">INV-2026-1050 ($1,760)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Customer</span>
                  <span className="text-slate-200 font-medium">Marcus Chen (Nexus Cloud)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Engine Status</span>
                  {simState === 'idle' && (
                    <span className="text-amber-400 font-mono text-[11px]">Soft Limit Declined</span>
                  )}
                  {simState === 'running' && (
                    <span className="text-cyan-400 font-mono text-[11px] flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Retrying via Rail 2...
                    </span>
                  )}
                  {simState === 'recovered' && (
                    <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Recovered ($1,760 Paid)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={runDunningSimulation}
                disabled={simState === 'running'}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {simState === 'running' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Fallback Rail...</span>
                  </>
                ) : simState === 'recovered' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Run Another Simulation</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Trigger Smart Dunning Retry</span>
                  </>
                )}
              </button>
            </div>
          </BentoCard>

          {/* Card 3: Interactive Variant Calculator */}
          <BentoCard id="interactive-calculator" className="md:col-span-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800/80 mb-6 gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">
                  Odoo Challenge Core Requirement
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                  Interactive Product & Variant Pricing Engine
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Brightloop admin configures base software and variant markups (e.g. Odoo brand edition adds +$560).
                </p>
              </div>

              {/* Cadence selector */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 self-start md:self-auto">
                <button
                  onClick={() => setBillingInterval('monthly')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    billingInterval === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Monthly Cadence
                </button>
                <button
                  onClick={() => setBillingInterval('yearly')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    billingInterval === 'yearly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Yearly Cadence (15% Off)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Controls */}
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">
                    1. Select Product Variant (Brand Edition)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setSelectedVariant('std')}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        selectedVariant === 'std'
                          ? 'bg-indigo-600/15 border-indigo-500 text-white'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold">Standard Edition</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Base $1,200/mo</div>
                    </button>
                    <button
                      onClick={() => setSelectedVariant('odoo')}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        selectedVariant === 'odoo'
                          ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Odoo Brand</span>
                        <span className="text-[10px] font-mono text-indigo-400 font-semibold">+560</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">$1,760/mo/instance</div>
                    </button>
                    <button
                      onClick={() => setSelectedVariant('ent')}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        selectedVariant === 'ent'
                          ? 'bg-indigo-600/15 border-indigo-500 text-white'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Enterprise</span>
                        <span className="text-[10px] font-mono text-indigo-400 font-semibold">+1,450</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">$2,650/mo/instance</div>
                    </button>
                  </div>
                </div>

                {/* Seat Quantity */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>2. Number of Provisioned Seats</span>
                    <span className="font-mono text-indigo-400 font-bold">{seats} Seats</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>1</span>
                    <span>10</span>
                    <span>25</span>
                    <span>50 Seats</span>
                  </div>
                </div>

                {/* Optional Modular Add-ons */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">
                    3. Modular Subscription Add-Ons
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={includeDunning}
                          onChange={(e) => setIncludeDunning(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-200">
                            Automated AI Dunning & Payment Recovery
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Neural retry scheduling & smart grace periods
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-slate-300">+$380/mo</span>
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={includeSla}
                          onChange={(e) => setIncludeSla(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-200">
                            Priority SLA & Dedicated Concierge Support
                          </div>
                          <div className="text-[11px] text-slate-400">
                            15-minute response guarantee + dedicated engineer
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-slate-300">+$650/mo</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Live Preview Summary Card */}
              <div className="lg:col-span-5 p-5 rounded-2xl bg-gradient-to-b from-[#161F30] to-[#0E1524] border border-slate-700/80 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Live Calculation Breakdown
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">Automated 18% Tax</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>
                      Software Base + {selectedVariant === 'odoo' ? 'Odoo Brand' : selectedVariant === 'ent' ? 'Enterprise' : 'Standard'}
                    </span>
                    <span className="font-mono text-slate-200">${unitPrice} × {seats}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Base Subtotal</span>
                    <span className="font-mono">${softwareSubtotal.toLocaleString()}</span>
                  </div>

                  {addOnSubtotal > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Add-ons Total</span>
                      <span className="font-mono">+${addOnSubtotal.toLocaleString()}</span>
                    </div>
                  )}

                  {billingInterval === 'yearly' && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Yearly Contract Incentive</span>
                      <span className="font-mono">-15%</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                    <span>Tax (18% Statutory GST/VAT)</span>
                    <span className="font-mono">+${taxAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700 flex items-baseline justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Total Billed ({billingInterval})</div>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white mt-0.5">
                      ${finalTotal.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">Net 30 Days Terms</span>
                </div>

                <button
                  onClick={() => launchWithRole('admin')}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  <span>Build Quote in Application</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </BentoCard>

          {/* Card 4: Quote to Cash Workflow */}
          <BentoCard id="quote-to-cash" className="md:col-span-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400">
                <Receipt className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Quote-to-Subscription Pipeline</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Sales reps construct proposals from pre-approved templates. When customers accept,
              one click converts quotes into active subscriptions with scheduled invoices.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-[10px] font-bold">1</span>
                <span className="text-slate-300 font-medium">Select Quotation Template & Add Products</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-[10px] font-bold">2</span>
                <span className="text-slate-300 font-medium">System applies automatic tax rules & discounts</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-mono text-[10px] font-bold">3</span>
                <span className="text-white font-semibold">1-Click Convert $\to$ Auto-generates Subscription & Invoice</span>
              </div>
            </div>
          </BentoCard>

          {/* Card 5: Finance Lead Month-End Speed */}
          <BentoCard className="md:col-span-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Sub-2-Second Finance Lead Reporting</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              The Odoo challenge highlighted that finance leads wait days for spreadsheet reports.
              Brightloop provides instant sub-second aggregates for MRR, ARR, and overdue collections.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-xl font-bold font-mono text-emerald-400">&lt; 180ms</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Average Page Query Time</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-xl font-bold font-mono text-indigo-400">0 Spreadsheets</div>
                <div className="text-[11px] text-slate-400 mt-0.5">100% Unified Cloud Core</div>
              </div>
            </div>
          </BentoCard>
        </div>
      </section>
    </div>
  );
};
