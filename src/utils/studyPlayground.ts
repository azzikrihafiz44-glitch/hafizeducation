export type SpeedMathDifficulty = 'santai' | 'utbk' | 'master';

export interface SpeedMathQuestion {
  prompt: string;
  answer: number;
  choices: number[];
  hint: string;
}

export interface StudyFlashcard {
  id: string;
  subject: 'Matematika' | 'Fisika' | 'Kimia' | 'Biologi' | 'Bahasa Inggris' | 'Kustom';
  front: string;
  back: string;
  formula?: string;
}

export interface StudyCountdownTarget {
  id: string;
  title: string;
  targetDate: string; // YYYY-MM-DD
}

export interface QuickStudyNote {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

export const DEFAULT_FLASHCARDS: StudyFlashcard[] = [
  {
    id: 'fc-math-1',
    subject: 'Matematika',
    front: 'Rumus Diskriminan Persamaan Kuadrat ax² + bx + c = 0',
    back: 'Menentukan jenis akar persamaan kuadrat: D > 0 (2 akar real berbeda), D = 0 (akar kembar), D < 0 (imajiner).',
    formula: 'D = b² − 4ac',
  },
  {
    id: 'fc-math-2',
    subject: 'Matematika',
    front: 'Jumlah n Suku Pertama Deret Aritmatika (Sn)',
    back: 'Digunakan untuk menjumlahkan barisan dengan selisih tetap (b) dan suku pertama (a).',
    formula: 'Sn = (n / 2) × (2a + (n − 1)b)',
  },
  {
    id: 'fc-fis-1',
    subject: 'Fisika',
    front: 'Hukum II Newton tentang Gerak',
    back: 'Percepatan suatu benda sebanding dengan resultan gaya yang bekerja dan berbanding terbalik dengan massanya.',
    formula: 'ΣF = m · a',
  },
  {
    id: 'fc-fis-2',
    subject: 'Fisika',
    front: 'Energi Kinetik & Energi Potensial Gravitasi',
    back: 'Jumlah keduanya merupakan Energi Mekanik yang kekal jika tidak ada gaya gesek.',
    formula: 'Ek = ½mv²  |  Ep = m · g · h',
  },
  {
    id: 'fc-kim-1',
    subject: 'Kimia',
    front: 'Hubungan Mol, Massa, dan Massa Molar (Mr)',
    back: 'Konsep stoikiometri paling dasar untuk menghitung jumlah zat dalam reaksi kimia.',
    formula: 'n = massa (gram) / Mr',
  },
  {
    id: 'fc-kim-2',
    subject: 'Kimia',
    front: 'Rumus Pengenceran Larutan',
    back: 'Jumlah mol zat terlarut sebelum dan sesudah pengenceran selalu tetap.',
    formula: 'M₁ · V₁ = M₂ · V₂',
  },
  {
    id: 'fc-bio-1',
    subject: 'Biologi',
    front: 'Urutan Tahap Pembelahan Mitosis',
    back: 'Ingat jembatan keledai P-M-A-T: Profase → Metafase → Anafase → Telofase.',
    formula: 'P → M → A → T',
  },
  {
    id: 'fc-eng-1',
    subject: 'Bahasa Inggris',
    front: 'Conditional Sentence Type 2 (Pengandaian Masa Kini)',
    back: 'Menyatakan situasi yang berlawanan dengan fakta sekarang (unreal present).',
    formula: 'If + Simple Past, Subject + would + V1',
  },
];

export function generateSpeedMathQuestion(
  difficulty: SpeedMathDifficulty,
  rng: () => number = Math.random
): SpeedMathQuestion {
  const randInt = (min: number, max: number) =>
    Math.floor(rng() * (max - min + 1)) + min;

  let prompt = '';
  let answer = 0;
  let hint = '';

  if (difficulty === 'santai') {
    const mode = randInt(0, 2);
    if (mode === 0) {
      const a = randInt(8, 35);
      const b = randInt(6, 29);
      prompt = `${a} + ${b} = ?`;
      answer = a + b;
      hint = 'Penjumlahan cepat';
    } else if (mode === 1) {
      const a = randInt(25, 65);
      const b = randInt(7, 24);
      prompt = `${a} − ${b} = ?`;
      answer = a - b;
      hint = 'Pengurangan cepat';
    } else {
      const a = randInt(3, 12);
      const b = randInt(3, 11);
      prompt = `${a} × ${b} = ?`;
      answer = a * b;
      hint = 'Perkalian dasar';
    }
  } else if (difficulty === 'utbk') {
    const mode = randInt(0, 3);
    if (mode === 0) {
      const a = randInt(12, 24);
      const b = randInt(4, 9);
      const c = randInt(5, 25);
      prompt = `${a} × ${b} + ${c} = ?`;
      answer = a * b + c;
      hint = 'Dahulukan perkalian';
    } else if (mode === 1) {
      const x = randInt(3, 15);
      const a = randInt(2, 6);
      const b = randInt(4, 18);
      const rhs = a * x + b;
      prompt = `Jika ${a}x + ${b} = ${rhs}, nilai x = ?`;
      answer = x;
      hint = 'Aljabar linear';
    } else if (mode === 2) {
      const n = randInt(6, 15);
      prompt = `${n}² − ${n} = ?`;
      answer = n * n - n;
      hint = 'Kuadrat cepat';
    } else {
      const start = randInt(3, 12);
      const step = randInt(3, 8);
      prompt = `Deret: ${start}, ${start + step}, ${start + 2 * step}, ${start + 3 * step}, ...`;
      answer = start + 4 * step;
      hint = 'Pola bilangan';
    }
  } else {
    const mode = randInt(0, 2);
    if (mode === 0) {
      const a = randInt(13, 25);
      const b = randInt(11, 19);
      prompt = `${a} × ${b} = ?`;
      answer = a * b;
      hint = 'Perkalian dua digit';
    } else if (mode === 1) {
      const n = randInt(4, 12);
      const m = randInt(3, 9);
      prompt = `${n}² + ${m}² = ?`;
      answer = n * n + m * m;
      hint = 'Jumlah kuadrat';
    } else {
      const pct = [15, 20, 25, 30, 40][randInt(0, 4)];
      const base = randInt(4, 18) * 20;
      prompt = `${pct}% dari ${base} = ?`;
      answer = (pct * base) / 100;
      hint = 'Persentase cepat';
    }
  }

  // Generate 3 distinct plausible distractors
  const choiceSet = new Set<number>([answer]);
  const offsets = [-12, -10, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 10, 12];
  let guard = 0;
  while (choiceSet.size < 4 && guard < 40) {
    guard += 1;
    const offset = offsets[randInt(0, offsets.length - 1)];
    const candidate = answer + offset;
    if (candidate >= 0 && candidate !== answer) {
      choiceSet.add(candidate);
    }
  }
  while (choiceSet.size < 4) {
    choiceSet.add(answer + choiceSet.size * 3);
  }

  const choices = Array.from(choiceSet);
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return { prompt, answer, choices, hint };
}

export function calculateSpeedMathPoints(
  difficulty: SpeedMathDifficulty,
  nextStreak: number
): number {
  const base = difficulty === 'santai' ? 10 : difficulty === 'utbk' ? 20 : 30;
  const multiplier = Math.min(4, 1 + Math.floor(Math.max(0, nextStreak - 1) / 3));
  return base * multiplier;
}

export function computeDaysRemaining(
  targetDateStr: string,
  now: Date = new Date()
): { days: number; hours: number; isPast: boolean } {
  const [y, m, d] = targetDateStr.split('-').map(Number);
  if (!y || !m || !d) return { days: 0, hours: 0, isPast: true };
  const target = new Date(y, m - 1, d, 8, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) {
    return { days: 0, hours: 0, isPast: true };
  }
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  return {
    days: Math.floor(totalHours / 24),
    hours: totalHours % 24,
    isPast: false,
  };
}

/**
 * Extracts a safe YouTube nocookie embed URL from watch, youtu.be, shorts, live, or embed URLs.
 */
export function extractYouTubeEmbedUrl(rawUrl: string | undefined | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(normalized);
    const host = url.hostname.replace(/^www\./i, '').toLowerCase();
    let videoId = '';

    if (host === 'youtu.be') {
      videoId = url.pathname.replace(/^\/+/, '').split('/')[0] || '';
    } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v') || '';
      } else {
        const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([a-zA-Z0-9_-]{6,20})/);
        if (match) videoId = match[1];
      }
    }

    if (!/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) return null;
    return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
  } catch {
    return null;
  }
}

