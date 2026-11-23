import React, { useEffect, useMemo, useState } from 'react';
import type { HistoryRecord, QuizRoom } from '../types/quiz';
import type { LiveTeachingSession } from '../firebase';
import { extractYouTubeEmbedUrl } from '../utils/studyPlayground';
import { getQuizScheduleStatus } from '../utils/quizSchedule';
import {
  STUDY_MODULES,
  TRYOUT_PORTALS,
  moduleToPracticeRoom,
  tryOutToRoom,
  type PortalTab,
  type SmaGrade,
  type StudyModule,
  type TkaTrack,
} from '../data/academicCatalog';

const BOOKMARK_STORAGE_KEY = 'hafiz_bookmarked_materials_v1';

interface AcademicPortalsViewProps {
  initialTab?: PortalTab;
  userEmail: string | null;
  isAdmin: boolean;
  uploadedRooms: QuizRoom[];
  uploadedMaterials: StudyModule[];
  liveSessions: LiveTeachingSession[];
  userHistory: HistoryRecord[];
  onDownloadCertificate: (rec: HistoryRecord) => void;
  onDeleteHistoryItem?: (rec: HistoryRecord) => void;
  onClearAllHistory?: () => void;
  onParticipantLogin: () => Promise<void>;
  onOpenParticipantAuth?: (mode?: 'register' | 'login' | 'profile') => void;
  onParticipantLogout?: () => Promise<void>;
  onLaunchQuizRoom: (room: QuizRoom) => void;
  onEditUploadedRoom?: (room: QuizRoom) => void;
  onDeleteUploadedRoom?: (room: QuizRoom) => void;
  onDeleteUploadedMaterial?: (materialId: string) => void;
  onToggleLiveSession?: (session: LiveTeachingSession) => void;
  onDeleteLiveSession?: (sessionId: string) => void;
  onOpenCampusAnalysis?: (mode?: 'utbk' | 'kedinasan') => void;
  onOpenAdminUpload: () => void;
  onBackHome: () => void;
}

