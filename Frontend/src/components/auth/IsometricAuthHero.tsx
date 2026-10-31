import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Radio,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  Server
} from 'lucide-react';

export const IsometricAuthHero: React.FC = () => {
  const [rotation, setRotation] = useState(0);
  const [activeNode, setActiveNode] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Smooth rotation timer
  useEffect(() => {
    const timer = setInterval(() => {
      setRotation((prev) => (prev + 1) % 360);
    }, 45);
    return () => clearInterval(timer);
  }, []);

  // Node pulse sequencer
  useEffect(() => {
    const seq = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % 3);
    }, 2200);
    return () => clearInterval(seq);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full flex flex-col items-center justify-center p-4 sm:p-8 select-none"
    >
      {/* Ambient Radial Lighting Glows */}
      <div className="pointer-events-none absolute -top-10 -left-10 h-72 w-72 rounded-full bg-indigo-600/20 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-[90px]" />
      <div className="pointer-events-none absolute inset-x-12 top-1/2 h-48 -translate-y-1/2 rounded-full bg-purple-600/10 blur-[100px]" />

      {/* ── 3D Isometric Projection Stage ───────────────────────────── */}
      <div
        className="relative w-full max-w-[420px] h-[380px] sm:h-[420px] flex items-center justify-center transition-transform duration-300 ease-out"
        style={{
          perspective: '1200px',
        }}
      >
        <div
          className="relative transition-transform duration-300 ease-out"
          style={{
            transform: `rotateX(${56 + mousePos.y * 12}deg) rotateZ(${-45 + mousePos.x * 12}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Base Shadow Plane */}
          <div
            className="absolute -inset-16 rounded-full bg-indigo-950/60 blur-3xl pointer-events-none"
            style={{ transform: 'translateZ(-60px)' }}
          />

          {/* ── Layer 1: Foundation Mesh (Base Security Platform) ─────── */}
          <div
            className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl bg-slate-900/90 border-2 border-indigo-500/30 p-5 shadow-2xl flex flex-col justify-between transition-all"
            style={{
              transform: 'translateZ(0px)',
              boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 2px rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Platform Grid Mesh Lines */}
            <div className="absolute inset-4 grid grid-cols-6 grid-rows-6 gap-2 pointer-events-none opacity-25">
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className="border border-indigo-400/40 rounded-xs" />
              ))}
            </div>

            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-300 font-bold flex items-center gap-1.5">
                <Server className="w-3 h-3 text-indigo-400" />
                Identity Foundation
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                AES-256
              </span>
            </div>

            {/* Circuit Line Accents */}
            <div className="relative z-10 space-y-1.5">
              <div className="text-[10px] font-mono text-slate-400">Multi-Tenant Vault</div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-200">
                <span>Brightloop Core</span>
                <span className="text-cyan-400 font-bold">SHA-256 Signed</span>
              </div>
            </div>

            {/* Animated Laser Pulse Bar */}
            <div className="relative z-10 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-transparent via-cyan-400 to-indigo-500 rounded-full animate-pulse"
                style={{ width: '80%' }}
              />
            </div>
          </div>

          {/* ── Layer 2: Floating RBAC Partition Deck ─────────────────── */}
          <div
            className="absolute inset-4 rounded-2xl bg-gradient-to-br from-indigo-950/85 via-slate-900/90 to-purple-950/80 border-2 border-indigo-400/60 p-4 shadow-xl flex flex-col justify-between transition-all"
            style={{
              transform: 'translateZ(45px)',
              boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.4)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold tracking-widest text-cyan-300 uppercase flex items-center gap-1">
                <Layers className="w-3 h-3 text-cyan-400" />
                Role-Based Access
              </span>
              <span className="text-[9px] font-mono text-indigo-300 font-bold">3 TENANTS</span>
            </div>

            {/* 3 Active Role Nodes */}
            <div className="grid grid-cols-3 gap-2 py-2">
              {[
                { name: 'Admin', color: 'indigo', active: activeNode === 0 },
                { name: 'Staff', color: 'cyan', active: activeNode === 1 },
                { name: 'Customer', color: 'emerald', active: activeNode === 2 },
              ].map((node, i) => (
                <div
                  key={node.name}
                  className={`p-2 rounded-xl border text-center transition-all duration-300 ${
                    node.active
                      ? 'bg-white/15 border-white text-white shadow-lg scale-105'
                      : 'bg-black/40 border-white/10 text-slate-400'
                  }`}
                >
                  <div className="text-[9px] font-mono uppercase font-bold">{node.name}</div>
                  <div
                    className={`h-1 w-full mt-1.5 rounded-full ${
                      node.active ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'
                    }`}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono text-indigo-300 pt-1 border-t border-indigo-500/20">
              <span>Session Lifespan</span>
              <span className="text-white font-semibold">24h JWT Refresh</span>
            </div>
          </div>

          {/* ── Layer 3: Central Rotating Holographic Monolith ────────── */}
          <div
            className="absolute inset-10 rounded-2xl bg-gradient-to-tr from-cyan-600/90 via-indigo-600 to-purple-600 border-2 border-white/60 flex items-center justify-center p-4 transition-all"
            style={{
              transform: 'translateZ(90px)',
              boxShadow: '0 25px 50px -10px rgba(79, 70, 229, 0.7), inset 0 2px 4px rgba(255, 255, 255, 0.4)',
            }}
          >
            {/* Orbiting Security Key */}
            <div
              className="absolute -inset-4 rounded-full border border-dashed border-white/50 flex items-center justify-center"
              style={{ transform: `rotateZ(${rotation * 1.8}deg)` }}
            >
              <div
                className="absolute top-0 p-1.5 rounded-full bg-white text-indigo-900 shadow-md shadow-white/50"
                style={{ transform: `rotateZ(-${rotation * 1.8}deg)` }}
              >
                <KeyRound className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Central Security Shield */}
            <div className="relative flex flex-col items-center justify-center text-white">
              <ShieldCheck className="w-8 h-8 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] animate-pulse" />
              <span className="text-[9px] font-mono font-bold tracking-wider mt-1 uppercase text-cyan-100">
                Verified
              </span>
            </div>
          </div>

          {/* ── Layer 4: Top Floating Telemetry Pills ─────────────────── */}
          <div
            className="absolute -top-6 -right-6 px-3 py-1.5 rounded-xl bg-black/90 border border-white/30 backdrop-blur-md shadow-2xl flex items-center gap-2 pointer-events-none"
            style={{
              transform: 'translateZ(135px)',
            }}
          >
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono uppercase font-bold text-neutral-300">LiveKit Deepgram</span>
              <span className="text-[10px] font-semibold text-white">Cora (aura-2-cora-en)</span>
            </div>
          </div>

          <div
            className="absolute -bottom-4 -left-4 px-3 py-1.5 rounded-xl bg-black/90 border border-indigo-400/40 backdrop-blur-md shadow-2xl flex items-center gap-2 pointer-events-none"
            style={{
              transform: 'translateZ(125px)',
            }}
          >
            <Zap className="h-3 w-3 text-indigo-400" />
            <span className="text-[10px] font-mono text-indigo-200 font-semibold">+560 ODOO ADDER SYNC</span>
          </div>
        </div>
      </div>

      {/* ── Enterprise Cloud Feature Highlights ──────────────────────── */}
      <div className="mt-8 max-w-sm space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Next-Gen Subscription OS</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Spatial Autonomous Billing with LiveKit AI Voice
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Integrated with <span className="text-slate-200 font-medium">Deepgram Aura Cora (aura-2-cora-en)</span> for natural real-time customer support, automated quotation pipelines, and bidirectional Odoo ERP journal settlement.
        </p>

        {/* Feature Checkpoints */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span>Multi-Role Access Control</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span>LiveKit WebRTC Cloud</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span>Monochrome Liquid Waves</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span>Automated Dunning Vault</span>
          </div>
        </div>
      </div>
    </div>
  );
};

