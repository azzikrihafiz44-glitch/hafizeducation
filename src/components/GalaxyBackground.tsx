import React from 'react';

const STARS = [
  { top: '6%', left: '8%', size: 2, delay: '0s', dur: '3.2s', color: '#e0f2fe' },
  { top: '11%', left: '22%', size: 3, delay: '0.8s', dur: '4.1s', color: '#c7d2fe' },
  { top: '8%', left: '38%', size: 1.5, delay: '1.5s', dur: '2.9s', color: '#f8fafc' },
  { top: '14%', left: '54%', size: 2.5, delay: '0.4s', dur: '3.8s', color: '#99f6e4' },
  { top: '7%', left: '68%', size: 2, delay: '1.9s', dur: '3.4s', color: '#fde68a' },
  { top: '12%', left: '84%', size: 3, delay: '0.3s', dur: '4.4s', color: '#bae6fd' },
  { top: '18%', left: '93%', size: 2, delay: '1.1s', dur: '3.1s', color: '#e9d5ff' },
  { top: '24%', left: '14%', size: 2, delay: '2.2s', dur: '3.9s', color: '#f8fafc' },
  { top: '28%', left: '31%', size: 1.5, delay: '0.6s', dur: '2.7s', color: '#7dd3fc' },
  { top: '22%', left: '47%', size: 2, delay: '1.7s', dur: '4.0s', color: '#e0e7ff' },
  { top: '26%', left: '63%', size: 3, delay: '0.2s', dur: '3.5s', color: '#a5f3fc' },
  { top: '31%', left: '78%', size: 1.5, delay: '1.3s', dur: '3.0s', color: '#f8fafc' },
  { top: '36%', left: '6%', size: 2.5, delay: '2.0s', dur: '4.2s', color: '#c4b5fd' },
  { top: '42%', left: '19%', size: 1.5, delay: '0.9s', dur: '2.8s', color: '#bae6fd' },
  { top: '39%', left: '42%', size: 2, delay: '1.4s', dur: '3.6s', color: '#f8fafc' },
  { top: '45%', left: '58%', size: 2, delay: '0.5s', dur: '3.3s', color: '#99f6e4' },
  { top: '41%', left: '88%', size: 2.5, delay: '2.4s', dur: '4.1s', color: '#fde68a' },
  { top: '52%', left: '11%', size: 2, delay: '1.0s', dur: '3.7s', color: '#e0f2fe' },
  { top: '56%', left: '27%', size: 3, delay: '0.1s', dur: '4.5s', color: '#a5b4fc' },
  { top: '51%', left: '49%', size: 1.5, delay: '1.8s', dur: '2.9s', color: '#f8fafc' },
  { top: '58%', left: '72%', size: 2, delay: '0.7s', dur: '3.5s', color: '#7dd3fc' },
  { top: '62%', left: '91%', size: 2, delay: '2.1s', dur: '3.8s', color: '#e9d5ff' },
  { top: '67%', left: '16%', size: 2.5, delay: '0.4s', dur: '4.0s', color: '#99f6e4' },
  { top: '71%', left: '34%', size: 1.5, delay: '1.6s', dur: '3.1s', color: '#f8fafc' },
  { top: '69%', left: '55%', size: 2, delay: '2.5s', dur: '3.6s', color: '#bae6fd' },
  { top: '74%', left: '79%', size: 3, delay: '0.8s', dur: '4.3s', color: '#c4b5fd' },
  { top: '81%', left: '9%', size: 2, delay: '1.2s', dur: '3.4s', color: '#fde68a' },
  { top: '85%', left: '25%', size: 1.5, delay: '0.3s', dur: '2.8s', color: '#e0f2fe' },
  { top: '82%', left: '44%', size: 2.5, delay: '1.9s', dur: '4.2s', color: '#a5f3fc' },
  { top: '88%', left: '66%', size: 2, delay: '0.6s', dur: '3.3s', color: '#f8fafc' },
  { top: '84%', left: '86%', size: 2, delay: '1.5s', dur: '3.9s', color: '#c7d2fe' },
  { top: '93%', left: '15%', size: 2, delay: '2.3s', dur: '3.5s', color: '#7dd3fc' },
  { top: '91%', left: '52%', size: 1.5, delay: '0.9s', dur: '3.0s', color: '#f8fafc' },
  { top: '95%', left: '76%', size: 2.5, delay: '1.4s', dur: '4.1s', color: '#99f6e4' },
];