export const AcademicPortalsView: React.FC<AcademicPortalsViewProps> = ({
  initialTab = 'asas-xii',
  userEmail,
  isAdmin,
  uploadedRooms,
  uploadedMaterials,
  liveSessions,
  userHistory,
  onDownloadCertificate,
  onDeleteHistoryItem,
  onClearAllHistory,
  onParticipantLogin,
  onOpenParticipantAuth,
  onParticipantLogout,
  onLaunchQuizRoom,
  onEditUploadedRoom,
  onDeleteUploadedRoom,
  onDeleteUploadedMaterial,
  onToggleLiveSession,
  onDeleteLiveSession,
  onOpenCampusAnalysis,
  onOpenAdminUpload,
  onBackHome,
}) => {
  const [activeTab, setActiveTab] = useState<PortalTab>(initialTab);
  const [tkaTryOutFilter, setTkaTryOutFilter] = useState<'Semua' | 'TKA Saintek' | 'TKA Soshum'>('Semua');
  const [smaGradeFilter, setSmaGradeFilter] = useState<SmaGrade | 'Semua'>('Semua');
  const [tkaTrackFilter, setTkaTrackFilter] = useState<TkaTrack | 'Semua'>('Semua');
  const [selectedModule, setSelectedModule] = useState<StudyModule | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(BOOKMARK_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const allMaterials = useMemo(() => {
    const byId = new Map<string, StudyModule>();
    for (const m of uploadedMaterials) byId.set(m.id, m);
    for (const m of STUDY_MODULES) {
      if (!byId.has(m.id)) byId.set(m.id, m);
    }
    return Array.from(byId.values());
  }, [uploadedMaterials]);

  const asasXiiCards = useMemo(() => {
    const builtIn = TRYOUT_PORTALS.filter((p) => p.category === 'ASAS XII').map((p) => ({
      id: p.id,
      code: p.code,
      title: p.title,
      category: p.category,
      level: p.level,
      durationMinutes: p.durationMinutes,
      description: p.description,
      questionCount: p.questions.length,
      room: tryOutToRoom(p),
    }));
    const codes = new Set(builtIn.map((b) => b.code));
    const uploaded = uploadedRooms
      .filter((r) => r.questions.length > 0 && r.category === 'ASAS XII' && !codes.has(r.code))
      .map((r) => ({
        id: `custom-${r.code}`,
        code: r.code,
        title: r.title,
        category: 'ASAS XII',
        level: 'Asesmen Resmi Kelas XII',
        durationMinutes: Math.max(15, r.questions.length * 2),
        description:
          'Paket Asesmen Sumatif Akhir Semester (ASAS) Kelas XII resmi lengkap dengan rekap riwayat nilai dan E-Sertifikat Astronot HD.',
        questionCount: r.questions.length,
        room: { ...r, status: r.status === 'started' ? ('started' as const) : ('waiting' as const) },
      }));
    return [...uploaded, ...builtIn];
  }, [uploadedRooms]);

  const historySummary = useMemo(() => {
    if (userHistory.length === 0) {
      return { count: 0, avgGrade: 0, bestGrade: 0 };
    }
    const total = userHistory.reduce((acc, r) => acc + r.grade, 0);
    const best = Math.max(...userHistory.map((r) => r.grade));
    return {
      count: userHistory.length,
      avgGrade: Math.round(total / userHistory.length),
      bestGrade: best,
    };
  }, [userHistory]);

  const tryOutUtbkCards = useMemo(() => {
    const builtIn = TRYOUT_PORTALS.filter((p) => p.category === 'UTBK-SNBT').map((p) => ({
      id: p.id,
      code: p.code,
      title: p.title,
      category: p.category,
      level: p.level,
      durationMinutes: p.durationMinutes,
      description: p.description,
      questionCount: p.questions.length,
      room: tryOutToRoom(p),
    }));
    const codes = new Set(builtIn.map((b) => b.code));
    const uploaded = uploadedRooms
      .filter((r) => r.questions.length > 0 && r.category === 'UTBK-SNBT' && !codes.has(r.code))
      .map((r) => ({
        id: `custom-${r.code}`,
        code: r.code,
        title: r.title,
        category: 'UTBK-SNBT',
        level: 'Upload Resmi Admin',
        durationMinutes: Math.max(15, r.questions.length * 2),
        description: 'Paket Try Out UTBK & SNBT resmi yang diunggah Admin lengkap dengan pembahasan dan E-Sertifikat HD.',
        questionCount: r.questions.length,
        room: { ...r, status: r.status === 'started' ? ('started' as const) : ('waiting' as const) },
      }));
    return [...uploaded, ...builtIn];
  }, [uploadedRooms]);

  const tryOutTkaCards = useMemo(() => {
    const builtIn = TRYOUT_PORTALS.filter(
      (p) => p.category === 'TKA Saintek' || p.category === 'TKA Soshum'
    ).map((p) => ({
      id: p.id,
      code: p.code,
      title: p.title,
      category: p.category,
      level: p.level,
      durationMinutes: p.durationMinutes,
      description: p.description,
      questionCount: p.questions.length,
      room: tryOutToRoom(p),
    }));
    const codes = new Set(builtIn.map((b) => b.code));
    const uploaded = uploadedRooms
      .filter(
        (r) =>
          r.questions.length > 0 &&
          (r.category === 'TKA Saintek' || r.category === 'TKA Soshum') &&
          !codes.has(r.code)
      )
      .map((r) => ({
        id: `custom-${r.code}`,
        code: r.code,
        title: r.title,
        category: r.category || 'TKA Saintek',
        level: 'Upload Resmi Admin',
        durationMinutes: Math.max(15, r.questions.length * 2),
        description: `Paket Try Out ${r.category} resmi yang diunggah Admin lengkap dengan pembahasan dan E-Sertifikat HD.`,
        questionCount: r.questions.length,
        room: { ...r, status: r.status === 'started' ? ('started' as const) : ('waiting' as const) },
      }));
    const all = [...uploaded, ...builtIn];
    if (tkaTryOutFilter === 'Semua') return all;
    return all.filter((item) => item.category === tkaTryOutFilter);
  }, [uploadedRooms, tkaTryOutFilter]);

  const utbkModules = useMemo(() => allMaterials.filter((m) => m.portal === 'utbk'), [allMaterials]);

  const tkaModules = useMemo(() => {
    const all = allMaterials.filter((m) => m.portal === 'tka');
    if (tkaTrackFilter === 'Semua') return all;
    return all.filter((m) => m.tkaTrack === tkaTrackFilter);
  }, [allMaterials, tkaTrackFilter]);

  const smaSections = useMemo(() => {
    const grades: SmaGrade[] = smaGradeFilter === 'Semua' ? ['X', 'XI', 'XII'] : [smaGradeFilter];
    return grades.map((grade) => {
      const modules = allMaterials.filter((m) => m.portal === 'sma' && m.grade === grade);
      const builtInTryOut = TRYOUT_PORTALS.find(
        (p) =>
          (grade === 'X' && p.id === 'to-sma-x') ||
          (grade === 'XI' && p.id === 'to-sma-xi') ||
          (grade === 'XII' && p.id === 'to-sma-xii')
      );
      const uploadedForGrade = uploadedRooms.filter(
        (r) => r.questions.length > 0 && r.category === `Kelas ${grade}`
      );
      return {
        grade,
        modules,
        tryOuts: [
          ...uploadedForGrade.map((r) => ({ ...r, status: r.status === 'started' ? ('started' as const) : ('waiting' as const) })),
          ...(builtInTryOut ? [tryOutToRoom(builtInTryOut)] : []),
        ],
      };
    });
  }, [smaGradeFilter, uploadedRooms, allMaterials]);

  const kedinasanTryOutCards = useMemo(() => {
    return uploadedRooms
      .filter((r) => r.questions.length > 0 && r.category === 'Kedinasan')
      .map((r) => ({
        id: `ked-${r.code}`,
        code: r.code,
        title: r.title,
        category: 'Kedinasan',
        level: 'Simulasi SKD Kedinasan',
        durationMinutes: Math.max(20, r.questions.length * 2),
        description:
          'Paket Try Out SKD Kedinasan (TWK, TIU, TKP) resmi dari Admin lengkap dengan pembahasan dan E-Sertifikat HD.',
        questionCount: r.questions.length,
        room: { ...r, status: r.status === 'started' ? ('started' as const) : ('waiting' as const) },
      }));
  }, [uploadedRooms]);

  const kedinasanModules = useMemo(
    () => allMaterials.filter((m) => m.portal === 'kedinasan'),
    [allMaterials]
  );

  const totalTkaModules = allMaterials.filter((m) => m.portal === 'tka').length;
  const totalSmaModules = allMaterials.filter((m) => m.portal === 'sma').length;

  // Participant Account Gate (Tanpa Google — Nama & Kata Sandi)
  if (!userEmail) {
    return (
      <section id="view-portals-login-gate" className="max-w-2xl mx-auto py-8 sm:py-14">
        <div className="hero-glow-card holo-top-beam p-8 sm:p-10 rounded-3xl text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full p-1.5 bg-gradient-to-br from-sky-400 via-indigo-500 to-teal-400 shadow-[0_0_28px_rgba(56,189,248,0.45)]">
            <img
              src="/assets/aistudio/Favicon_0fd84ae5.png"
              alt="Logo Hafiz Education"
              className="w-full h-full rounded-full object-cover bg-slate-900"
            />
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-sky-300 tracking-wide">
              Portal Akademik Hafiz Education
            </p>
            <h1 className="font-display text-2xl sm:text-4xl font-bold text-gold-gradient text-balance">
              Masuk atau Buat Akun Peserta untuk Membuka Portal
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
              Buat akun peserta cukup dengan Nama dan Kata Sandi (tanpa perlu login Google) untuk mengakses Try Out UTBK, Try Out TKA, Modul TKA, Materi UTBK-SNBT, serta Materi Kelas X–XII.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-y border-sky-400/20 py-4">
            <div>
              <p className="font-display text-lg font-bold text-sky-300 tabular-nums">
                {tryOutUtbkCards.length}
              </p>
              <p className="text-[11px] text-slate-400">Try Out UTBK</p>
            </div>
            <div>
              <p className="font-display text-lg font-bold text-indigo-300 tabular-nums">
                {tryOutTkaCards.length}
              </p>
              <p className="text-[11px] text-slate-400">Try Out TKA</p>
            </div>
            <div>
              <p className="font-display text-lg font-bold text-teal-300 tabular-nums">
                {totalTkaModules}
              </p>
              <p className="text-[11px] text-slate-400">Modul TKA</p>
            </div>
            <div>
              <p className="font-display text-lg font-bold text-amber-300 tabular-nums">
                {totalSmaModules}
              </p>
              <p className="text-[11px] text-slate-400">Materi X · XI · XII</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <button
              type="button"
              id="btn-portals-register"
              onClick={() => (onOpenParticipantAuth ? onOpenParticipantAuth('register') : onParticipantLogin())}
              className="btn-gold w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-extrabold whitespace-nowrap"
            >
              Buat Akun (Nama &amp; Sandi)
            </button>
            {onOpenParticipantAuth && (
              <button
                type="button"
                id="btn-portals-login"
                onClick={() => onOpenParticipantAuth('login')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/40 text-sm font-bold text-indigo-100 transition whitespace-nowrap"
              >
                Masuk Akun
              </button>
            )}
            <button
              type="button"
              onClick={onBackHome}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800/85 hover:bg-slate-700/85 border border-sky-400/30 text-sm font-bold text-sky-100 transition whitespace-nowrap"
            >
              Beranda
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="view-portals" className="space-y-8">
      {/* Cosmic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sky-400/20 pb-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-sky-300">
            Hafiz Education Academic Suite · {userEmail}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gold-gradient">
            Portal Belajar &amp; Perpustakaan Materi
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Akses Live Teaching Zoom, Portal Kedinasan (SKD), Portal Belajar UTBK &amp; TKA, serta Materi Kelas X–XII lengkap dengan Video YouTube dan Slide PPT dari Admin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdminUpload}
              className="btn-gold px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap shrink-0"
            >
              + Upload Soal / Materi / Zoom
            </button>
          )}
          <button
            type="button"
            onClick={onBackHome}
            className="px-4 py-2.5 rounded-xl bg-slate-800/85 hover:bg-slate-700/85 border border-sky-400/30 text-xs font-bold text-sky-100 transition whitespace-nowrap shrink-0"
          >
            ← Beranda
          </button>
          {onParticipantLogout && (
            <button
              type="button"
              onClick={onParticipantLogout}
              className="px-4 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-400/40 text-xs font-bold text-rose-200 transition whitespace-nowrap shrink-0"
            >
              🚪 Keluar Akun
            </button>
          )}
        </div>
      </div>

      {/* Separated Portal Belajar Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-sky-400/25 shadow-sm w-fit">
        {(
          [
            { id: 'live-teaching', label: `🎥 Live Teaching (${liveSessions.length})` },
            { id: 'kedinasan', label: `🏛️ Kedinasan (${kedinasanTryOutCards.length + kedinasanModules.length})` },
            { id: 'asas-xii', label: `Portal ASAS XII (${asasXiiCards.length})` },
            { id: 'tryout-utbk', label: `Belajar UTBK (${tryOutUtbkCards.length})` },
            { id: 'tryout-tka', label: `Belajar TKA (${tryOutTkaCards.length})` },
            { id: 'tka', label: `Modul TKA (${totalTkaModules})` },
            { id: 'sma', label: `Materi X–XII (${totalSmaModules})` },
            { id: 'utbk', label: `Materi UTBK (${utbkModules.length})` },
          ] as { id: PortalTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'btn-gold text-white font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: LIVE TEACHING (ZOOM — ADMIN UPLOAD ONLY) */}
      {activeTab === 'live-teaching' && (
        <div id="portal-live-teaching-section" className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">
                🎥 Live Teaching Interaktif (Zoom)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelas bimbingan langsung bersama mentor melalui Zoom — jadwal &amp; tautan resmi dikelola khusus oleh Admin
              </p>
            </div>
            <p className="text-xs text-rose-300 font-semibold tabular-nums">
              {liveSessions.length} Kelas Live Teaching
            </p>
          </div>

          {liveSessions.length === 0 ? (
            <div className="glass-card p-8 sm:p-10 rounded-3xl text-center space-y-4">
              <h3 className="font-display text-xl font-bold text-white">
                Belum Ada Jadwal Live Teaching Aktif
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                Tautan Zoom Live Teaching hanya dapat diunggah oleh Admin melalui Studio Admin. Nantikan jadwal kelas live berikutnya!
              </p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={onOpenAdminUpload}
                  className="btn-gold px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold"
                >
                  + Upload Link Zoom Live Teaching
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {liveSessions.map((sess) => (
                <article
                  key={sess.id}
                  className="hero-glow-card p-6 rounded-3xl flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs font-bold">
                      <span className="text-purple-300">{sess.category}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[11px] ${
                          sess.isLive
                            ? 'bg-rose-500/25 border border-rose-400/50 text-rose-200 animate-pulse'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {sess.isLive ? '🔴 SEDANG LIVE' : '🕒 Terjadwal'}
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-white leading-snug">
                      {sess.title}
                    </h3>
                    <div className="text-xs text-slate-300 space-y-1">
                      <p>Mentor: <strong className="text-sky-200">{sess.tutorName}</strong></p>
                      <p>Jadwal: <strong className="text-amber-200">{sess.scheduleLabel}</strong></p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-sky-400/20 space-y-2">
                    <a
                      href={sess.zoomUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-gold w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap flex items-center justify-center gap-2"
                    >
                      Gabung Kelas Zoom →
                    </a>
                    {isAdmin && (onToggleLiveSession || onDeleteLiveSession) && (
                      <div className="flex items-center gap-2">
                        {onToggleLiveSession && (
                          <button
                            type="button"
                            onClick={() => onToggleLiveSession(sess)}
                            className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-sky-400/35 text-sky-200 text-[11px] font-bold transition whitespace-nowrap"
                          >
                            {sess.isLive ? '⏸️ Set Terjadwal' : '🔴 Aktifkan Live'}
                          </button>
                        )}
                        {onDeleteLiveSession && (
                          <button
                            type="button"
                            onClick={() => onDeleteLiveSession(sess.id)}
                            aria-label={`Hapus sesi ${sess.title}`}
                            className="py-2 px-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-[11px] font-bold transition whitespace-nowrap"
                          >
                            🗑️ Hapus
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: PORTAL KEDINASAN (TRY OUT SKD, MODUL & VIDEO) */}
      {activeTab === 'kedinasan' && (
        <div id="portal-kedinasan-section" className="space-y-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  🏛️ Portal Kedinasan — Try Out SKD (TWK · TIU · TKP)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Persiapan Sekolah Kedinasan (PKN STAN, STIS, IPDN, STIN, STMKG) — Try Out SKD, Modul &amp; Video Materi
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {onOpenCampusAnalysis && (
                  <button
                    type="button"
                    id="btn-portal-kedinasan-analysis"
                    onClick={() => onOpenCampusAnalysis('kedinasan')}
                    className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/35 border border-purple-400/45 text-purple-100 text-xs font-bold transition whitespace-nowrap"
                  >
                    🏛️ Analisis Kedinasan (SKD) →
                  </button>
                )}
                <p className="text-xs text-purple-300 font-semibold tabular-nums">
                  {kedinasanTryOutCards.length} Try Out · {kedinasanModules.length} Modul &amp; Video
                </p>
              </div>
            </div>

            {kedinasanTryOutCards.length === 0 ? (
              <div className="glass-card p-8 rounded-3xl text-center space-y-3">
                <h3 className="font-display text-lg font-bold text-white">
                  Paket Try Out Kedinasan Masih Kosong
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                  Hanya Admin yang dapat mengunggah soal Try Out Kedinasan (SKD: TWK, TIU, TKP) melalui Studio Admin.
                </p>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={onOpenAdminUpload}
                    className="btn-gold px-5 py-2.5 rounded-xl text-xs font-extrabold"
                  >
                    + Upload Try Out Kedinasan
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {kedinasanTryOutCards.map((portal) => (
                  <article
                    key={portal.id}
                    className="hero-glow-card p-6 rounded-3xl flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 text-xs text-purple-300 font-semibold">
                        <span>{portal.category}</span>
                        <span className="font-mono text-slate-400">{portal.code}</span>
                      </div>
                      <h3 className="font-display text-xl font-bold text-white leading-snug">
                        {portal.title}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{portal.description}</p>
                    </div>
                    <div className="space-y-4 pt-3 border-t border-sky-400/20">
                      <div className="flex items-center gap-2 text-xs text-slate-400 tabular-nums">
                        <span>{portal.level}</span>
                        <span aria-hidden="true">·</span>
                        <span>{portal.questionCount} Soal</span>
                        <span aria-hidden="true">·</span>
                        <span>{portal.durationMinutes} mnt</span>
                      </div>
                      {(() => {
                        const sched = getQuizScheduleStatus(portal.room.openAt, Date.now(), portal.room.closeAt);
                        return (
                          <>
                            {sched.isClosed ? (
                              <p className="text-[11px] font-semibold text-rose-300 bg-rose-500/10 border border-rose-400/35 rounded-xl px-3 py-1.5">
                                ⛔ Ditutup sejak {sched.formattedCloseDate}
                              </p>
                            ) : sched.isNotYetOpen ? (
                              <p className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-400/30 rounded-xl px-3 py-1.5">
                                🔒 Dibuka {sched.formattedDate} · {sched.countdownLabel}
                              </p>
                            ) : sched.formattedCloseDate ? (
                              <p className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-400/25 rounded-xl px-3 py-1.5">
                                🟢 Dibuka · Tutup {sched.formattedCloseDate}
                              </p>
                            ) : null}
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={sched.isLocked && !isAdmin}
                                onClick={() => onLaunchQuizRoom(portal.room)}
                                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                                  sched.isLocked && !isAdmin
                                    ? sched.isClosed
                                      ? 'bg-slate-800/90 border border-rose-400/30 text-rose-200/80 cursor-not-allowed'
                                      : 'bg-slate-800/90 border border-amber-400/30 text-amber-200/80 cursor-not-allowed'
                                    : 'btn-gold'
                                }`}
                              >
                                {sched.isClosed
                                  ? isAdmin
                                    ? '👁️ Preview Admin (Ditutup)'
                                    : '⛔ Soal Sudah Ditutup'
                                  : sched.isNotYetOpen
                                    ? isAdmin
                                      ? '👁️ Preview Admin'
                                      : `🔒 Dibuka ${sched.formattedDate}`
                                    : 'Masuk Lobi Try Out Kedinasan →'}
                              </button>
                              {isAdmin && onEditUploadedRoom && uploadedRooms.some((r) => r.code === portal.room.code) && (
                                <button
                                  type="button"
                                  onClick={() => onEditUploadedRoom(portal.room)}
                                  title="Edit soal & jadwal paket ini"
                                  aria-label={`Edit soal ${portal.title}`}
                                  className="px-3 py-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-indigo-200 text-xs font-bold transition shrink-0"
                                >
                                  ✏️
                                </button>
                              )}
                              {isAdmin && onDeleteUploadedRoom && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteUploadedRoom(portal.room)}
                                  title="Hapus paket soal ini"
                                  aria-label={`Hapus paket soal ${portal.title}`}
                                  className="px-3 py-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold transition shrink-0"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-display text-xl font-bold text-purple-200 border-b border-purple-400/25 pb-2">
              📚 Modul &amp; Video Materi Kedinasan (TWK · TIU · TKP)
            </h3>
            {kedinasanModules.length === 0 ? (
              <div className="glass-card p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-sm font-bold text-white">Modul &amp; Video Kedinasan Masih Kosong</p>
                  <p className="text-xs text-slate-400">
                    Admin dapat mengunggah Modul Kedinasan lengkap dengan Video YouTube dan Slide PPT melalui Studio Admin.
                  </p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={onOpenAdminUpload}
                    className="btn-gold px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap"
                  >
                    + Upload Modul / Video Kedinasan
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {kedinasanModules.map((mod) => (
                  <article
                    key={mod.id}
                    className="glass-card p-6 rounded-3xl flex flex-col justify-between space-y-5 hover:border-purple-400/50 transition"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-purple-300 font-semibold">
                        <span>{mod.subject}</span>
                        <span className="flex items-center gap-1.5 text-[11px]">
                          {mod.youtubeUrl && <span className="text-rose-300">🎬 Video</span>}
                          {mod.pptUrl && <span className="text-amber-300">📊 PPT</span>}
                        </span>
                      </div>
                      <h4 className="font-display text-lg font-bold text-white leading-snug">
                        {mod.title}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{mod.summary}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-sky-400/20">
                      <button
                        type="button"
                        onClick={() => setSelectedModule(mod)}
                        className="flex-1 py-2.5 px-3.5 rounded-xl bg-purple-500/25 hover:bg-purple-500/40 border border-purple-400/45 text-purple-100 text-xs font-bold transition whitespace-nowrap"
                      >
                        Buka Modul &amp; Video
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBookmark(mod.id)}
                        aria-label="Simpan materi favorit"
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition ${
                          bookmarkedIds.includes(mod.id)
                            ? 'bg-amber-500/25 border-amber-400/60 text-amber-200'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-200'
                        }`}
                      >
                        {bookmarkedIds.includes(mod.id) ? '★' : '☆'}
                      </button>
                      {isAdmin &&
                        onDeleteUploadedMaterial &&
                        uploadedMaterials.some((u) => u.id === mod.id) && (
                          <button
                            type="button"
                            onClick={() => onDeleteUploadedMaterial(mod.id)}
                            title="Hapus materi ini"
                            aria-label={`Hapus materi ${mod.title}`}
                            className="px-3 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold transition shrink-0"
                          >
                            🗑️
                          </button>
                        )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 0: PORTAL ASAS XII & RIWAYAT KUIS */}
      {activeTab === 'asas-xii' && (
        <div id="portal-asas-xii-section" className="space-y-8">
          {/* ASAS XII Exam Packages */}
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  Portal ASAS XII (Asesmen Sumatif Akhir Semester XII)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kerjakan paket ujian ASAS Kelas XII dan pantau seluruh riwayat kuis serta E-Sertifikat Astronot Anda di satu tempat
                </p>
              </div>
              <p className="text-xs text-sky-300 font-semibold tabular-nums">
                {asasXiiCards.length} Paket ASAS XII
              </p>
            </div>

            {asasXiiCards.length === 0 ? (
              <div className="glass-card p-8 sm:p-10 rounded-3xl text-center space-y-4">
                <h3 className="font-display text-xl font-bold text-white">
                  Paket Ujian ASAS XII Masih Kosong
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                  Admin dapat mengunggah soal ASAS XII (Word, PDF, Excel, Gambar, atau Teks) melalui Studio Admin dengan memilih kategori Portal ASAS XII.
                </p>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={onOpenAdminUpload}
                    className="btn-gold px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold"
                  >
                    + Upload Paket ASAS XII Sekarang
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {asasXiiCards.map((portal) => (
                  <article
                    key={portal.id}
                    className="hero-glow-card p-6 rounded-3xl flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 text-xs text-sky-300 font-semibold">
                        <span>{portal.category}</span>
                        <span className="font-mono text-slate-400">{portal.code}</span>
                      </div>
                      <h3 className="font-display text-xl font-bold text-white leading-snug">
                        {portal.title}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{portal.description}</p>
                    </div>

                    <div className="space-y-4 pt-3 border-t border-sky-400/20">
                      <div className="flex items-center gap-2 text-xs text-slate-400 tabular-nums">
                        <span>{portal.level}</span>
                        <span aria-hidden="true">·</span>
                        <span>{portal.questionCount} Soal</span>
                        <span aria-hidden="true">·</span>
                        <span>{portal.durationMinutes} mnt</span>
                      </div>
                      {(() => {
                        const sched = getQuizScheduleStatus(portal.room.openAt, Date.now(), portal.room.closeAt);
                        return (
                          <>
                            {sched.isClosed ? (
                              <p className="text-[11px] font-semibold text-rose-300 bg-rose-500/10 border border-rose-400/35 rounded-xl px-3 py-1.5">
                                ⛔ Ditutup sejak {sched.formattedCloseDate}
                              </p>
                            ) : sched.isNotYetOpen ? (
                              <p className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-400/30 rounded-xl px-3 py-1.5">
                                🔒 Dibuka {sched.formattedDate} · {sched.countdownLabel}
                              </p>
                            ) : sched.formattedCloseDate ? (
                              <p className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-400/25 rounded-xl px-3 py-1.5">
                                🟢 Dibuka · Tutup {sched.formattedCloseDate}
                              </p>
                            ) : null}
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={sched.isLocked && !isAdmin}
                                onClick={() => onLaunchQuizRoom(portal.room)}
                                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                                  sched.isLocked && !isAdmin
                                    ? sched.isClosed
                                      ? 'bg-slate-800/90 border border-rose-400/30 text-rose-200/80 cursor-not-allowed'
                                      : 'bg-slate-800/90 border border-amber-400/30 text-amber-200/80 cursor-not-allowed'
                                    : 'btn-gold'
                                }`}
                              >
                                {sched.isClosed
                                  ? isAdmin
                                    ? '👁️ Preview Admin (Ditutup)'
                                    : '⛔ Soal Sudah Ditutup'
                                  : sched.isNotYetOpen
                                    ? isAdmin
                                      ? '👁️ Preview Admin'
                                      : `🔒 Dibuka ${sched.formattedDate}`
                                    : 'Masuk Lobi Ujian ASAS XII →'}
                              </button>
                              {isAdmin && onEditUploadedRoom && uploadedRooms.some((r) => r.code === portal.room.code) && (
                                <button
                                  type="button"
                                  onClick={() => onEditUploadedRoom(portal.room)}
                                  title="Edit soal & jadwal paket ini"
                                  aria-label={`Edit soal ${portal.title}`}
                                  className="px-3 py-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-indigo-200 text-xs font-bold transition shrink-0"
                                >
                                  ✏️
                                </button>
                              )}
                              {isAdmin && onDeleteUploadedRoom && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteUploadedRoom(portal.room)}
                                  title="Hapus paket soal ini"
                                  aria-label={`Hapus paket soal ${portal.title}`}
                                  className="px-3 py-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold transition shrink-0"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Quiz History & Astronaut Certificates Section inside Portal ASAS XII */}
          <div id="asas-quiz-history" className="hero-glow-card holo-top-beam p-6 sm:p-7 rounded-3xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-sky-400/20 pb-4">
              <div>
                <p className="text-xs font-semibold text-sky-300 tracking-wide">
                  Arsip Pribadi Peserta · {userEmail}
                </p>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white mt-1">
                  Riwayat Kuis &amp; Sertifikat Astronot Saya
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Seluruh riwayat kuis ASAS XII, Try Out, dan Room yang pernah Anda kerjakan tersimpan otomatis di sini
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-sky-400/20">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Selesai</p>
                    <p className="font-display text-lg font-bold text-sky-300 tabular-nums">
                      {historySummary.count}
                    </p>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-sky-400/20">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Rata-Rata</p>
                    <p className="font-display text-lg font-bold text-indigo-300 tabular-nums">
                      {historySummary.avgGrade}
                    </p>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-sky-400/20">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Tertinggi</p>
                    <p className="font-display text-lg font-bold text-emerald-300 tabular-nums">
                      {historySummary.bestGrade}
                    </p>
                  </div>
                </div>
                {userHistory.length > 0 && onClearAllHistory && (
                  <button
                    type="button"
                    id="btn-clear-all-asas-history"
                    onClick={onClearAllHistory}
                    className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs font-bold transition whitespace-nowrap"
                  >
                    🗑️ Hapus Semua Riwayat
                  </button>
                )}
              </div>
            </div>

            {userHistory.length === 0 ? (
              <div className="p-7 rounded-2xl bg-slate-900/65 border border-sky-400/15 text-center space-y-2">
                <p className="font-display text-base font-bold text-white">
                  Belum Ada Riwayat Kuis Tercatat
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Setelah Anda menyelesaikan kuis atau ujian ASAS XII, nilai akhir, peringkat, dan E-Sertifikat Astronot HD akan langsung muncul di daftar ini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-sky-400/20">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-900/90 text-slate-300 text-[11px] border-b border-sky-400/20">
                    <tr>
                      <th className="py-3 px-4">Judul Kuis / ASAS</th>
                      <th className="py-3 px-3">Room</th>
                      <th className="py-3 px-3 text-center">Benar</th>
                      <th className="py-3 px-3 text-center">Nilai</th>
                      <th className="py-3 px-3 text-center">Poin</th>
                      <th className="py-3 px-3 text-center">Rank</th>
                      <th className="py-3 px-4 text-right">Sertifikat &amp; Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-400/15 bg-slate-950/70">
                    {userHistory.map((rec) => (
                      <tr key={rec.id} className="hover:bg-sky-500/10 transition">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-white">{rec.quizTitle}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(rec.timestamp).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </td>
                        <td className="py-3 px-3 font-mono text-sky-300 font-semibold whitespace-nowrap">
                          {rec.roomCode}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-300 tabular-nums whitespace-nowrap">
                          {rec.correctCount}/{rec.totalQuestions}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-300 tabular-nums">
                          {rec.grade}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-indigo-300 tabular-nums">
                          {rec.points}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-amber-300 tabular-nums">
                          #{rec.rank}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => onDownloadCertificate(rec)}
                              className="px-3.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/45 text-sky-200 font-semibold text-xs transition"
                            >
                              Unduh Sertifikat
                            </button>
                            {onDeleteHistoryItem && (
                              <button
                                type="button"
                                onClick={() => onDeleteHistoryItem(rec)}
                                title="Hapus riwayat nilai & sertifikat ini"
                                aria-label={`Hapus riwayat ${rec.quizTitle}`}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 font-semibold text-xs transition"
                              >
                                🗑️ Hapus
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: TRY OUT UTBK & SNBT */}
      {activeTab === 'tryout-utbk' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">
                Portal Belajar UTBK &amp; SNBT
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulasi khusus Tes Potensi Skolastik (TPS), Literasi Bahasa, dan Penalaran Matematika
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {onOpenCampusAnalysis && (
                <button
                  type="button"
                  onClick={() => onOpenCampusAnalysis('utbk')}
                  className="px-4 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/35 border border-teal-400/45 text-teal-100 text-xs font-bold transition whitespace-nowrap"
                >
                  🎯 Analisis Kampus UTBK (7 Subtes) →
                </button>
              )}
              <p className="text-xs text-sky-300 font-semibold tabular-nums">
                {tryOutUtbkCards.length} Paket Try Out UTBK
              </p>
            </div>
          </div>

          {tryOutUtbkCards.length === 0 ? (
            <div className="glass-card p-8 sm:p-10 rounded-3xl text-center space-y-4">
              <h3 className="font-display text-xl font-bold text-white">
                Daftar Try Out UTBK Masih Kosong
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                Admin dapat mengunggah file soal UTBK-SNBT (Word, PDF, Excel, Gambar, atau Teks) di Studio Admin dan sistem akan otomatis mengubahnya menjadi soal interaktif.
              </p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={onOpenAdminUpload}
                  className="btn-gold px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold"
                >
                  + Upload Try Out UTBK Sekarang
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tryOutUtbkCards.map((portal) => (
                <article
                  key={portal.id}
                  className="hero-glow-card p-6 rounded-3xl flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs text-sky-300 font-semibold">
                      <span>{portal.category}</span>
                      <span className="font-mono text-slate-400">{portal.code}</span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-white leading-snug">
                      {portal.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{portal.description}</p>
                  </div>

                  <div className="space-y-4 pt-3 border-t border-sky-400/20">
                    <div className="flex items-center gap-2 text-xs text-slate-400 tabular-nums">
                      <span>{portal.level}</span>
                      <span aria-hidden="true">·</span>
                      <span>{portal.questionCount} Soal</span>
                      <span aria-hidden="true">·</span>
                      <span>{portal.durationMinutes} mnt</span>
                    </div>
                    {(() => {
                      const sched = getQuizScheduleStatus(portal.room.openAt, Date.now(), portal.room.closeAt);
                      return (
                        <>
                          {sched.isClosed ? (
                            <p className="text-[11px] font-semibold text-rose-300 bg-rose-500/10 border border-rose-400/35 rounded-xl px-3 py-1.5">
                              ⛔ Ditutup sejak {sched.formattedCloseDate}
                            </p>
                          ) : sched.isNotYetOpen ? (
                            <p className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-400/30 rounded-xl px-3 py-1.5">
                              🔒 Dibuka {sched.formattedDate} · {sched.countdownLabel}
                            </p>
                          ) : sched.formattedCloseDate ? (
                            <p className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-400/25 rounded-xl px-3 py-1.5">
                              🟢 Dibuka · Tutup {sched.formattedCloseDate}
                            </p>
                          ) : null}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={sched.isLocked && !isAdmin}
                              onClick={() => onLaunchQuizRoom(portal.room)}
                              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                                sched.isLocked && !isAdmin
                                  ? sched.isClosed
                                    ? 'bg-slate-800/90 border border-rose-400/30 text-rose-200/80 cursor-not-allowed'
                                    : 'bg-slate-800/90 border border-amber-400/30 text-amber-200/80 cursor-not-allowed'
                                  : 'btn-gold'
                              }`}
                            >
                              {sched.isClosed
                                ? isAdmin
                                  ? '👁️ Preview Admin (Ditutup)'
                                  : '⛔ Soal Sudah Ditutup'
                                : sched.isNotYetOpen
                                  ? isAdmin
                                    ? '👁️ Preview Admin'
                                    : `🔒 Dibuka ${sched.formattedDate}`
                                  : 'Masuk Lobi Try Out UTBK →'}
                            </button>
                            {isAdmin && onEditUploadedRoom && uploadedRooms.some((r) => r.code === portal.room.code) && (
                              <button
                                type="button"
                                onClick={() => onEditUploadedRoom(portal.room)}
                                title="Edit soal & jadwal paket ini"
                                aria-label={`Edit soal ${portal.title}`}
                                className="px-3 py-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-indigo-200 text-xs font-bold transition shrink-0"
                              >
                                ✏️
                              </button>
                            )}
                            {isAdmin && onDeleteUploadedRoom && (
                              <button
                                type="button"
                                onClick={() => onDeleteUploadedRoom(portal.room)}
                                title="Hapus paket soal ini"
                                aria-label={`Hapus paket soal ${portal.title}`}
                                className="px-3 py-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold transition shrink-0"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRY OUT TKA */}
      {activeTab === 'tryout-tka' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">
                Portal Belajar TKA (Saintek &amp; Soshum)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulasi khusus Tes Kemampuan Akademik rumpun Sains-Teknologi dan Sosial-Humaniora
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(['Semua', 'TKA Saintek', 'TKA Soshum'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setTkaTryOutFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                    tkaTryOutFilter === cat
                      ? 'bg-indigo-500/35 text-indigo-100 border border-indigo-400/60'
                      : 'bg-slate-900/80 text-slate-300 border border-sky-400/20 hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {tryOutTkaCards.length === 0 ? (
            <div className="glass-card p-8 sm:p-10 rounded-3xl text-center space-y-4">
              <h3 className="font-display text-xl font-bold text-white">
                Daftar Try Out TKA Masih Kosong
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                Admin dapat mengunggah file soal TKA Saintek atau TKA Soshum di Studio Admin agar langsung tersedia untuk seluruh peserta.
              </p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={onOpenAdminUpload}
                  className="btn-gold px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold"
                >
                  + Upload Try Out TKA Sekarang
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tryOutTkaCards.map((portal) => (
                <article
                  key={portal.id}
                  className="hero-glow-card p-6 rounded-3xl flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs text-indigo-300 font-semibold">
                      <span>{portal.category}</span>
                      <span className="font-mono text-slate-400">{portal.code}</span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-white leading-snug">
                      {portal.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{portal.description}</p>
                  </div>

                  <div className="space-y-4 pt-3 border-t border-sky-400/20">
                    <div className="flex items-center gap-2 text-xs text-slate-400 tabular-nums">
                      <span>{portal.level}</span>
                      <span aria-hidden="true">·</span>
                      <span>{portal.questionCount} Soal</span>
                      <span aria-hidden="true">·</span>
                      <span>{portal.durationMinutes} mnt</span>
                    </div>
                    {(() => {
                      const sched = getQuizScheduleStatus(portal.room.openAt, Date.now(), portal.room.closeAt);
                      return (
                        <>
                          {sched.isClosed ? (
                            <p className="text-[11px] font-semibold text-rose-300 bg-rose-500/10 border border-rose-400/35 rounded-xl px-3 py-1.5">
                              ⛔ Ditutup sejak {sched.formattedCloseDate}
                            </p>
                          ) : sched.isNotYetOpen ? (
                            <p className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-400/30 rounded-xl px-3 py-1.5">
                              🔒 Dibuka {sched.formattedDate} · {sched.countdownLabel}
                            </p>
                          ) : sched.formattedCloseDate ? (
                            <p className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-400/25 rounded-xl px-3 py-1.5">
                              🟢 Dibuka · Tutup {sched.formattedCloseDate}
                            </p>
                          ) : null}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={sched.isLocked && !isAdmin}
                              onClick={() => onLaunchQuizRoom(portal.room)}
                              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                                sched.isLocked && !isAdmin
                                  ? sched.isClosed
                                    ? 'bg-slate-800/90 border border-rose-400/30 text-rose-200/80 cursor-not-allowed'
                                    : 'bg-slate-800/90 border border-amber-400/30 text-amber-200/80 cursor-not-allowed'
                                  : 'btn-gold'
                              }`}
                            >
                              {sched.isClosed
                                ? isAdmin
                                  ? '👁️ Preview Admin (Ditutup)'
                                  : '⛔ Soal Sudah Ditutup'
                                : sched.isNotYetOpen
                                  ? isAdmin
                                    ? '👁️ Preview Admin'
                                    : `🔒 Dibuka ${sched.formattedDate}`
                                  : 'Mulai Try Out TKA'}
                            </button>
                            {isAdmin && onEditUploadedRoom && uploadedRooms.some((r) => r.code === portal.room.code) && (
                              <button
                                type="button"
                                onClick={() => onEditUploadedRoom(portal.room)}
                                title="Edit soal & jadwal paket ini"
                                aria-label={`Edit soal ${portal.title}`}
                                className="px-3 py-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-indigo-200 text-xs font-bold transition shrink-0"
                              >
                                ✏️
                              </button>
                            )}
                            {isAdmin && onDeleteUploadedRoom && (
                              <button
                                type="button"
                                onClick={() => onDeleteUploadedRoom(portal.room)}
                                title="Hapus paket soal ini"
                                aria-label={`Hapus paket soal ${portal.title}`}
                                className="px-3 py-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold transition shrink-0"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MODUL TKA */}
      {activeTab === 'tka' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">
                Modul Belajar TKA (Saintek &amp; Soshum)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ringkasan materi mendalam dan rumus penting per mata pelajaran TKA
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(['Semua', 'Saintek', 'Soshum'] as const).map((track) => (
                <button
                  key={track}
                  type="button"
                  onClick={() => setTkaTrackFilter(track)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                    tkaTrackFilter === track
                      ? 'bg-teal-500/30 text-teal-100 border border-teal-400/60'
                      : 'bg-slate-900/80 text-slate-300 border border-sky-400/20 hover:bg-slate-800'
                  }`}
                >
                  {track === 'Semua' ? 'Semua Rumpun TKA' : `Modul TKA ${track}`}
                </button>
              ))}
            </div>
          </div>

          {tkaModules.length === 0 ? (
            <div className="glass-card p-8 sm:p-10 rounded-3xl text-center space-y-4">
              <h3 className="font-display text-xl font-bold text-white">
                Modul TKA Masih Kosong
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                Admin dapat mengunggah Modul TKA Saintek maupun Soshum melalui menu Upload Materi di Studio Admin.
              </p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={onOpenAdminUpload}
                  className="btn-gold px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold"
                >
                  + Upload Modul TKA Sekarang
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {tkaModules.map((mod) => (
                <article
                  key={mod.id}
                  className="glass-card p-5 rounded-3xl flex flex-col justify-between space-y-5 hover:border-sky-400/50 transition"
                >
                  <div className="space-y-2.5">
                    <div className="text-xs text-teal-300 font-semibold">
                      TKA {mod.tkaTrack || 'Umum'} · {mod.subject}
                    </div>
                    <h3 className="font-display text-lg font-bold text-white leading-snug">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{mod.summary}</p>
                  </div>

                  <div className="flex flex-col gap-2 pt-3 border-t border-sky-400/20">
                    <button
                      type="button"
                      onClick={() => setSelectedModule(mod)}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/40 text-sky-200 text-xs font-bold transition whitespace-nowrap"
                    >
                      Buka Ringkasan &amp; Rumus
                    </button>
                    {mod.practiceQuestions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onLaunchQuizRoom(moduleToPracticeRoom(mod))}
                        className="w-full py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold transition whitespace-nowrap"
                      >
                        Latihan Soal TKA
                      </button>
                    )}
                    {isAdmin &&
                      onDeleteUploadedMaterial &&
                      uploadedMaterials.some((u) => u.id === mod.id) && (
                        <button
                          type="button"
                          onClick={() => onDeleteUploadedMaterial(mod.id)}
                          className="w-full py-2 px-3.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs font-bold transition whitespace-nowrap"
                        >
                          🗑️ Hapus Modul Ini
                        </button>
                      )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MATERI KELAS X, XI, XII */}
      {activeTab === 'sma' && (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">
                Materi &amp; Evaluasi Kelas X, XI &amp; XII SMA/MA
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dipisahkan per jenjang kelas lengkap dengan modul ringkasan dan try out semester dari Admin
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(['Semua', 'X', 'XI', 'XII'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSmaGradeFilter(g)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                    smaGradeFilter === g
                      ? 'bg-sky-500/30 text-sky-100 border border-sky-400/60'
                      : 'bg-slate-900/80 text-slate-300 border border-sky-400/20 hover:bg-slate-800'
                  }`}
                >
                  {g === 'Semua' ? 'Semua Kelas (X, XI, XII)' : `Kelas ${g}`}
                </button>
              ))}
            </div>
          </div>

          {smaSections.map((sec) => (
            <div key={sec.grade} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-400/20 pb-2.5">
                <h3 className="font-display text-xl font-bold text-sky-200">
                  Kelas {sec.grade} SMA/MA
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {sec.tryOuts.map((toRoom) => (
                    <div key={toRoom.code} className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onLaunchQuizRoom(toRoom)}
                        className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/40 text-sky-200 text-xs font-bold transition whitespace-nowrap"
                      >
                        Try Out Kelas {sec.grade} ({toRoom.questions.length} Soal) →
                      </button>
                      {isAdmin && onEditUploadedRoom && uploadedRooms.some((r) => r.code === toRoom.code) && (
                        <button
                          type="button"
                          onClick={() => onEditUploadedRoom(toRoom)}
                          title="Edit soal & jadwal paket ini"
                          aria-label={`Edit soal ${toRoom.title}`}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-indigo-200 text-xs font-bold transition"
                        >
                          ✏️
                        </button>
                      )}
                      {isAdmin && onDeleteUploadedRoom && uploadedRooms.some((r) => r.code === toRoom.code) && (
                        <button
                          type="button"
                          onClick={() => onDeleteUploadedRoom(toRoom)}
                          title="Hapus paket soal ini"
                          aria-label={`Hapus soal ${toRoom.title}`}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold transition"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {sec.modules.length === 0 ? (
                <div className="glass-card p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <p className="text-sm font-bold text-white">
                      Materi Kelas {sec.grade} Masih Kosong
                    </p>
                    <p className="text-xs text-slate-400">
                      Belum ada materi Kelas {sec.grade} yang diunggah Admin.
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={onOpenAdminUpload}
                      className="btn-gold px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap"
                    >
                      + Upload Materi Kelas {sec.grade}
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sec.modules.map((mod) => (
                    <article
                      key={mod.id}
                      className="glass-card p-6 rounded-3xl flex flex-col justify-between space-y-5 hover:border-sky-400/50 transition"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs text-sky-300 font-semibold">
                          <span>Kelas {mod.grade} · {mod.subject}</span>
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                            {mod.youtubeUrl && <span className="text-rose-300">🎬 Video</span>}
                            {mod.pptUrl && <span className="text-amber-300">📊 PPT</span>}
                            <span className="text-slate-400 font-normal tabular-nums">{mod.readMinutes}m</span>
                          </span>
                        </div>
                        <h4 className="font-display text-lg font-bold text-white leading-snug">
                          {mod.title}
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{mod.summary}</p>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-sky-400/20">
                        <button
                          type="button"
                          onClick={() => setSelectedModule(mod)}
                          className="flex-1 py-2.5 px-3.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/40 text-sky-200 text-xs font-bold transition whitespace-nowrap"
                        >
                          {mod.youtubeUrl || mod.pptUrl ? 'Buka Materi, Video & PPT' : 'Pelajari Modul'}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleBookmark(mod.id)}
                          aria-label="Simpan materi favorit"
                          className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition ${
                            bookmarkedIds.includes(mod.id)
                              ? 'bg-amber-500/25 border-amber-400/60 text-amber-200'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-200'
                          }`}
                        >
                          {bookmarkedIds.includes(mod.id) ? '★' : '☆'}
                        </button>
                        {mod.practiceQuestions.length > 0 && (
                          <button
                            type="button"
                            onClick={() => onLaunchQuizRoom(moduleToPracticeRoom(mod))}
                            className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold transition whitespace-nowrap"
                          >
                            Uji Bab
                          </button>
                        )}
                        {isAdmin &&
                          onDeleteUploadedMaterial &&
                          uploadedMaterials.some((u) => u.id === mod.id) && (
                            <button
                              type="button"
                              onClick={() => onDeleteUploadedMaterial(mod.id)}
                              title="Hapus materi ini"
                              aria-label={`Hapus materi ${mod.title}`}
                              className="px-3 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold transition shrink-0"
                            >
                              🗑️
                            </button>
                          )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: MATERI UTBK & SNBT */}
      {activeTab === 'utbk' && (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              Materi Resmi UTBK &amp; SNBT
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ringkasan konsep, strategi menjawab cepat, dan kaidah penting per subtes
            </p>
          </div>
          {utbkModules.length === 0 ? (
            <div className="glass-card p-8 sm:p-10 rounded-3xl text-center space-y-4">
              <h3 className="font-display text-xl font-bold text-white">
                Materi UTBK &amp; SNBT Masih Kosong
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                Admin dapat mengunggah materi UTBK-SNBT (file Word/TXT/MD atau ketik langsung) melalui Studio Admin.
              </p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={onOpenAdminUpload}
                  className="btn-gold px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold"
                >
                  + Upload Materi UTBK Sekarang
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {utbkModules.map((mod, idx) => (
                <article
                  key={mod.id}
                  className="glass-card p-6 rounded-3xl flex flex-col justify-between space-y-5 hover:border-sky-400/50 transition"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-sky-300 font-semibold">
                      <span>0{idx + 1}. {mod.subject}</span>
                      <span className="text-slate-400 font-normal tabular-nums">{mod.readMinutes} mnt baca</span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-white leading-snug">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{mod.summary}</p>
                  </div>

                  <div className="flex items-center gap-2.5 pt-3 border-t border-sky-400/20">
                    <button
                      type="button"
                      onClick={() => setSelectedModule(mod)}
                      className="flex-1 py-2.5 px-3.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/40 text-sky-200 text-xs font-bold transition whitespace-nowrap"
                    >
                      Baca Materi
                    </button>
                    {mod.practiceQuestions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onLaunchQuizRoom(moduleToPracticeRoom(mod))}
                        className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold transition whitespace-nowrap"
                      >
                        Latihan Kuis
                      </button>
                    )}
                    {isAdmin &&
                      onDeleteUploadedMaterial &&
                      uploadedMaterials.some((u) => u.id === mod.id) && (
                        <button
                          type="button"
                          onClick={() => onDeleteUploadedMaterial(mod.id)}
                          title="Hapus materi ini"
                          aria-label={`Hapus materi ${mod.title}`}
                          className="px-3 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold transition shrink-0"
                        >
                          🗑️
                        </button>
                      )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cosmic Study Module Reader Modal */}
      {selectedModule && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="study-module-title"
        >
          <div className="hero-glow-card w-full max-w-2xl max-h-[88vh] overflow-y-auto custom-scrollbar rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-sky-400/20 pb-4">
              <div>
                <p className="text-xs font-semibold text-sky-300">
                  {selectedModule.subject} {selectedModule.subtitle ? `· ${selectedModule.subtitle}` : ''}
                </p>
                <h2
                  id="study-module-title"
                  className="font-display text-2xl font-bold text-white mt-1"
                >
                  {selectedModule.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedModule(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-slate-200 shrink-0"
              >
                Tutup
              </button>
            </div>

            <div className="space-y-5 text-sm text-slate-200 leading-relaxed">
              {/* Embedded YouTube Video Player when Admin attached a YouTube URL */}
              {(() => {
                const embedUrl = extractYouTubeEmbedUrl(selectedModule.youtubeUrl);
                if (!embedUrl) return null;
                return (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-rose-300">
                      🎬 Video Pembelajaran YouTube
                    </h3>
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-rose-400/35 bg-black shadow-lg">
                      <iframe
                        src={embedUrl}
                        title={`Video ${selectedModule.title}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                );
              })()}

              {/* PPT / Universal File Attachment Card */}
              {selectedModule.pptUrl && (() => {
                const displayName = selectedModule.pptName || `Lampiran ${selectedModule.title}`;
                const extMatch = /\.([a-zA-Z0-9]{1,8})(?:[?#]|$)/.exec(displayName) ||
                  /\.([a-zA-Z0-9]{1,8})(?:[?#]|$)/.exec(selectedModule.pptUrl);
                const ext = (extMatch?.[1] || 'FILE').toUpperCase();
                const isImage = ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF'].includes(ext);
                const isLocalUpload = selectedModule.pptUrl.startsWith('/api/material-files/');
                const downloadHref = isLocalUpload
                  ? `${selectedModule.pptUrl}${selectedModule.pptUrl.includes('?') ? '&' : '?'}download=1`
                  : selectedModule.pptUrl;

                return (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/35 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-amber-300 flex items-center gap-2">
                          <span>📊 Slide PPT &amp; Lampiran Materi</span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/40 text-[10px] font-mono text-amber-200">
                            {ext}
                          </span>
                        </p>
                        <p className="text-xs text-slate-200 mt-0.5 truncate">{displayName}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <a
                          href={selectedModule.pptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-gold px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap text-center"
                        >
                          Buka File →
                        </a>
                        <a
                          href={downloadHref}
                          download={displayName}
                          className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-400/40 text-amber-200 text-xs font-extrabold whitespace-nowrap text-center transition"
                        >
                          ⬇️ Unduh
                        </a>
                      </div>
                    </div>
                    {isImage && (
                      <div className="rounded-xl overflow-hidden border border-amber-400/25 bg-slate-950/80">
                        <img
                          src={selectedModule.pptUrl}
                          alt={displayName}
                          className="w-full max-h-80 object-contain"
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <h3 className="text-xs font-bold text-sky-300 mb-2">
                  Ringkasan Materi
                </h3>
                <p className="text-slate-300 whitespace-pre-line">{selectedModule.summary}</p>
              </div>

              {selectedModule.keyPoints.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-sky-300 mb-2.5">
                    Poin Kunci yang Wajib Dikuasai
                  </h3>
                  <ul className="space-y-2 text-slate-200 text-xs sm:text-sm">
                    {selectedModule.keyPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="text-sky-400 font-bold tabular-nums">0{i + 1}.</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedModule.formulas.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-sky-400/25 space-y-2">
                  <h3 className="text-xs font-bold text-sky-300">
                    Rumus &amp; Kaidah Penting
                  </h3>
                  <div className="space-y-1.5 font-mono text-xs sm:text-sm text-sky-100">
                    {selectedModule.formulas.map((f, i) => (
                      <p key={i}>{f}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-sky-400/20">
              {selectedModule.practiceQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const room = moduleToPracticeRoom(selectedModule);
                    setSelectedModule(null);
                    onLaunchQuizRoom(room);
                  }}
                  className="btn-gold flex-1 py-3.5 px-5 rounded-2xl text-sm font-bold whitespace-nowrap"
                >
                  Mulai Latihan Kuis Modul Ini
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedModule(null)}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-sky-400/30 text-sky-100 text-sm font-bold whitespace-nowrap"
              >
                Kembali ke Daftar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
