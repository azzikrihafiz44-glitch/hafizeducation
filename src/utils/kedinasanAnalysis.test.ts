import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KEDINASAN_PROGRAMS,
  analyzeKedinasanMatches,
  calculateKedinasanSkdSummary,
  estimateKedinasanFromGrade,
  estimateKedinasanFromHistory,
  pickStrategicKedinasanChoices,
  sanitizeAllKedinasanScores,
} from './kedinasanAnalysis';

test('calculateKedinasanSkdSummary sums TWK, TIU, TKP and validates passing grades', () => {
  const summary = calculateKedinasanSkdSummary({ twk: 110, tiu: 135, tkp: 195 });
  assert.equal(summary.totalScore, 440);
  assert.equal(summary.passedAllPg, true);
  assert.equal(summary.failedPgList.length, 0);

  // Even high total fails PG if TWK < 65
  const failedPg = calculateKedinasanSkdSummary({ twk: 60, tiu: 165, tkp: 215 });
  assert.equal(failedPg.totalScore, 440);
  assert.equal(failedPg.passedTwk, false);
  assert.equal(failedPg.passedAllPg, false);
  assert.equal(failedPg.failedPgList[0]?.code, 'TWK');
  assert.equal(failedPg.failedPgList[0]?.deficit, 5);
});

test('sanitizeAllKedinasanScores enforces exact subtest ceilings (150, 175, 225)', () => {
  const clean = sanitizeAllKedinasanScores({ twk: 200, tiu: -10, tkp: 300 });
  assert.deepEqual(clean, { twk: 150, tiu: 0, tkp: 225 });
});

test('analyzeKedinasanMatches blocks aman/kompetitif status when PG fails and classifies accurately when PG passes', () => {
  const blockedMatches = analyzeKedinasanMatches(
    { twk: 55, tiu: 170, tkp: 215 },
    KEDINASAN_PROGRAMS
  );
  assert.ok(blockedMatches.every((m) => m.fitStatus === 'tantangan' && m.blockedByPg));

  const highMatches = analyzeKedinasanMatches(
    { twk: 120, tiu: 150, tkp: 195 }, // 465 total
    KEDINASAN_PROGRAMS,
    { agency: 'PKN STAN' }
  );
  assert.equal(highMatches.length, 3);
  assert.ok(highMatches.every((m) => m.fitStatus === 'aman'));
});

test('pickStrategicKedinasanChoices selects distinct Pilihan 1 and Pilihan 2', () => {
  const matches = analyzeKedinasanMatches(
    { twk: 100, tiu: 120, tkp: 185 }, // 405 total
    KEDINASAN_PROGRAMS
  );
  const { pilihan1, pilihan2 } = pickStrategicKedinasanChoices(matches);
  assert.ok(pilihan1);
  assert.ok(pilihan2);
  assert.notEqual(pilihan1.program.id, pilihan2.program.id);
});

test('estimateKedinasanFromHistory prioritizes SKD/Kedinasan history records', () => {
  const fromGrade = estimateKedinasanFromGrade(80);
  const summary = calculateKedinasanSkdSummary(fromGrade);
  assert.ok(summary.passedAllPg);
  assert.ok(summary.totalScore >= 400);

  const hist = estimateKedinasanFromHistory([
    {
      id: '1',
      timestamp: new Date().toISOString(),
      roomCode: 'SKD01',
      quizTitle: 'Try Out SKD Kedinasan STAN',
      playerName: 'Peserta',
      grade: 85,
      points: 850,
      correctCount: 17,
      totalQuestions: 20,
      rank: 1,
      certificateId: 'C1',
    },
  ]);
  assert.ok(hist);
  assert.ok(calculateKedinasanSkdSummary(hist).passedAllPg);
});
