import React, { useState, useEffect } from 'react';
import { Repeat, Sparkles, CheckCircle2, TrendingUp, Cpu } from 'lucide-react';

export const IsometricSubscriptionEngine: React.FC = () => {
  const [pulseIndex, setPulseIndex] = useState(0);
  const [activeTier, setActiveTier] = useState<'base' | 'odoo' | 'enterprise'>('odoo');

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % 4);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[360px] flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-indigo-500/30 p-6 shadow-2xl">
      {/* 3D Isometric Projection Stage */}
      <div
        className="relative transition-transform duration-700 ease-out"
        style={{
          transform: 'rotateX(55deg) rotateZ(-45deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Shadow Plane */}
        <div
          className="absolute -inset-10 rounded-3xl bg-indigo-600/15 blur-2xl pointer-events-none"
          style={{ transform: 'translateZ(-60px)' }}
        />

        {/* Layer 1: Base Platform (Subscription Ledger Foundation) */}
        <div
          className="w-56 h-56 rounded-2xl bg-slate-900/90 border-2 border-slate-700/80 shadow-2xl flex flex-col justify-between p-4 transition-all duration-500"
          style={{
            transform: 'translateZ(0px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
              Ledger Foundation
            </span>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-mono text-emerald-400">ACTIVE</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] text-slate-400 font-mono">Base Software Core</div>
            <div className="text-xl font-extrabold font-mono text-white">$1,200/mo</div>
          </div>

          {/* Grid lines on platform */}
          <div className="grid grid-cols-4 gap-1.5 opacity-30 pt-2 border-t border-slate-700">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-1 bg-indigo-500 rounded-full" />
            ))}
          </div>
        </div>

        {/* Layer 2: Dynamic Add-on Tier (Odoo Variant +$560 Adder) */}
        <div
          className={`absolute inset-0 rounded-2xl border-2 transition-all duration-500 flex flex-col justify-between p-4 ${
            activeTier === 'odoo'
              ? 'bg-gradient-to-br from-indigo-950/90 via-indigo-900/80 to-purple-950/90 border-indigo-400 shadow-xl shadow-indigo-500/30'
              : 'bg-slate-800/80 border-slate-600'
          }`}
          style={{
            transform: 'translateZ(45px)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
              +560 ODOO ADDER
            </span>
            <span className="text-[10px] font-mono text-indigo-300 font-bold">STAGE 2</span>
          </div>

          <div className="space-y-0.5">
            <div className="text-[10px] text-indigo-200 uppercase tracking-wider font-semibold">
              ERP Journal Sync & Templates
            </div>
            <div className="text-lg font-black font-mono text-white flex items-baseline gap-1">
              <span>+$560</span>
              <span className="text-[10px] text-indigo-300 font-normal">/seat/mo</span>
            </div>
          </div>

          {/* Realtime Packet Flow Indicator */}
          <div className="flex items-center justify-between text-[9px] font-mono text-indigo-300 pt-1 border-t border-indigo-500/30">
            <span>Quota Auto-Provisioning</span>
            <span className="animate-pulse">● 100% Sync</span>
          </div>
        </div>

        {/* Layer 3: Top Floating Autonomous Dispatch Deck */}
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-950/80 via-slate-900/90 to-indigo-950/90 border-2 border-cyan-400/80 flex flex-col justify-between p-4 transition-all duration-700"
          style={{
            transform: `translateZ(${85 + Math.sin(pulseIndex) * 6}px)`,
            boxShadow: '0 20px 40px -15px rgba(6, 182, 212, 0.4)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-[10px] font-mono font-bold text-cyan-300">DISPATCH CORE</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-cyan-400/20 text-cyan-300 border border-cyan-400/40">
              CYCLE RUNNING
            </span>
          </div>

          <div>
            <div className="text-[10px] text-slate-300">Effective Recurring Price</div>
            <div className="text-2xl font-black font-mono text-white tracking-tight text-shadow">
              ${(1200 + 560).toLocaleString()}
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono text-cyan-200 pt-1 border-t border-cyan-500/30">
            <span>Next Invoice: Nov 1</span>
            <span className="text-emerald-400 font-bold">Auto-Renewed</span>
          </div>
        </div>
      </div>

      {/* Floating Spatial Badge Outside Projection */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-indigo-500/40 backdrop-blur-md shadow-lg">
        <Repeat className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '8s' }} />
        <span className="text-xs font-semibold text-white">Isometric Recurring Engine</span>
      </div>

      {/* Interactive Controls Pill */}
      <div className="absolute bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 z-20 flex items-center justify-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
        <button
          onClick={() => setActiveTier('base')}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition ${
            activeTier === 'base'
              ? 'bg-indigo-600 text-white font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Base Core
        </button>
        <button
          onClick={() => setActiveTier('odoo')}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition ${
            activeTier === 'odoo'
              ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          +560 Odoo
        </button>
      </div>
    </div>
  );
};

