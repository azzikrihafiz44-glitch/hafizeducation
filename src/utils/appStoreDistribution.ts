export interface StoreDistributionSettings {
  playStoreUrl: string;
  appStoreUrl: string;
  microsoftStoreUrl: string;
  androidPackageId: string;
  iosBundleId: string;
  appleTeamId: string;
  microsoftStoreId: string;
  microsoftAppGuid: string;
  androidSha256: string;
}

export const OFFICIAL_DOMAIN = 'hafizeducation.my.id';
export const OFFICIAL_SITE_ORIGIN = `https://${OFFICIAL_DOMAIN}`;

export const OFFICIAL_STORE_URLS = {
  playStore: 'https://play.google.com/store/apps',
  appStore: 'https://apps.apple.com/',
  microsoftStore: 'https://apps.microsoft.com/',
} as const;

export const STORE_DEVELOPER_CONSOLES = {
  pwaBuilder: 'https://www.pwabuilder.com/',
  playConsole: 'https://play.google.com/console/',
  appStoreConnect: 'https://appstoreconnect.apple.com/',
  microsoftPartnerCenter: 'https://partner.microsoft.com/dashboard/windows/overview',
} as const;

export const DEFAULT_STORE_DISTRIBUTION: StoreDistributionSettings = {
  playStoreUrl: '',
  appStoreUrl: '',
  microsoftStoreUrl: '',
  androidPackageId: 'com.hafizeducation.app',
  iosBundleId: 'com.hafizeducation.app',
  appleTeamId: '',
  microsoftStoreId: '',
  microsoftAppGuid: '',
  androidSha256: '',
};

const REVERSE_DOMAIN_REGEX = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+){1,6}$/i;
const SHA256_COLON_REGEX = /^([0-9A-Fa-f]{2}:){31}[0-9A-Fa-f]{2}$/;
const MICROSOFT_STORE_ID_REGEX = /^[A-Z0-9._-]{6,80}$/i;
const APPLE_TEAM_ID_REGEX = /^[A-Z0-9]{10}$/;
const UUID_GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function sanitizeHttpsStoreUrl(raw: unknown, allowedHosts?: string[]): string {
  const val = typeof raw === 'string' ? raw.trim().slice(0, 400) : '';
  if (!val) return '';
  try {
    const url = new URL(val);
    if (url.protocol !== 'https:') return '';
    if (allowedHosts && allowedHosts.length > 0) {
      const host = url.hostname.toLowerCase();
      if (!allowedHosts.some((h) => host === h || host.endsWith(`.${h}`))) {
        return '';
      }
    }
    return url.toString();
  } catch {
    return '';
  }
}

export function sanitizePackageId(raw: unknown, fallback = 'com.hafizeducation.app'): string {
  const val = typeof raw === 'string' ? raw.trim().slice(0, 120) : '';
  if (!val || !REVERSE_DOMAIN_REGEX.test(val)) return fallback;
  return val.toLowerCase();
}

export function sanitizeMicrosoftStoreId(raw: unknown): string {
  const val = typeof raw === 'string' ? raw.trim().slice(0, 80) : '';
  if (!val || !MICROSOFT_STORE_ID_REGEX.test(val)) return '';
  return val;
}

export function sanitizeAppleTeamId(raw: unknown): string {
  const val = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  if (!val || !APPLE_TEAM_ID_REGEX.test(val)) return '';
  return val;
}

export function sanitizeUuidGuid(raw: unknown): string {
  const val = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!val || !UUID_GUID_REGEX.test(val)) return '';
  return val;
}

export function sanitizeSha256Fingerprint(raw: unknown): string {
  const val = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  if (!val) return '';
  if (SHA256_COLON_REGEX.test(val)) return val;
  const hexOnly = val.replace(/[^0-9A-F]/g, '');
  if (hexOnly.length === 64) {
    return hexOnly.match(/.{2}/g)!.join(':');
  }
  return '';
}

export function sanitizeStoreDistributionSettings(
  input?: Partial<StoreDistributionSettings>
): StoreDistributionSettings {
  return {
    playStoreUrl: sanitizeHttpsStoreUrl(input?.playStoreUrl, ['play.google.com']),
    appStoreUrl: sanitizeHttpsStoreUrl(input?.appStoreUrl, ['apps.apple.com', 'itunes.apple.com']),
    microsoftStoreUrl: sanitizeHttpsStoreUrl(input?.microsoftStoreUrl, [
      'apps.microsoft.com',
      'www.microsoft.com',
      'microsoft.com',
    ]),
    androidPackageId: sanitizePackageId(input?.androidPackageId, DEFAULT_STORE_DISTRIBUTION.androidPackageId),
    iosBundleId: sanitizePackageId(input?.iosBundleId, DEFAULT_STORE_DISTRIBUTION.iosBundleId),
    appleTeamId: sanitizeAppleTeamId(input?.appleTeamId),
    microsoftStoreId: sanitizeMicrosoftStoreId(input?.microsoftStoreId),
    microsoftAppGuid: sanitizeUuidGuid(input?.microsoftAppGuid),
    androidSha256: sanitizeSha256Fingerprint(input?.androidSha256),
  };
}

