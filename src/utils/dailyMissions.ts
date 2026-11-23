export type MissionCategory = 'fokus' | 'kuis' | 'materi' | 'eksplorasi';
export type MissionDifficulty = 'Mudah' | 'Menengah' | 'Tantangan';
export type MissionTrackingType =
  | 'focus_sessions'
  | 'quizzes_today'
  | 'high_score_quiz'
  | 'portal_visit'
  | 'wardrobe_visit'
  | 'manual';

export interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  category: MissionCategory;
  difficulty: MissionDifficulty;
  target: number;
  unit: string;
  xpReward: number;
  trackingType: MissionTrackingType;
}

export interface DailyMissionState {
  date: string; // YYYY-MM-DD (local date)
  rotationSeed: number;
  activeMissionIds: string[];
  manualProgress: Record<string, number>;
  claimedIds: string[];
  bonusClaimed: boolean;
  rerollsRemaining: number;
  focusSessionsToday: number;
  portalVisitsToday: number;
  wardrobeVisitsToday: number;
  streakDays: number;
  lastCompletedDate: string | null;
  totalClaimedXp: number;
}

export interface ResolvedDailyMission extends MissionTemplate {
  progress: number;
  isCompleted: boolean;
  isClaimed: boolean;
  progressPercent: number;
}

export interface ActivitySnapshot {
  quizzesToday: number;
  highScoreQuizzesToday: number;
}

export const DAILY_MISSION_SLOTS = 4;
export const MAX_DAILY_REROLLS = 3;
export const ALL_MISSIONS_BONUS_XP = 100;

export const MISSION_POOL: MissionTemplate[] = [
  // Fokus (Pomodoro / Deep Study)
  {
    id: 'focus-1',
    title: 'Selesaikan 1 Sesi Fokus Pomodoro',
    description: 'Jalankan Timer Fokus Belajar sampai selesai tanpa gangguan.',
    category: 'fokus',
    difficulty: 'Mudah',
    target: 1,
    unit: 'sesi',
    xpReward: 45,
    trackingType: 'focus_sessions',
  },
  {
    id: 'focus-2',
    title: 'Maraton Fokus 2 Sesi',
    description: 'Tuntaskan 2 sesi Timer Fokus hari ini untuk ketahanan belajar.',
    category: 'fokus',
    difficulty: 'Tantangan',
    target: 2,
    unit: 'sesi',
    xpReward: 80,
    trackingType: 'focus_sessions',
  },
  {
    id: 'focus-ambient',
    title: 'Belajar Tenang 15 Menit',
    description: 'Catat progres setelah menyelesaikan 15 menit belajar tanpa distraksi.',
    category: 'fokus',
    difficulty: 'Mudah',
    target: 1,
    unit: 'sesi',
    xpReward: 40,
    trackingType: 'manual',
  },

  // Kuis & Evaluasi
  {
    id: 'quiz-1',
    title: 'Kerjakan 1 Paket Kuis / ASAS',
    description: 'Selesaikan minimal 1 paket latihan soal atau evaluasi di portal.',
    category: 'kuis',
    difficulty: 'Mudah',
    target: 1,
    unit: 'kuis',
    xpReward: 50,
    trackingType: 'quizzes_today',
  },
  {
    id: 'quiz-2',
    title: 'Tantangan 2 Paket Latihan',
    description: 'Uji konsistensimu dengan menyelesaikan 2 paket kuis hari ini.',
    category: 'kuis',
    difficulty: 'Tantangan',
    target: 2,
    unit: 'kuis',
    xpReward: 85,
    trackingType: 'quizzes_today',
  },
  {
    id: 'quiz-high',
    title: 'Raih Nilai ≥ 80 di Kuis',
    description: 'Dapatkan skor minimal 80% pada paket kuis yang kamu kerjakan hari ini.',
    category: 'kuis',
    difficulty: 'Menengah',
    target: 1,
    unit: 'kali',
    xpReward: 70,
    trackingType: 'high_score_quiz',
  },

  // Materi & Ringkasan (Manual step-based study tasks)
  {
    id: 'materi-rumus',
    title: 'Review 3 Rumus / Konsep Inti',
    description: 'Buka catatan dan ulangi 3 rumus penting atau konsep bab tersulit.',
    category: 'materi',
    difficulty: 'Mudah',
    target: 3,
    unit: 'konsep',
    xpReward: 45,
    trackingType: 'manual',
  },
  {
    id: 'materi-rangkum',
    title: 'Buat Ringkasan 1 Bab Pelajaran',
    description: 'Tulis poin-poin inti dari 1 bab mata pelajaran favoritmu hari ini.',
    category: 'materi',
    difficulty: 'Menengah',
    target: 1,
    unit: 'bab',
    xpReward: 55,
    trackingType: 'manual',
  },
  {
    id: 'materi-latihan-mandiri',
    title: 'Bahas 5 Soal Sulit Secara Mandiri',
    description: 'Catat setiap soal latihan yang berhasil kamu pahami pembahasannya.',
    category: 'materi',
    difficulty: 'Menengah',
    target: 5,
    unit: 'soal',
    xpReward: 65,
    trackingType: 'manual',
  },
  {
    id: 'materi-flashcard',
    title: 'Hafalkan 3 Istilah / Kosakata Baru',
    description: 'Latih daya ingat untuk istilah sains, sejarah, atau Bahasa Inggris.',
    category: 'materi',
    difficulty: 'Mudah',
    target: 3,
    unit: 'istilah',
    xpReward: 40,
    trackingType: 'manual',
  },

  // Eksplorasi Platform
  {
    id: 'eksplorasi-portal',
    title: 'Kunjungi Portal Materi / ASAS XII',
    description: 'Buka Portal Akademik untuk mengecek materi atau riwayat latihanmu.',
    category: 'eksplorasi',
    difficulty: 'Mudah',
    target: 1,
    unit: 'kali',
    xpReward: 35,
    trackingType: 'portal_visit',
  },
  {
    id: 'eksplorasi-wardrobe',
    title: 'Kustomisasi Kostum Avatar',
    description: 'Buka lemari avatar astronot dan sesuaikan gaya belajarmu.',
    category: 'eksplorasi',
    difficulty: 'Mudah',
    target: 1,
    unit: 'kali',
    xpReward: 35,
    trackingType: 'wardrobe_visit',
  },
];

