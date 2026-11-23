import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type { AvatarConfig, HistoryRecord, LobbyPlayer, QuizQuestion, QuizRoom } from './types/quiz';
import { sanitizeLegacySiteCopy } from './utils/webSettings';
import {
  sanitizeParticipantProfileMeta,
  type ParticipantTargetTrack,
  type SavedSkdSummary,
} from './utils/participantAuth';
import {
  sanitizeAppleTeamId,
  sanitizeHttpsStoreUrl,
  sanitizeMicrosoftStoreId,
  sanitizePackageId,
  sanitizeUuidGuid,
} from './utils/appStoreDistribution';

export const ADMIN_EMAIL = 'jikikuki41@gmail.com';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function isVerifiedAdminUser(user: User | null): boolean {
  if (!user) return false;
  return Boolean(user.emailVerified && user.email?.toLowerCase() === ADMIN_EMAIL);
}

export async function signInAdminWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

export function onAuthChange(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb);
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'rooms', 'HF882A'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration — Firestore client is offline.');
      return false;
    }
    // Non-offline errors (e.g. doc doesn't exist yet) mean connection is reachable
    return true;
  }
}

function sanitizeQuestionsForFirestore(questions: QuizQuestion[]) {
  // Keep total document size safely under Firestore's 1MB document limit (~850KB budget)
  let totalBytes = 0;
  const MAX_DOC_BYTES = 850_000;

  return questions.slice(0, 100).map((q) => {
    const clean: Record<string, unknown> = {
      id: q.id,
      question: q.question,
      choices: [...q.choices],
      correctIndex: Math.max(0, Math.min(4, q.correctIndex)),
      explanation: q.explanation || '',
    };
    totalBytes += JSON.stringify(clean).length;
    if (q.image && q.image.length < 250_000 && totalBytes + q.image.length < MAX_DOC_BYTES) {
      clean.image = q.image;
      totalBytes += q.image.length;
    }
    return clean;
  });
}

