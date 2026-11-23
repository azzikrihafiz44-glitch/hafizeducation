import React from 'react';
import type { AvatarConfig, HistoryRecord, QuizRoom } from '../types/quiz';
import type { LiveTeachingSession, SiteSettings } from '../firebase';
import type { PortalTab } from '../data/academicCatalog';
import { CosmicStudyStation } from './CosmicStudyStation';
import { CosmicPlaygroundHub } from './CosmicPlaygroundHub';
import { BimbelCourseHub } from './BimbelCourseHub';
import { UI_TRANSLATIONS, type UserWebLanguage } from '../utils/webSettings';
import { PWAInstallButton } from './PWAInstallButton';

interface LandingViewProps {
  siteSettings: SiteSettings;
  playerName: string;
  roomCodeInput: string;
  avatar: AvatarConfig;
  activeSavedRoom: QuizRoom | null;
  userEmail: string | null;
  participantPhotoUrl?: string;
  participantSchool?: string;
  participantTargetCampus?: string;
  userHistory: HistoryRecord[];
  onParticipantLogin?: () => Promise<void>;
  onOpenParticipantAuth?: (mode?: 'register' | 'login' | 'profile') => void;
  onParticipantLogout: () => Promise<void>;
  onDownloadCertificate: (rec: HistoryRecord) => void;
  onDeleteHistoryItem?: (rec: HistoryRecord) => void;
  onClearAllHistory?: () => void;
  onPlayerNameChange: (val: string) => void;
  onRoomCodeChange: (val: string) => void;
  onJoinRoom: () => void;
  onFillSavedRoom: () => void;
  onOpenWardrobe: () => void;
  onOpenTutorial: () => void;
  onOpenPortals: (tab: PortalTab) => void;
  onOpenCampusAnalysis?: (mode?: 'utbk' | 'kedinasan') => void;
  onOpenWebSettings?: () => void;
  language?: UserWebLanguage;
  onRandomizeAvatar: () => void;
  onPreviewLobbyDemo: () => void;
  isAdmin?: boolean;
  uploadedRooms?: QuizRoom[];
  liveSessions?: LiveTeachingSession[];
  onLaunchQuizRoom?: (room: QuizRoom) => void;
  onEditUploadedRoom?: (room: QuizRoom) => void;
  onDeleteUploadedRoom?: (room: QuizRoom) => void;
  onUploadFounderPhoto?: (file: File) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  siteSettings,
  playerName,
  roomCodeInput,
  userEmail,
  participantPhotoUrl = '',
  participantSchool = '',
  participantTargetCampus = '',
  userHistory,
  onOpenParticipantAuth,
  onParticipantLogout,
  onDownloadCertificate,
  onDeleteHistoryItem,
  onClearAllHistory,
  onPlayerNameChange,
  onRoomCodeChange,
  onJoinRoom,
  onOpenWardrobe,
  onOpenTutorial,
  onOpenPortals,
  onOpenCampusAnalysis,
  onOpenWebSettings,
  language = 'id',
  onPreviewLobbyDemo,
  isAdmin = false,
  uploadedRooms = [],
  liveSessions = [],
  onLaunchQuizRoom,
  onEditUploadedRoom,
  onDeleteUploadedRoom,
  onUploadFounderPhoto,
}) => {
  const t = UI_TRANSLATIONS[language];

  return (
    <section id="view-landing" className="space-y-12">
      {siteSettings.announcement.trim() && (
        <div
          id="site-announcement-banner"
          className="px-5 py-3 rounded-2xl bg-indigo-950/75 border border-sky-400/35 text-center text-xs sm:text-sm font-semibold text-sky-100 tracking-wide"
        >
          {siteSettings.announcement}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Hero Intro, Shortcuts & PWA Install */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-xs font-medium text-sky-300 tracking-wide">
              <span className="h-[2px] w-8 bg-gradient-to-r from-sky-400 to-indigo-400" aria-hidden="true" />
              <span>{siteSettings.heroTagline}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight leading-[1.12] text-balance">
              <span className="text-gold-gradient">{siteSettings.heroTitle}</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              {siteSettings.heroDescription}
            </p>
          </div>

          {/* Clean 3-Step Strip */}
          <div className="grid grid-cols-3 gap-4 border-y border-sky-400/20 py-4">
            <div className="space-y-1">
              <p className="font-hud text-[11px] font-semibold text-sky-400 tabular-nums">01.</p>
              <p className="font-display text-xs sm:text-sm font-bold text-slate-100">
                {language === 'en' ? 'Register & Profile' : 'Daftar & Profil'}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed hidden sm:block">
                {language === 'en'
                  ? 'Save target campus, SKD & quiz history to cloud'
                  : 'Simpan target PTN/kedinasan & progres ke database'}
              </p>
            </div>
            <div className="space-y-1 border-l border-sky-400/20 pl-4">
              <p className="font-hud text-[11px] font-semibold text-indigo-300 tabular-nums">02.</p>
              <p className="font-display text-xs sm:text-sm font-bold text-slate-100">
                {language === 'en' ? 'Enter Room Code' : 'Masuk Kode Room'}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed hidden sm:block">
                {language === 'en'
                  ? 'Join the Quiz Lobby together in real-time'
                  : 'Bergabung ke Lobi Kuis secara real-time'}
              </p>
            </div>
            <div className="space-y-1 border-l border-sky-400/20 pl-4">
              <p className="font-hud text-[11px] font-semibold text-teal-300 tabular-nums">03.</p>
              <p className="font-display text-xs sm:text-sm font-bold text-slate-100">
                {language === 'en' ? 'Podium & Certificate' : 'Podium & Sertifikat'}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed hidden sm:block">
                {language === 'en'
                  ? 'Live leaderboard & official HD E-Certificate'
                  : 'Peringkat langsung & E-Sertifikat resmi HD'}
              </p>
            </div>
          </div>

          {onOpenCampusAnalysis && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-landing-campus-analysis"
                onClick={() => onOpenCampusAnalysis('utbk')}
                className="py-3.5 px-4 rounded-2xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-400/40 text-teal-100 text-xs font-bold flex items-center justify-between gap-2 transition"
              >
                <span>🎯 Analisis Kampus UTBK</span>
                <span className="text-teal-300 whitespace-nowrap">7 Subtes →</span>
              </button>
              <button
                type="button"
                id="btn-landing-kedinasan-analysis"
                onClick={() => onOpenCampusAnalysis('kedinasan')}
                className="py-3.5 px-4 rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/40 text-purple-100 text-xs font-bold flex items-center justify-between gap-2 transition"
              >
                <span>🏛️ Analisis Kedinasan SKD</span>
                <span className="text-purple-300 whitespace-nowrap">TWK·TIU·TKP →</span>
              </button>
            </div>
          )}

          <PWAInstallButton
            variant="card"
            language={language}
            playStoreUrl={siteSettings.playStoreUrl}
            appStoreUrl={siteSettings.appStoreUrl}
            microsoftStoreUrl={siteSettings.microsoftStoreUrl}
            microsoftStoreId={siteSettings.microsoftStoreId}
          />
        </div>

        {/* Right Join Room, Participant Auth & Personal History */}
        <div className="lg:col-span-6 space-y-6">
          {/* Cosmic Obsidian Join Room Card */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onJoinRoom();
            }}
            className="hero-glow-card holo-top-beam p-6 sm:p-7 rounded-3xl space-y-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                  {language === 'en' ? 'Enter Quiz Room' : 'Masuk ke Room Kuis'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'en'
                    ? 'Complete your student identity to enter the Quiz Lobby'
                    : 'Lengkapi identitas peserta untuk memasuki Lobi Kuis'}
                </p>
              </div>
              <button
                type="button"
                onClick={onPreviewLobbyDemo}
                className="text-xs font-semibold text-sky-300 hover:text-sky-200 underline underline-offset-4 decoration-sky-400/50 whitespace-nowrap shrink-0 transition"
              >
                {language === 'en' ? 'Quiz Lobby →' : 'Lobi Kuis →'}
              </button>
            </div>

            {/* Participant Account Bar (Daftar Tanpa Google: Nama & Kata Sandi + Foto) */}
            <div className="px-4 py-3.5 rounded-2xl bg-slate-900/75 border border-sky-400/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {userEmail ? (
                <>
                  <div className="flex items-center gap-3 text-xs min-w-0">
                    {participantPhotoUrl && (
                      <img
                        src={participantPhotoUrl}
                        alt={playerName || 'Foto peserta'}
                        className="w-10 h-10 rounded-xl object-cover border border-emerald-400/45 shrink-0"
                      />
                    )}
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-semibold text-emerald-300">
                        Akun Aktif · Database Peserta
                      </p>
                      <p className="text-slate-200 truncate">
                        {playerName || userEmail}
                        {participantSchool ? ` · ${participantSchool}` : ''}
                      </p>
                      {participantTargetCampus && (
                        <p className="text-[11px] text-teal-300 truncate">
                          Target: {participantTargetCampus}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {onOpenParticipantAuth && (
                      <button
                        type="button"
                        id="btn-landing-edit-profile-db"
                        onClick={() => onOpenParticipantAuth('profile')}
                        className="px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/40 text-sky-100 font-bold text-xs whitespace-nowrap transition"
                      >
                        Profil &amp; Foto Saya
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onParticipantLogout}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-semibold text-xs whitespace-nowrap transition"
                    >
                      Keluar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs">
                    <p className="font-semibold text-sky-100">
                      Daftar / Masuk Akun Peserta (Tanpa Google)
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Cukup masukkan Nama &amp; Kata Sandi untuk menyimpan profil, foto &amp; nilai.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {onOpenParticipantAuth && (
                      <>
                        <button
                          type="button"
                          id="btn-landing-register"
                          onClick={() => onOpenParticipantAuth('register')}
                          className="px-3.5 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-extrabold text-xs whitespace-nowrap transition shadow-[0_0_20px_rgba(56,189,248,0.3)]"
                        >
                          Buat Akun
                        </button>
                        <button
                          type="button"
                          id="btn-landing-login-email"
                          onClick={() => onOpenParticipantAuth('login')}
                          className="px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/45 text-indigo-100 font-bold text-xs whitespace-nowrap transition"
                        >
                          Masuk
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="input-player-name"
                  className="block text-xs font-semibold text-slate-200 mb-2"
                >
                  Nama Lengkap Peserta
                </label>
                <input
                  type="text"
                  id="input-player-name"
                  maxLength={28}
                  value={playerName}
                  onChange={(e) => onPlayerNameChange(e.target.value)}
                  placeholder="Contoh: Aisyah Putri / Hafiz"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-900/80 border border-sky-400/25 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 outline-none text-white font-medium placeholder:text-slate-500 transition"
                />
              </div>
              <div>
                <label
                  htmlFor="input-room-code"
                  className="block text-xs font-semibold text-slate-200 mb-2"
                >
                  Kode Room Kuis
                </label>
                <input
                  type="text"
                  id="input-room-code"
                  maxLength={8}
                  value={roomCodeInput}
                  onChange={(e) => onRoomCodeChange(e.target.value.toUpperCase())}
                  placeholder="Masukkan kode dari Admin"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-900/80 border border-indigo-400/25 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 outline-none text-sky-100 font-bold uppercase tracking-widest placeholder:text-slate-500 placeholder:font-normal placeholder:tracking-normal transition"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="submit"
                className="btn-gold flex-1 py-4 px-6 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span>
                  {language === 'en' ? 'Join Quiz Lobby →' : 'Gabung Lobi Kuis →'}
                </span>
              </button>
              <button
                type="button"
                onClick={onOpenTutorial}
                className="py-4 px-5 rounded-2xl bg-slate-800/85 hover:bg-slate-700/85 border border-sky-400/30 text-sky-100 font-semibold text-sm flex items-center justify-center transition whitespace-nowrap"
              >
                {language === 'en' ? 'How to Play' : 'Cara Main'}
              </button>
              {onOpenWebSettings && (
                <button
                  type="button"
                  id="btn-landing-web-settings"
                  onClick={onOpenWebSettings}
                  className="py-4 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-sky-400/30 text-sky-200 font-semibold text-sm flex items-center justify-center transition whitespace-nowrap"
                >
                  ⚙️ {t.navSettings}
                </button>
              )}
            </div>

          </form>

          {/* Personal Per-Email Quiz & Certificate History */}
          {userEmail && userHistory.length > 0 && (
            <div className="glass-card p-5 sm:p-6 rounded-3xl space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-400/20 pb-3">
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    Riwayat Nilai &amp; Sertifikat Saya ({userHistory.length})
                  </h3>
                  <span className="text-[11px] text-slate-400 truncate block max-w-[240px]">
                    {userEmail}
                  </span>
                </div>
                {onClearAllHistory && (
                  <button
                    type="button"
                    onClick={onClearAllHistory}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 font-bold text-[11px] shrink-0 whitespace-nowrap transition"
                  >
                    🗑️ Hapus Semua
                  </button>
                )}
              </div>
              <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {userHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 px-4 py-3 rounded-xl bg-slate-900/75 border border-sky-400/20 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white truncate">{rec.quizTitle}</p>
                      <p className="text-[11px] text-slate-400 tabular-nums mt-0.5">
                        Room <span className="font-mono text-sky-300 font-semibold">{rec.roomCode}</span> · Nilai{' '}
                        <strong className="text-emerald-300">{rec.grade}</strong> · Poin{' '}
                        <strong className="text-indigo-300">{rec.points}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onDownloadCertificate(rec)}
                        className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/40 text-sky-200 font-semibold text-xs whitespace-nowrap transition"
                      >
                        Unduh Sertifikat
                      </button>
                      {onDeleteHistoryItem && (
                        <button
                          type="button"
                          onClick={() => onDeleteHistoryItem(rec)}
                          title={`Hapus riwayat ${rec.quizTitle}`}
                          aria-label={`Hapus riwayat nilai dan sertifikat ${rec.quizTitle}`}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-xs whitespace-nowrap transition"
                        >
                          🗑️ Hapus
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ruangguru-Style Structured Bimbingan Belajar Course Hub */}
      <BimbelCourseHub
        playerName={playerName}
        userEmail={userEmail}
        userHistory={userHistory}
        uploadedRooms={uploadedRooms}
        liveSessions={liveSessions}
        isAdmin={isAdmin}
        onOpenPortals={onOpenPortals}
        onLaunchQuizRoom={onLaunchQuizRoom}
        onEditUploadedRoom={onEditUploadedRoom}
        onDeleteUploadedRoom={onDeleteUploadedRoom}
        onPreviewLobbyDemo={onPreviewLobbyDemo}
      />

      {/* Cosmic Study Station: Pomodoro Focus Timer, Ambient Space Sound & Astronaut Rank */}
      <CosmicStudyStation
        userHistory={userHistory}
        onOpenPortalsAsas={() => onOpenPortals('asas-xii')}
        onOpenWardrobe={onOpenWardrobe}
      />

      {/* Interactive Study Playground: Speed Math, 3D Flashcards & Exam Countdown/Notes */}
      <CosmicPlaygroundHub />

      {/* About Web & Founder Hafiz Education Section */}
      <div id="about-hafiz-education" className="pt-4 scroll-mt-24">
        <div className="hero-glow-card holo-top-beam rounded-3xl p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Founder Portrait & Credentials */}
            <div className="lg:col-span-4 flex flex-col items-center text-center space-y-5 lg:border-r lg:border-sky-400/20 lg:pr-8">
              <div className="relative">
                <span aria-hidden="true" className="pointer-events-none absolute -top-2 -left-2 w-5 h-5 border-t-2 border-l-2 border-sky-400 rounded-tl-lg" />
                <span aria-hidden="true" className="pointer-events-none absolute -bottom-2 -right-2 w-5 h-5 border-b-2 border-r-2 border-indigo-400 rounded-br-lg" />
                <div className="w-40 h-48 sm:w-44 sm:h-56 rounded-3xl p-1.5 bg-gradient-to-br from-sky-400 via-indigo-500 to-teal-400 shadow-[0_12px_40px_rgba(56,189,248,0.3)] overflow-hidden relative">
                  <img
                    src={siteSettings.founderPhoto || '/assets/aistudio/Favicon_0fd84ae5.png'}
                    alt="Foto Founder Hafiz Education — M. Hafiz Azzikri"
                    className={`w-full h-full rounded-[20px] bg-slate-900 ${
                      siteSettings.founderPhoto ? 'object-cover object-top' : 'object-contain p-3'
                    }`}
                  />
                  <div aria-hidden="true" className="holo-scanline" />
                </div>
              </div>

              {isAdmin && onUploadFounderPhoto && (
                <label className="cursor-pointer px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-sky-400/35 text-xs font-semibold text-sky-200 transition">
                  <span>{siteSettings.founderPhoto ? 'Ganti Foto Founder' : 'Upload Foto Founder'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onUploadFounderPhoto(f);
                    }}
                  />
                </label>
              )}

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-sky-300">
                  Pendiri Hafiz Education
                </p>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-gold-gradient">
                  M. Hafiz Azzikri
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  Pelajar di MAN Insan Cendekia Jambi
                </p>
              </div>

              <div className="w-full max-w-xs border-t border-sky-400/20 pt-4 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Nama Lengkap</span>
                  <span className="font-semibold text-white">M. Hafiz Azzikri</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Tempat, Tgl Lahir</span>
                  <span className="font-semibold text-white">Jambi, 01 Juni 2009</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Institusi</span>
                  <span className="font-semibold text-white">MAN Insan Cendekia Jambi</span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-slate-400">Instagram</span>
                  <a
                    href="https://instagram.com/hafiz_education"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold text-pink-300 hover:text-pink-200 transition"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                    @hafiz_education
                  </a>
                </div>
              </div>
            </div>

            {/* Official About Platform, Visi & Misi */}
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-sky-300 tracking-wide">
                  Tentang Hafiz Education
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white leading-snug text-balance">
                  Ruang Edukasi Digital &amp; Teman Belajar Pelajar Indonesia
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  <strong className="text-white">Hafiz Education</strong> adalah platform edukasi
                  dan ruang berbagi wawasan belajar yang digagas oleh{' '}
                  <strong className="text-white">M. Hafiz Azzikri</strong> (lahir di Jambi, 01
                  Juni 2009), seorang pelajar{' '}
                  <strong className="text-white">MAN Insan Cendekia Jambi</strong>. Website ini
                  hadir sebagai teman belajar bagi pelajar dan generasi muda untuk menemukan materi
                  pembelajaran yang terstruktur, tips strategi akademik, serta inspirasi pengembangan
                  diri agar proses belajar terasa lebih terarah, relevan, dan menyenangkan.
                </p>
              </div>

              {/* Visi */}
              <div className="p-5 rounded-2xl bg-slate-900/75 border border-sky-400/25 space-y-1.5">
                <h3 className="font-display text-lg font-bold text-sky-200">Visi</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Menjadi ruang edukasi digital yang inspiratif, mudah diakses, dan berdampak positif
                  dalam membantu pelajar menumbuhkan semangat belajar, berpikir kritis, serta meraih
                  prestasi akademik dan masa depan yang cemerlang.
                </p>
              </div>

              {/* Misi */}
              <div className="space-y-3">
                <h3 className="font-display text-lg font-bold text-white">Misi</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-200">
                  <li className="p-4 rounded-2xl bg-slate-900/70 border border-sky-400/25 leading-relaxed">
                    <span className="font-hud font-bold text-sky-300 mr-1.5">01.</span>
                    Menyajikan materi pembelajaran, ringkasan konsep, dan tips belajar yang sistematis
                    serta mudah dipahami.
                  </li>
                  <li className="p-4 rounded-2xl bg-slate-900/70 border border-indigo-400/25 leading-relaxed">
                    <span className="font-hud font-bold text-indigo-300 mr-1.5">02.</span>
                    Mendorong kebiasaan belajar mandiri, disiplin, dan rasa ingin tahu yang
                    berkelanjutan di kalangan pelajar.
                  </li>
                  <li className="p-4 rounded-2xl bg-slate-900/70 border border-teal-400/25 leading-relaxed">
                    <span className="font-hud font-bold text-teal-300 mr-1.5">03.</span>
                    Membagikan wawasan persiapan studi lanjut, manajemen waktu, dan pengembangan
                    potensi diri.
                  </li>
                  <li className="p-4 rounded-2xl bg-slate-900/70 border border-purple-400/25 leading-relaxed">
                    <span className="font-hud font-bold text-purple-300 mr-1.5">04.</span>
                    Membangun komunitas belajar yang suportif, inklusif, dan saling menginspirasi
                    antar pelajar.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