export function resolveDirectStoreLinks(input?: {
  playStoreUrl?: string;
  appStoreUrl?: string;
  microsoftStoreUrl?: string;
  microsoftStoreId?: string;
}): {
  playStoreUrl: string;
  appStoreUrl: string;
  microsoftStoreUrl: string;
  isCustomPlayStore: boolean;
  isCustomAppStore: boolean;
  isCustomMicrosoftStore: boolean;
} {
  const customPlay = sanitizeHttpsStoreUrl(input?.playStoreUrl, ['play.google.com']);
  const customApp = sanitizeHttpsStoreUrl(input?.appStoreUrl, [
    'apps.apple.com',
    'itunes.apple.com',
  ]);
  const customMs = sanitizeHttpsStoreUrl(input?.microsoftStoreUrl, [
    'apps.microsoft.com',
    'www.microsoft.com',
    'microsoft.com',
  ]);
  const validMsId = sanitizeMicrosoftStoreId(input?.microsoftStoreId);

  return {
    playStoreUrl: customPlay || OFFICIAL_STORE_URLS.playStore,
    appStoreUrl: customApp || OFFICIAL_STORE_URLS.appStore,
    microsoftStoreUrl:
      customMs ||
      (validMsId
        ? `https://apps.microsoft.com/detail/${encodeURIComponent(validMsId)}`
        : OFFICIAL_STORE_URLS.microsoftStore),
    isCustomPlayStore: Boolean(customPlay),
    isCustomAppStore: Boolean(customApp),
    isCustomMicrosoftStore: Boolean(customMs || validMsId),
  };
}

export function buildPwaBuilderLaunchUrl(origin: string): string {
  const cleanOrigin = sanitizeHttpsStoreUrl(origin);
  if (!cleanOrigin) return STORE_DEVELOPER_CONSOLES.pwaBuilder;
  return `https://www.pwabuilder.com/?site=${encodeURIComponent(cleanOrigin.replace(/\/$/, ''))}`;
}

export function generateAssetLinksJson(
  androidPackageId: string,
  sha256Fingerprints: string[] = []
): string {
  const cleanPkg = sanitizePackageId(androidPackageId);
  const validFingerprints = sha256Fingerprints
    .map((fp) => sanitizeSha256Fingerprint(fp))
    .filter(Boolean);

  const payload = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: cleanPkg,
        sha256_cert_fingerprints:
          validFingerprints.length > 0
            ? validFingerprints
            : ['00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00'],
      },
    },
  ];
  return JSON.stringify(payload, null, 2);
}

export function generateAppleAppSiteAssociationJson(
  iosBundleId: string,
  appleTeamId?: string
): string {
  const bundle = sanitizePackageId(iosBundleId);
  const team = sanitizeAppleTeamId(appleTeamId) || 'TEAMID1234';
  const fullAppId = `${team}.${bundle}`;
  return JSON.stringify(
    {
      applinks: {
        apps: [],
        details: [
          {
            appID: fullAppId,
            paths: ['/', '/?*'],
          },
        ],
      },
      webcredentials: {
        apps: [fullAppId],
      },
    },
    null,
    2
  );
}

export function generateMicrosoftIdentityAssociationJson(applicationId?: string): string {
  const guid = sanitizeUuidGuid(applicationId) || '00000000-0000-0000-0000-000000000000';
  return JSON.stringify(
    {
      associatedApplications: [
        {
          applicationId: guid,
        },
      ],
    },
    null,
    2
  );
}

export interface StoreLaunchReadinessItem {
  id: 'playStore' | 'appStore' | 'microsoftStore';
  storeName: string;
  packageFormat: string;
  endpointPath: string;
  consoleUrl: string;
  isTechnicalReady: boolean;
  isVerifiedWithId: boolean;
  isLiveUrlPublished: boolean;
  nextStepId: string;
}

