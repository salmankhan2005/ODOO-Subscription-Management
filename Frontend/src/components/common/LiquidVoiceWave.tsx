import React, { useEffect, useRef } from 'react';

interface LiquidVoiceWaveProps {
  className?: string;
  audioLevel?: number; // 0 to 100
  timeDomainData?: Uint8Array | null;
  frequencyData?: Uint8Array | null;
  isSpeaking?: boolean; // AI agent speaking
  isListening?: boolean; // User mic active and listening
  isConnected?: boolean;
  voiceName?: string;
  interimTranscript?: string;
}

export const LiquidVoiceWave: React.FC<LiquidVoiceWaveProps> = ({
  className = '',
  audioLevel = 0,
  timeDomainData = null,
  frequencyData = null,
  isSpeaking = false,
  isListening = false,
  isConnected = true,
  voiceName = 'Deepgram Cora (LiveKit)',
  interimTranscript = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Smooth interpolated physics states
  const physicsRef = useRef({
    smoothedLevel: 0,
    phase1: 0,
    phase2: 0,
    phase3: 0,
    phase4: 0,
    bubbles: [] as Array<{
      x: number;
      y: number;
      vy: number;
      vx: number;
      radius: number;
      alpha: number;
      maxLife: number;
      life: number;
    }>,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      if (!canvas || !ctx) return;

      const p = physicsRef.current;

      // Calculate instantaneous target energy
      let targetEnergy = 0;
      if (isConnected) {
        if (isSpeaking) {
          // Agent speaking rhythmic cadence
          const t = performance.now() * 0.006;
          targetEnergy = 45 + Math.sin(t * 1.8) * 22 + Math.cos(t * 3.1) * 14;
        } else if (isListening) {
          // Real user audio level from mic analyser
          if (timeDomainData && timeDomainData.length > 0) {
            let sum = 0;
            for (let i = 0; i < timeDomainData.length; i++) {
              const diff = (timeDomainData[i] - 128) / 128;
              sum += diff * diff;
            }
            const rms = Math.sqrt(sum / timeDomainData.length);
            targetEnergy = Math.min(100, rms * 280);
          } else {
            targetEnergy = Math.max(0, Math.min(100, audioLevel));
          }
        } else {
          targetEnergy = 8; // Idle gentle murmur
        }
      } else {
        targetEnergy = 3; // Disconnected waterline
      }

      // Viscous spring lerp for fluid liquid elasticity
      p.smoothedLevel += (targetEnergy - p.smoothedLevel) * 0.14;
      const normLevel = Math.max(0.04, p.smoothedLevel / 100);

      // Phase progression
      p.phase1 += 0.024 + normLevel * 0.055;
      p.phase2 -= 0.018 + normLevel * 0.042;
      p.phase3 += 0.031 + normLevel * 0.068;
      p.phase4 -= 0.012 + normLevel * 0.025;

      // ── 1. Clear with Deep Obsidian / Pure Black Background ──────
      ctx.clearRect(0, 0, width, height);

      // Radial monochromatic gradient background
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.45,
        width * 0.05,
        width / 2,
        height * 0.6,
        width * 0.85
      );
      bgGrad.addColorStop(0, '#161618');
      bgGrad.addColorStop(0.5, '#0a0a0c');
      bgGrad.addColorStop(1, '#000000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle monochromatic grid lines for tactile precision
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      const gridGap = 24;
      for (let x = 0; x < width; x += gridGap) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridGap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Base waterline position
      const baseline = height * 0.58;

      // ── 2. Helper to Draw Fluid Wave Layer ────────────────────────
      const drawWaveLayer = (
        phase: number,
        freq: number,
        amp: number,
        fillGradient: CanvasGradient | string,
        strokeColor?: string,
        strokeWidth: number = 1.5,
        glowColor?: string
      ) => {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, baseline);

        const step = 4;
        const pts: Array<{ x: number; y: number }> = [];

        for (let x = 0; x <= width + step; x += step) {
          // Complex harmonic fluid equation
          const relX = x / width;
          const bell = Math.sin(relX * Math.PI); // Dampen edges, peak in center

          let freqBoost = 0;
          if (frequencyData && frequencyData.length > 0) {
            const binIdx = Math.floor(relX * (frequencyData.length * 0.4));
            freqBoost = ((frequencyData[binIdx] || 0) / 255) * 18 * bell;
          }

          const wave1 = Math.sin(x * freq + phase) * amp * (0.4 + 0.6 * bell);
          const wave2 = Math.cos(x * freq * 1.8 - phase * 0.7) * (amp * 0.45);
          const wave3 = Math.sin(x * freq * 0.5 + phase * 1.3) * (amp * 0.3);

          const y = baseline - (wave1 + wave2 + wave3 + freqBoost);
          pts.push({ x, y });
        }

        // Draw smooth bezier curves through points
        for (let i = 0; i < pts.length - 1; i++) {
          const xc = (pts[i].x + pts[i + 1].x) / 2;
          const yc = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
        }
        if (pts.length > 0) {
          const last = pts[pts.length - 1];
          ctx.lineTo(last.x, last.y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        ctx.fillStyle = fillGradient;
        ctx.fill();

        if (strokeColor) {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 0; i < pts.length - 1; i++) {
            const xc = (pts[i].x + pts[i + 1].x) / 2;
            const yc = (pts[i].y + pts[i + 1].y) / 2;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
          }
          if (pts.length > 0) {
            const last = pts[pts.length - 1];
            ctx.lineTo(last.x, last.y);
          }
          if (glowColor) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10;
          }
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.stroke();
        }

        ctx.restore();
      };

      // ── 3. Render Multi-Layer Liquid Monochrome Waves ─────────────

      // Layer 1: Deep Translucent Black/Charcoal Base Wave
      const grad1 = ctx.createLinearGradient(0, baseline - 40, 0, height);
      grad1.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      grad1.addColorStop(0.4, 'rgba(160, 160, 160, 0.04)');
      grad1.addColorStop(1, 'rgba(10, 10, 10, 0.9)');
      drawWaveLayer(p.phase4, 0.012, 10 + normLevel * 22, grad1);

      // Layer 2: Mid-Depth Silvery Fluid Wave
      const grad2 = ctx.createLinearGradient(0, baseline - 50, 0, height);
      grad2.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
      grad2.addColorStop(0.3, 'rgba(200, 200, 200, 0.08)');
      grad2.addColorStop(1, 'rgba(5, 5, 5, 0.8)');
      drawWaveLayer(p.phase2, 0.018, 14 + normLevel * 32, grad2, 'rgba(255, 255, 255, 0.25)', 1);

      // Layer 3: Dynamic Molten Silver Liquid Body
      const grad3 = ctx.createLinearGradient(0, baseline - 65, 0, height);
      grad3.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
      grad3.addColorStop(0.25, 'rgba(240, 240, 240, 0.2)');
      grad3.addColorStop(0.8, 'rgba(0, 0, 0, 0.92)');
      drawWaveLayer(p.phase3, 0.024, 18 + normLevel * 44, grad3, 'rgba(255, 255, 255, 0.5)', 1.5);

      // Layer 4: Primary Specular Liquid Mercury Wave (Top Crest)
      const grad4 = ctx.createLinearGradient(0, baseline - 80, 0, height);
      grad4.addColorStop(0, 'rgba(255, 255, 255, 0.88)');
      grad4.addColorStop(0.18, 'rgba(220, 220, 220, 0.48)');
      grad4.addColorStop(0.65, 'rgba(30, 30, 30, 0.9)');
      grad4.addColorStop(1, 'rgba(0, 0, 0, 0.98)');
      drawWaveLayer(
        p.phase1,
        0.032,
        22 + normLevel * 56,
        grad4,
        'rgba(255, 255, 255, 0.98)',
        2.2,
        'rgba(255, 255, 255, 0.85)'
      );

      // ── 4. Liquid Droplets / Effervescence Particles ───────────────
      if (normLevel > 0.15 && Math.random() < normLevel * 0.6) {
        p.bubbles.push({
          x: width * 0.2 + Math.random() * (width * 0.6),
          y: baseline + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -(1.5 + Math.random() * 2.5 * normLevel),
          radius: 1 + Math.random() * 2.5,
          alpha: 0.8,
          maxLife: 40 + Math.random() * 30,
          life: 0,
        });
      }

      for (let i = p.bubbles.length - 1; i >= 0; i--) {
        const b = p.bubbles[i];
        b.x += b.vx;
        b.y += b.vy;
        b.life++;
        const lifeFrac = b.life / b.maxLife;
        const currentAlpha = b.alpha * (1 - lifeFrac);

        if (lifeFrac >= 1 || b.y < 20) {
          p.bubbles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.restore();
      }

      // ── 5. Ambient Top Light Sheen ────────────────────────────────
      const sheenGrad = ctx.createLinearGradient(0, 0, 0, 35);
      sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sheenGrad;
      ctx.fillRect(0, 0, width, 35);

      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [isConnected, isSpeaking, isListening, audioLevel, timeDomainData, frequencyData]);

  return (
    <div className={`relative w-full overflow-hidden rounded-xl bg-black border border-white/10 ${className}`}>
      {/* Liquid Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full block"
        style={{ display: 'block', height: '100%', minHeight: '80px' }}
      />

      {/* Compact HUD — status + voice label */}
      <div className="absolute top-2 inset-x-2.5 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/15">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              !isConnected
                ? 'bg-neutral-600'
                : isSpeaking
                ? 'bg-white animate-pulse'
                : isListening
                ? 'bg-neutral-300'
                : 'bg-neutral-500'
            }`}
          />
          <span className="text-[9px] font-mono tracking-wider uppercase font-semibold text-neutral-300">
            {!isConnected ? 'Standby' : isSpeaking ? 'Speaking' : isListening ? 'Listening' : 'Idle'}
          </span>
        </div>
        <div className="bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10 text-[9px] font-mono text-neutral-400 truncate max-w-[120px]">
          {voiceName}
        </div>
      </div>

      {/* Interim transcript */}
      {interimTranscript && (
        <div className="absolute bottom-2 inset-x-2 pointer-events-none">
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-black/80 border border-white/20 text-[10px] font-mono text-neutral-300 max-w-full">
            <span className="h-1 w-1 rounded-full bg-white animate-ping shrink-0" />
            <span className="italic truncate">"{interimTranscript}"</span>
          </div>
        </div>
      )}
    </div>
  );
};