export interface SkdEvaluation {
  total: number;
  maxTotal: number;
  twkPassed: boolean;
  tiuPassed: boolean;
  tkpPassed: boolean;
  allPassed: boolean;
  statusLabel: string;
}

/**
 * Evaluates SKD Kedinasan passing grades: TWK >= 65 (max 150), TIU >= 80 (max 175), TKP >= 166 (max 225).
 */
export function calculateSkdPassingGrade(twk: number, tiu: number, tkp: number): SkdEvaluation {
  const safeTwk = Math.max(0, Math.min(150, Math.round(Number(twk) || 0)));
  const safeTiu = Math.max(0, Math.min(175, Math.round(Number(tiu) || 0)));
  const safeTkp = Math.max(0, Math.min(225, Math.round(Number(tkp) || 0)));
  const total = safeTwk + safeTiu + safeTkp;
  const twkPassed = safeTwk >= 65;
  const tiuPassed = safeTiu >= 80;
  const tkpPassed = safeTkp >= 166;
  const allPassed = twkPassed && tiuPassed && tkpPassed;

  return {
    total,
    maxTotal: 550,
    twkPassed,
    tiuPassed,
    tkpPassed,
    allPassed,
    statusLabel: allPassed
      ? total >= 430
        ? 'LULUS PG · Peluang Perankingan Sangat Tinggi'
        : 'LULUS Passing Grade SKD Kedinasan'
      : 'Belum Memenuhi Passing Grade SKD',
  };
}

export interface UtbkEvaluation {
  average: number;
  tierLabel: string;
}

/**
 * Computes the average UTBK-SNBT score across subtests (0..1000 scale).
 */
export function calculateUtbkAverage(scores: number[]): UtbkEvaluation {
  if (!Array.isArray(scores) || scores.length === 0) {
    return { average: 0, tierLabel: 'Masukkan estimasi skor subtes' };
  }
  const clamped = scores.map((s) => Math.max(0, Math.min(1000, Number(s) || 0)));
  const avg = Math.round(clamped.reduce((a, b) => a + b, 0) / clamped.length);
  const tierLabel =
    avg >= 720
      ? 'Sangat Kompetitif (PTN Top / Kedokteran / STEI)'
      : avg >= 640
        ? 'Kompetitif (Prodi Favorit PTN Utama)'
        : avg >= 560
          ? 'Peluang Baik (Tingkatkan Drilling Subtes Lemah)'
          : 'Perlu Latihan Intensif & Try Out Rutin';
  return { average: avg, tierLabel };
}

