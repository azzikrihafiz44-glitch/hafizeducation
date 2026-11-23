export type QuizScheduleState = 'open' | 'not_yet_open' | 'closed';

export interface QuizScheduleStatus {
  state: QuizScheduleState;
  isLocked: boolean;
  isClosed: boolean;
  isNotYetOpen: boolean;
  openTimestamp: number | null;
  closeTimestamp: number | null;
  remainingMs: number;
  formattedDate: string;
  formattedCloseDate: string;
  countdownLabel: string;
}

export interface ScheduleDateParts {
  day: number; // 1..31
  month: number; // 1..12
  year: number; // e.g. 2020..2040
  hour: number; // 0..23
  minute: number; // 0..59
}

export const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

/**
 * Returns the exact number of days in a given 1-indexed month and year (leap-year aware).
 */
export function getDaysInMonth(year: number, month: number): number {
  const safeMonth = Math.max(1, Math.min(12, Math.floor(month)));
  return new Date(year, safeMonth, 0).getDate();
}

/**
 * Composes explicit day, month, year, hour, minute parts into `YYYY-MM-DDTHH:mm`,
 * automatically clamping invalid days (e.g. Feb 31 -> Feb 28/29).
 */
export function composeScheduleParts(parts: ScheduleDateParts): string {
  const year = Math.max(2020, Math.min(2040, Math.floor(parts.year)));
  const month = Math.max(1, Math.min(12, Math.floor(parts.month)));
  const maxDay = getDaysInMonth(year, month);
  const day = Math.max(1, Math.min(maxDay, Math.floor(parts.day)));
  const hour = Math.max(0, Math.min(23, Math.floor(parts.hour)));
  const minute = Math.max(0, Math.min(59, Math.floor(parts.minute)));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

/**
 * Decomposes a `YYYY-MM-DDTHH:mm` string into explicit day, month, year, hour, minute parts.
 */
export function decomposeScheduleParts(localDateTimeValue: string): ScheduleDateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(localDateTimeValue.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return null;
  }
  return { year, month, day, hour, minute };
}

/**
 * Converts an HTML `YYYY-MM-DDTHH:mm` value into a standard ISO-8601 string, or undefined if empty/invalid.
 */
export function parseOpenAtInput(localDateTimeValue: string): string | undefined {
  const trimmed = localDateTimeValue.trim();
  if (!trimmed) return undefined;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

/**
 * Formats an ISO-8601 string into `YYYY-MM-DDTHH:mm` in local time.
 */
export function toDateTimeLocalInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return composeScheduleParts({
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    hour: d.getHours(),
    minute: d.getMinutes(),
  });
}

/**
 * Formats an ISO date into a readable Indonesian schedule string,
 * e.g. "14 Nov 2026, 08:00".
 */
export function formatQuizScheduleDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDurationCountdown(ms: number): string {
  const totalMinutes = Math.ceil(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0 ? `${days} hari ${hours} jam` : `${days} hari`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours} jam ${minutes} mnt` : `${hours} jam`;
  }
  return `${Math.max(1, minutes)} menit`;
}

/**
 * Evaluates whether a quiz room is currently open, not yet open (`openAt`), or closed (`closeAt`).
 */
export function getQuizScheduleStatus(
  openAt?: string,
  nowMs: number = Date.now(),
  closeAt?: string
): QuizScheduleStatus {
  const rawOpenTs = openAt ? new Date(openAt).getTime() : NaN;
  const openTimestamp = !Number.isNaN(rawOpenTs) ? rawOpenTs : null;
  const formattedDate = openTimestamp !== null && openAt ? formatQuizScheduleDate(openAt) : '';

  const rawCloseTs = closeAt ? new Date(closeAt).getTime() : NaN;
  const closeTimestamp = !Number.isNaN(rawCloseTs) ? rawCloseTs : null;
  const formattedCloseDate =
    closeTimestamp !== null && closeAt ? formatQuizScheduleDate(closeAt) : '';

  // 1. Check if closed first if closeAt has already passed
  if (closeTimestamp !== null && nowMs >= closeTimestamp) {
    return {
      state: 'closed',
      isLocked: true,
      isClosed: true,
      isNotYetOpen: false,
      openTimestamp,
      closeTimestamp,
      remainingMs: 0,
      formattedDate,
      formattedCloseDate,
      countdownLabel: 'Sudah ditutup',
    };
  }

  // 2. Check if not yet open
  if (openTimestamp !== null && nowMs < openTimestamp) {
    const remainingMs = Math.max(0, openTimestamp - nowMs);
    return {
      state: 'not_yet_open',
      isLocked: true,
      isClosed: false,
      isNotYetOpen: true,
      openTimestamp,
      closeTimestamp,
      remainingMs,
      formattedDate,
      formattedCloseDate,
      countdownLabel: `${formatDurationCountdown(remainingMs)} lagi`,
    };
  }

  // 3. Currently open (optionally with an upcoming close deadline)
  if (closeTimestamp !== null && closeTimestamp > nowMs) {
    const remainingToCloseMs = Math.max(0, closeTimestamp - nowMs);
    return {
      state: 'open',
      isLocked: false,
      isClosed: false,
      isNotYetOpen: false,
      openTimestamp,
      closeTimestamp,
      remainingMs: remainingToCloseMs,
      formattedDate,
      formattedCloseDate,
      countdownLabel: `Tutup dalam ${formatDurationCountdown(remainingToCloseMs)}`,
    };
  }

  return {
    state: 'open',
    isLocked: false,
    isClosed: false,
    isNotYetOpen: false,
    openTimestamp,
    closeTimestamp,
    remainingMs: 0,
    formattedDate,
    formattedCloseDate,
    countdownLabel: openTimestamp !== null ? 'Sudah dibuka' : '',
  };
}
