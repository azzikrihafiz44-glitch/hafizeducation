import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  DEFAULT_FLASHCARDS,
  calculateSkdPassingGrade,
  calculateSpeedMathPoints,
  calculateUtbkAverage,
  computeDaysRemaining,
  generateSpeedMathQuestion,
  type QuickStudyNote,
  type SpeedMathDifficulty,
  type SpeedMathQuestion,
  type StudyCountdownTarget,
  type StudyFlashcard,
} from '../utils/studyPlayground';

type PlaygroundTab = 'speedmath' | 'flashcards' | 'planner' | 'calculator';

const STORAGE_SPEEDMATH_BEST = 'hafiz_speedmath_best_v1';
const STORAGE_CUSTOM_FLASHCARDS = 'hafiz_custom_flashcards_v1';
const STORAGE_MASTERED_CARDS = 'hafiz_mastered_flashcards_v1';
const STORAGE_EXAM_TARGETS = 'hafiz_exam_targets_v1';
const STORAGE_QUICK_NOTES = 'hafiz_quick_study_notes_v1';

const DEFAULT_EXAM_TARGETS: StudyCountdownTarget[] = [
  { id: 't-asas', title: 'ASAS Semester Genap', targetDate: '2026-12-07' },
  { id: 't-utbk', title: 'Try Out Akbar UTBK-SNBT', targetDate: '2027-04-20' },
];

const SUBJECT_FILTERS = [
  'Semua',
  'Matematika',
  'Fisika',
  'Kimia',
  'Biologi',
  'Bahasa Inggris',
  'Kustom',
] as const;

