import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPwaBuilderLaunchUrl,
  evaluateStoreLaunchReadiness,
  generateAppleAppSiteAssociationJson,
  generateAssetLinksJson,
  generateCapacitorConfigJson,
  generateMicrosoftIdentityAssociationJson,
  generateMicrosoftStoreConfigJson,
  generateStorePublishingGuide,
  generateTwaManifestJson,
  OFFICIAL_DOMAIN,
  OFFICIAL_SITE_ORIGIN,
  OFFICIAL_STORE_URLS,
  resolveDirectStoreLinks,
  sanitizeAppleTeamId,
  sanitizeHttpsStoreUrl,
  sanitizeMicrosoftStoreId,
  sanitizePackageId,
  sanitizeSha256Fingerprint,
  sanitizeStoreDistributionSettings,
  sanitizeUuidGuid,
  STORE_DEVELOPER_CONSOLES,
} from './appStoreDistribution';

test('sanitizeHttpsStoreUrl strictly permits valid https store links', () => {
  assert.equal(
    sanitizeHttpsStoreUrl('https://play.google.com/store/apps/details?id=com.hafiz.app', ['play.google.com']),
    'https://play.google.com/store/apps/details?id=com.hafiz.app'
  );
  assert.equal(sanitizeHttpsStoreUrl('http://play.google.com/app', ['play.google.com']), '');
  assert.equal(sanitizeHttpsStoreUrl('https://evil.example.com/phish', ['play.google.com']), '');
  assert.equal(
    sanitizeHttpsStoreUrl('https://apps.apple.com/id/app/hafiz-edu/id123456', ['apps.apple.com']),
    'https://apps.apple.com/id/app/hafiz-edu/id123456'
  );
  assert.equal(
    sanitizeHttpsStoreUrl('https://apps.microsoft.com/detail/9NBLGGH5L9XT', ['apps.microsoft.com']),
    'https://apps.microsoft.com/detail/9NBLGGH5L9XT'
  );
});

test('sanitizePackageId, sanitizeAppleTeamId & sanitizeUuidGuid enforce strict store IDs', () => {
  assert.equal(sanitizePackageId('Com.HafizEdu.App'), 'com.hafizedu.app');
  assert.equal(sanitizePackageId('invalid'), 'com.hafizeducation.app');
  assert.equal(sanitizePackageId('com.test..bad'), 'com.hafizeducation.app');
  assert.equal(sanitizeAppleTeamId('ab12cd34ef'), 'AB12CD34EF');
  assert.equal(sanitizeAppleTeamId('SHORT'), '');
  assert.equal(
    sanitizeUuidGuid('A1B2C3D4-E5F6-4789-ABCD-0123456789EF'),
    'a1b2c3d4-e5f6-4789-abcd-0123456789ef'
  );
  assert.equal(sanitizeUuidGuid('not-a-guid'), '');
});

test('sanitizeMicrosoftStoreId validates Partner Center Product ID safely', () => {
  assert.equal(sanitizeMicrosoftStoreId('9NBLGGH5L9XT'), '9NBLGGH5L9XT');
  assert.equal(sanitizeMicrosoftStoreId('bad id!'), '');
});

test('sanitizeSha256Fingerprint normalizes raw hex and colon-separated SHA256', () => {
  const raw64 = 'a'.repeat(64);
  const formatted = sanitizeSha256Fingerprint(raw64);
  assert.equal(formatted.length, 95);
  assert.ok(formatted.startsWith('AA:AA:AA:'));
  assert.equal(sanitizeSha256Fingerprint('invalid-hash'), '');
});

