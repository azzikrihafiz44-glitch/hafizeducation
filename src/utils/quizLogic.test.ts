import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAnswerPoints,
  calculateGrade,
  canAdminStartQuiz,
  compute5050HiddenIndices,
  estimateQuestionCount,
  extractPrintableTextFromBinary,
  generateRoomCode,
  generateSystemPassword,
  normalizeRoomForLobbyEntry,
  parseQuizCSV,
  parseQuizExcelRows,
  parseQuizJSON,
  parseQuizText,
  rankLeaderboard,
  sanitizeRoomCodeForFirestore,
  sha256Hex,
  stripHtmlAndXmlToText,
  stripRtfToText,
} from './quizLogic';

test('generateRoomCode and generateSystemPassword produce valid formats', () => {
  const code = generateRoomCode();
  assert.match(code, /^HF[A-Z0-9]{4}$/);
  const pw = generateSystemPassword();
  assert.match(pw, /^HFZ-[A-Z0-9]{6}$/);
});

test('sha256Hex produces deterministic 64-char hex digest', async () => {
  const h1 = await sha256Hex('HFZ-123456');
  const h2 = await sha256Hex('HFZ-123456');
  assert.equal(h1.length, 64);
  assert.equal(h1, h2);
  const h3 = await sha256Hex('HFZ-000000');
  assert.notEqual(h1, h3);
});

test('calculateAnswerPoints rewards streaks and resets on wrong answer', () => {
  const r1 = calculateAnswerPoints(true, 0);
  assert.deepEqual(r1, { pointsAdded: 200, nextStreak: 1 });

  const r2 = calculateAnswerPoints(true, 1);
  assert.deepEqual(r2, { pointsAdded: 250, nextStreak: 2 });

  const rWrong = calculateAnswerPoints(false, 4);
  assert.deepEqual(rWrong, { pointsAdded: 0, nextStreak: 0 });
});

test('calculateGrade computes 0-100 rounded score safely', () => {
  assert.equal(calculateGrade(0, 0), 0);
  assert.equal(calculateGrade(3, 6), 50);
  assert.equal(calculateGrade(6, 6), 100);
});

test('compute5050HiddenIndices never hides the correct answer and leaves 2 options', () => {
  for (let correct = 0; correct < 5; correct++) {
    const hidden = compute5050HiddenIndices(5, correct);
    assert.equal(hidden.length, 3);
    assert.equal(hidden.includes(correct), false);
  }
});

test('parseQuizText parses A-E choices, Jawaban, and Pembahasan', () => {
  const raw = `
1. Planet terbesar di Tata Surya adalah?
A. Bumi
B. Mars
C. Jupiter
D. Venus
E. Merkurius
Jawaban: C
Pembahasan: Jupiter adalah planet terbesar dengan diameter ~143.000 km.

2. Hasil dari 7 x 8 adalah?
A. 54
B. 56
C. 58
D. 64
E. 49
Kunci: B
Penjelasan: 7 dikali 8 sama dengan 56.
  `;
  const qs = parseQuizText(raw);
  assert.equal(qs.length, 2);
  assert.equal(qs[0].correctIndex, 2);
  assert.equal(qs[0].choices[2], 'Jupiter');
  assert.match(qs[0].explanation, /143\.000/);
  assert.equal(qs[1].correctIndex, 1);
  assert.equal(qs[1].choices[1], '56');
});

test('parseQuizCSV and parseQuizJSON parse structured quiz data', () => {
  const csv = `Pertanyaan,A,B,C,D,E,Jawaban,Pembahasan
"Ibu kota RI?",Bandung,Jakarta,Surabaya,Medan,Bali,B,"Jakarta adalah ibu kota."`;
  const fromCsv = parseQuizCSV(csv);
  assert.equal(fromCsv.length, 1);
  assert.equal(fromCsv[0].correctIndex, 1);
  assert.equal(fromCsv[0].choices[1], 'Jakarta');

  const json = JSON.stringify([
    {
      question: 'Simbol kimia air?',
      choices: ['CO2', 'O2', 'H2O', 'NaCl', 'CH4'],
      answer: 'C',
      explanation: 'Air terdiri dari 2 atom Hidrogen dan 1 atom Oksigen.',
    },
  ]);
  const fromJson = parseQuizJSON(json);
  assert.equal(fromJson.length, 1);
  assert.equal(fromJson[0].correctIndex, 2);
});

