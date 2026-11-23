import test from 'node:test';
import assert from 'node:assert/strict';
import type { QuizQuestion } from '../types/quiz';
import {
  attachImagesToQuestions,
  clampNormalizedBBox,
  extractHtmlImagesAndPlaceholders,
} from './imageHelper';

function makeQ(question: string): QuizQuestion {
  return {
    id: 'q1',
    question,
    choices: ['A', 'B', 'C', 'D', 'E'],
    correctIndex: 0,
    explanation: 'Pembahasan',
  };
}

test('extractHtmlImagesAndPlaceholders converts img data URLs into sequential IMG tokens', () => {
  const html =
    '<p>1. Perhatikan grafik berikut:</p><img src="data:image/png;base64,AAA" /><p>A. Satu</p>';
  const res = extractHtmlImagesAndPlaceholders(html);
  assert.equal(res.images.length, 1);
  assert.equal(res.images[0], 'data:image/png;base64,AAA');
  assert.ok(res.textWithPlaceholders.includes('[[IMG_0]]'));
});

test('attachImagesToQuestions binds explicit IMG tokens and strips markers cleanly', () => {
  const qs = [
    makeQ('1. Soal teks biasa tanpa gambar.'),
    makeQ('2. Perhatikan rangkaian berikut: [[IMG_0]] Tentukan arusnya.'),
  ];
  const out = attachImagesToQuestions(qs, ['data:image/jpeg;base64,IMG0']);
  assert.equal(out[0].image, undefined);
  assert.equal(out[1].image, 'data:image/jpeg;base64,IMG0');
  assert.ok(!out[1].question.includes('[[IMG_0]]'));
});

test('attachImagesToQuestions binds unmatched images to questions with visual hints when markers are stripped', () => {
  const qs = [
    makeQ('Ibu kota Indonesia adalah...'),
    makeQ('Perhatikan diagram batang di bawah ini! Berapakah kenaikannya?'),
    makeQ('Hasil dari 2 + 2 adalah...'),
    makeQ('Perhatikan grafik kecepatan terhadap waktu berikut ini!'),
  ];
  const out = attachImagesToQuestions(qs, [
    'data:image/jpeg;base64,FIRST_CHART',
    'data:image/jpeg;base64,SECOND_GRAPH',
  ]);
  assert.equal(out[0].image, undefined);
  assert.equal(out[1].image, 'data:image/jpeg;base64,FIRST_CHART');
  assert.equal(out[2].image, undefined);
  assert.equal(out[3].image, 'data:image/jpeg;base64,SECOND_GRAPH');
});

test('clampNormalizedBBox validates and normalizes 0-1000 PDF/image coordinates', () => {
  assert.deepEqual(
    clampNormalizedBBox({ page: 2, ymin: 120, xmin: 50, ymax: 480, xmax: 910 }),
    { page: 2, ymin: 120, xmin: 50, ymax: 480, xmax: 910 }
  );
  assert.equal(clampNormalizedBBox({ page: 1, ymin: 100, xmin: 100, ymax: 105, xmax: 105 }), undefined);
  assert.equal(clampNormalizedBBox(undefined), undefined);
});