export function evaluateStoreLaunchReadiness(
  input: Partial<StoreDistributionSettings> & { origin?: string }
): StoreLaunchReadinessItem[] {
  const clean = sanitizeStoreDistributionSettings(input);
  const isHttpsOrigin = Boolean(sanitizeHttpsStoreUrl(input.origin));
  const links = resolveDirectStoreLinks(clean);

  return [
    {
      id: 'playStore',
      storeName: 'Google Play Store',
      packageFormat: '.AAB (Trusted Web Activity)',
      endpointPath: '/.well-known/assetlinks.json',
      consoleUrl: STORE_DEVELOPER_CONSOLES.playConsole,
      isTechnicalReady: Boolean(clean.androidPackageId) && isHttpsOrigin,
      isVerifiedWithId: Boolean(clean.androidSha256),
      isLiveUrlPublished: links.isCustomPlayStore,
      nextStepId: !isHttpsOrigin
        ? 'Deploy ke HTTPS publik lalu buka PWABuilder'
        : links.isCustomPlayStore
          ? 'Sudah terhubung ke halaman Google Play resmi'
          : clean.androidSha256
            ? 'Unggah .AAB ke Play Console lalu tempel link Play Store'
            : 'Buat .AAB di PWABuilder & isi SHA-256 Play Console',
    },
    {
      id: 'appStore',
      storeName: 'Apple App Store',
      packageFormat: '.IPA (Capacitor / PWABuilder iOS)',
      endpointPath: '/.well-known/apple-app-site-association',
      consoleUrl: STORE_DEVELOPER_CONSOLES.appStoreConnect,
      isTechnicalReady: Boolean(clean.iosBundleId) && isHttpsOrigin,
      isVerifiedWithId: Boolean(clean.appleTeamId),
      isLiveUrlPublished: links.isCustomAppStore,
      nextStepId: !isHttpsOrigin
        ? 'Deploy ke HTTPS publik untuk verifikasi Universal Links'
        : links.isCustomAppStore
          ? 'Sudah terhubung ke halaman App Store resmi'
          : 'Build .IPA via Xcode / PWABuilder iOS & unggah di App Store Connect',
    },
    {
      id: 'microsoftStore',
      storeName: 'Microsoft Store',
      packageFormat: '.MSIX (Windows 10/11 PWA)',
      endpointPath: '/.well-known/microsoft-identity-association.json',
      consoleUrl: STORE_DEVELOPER_CONSOLES.microsoftPartnerCenter,
      isTechnicalReady: Boolean(clean.androidPackageId) && isHttpsOrigin,
      isVerifiedWithId: Boolean(clean.microsoftStoreId || clean.microsoftAppGuid),
      isLiveUrlPublished: links.isCustomMicrosoftStore,
      nextStepId: !isHttpsOrigin
        ? 'Deploy ke HTTPS publik untuk paket .MSIX PWABuilder'
        : links.isCustomMicrosoftStore
          ? 'Sudah terhubung ke halaman Microsoft Store resmi'
          : 'Buat paket .MSIX di PWABuilder & unggah ke Partner Center',
    },
  ];
}

