export type UserWebLanguage = 'id' | 'en';
export type UserWebTheme = 'dark' | 'light';
export type UserAccentTheme = 'cosmic' | 'emerald' | 'purple' | 'gold';
export type UserFontScale = 'compact' | 'normal' | 'large';
export type UserLayoutDensity = 'comfortable' | 'compact';
export type UserTargetTrack = 'utbk' | 'kedinasan' | 'both';

export interface UserWebSettings {
  language: UserWebLanguage;
  theme: UserWebTheme;
  accent: UserAccentTheme;
  fontScale: UserFontScale;
  layoutDensity: UserLayoutDensity;
  galaxyEffects: boolean;
  reducedMotion: boolean;
  highContrastCards: boolean;
  soundEffects: boolean;
  confettiEnabled: boolean;
  skipIntroSplash: boolean;
  defaultStudyTrack: UserTargetTrack;
}

export const STORAGE_KEY_USER_WEB_SETTINGS = 'hafiz_user_web_settings_v1';
export const STORAGE_KEY_LEGACY_THEME = 'hafiz_theme_v1';

export const DEFAULT_USER_WEB_SETTINGS: UserWebSettings = {
  language: 'id',
  theme: 'dark',
  accent: 'cosmic',
  fontScale: 'normal',
  layoutDensity: 'comfortable',
  galaxyEffects: true,
  reducedMotion: false,
  highContrastCards: false,
  soundEffects: true,
  confettiEnabled: true,
  skipIntroSplash: false,
  defaultStudyTrack: 'utbk',
};

export interface AccentThemeOption {
  id: UserAccentTheme;
  labelId: string;
  labelEn: string;
  descriptionId: string;
  descriptionEn: string;
  swatchClass: string;
}

export const USER_ACCENT_THEMES: AccentThemeOption[] = [
  {
    id: 'cosmic',
    labelId: 'Kosmik Biru',
    labelEn: 'Cosmic Blue',
    descriptionId: 'Biru langit, indigo & teal khas antariksa',
    descriptionEn: 'Sky blue, indigo & teal deep-space palette',
    swatchClass: 'from-sky-400 via-indigo-500 to-teal-400',
  },
  {
    id: 'emerald',
    labelId: 'Emerald Fokus',
    labelEn: 'Emerald Focus',
    descriptionId: 'Hijau zamrud segar untuk belajar tenang',
    descriptionEn: 'Fresh emerald & cyan tones for calm focus',
    swatchClass: 'from-emerald-400 via-teal-500 to-cyan-400',
  },
  {
    id: 'purple',
    labelId: 'Aurora Ungu',
    labelEn: 'Purple Aurora',
    descriptionId: 'Ungu violet elegan bernuansa kedinasan',
    descriptionEn: 'Royal purple & fuchsia aurora styling',
    swatchClass: 'from-purple-400 via-fuchsia-500 to-indigo-400',
  },
  {
    id: 'gold',
    labelId: 'Emas Juara',
    labelEn: 'Champion Gold',
    descriptionId: 'Aksen emas hangat penuh semangat prestasi',
    descriptionEn: 'Warm amber & gold energetic highlights',
    swatchClass: 'from-amber-400 via-orange-500 to-yellow-400',
  },
];

export interface LocalizedUiStrings {
  navHome: string;
  navPortal: string;
  navCampus: string;
  navKedinasan: string;
  navLiveTeaching: string;
  navAbout: string;
  navGuide: string;
  navSettings: string;
  themeDarkLabel: string;
  themeLightLabel: string;
  logoutLabel: string;
  heroQuickUtbk: string;
  heroQuickKedinasan: string;
  heroEnterRoomCta: string;
  backHome: string;
}

export const UI_TRANSLATIONS: Record<UserWebLanguage, LocalizedUiStrings> = {
  id: {
    navHome: 'Beranda',
    navPortal: 'Portal Belajar',
    navCampus: '🎯 Analisis Kampus',
    navKedinasan: 'Kedinasan',
    navLiveTeaching: 'Live Teaching',
    navAbout: 'Tentang',
    navGuide: 'Panduan',
    navSettings: 'Pengaturan',
    themeDarkLabel: '🌙 Gelap',
    themeLightLabel: '☀️ Terang',
    logoutLabel: '🚪 Keluar',
    heroQuickUtbk: '🎯 Analisis Kampus UTBK',
    heroQuickKedinasan: '🏛️ Analisis Kedinasan (SKD)',
    heroEnterRoomCta: '🚀 Masuk Lobi Kuis & Mulai Kuis',
    backHome: '← Beranda',
  },
  en: {
    navHome: 'Home',
    navPortal: 'Study Portal',
    navCampus: '🎯 Campus Match',
    navKedinasan: 'Civil Service',
    navLiveTeaching: 'Live Teaching',
    navAbout: 'About',
    navGuide: 'Guide',
    navSettings: 'Settings',
    themeDarkLabel: '🌙 Dark',
    themeLightLabel: '☀️ Light',
    logoutLabel: '🚪 Sign Out',
    heroQuickUtbk: '🎯 UTBK Campus Analyzer',
    heroQuickKedinasan: '🏛️ Kedinasan SKD Analyzer',
    heroEnterRoomCta: '🚀 Enter Quiz Lobby & Start Quiz',
    backHome: '← Home',
  },
};

