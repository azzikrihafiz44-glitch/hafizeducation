import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes
const ADMIN_EMAIL = 'jikikuki41@gmail.com';
const UPLOADS_ROOT = path.resolve(__dirname, 'uploads');
fs.mkdirSync(UPLOADS_ROOT, { recursive: true });

function loadOrCreateSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32) {
    return process.env.SESSION_SECRET;
  }
  const secretPath = path.resolve(UPLOADS_ROOT, '.session-secret');
  try {
    if (fs.existsSync(secretPath)) {
      const existing = fs.readFileSync(secretPath, 'utf-8').trim();
      if (existing.length >= 32) return existing;
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretPath, generated, { mode: 0o600 });
    return generated;
  } catch {
    return crypto.randomBytes(32).toString('hex');
  }
}

const SERVER_SESSION_SECRET = loadOrCreateSessionSecret();

const BLOCKED_SCRIPT_UA_REGEX =
  /(?:curl|wget|python-requests|python-urllib|aiohttp|httpx|axios|node-fetch|undici|postmanruntime|insomnia|httpie|scrapy|go-http-client|java\/|powershell|vscode|rest-client|libwww-perl|ruby|php)/i;

interface ParsedQuizQuestionBBox {
  page: number;
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

interface ParsedQuizQuestion {
  id: string;
  question: string;
  choices: [string, string, string, string, string];
  correctIndex: number;
  explanation: string;
  imageBBox?: ParsedQuizQuestionBBox;
}

interface StoredParticipantRecord {
  uid: string;
  username: string;
  displayName: string;
  email: string;
  photoUrl: string;
  school: string;
  phone: string;
  targetTrack: 'utbk' | 'kedinasan' | 'both';
  targetCampus: string;
  authMethod: 'password' | 'google' | 'email';
  passwordHash?: string;
  savedSkdSummary?: {
    twk: number;
    tiu: number;
    tkp: number;
    total: number;
    passedAllPg: boolean;
    recommendedSchool?: string;
  };
  avatar: {
    characterId: string;
    skinColor: string;
    hairId: string;
    topId: string;
    bottomId: string;
    shoeId?: string;
    accessoryId: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface StoredRoomStatusEntry {
  status: 'waiting' | 'started';
  updatedAt: string;
}

interface LiveLobbyPlayerEntry {
  id: string;
  name: string;
  avatar: StoredParticipantRecord['avatar'];
  avatarLabel: string;
  photoUrl?: string;
  lastSeen: number;
}

const QUIZ_EXTRACTION_PROMPT = `Anda adalah sistem ekstraksi soal ujian profesional untuk Hafiz Education.
Tugas Anda: baca dokumen, gambar, atau teks soal yang diberikan dan ekstrak SEMUA soal pilihan ganda secara akurat.

ATURAN WAJIB:
1. Pertahankan teks PERTANYAAN, PILIHAN JAWABAN (A, B, C, D, E), KUNCI JAWABAN, dan PEMBAHASAN persis seperti yang ada di file sumber.
2. Jika file memiliki kunci jawaban terpisah (misalnya di bawah setiap soal seperti "Jawaban: B", "Kunci: C", tanda bintang *, cetak tebal, tanda centang, atau daftar kunci jawaban di akhir dokumen), petakan dengan tepat ke correctIndex (0=A, 1=B, 2=C, 3=D, 4=E).
3. Jika file sudah menyertakan pembahasan / penjelasan / solusi / alasan, salin pembahasan tersebut dengan lengkap ke field explanation.
4. Jika file TIDAK menyertakan kunci jawaban atau pembahasan pada suatu soal, tentukan jawaban yang paling benar secara akademis dan tulis pembahasan singkat yang jelas dalam bahasa Indonesia.
5. Setiap soal harus memiliki tepat 5 pilihan (choices array panjang 5 untuk A sampai E). Jika soal asli hanya punya 4 pilihan (A-D), isi pilihan ke-5 (E) dengan "Semua jawaban di atas salah" atau opsi pengecoh yang relevan secara kontekstual (jangan ubah correctIndex jika jawaban benar ada di A-D).
6. SANGAT PENTING: Jumlah soal yang dihasilkan WAJIB SAMA PERSIS dengan jumlah seluruh soal yang ada di file yang diunggah. Jangan pernah melewati, menggabungkan, memotong, atau meringkas soal apa pun. Ekstrak semua soal dari nomor pertama hingga nomor terakhir secara lengkap.
7. JIKA teks sumber mengandung penanda gambar seperti [[IMG_0]], [[IMG_1]], dst., PERTAHANKAN token [[IMG_N]] tersebut secara persis di dalam field question soal yang bersangkutan agar sistem dapat mengunggah dan memasang gambarnya secara otomatis.
8. JIKA dokumen PDF atau gambar memiliki ilustrasi/gambar/grafik/diagram/peta/tabel/bangun geometri yang melekat pada sebuah soal, WAJIB sertakan field imageBBox berupa { page (nomor halaman mulai 1), ymin, xmin, ymax, xmax } dengan koordinat ternormalisasi 0 sampai 1000 yang melingkupi area gambar soal tersebut saja.`;

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/heic',
  'image/heif',
  'image/avif',
  'text/plain',
  'text/html',
  'text/csv',
  'text/markdown',
  'text/xml',
  'application/json',
  'application/rtf',
]);

// Sliding-window rate limiter + temporary ban for automated abuse
const rateLimitMap = new Map<string, number[]>();
const abuseViolationsMap = new Map<string, { count: number; bannedUntil: number }>();

function recordViolation(ip: string): void {
  const cur = abuseViolationsMap.get(ip) || { count: 0, bannedUntil: 0 };
  cur.count += 1;
  if (cur.count >= 6) {
    cur.bannedUntil = Date.now() + 5 * 60_000; // 5-minute ban
    cur.count = 0;
  }
  abuseViolationsMap.set(ip, cur);
}

function isIpBanned(ip: string): boolean {
  const cur = abuseViolationsMap.get(ip);
  return Boolean(cur && cur.bannedUntil > Date.now());
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const timestamps = (rateLimitMap.get(ip) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= 25) {
    rateLimitMap.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

function createSignedSessionToken(): string {
  const nonce = crypto.randomBytes(12).toString('hex');
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${nonce}.${exp}`;
  const sig = crypto
    .createHmac('sha256', SERVER_SESSION_SECRET)
    .update(payload)
    .digest('hex');
  return `${payload}.${sig}`;
}

function verifySignedSessionToken(token: string | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [nonce, expStr, providedSig] = parts;
  const exp = Number(expStr);
  if (!nonce || !Number.isFinite(exp) || Date.now() > exp) return false;
  const expectedSig = crypto
    .createHmac('sha256', SERVER_SESSION_SECRET)
    .update(`${nonce}.${expStr}`)
    .digest('hex');
  try {
    const a = Buffer.from(providedSig, 'hex');
    const b = Buffer.from(expectedSig, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function createSignedClaimToken(claim: Record<string, unknown>, ttlMs: number): string {
  const payloadObj = { ...claim, exp: Date.now() + ttlMs };
  const b64 = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SERVER_SESSION_SECRET)
    .update(b64)
    .digest('base64url');
  return `${b64}.${sig}`;
}

function verifySignedClaimToken(token: string | undefined): Record<string, unknown> | null {
  if (!token || typeof token !== 'string') return null;
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;
  const b64 = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!b64 || !sig) return null;
  const expected = crypto
    .createHmac('sha256', SERVER_SESSION_SECRET)
    .update(b64)
    .digest('base64url');
  try {
    const a = Buffer.from(sig, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const parsed = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8')) as Record<string, unknown>;
    const exp = Number(parsed.exp ?? 0);
    if (!Number.isFinite(exp) || Date.now() > exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

function parseCookies(req: express.Request): Record<string, string> {
  const header = String(req.headers.cookie || '');
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) {
      try {
        out[k] = decodeURIComponent(v);
      } catch {
        out[k] = v;
      }
    }
  }
  return out;
}

function buildSessionCookieHeader(name: string, value: string, maxAgeSec: number, req: express.Request): string {
  const isHttps =
    req.secure ||
    String(req.headers['x-forwarded-proto'] || '').toLowerCase().includes('https');
  const encoded = encodeURIComponent(value);
  if (isHttps) {
    return `${name}=${encoded}; Path=/; Max-Age=${maxAgeSec}; HttpOnly; SameSite=None; Secure; Partitioned`;
  }
  return `${name}=${encoded}; Path=/; Max-Age=${maxAgeSec}; HttpOnly; SameSite=Lax`;
}

function hashParticipantPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyParticipantPassword(password: string, storedHash: string | undefined): boolean {
  if (!storedHash || !password) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, hashHex] = parts;
  if (!salt || !hashHex) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hashHex, 'hex');
    return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function normalizeUsername(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 32);
}

function toPublicParticipant(rec: StoredParticipantRecord) {
  return {
    uid: rec.uid,
    username: rec.username,
    displayName: rec.displayName,
    email: rec.email,
    photoUrl: rec.photoUrl,
    school: rec.school,
    phone: rec.phone,
    targetTrack: rec.targetTrack,
    targetCampus: rec.targetCampus,
    authMethod: rec.authMethod,
    savedSkdSummary: rec.savedSkdSummary,
    avatar: rec.avatar,
    createdAt: rec.createdAt,
    updatedAt: rec.updatedAt,
  };
}

function isTrustedSameOriginBrowserRequest(req: express.Request): boolean {
  const ua = String(req.headers['user-agent'] || '');
  if (!ua || BLOCKED_SCRIPT_UA_REGEX.test(ua)) {
    return false;
  }

  const allowedHosts = new Set<string>();
  const addHosts = (raw: string | string[] | undefined) => {
    if (!raw) return;
    const str = Array.isArray(raw) ? raw.join(',') : raw;
    str
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .forEach((h) => allowedHosts.add(h));
  };
  addHosts(req.headers['host']);
  addHosts(req.headers['x-forwarded-host']);

  const origin = String(req.headers['origin'] || '').toLowerCase();
  const referer = String(req.headers['referer'] || '').toLowerCase();

  const matchesTrustedHost = (urlStr: string): boolean => {
    if (!urlStr) return false;
    try {
      const parsed = new URL(urlStr);
      const h = parsed.host.toLowerCase();
      const hn = parsed.hostname.toLowerCase();
      if (allowedHosts.has(h) || allowedHosts.has(hn)) return true;
      if (
        hn === 'localhost' ||
        hn === '127.0.0.1' ||
        hn === 'hafizeducation.my.id' ||
        hn.endsWith('.hafizeducation.my.id') ||
        hn.endsWith('.run.app') ||
        hn.endsWith('.googleusercontent.com') ||
        hn.endsWith('.web.app') ||
        hn.endsWith('.firebaseapp.com')
      ) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  if (origin && !matchesTrustedHost(origin)) return false;
  if (referer && !matchesTrustedHost(referer)) return false;

  return true;
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Hardened Security Headers Middleware
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  app.use(express.json({ limit: '35mb' }));

  const MATERIAL_UPLOADS_DIR = path.resolve(__dirname, 'uploads', 'materials');
  const QUESTION_IMAGES_DIR = path.resolve(__dirname, 'uploads', 'question-images');
  const PARTICIPANT_PHOTOS_DIR = path.resolve(__dirname, 'uploads', 'participant-photos');
  const PARTICIPANTS_DB_PATH = path.resolve(__dirname, 'uploads', 'participants-db.json');
  const ADMIN_AUTH_PATH = path.resolve(__dirname, 'uploads', 'admin-auth.json');
  const ROOM_STATUS_PATH = path.resolve(__dirname, 'uploads', 'room-status.json');
  const STORE_CONFIG_PATH = path.resolve(__dirname, 'uploads', 'store-config.json');
  fs.mkdirSync(MATERIAL_UPLOADS_DIR, { recursive: true });
  fs.mkdirSync(QUESTION_IMAGES_DIR, { recursive: true });
  fs.mkdirSync(PARTICIPANT_PHOTOS_DIR, { recursive: true });

  const DEFAULT_PARTICIPANT_AVATAR = {
    characterId: 'char-gadis-pita',
    skinColor: '#fde2cf',
    hairId: 'hair-twintails-pink',
    topId: 'top-sailor-pink',
    bottomId: 'bot-rok-lipit-pink',
    shoeId: 'shoe-sneaker-sakura',
    accessoryId: 'acc-pita-pink',
  };

  function readParticipantsDb(): StoredParticipantRecord[] {
    try {
      if (!fs.existsSync(PARTICIPANTS_DB_PATH)) return [];
      const parsed = JSON.parse(fs.readFileSync(PARTICIPANTS_DB_PATH, 'utf-8'));
      return Array.isArray(parsed) ? (parsed as StoredParticipantRecord[]) : [];
    } catch {
      return [];
    }
  }

  function writeParticipantsDb(records: StoredParticipantRecord[]): void {
    fs.writeFileSync(PARTICIPANTS_DB_PATH, JSON.stringify(records, null, 2));
  }

  function readRoomStatusMap(): Record<string, StoredRoomStatusEntry> {
    try {
      if (!fs.existsSync(ROOM_STATUS_PATH)) return {};
      const parsed = JSON.parse(fs.readFileSync(ROOM_STATUS_PATH, 'utf-8'));
      return parsed && typeof parsed === 'object'
        ? (parsed as Record<string, StoredRoomStatusEntry>)
        : {};
    } catch {
      return {};
    }
  }

  function writeRoomStatusMap(map: Record<string, StoredRoomStatusEntry>): void {
    fs.writeFileSync(ROOM_STATUS_PATH, JSON.stringify(map, null, 2));
  }

  const liveLobbyPlayersByRoom = new Map<string, Map<string, LiveLobbyPlayerEntry>>();

  function saveParticipantPhotoDataUrl(rawPhotoDataUrl: unknown): string | null {
    if (typeof rawPhotoDataUrl !== 'string' || !rawPhotoDataUrl.trim()) return null;
    const match = rawPhotoDataUrl
      .trim()
      .match(/^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=]+)$/i);
    if (!match) return null;
    const subtype = match[1].toLowerCase();
    const ext = subtype === 'jpeg' ? 'jpg' : subtype;
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length === 0 || buffer.length > 4 * 1024 * 1024) return null;
    const storedName = `pimg-${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const targetPath = path.resolve(PARTICIPANT_PHOTOS_DIR, storedName);
    if (!targetPath.startsWith(PARTICIPANT_PHOTOS_DIR + path.sep)) return null;
    fs.writeFileSync(targetPath, buffer);
    return `/api/participant-photos/${encodeURIComponent(storedName)}`;
  }

  function resolveAuthorizedParticipantUid(req: express.Request): string | null {
    const authHeader = String(req.headers.authorization || '');
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const cookies = parseCookies(req);
    const cookieToken = cookies['hafiz_part_sess'] || '';
    for (const candidate of [bearer, cookieToken]) {
      const claims = verifySignedClaimToken(candidate);
      if (claims && claims.role === 'participant' && typeof claims.uid === 'string') {
        return claims.uid;
      }
    }
    return null;
  }

  function isAuthorizedAdminRequest(req: express.Request): boolean {
    const adminToken = String(req.headers['x-hafiz-admin-token'] || '');
    const claims = verifySignedClaimToken(adminToken);
    return Boolean(claims && claims.role === 'admin');
  }

  function getFirebaseWebApiKey(): string {
    if (process.env.FIREBASE_WEB_API_KEY) return process.env.FIREBASE_WEB_API_KEY;
    try {
      const cfgPath = path.resolve(__dirname, 'firebase-applet-config.json');
      if (fs.existsSync(cfgPath)) {
        const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8')) as { apiKey?: string };
        return typeof cfg.apiKey === 'string' ? cfg.apiKey : '';
      }
    } catch {
      // ignore
    }
    return '';
  }

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'hafiz-education-server' });
  });

  // Serve uploaded participant profile photos
  app.get('/api/participant-photos/:storedName', (req, res) => {
    const rawStored = String(req.params.storedName || '');
    if (
      !/^pimg-[a-z0-9]+-[a-f0-9]+\.(png|jpe?g|webp|gif)$/i.test(rawStored) ||
      rawStored.includes('..')
    ) {
      res.status(400).json({ ok: false, error: 'Nama file foto tidak valid.' });
      return;
    }
    const targetPath = path.resolve(PARTICIPANT_PHOTOS_DIR, rawStored);
    if (!targetPath.startsWith(PARTICIPANT_PHOTOS_DIR + path.sep) || !fs.existsSync(targetPath)) {
      res.status(404).json({ ok: false, error: 'Foto peserta tidak ditemukan.' });
      return;
    }
    const ext = path.extname(rawStored).toLowerCase();
    const mime =
      ext === '.png'
        ? 'image/png'
        : ext === '.webp'
          ? 'image/webp'
          : ext === '.gif'
            ? 'image/gif'
            : 'image/jpeg';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `inline; filename="${rawStored}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(targetPath);
  });

  // Issue Admin HMAC token after Firebase Google Admin verification or Studio backup hash verification
  app.post('/api/admin/authorize', async (req, res) => {
    const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
    if (isIpBanned(clientIp) || !isTrustedSameOriginBrowserRequest(req)) {
      recordViolation(clientIp);
      res.status(403).json({ ok: false, error: 'Akses ditolak.' });
      return;
    }
    const signedToken = String(req.headers['x-hafiz-token'] || '');
    if (!verifySignedSessionToken(signedToken)) {
      recordViolation(clientIp);
      res.status(403).json({ ok: false, error: 'Token sesi tidak valid.' });
      return;
    }

    const body = (req.body || {}) as {
      method?: 'google' | 'studio';
      idToken?: string;
      passwordSha256?: string;
      bootstrapHash?: string;
    };

    if (body.method === 'google' && typeof body.idToken === 'string' && body.idToken.length > 20) {
      const apiKey = getFirebaseWebApiKey();
      if (!apiKey) {
        res.status(503).json({ ok: false, error: 'Konfigurasi Firebase Web API Key tidak ditemukan.' });
        return;
      }
      try {
        const lookupRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: body.idToken }),
          }
        );
        const lookupJson = (await lookupRes.json()) as {
          users?: Array<{ email?: string; emailVerified?: boolean; localId?: string }>;
        };
        const matched = lookupJson.users?.[0];
        if (
          matched &&
          matched.emailVerified &&
          String(matched.email || '').toLowerCase() === ADMIN_EMAIL
        ) {
          const adminToken = createSignedClaimToken(
            { role: 'admin', uid: matched.localId || 'google-admin', email: matched.email },
            4 * 60 * 60 * 1000
          );
          res.json({ ok: true, adminToken });
          return;
        }
        res.status(403).json({ ok: false, error: 'Akun Google bukan Admin terdaftar.' });
        return;
      } catch {
        res.status(502).json({ ok: false, error: 'Gagal memverifikasi token Google Admin.' });
        return;
      }
    }

    if (body.method === 'studio' && typeof body.passwordSha256 === 'string') {
      const incomingHash = body.passwordSha256.trim().toLowerCase();
      if (!/^[a-f0-9]{64}$/.test(incomingHash)) {
        res.status(400).json({ ok: false, error: 'Format verifikasi tidak valid.' });
        return;
      }
      let storedHash = '';
      try {
        if (fs.existsSync(ADMIN_AUTH_PATH)) {
          const saved = JSON.parse(fs.readFileSync(ADMIN_AUTH_PATH, 'utf-8')) as { backupSha256?: string };
          storedHash = String(saved.backupSha256 || '').toLowerCase();
        }
      } catch {
        storedHash = '';
      }
      if (!storedHash && typeof body.bootstrapHash === 'string' && /^[a-f0-9]{64}$/i.test(body.bootstrapHash)) {
        storedHash = body.bootstrapHash.trim().toLowerCase();
        fs.writeFileSync(ADMIN_AUTH_PATH, JSON.stringify({ backupSha256: storedHash }, null, 2), { mode: 0o600 });
      }
      if (storedHash) {
        const a = Buffer.from(incomingHash, 'hex');
        const b = Buffer.from(storedHash, 'hex');
        if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
          const adminToken = createSignedClaimToken(
            { role: 'admin', uid: 'studio-admin' },
            4 * 60 * 60 * 1000
          );
          res.json({ ok: true, adminToken });
          return;
        }
      }
    }

    recordViolation(clientIp);
    res.status(403).json({ ok: false, error: 'Kredensial Admin tidak valid.' });
  });

  // Update server Studio backup hash (admin-only or initial unconfigured setup)
  app.post('/api/admin/set-backup-hash', (req, res) => {
    const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
    if (isIpBanned(clientIp) || !isTrustedSameOriginBrowserRequest(req)) {
      res.status(403).json({ ok: false, error: 'Akses ditolak.' });
      return;
    }
    if (!verifySignedSessionToken(String(req.headers['x-hafiz-token'] || ''))) {
      res.status(403).json({ ok: false, error: 'Token sesi tidak valid.' });
      return;
    }
    const { backupSha256 } = (req.body || {}) as { backupSha256?: string };
    const cleanHash = typeof backupSha256 === 'string' ? backupSha256.trim().toLowerCase() : '';
    if (!/^[a-f0-9]{64}$/.test(cleanHash)) {
      res.status(400).json({ ok: false, error: 'Hash SHA-256 tidak valid.' });
      return;
    }
    const alreadyConfigured = fs.existsSync(ADMIN_AUTH_PATH);
    if (alreadyConfigured && !isAuthorizedAdminRequest(req)) {
      res.status(403).json({ ok: false, error: 'Hanya Admin terverifikasi yang dapat memperbarui password sistem.' });
      return;
    }
    fs.writeFileSync(ADMIN_AUTH_PATH, JSON.stringify({ backupSha256: cleanHash }, null, 2), { mode: 0o600 });
    res.json({ ok: true });
  });

  // Participant Session Check (non-Google persistent account)
  app.get('/api/participants/me', (req, res) => {
    if (!isTrustedSameOriginBrowserRequest(req)) {
      res.status(403).json({ ok: false, error: 'Akses ditolak.' });
      return;
    }
    const uid = resolveAuthorizedParticipantUid(req);
    if (!uid) {
      res.json({ ok: true, participant: null });
      return;
    }
    const records = readParticipantsDb();
    const found = records.find((r) => r.uid === uid);
    if (!found) {
      res.setHeader('Set-Cookie', buildSessionCookieHeader('hafiz_part_sess', '', 0, req));
      res.json({ ok: true, participant: null });
      return;
    }
    const refreshedToken = createSignedClaimToken(
      { role: 'participant', uid: found.uid, username: found.username },
      30 * 24 * 60 * 60 * 1000
    );
    res.json({
      ok: true,
      sessionToken: refreshedToken,
      participant: toPublicParticipant(found),
    });
  });

  // Participant Registration WITHOUT Google (Nama + Username + Kata Sandi + Foto Opsional)
  app.post('/api/participants/register', (req, res) => {
    const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
    if (isIpBanned(clientIp) || !isTrustedSameOriginBrowserRequest(req)) {
      recordViolation(clientIp);
      res.status(403).json({ ok: false, error: 'Akses ditolak.' });
      return;
    }
    if (!verifySignedSessionToken(String(req.headers['x-hafiz-token'] || ''))) {
      recordViolation(clientIp);
      res.status(403).json({ ok: false, error: 'Token sesi tidak valid. Muat ulang halaman.' });
      return;
    }
    if (isRateLimited(clientIp)) {
      res.status(429).json({ ok: false, error: 'Terlalu banyak percobaan. Tunggu 1 menit.' });
      return;
    }

    const body = (req.body || {}) as {
      displayName?: string;
      username?: string;
      password?: string;
      school?: string;
      phone?: string;
      targetTrack?: string;
      targetCampus?: string;
      photoDataUrl?: string;
      avatar?: StoredParticipantRecord['avatar'];
    };

    const displayName = String(body.displayName || '').trim().slice(0, 60);
    const username = normalizeUsername(body.username || displayName);
    const password = String(body.password || '');

    if (displayName.length < 2) {
      res.status(400).json({ ok: false, error: 'Nama lengkap peserta minimal 2 karakter.' });
      return;
    }
    if (username.length < 3) {
      res.status(400).json({ ok: false, error: 'Username akun minimal 3 karakter huruf/angka.' });
      return;
    }
    if (password.length < 4 || password.length > 128) {
      res.status(400).json({ ok: false, error: 'Kata sandi minimal 4 karakter.' });
      return;
    }

    const records = readParticipantsDb();
    const exists = records.some(
      (r) => r.username.toLowerCase() === username || r.displayName.toLowerCase() === displayName.toLowerCase()
    );
    if (exists) {
      res.status(409).json({
        ok: false,
        error: `Akun dengan nama/username "${username}" sudah terdaftar. Silakan masuk lewat tab Masuk atau pakai username lain.`,
      });
      return;
    }

    const uploadedPhotoUrl = saveParticipantPhotoDataUrl(body.photoDataUrl) || '';
    const nowIso = new Date().toISOString();
    const uid = `part-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
    const targetTrack =
      body.targetTrack === 'kedinasan' || body.targetTrack === 'both' ? body.targetTrack : 'utbk';

    const newRec: StoredParticipantRecord = {
      uid,
      username,
      displayName,
      email: `${username}@peserta.hafizeducation.my.id`,
      photoUrl: uploadedPhotoUrl,
      school: String(body.school || '').trim().slice(0, 120),
      phone: String(body.phone || '').trim().slice(0, 24),
      targetTrack,
      targetCampus: String(body.targetCampus || '').trim().slice(0, 120),
      authMethod: 'password',
      passwordHash: hashParticipantPassword(password),
      avatar: body.avatar && typeof body.avatar === 'object' ? body.avatar : DEFAULT_PARTICIPANT_AVATAR,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    records.unshift(newRec);
    writeParticipantsDb(records);

    const sessionToken = createSignedClaimToken(
      { role: 'participant', uid: newRec.uid, username: newRec.username },
      30 * 24 * 60 * 60 * 1000
    );
    res.setHeader(
      'Set-Cookie',
      buildSessionCookieHeader('hafiz_part_sess', sessionToken, 30 * 24 * 60 * 60, req)
    );
    res.json({
      ok: true,
      sessionToken,
      participant: toPublicParticipant(newRec),
    });
  });

  // Participant Login WITHOUT Google (Nama Lengkap / Username + Kata Sandi)
  app.post('/api/participants/login', (req, res) => {
    const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
    if (isIpBanned(clientIp) || !isTrustedSameOriginBrowserRequest(req)) {
      recordViolation(clientIp);
      res.status(403).json({ ok: false, error: 'Akses ditolak.' });
      return;
    }
    if (!verifySignedSessionToken(String(req.headers['x-hafiz-token'] || ''))) {
      recordViolation(clientIp);
      res.status(403).json({ ok: false, error: 'Token sesi tidak valid.' });
      return;
    }
    if (isRateLimited(clientIp)) {
      res.status(429).json({ ok: false, error: 'Terlalu banyak percobaan login. Tunggu 1 menit.' });
      return;
    }

    const body = (req.body || {}) as { identifier?: string; password?: string };
    const identifier = String(body.identifier || '').trim();
    const password = String(body.password || '');
    const normIdentifier = normalizeUsername(identifier);

    if (!identifier || password.length < 4) {
      res.status(400).json({ ok: false, error: 'Masukkan Nama/Username dan Kata Sandi yang valid.' });
      return;
    }

    const records = readParticipantsDb();
    const matched = records.find(
      (r) =>
        r.username.toLowerCase() === normIdentifier ||
        r.displayName.toLowerCase() === identifier.toLowerCase() ||
        r.email.toLowerCase() === identifier.toLowerCase()
    );

    if (!matched || !verifyParticipantPassword(password, matched.passwordHash)) {
      recordViolation(clientIp);
      res.status(401).json({
        ok: false,
        error: 'Nama/Username atau kata sandi salah. Periksa kembali atau buat akun baru.',
      });
      return;
    }

    const sessionToken = createSignedClaimToken(
      { role: 'participant', uid: matched.uid, username: matched.username },
      30 * 24 * 60 * 60 * 1000
    );
    res.setHeader(
      'Set-Cookie',
      buildSessionCookieHeader('hafiz_part_sess', sessionToken, 30 * 24 * 60 * 60, req)
    );
    res.json({
      ok: true,
      sessionToken,
      participant: toPublicParticipant(matched),
    });
  });

  app.post('/api/participants/logout', (req, res) => {
    res.setHeader('Set-Cookie', buildSessionCookieHeader('hafiz_part_sess', '', 0, req));
    res.json({ ok: true });
  });

  // Update logged-in participant's own profile / photo / SKD summary
  app.put('/api/participants/profile', (req, res) => {
    if (!isTrustedSameOriginBrowserRequest(req)) {
      res.status(403).json({ ok: false, error: 'Akses ditolak.' });
      return;
    }
    const uid = resolveAuthorizedParticipantUid(req);
    if (!uid) {
      res.status(401).json({ ok: false, error: 'Silakan masuk akun peserta terlebih dahulu.' });
      return;
    }

    const body = (req.body || {}) as {
      displayName?: string;
      school?: string;
      phone?: string;
      targetTrack?: string;
      targetCampus?: string;
      photoDataUrl?: string;
      savedSkdSummary?: StoredParticipantRecord['savedSkdSummary'];
      avatar?: StoredParticipantRecord['avatar'];
    };

    const records = readParticipantsDb();
    const idx = records.findIndex((r) => r.uid === uid);
    if (idx === -1) {
      res.status(404).json({ ok: false, error: 'Profil peserta tidak ditemukan.' });
      return;
    }

    const existing = records[idx];
    const uploadedPhotoUrl = saveParticipantPhotoDataUrl(body.photoDataUrl);
    const updated: StoredParticipantRecord = {
      ...existing,
      displayName:
        typeof body.displayName === 'string' && body.displayName.trim().length >= 2
          ? body.displayName.trim().slice(0, 60)
          : existing.displayName,
      school:
        typeof body.school === 'string' ? body.school.trim().slice(0, 120) : existing.school,
      phone: typeof body.phone === 'string' ? body.phone.trim().slice(0, 24) : existing.phone,
      targetTrack:
        body.targetTrack === 'kedinasan' || body.targetTrack === 'both' || body.targetTrack === 'utbk'
          ? body.targetTrack
          : existing.targetTrack,
      targetCampus:
        typeof body.targetCampus === 'string'
          ? body.targetCampus.trim().slice(0, 120)
          : existing.targetCampus,
      photoUrl: uploadedPhotoUrl || existing.photoUrl,
      savedSkdSummary: body.savedSkdSummary || existing.savedSkdSummary,
      avatar: body.avatar && typeof body.avatar === 'object' ? body.avatar : existing.avatar,
      updatedAt: new Date().toISOString(),
    };
    records[idx] = updated;
    writeParticipantsDb(records);
    res.json({ ok: true, participant: toPublicParticipant(updated) });
  });

  // Admin: List all registered/logged-in participants (with photoUrl, metadata & NO password hashes)
  app.get('/api/participants/list', (req, res) => {
    if (!isTrustedSameOriginBrowserRequest(req) || !isAuthorizedAdminRequest(req)) {
      res.status(403).json({ ok: false, error: 'Hanya Admin terverifikasi yang dapat melihat Database Peserta.' });
      return;
    }
    const records = readParticipantsDb()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map(toPublicParticipant);
    res.json({ ok: true, participants: records });
  });

  // Admin: Create new participant or upload/update profile + photo for any logged-in/existing participant
  app.post('/api/participants/admin-upsert', (req, res) => {
    if (!isTrustedSameOriginBrowserRequest(req) || !isAuthorizedAdminRequest(req)) {
      res.status(403).json({ ok: false, error: 'Hanya Admin terverifikasi yang dapat mengelola profil peserta.' });
      return;
    }
    const body = (req.body || {}) as {
      uid?: string;
      username?: string;
      displayName?: string;
      email?: string;
      password?: string;
      school?: string;
      phone?: string;
      targetTrack?: string;
      targetCampus?: string;
      photoDataUrl?: string;
      photoUrl?: string;
      authMethod?: string;
    };

    const records = readParticipantsDb();
    const targetUid = typeof body.uid === 'string' ? body.uid.trim().slice(0, 128) : '';
    const existingIdx = targetUid ? records.findIndex((r) => r.uid === targetUid) : -1;
    const uploadedPhotoUrl = saveParticipantPhotoDataUrl(body.photoDataUrl);
    const cleanDirectPhotoUrl =
      typeof body.photoUrl === 'string' &&
      (/^\/api\/participant-photos\/[a-zA-Z0-9._-]{4,160}$/.test(body.photoUrl.trim()) ||
        /^https:\/\//.test(body.photoUrl.trim()))
        ? body.photoUrl.trim().slice(0, 500)
        : '';

    const nowIso = new Date().toISOString();

    if (existingIdx >= 0) {
      const prev = records[existingIdx];
      const nextDisplayName =
        typeof body.displayName === 'string' && body.displayName.trim().length >= 2
          ? body.displayName.trim().slice(0, 60)
          : prev.displayName;
      const nextUsername =
        typeof body.username === 'string' && normalizeUsername(body.username).length >= 3
          ? normalizeUsername(body.username)
          : prev.username;
      const nextPasswordHash =
        typeof body.password === 'string' && body.password.trim().length >= 4
          ? hashParticipantPassword(body.password.trim())
          : prev.passwordHash;
      const updated: StoredParticipantRecord = {
        ...prev,
        username: nextUsername,
        displayName: nextDisplayName,
        email:
          typeof body.email === 'string' && body.email.trim()
            ? body.email.trim().slice(0, 200)
            : prev.email,
        school: typeof body.school === 'string' ? body.school.trim().slice(0, 120) : prev.school,
        phone: typeof body.phone === 'string' ? body.phone.trim().slice(0, 24) : prev.phone,
        targetTrack:
          body.targetTrack === 'kedinasan' || body.targetTrack === 'both' || body.targetTrack === 'utbk'
            ? body.targetTrack
            : prev.targetTrack,
        targetCampus:
          typeof body.targetCampus === 'string'
            ? body.targetCampus.trim().slice(0, 120)
            : prev.targetCampus,
        photoUrl: uploadedPhotoUrl || cleanDirectPhotoUrl || prev.photoUrl,
        passwordHash: nextPasswordHash,
        updatedAt: nowIso,
      };
      records[existingIdx] = updated;
      writeParticipantsDb(records);
      res.json({ ok: true, participant: toPublicParticipant(updated) });
      return;
    }

    const displayName = String(body.displayName || '').trim().slice(0, 60);
    if (displayName.length < 2) {
      res.status(400).json({ ok: false, error: 'Nama lengkap peserta minimal 2 karakter.' });
      return;
    }
    const baseUsername = normalizeUsername(body.username || displayName) || `peserta.${Date.now().toString(36)}`;
    let username = baseUsername;
    if (records.some((r) => r.username === username)) {
      username = `${baseUsername.slice(0, 24)}.${crypto.randomBytes(2).toString('hex')}`;
    }
    const uid = targetUid || `part-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
    const rawPw = typeof body.password === 'string' ? body.password.trim() : '';

    const created: StoredParticipantRecord = {
      uid,
      username,
      displayName,
      email:
        typeof body.email === 'string' && body.email.trim()
          ? body.email.trim().slice(0, 200)
          : `${username}@peserta.hafizeducation.my.id`,
      photoUrl: uploadedPhotoUrl || cleanDirectPhotoUrl || '',
      school: String(body.school || '').trim().slice(0, 120),
      phone: String(body.phone || '').trim().slice(0, 24),
      targetTrack:
        body.targetTrack === 'kedinasan' || body.targetTrack === 'both' ? body.targetTrack : 'utbk',
      targetCampus: String(body.targetCampus || '').trim().slice(0, 120),
      authMethod: body.authMethod === 'google' ? 'google' : body.authMethod === 'email' ? 'email' : 'password',
      ...(rawPw.length >= 4 ? { passwordHash: hashParticipantPassword(rawPw) } : {}),
      avatar: DEFAULT_PARTICIPANT_AVATAR,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    records.unshift(created);
    writeParticipantsDb(records);
    res.json({ ok: true, participant: toPublicParticipant(created) });
  });

  app.delete('/api/participants/:uid', (req, res) => {
    if (!isTrustedSameOriginBrowserRequest(req) || !isAuthorizedAdminRequest(req)) {
      res.status(403).json({ ok: false, error: 'Hanya Admin yang dapat menghapus data peserta.' });
      return;
    }
    const uid = String(req.params.uid || '').trim();
    const records = readParticipantsDb();
    const filtered = records.filter((r) => r.uid !== uid);
    writeParticipantsDb(filtered);
    res.json({ ok: true, deleted: records.length - filtered.length });
  });

  app.delete('/api/participants', (req, res) => {
    if (!isTrustedSameOriginBrowserRequest(req) || !isAuthorizedAdminRequest(req)) {
      res.status(403).json({ ok: false, error: 'Hanya Admin yang dapat membersihkan Database Peserta.' });
      return;
    }
    writeParticipantsDb([]);
    res.json({ ok: true });
  });

  // Live room status & non-Google lobby presence endpoints (Admin-only quiz start guarantee)
  app.get('/api/room-status/:roomCode', (req, res) => {
    const cleanCode = String(req.params.roomCode || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode) {
      res.status(400).json({ ok: false, error: 'Kode room tidak valid.' });
      return;
    }
    const map = readRoomStatusMap();
    const entry = map[cleanCode];
    res.json({
      ok: true,
      roomCode: cleanCode,
      status: entry?.status === 'started' ? 'started' : 'waiting',
      updatedAt: entry?.updatedAt || null,
    });
  });

  app.post('/api/room-status/:roomCode', (req, res) => {
    if (!isTrustedSameOriginBrowserRequest(req) || !isAuthorizedAdminRequest(req)) {
      res.status(403).json({ ok: false, error: 'Hanya Admin yang dapat memulai atau menghentikan kuis.' });
      return;
    }
    const cleanCode = String(req.params.roomCode || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode) {
      res.status(400).json({ ok: false, error: 'Kode room tidak valid.' });
      return;
    }
    const { status } = (req.body || {}) as { status?: string };
    const cleanStatus: 'waiting' | 'started' = status === 'started' ? 'started' : 'waiting';
    const map = readRoomStatusMap();
    const updatedAt = new Date().toISOString();
    map[cleanCode] = { status: cleanStatus, updatedAt };
    writeRoomStatusMap(map);
    res.json({ ok: true, roomCode: cleanCode, status: cleanStatus, updatedAt });
  });

  app.get('/api/lobby/:roomCode/players', (req, res) => {
    const cleanCode = String(req.params.roomCode || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode) {
      res.json({ ok: true, players: [] });
      return;
    }
    const now = Date.now();
    const roomMap = liveLobbyPlayersByRoom.get(cleanCode);
    const active: LiveLobbyPlayerEntry[] = [];
    if (roomMap) {
      for (const [pid, entry] of roomMap.entries()) {
        if (now - entry.lastSeen > 90_000) {
          roomMap.delete(pid);
        } else {
          active.push(entry);
        }
      }
    }
    res.json({ ok: true, players: active });
  });

  app.post('/api/lobby/:roomCode/players', (req, res) => {
    if (!isTrustedSameOriginBrowserRequest(req)) {
      res.status(403).json({ ok: false, error: 'Akses ditolak.' });
      return;
    }
    const cleanCode = String(req.params.roomCode || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode) {
      res.status(400).json({ ok: false, error: 'Kode room tidak valid.' });
      return;
    }
    const body = (req.body || {}) as {
      id?: string;
      name?: string;
      avatar?: StoredParticipantRecord['avatar'];
      avatarLabel?: string;
      photoUrl?: string;
      leave?: boolean;
    };
    const pid = String(body.id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    if (!pid) {
      res.status(400).json({ ok: false, error: 'ID peserta tidak valid.' });
      return;
    }
    let roomMap = liveLobbyPlayersByRoom.get(cleanCode);
    if (!roomMap) {
      roomMap = new Map<string, LiveLobbyPlayerEntry>();
      liveLobbyPlayersByRoom.set(cleanCode, roomMap);
    }
    if (body.leave) {
      roomMap.delete(pid);
      res.json({ ok: true });
      return;
    }
    const cleanPhoto =
      typeof body.photoUrl === 'string' &&
      (/^\/api\/participant-photos\/[a-zA-Z0-9._-]{4,160}$/.test(body.photoUrl.trim()) ||
        /^https:\/\//.test(body.photoUrl.trim()))
        ? body.photoUrl.trim().slice(0, 500)
        : undefined;
    roomMap.set(pid, {
      id: pid,
      name: String(body.name || 'Peserta').trim().slice(0, 60) || 'Peserta',
      avatar: body.avatar && typeof body.avatar === 'object' ? body.avatar : DEFAULT_PARTICIPANT_AVATAR,
      avatarLabel: String(body.avatarLabel || 'Avatar').trim().slice(0, 60) || 'Avatar',
      ...(cleanPhoto ? { photoUrl: cleanPhoto } : {}),
      lastSeen: Date.now(),
    });
    res.json({ ok: true });
  });

  // Dynamic Digital Asset Links (/.well-known/assetlinks.json) for Google Play Store TWA verification
  app.get('/.well-known/assetlinks.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    try {
      if (fs.existsSync(STORE_CONFIG_PATH)) {
        const saved = JSON.parse(fs.readFileSync(STORE_CONFIG_PATH, 'utf-8')) as {
          androidPackageId?: string;
          androidSha256?: string;
        };
        const pkg =
          typeof saved.androidPackageId === 'string' && /^[a-z][a-z0-9_]*(\.[a-z0-9_]+){1,6}$/i.test(saved.androidPackageId)
            ? saved.androidPackageId.toLowerCase()
            : 'com.hafizeducation.app';
        const fp =
          typeof saved.androidSha256 === 'string' && /^([0-9A-Fa-f]{2}:){31}[0-9A-Fa-f]{2}$/.test(saved.androidSha256)
            ? saved.androidSha256.toUpperCase()
            : '00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00';
        res.send(
          JSON.stringify(
            [
              {
                relation: ['delegate_permission/common.handle_all_urls'],
                target: {
                  namespace: 'android_app',
                  package_name: pkg,
                  sha256_cert_fingerprints: [fp],
                },
              },
            ],
            null,
            2
          )
        );
        return;
      }
      const fallbackPath = path.resolve(__dirname, 'public', '.well-known', 'assetlinks.json');
      if (fs.existsSync(fallbackPath)) {
        res.sendFile(fallbackPath);
        return;
      }
    } catch {
      // fall through to default JSON response
    }
    res.send(
      JSON.stringify(
        [
          {
            relation: ['delegate_permission/common.handle_all_urls'],
            target: {
              namespace: 'android_app',
              package_name: 'com.hafizeducation.app',
              sha256_cert_fingerprints: [
                '00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00',
              ],
            },
          },
        ],
        null,
        2
      )
    );
  });

  // Dynamic Apple App Site Association (/.well-known/apple-app-site-association) for App Store Universal Links
  app.get('/.well-known/apple-app-site-association', (_req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    let bundle = 'com.hafizeducation.app';
    let team = 'TEAMID1234';
    try {
      if (fs.existsSync(STORE_CONFIG_PATH)) {
        const saved = JSON.parse(fs.readFileSync(STORE_CONFIG_PATH, 'utf-8')) as {
          iosBundleId?: string;
          appleTeamId?: string;
        };
        if (typeof saved.iosBundleId === 'string' && /^[a-z][a-z0-9_]*(\.[a-z0-9_]+){1,6}$/i.test(saved.iosBundleId)) {
          bundle = saved.iosBundleId.toLowerCase();
        }
        if (typeof saved.appleTeamId === 'string' && /^[A-Z0-9]{10}$/i.test(saved.appleTeamId)) {
          team = saved.appleTeamId.toUpperCase();
        }
      }
    } catch {
      // use defaults
    }
    const appID = `${team}.${bundle}`;
    res.send(
      JSON.stringify(
        {
          applinks: {
            apps: [],
            details: [{ appID, paths: ['/', '/?*'] }],
          },
          webcredentials: { apps: [appID] },
        },
        null,
        2
      )
    );
  });

  // Dynamic Microsoft Identity Association (/.well-known/microsoft-identity-association.json) for Microsoft Store
  app.get('/.well-known/microsoft-identity-association.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    let applicationId = '00000000-0000-0000-0000-000000000000';
    try {
      if (fs.existsSync(STORE_CONFIG_PATH)) {
        const saved = JSON.parse(fs.readFileSync(STORE_CONFIG_PATH, 'utf-8')) as {
          microsoftAppGuid?: string;
        };
        if (
          typeof saved.microsoftAppGuid === 'string' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(saved.microsoftAppGuid)
        ) {
          applicationId = saved.microsoftAppGuid.toLowerCase();
        }
      }
    } catch {
      // use default
    }
    res.send(
      JSON.stringify(
        {
          associatedApplications: [{ applicationId }],
        },
        null,
        2
      )
    );
  });

  // Persist Admin Store Distribution config (Play Store, App Store & Microsoft Store verification IDs)
  app.post('/api/store-config', (req, res) => {
    const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
    if (isIpBanned(clientIp) || !isTrustedSameOriginBrowserRequest(req)) {
      recordViolation(clientIp);
      res.status(403).json({ ok: false, error: 'Akses ditolak.' });
      return;
    }
    const signedToken = String(req.headers['x-hafiz-token'] || '');
    if (!verifySignedSessionToken(signedToken)) {
      recordViolation(clientIp);
      res.status(403).json({ ok: false, error: 'Token sesi tidak valid.' });
      return;
    }
    const body = (req.body || {}) as {
      androidPackageId?: string;
      androidSha256?: string;
      iosBundleId?: string;
      appleTeamId?: string;
      microsoftStoreId?: string;
      microsoftAppGuid?: string;
    };
    const pkgRaw = typeof body.androidPackageId === 'string' ? body.androidPackageId.trim().toLowerCase() : '';
    const pkg = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+){1,6}$/.test(pkgRaw) ? pkgRaw : 'com.hafizeducation.app';
    const iosRaw = typeof body.iosBundleId === 'string' ? body.iosBundleId.trim().toLowerCase() : '';
    const iosBundleId = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+){1,6}$/.test(iosRaw) ? iosRaw : 'com.hafizeducation.app';
    const teamRaw = typeof body.appleTeamId === 'string' ? body.appleTeamId.trim().toUpperCase() : '';
    const appleTeamId = /^[A-Z0-9]{10}$/.test(teamRaw) ? teamRaw : '';
    const msIdRaw = typeof body.microsoftStoreId === 'string' ? body.microsoftStoreId.trim().slice(0, 80) : '';
    const microsoftStoreId = /^[A-Z0-9._-]{6,80}$/i.test(msIdRaw) ? msIdRaw : '';
    const msGuidRaw = typeof body.microsoftAppGuid === 'string' ? body.microsoftAppGuid.trim().toLowerCase() : '';
    const microsoftAppGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(msGuidRaw)
      ? msGuidRaw
      : '';
    const fpRaw = typeof body.androidSha256 === 'string' ? body.androidSha256.trim().toUpperCase() : '';
    const hexOnly = fpRaw.replace(/[^0-9A-F]/g, '');
    const fp = hexOnly.length === 64 ? hexOnly.match(/.{2}/g)!.join(':') : '';
    fs.writeFileSync(
      STORE_CONFIG_PATH,
      JSON.stringify(
        {
          androidPackageId: pkg,
          androidSha256: fp,
          iosBundleId,
          appleTeamId,
          microsoftStoreId,
          microsoftAppGuid,
          updatedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
    res.json({
      ok: true,
      androidPackageId: pkg,
      androidSha256: fp,
      iosBundleId,
      appleTeamId,
      microsoftStoreId,
      microsoftAppGuid,
    });
  });

  // Automatically upload extracted question images (PNG/JPEG/WEBP/GIF) to persistent server storage
  app.post('/api/upload-question-image', (req, res) => {
    try {
      const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
      if (isIpBanned(clientIp)) {
        res.status(403).json({ ok: false, error: 'Akses ditolak sementara.' });
        return;
      }
      if (!isTrustedSameOriginBrowserRequest(req)) {
        recordViolation(clientIp);
        res.status(403).json({ ok: false, error: 'Akses upload langsung dari skrip eksternal ditolak.' });
        return;
      }
      const signedToken = String(req.headers['x-hafiz-token'] || '');
      if (!verifySignedSessionToken(signedToken)) {
        recordViolation(clientIp);
        res.status(403).json({ ok: false, error: 'Token sesi tidak valid. Muat ulang halaman.' });
        return;
      }

      const { dataUrl } = (req.body || {}) as { dataUrl?: string };
      if (!dataUrl || typeof dataUrl !== 'string') {
        res.status(400).json({ ok: false, error: 'Data gambar tidak ditemukan.' });
        return;
      }
      const match = dataUrl.match(/^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=]+)$/i);
      if (!match) {
        res.status(400).json({ ok: false, error: 'Format gambar tidak valid. Gunakan PNG, JPG, WEBP, atau GIF.' });
        return;
      }

      const imgSubtype = match[1].toLowerCase();
      const ext = imgSubtype === 'jpeg' ? 'jpg' : imgSubtype;
      const buffer = Buffer.from(match[2], 'base64');
      const MAX_IMG_BYTES = 5 * 1024 * 1024;
      if (buffer.length === 0 || buffer.length > MAX_IMG_BYTES) {
        res.status(413).json({ ok: false, error: 'Ukuran gambar soal maksimal 5 MB.' });
        return;
      }

      const storedName = `qimg-${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
      const targetPath = path.resolve(QUESTION_IMAGES_DIR, storedName);
      if (!targetPath.startsWith(QUESTION_IMAGES_DIR)) {
        res.status(400).json({ ok: false, error: 'Path penyimpanan tidak valid.' });
        return;
      }

      fs.writeFileSync(targetPath, buffer);
      res.json({
        ok: true,
        url: `/api/question-images/${encodeURIComponent(storedName)}`,
        sizeBytes: buffer.length,
      });
    } catch (error) {
      console.error('Error in /api/upload-question-image:', error);
      res.status(500).json({ ok: false, error: 'Gagal menyimpan gambar soal ke server.' });
    }
  });

  app.get('/api/question-images/:storedName', (req, res) => {
    const rawStored = String(req.params.storedName || '');
    if (!/^qimg-[a-z0-9]+-[a-f0-9]+\.(png|jpe?g|webp|gif)$/i.test(rawStored) || rawStored.includes('..')) {
      res.status(400).json({ ok: false, error: 'Nama gambar tidak valid.' });
      return;
    }
    const targetPath = path.resolve(QUESTION_IMAGES_DIR, rawStored);
    if (!targetPath.startsWith(QUESTION_IMAGES_DIR) || !fs.existsSync(targetPath)) {
      res.status(404).json({ ok: false, error: 'Gambar soal tidak ditemukan.' });
      return;
    }
    const ext = path.extname(rawStored).toLowerCase();
    const mime =
      ext === '.png'
        ? 'image/png'
        : ext === '.webp'
          ? 'image/webp'
          : ext === '.gif'
            ? 'image/gif'
            : 'image/jpeg';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `inline; filename="${rawStored}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(targetPath);
  });

  // Upload any type of presentation / attachment file (PPT, PPTX, PDF, DOCX, XLSX, ZIP, images, etc.)
  app.post('/api/upload-material-file', (req, res) => {
    try {
      const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
      if (isIpBanned(clientIp)) {
        res.status(403).json({ ok: false, error: 'Akses ditolak sementara.' });
        return;
      }
      if (!isTrustedSameOriginBrowserRequest(req)) {
        recordViolation(clientIp);
        res.status(403).json({ ok: false, error: 'Akses upload langsung dari skrip eksternal ditolak.' });
        return;
      }
      const signedToken = String(req.headers['x-hafiz-token'] || '');
      if (!verifySignedSessionToken(signedToken)) {
        recordViolation(clientIp);
        res.status(403).json({ ok: false, error: 'Token sesi tidak valid. Muat ulang halaman dan coba lagi.' });
        return;
      }
      if (isRateLimited(clientIp)) {
        res.status(429).json({ ok: false, error: 'Terlalu banyak permintaan upload. Coba lagi sebentar.' });
        return;
      }

      const { fileName, mimeType, fileBase64 } = (req.body || {}) as {
        fileName?: string;
        mimeType?: string;
        fileBase64?: string;
      };

      if (!fileBase64 || typeof fileBase64 !== 'string') {
        res.status(400).json({ ok: false, error: 'Data file tidak ditemukan.' });
        return;
      }

      const buffer = Buffer.from(fileBase64, 'base64');
      const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
      if (buffer.length === 0 || buffer.length > MAX_BYTES) {
        res.status(413).json({
          ok: false,
          error: 'Ukuran file maksimal 25 MB.',
        });
        return;
      }

      const rawName = String(fileName || 'lampiran-materi.bin').trim();
      const baseName = path.basename(rawName).replace(/[^a-zA-Z0-9._-]/g, '_');
      const cleanName = baseName.slice(0, 120) || 'lampiran.bin';
      const uniquePrefix = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
      const storedName = `${uniquePrefix}-${cleanName}`.slice(0, 170);
      const targetPath = path.resolve(MATERIAL_UPLOADS_DIR, storedName);

      if (!targetPath.startsWith(MATERIAL_UPLOADS_DIR)) {
        res.status(400).json({ ok: false, error: 'Nama file tidak valid.' });
        return;
      }

      fs.writeFileSync(targetPath, buffer);

      res.json({
        ok: true,
        url: `/api/material-files/${encodeURIComponent(storedName)}`,
        fileName: rawName.slice(0, 160),
        sizeBytes: buffer.length,
        mimeType: typeof mimeType === 'string' ? mimeType.slice(0, 120) : 'application/octet-stream',
      });
    } catch (error) {
      console.error('Error in /api/upload-material-file:', error);
      res.status(500).json({ ok: false, error: 'Gagal menyimpan file ke server.' });
    }
  });

  // Serve uploaded material files (PPT, PPTX, PDF, DOCX, XLSX, ZIP, images, etc.)
  app.get('/api/material-files/:storedName', (req, res) => {
    const rawStored = String(req.params.storedName || '');
    if (!/^[a-zA-Z0-9._-]{4,180}$/.test(rawStored) || rawStored.includes('..')) {
      res.status(400).json({ ok: false, error: 'Nama file tidak valid.' });
      return;
    }
    const targetPath = path.resolve(MATERIAL_UPLOADS_DIR, rawStored);
    if (!targetPath.startsWith(MATERIAL_UPLOADS_DIR) || !fs.existsSync(targetPath)) {
      res.status(404).json({ ok: false, error: 'File materi tidak ditemukan.' });
      return;
    }

    const ext = path.extname(rawStored).toLowerCase();
    const MIME_BY_EXT: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.txt': 'text/plain; charset=utf-8',
      '.csv': 'text/csv; charset=utf-8',
      '.zip': 'application/zip',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
    };
    const contentType = MIME_BY_EXT[ext] || 'application/octet-stream';
    const inlineSafeExts = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.txt', '.mp4', '.mp3']);
    const forceDownload = req.query.download === '1' || !inlineSafeExts.has(ext);
    const displayFileName = rawStored.replace(/^[a-z0-9]+-[a-f0-9]+-/, '') || rawStored;

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `${forceDownload ? 'attachment' : 'inline'}; filename="${displayFileName.replace(/"/g, '')}"`
    );
    res.sendFile(targetPath);
  });

  // Short-lived HMAC session token — strictly issued only to same-origin browser sessions
  app.get('/api/session-token', (req, res) => {
    const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
    if (isIpBanned(clientIp)) {
      res.status(403).json({ ok: false, error: 'Akses ditolak sementara.' });
      return;
    }
    if (!isTrustedSameOriginBrowserRequest(req)) {
      recordViolation(clientIp);
      res.status(403).json({ ok: false, error: 'Akses langsung dari skrip eksternal ditolak.' });
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    res.json({ ok: true, token: createSignedSessionToken() });
  });

  app.post('/api/parse-quiz', async (req, res) => {
    try {
      const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
      if (isIpBanned(clientIp)) {
        res.status(403).json({
          ok: false,
          error: 'IP Anda diblokir sementara karena aktivitas mencurigakan.',
        });
        return;
      }

      if (!isTrustedSameOriginBrowserRequest(req)) {
        recordViolation(clientIp);
        res.status(403).json({
          ok: false,
          error: 'Akses API dari skrip/perangkat eksternal (VS Code, curl, Postman) diblokir.',
        });
        return;
      }

      const signedToken = String(req.headers['x-hafiz-token'] || '');
      if (!verifySignedSessionToken(signedToken)) {
        recordViolation(clientIp);
        res.status(403).json({
          ok: false,
          error: 'Token keamanan sesi tidak valid atau kedaluwarsa.',
        });
        return;
      }

      if (isRateLimited(clientIp)) {
        recordViolation(clientIp);
        res.status(429).json({
          ok: false,
          error: 'Terlalu banyak permintaan pembacaan file. Tunggu 1 menit lalu coba lagi.',
        });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(503).json({
          ok: false,
          error: 'Layanan pembaca soal AI belum aktif di server (GEMINI_API_KEY tidak tersedia).',
        });
        return;
      }

      const { text, fileBase64, mimeType, fileName, expectedCount } = req.body as {
        text?: string;
        fileBase64?: string;
        mimeType?: string;
        fileName?: string;
        expectedCount?: number;
      };

      if (!text && !fileBase64) {
        res.status(400).json({ ok: false, error: 'Tidak ada teks atau file yang dikirim.' });
        return;
      }

      if (fileBase64) {
        if (typeof fileBase64 !== 'string' || fileBase64.length > 14_000_000) {
          res.status(413).json({ ok: false, error: 'Ukuran file terlalu besar (maksimal 10 MB).' });
          return;
        }
        if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
          res.status(400).json({
            ok: false,
            error: 'Format file biner tidak didukung. Gunakan PDF, PNG, JPG, atau WEBP.',
          });
          return;
        }
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const countInstruction =
        typeof expectedCount === 'number' && expectedCount > 0
          ? `\n\nPENTING: File ini terdeteksi berisi sekitar ${expectedCount} soal. Pastikan seluruh ${expectedCount} soal terekstrak lengkap tanpa ada satu pun yang terlewat.`
          : '';

      const parts: Array<
        { text: string } | { inlineData: { data: string; mimeType: string } }
      > = [{ text: QUIZ_EXTRACTION_PROMPT + countInstruction }];

      if (fileBase64 && mimeType) {
        parts.push({
          inlineData: {
            data: fileBase64,
            mimeType,
          },
        });
      }

      if (text && text.trim()) {
        parts.push({
          text: `Berikut isi file soal${fileName ? ` (${fileName})` : ''}:\n\n${text.slice(0, 180_000)}`,
        });
      }

      const candidateModels = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-4-hydrogen'];
      let response;
      let lastErr: unknown = null;

      for (const modelName of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: 'user', parts }],
            config: {
              maxOutputTokens: 65536,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: 'Judul kuis atau mata pelajaran jika ditemukan di dokumen',
                  },
                  questions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        question: { type: Type.STRING },
                        choices: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: 'Tepat 5 opsi jawaban A, B, C, D, E tanpa huruf prefix',
                        },
                        correctIndex: {
                          type: Type.INTEGER,
                          description: 'Indeks jawaban benar: 0=A, 1=B, 2=C, 3=D, 4=E',
                        },
                        explanation: {
                          type: Type.STRING,
                          description: 'Pembahasan soal dari file atau penjelasan singkat yang akurat',
                        },
                        imageBBox: {
                          type: Type.OBJECT,
                          description:
                            'Opsional: isi HANYA jika soal ini memiliki gambar/grafik/diagram/tabel/bangun visual pada PDF atau gambar. Koordinat ternormalisasi 0-1000.',
                          properties: {
                            page: { type: Type.INTEGER, description: 'Nomor halaman PDF (mulai dari 1)' },
                            ymin: { type: Type.INTEGER, description: 'Batas atas (0-1000)' },
                            xmin: { type: Type.INTEGER, description: 'Batas kiri (0-1000)' },
                            ymax: { type: Type.INTEGER, description: 'Batas bawah (0-1000)' },
                            xmax: { type: Type.INTEGER, description: 'Batas kanan (0-1000)' },
                          },
                          required: ['page', 'ymin', 'xmin', 'ymax', 'xmax'],
                        },
                      },
                      required: ['question', 'choices', 'correctIndex', 'explanation'],
                    },
                  },
                },
                required: ['questions'],
              },
            },
          });
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
          continue;
        }
      }

      if (lastErr || !response) {
        throw lastErr || new Error('Gagal membaca soal dari dokumen.');
      }

      const rawOutput = response.text;
      if (!rawOutput) {
        res.status(502).json({ ok: false, error: 'AI tidak mengembalikan hasil ekstraksi.' });
        return;
      }

      const parsed = JSON.parse(rawOutput) as {
        title?: string;
        questions?: Array<{
          question?: string;
          choices?: string[];
          correctIndex?: number;
          explanation?: string;
          imageBBox?: Partial<ParsedQuizQuestionBBox>;
        }>;
      };

      const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;
      const now = Date.now();
      const questions: ParsedQuizQuestion[] = (parsed.questions || [])
        .filter((q) => q && typeof q.question === 'string' && q.question.trim().length > 0)
        .map((q, idx) => {
          const rawChoices = Array.isArray(q.choices) ? q.choices : [];
          const choices: [string, string, string, string, string] = [
            String(rawChoices[0] ?? 'Pilihan A').trim() || 'Pilihan A',
            String(rawChoices[1] ?? 'Pilihan B').trim() || 'Pilihan B',
            String(rawChoices[2] ?? 'Pilihan C').trim() || 'Pilihan C',
            String(rawChoices[3] ?? 'Pilihan D').trim() || 'Pilihan D',
            String(rawChoices[4] ?? 'Pilihan E').trim() || 'Pilihan E',
          ];
          const correctIndex =
            typeof q.correctIndex === 'number' && !Number.isNaN(q.correctIndex)
              ? Math.max(0, Math.min(4, Math.round(q.correctIndex)))
              : 0;
          const explanation =
            typeof q.explanation === 'string' && q.explanation.trim()
              ? q.explanation.trim()
              : `Jawaban yang tepat adalah ${LETTERS[correctIndex]}. ${choices[correctIndex]}.`;

          let imageBBox: ParsedQuizQuestionBBox | undefined;
          if (q.imageBBox && typeof q.imageBBox === 'object') {
            const page = Math.max(1, Math.min(200, Math.round(Number(q.imageBBox.page || 1))));
            const ymin = Math.max(0, Math.min(990, Math.round(Number(q.imageBBox.ymin ?? 0))));
            const xmin = Math.max(0, Math.min(990, Math.round(Number(q.imageBBox.xmin ?? 0))));
            const ymax = Math.max(ymin + 10, Math.min(1000, Math.round(Number(q.imageBBox.ymax ?? 0))));
            const xmax = Math.max(xmin + 10, Math.min(1000, Math.round(Number(q.imageBBox.xmax ?? 0))));
            if (ymax - ymin >= 25 && xmax - xmin >= 25) {
              imageBBox = { page, ymin, xmin, ymax, xmax };
            }
          }

          return {
            id: `q-ai-${now}-${idx + 1}`,
            question: q.question!.trim(),
            choices,
            correctIndex,
            explanation,
            ...(imageBBox ? { imageBBox } : {}),
          };
        });

      res.json({
        ok: true,
        title: typeof parsed.title === 'string' ? parsed.title.trim() : '',
        questions,
      });
    } catch (error) {
      console.error('Error in /api/parse-quiz:', error);
      res.status(500).json({
        ok: false,
        error: 'Gagal mengekstrak soal dari file. Pastikan file terbaca dengan jelas.',
      });
    }
  });

  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const hmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: hmrDisabled ? false : { server: httpServer },
        ws: hmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
      plugins: [
        {
          name: 'hafiz-safe-vite-client-ws',
          enforce: 'post',
          transform(code, id) {
            if (id.includes('@vite/client') || id.includes('vite/dist/client/client.mjs')) {
              let patched = code.replace(
                'ws.send(JSON.stringify(data));',
                'if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify(data));'
              );
              if (hmrDisabled) {
                patched = patched.replace(
                  /const createWebSocketModuleRunnerTransport = \(options\) => \{[\s\S]*?\n\};/,
                  'const createWebSocketModuleRunnerTransport = () => ({ async connect({ onMessage }) { onMessage({ type: "connected" }); }, async disconnect() {}, send() {} });'
                );
              } else {
                // Gracefully degrade when reverse proxies block WS upgrade so no unhandled "WebSocket closed without opened." error is raised
                patched = patched
                  .replace(
                    'reject(/* @__PURE__ */ new Error("WebSocket closed without opened."));',
                    'isOpened = true; onMessage({ type: "connected" }); resolve();'
                  )
                  .replace(
                    'reject(new Error("WebSocket closed without opened."));',
                    'isOpened = true; onMessage({ type: "connected" }); resolve();'
                  )
                  .replace(
                    'console.error(`[vite] failed to connect to websocket (${e}). `);',
                    'console.debug(`[vite] websocket unavailable, continuing without HMR`);'
                  )
                  .replace(
                    /console\.error\(`\[vite\] failed to connect to websocket\.[\s\S]*?`\);\s*\}/,
                    '}'
                  )
                  .replace(
                    /\t+throw e;\n\t+\}/,
                    '\t\t\t\treturn;\n\t\t\t}'
                  );
              }
              return patched;
            }
          },
        },
      ],
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Hafiz Education server running on http://localhost:${PORT}`);
  });
}

startServer();
