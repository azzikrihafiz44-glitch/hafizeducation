import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAMPUS_PROGRAMS,
  analyzeCampusMatches,
  calculateUtbkScoreSummary,
  estimateSubtestsFromGrade,
  estimateSubtestsFromHistory,
  pickStrategicChoices,
  sanitizeAllSubtestScores,
  type UtbkSubtestScores,
} from './utbkCampusAnalysis';

test('calculateUtbkScoreSummary sums all 7 UTBK subtests accurately', () => {
  const scores: UtbkSubtestScores = {
    pu: 700,
    ppu: 650,
    pbm: 680,
    pk: 710,
    lbi: 720,
    lbe: 690,
    pm: 750,
  };
  const summary = calculateUtbkScoreSummary(scores);

  assert.equal(summary.tpsTotal, 700 + 650 + 680 + 710);
  assert.equal(summary.literasiTotal, 720 + 690 + 750);
  assert.equal(summary.totalScore, 4900);
  assert.equal(summary.averageScore, 700);
  assert.equal(summary.strongestSubtest.key, 'pm');
  assert.equal(summary.weakestSubtest.key, 'ppu');
});

test('sanitizeAllSubtestScores clamps out-of-range and non-finite inputs', () => {
  const sanitized = sanitizeAllSubtestScores({
    pu: 1250,
    ppu: -40,
    pbm: Number.NaN,
    pk: 605.6,
    lbi: 0,
    lbe: 1000,
    pm: 450.2,
  });

  assert.deepEqual(sanitized, {
    pu: 1000,
    ppu: 0,
    pbm: 0,
    pk: 606,
    lbi: 0,
    lbe: 1000,
    pm: 450,
  });
});

test('analyzeCampusMatches classifies programs based on summed 7-subtest score', () => {
  const highScores: UtbkSubtestScores = {
    pu: 780,
    ppu: 760,
    pbm: 770,
    pk: 780,
    lbi: 790,
    lbe: 760,
    pm: 800,
  }; // Total = 5440
  const matches = analyzeCampusMatches(highScores, CAMPUS_PROGRAMS, { rumpun: 'Saintek' });
  const fkUi = matches.find((m) => m.program.id === 'ui-fk');
  assert.ok(fkUi, 'Expected Kedokteran UI in Saintek results');
  assert.equal(fkUi.scoreDiff, 5440 - 5390);
  assert.equal(fkUi.fitStatus, 'kompetitif');

  const ipbStat = matches.find((m) => m.program.id === 'ipb-statistika');
  assert.ok(ipbStat);
  assert.equal(ipbStat.fitStatus, 'aman');
  assert.equal(ipbStat.neededPointsTotal, 0);
});

test('analyzeCampusMatches computes needed points accurately for challenging targets', () => {
  const midScores: UtbkSubtestScores = {
    pu: 550,
    ppu: 550,
    pbm: 550,
    pk: 550,
    lbi: 550,
    lbe: 550,
    pm: 550,
  }; // Total = 3850
  const matches = analyzeCampusMatches(midScores, CAMPUS_PROGRAMS, {
    searchQuery: 'STEI',
  });
  assert.equal(matches.length, 1);
  assert.equal(matches[0].fitStatus, 'tantangan');
  assert.equal(matches[0].neededPointsTotal, 5250 - 3850);
  assert.equal(matches[0].neededPointsPerSubtest, 200);
});

test('pickStrategicChoices recommends distinct Pilihan 1 and Pilihan 2', () => {
  const scores: UtbkSubtestScores = {
    pu: 660,
    ppu: 640,
    pbm: 650,
    pk: 640,
    lbi: 670,
    lbe: 650,
    pm: 660,
  }; // Total = 4570
  const matches = analyzeCampusMatches(scores, CAMPUS_PROGRAMS, { rumpun: 'Saintek' });
  const { pilihan1, pilihan2 } = pickStrategicChoices(matches);

  assert.ok(pilihan1);
  assert.ok(pilihan2);
  assert.notEqual(pilihan1.program.id, pilihan2.program.id);
});

import {
  ALL_INDONESIA_CAMPUS_PROGRAMS,
  INDONESIA_REGIONS,
  INDONESIA_UNIVERSITIES,
} from '../data/indonesiaUniversities';

test('estimateSubtestsFromHistory prefers UTBK records when available', () => {
  const estFromGrade = estimateSubtestsFromGrade(80);
  const estSummary = calculateUtbkScoreSummary(estFromGrade);
  assert.ok(estSummary.totalScore > 4800 && estSummary.totalScore < 5500);

  const histEst = estimateSubtestsFromHistory([
    {
      id: 'h1',
      timestamp: new Date().toISOString(),
      roomCode: 'ASAS1',
      quizTitle: 'ASAS XII Biologi',
      playerName: 'Siswa',
      grade: 50,
      points: 500,
      correctCount: 5,
      totalQuestions: 10,
      rank: 1,
      certificateId: 'C1',
    },
    {
      id: 'h2',
      timestamp: new Date().toISOString(),
      roomCode: 'UTBK1',
      quizTitle: 'Try Out UTBK SNBT #1',
      playerName: 'Siswa',
      grade: 90,
      points: 900,
      correctCount: 9,
      totalQuestions: 10,
      rank: 1,
      certificateId: 'C2',
    },
  ]);

  assert.ok(histEst);
  const histSummary = calculateUtbkScoreSummary(histEst);
  assert.ok(histSummary.averageScore >= 780, 'Should use UTBK history record grade 90');
});

test('ALL_INDONESIA_CAMPUS_PROGRAMS covers all 8 Indonesian regions and 75+ state universities', () => {
  assert.ok(INDONESIA_UNIVERSITIES.length >= 75, `Expected >= 75 PTN, got ${INDONESIA_UNIVERSITIES.length}`);
  assert.ok(
    ALL_INDONESIA_CAMPUS_PROGRAMS.length >= 1500,
    `Expected >= 1500 programs, got ${ALL_INDONESIA_CAMPUS_PROGRAMS.length}`
  );

  const regionsCovered = new Set(ALL_INDONESIA_CAMPUS_PROGRAMS.map((p) => p.region));
  for (const r of INDONESIA_REGIONS) {
    if (r === 'Semua Wilayah') continue;
    assert.ok(regionsCovered.has(r), `Missing region ${r}`);
  }
});

test('analyzeCampusMatches filters nationwide dataset by region and universityId accurately', () => {
  const scores: UtbkSubtestScores = {
    pu: 660,
    ppu: 640,
    pbm: 650,
    pk: 640,
    lbi: 670,
    lbe: 650,
    pm: 660,
  };
  const sumatraMatches = analyzeCampusMatches(scores, ALL_INDONESIA_CAMPUS_PROGRAMS, {
    region: 'Sumatra',
  });
  assert.ok(sumatraMatches.length > 0);
  assert.ok(sumatraMatches.every((m) => m.program.region === 'Sumatra'));

  const unjaMedMatches = analyzeCampusMatches(scores, ALL_INDONESIA_CAMPUS_PROGRAMS, {
    region: 'Sumatra',
    universityId: 'unja',
    searchQuery: 'Kedokteran',
  });
  assert.ok(unjaMedMatches.length >= 1);
  assert.ok(unjaMedMatches.every((m) => m.program.shortUniv === 'UNJA'));
});

