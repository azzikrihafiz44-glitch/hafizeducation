import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatFirebaseAuthErrorIndonesian,
  normalizeParticipantUsername,
  sanitizeParticipantPhotoUrl,
  sanitizeParticipantProfileMeta,
  validateLoginForm,
  validatePasswordOnlyRegistration,
  validateRegistrationForm,
  validateUsernamePasswordLogin,
} from './participantAuth';

test('normalizeParticipantUsername and sanitizeParticipantPhotoUrl clean inputs safely', () => {
  assert.equal(normalizeParticipantUsername('  Budi Santoso!! '), 'budi.santoso');
  assert.equal(normalizeParticipantUsername('...Alya_123...'), 'alya_123');
  assert.equal(sanitizeParticipantPhotoUrl('/api/participant-photos/pimg-abc-123.jpg'), '/api/participant-photos/pimg-abc-123.jpg');
  assert.equal(sanitizeParticipantPhotoUrl('javascript:alert(1)'), '');
  assert.equal(sanitizeParticipantPhotoUrl('http://insecure.example.com/a.jpg'), '');
  assert.equal(sanitizeParticipantPhotoUrl('https://hafizeducation.my.id/img.png'), 'https://hafizeducation.my.id/img.png');
});

test('validatePasswordOnlyRegistration & validateUsernamePasswordLogin enforce non-Google account rules', () => {
  assert.equal(
    validatePasswordOnlyRegistration({
      displayName: 'A',
      password: 'secret',
      confirmPassword: 'secret',
    }).valid,
    false
  );
  assert.equal(
    validatePasswordOnlyRegistration({
      displayName: 'Budi Santoso',
      password: '123',
      confirmPassword: '123',
    }).valid,
    false
  );
  assert.equal(
    validatePasswordOnlyRegistration({
      displayName: 'Budi Santoso',
      password: 'password123',
      confirmPassword: 'wrong',
    }).valid,
    false
  );
  assert.equal(
    validatePasswordOnlyRegistration({
      displayName: 'Budi Santoso',
      username: 'budi.santoso',
      password: 'password123',
      confirmPassword: 'password123',
    }).valid,
    true
  );

  assert.equal(validateUsernamePasswordLogin({ identifier: 'a', password: 'password' }).valid, false);
  assert.equal(validateUsernamePasswordLogin({ identifier: 'budi.santoso', password: '12' }).valid, false);
  assert.equal(validateUsernamePasswordLogin({ identifier: 'Budi Santoso', password: 'password123' }).valid, true);
});

test('validateRegistrationForm validates name, email, password strength, and confirmation', () => {
  assert.equal(
    validateRegistrationForm({
      displayName: 'A',
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    }).valid,
    false
  );

  assert.equal(
    validateRegistrationForm({
      displayName: 'Budi Santoso',
      email: 'invalid-email',
      password: 'password123',
      confirmPassword: 'password123',
    }).valid,
    false
  );

  assert.equal(
    validateRegistrationForm({
      displayName: 'Budi Santoso',
      email: 'budi@example.com',
      password: 'password123',
      confirmPassword: 'mismatch',
    }).valid,
    false
  );

  assert.equal(
    validateRegistrationForm({
      displayName: 'Budi Santoso',
      email: 'budi@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    }).valid,
    true
  );
});

test('validateLoginForm checks email format and password length', () => {
  assert.equal(validateLoginForm({ email: 'bad', password: 'secret' }).valid, false);
  assert.equal(validateLoginForm({ email: 'a@b.com', password: '123' }).valid, false);
  assert.equal(validateLoginForm({ email: 'a@b.com', password: 'password123' }).valid, true);
});

test('sanitizeParticipantProfileMeta clamps lengths, tracks, authMethod, photoUrl, and SKD score ranges', () => {
  const sanitized = sanitizeParticipantProfileMeta({
    username: ' Budi Santoso ',
    photoUrl: '/api/participant-photos/pimg-123-abcd.png',
    school: '  MAN Insan Cendekia Jambi  ',
    phone: ' 081234567890 ',
    targetTrack: 'kedinasan',
    targetCampus: 'PKN STAN',
    authMethod: 'password',
    savedSkdSummary: {
      twk: 999,
      tiu: -20,
      tkp: 200,
      total: 420,
      passedAllPg: true,
      recommendedSchool: 'PKN STAN — D-IV Akuntansi',
    },
  });

  assert.equal(sanitized.username, 'budi.santoso');
  assert.equal(sanitized.photoUrl, '/api/participant-photos/pimg-123-abcd.png');
  assert.equal(sanitized.school, 'MAN Insan Cendekia Jambi');
  assert.equal(sanitized.phone, '081234567890');
  assert.equal(sanitized.targetTrack, 'kedinasan');
  assert.equal(sanitized.authMethod, 'password');
  assert.equal(sanitized.savedSkdSummary?.twk, 150);
  assert.equal(sanitized.savedSkdSummary?.tiu, 0);
  assert.equal(sanitized.savedSkdSummary?.tkp, 200);
  assert.equal(sanitized.savedSkdSummary?.passedAllPg, true);
});

test('formatFirebaseAuthErrorIndonesian returns helpful Indonesian messages', () => {
  assert.ok(
    formatFirebaseAuthErrorIndonesian(new Error('Firebase: Error (auth/email-already-in-use).')).includes(
      'sudah terdaftar'
    )
  );
  assert.ok(
    formatFirebaseAuthErrorIndonesian(new Error('auth/operation-not-allowed')).includes(
      'Nama + Kata Sandi'
    )
  );
});

