import React, { useState } from 'react';
import {
  DEFAULT_USER_WEB_SETTINGS,
  USER_ACCENT_THEMES,
  type UserFontScale,
  type UserLayoutDensity,
  type UserTargetTrack,
  type UserWebLanguage,
  type UserWebSettings,
} from '../utils/webSettings';
import { PWAInstallButton } from './PWAInstallButton';

interface WebSettingsModalProps {
  open: boolean;
  settings: UserWebSettings;
  playerName: string;
  playStoreUrl?: string;
  appStoreUrl?: string;
  microsoftStoreUrl?: string;
  microsoftStoreId?: string;
  onChangeSettings: (next: UserWebSettings) => void;
  onChangePlayerName: (name: string) => void;
  onResetDefaults: () => void;
  onClose: () => void;
}

type SettingsTab = 'all' | 'language-profile' | 'appearance' | 'experience';

export const WebSettingsModal: React.FC<WebSettingsModalProps> = ({
  open,
  settings,
  playerName,
  playStoreUrl = '',
  appStoreUrl = '',
  microsoftStoreUrl = '',
  microsoftStoreId = '',
  onChangeSettings,
  onChangePlayerName,
  onResetDefaults,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('all');

  if (!open) return null;

  const isEn = settings.language === 'en';
  const showSection = (sec: Exclude<SettingsTab, 'all'>) =>
    activeTab === 'all' || activeTab === sec;

  const update = (patch: Partial<UserWebSettings>) => {
    onChangeSettings({ ...settings, ...patch });
  };

  return (
    <div
      id="modal-web-settings"
      role="dialog"
      aria-modal="true"
      aria-labelledby="web-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
    >
      <div className="hero-glow-card w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden border border-sky-400/35">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-sky-400/20 flex items-center justify-between gap-3 shrink-0">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
              {isEn ? 'Personal Web Preferences' : 'Preferensi Web Pribadi'}
            </p>
            <h2
              id="web-settings-title"
              className="font-display text-xl sm:text-2xl font-bold text-gold-gradient"
            >
              {isEn ? '⚙️ Customize Your Web Experience' : '⚙️ Pengaturan Web Anda'}
            </h2>
          </div>
          <button
            type="button"
            id="btn-close-web-settings"
            onClick={onClose}
            aria-label={isEn ? 'Close settings' : 'Tutup pengaturan'}
            className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-sky-400/30 text-slate-200 font-bold flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-6 py-3 border-b border-sky-400/15 bg-slate-900/60 flex flex-wrap gap-1.5 shrink-0">
          {(
            [
              { id: 'all', label: isEn ? 'All Settings' : 'Semua' },
              { id: 'language-profile', label: isEn ? 'Language & Profile' : 'Bahasa & Profil' },
              { id: 'appearance', label: isEn ? 'Appearance & Layout' : 'Tampilan & Tata Letak' },
              { id: 'experience', label: isEn ? 'Effects, Audio & More' : 'Efek, Suara & Lainnya' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === tab.id
                  ? 'btn-gold text-white'
                  : 'bg-slate-900/90 border border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* 1. BAHASA & PROFIL */}
          {showSection('language-profile') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-sky-400/15 pb-2">
                <h3 className="font-display text-base font-bold text-white">
                  {isEn ? '🌐 Language & Student Profile' : '🌐 Bahasa & Profil Pengguna'}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {isEn ? 'Applies immediately' : 'Aktif langsung'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    {isEn ? 'Web Interface Language' : 'Bahasa Antarmuka Web'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'id' as UserWebLanguage, label: '🇮🇩 Indonesia' },
                        { id: 'en' as UserWebLanguage, label: '🇬🇧 English' },
                      ]
                    ).map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        id={`btn-setting-lang-${lang.id}`}
                        onClick={() => update({ language: lang.id })}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                          settings.language === lang.id
                            ? 'bg-sky-500/25 border-sky-400 text-white shadow-[0_0_16px_rgba(56,189,248,0.25)]'
                            : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="input-settings-player-name"
                    className="block text-xs font-semibold text-slate-300 mb-2"
                  >
                    {isEn ? 'Display Name' : 'Nama Tampilan Anda'}
                  </label>
                  <input
                    id="input-settings-player-name"
                    type="text"
                    maxLength={28}
                    value={playerName}
                    onChange={(e) => onChangePlayerName(e.target.value)}
                    placeholder={isEn ? 'Enter your name...' : 'Masukkan nama panggilan...'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-sky-400/25 focus:border-sky-400 outline-none text-xs sm:text-sm text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  {isEn ? 'Default Campus Analysis Target' : 'Fokus Jalur Studi Utama'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      {
                        id: 'utbk' as UserTargetTrack,
                        label: isEn ? '🎯 UTBK PTN' : '🎯 PTN (UTBK)',
                      },
                      {
                        id: 'kedinasan' as UserTargetTrack,
                        label: isEn ? '🏛️ Civil Service' : '🏛️ Kedinasan',
                      },
                      {
                        id: 'both' as UserTargetTrack,
                        label: isEn ? '✨ Both Tracks' : '✨ Keduanya',
                      },
                    ]
                  ).map((tr) => (
                    <button
                      key={tr.id}
                      type="button"
                      onClick={() => update({ defaultStudyTrack: tr.id })}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                        settings.defaultStudyTrack === tr.id
                          ? 'bg-teal-500/25 border-teal-400 text-teal-100'
                          : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {tr.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* 2. TAMPILAN & TATA LETAK */}
          {showSection('appearance') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-sky-400/15 pb-2">
                <h3 className="font-display text-base font-bold text-white">
                  {isEn ? '🎨 Appearance, Theme & Typography' : '🎨 Tampilan, Tema & Tata Letak'}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {isEn ? 'Per-device styling' : 'Khusus perangkat Anda'}
                </span>
              </div>

              {/* Theme Mode */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="btn-setting-theme-dark"
                  onClick={() => update({ theme: 'dark' })}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    settings.theme === 'dark'
                      ? 'bg-indigo-500/25 border-sky-400 text-white'
                      : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <p className="text-xs font-bold">🌙 {isEn ? 'Cosmic Dark Mode' : 'Mode Gelap Kosmik'}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isEn ? 'Comfortable night space contrast' : 'Nyaman di mata dengan nuansa antariksa'}
                  </p>
                </button>
                <button
                  type="button"
                  id="btn-setting-theme-light"
                  onClick={() => update({ theme: 'light' })}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    settings.theme === 'light'
                      ? 'bg-sky-500/25 border-sky-400 text-white'
                      : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <p className="text-xs font-bold">☀️ {isEn ? 'Bright Minimal Mode' : 'Mode Terang Minimalis'}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isEn ? 'Crisp daylight study mode' : 'Latar cerah bersih untuk belajar siang'}
                  </p>
                </button>
              </div>

              {/* Accent Palette */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  {isEn ? 'Color Accent Theme' : 'Warna Aksen Antarmuka'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {USER_ACCENT_THEMES.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      id={`btn-setting-accent-${opt.id}`}
                      onClick={() => update({ accent: opt.id })}
                      className={`p-3 rounded-2xl border text-left transition ${
                        settings.accent === opt.id
                          ? 'border-white bg-slate-800/95 ring-2 ring-sky-400/60'
                          : 'border-slate-700 bg-slate-900/80 hover:bg-slate-800'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`block h-3 w-full rounded-full bg-gradient-to-r ${opt.swatchClass} mb-2`}
                      />
                      <p className="text-xs font-bold text-white">
                        {isEn ? opt.labelEn : opt.labelId}
                      </p>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                        {isEn ? opt.descriptionEn : opt.descriptionId}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Scale & Layout Density */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    {isEn ? 'Text Size' : 'Ukuran Teks Web'}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'compact' as UserFontScale, label: isEn ? 'Small' : 'Kecil' },
                        { id: 'normal' as UserFontScale, label: 'Normal' },
                        { id: 'large' as UserFontScale, label: isEn ? 'Large' : 'Besar' },
                      ]
                    ).map((sc) => (
                      <button
                        key={sc.id}
                        type="button"
                        id={`btn-setting-font-${sc.id}`}
                        onClick={() => update({ fontScale: sc.id })}
                        className={`py-2 px-2 rounded-xl border text-xs font-bold transition ${
                          settings.fontScale === sc.id
                            ? 'bg-sky-500/25 border-sky-400 text-sky-100'
                            : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {sc.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    {isEn ? 'Layout Spacing' : 'Kepadatan Tata Letak'}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        {
                          id: 'comfortable' as UserLayoutDensity,
                          label: isEn ? 'Spacious' : 'Nyaman',
                        },
                        {
                          id: 'compact' as UserLayoutDensity,
                          label: isEn ? 'Compact' : 'Kompak',
                        },
                      ]
                    ).map((dn) => (
                      <button
                        key={dn.id}
                        type="button"
                        id={`btn-setting-density-${dn.id}`}
                        onClick={() => update({ layoutDensity: dn.id })}
                        className={`py-2 px-2 rounded-xl border text-xs font-bold transition ${
                          settings.layoutDensity === dn.id
                            ? 'bg-sky-500/25 border-sky-400 text-sky-100'
                            : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {dn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 3. EFEK, SUARA & LAIN-LAIN */}
          {showSection('experience') && (
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-sky-400/15 pb-2">
                <h3 className="font-display text-base font-bold text-white">
                  {isEn ? '✨ Visual Effects, Audio & Preferences' : '✨ Efek Visual, Suara & Lain-Lain'}
                </h3>
              </div>

              {(
                [
                  {
                    key: 'galaxyEffects' as const,
                    title: isEn
                      ? 'Animated Galaxy, Stars & Astronauts'
                      : 'Latar Belakang Galaksi, Bintang & Astronot',
                    desc: isEn
                      ? 'Turn off for a clean minimal background and battery saving'
                      : 'Matikan jika ingin latar polos yang tenang & hemat baterai',
                    value: settings.galaxyEffects,
                  },
                  {
                    key: 'reducedMotion' as const,
                    title: isEn ? 'Reduce Motion & Animations' : 'Kurangi Gerak & Animasi',
                    desc: isEn
                      ? 'Pauses floating/meteor animations across the site'
                      : 'Menghentikan animasi mengambang & meteor di seluruh halaman',
                    value: settings.reducedMotion,
                  },
                  {
                    key: 'highContrastCards' as const,
                    title: isEn ? 'High-Contrast Solid Cards' : 'Kartu Kontras Tinggi (Lebih Tegas)',
                    desc: isEn
                      ? 'Makes card backgrounds less transparent for sharper reading'
                      : 'Mengurangi transparansi kaca agar teks soal lebih jelas dibaca',
                    value: settings.highContrastCards,
                  },
                  {
                    key: 'soundEffects' as const,
                    title: isEn ? 'Quiz & Countdown Sound Effects' : 'Efek Suara Kuis & Hitungan Mundur',
                    desc: isEn
                      ? 'Audio cues during lobby countdown and quiz start'
                      : 'Suara bip hitungan mundur saat admin memulai kuis di lobi',
                    value: settings.soundEffects,
                  },
                  {
                    key: 'confettiEnabled' as const,
                    title: isEn ? 'Celebration Confetti Effects' : 'Efek Konfeti Selebrasi Juara',
                    desc: isEn
                      ? 'Particle bursts when finishing a quiz or starting a match'
                      : 'Efek konfeti meriah saat menyelesaikan ujian/try out',
                    value: settings.confettiEnabled,
                  },
                  {
                    key: 'skipIntroSplash' as const,
                    title: isEn ? 'Skip Startup Intro Splash' : 'Lewati Layar Pembuka Otomatis',
                    desc: isEn
                      ? 'Open directly to the main page on next visit'
                      : 'Langsung masuk ke beranda tanpa menunggu animasi intro awal',
                    value: settings.skipIntroSplash,
                  },
                ]
              ).map((item) => (
                <div
                  key={item.key}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-sky-400/20 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-white">{item.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    id={`toggle-setting-${item.key}`}
                    role="switch"
                    aria-checked={item.value}
                    aria-label={item.title}
                    onClick={() => update({ [item.key]: !item.value })}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${
                      item.value
                        ? 'bg-teal-500 border-teal-300'
                        : 'bg-slate-800 border-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                        item.value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}

              <div className="p-4 rounded-2xl bg-teal-950/35 border border-teal-400/30 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-white">
                    {isEn ? 'Install Web App (Offline-Ready)' : 'Download Aplikasi Web (PWA)'}
                  </p>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {isEn
                      ? 'Install HafizEdu onto your phone or desktop home screen.'
                      : 'Pasang HafizEdu ke HP Android, iPhone, atau desktop agar bisa dibuka layaknya aplikasi.'}
                  </p>
                </div>
                <PWAInstallButton
                  variant="settings"
                  language={settings.language}
                  playStoreUrl={playStoreUrl}
                  appStoreUrl={appStoreUrl}
                  microsoftStoreUrl={microsoftStoreUrl}
                  microsoftStoreId={microsoftStoreId}
                />
              </div>
            </section>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-sky-400/20 bg-slate-950/75 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            id="btn-reset-web-settings"
            onClick={() => {
              if (
                JSON.stringify(settings) === JSON.stringify(DEFAULT_USER_WEB_SETTINGS)
              ) {
                return;
              }
              onResetDefaults();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-slate-200 transition"
          >
            🔄 {isEn ? 'Reset to Default' : 'Reset ke Awal'}
          </button>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-emerald-300 font-semibold hidden sm:inline">
              {isEn ? 'Saved automatically in your browser' : 'Tersimpan otomatis di perangkat Anda'}
            </span>
            <button
              type="button"
              id="btn-save-close-web-settings"
              onClick={onClose}
              className="btn-gold px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold"
            >
              ✅ {isEn ? 'Done' : 'Selesai'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
