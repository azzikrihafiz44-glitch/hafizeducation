import React, { useEffect, useRef } from 'react';
import type { LeaderboardEntry } from '../types/quiz';
import {
  downloadCanvasPNG,
  printCanvasCertificate,
  renderCertificateToCanvas,
  type CertificateData,
} from '../utils/certificate';

interface ResultsViewProps {
  finalGrade: number;
  totalPoints: number;
  correctCount: number;
  totalQuestions: number;
  rank: number;
  leaderboard: (LeaderboardEntry & { rank: number })[];
  certificateData: CertificateData;
  onExportExcel: () => void;
  onOpenCampusAnalysis?: (mode?: 'utbk' | 'kedinasan') => void;
  onBackHome: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  finalGrade,
  totalPoints,
  correctCount,
  totalQuestions,
  rank,
  leaderboard,
  certificateData,
  onExportExcel,
  onOpenCampusAnalysis,
  onBackHome,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      renderCertificateToCanvas(canvasRef.current, certificateData);
    }
  }, [certificateData]);

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    const safeName = certificateData.playerName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Peserta';
    downloadCanvasPNG(canvasRef.current, `Sertifikat_Astronot_Hafiz_Education_${safeName}.png`);
  };

  const handlePrint = () => {
    if (!canvasRef.current) return;
    printCanvasCertificate(canvasRef.current, `Sertifikat Astronot - ${certificateData.playerName}`);
  };

  return (
    <section id="view-results" className="space-y-8">
      <div className="text-center space-y-2.5">
        <p className="text-sky-300 text-xs font-semibold tracking-widest uppercase">
          Hasil Akhir &amp; Papan Peringkat Resmi
        </p>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-gold-gradient">
          Selamat Menyelesaikan Misi Kuis
        </h2>
        <p className="text-slate-300 text-sm max-w-xl mx-auto">
          Lihat peringkatmu di podium kehormatan dan unduh E-Sertifikat Astronot resmi dari Hafiz Education.
        </p>
      </div>

      {/* 4 Cosmic Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
        <div className="glass-card p-5 rounded-2xl text-center">
          <p className="text-xs text-slate-400 font-medium">Nilai Akhir (0–100)</p>
          <p id="res-final-grade" className="font-display text-3xl sm:text-4xl font-bold text-emerald-300 mt-1.5 tabular-nums">
            {finalGrade}
          </p>
        </div>
        <div className="glass-card p-5 rounded-2xl text-center">
          <p className="text-xs text-slate-400 font-medium">Total Poin</p>
          <p id="res-total-points" className="font-display text-3xl sm:text-4xl font-bold text-indigo-300 mt-1.5 tabular-nums">
            {totalPoints}
          </p>
        </div>
        <div className="glass-card p-5 rounded-2xl text-center">
          <p className="text-xs text-slate-400 font-medium">Jawaban Benar</p>
          <p id="res-correct-ratio" className="font-display text-3xl sm:text-4xl font-bold text-sky-300 mt-1.5 tabular-nums">
            {correctCount}/{totalQuestions}
          </p>
        </div>
        <div className="glass-card p-5 rounded-2xl text-center">
          <p className="text-xs text-slate-400 font-medium">Peringkat Room</p>
          <p id="res-rank-badge" className="font-display text-3xl sm:text-4xl font-bold text-gold-gradient mt-1.5 tabular-nums">
            #{rank}
          </p>
        </div>
      </div>

      {/* Podium & Astronaut Certificate Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 hero-glow-card p-6 rounded-3xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-xl font-bold text-white">
                Peringkat Semua Peserta ({leaderboard.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Live · Peringkat seluruh peserta di room ini terlihat oleh semua peserta
              </p>
            </div>
            <button
              type="button"
              onClick={onExportExcel}
              className="px-3.5 py-2 rounded-xl bg-slate-800/85 hover:bg-slate-700 border border-sky-400/35 text-sky-200 text-xs font-semibold transition whitespace-nowrap"
            >
              Unduh Excel
            </button>
          </div>

          {/* 3-Place Cosmic Podium */}
          <div id="results-podium" className="grid grid-cols-3 gap-3 items-end pt-4 px-2">
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <p className="text-xs font-bold text-sky-200 text-center truncate w-full">
                {top2?.name ?? '—'}
              </p>
              <p className="text-[11px] text-slate-400 tabular-nums mb-2">
                {top2 ? `${top2.points} pts` : ''}
              </p>
              <div className="w-full h-24 rounded-t-2xl bg-gradient-to-b from-sky-500/30 to-indigo-900/60 border border-sky-400/40 flex items-center justify-center font-display font-bold text-2xl text-sky-200">
                2
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center">
              <p className="text-xs sm:text-sm font-bold text-amber-300 text-center truncate w-full">
                {top1?.name ?? '—'}
              </p>
              <p className="text-[11px] text-amber-200/80 tabular-nums mb-2">
                {top1 ? `${top1.points} pts` : ''}
              </p>
              <div className="w-full h-32 rounded-t-2xl bg-gradient-to-b from-amber-400/30 to-indigo-900/70 border border-amber-300/50 flex items-center justify-center font-display font-bold text-3xl text-amber-200 shadow-sm">
                1
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <p className="text-xs font-bold text-indigo-200 text-center truncate w-full">
                {top3?.name ?? '—'}
              </p>
              <p className="text-[11px] text-slate-400 tabular-nums mb-2">
                {top3 ? `${top3.points} pts` : ''}
              </p>
              <div className="w-full h-20 rounded-t-2xl bg-gradient-to-b from-indigo-500/30 to-slate-900/70 border border-indigo-400/40 flex items-center justify-center font-display font-bold text-2xl text-indigo-200">
                3
              </div>
            </div>
          </div>

          {/* Full Leaderboard Table */}
          <div className="overflow-x-auto rounded-2xl border border-sky-400/20">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-900/90 text-slate-300 text-[11px] border-b border-sky-400/20">
                <tr>
                  <th className="py-3 px-3.5">Rank</th>
                  <th className="py-3 px-3.5">Nama Peserta</th>
                  <th className="py-3 px-2.5 text-center">Integritas</th>
                  <th className="py-3 px-2.5 text-center">Nilai</th>
                  <th className="py-3 px-3.5 text-right">Poin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-400/15 bg-slate-950/70">
                {leaderboard.map((entry) => (
                  <tr
                    key={entry.id}
                    className={entry.isCurrentUser ? 'bg-sky-500/15' : ''}
                  >
                    <td className="py-3 px-3.5 font-bold text-sky-300 tabular-nums">
                      #{entry.rank}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-white">
                      <div>
                        {entry.name}{' '}
                        {entry.isCurrentUser && (
                          <span className="text-xs text-sky-300 font-medium">(Kamu)</span>
                        )}
                      </div>
                      {entry.status === 'playing' && (
                        <span className="text-[10px] text-sky-400 font-medium">
                          Sedang mengerjakan ({entry.answeredCount ?? 0}/{entry.totalQuestions})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2.5 text-center whitespace-nowrap">
                      {entry.cheatCount && entry.cheatCount > 0 ? (
                        <span className="text-rose-400 text-[11px] font-semibold">
                          ⚠ {entry.cheatCount}x Peringatan
                        </span>
                      ) : (
                        <span className="text-emerald-300 text-[11px] font-medium">
                          ✓ Jujur
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2.5 text-center font-bold text-emerald-300 tabular-nums">
                      {entry.grade}
                    </td>
                    <td className="py-3 px-3.5 text-right font-bold text-indigo-300 tabular-nums">
                      {entry.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Astronaut Certificate Column */}
        <div className="lg:col-span-6 hero-glow-card p-6 rounded-3xl flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-xl font-bold text-white">
                Sertifikat Digital Tema Astronot
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Edisi Galaxy Mission · HD PNG Siap Cetak
              </p>
            </div>
            <span className="text-sky-300 text-xs font-semibold whitespace-nowrap">HD 1200×848</span>
          </div>

          <div className="rounded-2xl overflow-hidden border border-sky-400/35 bg-slate-950/90 p-2 shadow-[0_14px_34px_rgba(2,6,23,0.7)]">
            <canvas
              ref={canvasRef}
              id="certificate-canvas"
              data-testid="certificate-canvas"
              width={1200}
              height={848}
              className="w-full h-auto rounded-xl"
            />
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleDownloadPNG}
                className="btn-gold flex-1 py-3.5 px-5 rounded-2xl font-extrabold text-sm flex items-center justify-center whitespace-nowrap"
              >
                Unduh Sertifikat Astronot (PNG)
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="py-3.5 px-5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 border border-sky-400/35 text-sky-100 font-semibold text-sm flex items-center justify-center transition whitespace-nowrap"
              >
                Cetak / PDF
              </button>
            </div>

            {onOpenCampusAnalysis && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  id="btn-results-campus-analysis"
                  onClick={() => onOpenCampusAnalysis('utbk')}
                  className="py-3 px-4 rounded-2xl bg-teal-500/20 hover:bg-teal-500/35 border border-teal-400/45 text-teal-100 font-bold text-xs transition"
                >
                  🎯 Analisis Kampus UTBK (7 Subtes) →
                </button>
                <button
                  type="button"
                  id="btn-results-kedinasan-analysis"
                  onClick={() => onOpenCampusAnalysis('kedinasan')}
                  className="py-3 px-4 rounded-2xl bg-purple-500/20 hover:bg-purple-500/35 border border-purple-400/45 text-purple-100 font-bold text-xs transition"
                >
                  🏛️ Analisis Kedinasan (SKD) →
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onBackHome}
              className="w-full py-3 rounded-2xl bg-slate-900/75 hover:bg-slate-800 border border-sky-400/20 text-slate-300 font-semibold text-xs transition"
            >
              ← Kembali ke Halaman Utama
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
