import type { LeaderboardEntry, QuizQuestion, QuizRoom } from '../types/quiz';

const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

export function generateRoomCode(prefix = 'HF'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}${suffix}`;
}

export function generateSystemPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let part = '';
  for (let i = 0; i < 6; i++) {
    part += chars[Math.floor(Math.random() * chars.length)];
  }
  return `HFZ-${part}`;
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function calculateAnswerPoints(
  isCorrect: boolean,
  currentStreak: number
): { pointsAdded: number; nextStreak: number } {
  if (!isCorrect) {
    return { pointsAdded: 0, nextStreak: 0 };
  }
  const nextStreak = currentStreak + 1;
  const streakBonus = Math.min((nextStreak - 1) * 50, 250);
  return {
    pointsAdded: 200 + streakBonus,
    nextStreak,
  };
}

export function calculateGrade(correctCount: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return 0;
  return Math.round((correctCount / totalQuestions) * 100);
}

export function compute5050HiddenIndices(choicesCount: number, correctIndex: number): number[] {
  const wrongIndices: number[] = [];
  for (let i = 0; i < choicesCount; i++) {
    if (i !== correctIndex) wrongIndices.push(i);
  }
  // Remove half (2 for 4-choice, 2 or 3 -> remove 2 wrong options for 5-choice leaving 3, or 3 leaving 2)
  // Standard 50:50 on 5 choices eliminates 2 wrong options (or 3 if we want 2 remaining). Let's eliminate Math.floor(wrongIndices.length / 2) + (choicesCount === 5 ? 1 : 0) => leaves 2 choices!
  const countToHide = Math.max(1, choicesCount - 2);
  // Deterministic-friendly shuffle using Fisher-Yates
  const pool = [...wrongIndices];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(countToHide, pool.length)).sort((a, b) => a - b);
}

export function rankLeaderboard(
  entries: LeaderboardEntry[]
): (LeaderboardEntry & { rank: number })[] {
  const sorted = [...entries].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.grade !== a.grade) return b.grade - a.grade;
    return a.name.localeCompare(b.name);
  });
  return sorted.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));
}

export function letterToIndex(letter: string): number {
  const clean = letter.trim().toUpperCase().charAt(0);
  const idx = LETTERS.indexOf(clean as (typeof LETTERS)[number]);
  return idx >= 0 ? idx : 0;
}

function cleanMarkedChoice(raw: string): { text: string; isMarkedCorrect: boolean } {
  let text = raw.trim();
  let isMarkedCorrect = false;

  if (/^\*+/.test(text)) {
    isMarkedCorrect = true;
    text = text.replace(/^\*+\s*/, '');
  }
  if (/(?:\*+|✓|✔|✅|\[\s*(?:benar|true|kunci|correct)\s*\]|\(\s*(?:benar|true|kunci|correct)\s*\))\s*$/i.test(text)) {
    isMarkedCorrect = true;
    text = text
      .replace(/(?:\*+|✓|✔|✅|\[\s*(?:benar|true|kunci|correct)\s*\]|\(\s*(?:benar|true|kunci|correct)\s*\))\s*$/i, '')
      .trim();
  }
  return { text, isMarkedCorrect };
}

function splitInlineChoices(line: string): Array<{ letter: string; text: string }> | null {
  // Detect lines that contain 2+ choices on the same line, e.g. "A. Satu   B. Dua   C. Tiga"
  const regex = /(?:^|\s{2,}|\t)(?:\*?\(?([A-Ea-e])[.)]\s+|\*?([A-Ea-e])\s*[-:]\s+)/g;
  const matches: Array<{ index: number; letter: string; contentStart: number; rawPrefix: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(line)) !== null) {
    const letter = (m[1] || m[2] || '').toUpperCase();
    matches.push({
      index: m.index,
      letter,
      contentStart: m.index + m[0].length,
      rawPrefix: m[0],
    });
  }
  if (matches.length < 2) return null;

  const result: Array<{ letter: string; text: string }> = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].contentStart;
    const end = i + 1 < matches.length ? matches[i + 1].index : line.length;
    const prefixHasStar = matches[i].rawPrefix.includes('*');
    const piece = line.slice(start, end).trim();
    result.push({
      letter: matches[i].letter,
      text: prefixHasStar ? `*${piece}` : piece,
    });
  }
  return result;
}

export function parseQuizText(rawText: string): QuizQuestion[] {
  const normalized = rawText.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean);
  const questions: QuizQuestion[] = [];
  const bottomAnswerKey = new Map<number, number>();

  let currentQuestion = '';
  let currentQuestionNum: number | null = null;
  let currentChoices: string[] = ['', '', '', '', ''];
  let currentCorrect: number | null = null;
  let currentExplanation = '';
  let lastChoiceIdx: number | null = null;
  let inBottomKeySection = false;

  const flush = () => {
    if (!currentQuestion) return;
    // Skip accidental short document title/header lines only if no choices AND no question number
    const hasAnyChoice = currentChoices.some((c) => c.trim().length > 0);
    if (!hasAnyChoice && currentQuestionNum === null && currentQuestion.length < 45) {
      currentQuestion = '';
      return;
    }
    const filledChoices = currentChoices.map((c, idx) => c || `Pilihan ${LETTERS[idx]}`) as [
      string,
      string,
      string,
      string,
      string,
    ];
    const resolvedCorrect =
      currentCorrect !== null ? Math.max(0, Math.min(4, currentCorrect)) : 0;

    questions.push({
      id: `q-${Date.now()}-${questions.length + 1}`,
      question: currentQuestion,
      choices: filledChoices,
      correctIndex: resolvedCorrect,
      explanation:
        currentExplanation ||
        `Jawaban yang tepat adalah ${LETTERS[resolvedCorrect]}. ${filledChoices[resolvedCorrect]}.`,
    });
    // Tag index mapping if numbered
    if (currentQuestionNum !== null) {
      (questions[questions.length - 1] as QuizQuestion & { _num?: number })._num = currentQuestionNum;
    }

    currentQuestion = '';
    currentQuestionNum = null;
    currentChoices = ['', '', '', '', ''];
    currentCorrect = null;
    currentExplanation = '';
    lastChoiceIdx = null;
  };

  let pendingQuestionNum: number | null = null;
  let pendingImageTokens: string[] = [];

  for (const line of lines) {
    // Check if entering a dedicated bottom answer-key section: "KUNCI JAWABAN"
    if (/^(?:KUNCI\s+JAWABAN|ANSWER\s+KEY)\s*:?\s*$/i.test(line)) {
      flush();
      pendingQuestionNum = null;
      pendingImageTokens = [];
      inBottomKeySection = true;
      continue;
    }

    if (inBottomKeySection) {
      // Parse pairs like "1. B  2. C  3) A" or "1: D"
      const keyRegex = /(\d+)\s*[.):=-]\s*([A-Ea-e])\b/g;
      let km: RegExpExecArray | null;
      while ((km = keyRegex.exec(line)) !== null) {
        bottomAnswerKey.set(Number(km[1]), letterToIndex(km[2]));
      }
      continue;
    }

    // Preserve standalone [[IMG_N]] tokens cleanly without dropping them on flush()
    if (/^(?:\[\[IMG_\d+\]\]\s*)+$/.test(line)) {
      if (currentQuestion && currentChoices.every((c) => !c)) {
        currentQuestion += ' ' + line;
      } else if (!currentQuestion) {
        pendingImageTokens.push(line);
      } else if (lastChoiceIdx !== null && currentChoices[lastChoiceIdx]) {
        currentChoices[lastChoiceIdx] += ' ' + line;
      } else {
        currentQuestion += ' ' + line;
      }
      continue;
    }

    // Standalone question number header on its own line: "1." or "Soal 1" or "No. 12:"
    const standaloneNumMatch = line.match(
      /^(?:(?:Soal|Pertanyaan|No\.?|Nomor)\s*(?:No\.?\s*)?)?\(?(\d{1,3})\)?\s*[.):-]?\s*$/i
    );
    if (standaloneNumMatch && (currentChoices.some((c) => c.trim().length > 0) || !currentQuestion)) {
      flush();
      pendingQuestionNum = Number(standaloneNumMatch[1]);
      continue;
    }

    // Check inline multiple choices on a single line (e.g., "A. Merah   B. Biru   C. Hijau")
    const inlineChoices = splitInlineChoices(line);
    if (inlineChoices && currentQuestion) {
      for (const item of inlineChoices) {
        const idx = letterToIndex(item.letter);
        const cleaned = cleanMarkedChoice(item.text);
        currentChoices[idx] = cleaned.text;
        if (cleaned.isMarkedCorrect) currentCorrect = idx;
        lastChoiceIdx = idx;
      }
      continue;
    }

    // Single choice line: A. / A) / (A) / a. / *A. / A - / A: / A\t / A.Text (even without space)
    const choiceMatch = line.match(/^(\*?)\s*\(?([A-Ea-e])(?:\)\s*|[.)]\s*|\s*[-:]\s+|\t+)(.+)$/);
    if (choiceMatch && currentQuestion) {
      const idx = letterToIndex(choiceMatch[2]);
      const rawChoice = (choiceMatch[1] ? '*' : '') + choiceMatch[3];
      const cleaned = cleanMarkedChoice(rawChoice);
      currentChoices[idx] = cleaned.text;
      if (cleaned.isMarkedCorrect) currentCorrect = idx;
      lastChoiceIdx = idx;
      continue;
    }

    // Answer line: Jawaban: B, Kunci: C, Kunci Jawaban: D, Jawab: A, KJ: E, Answer: B
    const answerMatch = line.match(
      /^(?:Jawaban(?:\s+Benar)?|Kunci(?:\s+Jawaban)?|Jawab|KJ|Answer)\s*[:=-]\s*\(?([A-Ea-e])\)?(?:\b|[.)])(.*)$/i
    );
    if (answerMatch) {
      currentCorrect = letterToIndex(answerMatch[1]);
      lastChoiceIdx = null;
      const trailing = answerMatch[2]?.trim() || '';
      const inlineExp = trailing.match(/(?:Pembahasan|Penjelasan|Alasan|Solusi)\s*[:=-]\s*(.+)$/i);
      if (inlineExp && !currentExplanation) {
        currentExplanation = inlineExp[1].trim();
      }
      continue;
    }

    // Explanation line: Pembahasan:, Penjelasan:, Alasan:, Solusi:, Keterangan:, Explanation:
    const expMatch = line.match(
      /^(?:Pembahasan(?:\s+Soal)?|Penjelasan|Alasan|Solusi|Keterangan|Explanation)\s*[:=-]\s*(.*)$/i
    );
    if (expMatch) {
      currentExplanation = expMatch[1].trim();
      lastChoiceIdx = null;
      continue;
    }

    // Question number line: 1. / 1) / (1) / 1.Text / No. 1. / Soal 1. / Soal No. 1: / Pertanyaan 1.
    const qNumMatch = line.match(
      /^(?:(?:Soal|Pertanyaan|No\.?|Nomor)\s*(?:No\.?\s*)?)?\(?(\d{1,3})\)?\s*[.):-]\s*(.+)$/i
    );
    if (qNumMatch && qNumMatch[2].trim().length > 0) {
      flush();
      pendingQuestionNum = null;
      currentQuestionNum = Number(qNumMatch[1]);
      const prefixImgs = pendingImageTokens.length > 0 ? `${pendingImageTokens.join(' ')} ` : '';
      pendingImageTokens = [];
      currentQuestion = `${prefixImgs}${qNumMatch[2].trim()}`.trim();
      continue;
    }

    // Continuation line or text following a standalone question number
    if (!currentQuestion) {
      const prefixImgs = pendingImageTokens.length > 0 ? `${pendingImageTokens.join(' ')} ` : '';
      pendingImageTokens = [];
      currentQuestion = `${prefixImgs}${line}`.trim();
      if (pendingQuestionNum !== null) {
        currentQuestionNum = pendingQuestionNum;
        pendingQuestionNum = null;
      }
    } else if (currentExplanation) {
      currentExplanation += ' ' + line;
    } else if (lastChoiceIdx !== null && currentChoices[lastChoiceIdx]) {
      // Multi-line choice text continuation
      currentChoices[lastChoiceIdx] += ' ' + line;
    } else if (currentChoices.every((c) => !c)) {
      currentQuestion += ' ' + line;
    }
  }

  flush();

  // Apply bottom answer key if present
  if (bottomAnswerKey.size > 0) {
    questions.forEach((q, idx) => {
      const tagged = q as QuizQuestion & { _num?: number };
      const keyNum = tagged._num ?? idx + 1;
      if (bottomAnswerKey.has(keyNum)) {
        const mapped = bottomAnswerKey.get(keyNum)!;
        q.correctIndex = mapped;
        if (q.explanation.startsWith('Jawaban yang tepat adalah ')) {
          q.explanation = `Jawaban yang tepat adalah ${LETTERS[mapped]}. ${q.choices[mapped]}.`;
        }
      }
      delete tagged._num;
    });
  } else {
    questions.forEach((q) => {
      delete (q as QuizQuestion & { _num?: number })._num;
    });
  }

  return questions;
}

/**
 * Estimates the number of distinct numbered questions in raw quiz text
 * (ignoring any trailing KUNCI JAWABAN / ANSWER KEY section).
 */
export function estimateQuestionCount(rawText: string): number {
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const seenNums = new Set<number>();
  for (const line of lines) {
    if (/^(?:KUNCI\s+JAWABAN|ANSWER\s+KEY)\s*:?\s*$/i.test(line)) {
      break;
    }
    const prefixHeader = line.match(
      /^(?:Soal|Pertanyaan|No\.?|Nomor)\s*(?:No\.?\s*)?\(?(\d{1,3})\)?(?:\s*[.):-].*|\s+.*|\s*)$/i
    );
    const plainNum = line.match(/^\(?(\d{1,3})\)?\s*[.):-](?:\s*[^\d].*|\s*)$/);
    const m = prefixHeader || plainNum;
    if (m) {
      const n = Number(m[1]);
      if (n >= 1 && n <= 200) {
        seenNums.add(n);
      }
    }
  }
  return seenNums.size;
}

export function parseQuizExcelRows(rows: unknown[][]): QuizQuestion[] {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const normalizeCell = (cell: unknown): string => String(cell ?? '').trim();
  const cleanRows = rows
    .map((r) => (Array.isArray(r) ? r.map(normalizeCell) : []))
    .filter((r) => r.some((c) => c.length > 0));

  if (cleanRows.length === 0) return [];

  // Try to detect header row
  const header = cleanRows[0].map((c) => c.toLowerCase());
  const findCol = (patterns: RegExp[]): number =>
    header.findIndex((h) => patterns.some((p) => p.test(h)));

  const qCol = findCol([/pertanyaan/, /soal/, /question/]);
  const aCol = findCol([/^a$/, /pilihan\s*a/, /opsi\s*a/, /option\s*a/]);
  const bCol = findCol([/^b$/, /pilihan\s*b/, /opsi\s*b/, /option\s*b/]);
  const cCol = findCol([/^c$/, /pilihan\s*c/, /opsi\s*c/, /option\s*c/]);
  const dCol = findCol([/^d$/, /pilihan\s*d/, /opsi\s*d/, /option\s*d/]);
  const eCol = findCol([/^e$/, /pilihan\s*e/, /opsi\s*e/, /option\s*e/]);
  const ansCol = findCol([/jawaban/, /kunci/, /answer/, /^kj$/]);
  const expCol = findCol([/pembahasan/, /penjelasan/, /solusi/, /alasan/, /explanation/]);

  const hasHeader = qCol >= 0 && aCol >= 0 && bCol >= 0;
  const startIdx = hasHeader ? 1 : 0;

  // Fallback column offsets when no header is present (handle optional "No" in col 0)
  const firstDataRow = cleanRows[startIdx] || [];
  const hasLeadingNumberCol = !hasHeader && /^\d+$/.test(firstDataRow[0] || '') && firstDataRow.length >= 7;
  const offset = hasLeadingNumberCol ? 1 : 0;

  const questions: QuizQuestion[] = [];
  for (let i = startIdx; i < cleanRows.length; i++) {
    const row = cleanRows[i];
    const question = hasHeader ? row[qCol] || '' : row[offset] || '';
    if (!question) continue;

    const getVal = (idx: number, fallbackIdx: number, label: string) => {
      const val = hasHeader ? (idx >= 0 ? row[idx] : '') : row[fallbackIdx];
      return (val || '').trim() || label;
    };

    const choices: [string, string, string, string, string] = [
      getVal(aCol, offset + 1, 'Pilihan A'),
      getVal(bCol, offset + 2, 'Pilihan B'),
      getVal(cCol, offset + 3, 'Pilihan C'),
      getVal(dCol, offset + 4, 'Pilihan D'),
      getVal(eCol, offset + 5, 'Pilihan E'),
    ];

    const rawAns = hasHeader
      ? ansCol >= 0
        ? row[ansCol] || 'A'
        : 'A'
      : row[offset + 6] || 'A';
    const correctIndex = letterToIndex(rawAns);

    const rawExp = hasHeader
      ? expCol >= 0
        ? row[expCol] || ''
        : ''
      : row[offset + 7] || '';

    questions.push({
      id: `q-xlsx-${Date.now()}-${questions.length + 1}`,
      question,
      choices,
      correctIndex,
      explanation:
        rawExp || `Jawaban yang tepat adalah ${LETTERS[correctIndex]}. ${choices[correctIndex]}.`,
    });
  }

  return questions;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseQuizCSV(csvText: string): QuizQuestion[] {
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const startIdx = lines[0].toLowerCase().includes('pertanyaan') || lines[0].toLowerCase().includes('question') ? 1 : 0;
  const questions: QuizQuestion[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length < 6) continue;
    const question = cols[0];
    if (!question) continue;
    const choices: [string, string, string, string, string] = [
      cols[1] || 'Pilihan A',
      cols[2] || 'Pilihan B',
      cols[3] || 'Pilihan C',
      cols[4] || 'Pilihan D',
      cols[5] || 'Pilihan E',
    ];
    const correctIndex = letterToIndex(cols[6] || 'A');
    const explanation =
      cols[7] || `Jawaban yang tepat adalah ${LETTERS[correctIndex]}. ${choices[correctIndex]}.`;

    questions.push({
      id: `q-csv-${Date.now()}-${questions.length + 1}`,
      question,
      choices,
      correctIndex,
      explanation,
    });
  }

  return questions;
}

export function parseQuizJSON(jsonText: string): QuizQuestion[] {
  const parsed = JSON.parse(jsonText);
  const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.questions) ? parsed.questions : [];
  const questions: QuizQuestion[] = [];

  for (const item of arr) {
    if (!item || typeof item.question !== 'string') continue;
    const rawChoices = Array.isArray(item.choices) ? item.choices : [];
    const choices: [string, string, string, string, string] = [
      String(rawChoices[0] ?? 'Pilihan A'),
      String(rawChoices[1] ?? 'Pilihan B'),
      String(rawChoices[2] ?? 'Pilihan C'),
      String(rawChoices[3] ?? 'Pilihan D'),
      String(rawChoices[4] ?? 'Pilihan E'),
    ];
    let correctIndex = 0;
    if (typeof item.correctIndex === 'number') {
      correctIndex = Math.max(0, Math.min(4, item.correctIndex));
    } else if (typeof item.answer === 'string') {
      correctIndex = letterToIndex(item.answer);
    }
    questions.push({
      id: `q-json-${Date.now()}-${questions.length + 1}`,
      question: item.question.trim(),
      choices,
      correctIndex,
      explanation:
        typeof item.explanation === 'string' && item.explanation.trim()
          ? item.explanation.trim()
          : `Jawaban yang tepat adalah ${LETTERS[correctIndex]}. ${choices[correctIndex]}.`,
      image: typeof item.image === 'string' ? item.image : undefined,
    });
  }

  return questions;
}

export function formatTemplateContent(format: 'txt' | 'csv' | 'json'): string {
  if (format === 'txt') {
    return [
      '1. Ibu kota Provinsi Jawa Barat adalah...',
      'A. Semarang',
      'B. Bandung',
      'C. Surabaya',
      'D. Yogyakarta',
      'E. Serang',
      'Jawaban: B',
      'Pembahasan: Bandung adalah ibu kota Provinsi Jawa Barat yang dikenal sebagai Kota Kembang.',
      '',
      '2. Gas terbanyak yang menyusun atmosfer Bumi adalah...',
      'A. Oksigen',
      'B. Karbon Dioksida',
      'C. Nitrogen',
      'D. Argon',
      'E. Hidrogen',
      'Jawaban: C',
      'Pembahasan: Sekitar 78% atmosfer Bumi tersusun atas gas Nitrogen (N2).',
    ].join('\n');
  }
  if (format === 'csv') {
    return [
      'Pertanyaan,A,B,C,D,E,Jawaban,Pembahasan',
      '"Ibu kota Provinsi Jawa Barat adalah...",Semarang,Bandung,Surabaya,Yogyakarta,Serang,B,"Bandung adalah ibu kota Provinsi Jawa Barat."',
      '"Gas terbanyak di atmosfer Bumi adalah...",Oksigen,Karbon Dioksida,Nitrogen,Argon,Hidrogen,C,"Atmosfer Bumi tersusun sekitar 78% Nitrogen."',
    ].join('\n');
  }
  return JSON.stringify(
    {
      title: 'Contoh Kuis Hafiz Education',
      questions: [
        {
          question: 'Ibu kota Provinsi Jawa Barat adalah...',
          choices: ['Semarang', 'Bandung', 'Surabaya', 'Yogyakarta', 'Serang'],
          correctIndex: 1,
          explanation: 'Bandung adalah ibu kota Provinsi Jawa Barat.',
        },
      ],
    },
    null,
    2
  );
}

export function stripHtmlAndXmlToText(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(?:br|\/p|\/div|\/li|\/tr|\/h[1-6]|\/a:p|\/text:p|\/w:p)\b[^>]*>/gi, '\n')
    .replace(/<(?:td|th)\b[^>]*>/gi, '   ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function stripRtfToText(rtf: string): string {
  return rtf
    .replace(/\{\\(?:fonttbl|colortbl|stylesheet|info|pict|object|header|footer)[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gi, ' ')
    .replace(/\\(?:par|line)\b/gi, '\n')
    .replace(/\\tab\b/gi, '   ')
    .replace(/\\'([0-9a-fA-F]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\u(-?\d+)\??/g, (_, code: string) => {
      const n = parseInt(code, 10);
      return String.fromCharCode(n < 0 ? n + 65536 : n);
    })
    .replace(/\\[a-zA-Z]+-?\d* ?/g, '')
    .replace(/[{}]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractPrintableTextFromBinary(bytes: Uint8Array): string {
  // Try UTF-8 / ASCII runs of length >= 4
  const chunks: string[] = [];
  let current = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 10 || b === 13 || b === 9 || (b >= 32 && b <= 126)) {
      current += String.fromCharCode(b);
    } else {
      if (current.trim().length >= 4) {
        chunks.push(current.trim());
      }
      current = '';
    }
  }
  if (current.trim().length >= 4) {
    chunks.push(current.trim());
  }
  return chunks.join('\n').slice(0, 120_000);
}

export function canAdminStartQuiz(flags: {
  isGoogleAdminVerified: boolean;
  adminAuthenticated: boolean;
}): boolean {
  return Boolean(flags.isGoogleAdminVerified || flags.adminAuthenticated);
}

export function normalizeRoomForLobbyEntry(
  localRoom: QuizRoom,
  cloudRoom?: QuizRoom | null
): QuizRoom {
  const source =
    cloudRoom && Array.isArray(cloudRoom.questions) && cloudRoom.questions.length > 0
      ? cloudRoom
      : localRoom;
  return {
    ...source,
    status: source.status === 'started' ? 'started' : 'waiting',
  };
}

export function sanitizeRoomCodeForFirestore(rawCode: string, prefix = 'LAT'): string {
  const cleaned = rawCode.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  const withPrefix = cleaned.startsWith(prefix) ? cleaned : `${prefix}${cleaned}`;
  const bounded = withPrefix.slice(0, 12);
  return bounded.length >= 4 ? bounded : `${bounded}ROOM`.slice(0, 12);
}


