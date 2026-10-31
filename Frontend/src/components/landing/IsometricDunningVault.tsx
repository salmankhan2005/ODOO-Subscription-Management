import React, { useState, useEffect } from 'react';
import { ShieldCheck, Zap, RefreshCw, Lock, DollarSign, Activity } from 'lucide-react';

export const IsometricDunningVault: React.FC = () => {
  const [rotation, setRotation] = useState(0);
  const [recoveredAmount, setRecoveredAmount] = useState(14850);

  useEffect(() => {
    const anim = setInterval(() => {
      setRotation((prev) => (prev + 1) % 360);
    }, 45);
    return () => clearInterval(anim);
  }, []);

  const triggerRecover = () => {
    setRecoveredAmount((prev) => prev + 1200);
  };

  return (
    <div className="relative w-full h-[360px] flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-emerald-500/30 p-6 shadow-2xl">
      {/* 3D Isometric Stage */}
      <div
        className="relative transition-transform duration-300"
        style={{
          transform: `rotateX(60deg) rotateZ(-45deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Pulsing Energy Ground Ring */}
        <div
          className="absolute -inset-14 rounded-full border-2 border-emerald-500/30 animate-ping opacity-30"
          style={{ transform: 'translateZ(-40px)' }}
        />

        {/* Outer Orbiting Data Ring */}
        <div
          className="w-64 h-64 rounded-full border-2 border-dashed border-emerald-400/40 relative flex items-center justify-center"
          style={{
            transform: `rotateZ(${rotation}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Orbiting Satellite Node 1: Smart Retry */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-900 border border-emerald-400 text-emerald-400 shadow-lg shadow-emerald-500/50"
            style={{ transform: 'rotateZ(-' + rotation + 'deg)' }}
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
          </div>

          {/* Orbiting Satellite Node 2: Security Token */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 p-2 rounded-xl bg-slate-900 border border-cyan-400 text-cyan-400 shadow-lg shadow-cyan-500/50"
            style={{ transform: 'rotateZ(-' + rotation + 'deg)' }}
          >
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Central 3D Vault Monolith */}
        <div
          className="absolute inset-8 rounded-2xl bg-gradient-to-tr from-slate-900 via-emerald-950/80 to-slate-900 border-2 border-emerald-400/80 shadow-2xl flex flex-col justify-between p-4"
          style={{
            transform: 'translateZ(50px)',
            boxShadow: '0 25px 50px -10px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          }}
        >
          <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-mono font-bold text-white">REVENUE VAULT</span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              99.2% RECOVERY
            </span>
          </div>

          <div className="my-1">
            <span className="text-[10px] text-slate-300 block font-mono">Dunning Recovered</span>
            <span className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
              ${recoveredAmount.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            <span>Adaptive Cascade:</span>
            <span className="text-white font-bold">Stripe · UPI · Wire</span>
          </div>
        </div>
      </div>

      {/* Floating Header Badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 backdrop-blur-md shadow-lg">
        <Activity className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-xs font-semibold text-white">AI Dunning & Recovery Vault</span>
      </div>

      {/* Interactive Trigger Button */}
      <button
        onClick={triggerRecover}
        className="absolute bottom-4 right-4 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
      >
        <Zap className="w-3 h-3 text-emerald-200" />
        <span>Simulate Auto-Recovery</span>
      </button>
    </div>
  );
};