test('generateAssetLinksJson, generateAppleAppSiteAssociationJson & generateMicrosoftIdentityAssociationJson emit valid verification configs', () => {
  const assetLinks = JSON.parse(
    generateAssetLinksJson('com.hafizeducation.app', ['11'.repeat(32)])
  );
  assert.equal(assetLinks[0].target.package_name, 'com.hafizeducation.app');
  assert.ok(assetLinks[0].target.sha256_cert_fingerprints[0].startsWith('11:11:'));

  const aasa = JSON.parse(
    generateAppleAppSiteAssociationJson('com.hafizeducation.app', 'ab12cd34ef')
  );
  assert.equal(aasa.applinks.details[0].appID, 'AB12CD34EF.com.hafizeducation.app');
  assert.equal(aasa.webcredentials.apps[0], 'AB12CD34EF.com.hafizeducation.app');

  const msIdentity = JSON.parse(
    generateMicrosoftIdentityAssociationJson('12345678-1234-1234-1234-1234567890ab')
  );
  assert.equal(
    msIdentity.associatedApplications[0].applicationId,
    '12345678-1234-1234-1234-1234567890ab'
  );

  const twa = JSON.parse(
    generateTwaManifestJson({
      origin: 'https://hafizedu.example.com',
      packageId: 'com.hafizeducation.app',
    })
  );
  assert.equal(twa.host, 'hafizedu.example.com');
  assert.equal(twa.packageId, 'com.hafizeducation.app');
  assert.equal(twa.display, 'standalone');
});

test('generateCapacitorConfigJson, generateMicrosoftStoreConfigJson & buildPwaBuilderLaunchUrl emit valid launch configs', () => {
  const cap = JSON.parse(
    generateCapacitorConfigJson({
      origin: 'https://hafizedu.example.com',
      iosBundleId: 'id.hafizedu.ios',
    })
  );
  assert.equal(cap.appId, 'id.hafizedu.ios');
  assert.equal(cap.server.url, 'https://hafizedu.example.com/');

  const ms = JSON.parse(
    generateMicrosoftStoreConfigJson({
      origin: 'https://hafizedu.example.com',
      microsoftStoreId: '9NBLGGH5L9XT',
      packageId: 'com.hafizeducation.app',
    })
  );
  assert.equal(ms.storeId, '9NBLGGH5L9XT');
  assert.equal(ms.manifestUrl, 'https://hafizedu.example.com/manifest.webmanifest');

  assert.equal(
    buildPwaBuilderLaunchUrl('https://hafizedu.example.com/'),
    'https://www.pwabuilder.com/?site=https%3A%2F%2Fhafizedu.example.com'
  );
  assert.equal(buildPwaBuilderLaunchUrl('http://localhost:3000'), STORE_DEVELOPER_CONSOLES.pwaBuilder);

  const guide = generateStorePublishingGuide({
    origin: 'https://hafizedu.example.com',
    androidPackageId: 'com.hafizeducation.app',
    iosBundleId: 'com.hafizeducation.app',
    appleTeamId: 'AB12CD34EF',
    microsoftStoreId: '9NBLGGH5L9XT',
  });
  assert.ok(guide.includes('MICROSOFT STORE'));
  assert.ok(guide.includes('AB12CD34EF'));
  assert.ok(guide.includes('9NBLGGH5L9XT'));
});

test('sanitizeStoreDistributionSettings cleans mixed inputs including Apple & Microsoft Store safely', () => {
  const clean = sanitizeStoreDistributionSettings({
    playStoreUrl: 'javascript:alert(1)',
    appStoreUrl: 'https://apps.apple.com/app/id999',
    microsoftStoreUrl: 'https://apps.microsoft.com/detail/9NBLGGH5L9XT',
    androidPackageId: 'com.hafiz.quiz',
    iosBundleId: 'bad',
    appleTeamId: 'team123456',
    microsoftStoreId: '9NBLGGH5L9XT',
    microsoftAppGuid: '12345678-1234-1234-1234-1234567890AB',
    androidSha256: 'zz',
  });
  assert.equal(clean.playStoreUrl, '');
  assert.equal(clean.appStoreUrl, 'https://apps.apple.com/app/id999');
  assert.equal(clean.microsoftStoreUrl, 'https://apps.microsoft.com/detail/9NBLGGH5L9XT');
  assert.equal(clean.androidPackageId, 'com.hafiz.quiz');
  assert.equal(clean.iosBundleId, 'com.hafizeducation.app');
  assert.equal(clean.appleTeamId, 'TEAM123456');
  assert.equal(clean.microsoftStoreId, '9NBLGGH5L9XT');
  assert.equal(clean.microsoftAppGuid, '12345678-1234-1234-1234-1234567890ab');
  assert.equal(clean.androidSha256, '');
});