export const CosmicPlaygroundHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PlaygroundTab>('speedmath');

  // --- Tab 1: Speed Math State ---
  const [difficulty, setDifficulty] = useState<SpeedMathDifficulty>('utbk');
  const [mathRunning, setMathRunning] = useState(false);
  const [mathFinished, setMathFinished] = useState(false);
  const [mathTimeLeft, setMathTimeLeft] = useState(30);
  const [mathScore, setMathScore] = useState(0);
  const [mathStreak, setMathStreak] = useState(0);
  const [mathCorrectCount, setMathCorrectCount] = useState(0);
  const [mathQuestion, setMathQuestion] = useState<SpeedMathQuestion>(() =>
    generateSpeedMathQuestion('utbk')
  );
  const [mathFeedback, setMathFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(STORAGE_SPEEDMATH_BEST) || '0');
      return Number.isFinite(saved) && saved >= 0 ? saved : 0;
    } catch {
      return 0;
    }
  });

  // --- Tab 2: 3D Flashcards State ---
  const [customCards, setCustomCards] = useState<StudyFlashcard[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_CUSTOM_FLASHCARDS);
      return raw ? (JSON.parse(raw) as StudyFlashcard[]) : [];
    } catch {
      return [];
    }
  });
  const [masteredIds, setMasteredIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_MASTERED_CARDS);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [subjectFilter, setSubjectFilter] = useState<(typeof SUBJECT_FILTERS)[number]>('Semua');
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');
  const [newCardFormula, setNewCardFormula] = useState('');
  const [showAddCard, setShowAddCard] = useState(false);

  // --- Tab 3: Exam Countdown & Quick Notes State ---
  const [examTargets, setExamTargets] = useState<StudyCountdownTarget[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_EXAM_TARGETS);
      if (raw) {
        const parsed = JSON.parse(raw) as StudyCountdownTarget[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_EXAM_TARGETS;
    } catch {
      return DEFAULT_EXAM_TARGETS;
    }
  });
  const [newTargetTitle, setNewTargetTitle] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');

  const [quickNotes, setQuickNotes] = useState<QuickStudyNote[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_QUICK_NOTES);
      return raw ? (JSON.parse(raw) as QuickStudyNote[]) : [];
    } catch {
      return [];
    }
  });
  const [noteInput, setNoteInput] = useState('');

  // --- Tab 4: SKD Kedinasan & UTBK Score Calculator ---
  const [skdTwk, setSkdTwk] = useState(95);
  const [skdTiu, setSkdTiu] = useState(115);
  const [skdTkp, setSkdTkp] = useState(188);
  const [utbkScores, setUtbkScores] = useState<[number, number, number, number]>([680, 650, 710, 690]);

  const skdResult = useMemo(
    () => calculateSkdPassingGrade(skdTwk, skdTiu, skdTkp),
    [skdTwk, skdTiu, skdTkp]
  );
  const utbkResult = useMemo(() => calculateUtbkAverage(utbkScores), [utbkScores]);

  // Speed Math timer
  useEffect(() => {
    if (!mathRunning) return;
    const timer = window.setInterval(() => {
      setMathTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setMathRunning(false);
          setMathFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mathRunning]);

  // Save best score & celebrate on new high score
  useEffect(() => {
    if (mathFinished && mathScore > bestScore) {
      setBestScore(mathScore);
      try {
        localStorage.setItem(STORAGE_SPEEDMATH_BEST, String(mathScore));
      } catch {
        // ignore
      }
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.7 },
      });
    }
  }, [mathFinished, mathScore, bestScore]);

  const startSpeedMath = (nextDiff: SpeedMathDifficulty = difficulty) => {
    setDifficulty(nextDiff);
    setMathScore(0);
    setMathStreak(0);
    setMathCorrectCount(0);
    setMathTimeLeft(30);
    setMathFeedback(null);
    setMathFinished(false);
    setMathQuestion(generateSpeedMathQuestion(nextDiff));
    setMathRunning(true);
  };

  const handleSpeedMathAnswer = (choice: number) => {
    if (!mathRunning) return;
    if (choice === mathQuestion.answer) {
      const nextStreak = mathStreak + 1;
      const gained = calculateSpeedMathPoints(difficulty, nextStreak);
      setMathStreak(nextStreak);
      setMathScore((s) => s + gained);
      setMathCorrectCount((c) => c + 1);
      setMathFeedback('correct');
    } else {
      setMathStreak(0);
      setMathFeedback('wrong');
    }
    setMathQuestion(generateSpeedMathQuestion(difficulty));
  };

  // Flashcards derived list
  const allCards = useMemo(() => [...customCards, ...DEFAULT_FLASHCARDS], [customCards]);
  const filteredCards = useMemo(() => {
    if (subjectFilter === 'Semua') return allCards;
    return allCards.filter((c) => c.subject === subjectFilter);
  }, [allCards, subjectFilter]);

  const safeCardIdx = filteredCards.length > 0 ? cardIndex % filteredCards.length : 0;
  const activeCard = filteredCards[safeCardIdx] ?? null;
  const masteredCount = allCards.filter((c) => masteredIds.includes(c.id)).length;
  const masteryPercent =
    allCards.length > 0 ? Math.round((masteredCount / allCards.length) * 100) : 0;

  const toggleMastered = (id: string) => {
    setMasteredIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(STORAGE_MASTERED_CARDS, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleAddCustomCard = (e: React.FormEvent) => {
    e.preventDefault();
    const front = newCardFront.trim();
    const back = newCardBack.trim();
    if (!front || !back) return;
    const created: StudyFlashcard = {
      id: `fc-custom-${Date.now()}`,
      subject: 'Kustom',
      front,
      back,
      formula: newCardFormula.trim() || undefined,
    };
    const next = [created, ...customCards];
    setCustomCards(next);
    try {
      localStorage.setItem(STORAGE_CUSTOM_FLASHCARDS, JSON.stringify(next));
    } catch {
      // ignore
    }
    setNewCardFront('');
    setNewCardBack('');
    setNewCardFormula('');
    setShowAddCard(false);
    setSubjectFilter('Semua');
    setCardIndex(0);
    setIsFlipped(false);
  };

  // Exam Targets & Quick Notes handlers
  const handleAddExamTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTargetTitle.trim();
    if (!title || !newTargetDate) return;
    const next = [
      ...examTargets,
      { id: `target-${Date.now()}`, title, targetDate: newTargetDate },
    ];
    setExamTargets(next);
    try {
      localStorage.setItem(STORAGE_EXAM_TARGETS, JSON.stringify(next));
    } catch {
      // ignore
    }
    setNewTargetTitle('');
    setNewTargetDate('');
  };

  const handleDeleteExamTarget = (id: string) => {
    const next = examTargets.filter((t) => t.id !== id);
    setExamTargets(next);
    try {
      localStorage.setItem(STORAGE_EXAM_TARGETS, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    const text = noteInput.trim();
    if (!text) return;
    const next: QuickStudyNote[] = [
      { id: `note-${Date.now()}`, text, done: false, createdAt: new Date().toISOString() },
      ...quickNotes,
    ];
    setQuickNotes(next);
    try {
      localStorage.setItem(STORAGE_QUICK_NOTES, JSON.stringify(next));
    } catch {
      // ignore
    }
    setNoteInput('');
  };

  const handleToggleNote = (id: string) => {
    const next = quickNotes.map((n) => (n.id === id ? { ...n, done: !n.done } : n));
    setQuickNotes(next);
    try {
      localStorage.setItem(STORAGE_QUICK_NOTES, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleDeleteNote = (id: string) => {
    const next = quickNotes.filter((n) => n.id !== id);
    setQuickNotes(next);
    try {
      localStorage.setItem(STORAGE_QUICK_NOTES, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  return (
    <section id="cosmic-playground-hub" className="pt-4 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-sky-400/20 pb-4">
        <div>
          <p className="text-xs font-semibold text-sky-300 tracking-wide">
            Zona Interaktif &amp; Utilitas Belajar Kosmik
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
            Asah Otak, Flashcard 3D &amp; Target Ujian
          </h2>
        </div>

        {/* Mode Switcher */}
        <div
          role="tablist"
          aria-label="Fitur Belajar Interaktif"
          className="inline-flex flex-wrap gap-1.5 p-1 rounded-2xl bg-slate-900/85 border border-sky-400/25"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'speedmath'}
            onClick={() => setActiveTab('speedmath')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'speedmath'
                ? 'bg-sky-500/25 text-sky-100 border border-sky-400/50'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            ⚡ Kilat Hitung
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'flashcards'}
            onClick={() => setActiveTab('flashcards')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'flashcards'
                ? 'bg-sky-500/25 text-sky-100 border border-sky-400/50'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            🃏 Flashcard 3D
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'planner'}
            onClick={() => setActiveTab('planner')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'planner'
                ? 'bg-sky-500/25 text-sky-100 border border-sky-400/50'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            🎯 Target &amp; Catatan
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'calculator'}
            onClick={() => setActiveTab('calculator')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'calculator'
                ? 'bg-purple-500/30 text-purple-100 border border-purple-400/55'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            📊 Kalkulator Skor
          </button>
        </div>
      </div>

      {/* TAB 1: KILAT HITUNG (SPEED MATH MINI-GAME) */}
      {activeTab === 'speedmath' && (
        <div className="hero-glow-card holo-top-beam rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-bold text-white">
                Kilat Hitung 30 Detik
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pemanasan otak sebelum kuis — jaga combo beruntun untuk pengali skor hingga 4x!
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'santai', label: 'Santai' },
                  { id: 'utbk', label: 'UTBK Cepat' },
                  { id: 'master', label: 'Master' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setDifficulty(item.id);
                    if (!mathRunning) {
                      setMathQuestion(generateSpeedMathQuestion(item.id));
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    difficulty === item.id
                      ? 'bg-sky-500/25 border-sky-400/55 text-sky-100'
                      : 'bg-slate-900/75 border-sky-400/15 text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live HUD */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="px-4 py-3 rounded-2xl bg-slate-900/80 border border-sky-400/20">
              <p className="text-[11px] text-slate-400">Waktu</p>
              <p
                data-testid="speedmath-timer"
                className={`font-hud text-xl font-bold tabular-nums ${
                  mathTimeLeft <= 8 && mathRunning ? 'text-rose-400' : 'text-white'
                }`}
              >
                {mathTimeLeft} dtk
              </p>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-900/80 border border-sky-400/20">
              <p className="text-[11px] text-slate-400">Skor</p>
              <p
                data-testid="speedmath-score"
                className="font-hud text-xl font-bold text-sky-300 tabular-nums"
              >
                {mathScore}
              </p>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-900/80 border border-sky-400/20">
              <p className="text-[11px] text-slate-400">Combo Streak</p>
              <p className="font-hud text-xl font-bold text-amber-300 tabular-nums">
                {mathStreak}x
              </p>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-900/80 border border-sky-400/20">
              <p className="text-[11px] text-slate-400">Rekor Terbaik</p>
              <p className="font-hud text-xl font-bold text-emerald-300 tabular-nums">
                {bestScore}
              </p>
            </div>
          </div>

          {!mathRunning ? (
            <div className="rounded-2xl bg-slate-900/75 border border-sky-400/20 p-6 sm:p-8 text-center space-y-4">
              {mathFinished ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
                    Waktu Habis!
                  </p>
                  <p className="font-display text-3xl font-bold text-white tabular-nums">
                    Skor Akhir: {mathScore} Poin
                  </p>
                  <p className="text-xs text-slate-300">
                    Kamu menjawab benar <strong>{mathCorrectCount}</strong> soal dalam 30 detik.
                    {mathScore >= bestScore && mathScore > 0 ? ' Rekor pribadi baru!' : ''}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-2xl font-bold text-white">
                    Siap Uji Kecepatan Berhitung?
                  </p>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    Jawab sebanyak mungkin soal hitungan, aljabar, dan pola bilangan dalam 30 detik.
                    Pilih tingkat kesulitan lalu tekan mulai!
                  </p>
                </>
              )}
              <button
                type="button"
                id="btn-start-speedmath"
                onClick={() => startSpeedMath(difficulty)}
                className="btn-gold px-7 py-3 rounded-xl text-sm font-extrabold"
              >
                {mathFinished ? 'Main Lagi' : 'Mulai Kilat Hitung'}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-900/80 border border-sky-400/30 p-6 space-y-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-sky-300 font-semibold">{mathQuestion.hint}</span>
                {mathFeedback && (
                  <span
                    className={`font-bold ${
                      mathFeedback === 'correct' ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {mathFeedback === 'correct' ? '✓ Tepat!' : '✕ Kurang tepat, lanjut!'}
                  </span>
                )}
              </div>

              <p
                data-testid="speedmath-prompt"
                className="font-display text-2xl sm:text-4xl font-bold text-white text-center py-3 tabular-nums"
              >
                {mathQuestion.prompt}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {mathQuestion.choices.map((choice, idx) => (
                  <button
                    key={`${choice}-${idx}`}
                    type="button"
                    data-testid={`speedmath-choice-${idx}`}
                    onClick={() => handleSpeedMathAnswer(choice)}
                    className="py-3.5 px-4 rounded-2xl bg-slate-800/90 hover:bg-sky-500/25 border border-sky-400/30 hover:border-sky-300 font-hud text-lg font-bold text-white transition tabular-nums"
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INTERACTIVE 3D FLASHCARDS */}
      {activeTab === 'flashcards' && (
        <div className="hero-glow-card holo-top-beam rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-bold text-white">
                Flashcard 3D Rumus &amp; Konsep Inti
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Klik kartu untuk membalik 3D · Penguasaan: {masteredCount}/{allCards.length} kartu (
                {masteryPercent}%)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddCard((v) => !v)}
              className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/40 text-sky-100 text-xs font-bold transition whitespace-nowrap"
            >
              {showAddCard ? 'Tutup Form' : '+ Tambah Kartu Sendiri'}
            </button>
          </div>

          {/* Subject Filter */}
          <div className="flex flex-wrap gap-1.5">
            {SUBJECT_FILTERS.map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => {
                  setSubjectFilter(subj);
                  setCardIndex(0);
                  setIsFlipped(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  subjectFilter === subj
                    ? 'bg-sky-500/25 border-sky-400/55 text-sky-100'
                    : 'bg-slate-900/75 border-sky-400/15 text-slate-400 hover:text-white'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>

          {showAddCard && (
            <form
              onSubmit={handleAddCustomCard}
              className="p-4 rounded-2xl bg-slate-900/85 border border-sky-400/30 grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <input
                type="text"
                value={newCardFront}
                onChange={(e) => setNewCardFront(e.target.value)}
                placeholder="Pertanyaan / Konsep depan..."
                aria-label="Pertanyaan kartu flashcard"
                required
                className="px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-sky-400/25 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
              />
              <input
                type="text"
                value={newCardBack}
                onChange={(e) => setNewCardBack(e.target.value)}
                placeholder="Jawaban / Penjelasan belakang..."
                aria-label="Jawaban kartu flashcard"
                required
                className="px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-sky-400/25 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCardFormula}
                  onChange={(e) => setNewCardFormula(e.target.value)}
                  placeholder="Rumus (opsional)"
                  aria-label="Rumus flashcard opsional"
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-sky-400/25 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
                <button
                  type="submit"
                  className="btn-gold px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap"
                >
                  Simpan
                </button>
              </div>
            </form>
          )}

          {activeCard ? (
            <div className="space-y-4">
              {/* 3D Flip Card */}
              <div className="flashcard-perspective w-full">
                <button
                  type="button"
                  data-testid="flashcard-flip-surface"
                  onClick={() => setIsFlipped((f) => !f)}
                  aria-label="Balik kartu flashcard"
                  className="w-full text-left focus:outline-none"
                >
                  <div
                    className={`flashcard-inner relative w-full min-h-[210px] ${
                      isFlipped ? 'is-flipped' : ''
                    }`}
                  >
                    {/* Front Face */}
                    <div className="flashcard-face flashcard-front absolute inset-0 rounded-2xl p-6 sm:p-7 bg-gradient-to-br from-slate-900 via-slate-900/95 to-indigo-950/90 border border-sky-400/35 flex flex-col justify-between">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-400/35 text-[11px] font-bold text-sky-200">
                          {activeCard.subject}
                        </span>
                        <span className="text-[11px] text-slate-400 tabular-nums">
                          Kartu {safeCardIdx + 1} / {filteredCards.length} · Klik untuk balik
                        </span>
                      </div>
                      <p className="font-display text-lg sm:text-2xl font-bold text-white leading-snug my-4">
                        {activeCard.front}
                      </p>
                      <p className="text-xs text-sky-300 font-semibold">
                        ↻ Ketuk kartu untuk melihat rumus &amp; penjelasan
                      </p>
                    </div>

                    {/* Back Face */}
                    <div className="flashcard-face flashcard-back absolute inset-0 rounded-2xl p-6 sm:p-7 bg-gradient-to-br from-indigo-950/95 via-slate-900 to-teal-950/90 border border-teal-400/45 flex flex-col justify-between">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 border border-teal-400/35 text-[11px] font-bold text-teal-200">
                          Pembahasan · {activeCard.subject}
                        </span>
                        <span className="text-[11px] text-slate-400">Klik untuk kembali</span>
                      </div>
                      <div className="space-y-3 my-3">
                        {activeCard.formula && (
                          <div className="px-4 py-2.5 rounded-xl bg-slate-950/80 border border-sky-400/30 font-hud text-sm sm:text-base font-bold text-amber-300 text-center">
                            {activeCard.formula}
                          </div>
                        )}
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                          {activeCard.back}
                        </p>
                      </div>
                      <p className="text-[11px] text-teal-300 font-semibold">
                        Tandai &ldquo;Sudah Hafal&rdquo; di bawah jika kamu menguasai konsep ini
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Card Navigation & Mastery Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFlipped(false);
                      setCardIndex((i) => (i - 1 + filteredCards.length) % filteredCards.length);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800/85 hover:bg-slate-700 border border-sky-400/25 text-xs font-bold text-slate-200 transition"
                  >
                    ← Sebelumnya
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFlipped(false);
                      setCardIndex((i) => (i + 1) % filteredCards.length);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800/85 hover:bg-slate-700 border border-sky-400/25 text-xs font-bold text-slate-200 transition"
                  >
                    Berikutnya →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFlipped(false);
                      setCardIndex(Math.floor(Math.random() * filteredCards.length));
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800/85 hover:bg-slate-700 border border-sky-400/25 text-xs font-semibold text-sky-200 transition"
                  >
                    Acak Kartu
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => toggleMastered(activeCard.id)}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold transition ${
                    masteredIds.includes(activeCard.id)
                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                      : 'bg-sky-500/20 hover:bg-sky-500/35 border-sky-400/40 text-sky-100'
                  }`}
                >
                  {masteredIds.includes(activeCard.id) ? '✓ Sudah Hafal' : 'Tandai Sudah Hafal'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-sky-400/15 text-center text-xs text-slate-400">
              Belum ada kartu di kategori ini. Tambahkan kartu kustom milikmu di atas!
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EXAM COUNTDOWN & QUICK STUDY NOTES */}
      {activeTab === 'planner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Exam Countdowns */}
          <div className="lg:col-span-6 hero-glow-card holo-top-beam rounded-3xl p-6 space-y-4">
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                Hitung Mundur Target Ujian
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pantau sisa hari menuju ujian penting agar persiapan belajarmu selalu terukur.
              </p>
            </div>

            <div className="space-y-2.5">
              {examTargets.map((target) => {
                const rem = computeDaysRemaining(target.targetDate);
                return (
                  <div
                    key={target.id}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-sky-400/20 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{target.title}</p>
                      <p className="text-[11px] text-slate-400 tabular-nums">{target.targetDate}</p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="px-3 py-1 rounded-xl bg-sky-500/20 border border-sky-400/35 font-hud text-xs font-bold text-sky-200 tabular-nums">
                        {rem.isPast ? 'Hari H / Lewat' : `H-${rem.days} (${rem.hours}j)`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteExamTarget(target.id)}
                        aria-label={`Hapus target ${target.title}`}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-500/25 text-slate-400 hover:text-rose-200 text-xs transition"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleAddExamTarget} className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2">
              <input
                type="text"
                value={newTargetTitle}
                onChange={(e) => setNewTargetTitle(e.target.value)}
                placeholder="Nama ujian (mis. Ulangan Fisika)"
                aria-label="Nama target ujian"
                required
                className="sm:col-span-6 px-3 py-2 rounded-xl bg-slate-950/90 border border-sky-400/25 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
              />
              <input
                type="date"
                value={newTargetDate}
                onChange={(e) => setNewTargetDate(e.target.value)}
                aria-label="Tanggal target ujian"
                required
                className="sm:col-span-4 px-3 py-2 rounded-xl bg-slate-950/90 border border-sky-400/25 text-xs text-white focus:outline-none focus:border-sky-400"
              />
              <button
                type="submit"
                className="sm:col-span-2 btn-gold py-2 px-3 rounded-xl text-xs font-extrabold whitespace-nowrap"
              >
                + Tambah
              </button>
            </form>
          </div>

          {/* Quick Study Notes */}
          <div className="lg:col-span-6 hero-glow-card holo-top-beam rounded-3xl p-6 space-y-4">
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                Catatan Cepat &amp; Checklist Belajar
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simpan pengingat bab, rumus, atau tugas belajar langsung di browser kamu.
              </p>
            </div>

            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Tulis catatan belajar baru..."
                aria-label="Tulis catatan belajar baru"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-sky-400/25 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
              />
              <button
                type="submit"
                className="btn-gold px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap"
              >
                Simpan
              </button>
            </form>

            <div data-testid="quick-notes-list" className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {quickNotes.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center rounded-2xl bg-slate-900/60 border border-sky-400/15">
                  Belum ada catatan. Tulis target belajarmu di atas!
                </p>
              ) : (
                quickNotes.map((note) => (
                  <div
                    key={note.id}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-sky-400/20 flex items-center justify-between gap-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleNote(note.id)}
                      className="flex items-center gap-2.5 text-left min-w-0 flex-1"
                    >
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] font-bold shrink-0 ${
                          note.done
                            ? 'bg-emerald-400 border-emerald-300 text-slate-950'
                            : 'border-slate-500 text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                      <span
                        className={`text-xs truncate ${
                          note.done ? 'line-through text-slate-500' : 'text-slate-100'
                        }`}
                      >
                        {note.text}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      aria-label={`Hapus catatan ${note.text}`}
                      className="px-2 py-0.5 rounded-lg text-slate-400 hover:text-rose-300 text-xs transition"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KALKULATOR SKOR SKD KEDINASAN & UTBK-SNBT */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SKD Kedinasan Passing Grade Calculator */}
          <div className="lg:col-span-6 hero-glow-card holo-top-beam rounded-3xl p-6 space-y-5">
            <div>
              <p className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                Simulasi Passing Grade Kedinasan
              </p>
              <h3 className="font-display text-lg font-bold text-white mt-0.5">
                Kalkulator SKD Kedinasan (TWK · TIU · TKP)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ambang batas resmi: TWK ≥ 65 · TIU ≥ 80 · TKP ≥ 166 (Maksimal 550)
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="calc-skd-twk" className="block text-[11px] font-bold text-slate-300 mb-1">
                  TWK (0–150)
                </label>
                <input
                  id="calc-skd-twk"
                  type="number"
                  min={0}
                  max={150}
                  value={skdTwk}
                  onChange={(e) => setSkdTwk(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-purple-400/35 text-sm font-hud font-bold text-white outline-none focus:border-purple-400"
                />
                <p className={`text-[10px] font-bold mt-1 ${skdResult.twkPassed ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {skdResult.twkPassed ? '✓ Lulus PG (≥65)' : '✕ Belum PG'}
                </p>
              </div>
              <div>
                <label htmlFor="calc-skd-tiu" className="block text-[11px] font-bold text-slate-300 mb-1">
                  TIU (0–175)
                </label>
                <input
                  id="calc-skd-tiu"
                  type="number"
                  min={0}
                  max={175}
                  value={skdTiu}
                  onChange={(e) => setSkdTiu(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-purple-400/35 text-sm font-hud font-bold text-white outline-none focus:border-purple-400"
                />
                <p className={`text-[10px] font-bold mt-1 ${skdResult.tiuPassed ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {skdResult.tiuPassed ? '✓ Lulus PG (≥80)' : '✕ Belum PG'}
                </p>
              </div>
              <div>
                <label htmlFor="calc-skd-tkp" className="block text-[11px] font-bold text-slate-300 mb-1">
                  TKP (0–225)
                </label>
                <input
                  id="calc-skd-tkp"
                  type="number"
                  min={0}
                  max={225}
                  value={skdTkp}
                  onChange={(e) => setSkdTkp(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-purple-400/35 text-sm font-hud font-bold text-white outline-none focus:border-purple-400"
                />
                <p className={`text-[10px] font-bold mt-1 ${skdResult.tkpPassed ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {skdResult.tkpPassed ? '✓ Lulus PG (≥166)' : '✕ Belum PG'}
                </p>
              </div>
            </div>

            <div
              data-testid="skd-calc-result"
              className={`p-4 rounded-2xl border ${
                skdResult.allPassed
                  ? 'bg-emerald-500/15 border-emerald-400/45'
                  : 'bg-rose-500/15 border-rose-400/40'
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-bold text-slate-200">Total Skor SKD:</span>
                <span className="font-hud text-2xl font-extrabold text-white tabular-nums">
                  {skdResult.total} / {skdResult.maxTotal}
                </span>
              </div>
              <p
                className={`text-xs font-bold mt-1 ${
                  skdResult.allPassed ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {skdResult.statusLabel}
              </p>
            </div>
          </div>

          {/* UTBK-SNBT Target Score Calculator */}
          <div className="lg:col-span-6 hero-glow-card holo-top-beam rounded-3xl p-6 space-y-5">
            <div>
              <p className="text-[11px] font-bold text-sky-300 uppercase tracking-wider">
                Estimasi Peluang PTN Impian
              </p>
              <h3 className="font-display text-lg font-bold text-white mt-0.5">
                Kalkulator Rata-Rata Skor UTBK-SNBT
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Masukkan estimasi skor (0–1000) per rumpun subtes untuk melihat daya saingmu.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Penalaran Umum (TPS)', idx: 0 },
                { label: 'Pengetahuan Kuantitatif', idx: 1 },
                { label: 'Literasi Bahasa ID & EN', idx: 2 },
                { label: 'Penalaran Matematika', idx: 3 },
              ].map((item) => (
                <div key={item.label}>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {item.label}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={utbkScores[item.idx]}
                    onChange={(e) => {
                      const next = [...utbkScores] as [number, number, number, number];
                      next[item.idx] = Number(e.target.value);
                      setUtbkScores(next);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-sky-400/30 text-sm font-hud font-bold text-white outline-none focus:border-sky-400"
                  />
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-sky-500/15 border border-sky-400/40">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-bold text-slate-200">Rata-Rata Skor UTBK:</span>
                <span className="font-hud text-2xl font-extrabold text-sky-300 tabular-nums">
                  {utbkResult.average}
                </span>
              </div>
              <p className="text-xs font-semibold text-sky-200 mt-1">{utbkResult.tierLabel}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
