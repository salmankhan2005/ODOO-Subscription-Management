import React, { useState, useEffect } from 'react';
import { FileText, ArrowRight, CheckCircle2, ShieldCheck, DollarSign, Receipt } from 'lucide-react';

export const IsometricInvoicePipeline: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const stages = [
    { title: 'Quotation Accepted', desc: 'Customer e-signed proposal', tag: 'INPUT', color: 'from-blue-600 to-indigo-600' },
    { title: 'Tax & Discount Rules', desc: '18% GST + ENTERPRISE15 applied', tag: 'CALC', color: 'from-indigo-600 to-purple-600' },
    { title: 'Invoice Generated', desc: 'INV-2026-0042 PDF stamped', tag: 'DISPATCH', color: 'from-purple-600 to-pink-600' },
    { title: 'Ledger Reconciled', desc: 'Direct deposit matched in ERP', tag: 'SETTLED', color: 'from-emerald-600 to-teal-600' },
  ];

  return (
    <div className="relative w-full h-[360px] flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-purple-500/30 p-6 shadow-2xl">
      {/* 3D Isometric Projection Stage */}
      <div
        className="relative transition-transform duration-700 ease-out"
        style={{
          transform: 'rotateX(58deg) rotateZ(-38deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Conveyor Track Base */}
        <div
          className="w-[320px] h-32 rounded-2xl bg-slate-900/95 border-2 border-slate-700 shadow-2xl relative overflow-hidden"
          style={{ transform: 'translateZ(0px)' }}
        >
          {/* Animated Conveyor Strips */}
          <div className="absolute inset-0 flex items-center justify-between px-4 opacity-40">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-full bg-gradient-to-b from-transparent via-purple-500 to-transparent animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>

          <div className="absolute bottom-2 left-4 text-[9px] font-mono text-purple-300 uppercase tracking-widest">
            Pipeline Highway · Stream: 48.2 req/sec
          </div>
        </div>

        {/* 3D Moving Document / Invoice Block */}
        <div
          className="absolute top-2 w-48 h-28 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-400 p-3 shadow-2xl transition-all duration-700 flex flex-col justify-between"
          style={{
            transform: `translate3d(${step * 35}px, 0px, ${30 + Math.sin(step) * 5}px)`,
            boxShadow: '0 20px 40px -10px rgba(168, 85, 247, 0.5)',
          }}
        >
          <div className="flex items-center justify-between border-b border-purple-500/40 pb-1.5">
            <div className="flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[10px] font-mono font-bold text-white">INV-2026-0042</span>
            </div>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
              {stages[step].tag}
            </span>
          </div>

          <div>
            <div className="text-[10px] text-purple-200 font-semibold">{stages[step].title}</div>
            <div className="text-[9px] text-slate-400 font-mono truncate">{stages[step].desc}</div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono pt-1 border-t border-slate-700">
            <span className="text-slate-400">Total Settled:</span>
            <span className="text-emerald-400 font-bold">$1,416.00</span>
          </div>
        </div>

        {/* Validation Gate Pillars */}
        <div
          className="absolute -top-4 left-24 w-8 h-40 rounded-lg bg-gradient-to-t from-purple-900 to-indigo-600/60 border border-purple-300 shadow-lg pointer-events-none opacity-80"
          style={{ transform: 'rotateY(90deg) translateZ(10px)' }}
        />
        <div
          className="absolute -top-4 right-16 w-8 h-40 rounded-lg bg-gradient-to-t from-purple-900 to-cyan-600/60 border border-cyan-300 shadow-lg pointer-events-none opacity-80"
          style={{ transform: 'rotateY(90deg) translateZ(10px)' }}
        />
      </div>

      {/* Floating Header Badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-purple-500/40 backdrop-blur-md shadow-lg">
        <Receipt className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-xs font-semibold text-white">Automated Invoicing Pipeline</span>
      </div>

      {/* Timeline Step Indicators */}
      <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-center gap-2">
        {stages.map((stg, i) => (
          <div
            key={i}
            onClick={() => setStep(i)}
            className={`cursor-pointer px-2.5 py-1 rounded-lg text-[9px] font-mono border transition ${
              step === i
                ? 'bg-purple-600 border-purple-400 text-white font-bold shadow-md shadow-purple-600/40'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            0{i + 1} {stg.tag}
          </div>
        ))}
      </div>
    </div>
  );
};