test('rankLeaderboard sorts by points descending then grade descending', () => {
  const ranked = rankLeaderboard([
    { id: '1', name: 'Budi', grade: 80, points: 900, correctCount: 4, totalQuestions: 5, timestamp: '' },
    { id: '2', name: 'Aisyah', grade: 100, points: 1450, correctCount: 5, totalQuestions: 5, timestamp: '' },
    { id: '3', name: 'Citra', grade: 80, points: 900, correctCount: 4, totalQuestions: 5, timestamp: '' },
  ]);
  assert.equal(ranked[0].name, 'Aisyah');
  assert.equal(ranked[0].rank, 1);
  assert.equal(ranked[1].name, 'Budi');
  assert.equal(ranked[1].rank, 2);
  assert.equal(ranked[2].name, 'Citra');
  assert.equal(ranked[2].rank, 3);
});

test('parseQuizText handles inline choices, starred/[BENAR] markers, and multi-line Pembahasan', () => {
  const raw = `
No. 1) Warna bendera Indonesia adalah...
A. Merah Biru   *B. Merah Putih   C. Putih Biru   D. Hijau Kuning   E. Hitam Putih
Solusi: Merah berarti berani,
dan putih berarti suci.

Soal 2: Sungai terpanjang di Indonesia adalah...
(A) Bengawan Solo
(B) Sungai Musi
(C) Sungai Mahakam
(D) Sungai Kapuas [BENAR]
(E) Sungai Barito
Pembahasan Soal: Sungai Kapuas di Kalimantan Barat memiliki panjang sekitar 1.143 km.
  `;
  const qs = parseQuizText(raw);
  assert.equal(qs.length, 2);
  assert.equal(qs[0].correctIndex, 1);
  assert.equal(qs[0].choices[1], 'Merah Putih');
  assert.match(qs[0].explanation, /Merah berarti berani, dan putih berarti suci/);
  assert.equal(qs[1].correctIndex, 3);
  assert.equal(qs[1].choices[3], 'Sungai Kapuas');
  assert.match(qs[1].explanation, /1\.143 km/);
});

test('parseQuizText maps separate bottom KUNCI JAWABAN section', () => {
  const raw = `
1. Ibukota Jepang adalah...
A. Seoul
B. Beijing
C. Tokyo
D. Bangkok
E. Hanoi

2. 10 + 15 = ...
A. 20
B. 25
C. 30
D. 35
E. 40

KUNCI JAWABAN
1. C   2. B
  `;
  const qs = parseQuizText(raw);
  assert.equal(qs.length, 2);
  assert.equal(qs[0].correctIndex, 2);
  assert.equal(qs[1].correctIndex, 1);
});

test('parseQuizExcelRows parses Excel sheets with headers and leading No column', () => {
  const withHeaders = [
    ['No', 'Pertanyaan', 'Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D', 'Pilihan E', 'Kunci Jawaban', 'Pembahasan'],
    [1, 'Satuan SI untuk gaya adalah?', 'Joule', 'Watt', 'Newton', 'Pascal', 'Volt', 'C', 'Gaya diukur dalam satuan Newton (N).'],
  ];
  const qs1 = parseQuizExcelRows(withHeaders);
  assert.equal(qs1.length, 1);
  assert.equal(qs1[0].question, 'Satuan SI untuk gaya adalah?');
  assert.equal(qs1[0].correctIndex, 2);
  assert.equal(qs1[0].choices[2], 'Newton');
  assert.match(qs1[0].explanation, /Newton \(N\)/);

  const withoutHeaders = [
    [1, '2 x 9 = ?', '16', '18', '20', '22', '24', 'B', '2 dikali 9 adalah 18.'],
  ];
  const qs2 = parseQuizExcelRows(withoutHeaders);
  assert.equal(qs2.length, 1);
  assert.equal(qs2[0].correctIndex, 1);
  assert.equal(qs2[0].choices[1], '18');
});

