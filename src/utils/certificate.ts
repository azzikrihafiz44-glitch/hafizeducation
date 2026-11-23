export interface CertificateData {
  playerName: string;
  quizTitle: string;
  roomCode: string;
  grade: number;
  points: number;
  correctCount: number;
  totalQuestions: number;
  rank: number;
  certificateId: string;
  dateStr: string;
}

const BRAND_LOGO_URL = '/assets/aistudio/Favicon_0fd84ae5.png';
let cachedLogoImg: HTMLImageElement | null = null;
let logoLoadPromise: Promise<HTMLImageElement | null> | null = null;

function ensureBrandLogo(): Promise<HTMLImageElement | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (cachedLogoImg && cachedLogoImg.complete && cachedLogoImg.naturalWidth > 0) {
    return Promise.resolve(cachedLogoImg);
  }
  if (!logoLoadPromise) {
    logoLoadPromise = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        cachedLogoImg = img;
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = BRAND_LOGO_URL;
    });
  }
  return logoLoadPromise;
}

function drawCrestLogo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  img: HTMLImageElement | null
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
  } else {
    ctx.fillStyle = '#091026';
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = '#7dd3fc';
    ctx.font = '800 26px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HE', cx, cy + 1);
  }
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = '#7dd3fc';
  ctx.stroke();
  ctx.restore();
}

function getAwardTier(grade: number): {
  label: string;
  bgStart: string;
  bgEnd: string;
  border: string;
  text: string;
} {
  if (grade >= 90) {
    return {
      label: '★  PREDIKAT: ISTIMEWA (SPACE COMMANDER)  ★',
      bgStart: 'rgba(56, 189, 248, 0.24)',
      bgEnd: 'rgba(250, 204, 21, 0.22)',
      border: '#38bdf8',
      text: '#fef08a',
    };
  }
  if (grade >= 75) {
    return {
      label: '★  PREDIKAT: SANGAT BAIK (STAR NAVIGATOR)  ★',
      bgStart: 'rgba(99, 102, 241, 0.28)',
      bgEnd: 'rgba(56, 189, 248, 0.22)',
      border: '#818cf8',
      text: '#e0e7ff',
    };
  }
  if (grade >= 60) {
    return {
      label: '★  PREDIKAT: BAIK (GALAXY EXPLORER)  ★',
      bgStart: 'rgba(20, 184, 166, 0.24)',
      bgEnd: 'rgba(56, 189, 248, 0.20)',
      border: '#2dd4bf',
      text: '#ccfbf1',
    };
  }
  return {
    label: '★  PREDIKAT: PESERTA AKTIF (SPACE CADET)  ★',
    bgStart: 'rgba(148, 163, 184, 0.20)',
    bgEnd: 'rgba(99, 102, 241, 0.18)',
    border: '#94a3b8',
    text: '#f1f5f9',
  };
}

function drawFourPointStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  fill: string
) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / 4 - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

