import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAstronautRank, formatCountdownMMSS } from './astronautRank';

test('calculateAstronautRank starts at Level 1 Kadet Antariksa with 0 activity', () => {
  const rank = calculateAstronautRank(0, 0, 0, 0);
  assert.equal(rank.level, 1);
  assert.equal(rank.title, 'Kadet Antariksa');
  assert.equal(rank.xp, 0);
  assert.equal(rank.progressPercent, 0);
});

test('calculateAstronautRank upgrades tiers accurately across quizzes, focus sessions, and missions', () => {
  const navigator = calculateAstronautRank(1, 500, 1, 1); // 120 + 50 + 100 + 40 = 310 XP
  assert.equal(navigator.level, 2);
  assert.equal(navigator.title, 'Navigator Bintang');
  assert.equal(navigator.xp, 310);

  const admiral = calculateAstronautRank(10, 8000, 5, 4); // 1200 + 800 + 500 + 160 = 2660 XP
  assert.equal(admiral.level, 5);
  assert.equal(admiral.title, 'Laksamana Kosmik');
  assert.equal(admiral.progressPercent, 100);
});

test('formatCountdownMMSS formats seconds cleanly with zero padding', () => {
  assert.equal(formatCountdownMMSS(1500), '25:00');
  assert.equal(formatCountdownMMSS(65), '01:05');
  assert.equal(formatCountdownMMSS(0), '00:00');
  assert.equal(formatCountdownMMSS(-10), '00:00');
});
