import React, { useEffect, useMemo, useState } from 'react';
import type { HistoryRecord } from '../types/quiz';
import {
  DEFAULT_UTBK_SCORES,
  UTBK_SUBTESTS,
  analyzeCampusMatches,
  calculateUtbkScoreSummary,
  estimateSubtestsFromGrade,
  estimateSubtestsFromHistory,
  pickStrategicChoices,
  sanitizeSubtestScore,
  type CampusRumpun,
  type MatchFitStatus,
  type UtbkSubtestKey,
  type UtbkSubtestScores,
} from '../utils/utbkCampusAnalysis';
import {
  ALL_INDONESIA_CAMPUS_PROGRAMS,
  INDONESIA_REGIONS,
  INDONESIA_UNIVERSITIES,
  type IndonesiaRegion,
} from '../data/indonesiaUniversities';
import {
  DEFAULT_KEDINASAN_SCORES,
  KEDINASAN_PROGRAMS,
  KEDINASAN_SUBTESTS,
  analyzeKedinasanMatches,
  calculateKedinasanSkdSummary,
  estimateKedinasanFromGrade,
  estimateKedinasanFromHistory,
  pickStrategicKedinasanChoices,
  sanitizeKedinasanScore,
  type KedinasanAgency,
  type KedinasanFitStatus,
  type KedinasanSubtestKey,
  type KedinasanSubtestScores,
} from '../utils/kedinasanAnalysis';
import type { UserWebLanguage } from '../utils/webSettings';
import type { SavedSkdSummary } from '../utils/participantAuth';

const STORAGE_KEY_SUBTESTS = 'hafiz_utbk_subtests_v1';
const STORAGE_KEY_KEDINASAN = 'hafiz_kedinasan_skd_v1';

export type CampusAnalyzerMode = 'utbk' | 'kedinasan';

interface UtbkCampusAnalyzerProps {
  initialMode?: CampusAnalyzerMode;
  language?: UserWebLanguage;
  userHistory?: HistoryRecord[];
  latestQuizGrade?: number | null;
  userEmail?: string | null;
  onSaveSkdToProfile?: (summary: SavedSkdSummary) => Promise<void> | void;
  onBackHome: () => void;
  onOpenUtbkTryOut: () => void;
  onOpenKedinasanPortal?: () => void;
}

const SCORE_PRESETS: { label: string; scores: UtbkSubtestScores }[] = [
  {
    label: 'Awal (3.780)',
    scores: { pu: 540, ppu: 530, pbm: 545, pk: 520, lbi: 560, lbe: 535, pm: 550 },
  },
  {
    label: 'Menengah (4.380)',
    scores: DEFAULT_UTBK_SCORES,
  },
  {
    label: 'Kompetitif (4.865)',
    scores: { pu: 700, ppu: 685, pbm: 690, pk: 695, lbi: 710, lbe: 680, pm: 705 },
  },
  {
    label: 'Top PTN (5.285)',
    scores: { pu: 765, ppu: 740, pbm: 750, pk: 755, lbi: 770, lbe: 745, pm: 760 },
  },
];

const KEDINASAN_PRESETS: { label: string; scores: KedinasanSubtestScores }[] = [
  {
    label: 'PG Minimal (311)',
    scores: { twk: 65, tiu: 80, tkp: 166 },
  },
  {
    label: 'Kompetitif (385)',
    scores: { twk: 95, tiu: 112, tkp: 178 },
  },
  {
    label: 'Target STIS/IPDN (427)',
    scores: DEFAULT_KEDINASAN_SCORES,
  },
  {
    label: 'Target PKN STAN (455)',
    scores: { twk: 118, tiu: 142, tkp: 195 },
  },
];

const FIT_BADGE_MAP: Record<
  MatchFitStatus | KedinasanFitStatus,
  { label: string; badgeClass: string; barClass: string }
> = {
  aman: {
    label: '🟢 Peluang Tinggi (Aman)',
    badgeClass: 'bg-emerald-500/20 border-emerald-400/45 text-emerald-200',
    barClass: 'from-emerald-400 to-teal-400',
  },
  kompetitif: {
    label: '🟡 Kompetitif (Rasional)',
    badgeClass: 'bg-amber-500/20 border-amber-400/45 text-amber-200',
    barClass: 'from-amber-400 to-sky-400',
  },
  tantangan: {
    label: '🟠 Target Tantangan',
    badgeClass: 'bg-rose-500/20 border-rose-400/40 text-rose-200',
    barClass: 'from-rose-400 to-amber-400',
  },
};

const KEDINASAN_AGENCIES: (KedinasanAgency | 'Semua')[] = [
  'Semua',
  'PKN STAN',
  'Polstat STIS',
  'IPDN',
  'STIN',
  'Poltek SSN',
  'STMKG',
  'Kemenkumham',
  'Kemenhub',
  'STPN & Kementan',
];

const PAGE_SIZE = 24;