export function sanitizeUserWebSettings(
  raw: Partial<UserWebSettings> | null | undefined,
  legacyTheme?: string | null
): UserWebSettings {
  const input = raw ?? {};
  const validLangs: UserWebLanguage[] = ['id', 'en'];
  const validThemes: UserWebTheme[] = ['dark', 'light'];
  const validAccents: UserAccentTheme[] = ['cosmic', 'emerald', 'purple', 'gold'];
  const validScales: UserFontScale[] = ['compact', 'normal', 'large'];
  const validDensities: UserLayoutDensity[] = ['comfortable', 'compact'];
  const validTracks: UserTargetTrack[] = ['utbk', 'kedinasan', 'both'];

  let theme: UserWebTheme = DEFAULT_USER_WEB_SETTINGS.theme;
  if (validThemes.includes(input.theme as UserWebTheme)) {
    theme = input.theme as UserWebTheme;
  } else if (legacyTheme === 'light' || legacyTheme === 'dark') {
    theme = legacyTheme;
  }

  return {
    language: validLangs.includes(input.language as UserWebLanguage)
      ? (input.language as UserWebLanguage)
      : DEFAULT_USER_WEB_SETTINGS.language,
    theme,
    accent: validAccents.includes(input.accent as UserAccentTheme)
      ? (input.accent as UserAccentTheme)
      : DEFAULT_USER_WEB_SETTINGS.accent,
    fontScale: validScales.includes(input.fontScale as UserFontScale)
      ? (input.fontScale as UserFontScale)
      : DEFAULT_USER_WEB_SETTINGS.fontScale,
    layoutDensity: validDensities.includes(input.layoutDensity as UserLayoutDensity)
      ? (input.layoutDensity as UserLayoutDensity)
      : DEFAULT_USER_WEB_SETTINGS.layoutDensity,
    galaxyEffects:
      typeof input.galaxyEffects === 'boolean'
        ? input.galaxyEffects
        : DEFAULT_USER_WEB_SETTINGS.galaxyEffects,
    reducedMotion:
      typeof input.reducedMotion === 'boolean'
        ? input.reducedMotion
        : DEFAULT_USER_WEB_SETTINGS.reducedMotion,
    highContrastCards:
      typeof input.highContrastCards === 'boolean'
        ? input.highContrastCards
        : DEFAULT_USER_WEB_SETTINGS.highContrastCards,
    soundEffects:
      typeof input.soundEffects === 'boolean'
        ? input.soundEffects
        : DEFAULT_USER_WEB_SETTINGS.soundEffects,
    confettiEnabled:
      typeof input.confettiEnabled === 'boolean'
        ? input.confettiEnabled
        : DEFAULT_USER_WEB_SETTINGS.confettiEnabled,
    skipIntroSplash:
      typeof input.skipIntroSplash === 'boolean'
        ? input.skipIntroSplash
        : DEFAULT_USER_WEB_SETTINGS.skipIntroSplash,
    defaultStudyTrack: validTracks.includes(input.defaultStudyTrack as UserTargetTrack)
      ? (input.defaultStudyTrack as UserTargetTrack)
      : DEFAULT_USER_WEB_SETTINGS.defaultStudyTrack,
  };
}

export function getFontScalePx(scale: UserFontScale): number {
  if (scale === 'compact') return 15;
  if (scale === 'large') return 17.5;
  return 16;
}

export function loadUserWebSettings(): UserWebSettings {
  try {
    const rawStr = localStorage.getItem(STORAGE_KEY_USER_WEB_SETTINGS);
    const legacyTheme = localStorage.getItem(STORAGE_KEY_LEGACY_THEME);
    if (!rawStr) {
      return sanitizeUserWebSettings(null, legacyTheme);
    }
    const parsed = JSON.parse(rawStr) as Partial<UserWebSettings>;
    return sanitizeUserWebSettings(parsed, legacyTheme);
  } catch {
    return { ...DEFAULT_USER_WEB_SETTINGS };
  }
}

export function saveUserWebSettings(settings: UserWebSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_USER_WEB_SETTINGS, JSON.stringify(settings));
    localStorage.setItem(STORAGE_KEY_LEGACY_THEME, settings.theme);
  } catch {
    // ignore storage quota
  }
}

export function applyUserWebSettingsToDom(settings: UserWebSettings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.lang = settings.language;
  root.setAttribute('data-theme', settings.theme);
  root.setAttribute('data-accent', settings.accent);
  root.setAttribute('data-contrast', settings.highContrastCards ? 'high' : 'glass');
  root.setAttribute('data-density', settings.layoutDensity);
  root.setAttribute('data-motion', settings.reducedMotion ? 'reduced' : 'full');
  root.style.fontSize = `${getFontScalePx(settings.fontScale)}px`;
}

/**
 * Normalize legacy Firestore copy that might still contain "Lobi 3D" or "Karakter 3D"
 * so all visitors consistently see "Lobi Kuis" and "Avatar".
 */
export function sanitizeLegacySiteCopy(text: string): string {
  return text
    .replace(/Lobi\s+Kampus\s+3D/gi, 'Lobi Kuis')
    .replace(/Lobi\s+Alien\s+3D/gi, 'Lobi Kuis')
    .replace(/Lobi\s+3D/gi, 'Lobi Kuis')
    .replace(/Arena\s+Kuis\s+3D/gi, 'Arena Kuis')
    .replace(/Karakter\s+Manusia\s+3D/g, 'Avatar')
    .replace(/karakter\s+manusia\s+3D/gi, 'avatar')
    .replace(/Karakter\s+3D/g, 'Avatar')
    .replace(/karakter\s+3D/gi, 'avatar')
    .replace(/Alien\s+3D/gi, 'Avatar')
    .replace(/Avatar\s+3D/gi, 'Avatar')
    .replace(/Kostum\s+3D/gi, 'Kostum Avatar');
}

