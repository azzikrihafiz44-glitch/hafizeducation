import test from 'node:test';
import assert from 'node:assert/strict';
import {
  composeScheduleParts,
  decomposeScheduleParts,
  getDaysInMonth,
  getQuizScheduleStatus,
  parseOpenAtInput,
  toDateTimeLocalInput,
} from './quizSchedule.ts';

test('getQuizScheduleStatus returns unlocked when openAt is undefined or invalid', () => {
  const unset = getQuizScheduleStatus(undefined, Date.UTC(2026, 10, 10, 8, 0));
  assert.equal(unset.isLocked, false);
  assert.equal(unset.openTimestamp, null);

  const invalid = getQuizScheduleStatus('not-a-date', Date.UTC(2026, 10, 10, 8, 0));
  assert.equal(invalid.isLocked, false);
});

test('getQuizScheduleStatus locks quiz before openAt and unlocks on/after openAt', () => {
  const openIso = '2026-11-14T08:00:00.000Z';
  const before = getQuizScheduleStatus(openIso, Date.parse('2026-11-12T06:00:00.000Z'));
  assert.equal(before.isLocked, true);
  assert.equal(before.countdownLabel, '2 hari 2 jam lagi');
  assert.ok(before.formattedDate.length > 0);

  const atOpen = getQuizScheduleStatus(openIso, Date.parse('2026-11-14T08:00:00.000Z'));
  assert.equal(atOpen.isLocked, false);
  assert.equal(atOpen.countdownLabel, 'Sudah dibuka');
});

test('parseOpenAtInput and toDateTimeLocalInput round-trip valid local datetime values', () => {
  assert.equal(parseOpenAtInput(''), undefined);
  const iso = parseOpenAtInput('2026-11-14T09:30');
  assert.ok(iso && iso.endsWith('Z'));
  assert.equal(toDateTimeLocalInput(iso), '2026-11-14T09:30');
});

test('composeScheduleParts and decomposeScheduleParts handle day/month/year/hour/minute and leap years', () => {
  assert.equal(getDaysInMonth(2028, 2), 29);
  assert.equal(getDaysInMonth(2026, 2), 28);

  const clamped = composeScheduleParts({ year: 2026, month: 2, day: 31, hour: 14, minute: 45 });
  assert.equal(clamped, '2026-02-28T14:45');

  const parts = decomposeScheduleParts('2026-11-14T08:30');
  assert.deepEqual(parts, { year: 2026, month: 11, day: 14, hour: 8, minute: 30 });
});

test('getQuizScheduleStatus enforces closeAt deadline and marks quiz closed after closeAt', () => {
  const openIso = '2026-11-14T08:00:00.000Z';
  const closeIso = '2026-11-16T08:00:00.000Z';

  const duringWindow = getQuizScheduleStatus(
    openIso,
    Date.parse('2026-11-15T08:00:00.000Z'),
    closeIso
  );
  assert.equal(duringWindow.state, 'open');
  assert.equal(duringWindow.isLocked, false);
  assert.equal(duringWindow.isClosed, false);
  assert.ok(duringWindow.countdownLabel.includes('Tutup dalam 1 hari'));

  const afterClose = getQuizScheduleStatus(
    openIso,
    Date.parse('2026-11-16T08:00:00.000Z'),
    closeIso
  );
  assert.equal(afterClose.state, 'closed');
  assert.equal(afterClose.isLocked, true);
  assert.equal(afterClose.isClosed, true);
  assert.equal(afterClose.countdownLabel, 'Sudah ditutup');
});