export function getLocalDateKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getPreviousDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() - 1);
  return getLocalDateKey(dt);
}

/**
 * Deterministic string hash (FNV-1a 32-bit) for stable daily mission shuffling.
 */
function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle<T>(items: readonly T[], seedKey: string): T[] {
  const arr = [...items];
  let state = hashString(seedKey) || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/**
 * Picks 4 balanced daily missions (one from each category when possible)
 * deterministically from `dateKey` and `rotationSeed`.
 */
export function selectDailyMissionIds(
  dateKey: string,
  rotationSeed: number = 0,
  excludeIds: string[] = []
): string[] {
  const excluded = new Set(excludeIds);
  const categories: MissionCategory[] = ['fokus', 'kuis', 'materi', 'eksplorasi'];
  const picked: string[] = [];

  for (const cat of categories) {
    const candidates = MISSION_POOL.filter((m) => m.category === cat && !excluded.has(m.id));
    const fallback = MISSION_POOL.filter((m) => m.category === cat);
    const pool = candidates.length > 0 ? candidates : fallback;
    const shuffled = seededShuffle(pool, `${dateKey}:${rotationSeed}:${cat}`);
    if (shuffled[0]) {
      picked.push(shuffled[0].id);
    }
  }

  // Ensure exact slot count if pool ever shrinks
  if (picked.length < DAILY_MISSION_SLOTS) {
    const rest = seededShuffle(
      MISSION_POOL.filter((m) => !picked.includes(m.id)),
      `${dateKey}:${rotationSeed}:fill`
    );
    for (const item of rest) {
      if (picked.length >= DAILY_MISSION_SLOTS) break;
      picked.push(item.id);
    }
  }

  return picked.slice(0, DAILY_MISSION_SLOTS);
}

export function createDailyMissionState(
  dateKey: string,
  prev?: Partial<DailyMissionState> | null
): DailyMissionState {
  const yesterday = getPreviousDateKey(dateKey);
  const preservedStreak =
    prev?.lastCompletedDate === dateKey || prev?.lastCompletedDate === yesterday
      ? Math.max(0, Number(prev?.streakDays) || 0)
      : 0;

  return {
    date: dateKey,
    rotationSeed: 0,
    activeMissionIds: selectDailyMissionIds(dateKey, 0),
    manualProgress: {},
    claimedIds: [],
    bonusClaimed: false,
    rerollsRemaining: MAX_DAILY_REROLLS,
    focusSessionsToday: 0,
    portalVisitsToday: 0,
    wardrobeVisitsToday: 0,
    streakDays: preservedStreak,
    lastCompletedDate: prev?.lastCompletedDate ?? null,
    totalClaimedXp: Math.max(0, Number(prev?.totalClaimedXp) || 0),
  };
}

export function syncStateForDate(
  state: DailyMissionState | null | undefined,
  todayKey: string
): DailyMissionState {
  if (!state || state.date !== todayKey || !Array.isArray(state.activeMissionIds) || state.activeMissionIds.length === 0) {
    return createDailyMissionState(todayKey, state);
  }
  return state;
}

export function resolveDailyMissions(
  state: DailyMissionState,
  activity: ActivitySnapshot
): ResolvedDailyMission[] {
  const templateById = new Map(MISSION_POOL.map((m) => [m.id, m]));
  return state.activeMissionIds
    .map((id) => templateById.get(id))
    .filter((m): m is MissionTemplate => Boolean(m))
    .map((mission) => {
      let rawProgress = 0;
      switch (mission.trackingType) {
        case 'focus_sessions':
          rawProgress = state.focusSessionsToday;
          break;
        case 'quizzes_today':
          rawProgress = activity.quizzesToday;
          break;
        case 'high_score_quiz':
          rawProgress = activity.highScoreQuizzesToday;
          break;
        case 'portal_visit':
          rawProgress = state.portalVisitsToday;
          break;
        case 'wardrobe_visit':
          rawProgress = state.wardrobeVisitsToday;
          break;
        case 'manual':
        default:
          rawProgress = state.manualProgress[mission.id] || 0;
          break;
      }

      const progress = Math.min(mission.target, Math.max(0, Math.floor(rawProgress)));
      const isCompleted = progress >= mission.target;
      const isClaimed = state.claimedIds.includes(mission.id);
      const progressPercent = Math.min(100, Math.round((progress / Math.max(1, mission.target)) * 100));

      return {
        ...mission,
        progress,
        isCompleted,
        isClaimed,
        progressPercent,
      };
    });
}

export function incrementManualMissionProgress(
  state: DailyMissionState,
  missionId: string
): DailyMissionState {
  const template = MISSION_POOL.find((m) => m.id === missionId);
  if (!template || template.trackingType !== 'manual') return state;
  const current = state.manualProgress[missionId] || 0;
  if (current >= template.target) return state;
  return {
    ...state,
    manualProgress: {
      ...state.manualProgress,
      [missionId]: current + 1,
    },
  };
}

export function claimMissionReward(
  state: DailyMissionState,
  missionId: string,
  activity: ActivitySnapshot
): { state: DailyMissionState; xpAwarded: number } {
  const resolved = resolveDailyMissions(state, activity);
  const target = resolved.find((m) => m.id === missionId);
  if (!target || !target.isCompleted || target.isClaimed) {
    return { state, xpAwarded: 0 };
  }

  const nextClaimedIds = [...state.claimedIds, missionId];
  let nextStreak = state.streakDays;
  let nextLastCompleted = state.lastCompletedDate;

  if (state.lastCompletedDate !== state.date) {
    const yesterday = getPreviousDateKey(state.date);
    nextStreak = state.lastCompletedDate === yesterday ? state.streakDays + 1 : 1;
    nextLastCompleted = state.date;
  }

  return {
    xpAwarded: target.xpReward,
    state: {
      ...state,
      claimedIds: nextClaimedIds,
      streakDays: nextStreak,
      lastCompletedDate: nextLastCompleted,
      totalClaimedXp: state.totalClaimedXp + target.xpReward,
    },
  };
}

export function claimAllMissionsBonus(
  state: DailyMissionState,
  activity: ActivitySnapshot
): { state: DailyMissionState; xpAwarded: number } {
  if (state.bonusClaimed) return { state, xpAwarded: 0 };
  const resolved = resolveDailyMissions(state, activity);
  const allClaimed = resolved.length === DAILY_MISSION_SLOTS && resolved.every((m) => m.isClaimed);
  if (!allClaimed) return { state, xpAwarded: 0 };

  return {
    xpAwarded: ALL_MISSIONS_BONUS_XP,
    state: {
      ...state,
      bonusClaimed: true,
      totalClaimedXp: state.totalClaimedXp + ALL_MISSIONS_BONUS_XP,
    },
  };
}

/**
 * Replaces a single unclaimed mission with a fresh one not currently active.
 */
export function swapSingleMission(
  state: DailyMissionState,
  missionId: string
): DailyMissionState {
  if (state.rerollsRemaining <= 0) return state;
  if (state.claimedIds.includes(missionId)) return state;
  const idx = state.activeMissionIds.indexOf(missionId);
  if (idx === -1) return state;

  const activeSet = new Set(state.activeMissionIds);
  const currentTemplate = MISSION_POOL.find((m) => m.id === missionId);
  const nextSeed = state.rotationSeed + 1;

  // Prefer same category first, then any unused mission from the pool
  const sameCategoryPool = MISSION_POOL.filter(
    (m) => m.category === currentTemplate?.category && !activeSet.has(m.id)
  );
  const anyOtherPool = MISSION_POOL.filter((m) => !activeSet.has(m.id));
  const pool = sameCategoryPool.length > 0 ? sameCategoryPool : anyOtherPool;
  if (pool.length === 0) return state;

  const replacement = seededShuffle(pool, `${state.date}:${nextSeed}:swap:${missionId}`)[0];
  if (!replacement) return state;

  const nextActive = [...state.activeMissionIds];
  nextActive[idx] = replacement.id;

  return {
    ...state,
    rotationSeed: nextSeed,
    activeMissionIds: nextActive,
    rerollsRemaining: state.rerollsRemaining - 1,
  };
}

/**
 * Rotates all unclaimed missions to a new set while preserving already-claimed slots.
 */
export function rerollUnclaimedMissions(state: DailyMissionState): DailyMissionState {
  if (state.rerollsRemaining <= 0) return state;
  const hasUnclaimed = state.activeMissionIds.some((id) => !state.claimedIds.includes(id));
  if (!hasUnclaimed) return state;

  const nextSeed = state.rotationSeed + 1;
  const freshSet = selectDailyMissionIds(state.date, nextSeed, state.activeMissionIds);
  const used = new Set<string>(state.claimedIds);
  const nextActive: string[] = [];

  let freshIdx = 0;
  for (const id of state.activeMissionIds) {
    if (state.claimedIds.includes(id)) {
      nextActive.push(id);
      continue;
    }
    let replacement: string | undefined;
    while (freshIdx < freshSet.length) {
      const candidate = freshSet[freshIdx++];
      if (!used.has(candidate)) {
        replacement = candidate;
        break;
      }
    }
    if (!replacement) {
      const fallback = seededShuffle(
        MISSION_POOL.filter((m) => !used.has(m.id) && m.id !== id),
        `${state.date}:${nextSeed}:fallback:${id}`
      )[0];
      replacement = fallback?.id ?? id;
    }
    used.add(replacement);
    nextActive.push(replacement);
  }

  return {
    ...state,
    rotationSeed: nextSeed,
    activeMissionIds: nextActive,
    rerollsRemaining: state.rerollsRemaining - 1,
  };
}

export function formatTimeUntilMidnight(now: Date = new Date()): string {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffSec = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  return `${String(hours).padStart(2, '0')}j ${String(mins).padStart(2, '0')}m`;
}