test('evaluateStoreLaunchReadiness computes readiness across Play Store, App Store & Microsoft Store', () => {
  const readiness = evaluateStoreLaunchReadiness({
    origin: 'https://hafizedu.example.com',
    androidPackageId: 'com.hafizeducation.app',
    androidSha256: 'aa'.repeat(32),
    iosBundleId: 'com.hafizeducation.app',
    appleTeamId: 'AB12CD34EF',
    microsoftStoreId: '9NBLGGH5L9XT',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.hafizeducation.app',
  });
  assert.equal(readiness.length, 3);
  const [play, apple, ms] = readiness;
  assert.equal(play.isTechnicalReady, true);
  assert.equal(play.isVerifiedWithId, true);
  assert.equal(play.isLiveUrlPublished, true);
  assert.equal(apple.isVerifiedWithId, true);
  assert.equal(apple.isLiveUrlPublished, false);
  assert.equal(ms.isVerifiedWithId, true);
  assert.equal(ms.isLiveUrlPublished, true);
});

test('resolveDirectStoreLinks always connects to official Play Store, App Store & Microsoft Store', () => {
  const defaults = resolveDirectStoreLinks();
  assert.equal(defaults.playStoreUrl, OFFICIAL_STORE_URLS.playStore);
  assert.equal(defaults.appStoreUrl, OFFICIAL_STORE_URLS.appStore);
  assert.equal(defaults.microsoftStoreUrl, OFFICIAL_STORE_URLS.microsoftStore);
  assert.equal(defaults.isCustomPlayStore, false);
  assert.equal(defaults.isCustomAppStore, false);
  assert.equal(defaults.isCustomMicrosoftStore, false);

  const byMsId = resolveDirectStoreLinks({ microsoftStoreId: '9NBLGGH5L9XT' });
  assert.equal(byMsId.microsoftStoreUrl, 'https://apps.microsoft.com/detail/9NBLGGH5L9XT');
  assert.equal(byMsId.isCustomMicrosoftStore, true);

  const customAll = resolveDirectStoreLinks({
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.hafizeducation.app',
    appStoreUrl: 'https://apps.apple.com/id/app/id123456',
    microsoftStoreUrl: 'https://apps.microsoft.com/detail/9N999',
  });
  assert.equal(
    customAll.playStoreUrl,
    'https://play.google.com/store/apps/details?id=com.hafizeducation.app'
  );
  assert.equal(customAll.appStoreUrl, 'https://apps.apple.com/id/app/id123456');
  assert.equal(customAll.microsoftStoreUrl, 'https://apps.microsoft.com/detail/9N999');
  assert.equal(customAll.isCustomPlayStore, true);
  assert.equal(customAll.isCustomAppStore, true);
  assert.equal(customAll.isCustomMicrosoftStore, true);
});

test('store packagers default to hafizeducation.my.id domain when no custom origin is passed', () => {
  assert.equal(OFFICIAL_DOMAIN, 'hafizeducation.my.id');
  assert.equal(OFFICIAL_SITE_ORIGIN, 'https://hafizeducation.my.id');

  const twa = JSON.parse(generateTwaManifestJson({}));
  assert.equal(twa.host, 'hafizeducation.my.id');

  const cap = JSON.parse(generateCapacitorConfigJson({}));
  assert.equal(cap.server.url, 'https://hafizeducation.my.id');

  const ms = JSON.parse(generateMicrosoftStoreConfigJson({}));
  assert.equal(ms.manifestUrl, 'https://hafizeducation.my.id/manifest.webmanifest');
});