export const UtbkCampusAnalyzer: React.FC<UtbkCampusAnalyzerProps> = ({
  initialMode = 'utbk',
  language = 'id',
  userHistory = [],
  latestQuizGrade = null,
  userEmail = null,
  onSaveSkdToProfile,
  onBackHome,
  onOpenUtbkTryOut,
  onOpenKedinasanPortal,
}) => {
  const [mode, setMode] = useState<CampusAnalyzerMode>(initialMode);
  const [savingSkd, setSavingSkd] = useState(false);
  const isEn = language === 'en';

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // --- UTBK State ---
  const [scores, setScores] = useState<UtbkSubtestScores>(() => {
    if (typeof latestQuizGrade === 'number' && Number.isFinite(latestQuizGrade)) {
      return estimateSubtestsFromGrade(latestQuizGrade);
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SUBTESTS);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UtbkSubtestScores>;
        return {
          pu: sanitizeSubtestScore(parsed.pu ?? DEFAULT_UTBK_SCORES.pu),
          ppu: sanitizeSubtestScore(parsed.ppu ?? DEFAULT_UTBK_SCORES.ppu),
          pbm: sanitizeSubtestScore(parsed.pbm ?? DEFAULT_UTBK_SCORES.pbm),
          pk: sanitizeSubtestScore(parsed.pk ?? DEFAULT_UTBK_SCORES.pk),
          lbi: sanitizeSubtestScore(parsed.lbi ?? DEFAULT_UTBK_SCORES.lbi),
          lbe: sanitizeSubtestScore(parsed.lbe ?? DEFAULT_UTBK_SCORES.lbe),
          pm: sanitizeSubtestScore(parsed.pm ?? DEFAULT_UTBK_SCORES.pm),
        };
      }
    } catch {
      // fallback
    }
    return DEFAULT_UTBK_SCORES;
  });

  const [rumpunFilter, setRumpunFilter] = useState<CampusRumpun | 'Semua'>('Semua');
  const [fitFilter, setFitFilter] = useState<MatchFitStatus | 'Semua'>('Semua');
  const [regionFilter, setRegionFilter] = useState<IndonesiaRegion | 'Semua Wilayah'>('Semua Wilayah');
  const [universityFilter, setUniversityFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recommended' | 'highest-target' | 'highest-chance'>(
    'recommended'
  );
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [rumpunFilter, fitFilter, regionFilter, universityFilter, searchQuery, sortBy]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUBTESTS, JSON.stringify(scores));
    } catch {
      // ignore
    }
  }, [scores]);

  // --- Kedinasan State ---
  const [skdScores, setSkdScores] = useState<KedinasanSubtestScores>(() => {
    if (typeof latestQuizGrade === 'number' && Number.isFinite(latestQuizGrade)) {
      return estimateKedinasanFromGrade(latestQuizGrade);
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY_KEDINASAN);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<KedinasanSubtestScores>;
        return {
          twk: sanitizeKedinasanScore('twk', parsed.twk ?? DEFAULT_KEDINASAN_SCORES.twk),
          tiu: sanitizeKedinasanScore('tiu', parsed.tiu ?? DEFAULT_KEDINASAN_SCORES.tiu),
          tkp: sanitizeKedinasanScore('tkp', parsed.tkp ?? DEFAULT_KEDINASAN_SCORES.tkp),
        };
      }
    } catch {
      // fallback
    }
    return DEFAULT_KEDINASAN_SCORES;
  });

  const [agencyFilter, setAgencyFilter] = useState<KedinasanAgency | 'Semua'>('Semua');
  const [kedFitFilter, setKedFitFilter] = useState<KedinasanFitStatus | 'Semua'>('Semua');
  const [kedSearchQuery, setKedSearchQuery] = useState('');
  const [kedSortBy, setKedSortBy] = useState<'recommended' | 'highest-target' | 'highest-chance'>(
    'recommended'
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_KEDINASAN, JSON.stringify(skdScores));
    } catch {
      // ignore
    }
  }, [skdScores]);

  // --- UTBK Computed ---
  const summary = useMemo(() => calculateUtbkScoreSummary(scores), [scores]);

  const universitiesInRegion = useMemo(() => {
    const list =
      regionFilter === 'Semua Wilayah'
        ? INDONESIA_UNIVERSITIES
        : INDONESIA_UNIVERSITIES.filter((u) => u.region === regionFilter);
    return [...list].sort((a, b) => a.shortName.localeCompare(b.shortName));
  }, [regionFilter]);

  const matches = useMemo(
    () =>
      analyzeCampusMatches(summary.sanitizedScores, ALL_INDONESIA_CAMPUS_PROGRAMS, {
        rumpun: rumpunFilter,
        fitStatus: fitFilter,
        region: regionFilter,
        universityId: universityFilter,
        searchQuery,
        sortBy,
      }),
    [
      summary.sanitizedScores,
      rumpunFilter,
      fitFilter,
      regionFilter,
      universityFilter,
      searchQuery,
      sortBy,
    ]
  );

  const visibleMatches = useMemo(
    () => matches.slice(0, visibleCount),
    [matches, visibleCount]
  );

  const strategicPicks = useMemo(() => {
    const allInScope = analyzeCampusMatches(
      summary.sanitizedScores,
      ALL_INDONESIA_CAMPUS_PROGRAMS,
      {
        rumpun: rumpunFilter,
        region: regionFilter,
        universityId: universityFilter,
        fitStatus: 'Semua',
        sortBy: 'recommended',
      }
    );
    return pickStrategicChoices(allInScope);
  }, [summary.sanitizedScores, rumpunFilter, regionFilter, universityFilter]);

  const countsByStatus = useMemo(() => {
    const all = analyzeCampusMatches(summary.sanitizedScores, ALL_INDONESIA_CAMPUS_PROGRAMS, {
      rumpun: rumpunFilter,
      region: regionFilter,
      universityId: universityFilter,
    });
    return {
      aman: all.filter((m) => m.fitStatus === 'aman').length,
      kompetitif: all.filter((m) => m.fitStatus === 'kompetitif').length,
      tantangan: all.filter((m) => m.fitStatus === 'tantangan').length,
    };
  }, [summary.sanitizedScores, rumpunFilter, regionFilter, universityFilter]);

  // --- Kedinasan Computed ---
  const skdSummary = useMemo(() => calculateKedinasanSkdSummary(skdScores), [skdScores]);

  const kedMatches = useMemo(
    () =>
      analyzeKedinasanMatches(skdSummary.sanitizedScores, KEDINASAN_PROGRAMS, {
        agency: agencyFilter,
        fitStatus: kedFitFilter,
        searchQuery: kedSearchQuery,
        sortBy: kedSortBy,
      }),
    [skdSummary.sanitizedScores, agencyFilter, kedFitFilter, kedSearchQuery, kedSortBy]
  );

  const kedStrategicPicks = useMemo(() => {
    const allInAgency = analyzeKedinasanMatches(skdSummary.sanitizedScores, KEDINASAN_PROGRAMS, {
      agency: agencyFilter,
      fitStatus: 'Semua',
      sortBy: 'recommended',
    });
    return pickStrategicKedinasanChoices(allInAgency);
  }, [skdSummary.sanitizedScores, agencyFilter]);

  const kedCountsByStatus = useMemo(() => {
    const all = analyzeKedinasanMatches(skdSummary.sanitizedScores, KEDINASAN_PROGRAMS, {
      agency: agencyFilter,
    });
    return {
      aman: all.filter((m) => m.fitStatus === 'aman').length,
      kompetitif: all.filter((m) => m.fitStatus === 'kompetitif').length,
      tantangan: all.filter((m) => m.fitStatus === 'tantangan').length,
    };
  }, [skdSummary.sanitizedScores, agencyFilter]);

  const historySuggestedUtbk = useMemo(() => estimateSubtestsFromHistory(userHistory), [userHistory]);
  const historySuggestedSkd = useMemo(() => estimateKedinasanFromHistory(userHistory), [userHistory]);

  const handleSubtestChange = (key: UtbkSubtestKey, rawVal: string) => {
    const num = rawVal === '' ? 0 : Number(rawVal);
    setScores((prev) => ({
      ...prev,
      [key]: sanitizeSubtestScore(num),
    }));
  };

  const handleSkdChange = (key: KedinasanSubtestKey, rawVal: string) => {
    const num = rawVal === '' ? 0 : Number(rawVal);
    setSkdScores((prev) => ({
      ...prev,
      [key]: sanitizeKedinasanScore(key, num),
    }));
  };

  const tpsSubtests = UTBK_SUBTESTS.filter((s) => s.group === 'TPS');
  const litSubtests = UTBK_SUBTESTS.filter((s) => s.group === 'Literasi & PM');

  return (
    <section id="view-campus-analysis" className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sky-400/20 pb-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-teal-300 tracking-wide">
            {mode === 'utbk'
              ? isEn
                ? `SNBT Calculator · ${INDONESIA_UNIVERSITIES.length} Public Universities · ${ALL_INDONESIA_CAMPUS_PROGRAMS.length.toLocaleString('id-ID')} Study Programs`
                : `Kalkulator Rasionalisasi SNBT · ${INDONESIA_UNIVERSITIES.length} PTN se-Indonesia · ${ALL_INDONESIA_CAMPUS_PROGRAMS.length.toLocaleString('id-ID')} Program Studi`
              : isEn
                ? `Civil Service College Analyzer · SKD Total (TWK + TIU + TKP)`
                : `Kalkulator Rasionalisasi Sekolah Kedinasan · Penjumlahan SKD (TWK + TIU + TKP)`}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gold-gradient">
            {mode === 'utbk'
              ? isEn
                ? 'Indonesian Universities & Majors UTBK Analyzer'
                : 'Analisis Kampus & Jurusan se-Indonesia (UTBK-SNBT)'
              : isEn
                ? 'Civil Service Colleges Analyzer (SKD BKN)'
                : 'Analisis Sekolah Kedinasan (SKD BKN)'}
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            {mode === 'utbk'
              ? `Masukkan skor 7 subtes UTBK (PU, PPU, PBM, PK, LBI, LBE, PM). Sistem otomatis menjumlahkan skor dan mencocokkannya dengan ${INDONESIA_UNIVERSITIES.length} universitas negeri dari Aceh hingga Papua serta puluhan rumpun jurusan favorit.`
              : 'Masukkan nilai TWK, TIU, dan TKP. Sistem menjumlahkan total skor SKD (maks. 550), memvalidasi ambang batas wajib (Passing Grade BKN), dan menganalisis peluang ke PKN STAN, STIS, IPDN, STIN, Poltek SSN, STMKG, Kemenkumham, Kemenhub, STPN & Polbangtan.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {mode === 'utbk' && (historySuggestedUtbk || typeof latestQuizGrade === 'number') && (
            <button
              type="button"
              id="btn-autofill-utbk-history"
              onClick={() => {
                if (typeof latestQuizGrade === 'number') {
                  setScores(estimateSubtestsFromGrade(latestQuizGrade));
                } else if (historySuggestedUtbk) {
                  setScores(historySuggestedUtbk);
                }
              }}
              className="btn-gold px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap"
            >
              ✨ Isi dari Skor Try Out Saya
            </button>
          )}
          {mode === 'kedinasan' && (historySuggestedSkd || typeof latestQuizGrade === 'number') && (
            <button
              type="button"
              id="btn-autofill-skd-history"
              onClick={() => {
                if (typeof latestQuizGrade === 'number') {
                  setSkdScores(estimateKedinasanFromGrade(latestQuizGrade));
                } else if (historySuggestedSkd) {
                  setSkdScores(historySuggestedSkd);
                }
              }}
              className="btn-gold px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap"
            >
              ✨ Isi dari Skor Try Out SKD
            </button>
          )}
          <button
            type="button"
            onClick={mode === 'kedinasan' && onOpenKedinasanPortal ? onOpenKedinasanPortal : onOpenUtbkTryOut}
            className="px-4 py-2.5 rounded-xl bg-indigo-500/25 hover:bg-indigo-500/40 border border-indigo-400/45 text-xs font-bold text-indigo-100 transition whitespace-nowrap"
          >
            {mode === 'kedinasan' ? '🏛️ Try Out SKD Kedinasan' : '🚀 Try Out UTBK'}
          </button>
          <button
            type="button"
            onClick={onBackHome}
            className="px-4 py-2.5 rounded-xl bg-slate-800/85 hover:bg-slate-700/85 border border-sky-400/30 text-xs font-bold text-sky-100 transition whitespace-nowrap"
          >
            ← Beranda
          </button>
        </div>
      </div>

      {/* Mode Switcher: UTBK vs Kedinasan */}
      <div
        role="tablist"
        aria-label="Pilih mode analisis kelulusan"
        className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-sky-400/25 w-fit"
      >
        <button
          type="button"
          role="tab"
          id="tab-analyzer-utbk"
          aria-selected={mode === 'utbk'}
          onClick={() => setMode('utbk')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            mode === 'utbk'
              ? 'btn-gold text-white'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          🎯 Analisis Kampus UTBK (7 Subtes)
        </button>
        <button
          type="button"
          role="tab"
          id="tab-analyzer-kedinasan"
          aria-selected={mode === 'kedinasan'}
          onClick={() => setMode('kedinasan')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            mode === 'kedinasan'
              ? 'btn-gold text-white'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          🏛️ Analisis Kedinasan (SKD: TWK + TIU + TKP)
        </button>
      </div>

      {/* ============================================================ */}
      {/* MODE 1: ANALISIS KAMPUS UTBK-SNBT (7 SUBTES)                 */}
      {/* ============================================================ */}
      {mode === 'utbk' && (
        <>
          {/* Top 4 Summation & Diagnostic KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="hero-glow-card p-5 rounded-3xl space-y-1 border border-teal-400/40">
              <p className="text-xs text-teal-200 font-semibold">Total Skor (Jumlah 7 Subtes)</p>
              <p
                id="utbk-total-score"
                className="font-display text-3xl sm:text-4xl font-extrabold text-gold-gradient tabular-nums"
              >
                {summary.totalScore.toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-slate-400 tabular-nums">
                Maksimal 7.000 poin · TPS {summary.tpsTotal.toLocaleString('id-ID')} + Lit{' '}
                {summary.literasiTotal.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="glass-card p-5 rounded-3xl space-y-1">
              <p className="text-xs text-sky-200 font-semibold">Rata-Rata Skor UTBK</p>
              <p
                id="utbk-avg-score"
                className="font-display text-3xl sm:text-4xl font-extrabold text-sky-300 tabular-nums"
              >
                {summary.averageScore}
              </p>
              <p className="text-[11px] text-slate-400 tabular-nums">
                Skala 0–1.000 per subtes ({summary.totalScore} ÷ 7)
              </p>
            </div>

            <div className="glass-card p-5 rounded-3xl space-y-1">
              <p className="text-xs text-emerald-200 font-semibold">Subtes Terkuat</p>
              <p className="font-display text-xl sm:text-2xl font-bold text-emerald-300 truncate">
                {summary.strongestSubtest.code} · {summary.strongestSubtest.score}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {summary.strongestSubtest.label}
              </p>
            </div>

            <div className="glass-card p-5 rounded-3xl space-y-1">
              <p className="text-xs text-amber-200 font-semibold">Prioritas Ditingkatkan</p>
              <p className="font-display text-xl sm:text-2xl font-bold text-amber-300 truncate">
                {summary.weakestSubtest.code} · {summary.weakestSubtest.score}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {summary.weakestSubtest.label}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: 7 Subtests Input */}
            <div className="lg:col-span-5 hero-glow-card holo-top-beam p-6 rounded-3xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-400/20 pb-3.5">
                <div>
                  <h2 className="font-display text-xl font-bold text-white">
                    Input Nilai 7 Subtes UTBK
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Skala 0 – 1.000 per subtes, dijumlahkan otomatis
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setScores({ pu: 0, ppu: 0, pbm: 0, pk: 0, lbi: 0, lbe: 0, pm: 0 })
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[11px] font-semibold text-slate-300 transition"
                >
                  Reset 0
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {SCORE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setScores(preset.scores)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-sky-500/20 border border-sky-400/25 text-[11px] font-semibold text-sky-200 transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-sky-300">
                  <span>TES POTENSI SKOLASTIK (TPS)</span>
                  <span className="tabular-nums text-sky-200">
                    Subtotal: {summary.tpsTotal.toLocaleString('id-ID')} / 4.000
                  </span>
                </div>
                {tpsSubtests.map((sub) => (
                  <div
                    key={sub.key}
                    className="p-3.5 rounded-2xl bg-slate-900/75 border border-sky-400/20 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={`subtest-${sub.key}`}
                        className="text-xs font-bold text-white cursor-pointer"
                      >
                        <span className="text-sky-300 font-mono mr-1.5">{sub.code}</span>
                        {sub.label}
                      </label>
                      <input
                        id={`subtest-${sub.key}`}
                        type="number"
                        min={0}
                        max={1000}
                        value={summary.sanitizedScores[sub.key]}
                        onChange={(e) => handleSubtestChange(sub.key, e.target.value)}
                        className="w-20 px-2.5 py-1 rounded-xl bg-slate-950 border border-sky-400/35 text-right text-sm font-bold text-sky-200 tabular-nums focus:border-sky-400 outline-none"
                      />
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1000}
                      step={5}
                      value={summary.sanitizedScores[sub.key]}
                      onChange={(e) => handleSubtestChange(sub.key, e.target.value)}
                      aria-label={`Slider ${sub.label}`}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-teal-300">
                  <span>LITERASI &amp; PENALARAN MATEMATIKA</span>
                  <span className="tabular-nums text-teal-200">
                    Subtotal: {summary.literasiTotal.toLocaleString('id-ID')} / 3.000
                  </span>
                </div>
                {litSubtests.map((sub) => (
                  <div
                    key={sub.key}
                    className="p-3.5 rounded-2xl bg-slate-900/75 border border-teal-400/20 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={`subtest-${sub.key}`}
                        className="text-xs font-bold text-white cursor-pointer"
                      >
                        <span className="text-teal-300 font-mono mr-1.5">{sub.code}</span>
                        {sub.label}
                      </label>
                      <input
                        id={`subtest-${sub.key}`}
                        type="number"
                        min={0}
                        max={1000}
                        value={summary.sanitizedScores[sub.key]}
                        onChange={(e) => handleSubtestChange(sub.key, e.target.value)}
                        className="w-20 px-2.5 py-1 rounded-xl bg-slate-950 border border-teal-400/35 text-right text-sm font-bold text-teal-200 tabular-nums focus:border-teal-400 outline-none"
                      />
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1000}
                      step={5}
                      value={summary.sanitizedScores[sub.key]}
                      onChange={(e) => handleSubtestChange(sub.key, e.target.value)}
                      aria-label={`Slider ${sub.label}`}
                      className="w-full accent-teal-400 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <div
                id="utbk-summation-formula"
                className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-400/35 space-y-1.5"
              >
                <p className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider">
                  Penjumlahan Semua 7 Subtes
                </p>
                <p className="text-xs font-mono text-slate-200 leading-relaxed tabular-nums">
                  {summary.sanitizedScores.pu} + {summary.sanitizedScores.ppu} +{' '}
                  {summary.sanitizedScores.pbm} + {summary.sanitizedScores.pk} +{' '}
                  {summary.sanitizedScores.lbi} + {summary.sanitizedScores.lbe} +{' '}
                  {summary.sanitizedScores.pm} ={' '}
                  <strong className="text-amber-300 text-sm">
                    {summary.totalScore.toLocaleString('id-ID')}
                  </strong>
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <strong className="text-sky-200">{summary.tierLabel}:</strong>{' '}
                  {summary.tierDescription}
                </p>
              </div>
            </div>

            {/* Right Column: PTN Recommendations */}
            <div className="lg:col-span-7 space-y-6">
              <div className="glass-card p-6 rounded-3xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-xl font-bold text-white">
                      Rekomendasi Strategis SNBT (Pilihan 1 &amp; 2)
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Kombinasi terbaik sesuai total skor {summary.totalScore.toLocaleString('id-ID')}{' '}
                      pada rumpun {rumpunFilter}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold tabular-nums">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/35 text-emerald-200">
                      {countsByStatus.aman} Aman
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/35 text-amber-200">
                      {countsByStatus.kompetitif} Kompetitif
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'PILIHAN 1 (TARGET UTAMA)', match: strategicPicks.pilihan1 },
                    { label: 'PILIHAN 2 (PENJAGA AMAN)', match: strategicPicks.pilihan2 },
                  ].map(({ label, match }) => (
                    <div
                      key={label}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-sky-400/25 space-y-2"
                    >
                      <p className="text-[10px] font-extrabold text-sky-300 tracking-wider">
                        {label}
                      </p>
                      {match ? (
                        <>
                          <p className="font-display text-base font-bold text-white leading-snug">
                            {match.program.shortUniv} — {match.program.major}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {match.program.university} ({match.program.city})
                          </p>
                          <div className="flex items-center justify-between pt-1 text-xs font-bold tabular-nums">
                            <span className="text-amber-300">
                              Min Total: {match.program.minTotalScore.toLocaleString('id-ID')}
                            </span>
                            <span className="text-emerald-300">Peluang {match.chancePercent}%</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400">
                          Ubah filter rumpun untuk melihat rekomendasi pilihan ini.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-5 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    id="input-search-campus"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari kampus, jurusan, kota, atau provinsi (misal: Kedokteran, UI, UNJA, Unhas)..."
                    aria-label="Cari kampus atau jurusan"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-sky-400/25 focus:border-sky-400 outline-none text-xs sm:text-sm text-white placeholder:text-slate-500"
                  />
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value as 'recommended' | 'highest-target' | 'highest-chance'
                      )
                    }
                    aria-label="Urutkan hasil kampus"
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-sky-400/25 text-xs font-semibold text-sky-100 outline-none"
                  >
                    <option value="recommended">Urut: Paling Cocok</option>
                    <option value="highest-chance">Urut: Peluang Tertinggi</option>
                    <option value="highest-target">Urut: Target Skor Tertinggi</option>
                  </select>
                </div>

                {/* Nationwide Region & Specific University Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="filter-utbk-region"
                      className="block text-[11px] font-semibold text-slate-400 mb-1"
                    >
                      Wilayah Indonesia
                    </label>
                    <select
                      id="filter-utbk-region"
                      value={regionFilter}
                      onChange={(e) => {
                        const nextReg = e.target.value as IndonesiaRegion | 'Semua Wilayah';
                        setRegionFilter(nextReg);
                        setUniversityFilter('Semua');
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-sky-400/25 text-xs font-semibold text-sky-100 outline-none"
                    >
                      {INDONESIA_REGIONS.map((reg) => (
                        <option key={reg} value={reg}>
                          {reg === 'Semua Wilayah' ? 'Semua Wilayah Indonesia' : reg}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="filter-utbk-university"
                      className="block text-[11px] font-semibold text-slate-400 mb-1"
                    >
                      Pilih Universitas PTN ({universitiesInRegion.length} Kampus)
                    </label>
                    <select
                      id="filter-utbk-university"
                      value={universityFilter}
                      onChange={(e) => setUniversityFilter(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-sky-400/25 text-xs font-semibold text-sky-100 outline-none"
                    >
                      <option value="Semua">
                        Semua Universitas PTN ({universitiesInRegion.length})
                      </option>
                      {universitiesInRegion.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.shortName} — {u.name} ({u.city})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {(['Semua', 'Saintek', 'Soshum', 'Campuran'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRumpunFilter(r)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          rumpunFilter === r
                            ? 'bg-sky-500/30 border border-sky-400/60 text-sky-100'
                            : 'bg-slate-900/80 border border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {r === 'Semua' ? 'Semua Rumpun' : r}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'Semua', label: 'Semua Peluang' },
                        { id: 'aman', label: 'Aman' },
                        { id: 'kompetitif', label: 'Kompetitif' },
                        { id: 'tantangan', label: 'Tantangan' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFitFilter(f.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          fitFilter === f.id
                            ? 'bg-teal-500/30 border border-teal-400/60 text-teal-100'
                            : 'bg-slate-900/80 border border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div id="utbk-campus-results" className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-400">
                  <span>
                    Menampilkan{' '}
                    <strong className="text-white">{visibleMatches.length}</strong> dari{' '}
                    <strong className="text-sky-200">{matches.length.toLocaleString('id-ID')}</strong>{' '}
                    program studi PTN
                  </span>
                  <span>Basis Perbandingan: Total Skor 7 Subtes</span>
                </div>

                {matches.length === 0 ? (
                  <div className="glass-card p-8 rounded-3xl text-center space-y-2">
                    <p className="font-display text-lg font-bold text-white">
                      Tidak Ada Kampus yang Sesuai Filter
                    </p>
                    <p className="text-xs text-slate-400">
                      Coba ubah kata kunci pencarian atau pilih filter &quot;Semua Wilayah&quot; /
                      &quot;Semua Universitas&quot;.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {visibleMatches.map((item) => {
                      const style = FIT_BADGE_MAP[item.fitStatus];
                      const { program } = item;
                      return (
                        <article
                          key={program.id}
                          className="glass-card p-5 rounded-3xl flex flex-col justify-between space-y-4 hover:border-sky-400/50 transition"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-400/35 text-xs font-extrabold text-sky-200">
                                {program.shortUniv} · {program.rumpun}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-bold ${style.badgeClass}`}
                              >
                                {style.label}
                              </span>
                            </div>

                            <div>
                              <h3 className="font-display text-lg font-bold text-white leading-snug">
                                {program.major}
                              </h3>
                              <p className="text-xs text-slate-300 mt-0.5">
                                {program.university} · {program.city}
                                {program.province ? `, ${program.province}` : ''} (Akreditasi{' '}
                                {program.akreditasi})
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] tabular-nums">
                              <div>
                                <p className="text-slate-400">Target Total Skor</p>
                                <p className="font-bold text-white">
                                  {program.minTotalScore.toLocaleString('id-ID')}{' '}
                                  <span className="text-slate-400 font-normal">
                                    (ø {item.requiredAverage})
                                  </span>
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-slate-400">Selisih Skor Anda</p>
                                <p
                                  className={`font-bold ${
                                    item.scoreDiff >= 0 ? 'text-emerald-300' : 'text-rose-300'
                                  }`}
                                >
                                  {item.scoreDiff >= 0 ? `+${item.scoreDiff}` : item.scoreDiff} poin
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-sky-400/15">
                            <div className="flex items-center justify-between text-xs tabular-nums">
                              <span className="text-slate-400">
                                Daya Tampung {program.dayaTampung} · {program.keketatanLabel}
                              </span>
                              <span className="font-extrabold text-sky-200">
                                {item.chancePercent}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${style.barClass} transition-all duration-300`}
                                style={{ width: `${item.chancePercent}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>
                                Subtes Kunci:{' '}
                                <strong className="text-slate-200 uppercase">
                                  {program.dominantSubtests.join(', ')}
                                </strong>
                              </span>
                              {item.neededPointsTotal > 0 ? (
                                <span className="text-amber-300 font-semibold tabular-nums">
                                  +{item.neededPointsPerSubtest} poin/subtes
                                </span>
                              ) : (
                                <span className="text-emerald-300 font-semibold">
                                  Melampaui target
                                </span>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                    </div>

                    {visibleCount < matches.length && (
                      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                        <button
                          type="button"
                          id="btn-load-more-campuses"
                          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                          className="btn-gold px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold"
                        >
                          Muat +{Math.min(PAGE_SIZE, matches.length - visibleCount)} Program Studi Lainnya
                          {' '}(Sisa {matches.length - visibleCount})
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* MODE 2: ANALISIS SEKOLAH KEDINASAN (SKD: TWK + TIU + TKP)    */}
      {/* ============================================================ */}
      {mode === 'kedinasan' && (
        <>
          {/* Top 4 SKD Kedinasan KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="hero-glow-card p-5 rounded-3xl space-y-1 border border-purple-400/40">
              <p className="text-xs text-purple-200 font-semibold">
                Total Skor SKD (TWK + TIU + TKP)
              </p>
              <p
                id="skd-total-score"
                className="font-display text-3xl sm:text-4xl font-extrabold text-gold-gradient tabular-nums"
              >
                {skdSummary.totalScore}
              </p>
              <p className="text-[11px] text-slate-400 tabular-nums">
                Maksimal 550 poin · TWK {skdSummary.sanitizedScores.twk} + TIU{' '}
                {skdSummary.sanitizedScores.tiu} + TKP {skdSummary.sanitizedScores.tkp}
              </p>
            </div>

            <div className="glass-card p-5 rounded-3xl space-y-1">
              <p className="text-xs text-sky-200 font-semibold">Ambang Batas (PG BKN)</p>
              <p
                id="skd-pg-status"
                className={`font-display text-xl sm:text-2xl font-extrabold ${
                  skdSummary.passedAllPg ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {skdSummary.passedAllPg ? '✅ Lolos Semua PG' : '⚠️ Belum Lolos PG'}
              </p>
              <p className="text-[11px] text-slate-400">
                {skdSummary.passedAllPg
                  ? 'TWK ≥ 65, TIU ≥ 80, TKP ≥ 166 terpenuhi'
                  : `Kurang: ${skdSummary.failedPgList
                      .map((f) => `${f.code} (-${f.deficit})`)
                      .join(', ')}`}
              </p>
            </div>

            <div className="glass-card p-5 rounded-3xl space-y-1">
              <p className="text-xs text-emerald-200 font-semibold">Subtes SKD Terkuat</p>
              <p className="font-display text-xl sm:text-2xl font-bold text-emerald-300 truncate">
                {skdSummary.strongestSubtest.code} · {skdSummary.strongestSubtest.score}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {skdSummary.strongestSubtest.percent}% dari maks {skdSummary.strongestSubtest.maxScore}
              </p>
            </div>

            <div className="glass-card p-5 rounded-3xl space-y-1">
              <p className="text-xs text-amber-200 font-semibold">Prioritas Ditingkatkan</p>
              <p className="font-display text-xl sm:text-2xl font-bold text-amber-300 truncate">
                {skdSummary.weakestSubtest.code} · {skdSummary.weakestSubtest.score}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {skdSummary.weakestSubtest.percent}% dari maks {skdSummary.weakestSubtest.maxScore}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: TWK, TIU, TKP Inputs */}
            <div className="lg:col-span-5 hero-glow-card holo-top-beam p-6 rounded-3xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-400/20 pb-3.5">
                <div>
                  <h2 className="font-display text-xl font-bold text-white">
                    Input Skor 3 Subtes SKD
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    TWK (150) + TIU (175) + TKP (225) = Total 550
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSkdScores({ twk: 0, tiu: 0, tkp: 0 })}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[11px] font-semibold text-slate-300 transition"
                >
                  Reset 0
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {KEDINASAN_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setSkdScores(preset.scores)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-purple-500/20 border border-purple-400/25 text-[11px] font-semibold text-purple-200 transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3.5">
                {KEDINASAN_SUBTESTS.map((sub) => {
                  const val = skdSummary.sanitizedScores[sub.key];
                  const passedPg = val >= sub.passingGrade;
                  return (
                    <div
                      key={sub.key}
                      className="p-4 rounded-2xl bg-slate-900/75 border border-purple-400/20 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <label
                            htmlFor={`skd-${sub.key}`}
                            className="text-xs font-bold text-white cursor-pointer"
                          >
                            <span className="text-purple-300 font-mono mr-1.5">{sub.code}</span>
                            {sub.label}
                          </label>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {sub.questionCount} soal · Maks {sub.maxScore} · PG:{' '}
                            <strong className={passedPg ? 'text-emerald-300' : 'text-rose-300'}>
                              {sub.passingGrade} ({passedPg ? 'Lolos' : `Kurang ${sub.passingGrade - val}`})
                            </strong>
                          </p>
                        </div>
                        <input
                          id={`skd-${sub.key}`}
                          type="number"
                          min={0}
                          max={sub.maxScore}
                          value={val}
                          onChange={(e) => handleSkdChange(sub.key, e.target.value)}
                          className="w-20 px-2.5 py-1 rounded-xl bg-slate-950 border border-purple-400/35 text-right text-sm font-bold text-purple-200 tabular-nums focus:border-purple-400 outline-none"
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={sub.maxScore}
                        step={1}
                        value={val}
                        onChange={(e) => handleSkdChange(sub.key, e.target.value)}
                        aria-label={`Slider ${sub.label}`}
                        className="w-full accent-purple-400 cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>

              <div
                id="skd-summation-formula"
                className="p-4 rounded-2xl bg-purple-950/50 border border-purple-400/35 space-y-1.5"
              >
                <p className="text-[11px] font-bold text-purple-200 uppercase tracking-wider">
                  Penjumlahan Semua Subtes SKD
                </p>
                <p className="text-xs font-mono text-slate-200 leading-relaxed tabular-nums">
                  {skdSummary.sanitizedScores.twk} + {skdSummary.sanitizedScores.tiu} +{' '}
                  {skdSummary.sanitizedScores.tkp} ={' '}
                  <strong className="text-amber-300 text-sm">{skdSummary.totalScore} / 550</strong>
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <strong className="text-purple-200">{skdSummary.tierLabel}:</strong>{' '}
                  {skdSummary.tierDescription}
                </p>
              </div>
            </div>

            {/* Right Column: Kedinasan Recommendations */}
            <div className="lg:col-span-7 space-y-6">
              <div className="glass-card p-6 rounded-3xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-xl font-bold text-white">
                      Rekomendasi Sekolah Kedinasan Paling Cocok
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Berdasarkan total SKD {skdSummary.totalScore}/550 dan status Passing Grade BKN
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold tabular-nums">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/35 text-emerald-200">
                      {kedCountsByStatus.aman} Aman
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/35 text-amber-200">
                      {kedCountsByStatus.kompetitif} Kompetitif
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'TARGET UTAMA KEDINASAN', match: kedStrategicPicks.pilihan1 },
                    { label: 'ALTERNATIF STRATEGIS AMAN', match: kedStrategicPicks.pilihan2 },
                  ].map(({ label, match }) => (
                    <div
                      key={label}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-purple-400/25 space-y-2"
                    >
                      <p className="text-[10px] font-extrabold text-purple-300 tracking-wider">
                        {label}
                      </p>
                      {match ? (
                        <>
                          <p className="font-display text-base font-bold text-white leading-snug">
                            {match.program.shortSchool} — {match.program.major}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {match.program.ministry} ({match.program.city})
                          </p>
                          <div className="flex items-center justify-between pt-1 text-xs font-bold tabular-nums">
                            <span className="text-amber-300">
                              Target SKD: {match.program.minTotalScore}/550
                            </span>
                            <span className="text-emerald-300">Peluang {match.chancePercent}%</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400">
                          Ubah filter instansi untuk melihat rekomendasi lainnya.
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Save SKD & Agency Quick Fit Overview */}
                <div className="pt-2 border-t border-purple-400/20 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold text-purple-200">
                      🏫 Kesiapan Per Instansi Kedinasan (Klik untuk Filter)
                    </p>
                    {onSaveSkdToProfile && (
                      <button
                        type="button"
                        id="btn-save-skd-to-db"
                        disabled={savingSkd}
                        onClick={async () => {
                          setSavingSkd(true);
                          try {
                            const topMatch = kedStrategicPicks.pilihan1;
                            await onSaveSkdToProfile({
                              twk: skdSummary.sanitizedScores.twk,
                              tiu: skdSummary.sanitizedScores.tiu,
                              tkp: skdSummary.sanitizedScores.tkp,
                              total: skdSummary.totalScore,
                              passedAllPg: skdSummary.passedAllPg,
                              recommendedSchool: topMatch
                                ? `${topMatch.program.shortSchool} — ${topMatch.program.major}`
                                : undefined,
                            });
                          } finally {
                            setSavingSkd(false);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/45 text-emerald-100 text-xs font-bold transition whitespace-nowrap disabled:opacity-60"
                      >
                        {savingSkd
                          ? '⏳ Menyimpan...'
                          : userEmail
                            ? '💾 Simpan SKD ke Database Peserta'
                            : '💾 Simpan Skor SKD'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {KEDINASAN_AGENCIES.filter((a) => a !== 'Semua').map((ag) => {
                      const list = analyzeKedinasanMatches(skdSummary.sanitizedScores, KEDINASAN_PROGRAMS, {
                        agency: ag,
                      });
                      const readyCount = list.filter(
                        (m) => !m.blockedByPg && (m.fitStatus === 'aman' || m.fitStatus === 'kompetitif')
                      ).length;
                      const bestChance = list.reduce((mx, cur) => Math.max(mx, cur.chancePercent), 0);
                      const isActive = agencyFilter === ag;
                      return (
                        <button
                          key={ag}
                          type="button"
                          onClick={() => setAgencyFilter(isActive ? 'Semua' : ag)}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            isActive
                              ? 'bg-purple-500/30 border-purple-300'
                              : 'bg-slate-900/75 border-purple-400/20 hover:border-purple-400/45'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 text-[11px] font-bold">
                            <span className="text-white truncate">{ag}</span>
                            <span className={readyCount > 0 ? 'text-emerald-300' : 'text-amber-300'}>
                              {bestChance}%
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {skdSummary.passedAllPg
                              ? readyCount > 0
                                ? `${readyCount} prodi cocok`
                                : 'Perlu tambah skor'
                              : 'Terkunci PG BKN'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Filter & Search */}
              <div className="glass-card p-5 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={kedSearchQuery}
                    onChange={(e) => setKedSearchQuery(e.target.value)}
                    placeholder="Cari sekolah kedinasan, kementerian, prodi (misal: STAN, STIS, IPDN, Kemenhub)..."
                    aria-label="Cari sekolah kedinasan"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-purple-400/25 focus:border-purple-400 outline-none text-xs sm:text-sm text-white placeholder:text-slate-500"
                  />
                  <select
                    value={kedSortBy}
                    onChange={(e) =>
                      setKedSortBy(
                        e.target.value as 'recommended' | 'highest-target' | 'highest-chance'
                      )
                    }
                    aria-label="Urutkan hasil sekolah kedinasan"
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-purple-400/25 text-xs font-semibold text-purple-100 outline-none"
                  >
                    <option value="recommended">Urut: Paling Cocok</option>
                    <option value="highest-chance">Urut: Peluang Tertinggi</option>
                    <option value="highest-target">Urut: Target SKD Tertinggi</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {KEDINASAN_AGENCIES.map((ag) => (
                    <button
                      key={ag}
                      type="button"
                      onClick={() => setAgencyFilter(ag)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        agencyFilter === ag
                          ? 'bg-purple-500/30 border border-purple-400/60 text-purple-100'
                          : 'bg-slate-900/80 border border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {ag === 'Semua' ? 'Semua Instansi' : ag}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'Semua', label: 'Semua Peluang' },
                      { id: 'aman', label: 'Aman' },
                      { id: 'kompetitif', label: 'Kompetitif' },
                      { id: 'tantangan', label: 'Tantangan' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setKedFitFilter(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        kedFitFilter === f.id
                          ? 'bg-teal-500/30 border border-teal-400/60 text-teal-100'
                          : 'bg-slate-900/80 border border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kedinasan Cards */}
              <div id="kedinasan-campus-results" className="space-y-3">
                <div className="flex items-center justify-between px-1 text-xs text-slate-400">
                  <span>
                    Menampilkan <strong className="text-white">{kedMatches.length}</strong> program
                    studi Sekolah Kedinasan
                  </span>
                  <span>Basis: Total Skor SKD (Maks 550) + Passing Grade</span>
                </div>

                {kedMatches.length === 0 ? (
                  <div className="glass-card p-8 rounded-3xl text-center space-y-2">
                    <p className="font-display text-lg font-bold text-white">
                      Tidak Ada Program Kedinasan Sesuai Filter
                    </p>
                    <p className="text-xs text-slate-400">
                      Coba ubah filter instansi atau kata kunci pencarian.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {kedMatches.map((item) => {
                      const style = FIT_BADGE_MAP[item.fitStatus];
                      const { program } = item;
                      return (
                        <article
                          key={program.id}
                          className="glass-card p-5 rounded-3xl flex flex-col justify-between space-y-4 hover:border-purple-400/50 transition"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-400/35 text-xs font-extrabold text-purple-200">
                                {program.shortSchool}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-bold ${style.badgeClass}`}
                              >
                                {item.blockedByPg ? '⚠️ Terkunci PG' : style.label}
                              </span>
                            </div>

                            <div>
                              <h3 className="font-display text-lg font-bold text-white leading-snug">
                                {program.major}
                              </h3>
                              <p className="text-xs text-slate-300 mt-0.5">
                                {program.schoolName} · {program.ministry}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] tabular-nums">
                              <div>
                                <p className="text-slate-400">Target Total SKD</p>
                                <p className="font-bold text-white">{program.minTotalScore} / 550</p>
                              </div>
                              <div className="text-right">
                                <p className="text-slate-400">Selisih Skor Anda</p>
                                <p
                                  className={`font-bold ${
                                    item.scoreDiff >= 0 ? 'text-emerald-300' : 'text-rose-300'
                                  }`}
                                >
                                  {item.scoreDiff >= 0 ? `+${item.scoreDiff}` : item.scoreDiff} poin
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-purple-400/15">
                            <div className="flex items-center justify-between text-xs tabular-nums">
                              <span className="text-slate-400">
                                Kuota {program.dayaTampung} · {program.keketatanLabel}
                              </span>
                              <span className="font-extrabold text-purple-200">
                                {item.chancePercent}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${style.barClass} transition-all duration-300`}
                                style={{ width: `${item.chancePercent}%` }}
                              />
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              {program.extraRequirement}
                            </p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
