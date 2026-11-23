import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_USER_WEB_SETTINGS,
  UI_TRANSLATIONS,
  USER_ACCENT_THEMES,
  getFontScalePx,
  sanitizeLegacySiteCopy,
  sanitizeUserWebSettings,
} from './webSettings';

test('sanitizeUserWebSettings returns defaults for empty or invalid payloads', () => {
  const res = sanitizeUserWebSettings(null);
  assert.deepEqual(res, DEFAULT_USER_WEB_SETTINGS);

  const broken = sanitizeUserWebSettings({
    language: 'fr' as never,
    theme: 'neon' as never,
    accent: 'unknown' as never,
    fontScale: 'giant' as never,
    layoutDensity: 'huge' as never,
    galaxyEffects: 'yes' as never,
    soundEffects: false,
  });

  assert.equal(broken.language, 'id');
  assert.equal(broken.theme, 'dark');
  assert.equal(broken.accent, 'cosmic');
  assert.equal(broken.fontScale, 'normal');
  assert.equal(broken.layoutDensity, 'comfortable');
  assert.equal(broken.galaxyEffects, true);
  assert.equal(broken.soundEffects, false);
});

test('sanitizeUserWebSettings respects legacy theme fallback when settings object has no theme', () => {
  const res = sanitizeUserWebSettings({}, 'light');
  assert.equal(res.theme, 'light');
});

test('sanitizeUserWebSettings preserves valid user customizations', () => {
  const custom = sanitizeUserWebSettings({
    language: 'en',
    theme: 'light',
    accent: 'emerald',
    fontScale: 'large',
    layoutDensity: 'compact',
    galaxyEffects: false,
    reducedMotion: true,
    highContrastCards: true,
    soundEffects: false,
    confettiEnabled: false,
    skipIntroSplash: true,
    defaultStudyTrack: 'kedinasan',
  });

  assert.equal(custom.language, 'en');
  assert.equal(custom.theme, 'light');
  assert.equal(custom.accent, 'emerald');
  assert.equal(custom.fontScale, 'large');
  assert.equal(custom.layoutDensity, 'compact');
  assert.equal(custom.galaxyEffects, false);
  assert.equal(custom.reducedMotion, true);
  assert.equal(custom.highContrastCards, true);
  assert.equal(custom.soundEffects, false);
  assert.equal(custom.confettiEnabled, false);
  assert.equal(custom.skipIntroSplash, true);
  assert.equal(custom.defaultStudyTrack, 'kedinasan');
});

test('getFontScalePx and UI_TRANSLATIONS provide valid values for both ID and EN', () => {
  assert.equal(getFontScalePx('compact'), 15);
  assert.equal(getFontScalePx('normal'), 16);
  assert.equal(getFontScalePx('large'), 17.5);
  assert.equal(USER_ACCENT_THEMES.length, 4);
  assert.ok(UI_TRANSLATIONS.id.navSettings);
  assert.ok(UI_TRANSLATIONS.en.navSettings);
  assert.notEqual(UI_TRANSLATIONS.id.navHome, UI_TRANSLATIONS.en.navHome);
});

test('sanitizeLegacySiteCopy rewrites Lobi 3D and Karakter 3D copy to Lobi Kuis and Avatar', () => {
  assert.equal(
    sanitizeLegacySiteCopy('Lobi Kampus 3D Interaktif · Arena Kuis 3D Hafiz Education'),
    'Lobi Kuis Interaktif · Arena Kuis Hafiz Education'
  );
  assert.equal(
    sanitizeLegacySiteCopy('Dandani karakter manusia 3D kamu di Lobi 3D dan Karakter 3D!'),
    'Dandani avatar kamu di Lobi Kuis dan Avatar!'
  );
});

