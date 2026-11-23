import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Flame,
  LayoutGrid,
  List,
  ListOrdered,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  X,
  XCircle,
  Zap,
  ZoomIn,
} from 'lucide-react';
import type { LeaderboardEntry, QuizQuestion } from '../types/quiz';

const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

const AI_EXTENSION_PATTERN =
  /(chatgpt|openai|gemini|google[-_]?lens|claude|copilot|monica|sider|merlin|harpa|maxai|perplexity|blackbox|quillbot|liner[-_]?ai|deepseek|ai[-_]?sidebar|ai[-_]?assistant)/i;

interface QuizViewProps {
  quizTitle: string;
  questions: QuizQuestion[];
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  answersByIndex: Record<number, number>;
  flaggedIndices: number[];
  score: number;
  streak: number;
  cheatCount: number;
  liveLeaderboard: (LeaderboardEntry & { rank: number })[];
  powerup5050Used: boolean;
  hiddenChoiceIndices: number[];
  selectedChoice: number | null;
  onSelectChoice: (idx: number) => void;
  onUse5050: () => void;
  onJumpToQuestion: (index: number) => void;
  onToggleFlagQuestion: (index: number) => void;
  onNextQuestion: () => void;
  onFinishQuiz: () => void;
  onCheatDetected: (reason: string) => void;
  onExitQuiz?: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  quizTitle,
  questions,
  question,
  questionIndex,
  totalQuestions,
  answersByIndex,
  flaggedIndices,
  score,
  streak,
  cheatCount,
  liveLeaderboard,
  powerup5050Used,
  hiddenChoiceIndices,
  selectedChoice,
  onSelectChoice,
  onUse5050,
  onJumpToQuestion,
  onToggleFlagQuestion,
  onNextQuestion,
  onFinishQuiz,
  onCheatDetected,
  onExitQuiz,
}) => {
  const [zoomOpen, setZoomOpen] = useState(false);
  const [showLiveBoard, setShowLiveBoard] = useState(false);
  const [showQuestionNavigator, setShowQuestionNavigator] = useState(false);
  const [navigatorFilter, setNavigatorFilter] = useState<
    'all' | 'unanswered' | 'flagged' | 'answered'
  >('all');
  const [navigatorViewMode, setNavigatorViewMode] = useState<'grid' | 'list'>('grid');
  const [warningModal, setWarningModal] = useState<{
    reason: string;
    detail: string;
    count: number;
  } | null>(null);

  const lastViolationAtRef = useRef<number>(0);
  const cheatCountRef = useRef<number>(cheatCount);
  cheatCountRef.current = cheatCount;
  const onCheatRef = useRef(onCheatDetected);
  onCheatRef.current = onCheatDetected;

  useEffect(() => {
    const triggerViolation = (reason: string, detail: string) => {
      const now = Date.now();
      if (now - lastViolationAtRef.current < 1600) return;
      lastViolationAtRef.current = now;
      const nextCount = cheatCountRef.current + 1;
      onCheatRef.current(reason);
      setWarningModal({ reason, detail, count: nextCount });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation(
          'Berpindah Tab / Membuka Aplikasi Lain',
          'Sistem mendeteksi Anda meninggalkan layar kuis (beralih tab atau membuka aplikasi asisten lainnya). Pelanggaran ini tercatat otomatis pada papan peringkat & laporan Admin.'
        );
      }
    };

    const handleWindowBlur = () => {
      if (!document.hidden) {
        triggerViolation(
          'Fokus Layar Berpindah (Split-Screen / Jendela Lain)',
          'Sistem mendeteksi fokus berpindah keluar dari jendela kuis. Tetap berada di layar evaluasi hingga selesai.'
        );
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerViolation(
        'Klik Kanan Diblokir',
        'Klik kanan dan menu konteks dinonaktifkan selama evaluasi berlangsung.'
      );
    };

    const handleCopyOrCut = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerViolation(
        'Menyalin Teks Soal Diblokir',
        'Menyalin teks soal dilarang selama evaluasi berlangsung.'
      );
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrlOrMeta = e.ctrlKey || e.metaKey;

      if (
        key === 'printscreen' ||
        key === 'f12' ||
        (ctrlOrMeta && ['c', 'v', 'x', 'u', 's', 'p'].includes(key)) ||
        (ctrlOrMeta && e.shiftKey && ['i', 'j', 'c', 's', '3', '4', '5'].includes(key))
      ) {
        e.preventDefault();
        triggerViolation(
          'Pintasan Salin / Tangkapan Layar / Inspect Diblokir',
          'Penggunaan pintasan salin, tangkapan layar, atau DevTools terdeteksi dan diblokir.'
        );
      }
    };

    const scanAiOverlays = () => {
      const nodes = document.querySelectorAll(
        'body > div, body > iframe, body > section, body > aside'
      );
      for (const el of Array.from(nodes)) {
        if (el.id === 'root') continue;
        const sig = `${el.id} ${typeof el.className === 'string' ? el.className : ''} ${el.tagName} ${el.getAttribute('src') || ''}`;
        if (AI_EXTENSION_PATTERN.test(sig)) {
          triggerViolation(
            'Ekstensi / Sidebar Eksternal Terdeteksi',
            'Sistem mendeteksi ekstensi atau sidebar eksternal aktif di halaman kuis. Harap tutup ekstensi tersebut segera.'
          );
          return;
        }
      }

      if (
        typeof window.outerWidth === 'number' &&
        window.outerWidth > 0 &&
        window.outerWidth - window.innerWidth > 260
      ) {
        triggerViolation(
          'Panel Samping / DevTools Terdeteksi',
          'Lebar panel samping browser terdeteksi tidak normal. Tutup panel samping untuk melanjutkan.'
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyOrCut);
    document.addEventListener('cut', handleCopyOrCut);
    document.addEventListener('dragstart', handleDragStart);
    window.addEventListener('keydown', handleKeyDown, true);
    const intervalId = window.setInterval(scanAiOverlays, 3500);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyOrCut);
      document.removeEventListener('cut', handleCopyOrCut);
      document.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.clearInterval(intervalId);
    };
  }, []);

  const answered = selectedChoice !== null;
  const isCorrect = selectedChoice === question.correctIndex;
  const answeredCount = Object.keys(answersByIndex).length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const pct = Math.round((answeredCount / Math.max(1, totalQuestions)) * 100);
  const isLast = questionIndex + 1 >= totalQuestions;
  const isCurrentFlagged = flaggedIndices.includes(questionIndex);

  // Clean keyboard navigation & answer selection (A-E / 1-5, Left/Right arrows)
  useEffect(() => {
    const onShortcutKey = (e: KeyboardEvent) => {
      if (warningModal || zoomOpen) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const upper = e.key.toUpperCase();
      const letterIdx = LETTERS.indexOf(upper as (typeof LETTERS)[number]);
      const numberIdx = ['1', '2', '3', '4', '5'].indexOf(e.key);
      const pickedIdx = letterIdx >= 0 ? letterIdx : numberIdx;

      if (
        pickedIdx >= 0 &&
        pickedIdx < question.choices.length &&
        !answered &&
        !hiddenChoiceIndices.includes(pickedIdx)
      ) {
        e.preventDefault();
        onSelectChoice(pickedIdx);
        return;
      }

      if (e.key === 'ArrowLeft' && questionIndex > 0) {
        e.preventDefault();
        onJumpToQuestion(questionIndex - 1);
      } else if (e.key === 'ArrowRight' && !(isLast && unansweredCount === 0)) {
        e.preventDefault();
        onNextQuestion();
      }
    };

    window.addEventListener('keydown', onShortcutKey);
    return () => window.removeEventListener('keydown', onShortcutKey);
  }, [
    warningModal,
    zoomOpen,
    answered,
    hiddenChoiceIndices,
    question.choices.length,
    questionIndex,
    isLast,
    unansweredCount,
    onSelectChoice,
    onJumpToQuestion,
    onNextQuestion,
  ]);

  const visibleNavigatorItems = questions
    .map((q, idx) => {
      const choice = answersByIndex[idx];
      const isAnswered = choice !== undefined;
      const isRight = isAnswered && choice === q.correctIndex;
      const isFlagged = flaggedIndices.includes(idx);
      return { q, idx, isAnswered, isRight, isFlagged };
    })
    .filter((item) => {
      if (navigatorFilter === 'unanswered') return !item.isAnswered;
      if (navigatorFilter === 'flagged') return item.isFlagged;
      if (navigatorFilter === 'answered') return item.isAnswered;
      return true;
    });

  const handleJumpFirstUnanswered = () => {
    const afterIdx = questions.findIndex(
      (_, idx) => idx > questionIndex && answersByIndex[idx] === undefined
    );
    const targetIdx =
      afterIdx >= 0
        ? afterIdx
        : questions.findIndex((_, idx) => answersByIndex[idx] === undefined);
    if (targetIdx >= 0) {
      onJumpToQuestion(targetIdx);
      setShowQuestionNavigator(false);
    }
  };

  return (
    <section id="view-quiz" className="max-w-4xl mx-auto space-y-4 select-none">
      {/* Anti-Cheat Warning Modal */}
      {warningModal && (
        <div
          id="modal-anticheat-warning"
          role="alertdialog"
          aria-modal="true"
          aria-label="Peringatan Pelanggaran"
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="glass-card w-full max-w-md rounded-2xl p-6 border border-rose-500/60 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                Peringatan Integritas #{warningModal.count}
              </p>
              <h3 className="font-display text-lg font-bold text-white">{warningModal.reason}</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
              {warningModal.detail}
            </p>
            <button
              type="button"
              onClick={() => setWarningModal(null)}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition"
            >
              Kembali ke Soal
            </button>
          </div>
        </div>
      )}

      {/* Top Exam Telemetry & Controls */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm">
            <span
              id="quiz-progress-label"
              className="font-display font-bold text-white tabular-nums"
            >
              Soal {questionIndex + 1} / {totalQuestions}
            </span>
            <span className="text-slate-600" aria-hidden="true">
              |
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${
                cheatCount > 0
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              {cheatCount > 0 ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{cheatCount}x Peringatan</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Mode Pengawasan Aktif</span>
                </>
              )}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-toggle-question-nav"
              onClick={() => setShowQuestionNavigator((v) => !v)}
              className={`px-3 py-1.5 rounded-xl border font-semibold text-xs inline-flex items-center gap-1.5 transition ${
                showQuestionNavigator
                  ? 'bg-indigo-600 text-white border-indigo-400'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span className="tabular-nums">
                Daftar Soal ({answeredCount}/{totalQuestions})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowLiveBoard((v) => !v)}
              className={`px-3 py-1.5 rounded-xl border font-semibold text-xs inline-flex items-center gap-1.5 transition ${
                showLiveBoard
                  ? 'bg-indigo-600 text-white border-indigo-400'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="tabular-nums">Peringkat ({liveLeaderboard.length})</span>
            </button>

            <button
              type="button"
              id="btn-powerup-5050"
              disabled={powerup5050Used || answered}
              onClick={onUse5050}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-amber-300 font-semibold text-xs inline-flex items-center gap-1.5 transition"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{powerup5050Used ? '50:50 Terpakai' : '50:50'}</span>
            </button>

            <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-emerald-300 font-bold text-xs tabular-nums">
              Skor <span id="quiz-live-score">{score}</span>
            </div>

            <div className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-amber-300 font-bold text-xs inline-flex items-center gap-1 tabular-nums">
              <Flame className="w-3.5 h-3.5" />
              <span id="quiz-live-streak">{streak}</span>
            </div>

            {onExitQuiz && (
              <button
                type="button"
                id="btn-exit-quiz"
                onClick={onExitQuiz}
                className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-rose-950/90 border border-slate-700 hover:border-rose-500/50 text-rose-300 font-semibold text-xs inline-flex items-center gap-1.5 transition whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            )}
          </div>
        </div>

        <div className="w-full h-1.5 rounded-full bg-slate-800/90 overflow-hidden">
          <div
            id="quiz-progress-bar"
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex flex-wrap justify-between gap-2 text-[11px] text-slate-400 font-medium">
          <span className="truncate">{quizTitle}</span>
          <span className="tabular-nums">
            Terjawab {answeredCount}/{totalQuestions} ({pct}%) · Tersisa {unansweredCount} soal
          </span>
        </div>

        {/* Question Navigator Panel */}
        {showQuestionNavigator && (
          <div
            id="quiz-question-navigator"
            className="mt-2 p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs sm:text-sm font-bold text-white">
                  Navigasi Nomor Soal ({totalQuestions} Soal)
                </p>
                <p className="text-[11px] text-slate-400">
                  Pilih nomor soal mana saja untuk melompat langsung.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setNavigatorViewMode((m) => (m === 'grid' ? 'list' : 'grid'))}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-200 inline-flex items-center gap-1 transition"
                >
                  {navigatorViewMode === 'grid' ? (
                    <>
                      <List className="w-3.5 h-3.5" />
                      <span>Teks Soal</span>
                    </>
                  ) : (
                    <>
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Grid Angka</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuestionNavigator(false)}
                  aria-label="Tutup navigasi soal"
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'all', label: `Semua (${totalQuestions})` },
                    { id: 'unanswered', label: `Belum (${unansweredCount})` },
                    { id: 'flagged', label: `Ragu (${flaggedIndices.length})` },
                    { id: 'answered', label: `Terjawab (${answeredCount})` },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setNavigatorFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      navigatorFilter === f.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" /> Aktif
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Benar
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Salah
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Ragu
                </span>
              </div>
            </div>

            {visibleNavigatorItems.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">
                Tidak ada soal pada filter ini.
              </p>
            ) : navigatorViewMode === 'grid' ? (
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-0.5">
                {visibleNavigatorItems.map(({ q, idx, isAnswered, isRight, isFlagged }) => {
                  const isActive = idx === questionIndex;
                  let btnStyle =
                    'bg-slate-900 border-slate-700 text-slate-200 hover:border-indigo-400/70 hover:bg-slate-800';
                  if (isAnswered) {
                    btnStyle = isRight
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200'
                      : 'bg-rose-500/20 border-rose-500/60 text-rose-200';
                  } else if (isFlagged) {
                    btnStyle = 'bg-amber-500/20 border-amber-500/60 text-amber-200';
                  }
                  if (isActive) {
                    btnStyle += ' ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-950 font-bold';
                  }

                  return (
                    <button
                      key={q.id || idx}
                      type="button"
                      title={`No. ${idx + 1}: ${q.question.slice(0, 90)}`}
                      onClick={() => onJumpToQuestion(idx)}
                      className={`relative h-9 rounded-lg border text-xs font-bold tabular-nums transition flex items-center justify-center ${btnStyle}`}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <span
                          aria-label="Ditandai ragu-ragu"
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-950"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {visibleNavigatorItems.map(({ q, idx, isAnswered, isRight, isFlagged }) => {
                  const isActive = idx === questionIndex;
                  return (
                    <button
                      key={q.id || idx}
                      type="button"
                      onClick={() => {
                        onJumpToQuestion(idx);
                        setShowQuestionNavigator(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-indigo-600/20 border-indigo-400'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 font-bold text-xs tabular-nums shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="text-xs text-slate-200 line-clamp-2">{q.question}</span>
                      </div>
                      <span className="text-[11px] font-semibold shrink-0 whitespace-nowrap inline-flex items-center gap-1">
                        {isAnswered ? (
                          isRight ? (
                            <span className="text-emerald-300 inline-flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Benar
                            </span>
                          ) : (
                            <span className="text-rose-300 inline-flex items-center gap-1">
                              <X className="w-3.5 h-3.5" /> Salah
                            </span>
                          )
                        ) : isFlagged ? (
                          <span className="text-amber-300 inline-flex items-center gap-1">
                            <Flag className="w-3.5 h-3.5" /> Ragu
                          </span>
                        ) : (
                          <span className="text-slate-400">Belum</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              {unansweredCount > 0 ? (
                <button
                  type="button"
                  onClick={handleJumpFirstUnanswered}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-indigo-300 text-xs font-semibold transition"
                >
                  Lompat ke Soal Belum Dijawab
                </button>
              ) : (
                <span className="text-xs font-semibold text-emerald-300 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Semua {totalQuestions} soal sudah dijawab</span>
                </span>
              )}
              <button
                type="button"
                onClick={onFinishQuiz}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
              >
                Selesai &amp; Lihat Hasil
              </button>
            </div>
          </div>
        )}

        {/* Collapsible Live Standings */}
        {showLiveBoard && (
          <div className="mt-2 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-white inline-flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Peringkat Live ({liveLeaderboard.length} Peserta)</span>
              </p>
              <button
                type="button"
                onClick={() => setShowLiveBoard(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {liveLeaderboard.length === 0 ? (
              <p className="text-xs text-slate-400">Belum ada skor peserta yang tercatat.</p>
            ) : (
              <div className="max-h-52 overflow-y-auto custom-scrollbar divide-y divide-slate-800/80">
                {liveLeaderboard.map((entry) => (
                  <div
                    key={entry.id}
                    className={`py-2 px-2.5 flex items-center justify-between gap-2 text-xs ${
                      entry.isCurrentUser ? 'bg-indigo-500/15 rounded-lg' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-amber-300 w-6 tabular-nums">
                        #{entry.rank}
                      </span>
                      <span className="font-semibold text-white truncate">
                        {entry.name} {entry.isCurrentUser ? '(Kamu)' : ''}
                      </span>
                      {entry.cheatCount && entry.cheatCount > 0 ? (
                        <span className="text-[10px] font-bold text-rose-300 shrink-0">
                          {entry.cheatCount}x Peringatan
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 tabular-nums">
                      <span className="text-emerald-300 font-semibold">Nilai {entry.grade}</span>
                      <span className="text-indigo-300 font-bold">{entry.points} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Question Workspace Card */}
      <div className="glass-card p-5 sm:p-8 rounded-2xl space-y-6">
        {question.image && (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              title="Klik untuk memperbesar gambar soal"
              className="group relative w-full rounded-xl overflow-hidden border border-slate-700/80 hover:border-indigo-400/70 bg-slate-950/80 max-h-80 flex items-center justify-center cursor-zoom-in transition"
            >
              <img
                src={question.image}
                alt="Gambar Soal"
                referrerPolicy="no-referrer"
                draggable={false}
                className="max-h-80 w-auto object-contain"
              />
              <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-slate-950/85 border border-slate-700 text-[11px] font-medium text-slate-200 inline-flex items-center gap-1 opacity-90 group-hover:opacity-100">
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Perbesar</span>
              </span>
            </button>
          </div>
        )}

        {zoomOpen && question.image && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Perbesar Gambar Soal"
            onClick={() => setZoomOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/92 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <img
              src={question.image}
              alt="Gambar Soal Diperbesar"
              referrerPolicy="no-referrer"
              draggable={false}
              className="max-w-full max-h-[90vh] rounded-xl border border-slate-700 shadow-2xl object-contain"
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
              Pertanyaan No. {questionIndex + 1}
            </span>
            <span className="hidden sm:inline text-[11px] text-slate-400">
              Pintasan: A–E / 1–5 untuk memilih · Panah kiri/kanan untuk navigasi
            </span>
          </div>
          <h2
            id="quiz-question-text"
            className="font-display text-lg sm:text-2xl font-bold text-white leading-snug"
          >
            {question.question}
          </h2>
        </div>

        {/* Clean Crisp Choice Cards */}
        <div id="quiz-choices-grid" className="grid grid-cols-1 gap-2.5">
          {question.choices.map((choiceText, idx) => {
            const isHidden = hiddenChoiceIndices.includes(idx);
            const isSelected = selectedChoice === idx;
            const isRightChoice = idx === question.correctIndex;

            let stateClass = 'quiz-choice-btn';
            let keyClass = 'quiz-choice-key';
            if (answered) {
              if (isRightChoice) {
                stateClass =
                  'bg-emerald-500/15 border-emerald-400/80 text-white ring-1 ring-emerald-400/40';
                keyClass = 'bg-emerald-500 border-emerald-400 text-slate-950';
              } else if (isSelected && !isRightChoice) {
                stateClass = 'bg-rose-500/15 border-rose-400/80 text-white ring-1 ring-rose-400/40';
                keyClass = 'bg-rose-500 border-rose-400 text-white';
              } else {
                stateClass = 'bg-slate-900/45 border-slate-800/80 text-slate-400 opacity-55';
                keyClass = 'bg-slate-900 border-slate-800 text-slate-500';
              }
            } else if (isHidden) {
              stateClass =
                'bg-slate-900/30 border-slate-800/50 text-slate-500 opacity-35 line-through cursor-not-allowed';
              keyClass = 'bg-slate-900 border-slate-800 text-slate-600';
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={answered || isHidden}
                onClick={() => onSelectChoice(idx)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${stateClass}`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <span
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${keyClass}`}
                  >
                    {LETTERS[idx]}
                  </span>
                  <span className="text-sm sm:text-base font-medium leading-snug pt-1">
                    {choiceText}
                  </span>
                </div>
                {answered && isRightChoice && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 shrink-0 whitespace-nowrap">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Benar</span>
                  </span>
                )}
                {answered && isSelected && !isRightChoice && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-300 shrink-0 whitespace-nowrap">
                    <XCircle className="w-4 h-4" />
                    <span>Salah</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback & Explanation */}
        {answered && (
          <div
            id="quiz-feedback-box"
            className={`p-4 sm:p-5 rounded-xl border ${
              isCorrect
                ? 'bg-emerald-500/10 border-emerald-500/35'
                : 'bg-rose-500/10 border-rose-500/35'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <p
                    className={`text-sm sm:text-base font-bold ${
                      isCorrect ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {isCorrect ? 'Jawaban Benar' : 'Jawaban Kurang Tepat'}
                  </p>
                </div>

                {!isCorrect && (
                  <p className="text-xs sm:text-sm font-semibold text-emerald-300">
                    Kunci jawaban: {LETTERS[question.correctIndex]}.{' '}
                    {question.choices[question.correctIndex]}
                  </p>
                )}

                <div className="p-3.5 rounded-lg bg-slate-950/75 border border-slate-800">
                  <p className="text-[11px] font-bold text-indigo-300 mb-1 inline-flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Pembahasan</span>
                  </p>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {question.explanation}
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-next-question"
                onClick={isLast && unansweredCount === 0 ? onFinishQuiz : onNextQuestion}
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shrink-0 whitespace-nowrap transition"
              >
                <span>
                  {isLast && unansweredCount === 0
                    ? 'Lihat Hasil & Sertifikat'
                    : unansweredCount > 0 && isLast
                      ? `Ke Soal Belum Dijawab (${unansweredCount})`
                      : 'Soal Berikutnya'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Question Navigation Bar */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-prev-question"
              disabled={questionIndex <= 0}
              onClick={() => onJumpToQuestion(Math.max(0, questionIndex - 1))}
              className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            <button
              type="button"
              id="btn-flag-question"
              onClick={() => onToggleFlagQuestion(questionIndex)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                isCurrentFlagged
                  ? 'bg-amber-500/20 border-amber-400/70 text-amber-200'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{isCurrentFlagged ? 'Ditandai Ragu' : 'Tandai Ragu'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowQuestionNavigator((v) => !v)}
              className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 transition tabular-nums"
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>
                Nomor ({questionIndex + 1}/{totalQuestions})
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-skip-next-question"
              disabled={isLast && unansweredCount === 0}
              onClick={onNextQuestion}
              className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-xs font-semibold text-indigo-300 inline-flex items-center gap-1.5 transition"
            >
              <span>{answered ? 'Berikutnya' : 'Lewati Dulu'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              id="btn-finish-quiz"
              onClick={onFinishQuiz}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
            >
              Selesai{unansweredCount === 0 ? ' & Lihat Nilai' : ''}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
