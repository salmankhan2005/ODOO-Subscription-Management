import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, KeyRound, Sparkles } from 'lucide-react';

export const IsometricAuthCube: React.FC = () => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setRotation((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mx-auto mb-6 h-28 w-28 flex items-center justify-center pointer-events-none">
      {/* Ambient Glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/30 to-cyan-500/30 blur-xl animate-pulse" />

      {/* 3D Isometric Cube Container */}
      <div
        className="relative transition-transform duration-100"
        style={{
          transform: `rotateX(60deg) rotateZ(-45deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Shadow Ring */}
        <div
          className="absolute -inset-4 rounded-full border border-indigo-500/20"
          style={{ transform: 'translateZ(-20px)' }}
        />

        {/* Outer Orbit */}
        <div
          className="h-20 w-20 rounded-full border border-dashed border-indigo-400/50 flex items-center justify-center"
          style={{ transform: `rotateZ(${rotation * 1.5}deg)` }}
        >
          <div
            className="absolute top-0 p-1 rounded-full bg-indigo-600 shadow-md shadow-indigo-500"
            style={{ transform: `rotateZ(-${rotation * 1.5}deg)` }}
          >
            <KeyRound className="w-2.5 h-2.5 text-white" />
          </div>
        </div>

        {/* Central Core Monolith */}
        <div
          className="absolute inset-3 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-cyan-600 border border-white/40 shadow-xl flex items-center justify-center"
          style={{
            transform: 'translateZ(25px)',
            boxShadow: '0 15px 30px -5px rgba(99, 102, 241, 0.6)',
          }}
        >
          <Lock className="w-4 h-4 text-white drop-shadow" />
        </div>
      </div>
    </div>
  );
};