function drawStarfieldAndMeteors(ctx: CanvasRenderingContext2D, W: number, H: number) {
  // Deterministic cosmic starfield
  const stars = [
    [95, 92, 2.2, '#e0f2fe'], [165, 134, 1.4, '#c7d2fe'], [240, 86, 2.6, '#fde68a'],
    [325, 142, 1.5, '#f8fafc'], [430, 84, 2.0, '#7dd3fc'], [770, 90, 2.3, '#e0f2fe'],
    [870, 128, 1.6, '#99f6e4'], [960, 82, 2.8, '#fde68a'], [1065, 118, 1.8, '#c4b5fd'],
    [1120, 165, 2.2, '#7dd3fc'], [82, 240, 1.8, '#bae6fd'], [152, 295, 2.4, '#e9d5ff'],
    [118, 395, 1.5, '#f8fafc'], [86, 485, 2.5, '#7dd3fc'], [160, 540, 1.6, '#fde68a'],
    [104, 620, 2.0, '#c7d2fe'], [215, 650, 1.4, '#99f6e4'], [1085, 260, 2.0, '#f8fafc'],
    [1132, 345, 2.6, '#7dd3fc'], [1045, 420, 1.5, '#e9d5ff'], [1110, 515, 2.2, '#fde68a'],
    [1025, 605, 1.7, '#bae6fd'], [1128, 665, 2.4, '#c7d2fe'], [950, 645, 1.6, '#99f6e4'],
    [290, 210, 1.3, '#e0f2fe'], [910, 215, 1.5, '#c7d2fe'], [245, 445, 1.4, '#f8fafc'],
    [965, 465, 1.4, '#7dd3fc'], [355, 675, 1.8, '#e0f2fe'], [845, 680, 1.9, '#fde68a'],
  ] as const;

  ctx.save();
  for (const [x, y, r, color] of stars) {
    ctx.shadowColor = color;
    ctx.shadowBlur = r * 4;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // Sparkle 4-point stars
  drawFourPointStar(ctx, 138, 178, 9, 2.2, '#bae6fd');
  drawFourPointStar(ctx, 1055, 168, 10, 2.4, '#fde68a');
  drawFourPointStar(ctx, 212, 505, 7, 1.8, '#c4b5fd');
  drawFourPointStar(ctx, 985, 520, 8, 2.0, '#7dd3fc');
  drawFourPointStar(ctx, 378, 106, 6, 1.5, '#f8fafc');
  drawFourPointStar(ctx, 822, 108, 6, 1.5, '#99f6e4');

  // Diagonal shooting meteors
  const drawMeteor = (x1: number, y1: number, len: number, angleRad: number) => {
    const x2 = x1 - Math.cos(angleRad) * len;
    const y2 = y1 - Math.sin(angleRad) * len;
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, 'rgba(224, 242, 254, 0.95)');
    grad.addColorStop(0.35, 'rgba(56, 189, 248, 0.55)');
    grad.addColorStop(1, 'rgba(99, 102, 241, 0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x1, y1, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  drawMeteor(268, 168, 95, Math.PI / 5.5);
  drawMeteor(1015, 220, 82, Math.PI / 5.5);
  drawMeteor(195, 610, 70, Math.PI / 5.5);

  // Subtle cosmic orbital arcs across the background
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.ellipse(W / 2, H / 2, 495, 265, -0.14, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(129, 140, 248, 0.07)';
  ctx.beginPath();
  ctx.ellipse(W / 2, H / 2, 430, 215, 0.16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawCosmicPlanet(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.save();
  ctx.translate(cx, cy);

  // Back half of planetary ring
  ctx.save();
  ctx.rotate(-0.32);
  ctx.beginPath();
  ctx.ellipse(0, 4, radius * 2.05, radius * 0.56, 0, Math.PI, Math.PI * 2);
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.5)';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.restore();

  // Planet sphere with cosmic lighting
  ctx.shadowColor = 'rgba(56, 189, 248, 0.35)';
  ctx.shadowBlur = 22;
  const planetGrad = ctx.createRadialGradient(
    -radius * 0.35,
    -radius * 0.35,
    radius * 0.15,
    0,
    0,
    radius * 1.1
  );
  planetGrad.addColorStop(0, '#7dd3fc');
  planetGrad.addColorStop(0.42, '#4f46e5');
  planetGrad.addColorStop(0.85, '#1e1b4b');
  planetGrad.addColorStop(1, '#090d24');
  ctx.fillStyle = planetGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Atmospheric bands clipped to sphere
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = 'rgba(165, 243, 252, 0.22)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(0, -radius * 0.25, radius * 1.15, radius * 0.24, -0.22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(196, 181, 253, 0.18)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, radius * 0.22, radius * 1.15, radius * 0.26, -0.22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Front half of planetary ring
  ctx.save();
  ctx.rotate(-0.32);
  const ringGrad = ctx.createLinearGradient(-radius * 2, 0, radius * 2, 0);
  ringGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
  ringGrad.addColorStop(0.5, 'rgba(224, 242, 254, 0.85)');
  ringGrad.addColorStop(1, 'rgba(165, 180, 252, 0.35)');
  ctx.beginPath();
  ctx.ellipse(0, 4, radius * 2.05, radius * 0.56, 0, 0, Math.PI);
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = 6.5;
  ctx.stroke();
  ctx.restore();

  // Small orbiting moon
  ctx.fillStyle = '#e0f2fe';
  ctx.shadowColor = '#7dd3fc';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(radius * 1.55, -radius * 1.05, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCanvasAstronaut(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale = 1,
  rotationRad = 0
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotationRad);
  ctx.scale(scale, scale);

  // Soft cosmic halo behind astronaut
  const halo = ctx.createRadialGradient(0, -10, 12, 0, 0, 115);
  halo.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
  halo.addColorStop(0.55, 'rgba(99, 102, 241, 0.12)');
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, 115, 0, Math.PI * 2);
  ctx.fill();

  // Suit metallic white-silver gradient
  const suitGrad = ctx.createLinearGradient(-45, -75, 50, 85);
  suitGrad.addColorStop(0, '#f8fafc');
  suitGrad.addColorStop(0.55, '#cbd5e1');
  suitGrad.addColorStop(1, '#94a3b8');

  // Jetpack thruster flame
  const flameGrad = ctx.createLinearGradient(-42, 34, -42, 105);
  flameGrad.addColorStop(0, '#a5f3fc');
  flameGrad.addColorStop(0.45, '#38bdf8');
  flameGrad.addColorStop(1, 'rgba(129, 140, 248, 0)');
  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.moveTo(-54, 34);
  ctx.quadraticCurveTo(-60, 74, -44, 102);
  ctx.quadraticCurveTo(-30, 74, -34, 34);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(240, 249, 255, 0.9)';
  ctx.beginPath();
  ctx.moveTo(-49, 34);
  ctx.quadraticCurveTo(-51, 58, -44, 76);
  ctx.quadraticCurveTo(-37, 58, -39, 34);
  ctx.closePath();
  ctx.fill();

  // PLSS Life-Support Backpack
  ctx.fillStyle = '#475569';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-62, -26, 32, 64, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.roundRect(-56, -18, 20, 9, 4);
  ctx.fill();

  // Backpack antenna
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-50, -26);
  ctx.lineTo(-58, -62);
  ctx.stroke();
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(-59, -65, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Left Leg (floating)
  ctx.fillStyle = suitGrad;
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-24, 46);
  ctx.lineTo(-40, 92);
  ctx.quadraticCurveTo(-43, 102, -31, 103);
  ctx.lineTo(-16, 100);
  ctx.lineTo(-4, 52);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Left Boot
  ctx.save();
  ctx.translate(-30, 98);
  ctx.rotate(-0.18);
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.roundRect(-16, -6, 34, 14, 7);
  ctx.fill();
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(-11, -1, 24, 4);
  ctx.restore();

  // Right Leg (bent in zero-G)
  ctx.fillStyle = suitGrad;
  ctx.beginPath();
  ctx.moveTo(8, 46);
  ctx.lineTo(28, 86);
  ctx.quadraticCurveTo(34, 95, 43, 88);
  ctx.lineTo(50, 78);
  ctx.lineTo(26, 42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right Boot
  ctx.save();
  ctx.translate(42, 86);
  ctx.rotate(0.48);
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.roundRect(-14, -6, 32, 14, 7);
  ctx.fill();
  ctx.fillStyle = '#818cf8';
  ctx.fillRect(-9, -1, 22, 4);
  ctx.restore();

  // Spacesuit Torso
  ctx.fillStyle = suitGrad;
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-34, -22, 68, 76, 22);
  ctx.fill();
  ctx.stroke();

  // Chest Mission Control Module
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-18, -5, 36, 26, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.roundRect(-12, 1, 13, 6, 2);
  ctx.fill();

  ctx.fillStyle = '#34d399';
  ctx.beginPath();
  ctx.arc(9, 4, 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#a5b4fc';
  ctx.beginPath();
  ctx.roundRect(-12, 12, 24, 4, 2);
  ctx.fill();

  // Waist Belt
  const beltGrad = ctx.createLinearGradient(-32, 34, 32, 34);
  beltGrad.addColorStop(0, '#38bdf8');
  beltGrad.addColorStop(1, '#818cf8');
  ctx.fillStyle = beltGrad;
  ctx.beginPath();
  ctx.roundRect(-32, 34, 64, 10, 5);
  ctx.fill();

  // Left Arm (reaching gently)
  ctx.fillStyle = suitGrad;
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-32, -10);
  ctx.lineTo(-64, 10);
  ctx.quadraticCurveTo(-72, 16, -65, 25);
  ctx.lineTo(-55, 32);
  ctx.lineTo(-26, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(-64, 22, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Right Arm (waving / saluting proudly)
  ctx.fillStyle = suitGrad;
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(30, -10);
  ctx.lineTo(62, -34);
  ctx.quadraticCurveTo(72, -39, 77, -28);
  ctx.lineTo(79, -18);
  ctx.lineTo(34, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(73, -27, 10.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Helmet Outer Shell
  ctx.fillStyle = suitGrad;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(2, -56, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Helmet Neck Collar
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-24, -24, 52, 10, 5);
  ctx.fill();
  ctx.stroke();

  // Reflective Galaxy Visor
  const visorGrad = ctx.createLinearGradient(-22, -78, 32, -34);
  visorGrad.addColorStop(0, '#38bdf8');
  visorGrad.addColorStop(0.45, '#4338ca');
  visorGrad.addColorStop(1, '#090d24');
  ctx.fillStyle = visorGrad;
  ctx.strokeStyle = '#7dd3fc';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(8, -56, 28, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Visor highlight & galaxy stars reflected inside visor
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.88)';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -70);
  ctx.quadraticCurveTo(6, -77, 21, -71);
  ctx.stroke();

  ctx.fillStyle = '#bae6fd';
  ctx.beginPath();
  ctx.arc(22, -62, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(14, -46, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#a5f3fc';
  ctx.beginPath();
  ctx.arc(-2, -50, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCosmicMissionSeal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cosmicGrad: CanvasGradient
) {
  ctx.save();

  // Dual cosmic ribbons
  const drawRibbon = (angleDeg: number) => {
    ctx.save();
    ctx.translate(cx, cy + 16);
    ctx.rotate((angleDeg * Math.PI) / 180);
    const ribGrad = ctx.createLinearGradient(0, 0, 0, 56);
    ribGrad.addColorStop(0, '#0284c7');
    ribGrad.addColorStop(0.5, '#4f46e5');
    ribGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = ribGrad;
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.lineTo(11, 0);
    ctx.lineTo(11, 52);
    ctx.lineTo(0, 42);
    ctx.lineTo(-11, 52);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  };
  drawRibbon(-22);
  drawRibbon(22);

  // Scalloped 24-point star rosette
  const spikes = 24;
  const outerR = 45;
  const innerR = 38;
  ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = cosmicGrad;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Inner space-obsidian core
  ctx.beginPath();
  ctx.arc(cx, cy, 32, 0, Math.PI * 2);
  const coreGrad = ctx.createRadialGradient(cx - 8, cy - 8, 4, cx, cy, 33);
  coreGrad.addColorStop(0, '#1e293b');
  coreGrad.addColorStop(1, '#060a1c');
  ctx.fillStyle = coreGrad;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#bae6fd';
  ctx.stroke();

  // Orbital micro-ring inside seal
  ctx.save();
  ctx.setLineDash([2.5, 2.5]);
  ctx.beginPath();
  ctx.arc(cx, cy, 26, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.75)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Seal text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fde68a';
  ctx.font = '800 8px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('★ ★ ★', cx, cy - 13);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 10px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('VERIFIED', cx, cy + 1);
  ctx.fillStyle = '#7dd3fc';
  ctx.font = '700 8px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ASTRONAUT', cx, cy + 13);

  ctx.restore();
}

export function renderCertificateToCanvas(
  canvas: HTMLCanvasElement,
  data: CertificateData
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  // 1. Deep Space Galaxy Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#040714');
  bg.addColorStop(0.32, '#0a1230');
  bg.addColorStop(0.68, '#111842');
  bg.addColorStop(1, '#05091a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Cosmic Nebula Clouds (Cyan, Indigo, Violet, Teal)
  const nebula1 = ctx.createRadialGradient(180, 160, 20, 180, 160, 420);
  nebula1.addColorStop(0, 'rgba(56, 189, 248, 0.24)');
  nebula1.addColorStop(0.55, 'rgba(79, 70, 229, 0.08)');
  nebula1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = nebula1;
  ctx.fillRect(0, 0, W, H);

  const nebula2 = ctx.createRadialGradient(W - 160, 240, 20, W - 160, 240, 440);
  nebula2.addColorStop(0, 'rgba(139, 92, 246, 0.25)');
  nebula2.addColorStop(0.5, 'rgba(56, 189, 248, 0.09)');
  nebula2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = nebula2;
  ctx.fillRect(0, 0, W, H);

  const nebula3 = ctx.createRadialGradient(W / 2, H - 110, 30, W / 2, H - 90, 480);
  nebula3.addColorStop(0, 'rgba(20, 184, 166, 0.16)');
  nebula3.addColorStop(0.6, 'rgba(99, 102, 241, 0.06)');
  nebula3.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = nebula3;
  ctx.fillRect(0, 0, W, H);

  // 2. Twinkling Starfield, Shooting Meteors & Orbital Rings
  drawStarfieldAndMeteors(ctx, W, H);

  // Subtle Glowing Planetary Horizon Arc along bottom edge
  ctx.save();
  const horizonGrad = ctx.createRadialGradient(W / 2, H + 460, 460, W / 2, H + 460, 560);
  horizonGrad.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
  horizonGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.12)');
  horizonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = horizonGrad;
  ctx.fillRect(0, H - 160, W, 160);

  // Subtle Constellation Lines connecting top-left & top-right stars
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(95, 92);
  ctx.lineTo(165, 134);
  ctx.lineTo(240, 86);
  ctx.lineTo(325, 142);
  ctx.moveTo(870, 128);
  ctx.lineTo(960, 82);
  ctx.lineTo(1065, 118);
  ctx.lineTo(1120, 165);
  ctx.stroke();
  ctx.restore();

  // Subtle diagonal space-academy watermark
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 10);
  ctx.fillStyle = 'rgba(186, 230, 253, 0.025)';
  ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  for (let y = -400; y <= 400; y += 115) {
    for (let x = -560; x <= 560; x += 430) {
      ctx.fillText('HAFIZ EDUCATION • GALAXY MISSION', x, y);
    }
  }
  ctx.restore();

  // 3. Ringed Cosmic Planet (Left) & Floating Astronaut Illustration (Right)
  drawCosmicPlanet(ctx, 148, 330, 44);
  drawCanvasAstronaut(ctx, W - 142, 336, 0.94, 0.09);

  // Cosmic Starlight Metallic Frame Gradient
  const cosmicFrameGrad = ctx.createLinearGradient(0, 0, W, H);
  cosmicFrameGrad.addColorStop(0, '#7dd3fc');
  cosmicFrameGrad.addColorStop(0.28, '#818cf8');
  cosmicFrameGrad.addColorStop(0.52, '#fef08a');
  cosmicFrameGrad.addColorStop(0.76, '#38bdf8');
  cosmicFrameGrad.addColorStop(1, '#a5b4fc');

  // Multi-layered Futuristic Galaxy Frame
  ctx.strokeStyle = cosmicFrameGrad;
  ctx.lineWidth = 6.5;
  ctx.strokeRect(24, 24, W - 48, H - 48);

  ctx.strokeStyle = 'rgba(125, 211, 252, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(38, 38, W - 76, H - 76);

  ctx.strokeStyle = 'rgba(129, 140, 248, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(46, 46, W - 92, H - 92);

  // Corner Orbital Telemetry Brackets + Star Gems
  const corners: [number, number, number, number][] = [
    [38, 38, 1, 1],
    [W - 38, 38, -1, 1],
    [38, H - 38, 1, -1],
    [W - 38, H - 38, -1, -1],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    ctx.save();
    ctx.strokeStyle = cosmicFrameGrad;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * 58);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * 58, cy);
    ctx.stroke();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#bae6fd';
    ctx.beginPath();
    ctx.moveTo(cx + dx * 12, cy + dy * 40);
    ctx.lineTo(cx + dx * 12, cy + dy * 12);
    ctx.lineTo(cx + dx * 40, cy + dy * 12);
    ctx.stroke();

    drawFourPointStar(ctx, cx + dx * 22, cy + dy * 22, 7.5, 2.2, '#fde68a');
    ctx.restore();
  }

  // 4. Top Mission Emblem Crest with Orbital Ring & Official Logo
  const crestY = 102;
  ctx.save();
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(W / 2, crestY, 72, 22, -0.18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(253, 230, 138, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(W / 2, crestY, 72, 22, 0.18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.shadowColor = 'rgba(56, 189, 248, 0.55)';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(W / 2, crestY, 41, 0, Math.PI * 2);
  const crestFill = ctx.createLinearGradient(W / 2 - 41, crestY - 41, W / 2 + 41, crestY + 41);
  crestFill.addColorStop(0, '#7dd3fc');
  crestFill.addColorStop(0.5, '#6366f1');
  crestFill.addColorStop(1, '#38bdf8');
  ctx.fillStyle = crestFill;
  ctx.fill();
  ctx.restore();

  if (cachedLogoImg && cachedLogoImg.complete && cachedLogoImg.naturalWidth > 0) {
    drawCrestLogo(ctx, W / 2, crestY, 36, cachedLogoImg);
  } else {
    drawCrestLogo(ctx, W / 2, crestY, 36, null);
    void ensureBrandLogo().then((loadedImg) => {
      if (loadedImg) {
        drawCrestLogo(ctx, W / 2, crestY, 36, loadedImg);
      }
    });
  }

  // 5. Brand Header & Main Heading
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#7dd3fc';
  ctx.font = '800 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    'H A F I Z   E D U C A T I O N   •   G A L A X Y   A S T R O N A U T   A C A D E M Y',
    W / 2,
    172
  );

  // Main heading in starlight gradient
  ctx.save();
  ctx.shadowColor = 'rgba(56, 189, 248, 0.35)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 3;
  const titleGrad = ctx.createLinearGradient(W / 2 - 260, 195, W / 2 + 260, 245);
  titleGrad.addColorStop(0, '#e0f2fe');
  titleGrad.addColorStop(0.45, '#ffffff');
  titleGrad.addColorStop(1, '#fde68a');
  ctx.fillStyle = titleGrad;
  ctx.font = '800 48px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('SERTIFIKAT PENGHARGAAN', W / 2, 232);
  ctx.restore();

  // Starlight divider with central sparkle star
  const divY = 252;
  const lineGrad = ctx.createLinearGradient(W / 2 - 270, divY, W / 2 + 270, divY);
  lineGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
  lineGrad.addColorStop(0.5, '#7dd3fc');
  lineGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 270, divY);
  ctx.lineTo(W / 2 + 270, divY);
  ctx.stroke();
  drawFourPointStar(ctx, W / 2, divY, 8, 2.4, '#fde68a');

  // 6. Dynamic Space-Rank Predikat Ribbon
  const tier = getAwardTier(data.grade);
  const ribW = 476;
  const ribH = 34;
  const ribX = (W - ribW) / 2;
  const ribY = 270;
  const ribFill = ctx.createLinearGradient(ribX, ribY, ribX + ribW, ribY);
  ribFill.addColorStop(0, tier.bgStart);
  ribFill.addColorStop(0.5, tier.bgEnd);
  ribFill.addColorStop(1, tier.bgStart);

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(ribX, ribY, ribW, ribH, 17);
  ctx.fillStyle = ribFill;
  ctx.fill();
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = tier.border;
  ctx.stroke();

  ctx.fillStyle = tier.text;
  ctx.font = '800 13.5px "Plus Jakarta Sans", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(tier.label, W / 2, ribY + ribH / 2 + 0.5);
  ctx.restore();

  // 7. Recipient Section
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 19px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Diberikan dengan penuh kebanggaan kepada:', W / 2, 342);

  // Luminous starlight-gold recipient name
  ctx.save();
  const displayName = data.playerName.trim() || 'Peserta Hafiz Education';
  const nameGrad = ctx.createLinearGradient(W / 2 - 240, 365, W / 2 + 240, 418);
  nameGrad.addColorStop(0, '#e0f2fe');
  nameGrad.addColorStop(0.35, '#fef08a');
  nameGrad.addColorStop(0.7, '#7dd3fc');
  nameGrad.addColorStop(1, '#fde68a');
  ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = nameGrad;
  ctx.font = 'italic 700 54px Georgia, "Times New Roman", serif';
  ctx.fillText(displayName, W / 2, 408, W - 360);
  ctx.restore();

  // Starlight underline under name
  const nameLineY = 428;
  const nameLineGrad = ctx.createLinearGradient(W / 2 - 290, nameLineY, W / 2 + 290, nameLineY);
  nameLineGrad.addColorStop(0, 'rgba(125, 211, 252, 0)');
  nameLineGrad.addColorStop(0.5, 'rgba(125, 211, 252, 0.8)');
  nameLineGrad.addColorStop(1, 'rgba(125, 211, 252, 0)');
  ctx.strokeStyle = nameLineGrad;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 290, nameLineY);
  ctx.lineTo(W / 2 + 290, nameLineY);
  ctx.stroke();

  // Program Description
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 18.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Atas keberhasilan menyelesaikan misi evaluasi interaktif pada program:', W / 2, 466);

  // Quiz Title cosmic glass strip
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(W / 2 - 340, 482, 680, 44, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e0f2fe';
  ctx.font = '800 23px "Plus Jakarta Sans", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(data.quizTitle, W / 2, 505, 640);
  ctx.restore();

  // 8. Four Cosmic Telemetry Stat Cards
  const boxY = 550;
  const boxH = 88;
  const boxW = 214;
  const gap = 24;
  const totalW = boxW * 4 + gap * 3;
  const startX = (W - totalW) / 2;

  const stats = [
    { label: 'NILAI AKHIR', value: `${data.grade}/100`, accent: '#34d399', glow: 'rgba(52, 211, 153, 0.16)' },
    { label: 'TOTAL POIN', value: `${data.points}`, accent: '#818cf8', glow: 'rgba(129, 140, 248, 0.16)' },
    { label: 'JAWABAN BENAR', value: `${data.correctCount}/${data.totalQuestions}`, accent: '#38bdf8', glow: 'rgba(56, 189, 248, 0.16)' },
    { label: 'PERINGKAT', value: `#${data.rank}`, accent: '#fde047', glow: 'rgba(250, 204, 21, 0.16)' },
  ];

  stats.forEach((st, idx) => {
    const bx = startX + idx * (boxW + gap);
    ctx.save();

    const cardGrad = ctx.createLinearGradient(bx, boxY, bx, boxY + boxH);
    cardGrad.addColorStop(0, 'rgba(15, 23, 42, 0.90)');
    cardGrad.addColorStop(1, 'rgba(6, 11, 28, 0.95)');
    ctx.fillStyle = cardGrad;
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.28)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(bx, boxY, boxW, boxH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = st.accent;
    ctx.beginPath();
    ctx.roundRect(bx + 22, boxY, boxW - 44, 3.5, 2);
    ctx.fill();

    const topTint = ctx.createLinearGradient(bx, boxY, bx, boxY + 42);
    topTint.addColorStop(0, st.glow);
    topTint.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topTint;
    ctx.beginPath();
    ctx.roundRect(bx + 1, boxY + 1, boxW - 2, 42, 13);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(st.label, bx + boxW / 2, boxY + 30);

    ctx.fillStyle = st.accent;
    ctx.font = '800 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(st.value, bx + boxW / 2, boxY + 68);
    ctx.restore();
  });

  // 9. Prestigious Space Mission Footer
  const footY = 716;

  // Left: Date, Room Code & Verification ID
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 14.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Tanggal Terbit : ${data.dateStr}`, 88, footY - 12);
  ctx.fillText(`Kode Room     : ${data.roomCode}`, 88, footY + 14);
  ctx.fillStyle = '#7dd3fc';
  ctx.font = '700 13.5px monospace';
  ctx.fillText(`ID Verifikasi  : ${data.certificateId}`, 88, footY + 40);

  // Center: Cosmic Astronaut Mission Seal
  drawCosmicMissionSeal(ctx, W / 2, footY + 4, cosmicFrameGrad);

  // Right: Founder Calligraphic Signature
  ctx.save();
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e0f2fe';
  ctx.font = 'italic 700 28px Georgia, "Times New Roman", serif';
  ctx.fillText('M. Hafiz Azzikri', W - 96, footY - 4);

  ctx.strokeStyle = 'rgba(125, 211, 252, 0.78)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(W - 295, footY + 8);
  ctx.bezierCurveTo(W - 230, footY + 18, W - 150, footY + 2, W - 92, footY + 12);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(125, 211, 252, 0.38)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W - 322, footY + 20);
  ctx.lineTo(W - 88, footY + 20);
  ctx.stroke();

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Founder • Hafiz Education (hafizeducation.my.id)', W - 88, footY + 42);
  ctx.restore();
}

export function downloadCanvasPNG(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}

export function printCanvasCertificate(canvas: HTMLCanvasElement, title: string): void {
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(`
    <!doctype html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: landscape; margin: 10mm; }
          body { margin: 0; display: flex; align-items: center; justify-content: center; background: #040714; }
          img { max-width: 100%; max-height: 100vh; object-fit: contain; }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" onload="window.focus(); window.print();" />
      </body>
    </html>
  `);
  doc.close();
  setTimeout(() => {
    iframe.remove();
  }, 4000);
}
