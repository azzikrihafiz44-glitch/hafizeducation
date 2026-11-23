import React, { useState } from 'react';
import { TUTORIAL_STEPS } from '../data/defaultQuiz';

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ open, onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);

  if (!open) return null;

  const step = TUTORIAL_STEPS[stepIndex];
  const isLast = stepIndex === TUTORIAL_STEPS.length - 1;

  return (
    <div
      id="modal-tutorial"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial Peserta"
      className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4"
    >
      <div className="glass-card w-full max-w-md rounded-3xl p-6 border border-sky-500/30 text-center space-y-4">
        <div className="text-5xl animate-float" aria-hidden="true">
          {step.emoji}
        </div>
        <h3 className="text-xl font-extrabold text-white">{step.title}</h3>
        <p className="text-sm text-slate-300 leading-relaxed">{step.desc}</p>
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold text-slate-300"
          >
            ← Sebelumnya
          </button>
          <span className="text-xs font-extrabold text-indigo-300 tabular-nums">
            {stepIndex + 1} / {TUTORIAL_STEPS.length}
          </span>
          <button
            type="button"
            onClick={() => {
              if (isLast) {
                setStepIndex(0);
                onClose();
              } else {
                setStepIndex((i) => i + 1);
              }
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-extrabold text-white"
          >
            {isLast ? 'Selesai ✓' : 'Berikutnya →'}
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-white underline"
        >
          Tutup Panduan
        </button>
      </div>
    </div>
  );
};