test('universal format cleaners (HTML/XML, RTF, binary) feed cleanly into parseQuizText', () => {
  const html = `
    <div><p>1. Lambang unsur Emas adalah?</p>
    <p>A. Ag</p><p>B. Au</p><p>C. Fe</p><p>D. Cu</p><p>E. Zn</p>
    <p>Jawaban: B</p><p>Pembahasan: Au berasal dari kata Latin Aurum.</p></div>
  `;
  const fromHtml = parseQuizText(stripHtmlAndXmlToText(html));
  assert.equal(fromHtml.length, 1);
  assert.equal(fromHtml[0].correctIndex, 1);
  assert.equal(fromHtml[0].choices[1], 'Au');

  const rtf = `{\\rtf1\\ansi{\\fonttbl\\f0 Arial;} 1. 5 x 5 = ?\\par A. 20\\par B. 25\\par C. 30\\par D. 35\\par E. 40\\par Jawaban: B\\par Pembahasan: 5 dikali 5 adalah 25.}`;
  const fromRtf = parseQuizText(stripRtfToText(rtf));
  assert.equal(fromRtf.length, 1);
  assert.equal(fromRtf[0].correctIndex, 1);
  assert.equal(fromRtf[0].choices[1], '25');

  const binarySample = new TextEncoder().encode('\x00\x011. Ibukota Malaysia?\nA. Jakarta\nB. Kuala Lumpur\nC. Manila\nD. Bangkok\nE. Hanoi\nJawaban: B\x00\x02');
  const fromBin = parseQuizText(extractPrintableTextFromBinary(binarySample));
  assert.equal(fromBin.length, 1);
  assert.equal(fromBin[0].correctIndex, 1);
});

test('estimateQuestionCount and parseQuizText preserve exact question count with standalone numbers and compact choices', () => {
  const sample = `
    1.
    Berapa hasil 6 x 7?
    A.40
    B.42
    C.44
    D.46
    E.48
    Jawaban: B

    2.Planet terdekat dari Matahari adalah...
    A. Venus
    B. Merkurius
    C. Mars
    D. Bumi
    E. Saturnus
    Jawaban: B

    Soal 3
    Ibu kota Jepang adalah...
    A. Osaka
    B. Kyoto
    C. Tokyo
    D. Sapporo
    E. Nagoya
    Jawaban: C

    KUNCI JAWABAN
    1. B
    2. B
    3. C
  `;

  assert.equal(estimateQuestionCount(sample), 3);
  const qs = parseQuizText(sample);
  assert.equal(qs.length, 3);
  assert.equal(qs[0].choices[1], '42');
  assert.equal(qs[1].correctIndex, 1);
  assert.equal(qs[2].choices[2], 'Tokyo');
});

test('canAdminStartQuiz strictly enforces Admin-only quiz start', () => {
  assert.equal(canAdminStartQuiz({ isGoogleAdminVerified: false, adminAuthenticated: false }), false);
  assert.equal(canAdminStartQuiz({ isGoogleAdminVerified: true, adminAuthenticated: false }), true);
  assert.equal(canAdminStartQuiz({ isGoogleAdminVerified: false, adminAuthenticated: true }), true);
});

test('normalizeRoomForLobbyEntry and sanitizeRoomCodeForFirestore prepare Lobby rooms cleanly', () => {
  const localRoom = {
    code: 'HF1234',
    title: 'Try Out UTBK',
    questions: [
      {
        id: 'q1',
        question: '1+1?',
        choices: ['1', '2', '3', '4', '5'] as [string, string, string, string, string],
        correctIndex: 1,
        explanation: '2',
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const waitingLobby = normalizeRoomForLobbyEntry(localRoom);
  assert.equal(waitingLobby.status, 'waiting');

  const cloudStarted = normalizeRoomForLobbyEntry(localRoom, { ...localRoom, status: 'started' });
  assert.equal(cloudStarted.status, 'started');

  assert.match(sanitizeRoomCodeForFirestore('modul bio 1'), /^[A-Z0-9_-]{4,12}$/);
});



