import * as XLSX from 'xlsx';
import type { AvatarConfig, HistoryRecord, QuizRoom } from '../types/quiz';
import { DEFAULT_AVATAR } from '../data/wardrobeCatalog';
import { DEFAULT_ROOM } from '../data/defaultQuiz';
import { generateSystemPassword, sha256Hex } from './quizLogic';

const KEYS = {
  AVATAR: 'hfz_edu_avatar_v1',
  ROOMS: 'hfz_edu_rooms_v1',
  ACTIVE_ROOM_CODE: 'hfz_edu_active_room_v1',
  HISTORY: 'hfz_edu_history_v1',
  ADMIN_PW_PLAIN: 'hfz_edu_admin_pw_plain_v1',
  ADMIN_PW_HASH: 'hfz_edu_admin_pw_hash_v1',
  WEBHOOK_URL: 'hfz_edu_gas_webhook_v1',
  PLAYER_NAME: 'hfz_edu_player_name_v1',
};

export function loadAvatarConfig(): AvatarConfig {
  try {
    const raw = localStorage.getItem(KEYS.AVATAR);
    if (!raw) return DEFAULT_AVATAR;
    return { ...DEFAULT_AVATAR, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_AVATAR;
  }
}

export function saveAvatarConfig(cfg: AvatarConfig): void {
  try {
    localStorage.setItem(KEYS.AVATAR, JSON.stringify(cfg));
  } catch {
    // ignore quota errors
  }
}

export function loadPlayerName(): string {
  try {
    return localStorage.getItem(KEYS.PLAYER_NAME) ?? '';
  } catch {
    return '';
  }
}

export function savePlayerName(name: string): void {
  try {
    localStorage.setItem(KEYS.PLAYER_NAME, name);
  } catch {
    // ignore
  }
}

export function loadRooms(): Record<string, QuizRoom> {
  try {
    const raw = localStorage.getItem(KEYS.ROOMS);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, QuizRoom>;
    if (parsed[DEFAULT_ROOM.code]) {
      delete parsed[DEFAULT_ROOM.code];
    }
    return parsed;
  } catch {
    return {};
  }
}

export function saveRooms(rooms: Record<string, QuizRoom>): void {
  try {
    localStorage.setItem(KEYS.ROOMS, JSON.stringify(rooms));
  } catch {
    // ignore
  }
}

export function loadActiveRoomCode(): string {
  try {
    return localStorage.getItem(KEYS.ACTIVE_ROOM_CODE) || DEFAULT_ROOM.code;
  } catch {
    return DEFAULT_ROOM.code;
  }
}

export function saveActiveRoomCode(code: string): void {
  try {
    localStorage.setItem(KEYS.ACTIVE_ROOM_CODE, code);
  } catch {
    // ignore
  }
}

export function loadHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(records: HistoryRecord[]): void {
  try {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(records));
  } catch {
    // ignore
  }
}

export async function ensureSystemPassword(): Promise<{ plain: string; hash: string }> {
  try {
    // Clean up any legacy plaintext password previously stored in localStorage
    localStorage.removeItem(KEYS.ADMIN_PW_PLAIN);
    const existingHash = localStorage.getItem(KEYS.ADMIN_PW_HASH);
    if (existingHash && existingHash.length === 64) {
      return { plain: '', hash: existingHash };
    }
  } catch {
    // ignore
  }
  return regenerateStoredSystemPassword();
}

export async function regenerateStoredSystemPassword(): Promise<{ plain: string; hash: string }> {
  const plain = generateSystemPassword();
  const hash = await sha256Hex(plain);
  try {
    localStorage.removeItem(KEYS.ADMIN_PW_PLAIN);
    localStorage.setItem(KEYS.ADMIN_PW_HASH, hash);
  } catch {
    // ignore
  }
  return { plain, hash };
}

export function loadWebhookUrl(): string {
  try {
    return localStorage.getItem(KEYS.WEBHOOK_URL) ?? '';
  } catch {
    return '';
  }
}

export function saveWebhookUrl(url: string): void {
  try {
    localStorage.setItem(KEYS.WEBHOOK_URL, url.trim());
  } catch {
    // ignore
  }
}

export function exportHistoryToExcel(records: HistoryRecord[], filenamePrefix = 'Rekap_Nilai_Hafiz_Education'): void {
  const rows = records.map((rec, index) => ({
    No: index + 1,
    Waktu: new Date(rec.timestamp).toLocaleString('id-ID'),
    'Kode Room': rec.roomCode,
    'Judul Kuis': rec.quizTitle,
    'Nama Peserta': rec.playerName,
    'Nilai (0-100)': rec.grade,
    'Total Poin': rec.points,
    'Jawaban Benar': `${rec.correctCount}/${rec.totalQuestions}`,
    Peringkat: `#${rec.rank}`,
    'ID Sertifikat': rec.certificateId,
  }));

  const ws = XLSX.utils.json_to_sheet(
    rows.length > 0
      ? rows
      : [{ Info: 'Belum ada data peserta yang menyelesaikan kuis.' }]
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Nilai');
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filenamePrefix}_${stamp}.xlsx`);
}

export async function syncRecordToWebhook(webhookUrl: string, record: HistoryRecord): Promise<boolean> {
  if (!webhookUrl) return false;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveResult', payload: record }),
    });
    return true;
  } catch {
    return false;
  }
}
