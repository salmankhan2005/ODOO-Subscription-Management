import React, { useEffect, useRef } from 'react';

export const IsometricDotGrid: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    let mouseX = width / 2;
    let mouseY = height / 2;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let t = 0;
    const spacing = 36;
    const cos30 = Math.cos(Math.PI / 6);
    const sin30 = Math.sin(Math.PI / 6);

    const render = () => {
      t += 0.022;
      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / (spacing * cos30 * 2)) + 6;
      const rows = Math.ceil(height / (spacing * sin30)) + 8;

      for (let r = -4; r < rows; r++) {
        for (let c = -4; c < cols; c++) {
          // Isometric projection
          const isoX = (c - r) * spacing * cos30 + width / 2;
          const isoY = (c + r) * spacing * sin30 * 0.65 + 40;

          if (isoX < -40 || isoX > width + 40 || isoY < -40 || isoY > height + 40) {
            continue;
          }

          // Undulating wave height
          const distToCenter = Math.hypot(isoX - width / 2, isoY - height / 2);
          const distToMouse = Math.hypot(isoX - mouseX, isoY - mouseY);
          const wave =
            Math.sin(c * 0.35 + t) * Math.cos(r * 0.35 + t * 0.8) * 8 +
            Math.sin(distToCenter * 0.015 - t * 1.5) * 6;

          const mouseEffect = Math.max(0, 1 - distToMouse / 220) * 14;
          const finalY = isoY - wave - mouseEffect;

          // Alpha & Size
          const baseAlpha = 0.12 + Math.sin(c * 0.2 + r * 0.2 + t) * 0.06;
          const mouseAlpha = Math.max(0, 1 - distToMouse / 200) * 0.45;
          const radius = 1.3 + Math.max(0, 1 - distToMouse / 200) * 1.8;

          ctx.beginPath();
          ctx.arc(isoX, finalY, radius, 0, Math.PI * 2);

          if (mouseAlpha > 0.1) {
            ctx.fillStyle = `rgba(129, 140, 248, ${Math.min(1, baseAlpha + mouseAlpha)})`;
          } else {
            ctx.fillStyle = `rgba(99, 102, 241, ${baseAlpha})`;
          }
          ctx.fill();

          // Isometric connecting subtle lines every 4th dot
          if ((c + r) % 5 === 0) {
            const nextX = (c + 1 - r) * spacing * cos30 + width / 2;
            const nextY = (c + 1 + r) * spacing * sin30 * 0.65 + 40 - wave;
            ctx.beginPath();
            ctx.moveTo(isoX, finalY);
            ctx.lineTo(nextX, nextY);
            ctx.strokeStyle = `rgba(99, 102, 241, ${baseAlpha * 0.4})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none opacity-80 ${className}`}
    />
  );
};