export const AstronautSVG: React.FC<{ idPrefix: string; className?: string }> = ({
  idPrefix,
  className = '',
}) => (
  <svg
    viewBox="0 0 220 260"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id={`${idPrefix}-suit`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f1f5f9" />
        <stop offset="55%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
      <linearGradient id={`${idPrefix}-visor`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="45%" stopColor="#4f46e5" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id={`${idPrefix}-flame`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#67e8f9" />
        <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${idPrefix}-accent`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#818cf8" />
      </linearGradient>
    </defs>

    {/* Jetpack Thruster Flame */}
    <g className="astro-thruster">
      <path
        d="M54 152 C46 176 52 198 62 214 C70 196 72 174 66 152 Z"
        fill={`url(#${idPrefix}-flame)`}
      />
      <path
        d="M58 152 C54 168 57 182 62 194 C66 182 67 168 63 152 Z"
        fill="#e0f2fe"
        opacity="0.85"
      />
    </g>

    {/* Backpack (PLSS Life Support) */}
    <rect
      x="44"
      y="90"
      width="34"
      height="66"
      rx="12"
      fill="#475569"
      stroke="#94a3b8"
      strokeWidth="2"
    />
    <rect x="50" y="98" width="22" height="10" rx="4" fill="#38bdf8" opacity="0.7" />
    <rect x="52" y="144" width="16" height="10" rx="3" fill="#1e293b" />

    {/* Antenna on Backpack */}
    <line x1="56" y1="90" x2="48" y2="56" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="47" cy="53" r="4" fill="#38bdf8" />

    {/* Left Leg (Floating) */}
    <path
      d="M84 166 L68 208 C65 215 71 222 79 221 L92 218 C96 217 99 213 100 208 L108 172 Z"
      fill={`url(#${idPrefix}-suit)`}
      stroke="#64748b"
      strokeWidth="1.5"
    />
    <rect x="64" y="210" width="32" height="14" rx="7" transform="rotate(-10 64 210)" fill="#334155" />
    <rect x="68" y="214" width="24" height="4" rx="2" transform="rotate(-10 68 214)" fill="#38bdf8" />

    {/* Right Leg (Bent in Zero-G) */}
    <path
      d="M114 168 L132 204 C136 211 144 212 150 207 L158 198 C161 194 161 188 157 184 L134 158 Z"
      fill={`url(#${idPrefix}-suit)`}
      stroke="#64748b"
      strokeWidth="1.5"
    />
    <rect x="136" y="196" width="32" height="14" rx="7" transform="rotate(28 136 196)" fill="#334155" />
    <rect x="140" y="200" width="22" height="4" rx="2" transform="rotate(28 140 200)" fill="#818cf8" />

    {/* Torso Spacesuit */}
    <rect
      x="72"
      y="94"
      width="68"
      height="78"
      rx="24"
      fill={`url(#${idPrefix}-suit)`}
      stroke="#64748b"
      strokeWidth="1.5"
    />
    {/* Chest Control Module */}
    <rect
      x="88"
      y="112"
      width="36"
      height="26"
      rx="7"
      fill="#1e293b"
      stroke="#38bdf8"
      strokeWidth="1.5"
    />
    <rect x="94" y="118" width="12" height="6" rx="2" fill="#38bdf8" />
    <circle cx="114" cy="121" r="3" fill="#34d399" />
    <rect x="94" y="128" width="24" height="4" rx="2" fill="#818cf8" opacity="0.8" />

    {/* Waist Belt */}
    <rect x="74" y="152" width="64" height="10" rx="5" fill={`url(#${idPrefix}-accent)`} />

    {/* Left Arm (Reaching Out) */}
    <path
      d="M74 106 L44 122 C37 126 35 134 40 140 L48 148 C53 153 61 151 66 145 L82 126 Z"
      fill={`url(#${idPrefix}-suit)`}
      stroke="#64748b"
      strokeWidth="1.5"
    />
    <circle cx="42" cy="138" r="10" fill="#334155" stroke="#38bdf8" strokeWidth="1.5" />

    {/* Right Arm (Waving / Greeting in Space) */}
    <g className="astro-wave-arm">
      <path
        d="M136 106 L168 84 C174 79 183 82 185 89 L188 99 C189 106 184 112 177 113 L138 124 Z"
        fill={`url(#${idPrefix}-suit)`}
        stroke="#64748b"
        strokeWidth="1.5"
      />
      <circle cx="182" cy="92" r="10.5" fill="#334155" stroke="#38bdf8" strokeWidth="1.5" />
    </g>

    {/* Helmet Outer Shell */}
    <circle
      cx="108"
      cy="62"
      r="40"
      fill={`url(#${idPrefix}-suit)`}
      stroke="#94a3b8"
      strokeWidth="2"
    />
    {/* Helmet Neck Ring */}
    <rect x="82" y="92" width="52" height="10" rx="5" fill="#334155" stroke="#38bdf8" strokeWidth="1.2" />

    {/* Reflective Galaxy Visor */}
    <ellipse
      cx="114"
      cy="62"
      rx="28"
      ry="24"
      fill={`url(#${idPrefix}-visor)`}
      stroke="#7dd3fc"
      strokeWidth="2"
    />
    {/* Visor Starlight Reflection */}
    <path
      d="M98 48 C105 42 119 42 128 47"
      stroke="#e0f2fe"
      strokeWidth="3.5"
      strokeLinecap="round"
      opacity="0.85"
    />
    <circle cx="129" cy="56" r="3" fill="#bae6fd" opacity="0.9" />
    <circle cx="104" cy="68" r="2" fill="#a5f3fc" opacity="0.7" />
    <circle cx="120" cy="72" r="1.5" fill="#fde68a" opacity="0.85" />
  </svg>
);

export const GalaxyBackground: React.FC<{ enabled?: boolean }> = ({ enabled = true }) => {
  if (!enabled) {
    return (
      <div
        id="galaxy-bg-container"
        data-effects="off"
        aria-hidden="true"
        className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none"
      >
        <div className="galaxy-nebula-bg" />
      </div>
    );
  }

  return (
    <div
      id="galaxy-bg-container"
      data-effects="on"
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none"
    >
      {/* Deep Cosmic Nebula Gradient */}
      <div className="galaxy-nebula-bg" />

      {/* Drifting Luminous Nebula Auroras */}
      <div className="nebula-aurora-1" />
      <div className="nebula-aurora-2" />

      {/* Subtle Starlight Coordinate Grid */}
      <div className="galaxy-grid-overlay" />

      {/* Twinkling Starfield */}
      {STARS.map((st, idx) => (
        <span
          key={idx}
          className="galaxy-star"
          style={{
            top: st.top,
            left: st.left,
            width: `${st.size}px`,
            height: `${st.size}px`,
            backgroundColor: st.color,
            boxShadow: `0 0 ${st.size * 3.5}px ${st.color}`,
            animationDelay: st.delay,
            animationDuration: st.dur,
          }}
        />
      ))}

      {/* Sparkling 4-Point Cosmic Stars */}
      {[
        { top: '16%', left: '28%', color: '#bae6fd', delay: '0.5s' },
        { top: '24%', left: '72%', color: '#fde68a', delay: '1.8s' },
        { top: '64%', left: '22%', color: '#c4b5fd', delay: '1.1s' },
        { top: '76%', left: '84%', color: '#99f6e4', delay: '2.3s' },
      ].map((sp, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          className="galaxy-star"
          style={{ top: sp.top, left: sp.left, animationDelay: sp.delay, animationDuration: '4.2s' }}
        >
          <path
            d="M12 1 L14.4 9.6 L23 12 L14.4 14.4 L12 23 L9.6 14.4 L1 12 L9.6 9.6 Z"
            fill={sp.color}
          />
        </svg>
      ))}

      {/* Animated Shooting Stars (Meteors) */}
      <span className="shooting-star shooting-star-1" />
      <span className="shooting-star shooting-star-2" />
      <span className="shooting-star shooting-star-3" />

      {/* Animated Cruising Space Rocket */}
      <div className="hidden md:block cosmic-rocket-flight">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="rocket-body" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="rocket-fire" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M27 44 L32 61 L37 44 Z" fill="url(#rocket-fire)" />
          <path d="M24 36 L14 44 L24 44 Z" fill="#38bdf8" />
          <path d="M40 36 L50 44 L40 44 Z" fill="#818cf8" />
          <path d="M32 6 C23 15 22 30 24 44 L40 44 C42 30 41 15 32 6 Z" fill="url(#rocket-body)" />
          <circle cx="32" cy="24" r="5" fill="#0ea5e9" stroke="#e0f2fe" strokeWidth="2" />
        </svg>
      </div>

      {/* Ringed Cosmic Planet (Upper Left) */}
      <div className="hidden sm:block absolute top-24 left-[3%] opacity-70 galaxy-planet-float">
        <svg width="118" height="86" viewBox="0 0 118 86" fill="none">
          <defs>
            <radialGradient id="planet-body" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="55%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </radialGradient>
          </defs>
          <ellipse
            cx="59"
            cy="45"
            rx="54"
            ry="15"
            transform="rotate(-16 59 45)"
            stroke="rgba(125, 211, 252, 0.55)"
            strokeWidth="3.5"
          />
          <circle cx="59" cy="43" r="26" fill="url(#planet-body)" />
          <path
            d="M11 58 C34 65 86 50 109 32"
            stroke="rgba(165, 180, 252, 0.7)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Primary Hero Animated Floating Astronaut (Upper Right) */}
      <div
        data-testid="galaxy-astronaut-primary"
        className="absolute top-32 -right-3 sm:top-20 sm:right-6 lg:right-10 w-24 sm:w-44 lg:w-52 opacity-30 sm:opacity-95 astro-float-primary"
      >
        <AstronautSVG idPrefix="astro-main" className="w-full h-auto drop-shadow-[0_14px_34px_rgba(56,189,248,0.45)]" />
      </div>

      {/* Secondary Distant Exploring Astronaut (Lower Left) */}
      <div
        data-testid="galaxy-astronaut-secondary"
        className="hidden md:block absolute bottom-12 left-3 lg:left-6 w-28 lg:w-32 opacity-75 astro-float-secondary"
      >
        <AstronautSVG idPrefix="astro-sub" className="w-full h-auto drop-shadow-[0_10px_24px_rgba(129,140,248,0.4)]" />
      </div>
    </div>
  );
};
