import React from 'react';
import type { AppView } from '../types/quiz';
import type { PortalTab } from '../data/academicCatalog';
import { UI_TRANSLATIONS, type UserWebLanguage } from '../utils/webSettings';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  brandName?: string;
  currentView: AppView;
  adminNavUnlocked: boolean;
  theme: 'dark' | 'light';
  language?: UserWebLanguage;
  liveCount?: number;
  userEmail?: string | null;
  participantPhotoUrl?: string;
  isAdminSession?: boolean;
  playStoreUrl?: string;
  appStoreUrl?: string;
  microsoftStoreUrl?: string;
  microsoftStoreId?: string;
  onToggleTheme: () => void;
  onOpenWebSettings: () => void;
  onOpenParticipantAuth?: (mode?: 'register' | 'login' | 'profile') => void;
  onBrandClick: () => void;
  onOpenPortals: (tab?: PortalTab) => void;
  onOpenCampusAnalysis: () => void;
  onOpenAbout: () => void;
  onOpenTutorial: () => void;
  onOpenWardrobe: () => void;
  onSwitchStudent: () => void;
  onOpenAdminGate: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  brandName = 'Hafiz Education',
  currentView,
  adminNavUnlocked,
  theme,
  language = 'id',
  liveCount = 0,
  userEmail = null,
  participantPhotoUrl = '',
  isAdminSession = false,
  playStoreUrl = '',
  appStoreUrl = '',
  microsoftStoreUrl = '',
  microsoftStoreId = '',
  onToggleTheme,
  onOpenWebSettings,
  onOpenParticipantAuth,
  onBrandClick,
  onOpenPortals,
  onOpenCampusAnalysis,
  onOpenAbout,
  onOpenTutorial,
  onOpenWardrobe,
  onSwitchStudent,
  onOpenAdminGate,
  onLogout,
}) => {
  const canLogout = Boolean((userEmail || isAdminSession) && onLogout);
  const showAdminTab = adminNavUnlocked;
  const t = UI_TRANSLATIONS[language];

  return (
    <header className="sticky top-0 z-40 border-b border-sky-400/20 bg-slate-950/75 backdrop-blur-2xl shadow-[0_8px_32px_rgba(2,6,23,0.55)]">
      <div
        aria-hidden="true"
        className="h-[2px] w-full bg-gradient-to-r from-sky-400 via-indigo-500 to-teal-400"
      />
      <div className="max-w-[1400px] mx-auto px-2.5 sm:px-5 h-16 flex items-center justify-between gap-1.5 sm:gap-2.5">
        {/* Zone 1: Brand Wordmark (5x klik untuk akses rahasia Admin) */}
        <button
          type="button"
          id="brand-secret-trigger"
          onClick={onBrandClick}
          className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 rounded-xl min-w-0 shrink"
          aria-label={`${brandName} — ${t.navHome}`}
        >
          <span className="p-[2px] rounded-full bg-gradient-to-br from-sky-400 via-indigo-500 to-teal-400 shadow-[0_0_18px_rgba(56,189,248,0.45)] group-hover:scale-105 transition shrink-0">
            <img
              src="/assets/aistudio/Favicon_0fd84ae5.png"
              alt={`Logo ${brandName}`}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover bg-slate-900 block"
            />
          </span>
          <span className="font-display font-bold text-sm sm:text-lg tracking-tight text-gold-gradient whitespace-nowrap truncate">
            {brandName}
          </span>
        </button>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-2.5 lg:gap-3.5 text-[13px] font-medium text-slate-300">
          <button
            type="button"
            onClick={onSwitchStudent}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
              currentView === 'landing'
                ? 'text-sky-200 border-sky-400 font-semibold'
                : 'border-transparent hover:text-white hover:border-sky-400/50'
            }`}
          >
            {t.navHome}
          </button>
          <button
            type="button"
            id="btn-nav-portal-belajar"
            onClick={() => onOpenPortals('tryout-utbk')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
              currentView === 'portals'
                ? 'text-sky-200 border-sky-400 font-semibold'
                : 'border-transparent hover:text-white hover:border-sky-400/50'
            }`}
          >
            {t.navPortal}
          </button>
          <button
            type="button"
            id="btn-nav-campus-analysis"
            onClick={onOpenCampusAnalysis}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
              currentView === 'campus-analysis'
                ? 'text-teal-200 border-teal-400 font-semibold'
                : 'border-transparent hover:text-teal-200 hover:border-teal-400/50'
            }`}
          >
            {t.navCampus}
          </button>
          <button
            type="button"
            id="btn-nav-kedinasan"
            onClick={() => onOpenPortals('kedinasan')}
            className="border-b-2 border-transparent hover:text-purple-200 hover:border-purple-400/60 pb-1 transition-colors whitespace-nowrap shrink-0"
          >
            {t.navKedinasan}
          </button>
          <button
            type="button"
            id="btn-nav-live-teaching"
            onClick={() => onOpenPortals('live-teaching')}
            className="inline-flex items-center gap-1.5 border-b-2 border-transparent hover:text-rose-200 hover:border-rose-400/60 pb-1 transition-colors whitespace-nowrap shrink-0 text-rose-300 font-semibold"
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" aria-hidden="true" />
            <span>
              {t.navLiveTeaching}
              {liveCount > 0 ? ` (${liveCount})` : ''}
            </span>
          </button>
          <button
            type="button"
            onClick={onOpenAbout}
            className={`${showAdminTab ? 'hidden 2xl:inline-flex' : 'hidden xl:inline-flex'} border-b-2 border-transparent hover:text-white hover:border-sky-400/50 pb-1 transition-colors whitespace-nowrap shrink-0`}
          >
            {t.navAbout}
          </button>
          <button
            type="button"
            onClick={onOpenTutorial}
            className={`${showAdminTab ? 'hidden 2xl:inline-flex' : 'hidden xl:inline-flex'} border-b-2 border-transparent hover:text-white hover:border-sky-400/50 pb-1 transition-colors whitespace-nowrap shrink-0`}
          >
            {t.navGuide}
          </button>
          {showAdminTab && (
            <button
              type="button"
              id="portal-tab-admin"
              onClick={onOpenAdminGate}
              className={`border-b-2 pb-1 transition-colors whitespace-nowrap shrink-0 font-semibold ${
                currentView === 'admin'
                  ? 'text-amber-300 border-amber-400'
                  : 'text-amber-200 border-transparent hover:text-amber-100 hover:border-amber-300/60'
              }`}
            >
              🛡️ Studio Admin
            </button>
          )}
        </nav>

        {/* Zone 3: Settings, Theme Toggle & Avatar */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onOpenPortals('tryout-utbk')}
            className="hidden sm:inline-flex md:hidden px-2.5 py-2 rounded-xl bg-slate-800/80 border border-sky-400/30 text-xs font-semibold text-sky-200 transition whitespace-nowrap shrink-0"
          >
            {t.navPortal}
          </button>
          <button
            type="button"
            id="btn-nav-campus-mobile"
            onClick={onOpenCampusAnalysis}
            aria-label={t.navCampus}
            title={t.navCampus}
            className="hidden sm:inline-flex md:hidden px-2.5 py-2 rounded-xl bg-teal-500/20 border border-teal-400/35 text-xs font-semibold text-teal-200 transition whitespace-nowrap shrink-0"
          >
            🎯 <span>Kampus</span>
          </button>

          {showAdminTab && (
            <button
              type="button"
              id="portal-tab-admin-mobile"
              onClick={onOpenAdminGate}
              aria-label="Studio Admin"
              title="Studio Admin"
              className="md:hidden px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-xs font-semibold text-amber-200 transition whitespace-nowrap shrink-0"
            >
              🛡️ <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          <PWAInstallButton
            variant="header"
            language={language}
            playStoreUrl={playStoreUrl}
            appStoreUrl={appStoreUrl}
            microsoftStoreUrl={microsoftStoreUrl}
            microsoftStoreId={microsoftStoreId}
          />

          {onOpenParticipantAuth && (
            <button
              type="button"
              id="btn-header-participant-auth"
              onClick={() => onOpenParticipantAuth(userEmail ? 'profile' : 'register')}
              title={userEmail ? `Profil Peserta (${userEmail})` : 'Daftar atau Masuk Akun Peserta'}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/40 text-xs font-bold text-sky-100 transition whitespace-nowrap shrink-0"
            >
              {participantPhotoUrl && (
                <img
                  src={participantPhotoUrl}
                  alt="Foto profil"
                  className="w-4 h-4 rounded-full object-cover border border-sky-300/60"
                />
              )}
              <span>{userEmail ? 'Profil Saya' : 'Daftar / Masuk'}</span>
            </button>
          )}

          <button
            type="button"
            id="btn-open-web-settings"
            onClick={onOpenWebSettings}
            aria-label={t.navSettings}
            title={t.navSettings}
            className="px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-xl bg-slate-800/85 hover:bg-slate-700/85 border border-sky-400/35 text-xs font-bold text-sky-200 transition whitespace-nowrap shrink-0"
          >
            ⚙️ <span className="hidden 2xl:inline">{t.navSettings}</span>
          </button>

          <button
            type="button"
            id="btn-toggle-theme"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            className="px-2.5 py-2 rounded-xl bg-slate-800/85 hover:bg-slate-700/85 border border-sky-400/35 text-xs font-bold text-amber-300 transition whitespace-nowrap shrink-0 hidden md:inline-flex"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <button
            type="button"
            onClick={onOpenWardrobe}
            className="btn-gold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0"
          >
            Avatar
          </button>

          {canLogout && (
            <button
              type="button"
              id="btn-header-logout"
              onClick={onLogout}
              aria-label={t.logoutLabel}
              title={userEmail ? `Keluar dari ${userEmail}` : 'Keluar Sesi'}
              className="px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-400/40 text-[11px] sm:text-xs font-bold text-rose-200 transition whitespace-nowrap shrink-0"
            >
              <span className="sm:hidden" aria-hidden="true">🚪</span>
              <span className="hidden sm:inline">{t.logoutLabel}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
