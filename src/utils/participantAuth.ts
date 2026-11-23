import type { AvatarConfig } from '../types/quiz';

export type ParticipantTargetTrack = 'utbk' | 'kedinasan' | 'both';

export interface SavedSkdSummary {
  twk: number;
  tiu: number;
  tkp: number;
  total: number;
  passedAllPg: boolean;
  recommendedSchool?: string;
}

export type ParticipantAuthMethod = 'password' | 'google' | 'email';

export interface ParticipantProfilePayload {
  uid: string;
  username?: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  school: string;
  phone: string;
  targetTrack: ParticipantTargetTrack;
  targetCampus: string;
  authMethod: ParticipantAuthMethod;
  savedSkdSummary?: SavedSkdSummary;
  avatar: AvatarConfig;
  updatedAt?: string;
}

export interface RegistrationFormInput {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  school?: string;
}

export interface PasswordOnlyRegistrationInput {
  displayName: string;
  username?: string;
  password: string;
  confirmPassword: string;
}

export interface UsernamePasswordLoginInput {
  identifier: string;
  password: string;
}

export interface LoginFormInput {
  email: string;
  password: string;
}

export function normalizeParticipantUsername(raw: string): string {
  const cleaned = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 32);
  return cleaned;
}

export function sanitizeParticipantPhotoUrl(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^\/api\/participant-photos\/[a-zA-Z0-9._-]{4,160}$/.test(trimmed)) {
    return trimmed;
  }
  if (
    /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]{16,380000}$/i.test(trimmed)
  ) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:') {
      return parsed.toString().slice(0, 500);
    }
  } catch {
    return '';
  }
  return '';
}

export function validatePasswordOnlyRegistration(input: PasswordOnlyRegistrationInput): {
  valid: boolean;
  error?: string;
} {
  const name = String(input.displayName || '').trim();
  const username = normalizeParticipantUsername(input.username || name);
  const pw = String(input.password || '');
  const confirm = String(input.confirmPassword || '');

  if (name.length < 2) {
    return { valid: false, error: 'Nama lengkap peserta minimal 2 karakter.' };
  }
  if (username.length < 3) {
    return {
      valid: false,
      error: 'Username atau nama akun minimal 3 karakter huruf/angka.',
    };
  }
  if (pw.length < 4) {
    return { valid: false, error: 'Kata sandi minimal 4 karakter.' };
  }
  if (pw !== confirm) {
    return { valid: false, error: 'Konfirmasi kata sandi tidak cocok.' };
  }
  return { valid: true };
}

export function validateUsernamePasswordLogin(input: UsernamePasswordLoginInput): {
  valid: boolean;
  error?: string;
} {
  const identifier = String(input.identifier || '').trim();
  const pw = String(input.password || '');
  if (identifier.length < 2) {
    return { valid: false, error: 'Masukkan Nama Lengkap atau Username akun kamu.' };
  }
  if (pw.length < 4) {
    return { valid: false, error: 'Masukkan kata sandi minimal 4 karakter.' };
  }
  return { valid: true };
}

export function validateRegistrationForm(input: RegistrationFormInput): {
  valid: boolean;
  error?: string;
} {
  const name = input.displayName.trim();
  const email = input.email.trim();
  const pw = input.password;
  const confirm = input.confirmPassword;

  if (name.length < 2) {
    return { valid: false, error: 'Nama lengkap peserta minimal 2 karakter.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: 'Format alamat email tidak valid.' };
  }
  if (pw.length < 6) {
    return { valid: false, error: 'Kata sandi minimal 6 karakter.' };
  }
  if (pw !== confirm) {
    return { valid: false, error: 'Konfirmasi kata sandi tidak cocok.' };
  }
  return { valid: true };
}

export function validateLoginForm(input: LoginFormInput): {
  valid: boolean;
  error?: string;
} {
  const email = input.email.trim();
  const pw = input.password;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: 'Masukkan alamat email yang valid.' };
  }
  if (!pw || pw.length < 6) {
    return { valid: false, error: 'Masukkan kata sandi minimal 6 karakter.' };
  }
  return { valid: true };
}

export function sanitizeParticipantProfileMeta(meta?: {
  username?: string;
  photoUrl?: string;
  school?: string;
  phone?: string;
  targetTrack?: string;
  targetCampus?: string;
  authMethod?: string;
  savedSkdSummary?: Partial<SavedSkdSummary>;
}) {
  const track: ParticipantTargetTrack =
    meta?.targetTrack === 'kedinasan' || meta?.targetTrack === 'both'
      ? meta.targetTrack
      : 'utbk';

  const authMethod: ParticipantAuthMethod =
    meta?.authMethod === 'password'
      ? 'password'
      : meta?.authMethod === 'email'
        ? 'email'
        : 'google';

  const cleanSkd = meta?.savedSkdSummary
    ? {
        twk: Math.max(0, Math.min(150, Math.round(Number(meta.savedSkdSummary.twk ?? 0)))),
        tiu: Math.max(0, Math.min(175, Math.round(Number(meta.savedSkdSummary.tiu ?? 0)))),
        tkp: Math.max(0, Math.min(225, Math.round(Number(meta.savedSkdSummary.tkp ?? 0)))),
        total: Math.max(0, Math.min(550, Math.round(Number(meta.savedSkdSummary.total ?? 0)))),
        passedAllPg: Boolean(meta.savedSkdSummary.passedAllPg),
        recommendedSchool: String(meta.savedSkdSummary.recommendedSchool ?? '')
          .trim()
          .slice(0, 120),
      }
    : undefined;

  return {
    username: normalizeParticipantUsername(meta?.username || ''),
    photoUrl: sanitizeParticipantPhotoUrl(meta?.photoUrl || ''),
    school: String(meta?.school ?? '').trim().slice(0, 120),
    phone: String(meta?.phone ?? '').trim().slice(0, 24),
    targetTrack: track,
    targetCampus: String(meta?.targetCampus ?? '').trim().slice(0, 120),
    authMethod,
    savedSkdSummary: cleanSkd,
  };
}

export function formatFirebaseAuthErrorIndonesian(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('auth/email-already-in-use')) {
    return 'Email ini sudah terdaftar. Silakan masuk menggunakan tab Masuk atau Login dengan Google.';
  }
  if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
    return 'Email atau kata sandi salah. Periksa kembali atau klik Lupa Kata Sandi.';
  }
  if (msg.includes('auth/weak-password')) {
    return 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter kombinasi huruf & angka.';
  }
  if (msg.includes('auth/invalid-email')) {
    return 'Format alamat email tidak valid.';
  }
  if (msg.includes('auth/operation-not-allowed')) {
    return 'Provider Email/Password belum diaktifkan di Firebase Console. Gunakan pendaftaran Nama + Kata Sandi atau Login Google.';
  }
  if (msg.includes('auth/popup-closed-by-user') || msg.includes('auth/cancelled-popup-request')) {
    return 'Pop-up login Google ditutup sebelum selesai.';
  }
  if (msg.includes('auth/too-many-requests')) {
    return 'Terlalu banyak percobaan login. Silakan tunggu beberapa menit sebelum mencoba lagi.';
  }
  return 'Terjadi kendala saat autentikasi. Coba lagi.';
}