function toIsoString(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

export async function saveRoomToFirestore(room: QuizRoom, ownerUid: string): Promise<void> {
  const roomCode = room.code.trim().toUpperCase();
  const path = `rooms/${roomCode}`;
  const ref = doc(db, 'rooms', roomCode);
  const cleanQuestions = sanitizeQuestionsForFirestore(room.questions);
  const cleanTitle = room.title.trim().slice(0, 200);
  const status = room.status === 'started' ? 'started' : 'waiting';
  const category = (room.category || 'Umum').slice(0, 40);
  const openAt = typeof room.openAt === 'string' ? room.openAt.trim().slice(0, 40) : '';
  const closeAt = typeof room.closeAt === 'string' ? room.closeAt.trim().slice(0, 40) : '';

  try {
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      await updateDoc(ref, {
        title: cleanTitle,
        questions: cleanQuestions,
        status,
        category,
        openAt,
        closeAt,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        code: roomCode,
        title: cleanTitle,
        questions: cleanQuestions,
        ownerUid,
        status,
        category,
        openAt,
        closeAt,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function setRoomStatusInFirestore(
  roomCode: string,
  status: 'waiting' | 'started'
): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const path = `rooms/${cleanCode}`;
  try {
    await updateDoc(doc(db, 'rooms', cleanCode), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteRoomFromFirestore(roomCode: string): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (!cleanCode) return;
  const path = `rooms/${cleanCode}`;
  try {
    await deleteDoc(doc(db, 'rooms', cleanCode));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToRoomState(
  roomCode: string,
  onRoomUpdate: (room: QuizRoom) => void
): () => void {
  const cleanCode = roomCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (!cleanCode) return () => {};

  return onSnapshot(
    doc(db, 'rooms', cleanCode),
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      onRoomUpdate({
        code: String(data.code || cleanCode),
        title: String(data.title || 'Kuis Hafiz Education'),
        questions: Array.isArray(data.questions) ? (data.questions as QuizQuestion[]) : [],
        createdAt: toIsoString(data.createdAt),
        status: data.status === 'started' ? 'started' : 'waiting',
        category: typeof data.category === 'string' ? (data.category as QuizRoom['category']) : 'Umum',
        openAt: typeof data.openAt === 'string' && data.openAt.trim() ? data.openAt.trim() : undefined,
        closeAt: typeof data.closeAt === 'string' && data.closeAt.trim() ? data.closeAt.trim() : undefined,
      });
    },
    (err) => {
      console.warn('Room state listener error:', err);
    }
  );
}

export async function fetchRoomFromFirestore(roomCode: string): Promise<QuizRoom | null> {
  const cleanCode = roomCode.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{4,12}$/.test(cleanCode)) return null;
  const path = `rooms/${cleanCode}`;
  try {
    const snap = await getDoc(doc(db, 'rooms', cleanCode));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      code: String(data.code || cleanCode),
      title: String(data.title || 'Kuis Hafiz Education'),
      questions: Array.isArray(data.questions) ? (data.questions as QuizQuestion[]) : [],
      createdAt: toIsoString(data.createdAt),
      status: data.status === 'started' ? 'started' : 'waiting',
      category: typeof data.category === 'string' ? (data.category as QuizRoom['category']) : 'Umum',
      openAt: typeof data.openAt === 'string' && data.openAt.trim() ? data.openAt.trim() : undefined,
      closeAt: typeof data.closeAt === 'string' && data.closeAt.trim() ? data.closeAt.trim() : undefined,
    };
  } catch (error) {
    console.warn(`Unable to fetch room ${path} from Firestore:`, error);
    return null;
  }
}

export async function listRoomsFromFirestore(): Promise<Record<string, QuizRoom>> {
  const path = 'rooms';
  try {
    const snap = await getDocs(collection(db, 'rooms'));
    const map: Record<string, QuizRoom> = {};
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const code = String(data.code || docSnap.id).toUpperCase();
      map[code] = {
        code,
        title: String(data.title || 'Kuis Hafiz Education'),
        questions: Array.isArray(data.questions) ? (data.questions as QuizQuestion[]) : [],
        createdAt: toIsoString(data.createdAt),
        status: data.status === 'started' ? 'started' : 'waiting',
        category: typeof data.category === 'string' ? (data.category as QuizRoom['category']) : 'Umum',
        openAt: typeof data.openAt === 'string' && data.openAt.trim() ? data.openAt.trim() : undefined,
        closeAt: typeof data.closeAt === 'string' && data.closeAt.trim() ? data.closeAt.trim() : undefined,
      };
    });
    return map;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToAllRooms(
  onUpdate: (roomsMap: Record<string, QuizRoom>) => void
): () => void {
  return onSnapshot(
    collection(db, 'rooms'),
    (snap) => {
      const map: Record<string, QuizRoom> = {};
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const code = String(data.code || docSnap.id).toUpperCase();
        map[code] = {
          code,
          title: String(data.title || 'Kuis Hafiz Education'),
          questions: Array.isArray(data.questions) ? (data.questions as QuizQuestion[]) : [],
          createdAt: toIsoString(data.createdAt),
          status: data.status === 'started' ? 'started' : 'waiting',
          category: typeof data.category === 'string' ? (data.category as QuizRoom['category']) : 'Umum',
          openAt: typeof data.openAt === 'string' && data.openAt.trim() ? data.openAt.trim() : undefined,
          closeAt: typeof data.closeAt === 'string' && data.closeAt.trim() ? data.closeAt.trim() : undefined,
        };
      });
      onUpdate(map);
    },
    (err) => {
      console.warn('All rooms listener error:', err);
    }
  );
}

export async function saveHistoryToFirestore(record: HistoryRecord): Promise<void> {
  const safeId = record.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128) || `hist-${Date.now()}`;
  const path = `history/${safeId}`;
  const cleanRoomCode = record.roomCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 12);
  const cleanCertId = record.certificateId.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 40);

  try {
    await setDoc(doc(db, 'history', safeId), {
      roomCode: cleanRoomCode,
      quizTitle: record.quizTitle.trim().slice(0, 200) || 'Kuis Hafiz Education',
      playerName: record.playerName.trim().slice(0, 60) || 'Peserta',
      grade: Math.max(0, Math.min(100, Math.round(record.grade))),
      points: Math.max(0, Math.min(200000, Math.round(record.points))),
      correctCount: Math.max(0, Math.min(record.totalQuestions, Math.round(record.correctCount))),
      totalQuestions: Math.max(1, Math.min(200, Math.round(record.totalQuestions))),
      rank: Math.max(1, Math.min(10000, Math.round(record.rank))),
      certificateId: cleanCertId || `HFZ-${Date.now().toString(36).toUpperCase()}`,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function listHistoryFromFirestore(): Promise<HistoryRecord[]> {
  const path = 'history';
  try {
    const q = query(collection(db, 'history'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        timestamp: toIsoString(data.createdAt),
        roomCode: String(data.roomCode || ''),
        quizTitle: String(data.quizTitle || ''),
        playerName: String(data.playerName || ''),
        grade: Number(data.grade ?? 0),
        points: Number(data.points ?? 0),
        correctCount: Number(data.correctCount ?? 0),
        totalQuestions: Number(data.totalQuestions ?? 1),
        rank: Number(data.rank ?? 1),
        certificateId: String(data.certificateId || ''),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteHistoryFromFirestore(recordId: string): Promise<void> {
  const path = `history/${recordId}`;
  try {
    await deleteDoc(doc(db, 'history', recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearAllHistoryFromFirestore(recordIds: string[]): Promise<void> {
  if (recordIds.length === 0) return;
  const path = 'history';
  try {
    const batch = writeBatch(db);
    for (const id of recordIds.slice(0, 450)) {
      batch.delete(doc(db, 'history', id));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- Real-Time 3D Lobby Presence (/rooms/{roomCode}/players/{playerId}) ---

function sanitizeAvatarForFirestore(avatar: AvatarConfig): AvatarConfig {
  return {
    characterId: String(avatar.characterId || 'char-gadis-pita').slice(0, 60),
    skinColor: String(avatar.skinColor || '#fde2cf').slice(0, 20),
    hairId: String(avatar.hairId || 'hair-twintails-pink').slice(0, 60),
    topId: String(avatar.topId || 'top-sailor-pink').slice(0, 60),
    bottomId: String(avatar.bottomId || 'bot-rok-lipit-pink').slice(0, 60),
    shoeId: String(avatar.shoeId || 'shoe-sneaker-sakura').slice(0, 60),
    accessoryId: String(avatar.accessoryId || 'acc-pita-pink').slice(0, 60),
  };
}

export async function joinLobbyInFirestore(
  roomCode: string,
  playerId: string,
  name: string,
  avatar: AvatarConfig,
  avatarLabel: string,
  photoUrl?: string
): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  const cleanPlayerId = playerId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  if (!cleanCode || cleanPlayerId.length < 4) return;

  try {
    const payload: Record<string, unknown> = {
      playerId: cleanPlayerId,
      name: name.trim().slice(0, 60) || 'Peserta',
      avatar: sanitizeAvatarForFirestore(avatar),
      avatarLabel: avatarLabel.trim().slice(0, 60) || 'Avatar',
      joinedAt: serverTimestamp(),
    };
    if (typeof photoUrl === 'string' && photoUrl.trim() && photoUrl.trim().length <= 480) {
      payload.photoUrl = photoUrl.trim();
    }
    await setDoc(doc(db, 'rooms', cleanCode, 'players', cleanPlayerId), payload);
  } catch (error) {
    console.warn('Unable to register lobby presence:', error);
  }
}

export async function updateLobbyPlayerInFirestore(
  roomCode: string,
  playerId: string,
  name: string,
  avatar: AvatarConfig,
  avatarLabel: string,
  photoUrl?: string
): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  const cleanPlayerId = playerId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  if (!cleanCode || cleanPlayerId.length < 4) return;

  try {
    const payload: Record<string, unknown> = {
      name: name.trim().slice(0, 60) || 'Peserta',
      avatar: sanitizeAvatarForFirestore(avatar),
      avatarLabel: avatarLabel.trim().slice(0, 60) || 'Avatar',
    };
    if (typeof photoUrl === 'string' && photoUrl.trim() && photoUrl.trim().length <= 480) {
      payload.photoUrl = photoUrl.trim();
    }
    await updateDoc(doc(db, 'rooms', cleanCode, 'players', cleanPlayerId), payload);
  } catch {
    // Ignore if player already left
  }
}

export async function leaveLobbyInFirestore(roomCode: string, playerId: string): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  const cleanPlayerId = playerId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  if (!cleanCode || cleanPlayerId.length < 4) return;

  try {
    await deleteDoc(doc(db, 'rooms', cleanCode, 'players', cleanPlayerId));
  } catch {
    // Ignore cleanup errors
  }
}

export function subscribeToLobbyPlayers(
  roomCode: string,
  localPlayerId: string,
  onPlayersChange: (remotePlayers: LobbyPlayer[]) => void
): () => void {
  const cleanCode = roomCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (!cleanCode) return () => {};

  const playersCol = collection(db, 'rooms', cleanCode, 'players');
  return onSnapshot(
    playersCol,
    (snap) => {
      const nowMs = Date.now();
      const remotes: LobbyPlayer[] = [];
      snap.forEach((docSnap) => {
        if (docSnap.id === localPlayerId) return;
        const data = docSnap.data();
        // Filter out stale sessions older than 2 hours
        if (data.joinedAt instanceof Timestamp) {
          if (nowMs - data.joinedAt.toMillis() > 2 * 60 * 60 * 1000) return;
        }
        if (data.name && data.avatar) {
          remotes.push({
            id: docSnap.id,
            name: String(data.name),
            isLocal: false,
            avatar: data.avatar as AvatarConfig,
            avatarLabel: String(data.avatarLabel || 'Avatar Peserta'),
            photoUrl: typeof data.photoUrl === 'string' ? data.photoUrl : undefined,
          });
        }
      });
      onPlayersChange(remotes);
    },
    (err) => {
      console.warn('Lobby presence listener error:', err);
    }
  );
}

// --- Per-Participant Private Database (/users/{uid} & /users/{uid}/history) ---

export async function signInParticipantWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function registerParticipantWithEmail(params: {
  email: string;
  password: string;
  displayName: string;
}): Promise<User> {
  const cred = await createUserWithEmailAndPassword(
    auth,
    params.email.trim(),
    params.password
  );
  const cleanName = params.displayName.trim().slice(0, 60);
  if (cleanName) {
    await updateProfile(cred.user, { displayName: cleanName }).catch(() => {});
  }
  await sendEmailVerification(cred.user).catch(() => {});
  return cred.user;
}

export async function signInParticipantWithEmail(params: {
  email: string;
  password: string;
}): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, params.email.trim(), params.password);
  return cred.user;
}

export async function sendParticipantPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export interface LoadedParticipantProfile {
  displayName: string;
  username?: string;
  photoUrl?: string;
  avatar: AvatarConfig;
  school?: string;
  phone?: string;
  targetTrack?: ParticipantTargetTrack;
  targetCampus?: string;
  authMethod?: 'password' | 'google' | 'email';
  savedSkdSummary?: SavedSkdSummary;
}

export async function loadUserProfileFromFirestore(
  uid: string
): Promise<LoadedParticipantProfile | null> {
  const cleanUid = uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  if (!cleanUid) return null;
  try {
    const snap = await getDoc(doc(db, 'users', cleanUid));
    if (!snap.exists()) return null;
    const data = snap.data();
    const meta = sanitizeParticipantProfileMeta({
      username: typeof data.username === 'string' ? data.username : '',
      photoUrl: typeof data.photoUrl === 'string' ? data.photoUrl : '',
      school: typeof data.school === 'string' ? data.school : '',
      phone: typeof data.phone === 'string' ? data.phone : '',
      targetTrack: typeof data.targetTrack === 'string' ? data.targetTrack : 'utbk',
      targetCampus: typeof data.targetCampus === 'string' ? data.targetCampus : '',
      authMethod: typeof data.authMethod === 'string' ? data.authMethod : 'google',
      savedSkdSummary:
        data.savedSkdSummary && typeof data.savedSkdSummary === 'object'
          ? (data.savedSkdSummary as Partial<SavedSkdSummary>)
          : undefined,
    });
    return {
      displayName: String(data.displayName || ''),
      username: meta.username || undefined,
      photoUrl: meta.photoUrl || undefined,
      avatar: data.avatar as AvatarConfig,
      school: meta.school,
      phone: meta.phone,
      targetTrack: meta.targetTrack,
      targetCampus: meta.targetCampus,
      authMethod: meta.authMethod,
      savedSkdSummary: meta.savedSkdSummary,
    };
  } catch (err) {
    console.warn('Unable to load user profile:', err);
    return null;
  }
}

export async function saveUserProfileToFirestore(
  uid: string,
  email: string,
  displayName: string,
  avatar: AvatarConfig,
  metaInput?: {
    username?: string;
    photoUrl?: string;
    school?: string;
    phone?: string;
    targetTrack?: ParticipantTargetTrack;
    targetCampus?: string;
    authMethod?: 'password' | 'google' | 'email';
    savedSkdSummary?: SavedSkdSummary;
  }
): Promise<void> {
  const cleanUid = uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  if (!cleanUid || !email) return;
  const ref = doc(db, 'users', cleanUid);
  const cleanName = displayName.trim().slice(0, 60) || email.split('@')[0] || 'Peserta';
  const cleanAvatar = sanitizeAvatarForFirestore(avatar);
  const meta = sanitizeParticipantProfileMeta(metaInput);

  try {
    const existingSnap = await getDoc(ref);
    const payload: Record<string, unknown> = {
      displayName: cleanName,
      avatar: cleanAvatar,
      updatedAt: serverTimestamp(),
    };
    if (metaInput?.username !== undefined && meta.username) payload.username = meta.username;
    if (metaInput?.photoUrl !== undefined && meta.photoUrl && meta.photoUrl.length <= 390000) {
      payload.photoUrl = meta.photoUrl;
    }
    if (metaInput?.school !== undefined) payload.school = meta.school;
    if (metaInput?.phone !== undefined) payload.phone = meta.phone;
    if (metaInput?.targetTrack !== undefined) payload.targetTrack = meta.targetTrack;
    if (metaInput?.targetCampus !== undefined) payload.targetCampus = meta.targetCampus;
    if (metaInput?.authMethod !== undefined) payload.authMethod = meta.authMethod;
    if (metaInput?.savedSkdSummary !== undefined && meta.savedSkdSummary) {
      payload.savedSkdSummary = meta.savedSkdSummary;
    }

    if (existingSnap.exists()) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, {
        uid: cleanUid,
        email: email.slice(0, 200),
        ...payload,
      });
    }
  } catch (err) {
    console.warn('Unable to save user profile:', err);
  }
}

export async function saveUserHistoryToFirestore(
  uid: string,
  record: HistoryRecord
): Promise<void> {
  const cleanUid = uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  const safeId = record.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128) || `hist-${Date.now()}`;
  if (!cleanUid) return;
  const cleanRoomCode = record.roomCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 12);
  const cleanCertId = record.certificateId.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 40);

  try {
    await setDoc(doc(db, 'users', cleanUid, 'history', safeId), {
      roomCode: cleanRoomCode,
      quizTitle: record.quizTitle.trim().slice(0, 200) || 'Kuis Hafiz Education',
      playerName: record.playerName.trim().slice(0, 60) || 'Peserta',
      grade: Math.max(0, Math.min(100, Math.round(record.grade))),
      points: Math.max(0, Math.min(200000, Math.round(record.points))),
      correctCount: Math.max(0, Math.min(record.totalQuestions, Math.round(record.correctCount))),
      totalQuestions: Math.max(1, Math.min(200, Math.round(record.totalQuestions))),
      rank: Math.max(1, Math.min(10000, Math.round(record.rank))),
      certificateId: cleanCertId || `HFZ-${Date.now().toString(36).toUpperCase()}`,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Unable to save user personal history:', err);
  }
}

export async function listUserHistoryFromFirestore(uid: string): Promise<HistoryRecord[]> {
  const cleanUid = uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  if (!cleanUid) return [];
  try {
    const q = query(collection(db, 'users', cleanUid, 'history'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        timestamp: toIsoString(data.createdAt),
        roomCode: String(data.roomCode || ''),
        quizTitle: String(data.quizTitle || ''),
        playerName: String(data.playerName || ''),
        grade: Number(data.grade ?? 0),
        points: Number(data.points ?? 0),
        correctCount: Number(data.correctCount ?? 0),
        totalQuestions: Number(data.totalQuestions ?? 1),
        rank: Number(data.rank ?? 1),
        certificateId: String(data.certificateId || ''),
      };
    });
  } catch (err) {
    console.warn('Unable to list user personal history:', err);
    return [];
  }
}

export async function deleteUserHistoryFromFirestore(
  uid: string,
  recordId: string
): Promise<void> {
  const cleanUid = uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  const safeId = recordId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  if (!cleanUid || !safeId) return;
  const path = `users/${cleanUid}/history/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', cleanUid, 'history', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearAllUserHistoryFromFirestore(
  uid: string,
  recordIds: string[]
): Promise<void> {
  const cleanUid = uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  if (!cleanUid || recordIds.length === 0) return;
  const path = `users/${cleanUid}/history`;
  try {
    const batch = writeBatch(db);
    for (const rawId of recordIds.slice(0, 450)) {
      const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
      if (safeId) {
        batch.delete(doc(db, 'users', cleanUid, 'history', safeId));
      }
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertRoomLeaderboardScore(
  roomCode: string,
  uid: string,
  payload: {
    name: string;
    points: number;
    grade: number;
    correctCount: number;
    totalQuestions: number;
    answeredCount: number;
    cheatCount: number;
    status: 'playing' | 'finished';
  }
): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  const cleanUid = uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  if (!cleanCode || !cleanUid) return;

  const totalQ = Math.max(1, Math.min(200, Math.round(payload.totalQuestions)));
  const correct = Math.max(0, Math.min(totalQ, Math.round(payload.correctCount)));
  const answered = Math.max(0, Math.min(totalQ, Math.round(payload.answeredCount)));

  try {
    await setDoc(doc(db, 'rooms', cleanCode, 'leaderboard', cleanUid), {
      uid: cleanUid,
      name: payload.name.trim().slice(0, 60) || 'Peserta',
      points: Math.max(0, Math.min(200000, Math.round(payload.points))),
      grade: Math.max(0, Math.min(100, Math.round(payload.grade))),
      correctCount: correct,
      totalQuestions: totalQ,
      answeredCount: answered,
      cheatCount: Math.max(0, Math.min(500, Math.round(payload.cheatCount))),
      status: payload.status === 'finished' ? 'finished' : 'playing',
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Unable to sync room leaderboard score:', err);
  }
}

export function subscribeToRoomLeaderboard(
  roomCode: string,
  currentUid: string | null,
  onUpdate: (entries: import('./types/quiz').LeaderboardEntry[]) => void
): () => void {
  const cleanCode = roomCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (!cleanCode) return () => {};

  return onSnapshot(
    collection(db, 'rooms', cleanCode, 'leaderboard'),
    (snap) => {
      const list: import('./types/quiz').LeaderboardEntry[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        const uid = String(d.uid || docSnap.id);
        list.push({
          id: uid,
          name: String(d.name || 'Peserta'),
          points: Number(d.points ?? 0),
          grade: Number(d.grade ?? 0),
          correctCount: Number(d.correctCount ?? 0),
          totalQuestions: Number(d.totalQuestions ?? 1),
          answeredCount: Number(d.answeredCount ?? 0),
          cheatCount: Number(d.cheatCount ?? 0),
          status: d.status === 'finished' ? 'finished' : 'playing',
          isCurrentUser: Boolean(currentUid && uid === currentUid),
          timestamp: toIsoString(d.updatedAt),
        });
      });
      onUpdate(list);
    },
    (err) => {
      console.warn('Room leaderboard listener error:', err);
    }
  );
}

export interface SiteSettings {
  brandName: string;
  heroTagline: string;
  heroTitle: string;
  heroDescription: string;
  announcement: string;
  founderPhoto?: string;
  playStoreUrl?: string;
  appStoreUrl?: string;
  microsoftStoreUrl?: string;
  androidPackageId?: string;
  iosBundleId?: string;
  appleTeamId?: string;
  microsoftStoreId?: string;
  microsoftAppGuid?: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brandName: 'Hafiz Education',
  heroTagline: 'Lobi Kuis Interaktif · Live Teaching · Portal Belajar & E-Sertifikat',
  heroTitle: 'Belajar Seru & Kompetitif di Arena Kuis Hafiz Education',
  heroDescription:
    'Dandani avatar kamu dengan ratusan kostum kosmik, ikuti Live Teaching Zoom, jelajahi Portal Belajar UTBK, TKA, Kedinasan & Kelas X–XII, lalu raih Sertifikat Digital HD!',
  announcement: '',
  founderPhoto: '',
  playStoreUrl: '',
  appStoreUrl: '',
  microsoftStoreUrl: '',
  androidPackageId: 'com.hafizeducation.app',
  iosBundleId: 'com.hafizeducation.app',
  appleTeamId: '',
  microsoftStoreId: '',
  microsoftAppGuid: '',
};

export function subscribeToSiteSettings(onUpdate: (settings: SiteSettings) => void): () => void {
  return onSnapshot(
    doc(db, 'settings', 'site'),
    (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      onUpdate({
        brandName: sanitizeLegacySiteCopy(String(d.brandName || DEFAULT_SITE_SETTINGS.brandName)),
        heroTagline: sanitizeLegacySiteCopy(String(d.heroTagline ?? DEFAULT_SITE_SETTINGS.heroTagline)),
        heroTitle: sanitizeLegacySiteCopy(String(d.heroTitle || DEFAULT_SITE_SETTINGS.heroTitle)),
        heroDescription: sanitizeLegacySiteCopy(String(d.heroDescription ?? DEFAULT_SITE_SETTINGS.heroDescription)),
        announcement: sanitizeLegacySiteCopy(String(d.announcement ?? '')),
        founderPhoto: typeof d.founderPhoto === 'string' ? d.founderPhoto : '',
        playStoreUrl: sanitizeHttpsStoreUrl(d.playStoreUrl, ['play.google.com']),
        appStoreUrl: sanitizeHttpsStoreUrl(d.appStoreUrl, ['apps.apple.com', 'itunes.apple.com']),
        microsoftStoreUrl: sanitizeHttpsStoreUrl(d.microsoftStoreUrl, [
          'apps.microsoft.com',
          'www.microsoft.com',
          'microsoft.com',
        ]),
        androidPackageId: sanitizePackageId(d.androidPackageId, 'com.hafizeducation.app'),
        iosBundleId: sanitizePackageId(d.iosBundleId, 'com.hafizeducation.app'),
        appleTeamId: sanitizeAppleTeamId(d.appleTeamId),
        microsoftStoreId: sanitizeMicrosoftStoreId(d.microsoftStoreId),
        microsoftAppGuid: sanitizeUuidGuid(d.microsoftAppGuid),
      });
    },
    (err) => {
      console.warn('Site settings listener error:', err);
    }
  );
}

export async function saveSiteSettingsToFirestore(settings: SiteSettings): Promise<void> {
  const path = 'settings/site';
  try {
    const payload: Record<string, unknown> = {
      brandName: settings.brandName.trim().slice(0, 80) || DEFAULT_SITE_SETTINGS.brandName,
      heroTagline: settings.heroTagline.trim().slice(0, 160),
      heroTitle: settings.heroTitle.trim().slice(0, 160) || DEFAULT_SITE_SETTINGS.heroTitle,
      heroDescription: settings.heroDescription.trim().slice(0, 400),
      announcement: settings.announcement.trim().slice(0, 300),
      playStoreUrl: sanitizeHttpsStoreUrl(settings.playStoreUrl, ['play.google.com']),
      appStoreUrl: sanitizeHttpsStoreUrl(settings.appStoreUrl, ['apps.apple.com', 'itunes.apple.com']),
      microsoftStoreUrl: sanitizeHttpsStoreUrl(settings.microsoftStoreUrl, [
        'apps.microsoft.com',
        'www.microsoft.com',
        'microsoft.com',
      ]),
      androidPackageId: sanitizePackageId(settings.androidPackageId, 'com.hafizeducation.app'),
      iosBundleId: sanitizePackageId(settings.iosBundleId, 'com.hafizeducation.app'),
      appleTeamId: sanitizeAppleTeamId(settings.appleTeamId),
      microsoftStoreId: sanitizeMicrosoftStoreId(settings.microsoftStoreId),
      microsoftAppGuid: sanitizeUuidGuid(settings.microsoftAppGuid),
      updatedAt: serverTimestamp(),
    };
    if (typeof settings.founderPhoto === 'string' && settings.founderPhoto.length <= 390000) {
      payload.founderPhoto = settings.founderPhoto;
    }
    await setDoc(doc(db, 'settings', 'site'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// --- Participant Database (/users) for Admin ---

export interface ParticipantRecord {
  uid: string;
  username?: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  school?: string;
  phone?: string;
  targetTrack?: ParticipantTargetTrack;
  targetCampus?: string;
  authMethod?: 'password' | 'google' | 'email';
  savedSkdSummary?: SavedSkdSummary;
  avatarLabel?: string;
  updatedAt: string;
}

export async function listParticipantsFromFirestore(): Promise<ParticipantRecord[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, 'users'));
    const list: ParticipantRecord[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        uid: String(data.uid || d.id),
        username: typeof data.username === 'string' ? data.username : undefined,
        email: String(data.email || ''),
        displayName: String(data.displayName || 'Peserta'),
        photoUrl: typeof data.photoUrl === 'string' ? data.photoUrl : undefined,
        school: typeof data.school === 'string' ? data.school : '',
        phone: typeof data.phone === 'string' ? data.phone : '',
        targetTrack:
          data.targetTrack === 'kedinasan' || data.targetTrack === 'both'
            ? data.targetTrack
            : 'utbk',
        targetCampus: typeof data.targetCampus === 'string' ? data.targetCampus : '',
        authMethod:
          data.authMethod === 'password'
            ? 'password'
            : data.authMethod === 'email'
              ? 'email'
              : 'google',
        savedSkdSummary:
          data.savedSkdSummary && typeof data.savedSkdSummary === 'object'
            ? (data.savedSkdSummary as SavedSkdSummary)
            : undefined,
        avatarLabel: typeof data.avatar?.characterId === 'string' ? data.avatar.characterId : undefined,
        updatedAt: toIsoString(data.updatedAt),
      };
    });
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function adminUpsertParticipantToFirestore(
  participant: ParticipantRecord,
  fallbackAvatar: AvatarConfig
): Promise<void> {
  const cleanUid = participant.uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  if (!cleanUid) return;
  try {
    const ref = doc(db, 'users', cleanUid);
    const snap = await getDoc(ref);
    const payload: Record<string, unknown> = {
      uid: cleanUid,
      email: (participant.email || `${cleanUid}@peserta.hafizeducation.my.id`).slice(0, 200),
      displayName: participant.displayName.trim().slice(0, 60) || 'Peserta',
      school: (participant.school || '').trim().slice(0, 120),
      phone: (participant.phone || '').trim().slice(0, 24),
      targetTrack:
        participant.targetTrack === 'kedinasan' || participant.targetTrack === 'both'
          ? participant.targetTrack
          : 'utbk',
      targetCampus: (participant.targetCampus || '').trim().slice(0, 120),
      authMethod:
        participant.authMethod === 'google' || participant.authMethod === 'email'
          ? participant.authMethod
          : 'password',
      avatar: sanitizeAvatarForFirestore(fallbackAvatar),
      updatedAt: serverTimestamp(),
    };
    if (participant.username) payload.username = participant.username.slice(0, 40);
    if (participant.photoUrl && participant.photoUrl.length <= 390000) {
      payload.photoUrl = participant.photoUrl;
    }
    if (snap.exists()) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, payload);
    }
  } catch (err) {
    console.warn('Unable to sync participant upsert to Firestore:', err);
  }
}

export async function deleteParticipantFromFirestore(uid: string): Promise<void> {
  const cleanUid = uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  if (!cleanUid) return;
  const path = `users/${cleanUid}`;
  try {
    const histSnap = await getDocs(collection(db, 'users', cleanUid, 'history'));
    if (!histSnap.empty) {
      const batch = writeBatch(db);
      histSnap.docs.slice(0, 450).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    await deleteDoc(doc(db, 'users', cleanUid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearAllParticipantsFromFirestore(uids: string[]): Promise<void> {
  const cleanUids = uids
    .map((u) => u.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128))
    .filter(Boolean);
  if (cleanUids.length === 0) return;
  for (const uid of cleanUids) {
    await deleteParticipantFromFirestore(uid);
  }
}

// --- Admin-Uploaded Study Materials (/materials/{materialId}) ---

function parseMaterialDoc(
  docId: string,
  data: Record<string, unknown>
): import('./data/academicCatalog').StudyModule {
  const portal =
    data.portal === 'tka' ||
    data.portal === 'sma' ||
    data.portal === 'utbk' ||
    data.portal === 'kedinasan'
      ? data.portal
      : 'utbk';
  return {
    id: String(data.id || docId),
    portal,
    grade:
      data.grade === 'X' || data.grade === 'XI' || data.grade === 'XII' ? data.grade : undefined,
    tkaTrack:
      data.tkaTrack === 'Saintek' || data.tkaTrack === 'Soshum' ? data.tkaTrack : undefined,
    subject: String(data.subject || 'Materi'),
    title: String(data.title || 'Materi Belajar'),
    subtitle: String(data.subtitle || ''),
    readMinutes: Number(data.readMinutes ?? 8),
    summary: String(data.summary || ''),
    keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints.map(String) : [],
    formulas: Array.isArray(data.formulas) ? data.formulas.map(String) : [],
    youtubeUrl: typeof data.youtubeUrl === 'string' ? data.youtubeUrl : undefined,
    pptUrl: typeof data.pptUrl === 'string' ? data.pptUrl : undefined,
    pptName: typeof data.pptName === 'string' ? data.pptName : undefined,
    practiceQuestions: [],
    updatedAt: toIsoString(data.updatedAt),
  };
}

export async function saveMaterialToFirestore(
  material: import('./data/academicCatalog').StudyModule,
  ownerUid: string
): Promise<void> {
  const safeId =
    material.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) || `mat-${Date.now().toString(36)}`;
  const path = `materials/${safeId}`;
  try {
    const payload: Record<string, unknown> = {
      id: safeId,
      portal: material.portal,
      subject: material.subject.trim().slice(0, 120) || 'Umum',
      title: material.title.trim().slice(0, 200) || 'Materi Belajar',
      subtitle: (material.subtitle || '').trim().slice(0, 200),
      readMinutes: Math.max(1, Math.min(180, Math.round(material.readMinutes || 8))),
      summary: material.summary.trim().slice(0, 4000) || 'Ringkasan materi pembelajaran.',
      keyPoints: (material.keyPoints || [])
        .map((p) => p.trim().slice(0, 300))
        .filter(Boolean)
        .slice(0, 40),
      formulas: (material.formulas || [])
        .map((f) => f.trim().slice(0, 300))
        .filter(Boolean)
        .slice(0, 30),
      ownerUid,
      updatedAt: serverTimestamp(),
    };
    if (material.portal === 'sma' && material.grade) {
      payload.grade = material.grade;
    }
    if (material.portal === 'tka' && material.tkaTrack) {
      payload.tkaTrack = material.tkaTrack;
    }
    if (material.youtubeUrl && material.youtubeUrl.trim()) {
      payload.youtubeUrl = material.youtubeUrl.trim().slice(0, 300);
    }
    if (material.pptUrl && material.pptUrl.trim()) {
      payload.pptUrl = material.pptUrl.trim().slice(0, 500);
    }
    if (material.pptName && material.pptName.trim()) {
      payload.pptName = material.pptName.trim().slice(0, 160);
    }
    await setDoc(doc(db, 'materials', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function listMaterialsFromFirestore(): Promise<
  import('./data/academicCatalog').StudyModule[]
> {
  const path = 'materials';
  try {
    const snap = await getDocs(collection(db, 'materials'));
    const items = snap.docs.map((d) => parseMaterialDoc(d.id, d.data()));
    return items.sort(
      (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    );
  } catch (error) {
    console.warn(`Unable to list ${path} from Firestore:`, error);
    return [];
  }
}

export async function deleteMaterialFromFirestore(materialId: string): Promise<void> {
  const safeId = materialId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  if (!safeId) return;
  const path = `materials/${safeId}`;
  try {
    await deleteDoc(doc(db, 'materials', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToAllMaterials(
  onUpdate: (materials: import('./data/academicCatalog').StudyModule[]) => void
): () => void {
  return onSnapshot(
    collection(db, 'materials'),
    (snap) => {
      const items = snap.docs.map((d) => parseMaterialDoc(d.id, d.data()));
      items.sort(
        (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
      );
      onUpdate(items);
    },
    (err) => {
      console.warn('All materials listener error:', err);
    }
  );
}

// --- Admin-Only Live Teaching Zoom Sessions (/liveSessions/{sessionId}) ---

export interface LiveTeachingSession {
  id: string;
  title: string;
  tutorName: string;
  category: string;
  scheduleLabel: string;
  zoomUrl: string;
  isLive: boolean;
  updatedAt?: string;
}

export async function saveLiveSessionToFirestore(
  session: LiveTeachingSession,
  ownerUid: string
): Promise<void> {
  const safeId =
    session.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) || `live-${Date.now().toString(36)}`;
  const path = `liveSessions/${safeId}`;
  try {
    await setDoc(doc(db, 'liveSessions', safeId), {
      id: safeId,
      title: session.title.trim().slice(0, 160) || 'Kelas Live Teaching',
      tutorName: session.tutorName.trim().slice(0, 100) || 'Mentor Hafiz Education',
      category: session.category.trim().slice(0, 60) || 'UTBK-SNBT',
      scheduleLabel: session.scheduleLabel.trim().slice(0, 100) || 'Segera Dimulai',
      zoomUrl: session.zoomUrl.trim().slice(0, 500),
      isLive: Boolean(session.isLive),
      ownerUid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteLiveSessionFromFirestore(sessionId: string): Promise<void> {
  const safeId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  if (!safeId) return;
  const path = `liveSessions/${safeId}`;
  try {
    await deleteDoc(doc(db, 'liveSessions', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToLiveSessions(
  onUpdate: (sessions: LiveTeachingSession[]) => void
): () => void {
  return onSnapshot(
    collection(db, 'liveSessions'),
    (snap) => {
      const items: LiveTeachingSession[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: String(data.id || d.id),
          title: String(data.title || 'Kelas Live Teaching'),
          tutorName: String(data.tutorName || 'Mentor Hafiz Education'),
          category: String(data.category || 'Umum'),
          scheduleLabel: String(data.scheduleLabel || 'Terjadwal'),
          zoomUrl: String(data.zoomUrl || ''),
          isLive: Boolean(data.isLive),
          updatedAt: toIsoString(data.updatedAt),
        };
      });
      items.sort((a, b) => {
        if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      });
      onUpdate(items);
    },
    (err) => {
      console.warn('Live sessions listener error:', err);
    }
  );
}