export function generateTwaManifestJson(params: {
  origin?: string;
  brandName?: string;
  shortName?: string;
  packageId?: string;
}): string {
  let host: string = OFFICIAL_DOMAIN;
  const rawOrigin = (params.origin || '').trim();
  if (rawOrigin) {
    try {
      host = new URL(rawOrigin).host || host;
    } catch {
      host = rawOrigin.replace(/^https?:\/\//, '').split('/')[0] || host;
    }
  }

  const pkg = sanitizePackageId(params.packageId);
  const manifest = {
    packageId: pkg,
    host,
    name: (params.brandName || 'Hafiz Education').trim().slice(0, 50),
    launcherName: (params.shortName || 'HafizEdu').trim().slice(0, 12),
    display: 'standalone',
    themeColor: '#0B1120',
    navigationColor: '#0B1120',
    backgroundColor: '#0B1120',
    enableNotifications: true,
    startUrl: '/',
    iconUrl: `https://${host}/pwa-512x512.png`,
    maskableIconUrl: `https://${host}/pwa-maskable-512x512.png`,
    splashScreenFadeOutDuration: 300,
    signingKey: {
      path: './android.keystore',
      alias: 'hafizedu',
    },
    appVersionName: '1.0.0',
    appVersionCode: 1,
    fallbackType: 'customtabs',
    enableSiteSettingsShortcut: true,
    isChromeOSOnly: false,
    orientation: 'default',
  };
  return JSON.stringify(manifest, null, 2);
}

export function generateCapacitorConfigJson(params: {
  origin?: string;
  brandName?: string;
  iosBundleId?: string;
}): string {
  const cleanOrigin = sanitizeHttpsStoreUrl(params.origin) || OFFICIAL_SITE_ORIGIN;
  const appId = sanitizePackageId(params.iosBundleId);
  return JSON.stringify(
    {
      appId,
      appName: (params.brandName || 'Hafiz Education').trim().slice(0, 50),
      webDir: 'dist',
      server: {
        url: cleanOrigin,
        cleartext: false,
        androidScheme: 'https',
      },
      ios: {
        contentInset: 'automatic',
        allowsLinkPreview: false,
      },
      android: {
        allowMixedContent: false,
      },
    },
    null,
    2
  );
}

export function generateMicrosoftStoreConfigJson(params: {
  origin?: string;
  brandName?: string;
  publisherDisplayName?: string;
  microsoftStoreId?: string;
  packageId?: string;
}): string {
  const cleanOrigin = sanitizeHttpsStoreUrl(params.origin) || OFFICIAL_SITE_ORIGIN;
  const storeId = sanitizeMicrosoftStoreId(params.microsoftStoreId);
  const pkg = sanitizePackageId(params.packageId);
  return JSON.stringify(
    {
      packageId: pkg,
      storeId: storeId || 'ISI_STORE_ID_DARI_PARTNER_CENTER',
      name: (params.brandName || 'Hafiz Education').trim().slice(0, 50),
      publisherDisplayName: (params.publisherDisplayName || 'Hafiz Education').trim().slice(0, 80),
      startUrl: cleanOrigin,
      version: '1.0.0.0',
      classicPackage: false,
      edgeHtmlVersion: false,
      targetDeviceFamilies: ['Windows.Desktop', 'Windows.Universal'],
      manifestUrl: `${cleanOrigin.replace(/\/$/, '')}/manifest.webmanifest`,
      iconUrl: `${cleanOrigin.replace(/\/$/, '')}/pwa-512x512.png`,
    },
    null,
    2
  );
}

export function generateStorePublishingGuide(params: {
  origin: string;
  androidPackageId: string;
  iosBundleId: string;
  appleTeamId?: string;
  microsoftStoreId?: string;
}): string {
  const pkg = sanitizePackageId(params.androidPackageId);
  const iosId = sanitizePackageId(params.iosBundleId);
  const teamId = sanitizeAppleTeamId(params.appleTeamId) || '(diambil dari Apple Developer Membership)';
  const msId = sanitizeMicrosoftStoreId(params.microsoftStoreId) || '(diambil dari Microsoft Partner Center)';
  return [
    'PANDUAN LAUNCHING RESMI HAFIZ EDUCATION KE PLAY STORE, APP STORE & MICROSOFT STORE',
    '=====================================================================================',
    `URL Web Produksi   : ${params.origin}`,
    `PWABuilder 1-Klik  : ${buildPwaBuilderLaunchUrl(params.origin)}`,
    `Android Package    : ${pkg}`,
    `iOS Bundle ID      : ${iosId} (Apple Team ID: ${teamId})`,
    `Microsoft Store ID : ${msId}`,
    '',
    '1. GOOGLE PLAY STORE (Android App Bundle .AAB via Bubblewrap / PWABuilder):',
    `   - Buka ${buildPwaBuilderLaunchUrl(params.origin)}`,
    '   - Pilih "Package for Stores" -> "Android" (Google Play), isi Package ID & gunakan twa-manifest.json.',
    '   - Unduh file .aab -> unggah ke Google Play Console (https://play.google.com/console).',
    '   - Salin SHA-256 fingerprint dari Play Console ke Studio Admin agar /.well-known/assetlinks.json aktif otomatis.',
    '',
    '2. APPLE APP STORE (iOS .IPA via PWABuilder iOS atau Capacitor + Xcode):',
    '   - Gunakan macOS + Xcode 15+ atau opsi iOS di PWABuilder:',
    '       npm install @capacitor/core @capacitor/cli @capacitor/ios',
    '       npx cap add ios && npx cap sync ios && npx cap open ios',
    '   - Masukkan Apple Team ID di Studio Admin agar /.well-known/apple-app-site-association terverifikasi.',
    '   - Pilih Signing Team Apple Developer -> Archive -> Unggah ke App Store Connect (https://appstoreconnect.apple.com).',
    '',
    '3. MICROSOFT STORE (Windows 10/11 App Package .MSIX via PWABuilder):',
    '   - Masuk ke Microsoft Partner Center: https://partner.microsoft.com/dashboard/windows/overview',
    `   - Buka ${buildPwaBuilderLaunchUrl(params.origin)} -> pilih "Package for Stores" -> "Windows" (Microsoft Store).`,
    '   - Masukkan Package ID, Publisher ID, dan Publisher Display Name dari Partner Center (lihat microsoft-store-config.json).',
    '   - Unduh file .msixbundle lalu unggah di Partner Center untuk rilis resmi ke Microsoft Store Windows 10/11.',
    '',
    '4. HUBUNGKAN LINK STORE KE WEBSITE:',
    '   - Setelah disetujui Play Store, App Store & Microsoft Store, tempel URL resmi masing-masing di Studio Admin.',
    '   - Tombol "Google Play ↗", "App Store ↗", & "Microsoft Store ↗" otomatis mengarahkan seluruh pengguna ke halaman unduhan resmi!',
    '',
  ].join('\n');
}
