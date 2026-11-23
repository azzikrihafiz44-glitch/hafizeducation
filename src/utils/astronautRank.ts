export interface AstronautRankInfo {
  title: string;
  level: number;
  xp: number;
  nextRankXp: number;
  progressPercent: number;
  accentColor: string;
}

const RANK_TIERS = [
  { minXp: 0, title: 'Kadet Antariksa', level: 1, nextXp: 200, accentColor: '#7dd3fc' },
  { minXp: 200, title: 'Navigator Bintang', level: 2, nextXp: 500, accentColor: '#818cf8' },
  { minXp: 500, title: 'Pilot Nebula', level: 3, nextXp: 1000, accentColor: '#2dd4bf' },
  { minXp: 1000, title: 'Komandan Galaksi', level: 4, nextXp: 2000, accentColor: '#c084fc' },
  { minXp: 2000, title: 'Laksamana Kosmik', level: 5, nextXp: 2000, accentColor: '#fde047' },
] as const;

export function calculateAstronautRank(
  completedQuizzes: number,
  totalQuizPoints: number,
  focusSessionsCompleted: number,
  dailyMissionsChecked: number,
  missionBonusXp: number = 0
): AstronautRankInfo {
  const safeQuizzes = Math.max(0, Math.floor(completedQuizzes));
  const safePoints = Math.max(0, Math.floor(totalQuizPoints));
  const safeFocus = Math.max(0, Math.floor(focusSessionsCompleted));
  const safeMissions = Math.max(0, Math.floor(dailyMissionsChecked));
  const safeMissionBonus = Math.max(0, Math.floor(missionBonusXp));

  const xp =
    safeQuizzes * 120 +
    Math.floor(safePoints / 10) +
    safeFocus * 100 +
    safeMissions * 40 +
    safeMissionBonus;

  let current: (typeof RANK_TIERS)[number] = RANK_TIERS[0];
  for (const tier of RANK_TIERS) {
    if (xp >= tier.minXp) {
      current = tier;
    }
  }

  const isMax = current.level === RANK_TIERS[RANK_TIERS.length - 1].level;
  const span = Math.max(1, current.nextXp - current.minXp);
  const progressPercent = isMax
    ? 100
    : Math.min(100, Math.max(0, Math.round(((xp - current.minXp) / span) * 100)));

  return {
    title: current.title,
    level: current.level,
    xp,
    nextRankXp: current.nextXp,
    progressPercent,
    accentColor: current.accentColor,
  };
}

export function formatCountdownMMSS(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
