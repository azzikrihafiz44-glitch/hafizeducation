import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_MISSIONS_BONUS_XP,
  DAILY_MISSION_SLOTS,
  MAX_DAILY_REROLLS,
  claimAllMissionsBonus,
  claimMissionReward,
  createDailyMissionState,
  formatTimeUntilMidnight,
  incrementManualMissionProgress,
  rerollUnclaimedMissions,
  resolveDailyMissions,
  selectDailyMissionIds,
  swapSingleMission,
  syncStateForDate,
} from './dailyMissions';

test('selectDailyMissionIds returns 4 unique balanced missions and rotates across dates', () => {
  const day1 = selectDailyMissionIds('2026-11-19', 0);
  const day2 = selectDailyMissionIds('2026-11-20', 0);
  const day3 = selectDailyMissionIds('2026-11-21', 0);

  assert.equal(day1.length, DAILY_MISSION_SLOTS);
  assert.equal(new Set(day1).size, DAILY_MISSION_SLOTS);
  assert.deepEqual(day1, selectDailyMissionIds('2026-11-19', 0)); // deterministic

  // Across multiple days, at least one day produces a different mission set
  const differentAcrossDays =
    JSON.stringify(day1) !== JSON.stringify(day2) ||
    JSON.stringify(day1) !== JSON.stringify(day3);
  assert.equal(differentAcrossDays, true);
});

test('swapSingleMission replaces an unclaimed mission and decrements rerolls', () => {
  const initial = createDailyMissionState('2026-11-19');
  const firstId = initial.activeMissionIds[0];

  const swapped = swapSingleMission(initial, firstId);
  assert.equal(swapped.rerollsRemaining, MAX_DAILY_REROLLS - 1);
  assert.notEqual(swapped.activeMissionIds[0], firstId);
  assert.equal(new Set(swapped.activeMissionIds).size, DAILY_MISSION_SLOTS);
});

test('rerollUnclaimedMissions preserves claimed missions and rotates unclaimed ones', () => {
  let state = createDailyMissionState('2026-11-19');
  // Force a portal visit so eksplorasi-portal or another mission can be claimed
  state = {
    ...state,
    activeMissionIds: ['focus-1', 'quiz-1', 'materi-rangkum', 'eksplorasi-portal'],
    portalVisitsToday: 1,
  };
  const claimed = claimMissionReward(state, 'eksplorasi-portal', {
    quizzesToday: 0,
    highScoreQuizzesToday: 0,
  });
  assert.equal(claimed.xpAwarded, 35);

  const rerolled = rerollUnclaimedMissions(claimed.state);
  assert.equal(rerolled.rerollsRemaining, MAX_DAILY_REROLLS - 1);
  assert.equal(rerolled.activeMissionIds[3], 'eksplorasi-portal');
  assert.equal(new Set(rerolled.activeMissionIds).size, DAILY_MISSION_SLOTS);
  // At least one unclaimed mission changed
  const changedCount = [0, 1, 2].filter(
    (idx) => rerolled.activeMissionIds[idx] !== claimed.state.activeMissionIds[idx]
  ).length;
  assert.ok(changedCount >= 1);
});

test('manual progress, auto tracking, reward claiming, streak, and all-complete bonus work end-to-end', () => {
  let state = createDailyMissionState('2026-11-19');
  state = {
    ...state,
    activeMissionIds: ['focus-1', 'quiz-1', 'materi-rumus', 'eksplorasi-portal'],
    focusSessionsToday: 1,
    portalVisitsToday: 1,
  };

  // Increment manual mission 3 times
  state = incrementManualMissionProgress(state, 'materi-rumus');
  state = incrementManualMissionProgress(state, 'materi-rumus');
  let resolved = resolveDailyMissions(state, { quizzesToday: 1, highScoreQuizzesToday: 0 });
  const materiBefore = resolved.find((m) => m.id === 'materi-rumus')!;
  assert.equal(materiBefore.progress, 2);
  assert.equal(materiBefore.isCompleted, false);

  state = incrementManualMissionProgress(state, 'materi-rumus');
  resolved = resolveDailyMissions(state, { quizzesToday: 1, highScoreQuizzesToday: 0 });
  assert.equal(resolved.every((m) => m.isCompleted), true);

  const activity = { quizzesToday: 1, highScoreQuizzesToday: 0 };
  for (const id of state.activeMissionIds) {
    const res = claimMissionReward(state, id, activity);
    assert.ok(res.xpAwarded > 0);
    state = res.state;
  }
  assert.equal(state.streakDays, 1);
  assert.equal(state.lastCompletedDate, '2026-11-19');

  const bonus = claimAllMissionsBonus(state, activity);
  assert.equal(bonus.xpAwarded, ALL_MISSIONS_BONUS_XP);
  assert.equal(bonus.state.bonusClaimed, true);

  // Syncing to next day preserves streak and resets daily missions
  const nextDay = syncStateForDate(bonus.state, '2026-11-20');
  assert.equal(nextDay.date, '2026-11-20');
  assert.equal(nextDay.streakDays, 1);
  assert.equal(nextDay.claimedIds.length, 0);
  assert.equal(nextDay.rerollsRemaining, MAX_DAILY_REROLLS);
  assert.equal(nextDay.totalClaimedXp, bonus.state.totalClaimedXp);
});

test('formatTimeUntilMidnight returns valid HHj MMm countdown', () => {
  const sample = new Date(2026, 10, 19, 18, 30, 0);
  assert.equal(formatTimeUntilMidnight(sample), '05j 30m');
});
