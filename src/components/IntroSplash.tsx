import React, { useEffect, useState } from 'react';

interface IntroSplashProps {
  brandName?: string;
  skip?: boolean;
}

const CONSTELLATION_NODES = [
  { top: '16%', left: '18%', size: 'w-2 h-2', delay: '0.1s', color: 'bg-teal-300' },
  { top: '24%', right: '20%', size: 'w-2.5 h-2.5', delay: '0.45s', color: 'bg-sky-300' },
  { bottom: '28%', left: '22%', size: 'w-2 h-2', delay: '0.7s', color: 'bg-indigo-300' },
  { bottom: '22%', right: '24%', size: 'w-2.5 h-2.5', delay: '0.3s', color: 'bg-amber-300' },
  { top: '44%', left: '12%', size: 'w-1.5 h-1.5', delay: '0.6s', color: 'bg-cyan-200' },
  { top: '48%', right: '13%', size: 'w-1.5 h-1.5', delay: '0.85s', color: 'bg-teal-200' },
];

export const IntroSplash: React.FC<IntroSplashProps> = ({
  brandName = 'Hafiz Education',
  skip = false,
}) => {
  const [exiting, setExiting] = useState(false);
  const [done, setDone] = useState<boolean>(() => {
    if (skip) return true;
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('autostart') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (skip) {
      setDone(true);
      return;
    }
    if (done) return;
    const fadeTimer = window.setTimeout(() => {
      setExiting(true);
    }, 2600);

    const removeTimer = window.setTimeout(() => {
      setDone(true);
    }, 3150);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, [done, skip]);

  if (done || skip) return null;

  const handleSkip = () => {
    setExiting(true);
    window.setTimeout(() => setDone(true), 260);
  };

  return (
    <div
      id="hafiz-intro-splash"
      role="presentation"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden select-none transition-all duration-500 ease-out ${
        exiting ? 'opacity-0 scale-[1.04] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background:
          'radial-gradient(circle at 18% 20%, rgba(20, 184, 166, 0.28) 0%, transparent 48%), radial-gradient(circle at 82% 24%, rgba(56, 189, 248, 0.28) 0%, transparent 48%), radial-gradient(circle at 50% 85%, rgba(99, 102, 241, 0.3) 0%, transparent 54%), linear-gradient(150deg, #030712 0%, #071226 48%, #0b1636 100%)',
      }}
    >
      {/* Sweeping Aurora Light Beams */}
      <div
        aria-hidden="true"
        className="intro-beam-sweep pointer-events-none absolute -top-24 left-1/4 w-72 h-[140%] bg-gradient-to-b from-teal-400/20 via-sky-400/10 to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="intro-beam-sweep pointer-events-none absolute -bottom-24 right-1/4 w-80 h-[130%] bg-gradient-to-t from-indigo-500/25 via-cyan-400/10 to-transparent blur-3xl"
        style={{ animationDelay: '1.2s' }}
      />

      {/* Precision Frame Corners */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-5 sm:inset-8 border border-teal-400/15 rounded-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-5 left-5 sm:top-8 sm:left-8 w-9 h-9 border-t-2 border-l-2 border-teal-400/75 rounded-tl-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-5 right-5 sm:top-8 sm:right-8 w-9 h-9 border-t-2 border-r-2 border-sky-400/75 rounded-tr-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-5 left-5 sm:bottom-8 sm:left-8 w-9 h-9 border-b-2 border-l-2 border-indigo-400/75 rounded-bl-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-5 right-5 sm:bottom-8 sm:right-8 w-9 h-9 border-b-2 border-r-2 border-amber-300/75 rounded-br-2xl"
      />

      {/* Subtle Luminous Constellation Nodes */}
      {CONSTELLATION_NODES.map((node, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`absolute pointer-events-none rounded-full animate-pulse ${node.size} ${node.color} shadow-[0_0_16px_rgba(56,189,248,0.8)]`}
          style={{
            top: node.top,
            left: node.left,
            right: node.right,
            bottom: node.bottom,
            animationDelay: node.delay,
          }}
        />
      ))}

      {/* Centerpiece Luminous Logo Emblem */}
      <div className="relative flex items-center justify-center w-56 h-56 sm:w-64 sm:h-64">
        {/* Expanding Ripple Shockwave */}
        <div
          aria-hidden="true"
          className="intro-shockwave absolute inset-6 rounded-full border-2 border-teal-300/70"
        />
        <div
          aria-hidden="true"
          className="intro-shockwave absolute inset-8 rounded-full border border-sky-300/50"
          style={{ animationDelay: '0.55s' }}
        />

        {/* Outer Precision Orbital Ring */}
        <div
          aria-hidden="true"
          className="intro-orbit-cw absolute inset-1 rounded-full border border-dashed border-sky-300/45"
        >
          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-teal-300 shadow-[0_0_18px_rgba(45,212,191,0.95)]" />
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(253,224,71,0.9)]" />
        </div>

        {/* Counter-Rotating Accent Arc */}
        <div
          aria-hidden="true"
          className="intro-orbit-ccw absolute inset-5 rounded-full border-2 border-transparent border-t-teal-300/90 border-r-sky-400/60 border-b-indigo-400/90"
        />

        {/* Rotating Conic Prism Halo + Official Logo */}
        <div className="intro-logo-pop relative w-36 h-36 sm:w-44 sm:h-44 rounded-full p-[4px] shadow-[0_20px_60px_rgba(20,184,166,0.38)] overflow-hidden">
          <div aria-hidden="true" className="intro-conic-halo absolute inset-[-20%]" />
          <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-950 p-1">
            <img
              src="/assets/aistudio/Favicon_0fd84ae5.png"
              alt={`Logo ${brandName}`}
              className="w-full h-full rounded-full object-cover"
            />
            <div
              aria-hidden="true"
              className="intro-sheen absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/70 to-transparent"
            />
          </div>
        </div>
      </div>

      {/* Brand Reveal & Bimbel Tagline */}
      <div className="mt-6 text-center px-6 space-y-3 max-w-xl">
        <h1 className="intro-title-reveal font-display text-3xl sm:text-5xl font-bold text-gold-gradient">
          {brandName}
        </h1>

        <div className="intro-sub-reveal flex items-center justify-center gap-3">
          <span className="h-px w-10 sm:w-16 bg-gradient-to-r from-transparent to-teal-400" />
          <p className="font-hud text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-teal-200">
            Bimbingan Belajar &amp; Arena Kuis
          </p>
          <span className="h-px w-10 sm:w-16 bg-gradient-to-l from-transparent to-sky-400" />
        </div>

        {/* Clean Feature Highlights */}
        <div className="intro-tag-fade flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] font-semibold text-slate-300">
          <span className="px-3 py-1 rounded-full bg-teal-500/15 border border-teal-400/30 text-teal-200">
            Ruang Belajar X–XII
          </span>
          <span className="px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-200">
            Try Out UTBK &amp; ASAS
          </span>
          <span className="px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-200">
            Lobi Kuis
          </span>
        </div>

        <div className="intro-sub-reveal pt-3 flex flex-col items-center gap-2">
          <div className="w-56 sm:w-72 h-1.5 rounded-full bg-slate-800/90 overflow-hidden border border-sky-400/20">
            <div className="intro-progress-bar h-full w-full bg-gradient-to-r from-teal-400 via-sky-400 to-indigo-400 rounded-full" />
          </div>
          <p className="text-xs font-medium tracking-wider text-slate-300">
            Menyiapkan Ruang Belajar &amp; Evaluasi Interaktif...
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSkip}
        className="absolute bottom-8 right-8 sm:bottom-10 sm:right-10 px-4 py-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-teal-400/35 text-xs font-semibold text-teal-100 shadow-sm transition whitespace-nowrap"
      >
        Lewati →
      </button>
    </div>
  );
};
