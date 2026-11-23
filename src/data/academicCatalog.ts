import type { QuizQuestion, QuizRoom } from '../types/quiz';

export type PortalTab =
  | 'asas-xii'
  | 'tryout-utbk'
  | 'tryout-tka'
  | 'kedinasan'
  | 'live-teaching'
  | 'utbk'
  | 'tka'
  | 'sma';
export type SmaGrade = 'X' | 'XI' | 'XII';
export type TkaTrack = 'Saintek' | 'Soshum';

export interface TryOutPortal {
  id: string;
  code: string;
  title: string;
  category: 'ASAS XII' | 'UTBK-SNBT' | 'TKA Saintek' | 'TKA Soshum' | 'Kedinasan' | 'Kelas X–XII';
  level: string;
  durationMinutes: number;
  description: string;
  questions: QuizQuestion[];
}

export interface StudyModule {
  id: string;
  portal: 'utbk' | 'sma' | 'tka' | 'kedinasan';
  grade?: SmaGrade;
  tkaTrack?: TkaTrack;
  subject: string;
  title: string;
  subtitle: string;
  readMinutes: number;
  summary: string;
  keyPoints: string[];
  formulas: string[];
  youtubeUrl?: string;
  pptUrl?: string;
  pptName?: string;
  practiceQuestions: QuizQuestion[];
  updatedAt?: string;
}

// Dikosongkan sesuai permintaan Admin — seluruh Try Out UTBK, TKA, dan Kelas X-XII
// kini diunggah & dikelola langsung oleh Admin melalui Studio Admin.
export const TRYOUT_PORTALS: TryOutPortal[] = [];

// Dikosongkan sesuai permintaan Admin — seluruh Modul TKA, Materi UTBK-SNBT,
// dan Materi Kelas X-XII kini diunggah & dikelola langsung oleh Admin.
export const STUDY_MODULES: StudyModule[] = [];

export function tryOutToRoom(portal: TryOutPortal): QuizRoom {
  return {
    code: portal.code.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 12) || 'TRYOUT1',
    title: portal.title,
    questions: portal.questions,
    createdAt: new Date().toISOString(),
    status: 'waiting',
  };
}

export function moduleToPracticeRoom(mod: StudyModule): QuizRoom {
  const cleanSuffix = mod.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8) || 'MOD1';
  return {
    code: `LAT-${cleanSuffix}`.slice(0, 12),
    title: `Latihan ${mod.subject}: ${mod.title}`,
    questions: mod.practiceQuestions,
    createdAt: new Date().toISOString(),
    status: 'waiting',
  };
}
