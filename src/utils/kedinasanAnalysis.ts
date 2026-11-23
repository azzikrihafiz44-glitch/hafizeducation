import type { HistoryRecord } from '../types/quiz';

export type KedinasanSubtestKey = 'twk' | 'tiu' | 'tkp';

export type KedinasanSubtestScores = Record<KedinasanSubtestKey, number>;

export type KedinasanAgency =
  | 'PKN STAN'
  | 'Polstat STIS'
  | 'IPDN'
  | 'STIN'
  | 'Poltek SSN'
  | 'STMKG'
  | 'Kemenkumham'
  | 'Kemenhub'
  | 'STPN & Kementan';

export type KedinasanFitStatus = 'aman' | 'kompetitif' | 'tantangan';

export interface KedinasanSubtestDefinition {
  key: KedinasanSubtestKey;
  code: string;
  label: string;
  questionCount: number;
  maxScore: number;
  passingGrade: number;
  description: string;
}

export const KEDINASAN_SUBTESTS: KedinasanSubtestDefinition[] = [
  {
    key: 'twk',
    code: 'TWK',
    label: 'Tes Wawasan Kebangsaan',
    questionCount: 30,
    maxScore: 150,
    passingGrade: 65,
    description: 'Nasionalisme, integritas, bela negara, pilar negara, dan Bahasa Indonesia',
  },
  {
    key: 'tiu',
    code: 'TIU',
    label: 'Tes Intelegensia Umum',
    questionCount: 35,
    maxScore: 175,
    passingGrade: 80,
    description: 'Kemampuan verbal, numerik/berhitung cepat, dan penalaran figural',
  },
  {
    key: 'tkp',
    code: 'TKP',
    label: 'Tes Karakteristik Pribadi',
    questionCount: 45,
    maxScore: 225,
    passingGrade: 166,
    description: 'Pelayanan publik, jejaring kerja, sosial budaya, TIK, profesionalisme, anti-radikalisme',
  },
];

export const DEFAULT_KEDINASAN_SCORES: KedinasanSubtestScores = {
  twk: 105,
  tiu: 130,
  tkp: 192,
};

export interface KedinasanProgram {
  id: string;
  agency: KedinasanAgency;
  schoolName: string;
  shortSchool: string;
  major: string;
  ministry: string;
  city: string;
  minTotalScore: number; // Sum of TWK + TIU + TKP (max 550)
  dominantSubtests: KedinasanSubtestKey[];
  dayaTampung: number;
  keketatanLabel: string;
  extraRequirement: string;
}

export const KEDINASAN_PROGRAMS: KedinasanProgram[] = [
  {
    id: 'stan-asp',
    agency: 'PKN STAN',
    schoolName: 'Politeknik Keuangan Negara STAN',
    shortSchool: 'PKN STAN',
    major: 'D-IV Akuntansi Sektor Publik',
    ministry: 'Kementerian Keuangan',
    city: 'Tangerang Selatan',
    minTotalScore: 445,
    dominantSubtests: ['tiu', 'tkp', 'twk'],
    dayaTampung: 223,
    keketatanLabel: 'Sangat Ketat (±1,8%)',
    extraRequirement: 'Lolos PG SKD + Tes Kesehatan/Kebugaran & Psikotes',
  },
  {
    id: 'stan-mkn',
    agency: 'PKN STAN',
    schoolName: 'Politeknik Keuangan Negara STAN',
    shortSchool: 'PKN STAN',
    major: 'D-IV Manajemen Keuangan Negara',
    ministry: 'Kementerian Keuangan',
    city: 'Tangerang Selatan',
    minTotalScore: 438,
    dominantSubtests: ['tiu', 'tkp', 'twk'],
    dayaTampung: 330,
    keketatanLabel: 'Sangat Ketat (±2,1%)',
    extraRequirement: 'Lolos PG SKD + Seleksi Lanjutan I & II',
  },
  {
    id: 'stan-map',
    agency: 'PKN STAN',
    schoolName: 'Politeknik Keuangan Negara STAN',
    shortSchool: 'PKN STAN',
    major: 'D-IV Manajemen Aset Publik',
    ministry: 'Kementerian Keuangan',
    city: 'Tangerang Selatan',
    minTotalScore: 428,
    dominantSubtests: ['tkp', 'tiu', 'twk'],
    dayaTampung: 169,
    keketatanLabel: 'Ketat (±2,6%)',
    extraRequirement: 'Lolos PG SKD + Seleksi Kebugaran & Wawancara',
  },
  {
    id: 'stis-ks',
    agency: 'Polstat STIS',
    schoolName: 'Politeknik Statistika STIS',
    shortSchool: 'STIS',
    major: 'D-IV Komputasi Statistik',
    ministry: 'Badan Pusat Statistik (BPS)',
    city: 'Jakarta Timur',
    minTotalScore: 432,
    dominantSubtests: ['tiu', 'tkp', 'twk'],
    dayaTampung: 130,
    keketatanLabel: 'Sangat Ketat (±1,9%)',
    extraRequirement: 'Lolos PG SKD + Tes Matematika STIS & Kesehatan',
  },
  {
    id: 'stis-stat',
    agency: 'Polstat STIS',
    schoolName: 'Politeknik Statistika STIS',
    shortSchool: 'STIS',
    major: 'D-IV Statistika',
    ministry: 'Badan Pusat Statistik (BPS)',
    city: 'Jakarta Timur',
    minTotalScore: 422,
    dominantSubtests: ['tiu', 'tkp', 'twk'],
    dayaTampung: 155,
    keketatanLabel: 'Sangat Ketat (±2,2%)',
    extraRequirement: 'Lolos PG SKD + Tes Matematika STIS & Psikotes',
  },
  {
    id: 'stis-d3',
    agency: 'Polstat STIS',
    schoolName: 'Politeknik Statistika STIS',
    shortSchool: 'STIS',
    major: 'D-III Statistika',
    ministry: 'Badan Pusat Statistik (BPS)',
    city: 'Jakarta Timur',
    minTotalScore: 405,
    dominantSubtests: ['tiu', 'tkp'],
    dayaTampung: 70,
    keketatanLabel: 'Ketat (±3,0%)',
    extraRequirement: 'Lolos PG SKD + Tes Matematika STIS',
  },
  {
    id: 'ssn-siber',
    agency: 'Poltek SSN',
    schoolName: 'Politeknik Siber dan Sandi Negara',
    shortSchool: 'Poltek SSN',
    major: 'D-IV Rekayasa Keamanan Siber',
    ministry: 'BSSN',
    city: 'Bogor',
    minTotalScore: 412,
    dominantSubtests: ['tiu', 'tkp', 'twk'],
    dayaTampung: 40,
    keketatanLabel: 'Sangat Ketat (±2,0%)',
    extraRequirement: 'Lolos PG SKD + Tes Akademik (Matematika & Bahasa Inggris)',
  },
  {
    id: 'ssn-kripto',
    agency: 'Poltek SSN',
    schoolName: 'Politeknik Siber dan Sandi Negara',
    shortSchool: 'Poltek SSN',
    major: 'D-IV Rekayasa Kriptografi',
    ministry: 'BSSN',
    city: 'Bogor',
    minTotalScore: 404,
    dominantSubtests: ['tiu', 'tkp'],
    dayaTampung: 40,
    keketatanLabel: 'Ketat (±2,4%)',
    extraRequirement: 'Lolos PG SKD + Tes Psikotes, Kesehatan & Pantukhir',
  },
  {
    id: 'ipdn-mkkp',
    agency: 'IPDN',
    schoolName: 'Institut Pemerintahan Dalam Negeri',
    shortSchool: 'IPDN',
    major: 'D-IV Politik Indonesia Terapan / Kepamongprajaan',
    ministry: 'Kementerian Dalam Negeri',
    city: 'Jatinangor',
    minTotalScore: 396,
    dominantSubtests: ['twk', 'tkp', 'tiu'],
    dayaTampung: 721,
    keketatanLabel: 'Ketat (±3,4%)',
    extraRequirement: 'Lolos PG SKD + Tes Kesehatan, Kesamaptaan & Pantukhir',
  },
  {
    id: 'ipdn-keuda',
    agency: 'IPDN',
    schoolName: 'Institut Pemerintahan Dalam Negeri',
    shortSchool: 'IPDN',
    major: 'D-IV Keuangan Publik & Manajemen Pemerintahan',
    ministry: 'Kementerian Dalam Negeri',
    city: 'Jatinangor',
    minTotalScore: 388,
    dominantSubtests: ['twk', 'tkp', 'tiu'],
    dayaTampung: 380,
    keketatanLabel: 'Ketat (±3,8%)',
    extraRequirement: 'Kuota Provinsi + Tes Kesehatan & Kesamaptaan',
  },
  {
    id: 'stin-agen',
    agency: 'STIN',
    schoolName: 'Sekolah Tinggi Intelijen Negara',
    shortSchool: 'STIN',
    major: 'S1 Agen & Analisis Intelijen',
    ministry: 'Badan Intelijen Negara (BIN)',
    city: 'Bogor',
    minTotalScore: 395,
    dominantSubtests: ['tkp', 'twk', 'tiu'],
    dayaTampung: 400,
    keketatanLabel: 'Ketat (±3,1%)',
    extraRequirement: 'Lolos PG SKD + Psikologi, Kesamaptaan & Mental Ideologi',
  },
  {
    id: 'stmkg-met',
    agency: 'STMKG',
    schoolName: 'Sekolah Tinggi Meteorologi Klimatologi dan Geofisika',
    shortSchool: 'STMKG',
    major: 'D-IV Meteorologi',
    ministry: 'BMKG',
    city: 'Tangerang Selatan',
    minTotalScore: 398,
    dominantSubtests: ['tiu', 'tkp', 'twk'],
    dayaTampung: 45,
    keketatanLabel: 'Ketat (±3,3%)',
    extraRequirement: 'Lolos PG SKD + Tes SKB (Fisika, Matematika & B. Inggris)',
  },
  {
    id: 'stmkg-inst',
    agency: 'STMKG',
    schoolName: 'Sekolah Tinggi Meteorologi Klimatologi dan Geofisika',
    shortSchool: 'STMKG',
    major: 'D-IV Instrumentasi MKG',
    ministry: 'BMKG',
    city: 'Tangerang Selatan',
    minTotalScore: 386,
    dominantSubtests: ['tiu', 'tkp'],
    dayaTampung: 35,
    keketatanLabel: 'Kompetitif (±4,2%)',
    extraRequirement: 'Lolos PG SKD + Tes SKB (Fisika, Matematika & B. Inggris)',
  },
  {
    id: 'poltekim-hukum',
    agency: 'Kemenkumham',
    schoolName: 'Politeknik Imigrasi (Poltekim)',
    shortSchool: 'POLTEKIM',
    major: 'D-IV Hukum Keimigrasian',
    ministry: 'Kementerian Hukum & HAM',
    city: 'Depok',
    minTotalScore: 392,
    dominantSubtests: ['twk', 'tkp', 'tiu'],
    dayaTampung: 150,
    keketatanLabel: 'Ketat (±3,5%)',
    extraRequirement: 'Lolos PG SKD + Kesamaptaan, Kesehatan & Wawancara',
  },
  {
    id: 'poltekip-manaj',
    agency: 'Kemenkumham',
    schoolName: 'Politeknik Ilmu Pemasyarakatan (Poltekip)',
    shortSchool: 'POLTEKIP',
    major: 'D-IV Manajemen Pemasyarakatan',
    ministry: 'Kementerian Hukum & HAM',
    city: 'Depok',
    minTotalScore: 378,
    dominantSubtests: ['tkp', 'twk', 'tiu'],
    dayaTampung: 150,
    keketatanLabel: 'Kompetitif (±4,6%)',
    extraRequirement: 'Lolos PG SKD + Kesamaptaan & Tes Pengamatan Fisik',
  },
  {
    id: 'sttd-trd',
    agency: 'Kemenhub',
    schoolName: 'PTDI-STTD Bekasi',
    shortSchool: 'PTDI-STTD',
    major: 'D-IV Transportasi Darat (Sarjana Terapan)',
    ministry: 'Kementerian Perhubungan',
    city: 'Bekasi',
    minTotalScore: 372,
    dominantSubtests: ['tiu', 'tkp', 'twk'],
    dayaTampung: 240,
    keketatanLabel: 'Kompetitif (±5,1%)',
    extraRequirement: 'Lolos PG SKD + Psikotes, Kesehatan & Kesamaptaan',
  },
  {
    id: 'ppi-curug',
    agency: 'Kemenhub',
    schoolName: 'Politeknik Penerbangan Indonesia Curug',
    shortSchool: 'PPI Curug',
    major: 'D-IV Lalu Lintas Udara & Teknik Navigasi',
    ministry: 'Kementerian Perhubungan',
    city: 'Tangerang',
    minTotalScore: 368,
    dominantSubtests: ['tiu', 'tkp'],
    dayaTampung: 110,
    keketatanLabel: 'Kompetitif (±5,4%)',
    extraRequirement: 'Lolos PG SKD + Kesehatan Penerbangan & Wawancara',
  },
  {
    id: 'pip-semarang',
    agency: 'Kemenhub',
    schoolName: 'Politeknik Ilmu Pelayaran Semarang',
    shortSchool: 'PIP Semarang',
    major: 'D-IV Nautika & Tata Laksana Angkutan Laut',
    ministry: 'Kementerian Perhubungan',
    city: 'Semarang',
    minTotalScore: 356,
    dominantSubtests: ['tkp', 'tiu', 'twk'],
    dayaTampung: 140,
    keketatanLabel: 'Moderat (±6,8%)',
    extraRequirement: 'Lolos PG SKD + Kesamaptaan & Kesehatan Kelautan',
  },
  {
    id: 'pktj-tegal',
    agency: 'Kemenhub',
    schoolName: 'Politeknik Keselamatan Transportasi Jalan',
    shortSchool: 'PKTJ Tegal',
    major: 'D-IV Rekayasa Sistem Transportasi Jalan',
    ministry: 'Kementerian Perhubungan',
    city: 'Tegal',
    minTotalScore: 350,
    dominantSubtests: ['tiu', 'tkp', 'twk'],
    dayaTampung: 95,
    keketatanLabel: 'Moderat (±7,4%)',
    extraRequirement: 'Lolos PG SKD + Psikotes, Kesehatan & Kesamaptaan',
  },
  {
    id: 'ppi-madiun',
    agency: 'Kemenhub',
    schoolName: 'Politeknik Perkeretaapian Indonesia',
    shortSchool: 'PPI Madiun',
    major: 'D-III Teknologi Bangunan & Jalur Perkeretaapian',
    ministry: 'Kementerian Perhubungan',
    city: 'Madiun',
    minTotalScore: 358,
    dominantSubtests: ['tiu', 'tkp', 'twk'],
    dayaTampung: 120,
    keketatanLabel: 'Moderat (±6,9%)',
    extraRequirement: 'Lolos PG SKD + Tes Kesehatan, Kesamaptaan & Wawancara',
  },
  {
    id: 'poltekbang-sby',
    agency: 'Kemenhub',
    schoolName: 'Politeknik Penerbangan Surabaya',
    shortSchool: 'Poltekbang SBY',
    major: 'D-III Teknik Pesawat Udara & Navigasi Udara',
    ministry: 'Kementerian Perhubungan',
    city: 'Surabaya',
    minTotalScore: 362,
    dominantSubtests: ['tiu', 'tkp'],
    dayaTampung: 105,
    keketatanLabel: 'Kompetitif (±5,9%)',
    extraRequirement: 'Lolos PG SKD + Tes Kesehatan Penerbangan & Kesamaptaan',
  },
  {
    id: 'poltekpel-sby',
    agency: 'Kemenhub',
    schoolName: 'Politeknik Pelayaran Surabaya',
    shortSchool: 'Poltekpel SBY',
    major: 'D-III Studi Nautika & Teknika Pelayaran',
    ministry: 'Kementerian Perhubungan',
    city: 'Surabaya',
    minTotalScore: 348,
    dominantSubtests: ['tkp', 'tiu', 'twk'],
    dayaTampung: 130,
    keketatanLabel: 'Moderat (±7,8%)',
    extraRequirement: 'Lolos PG SKD + Kesamaptaan & Kesehatan Pelayaran',
  },
  {
    id: 'stpn-jogja',
    agency: 'STPN & Kementan',
    schoolName: 'Sekolah Tinggi Pertanahan Nasional',
    shortSchool: 'STPN Jogja',
    major: 'D-IV Pertanahan & D-I Pengukuran Kadastral',
    ministry: 'Kementerian ATR/BPN',
    city: 'Yogyakarta',
    minTotalScore: 374,
    dominantSubtests: ['tiu', 'tkp', 'twk'],
    dayaTampung: 240,
    keketatanLabel: 'Kompetitif (±5,3%)',
    extraRequirement: 'Seleksi Akademik Pertanahan (Matematika/Geografi) + Kesehatan',
  },
  {
    id: 'polbangtan-bgr',
    agency: 'STPN & Kementan',
    schoolName: 'Politeknik Pembangunan Pertanian (Polbangtan)',
    shortSchool: 'Polbangtan',
    major: 'D-IV Penyuluhan Pertanian Berkelanjutan & Agribisnis',
    ministry: 'Kementerian Pertanian',
    city: 'Bogor / Malang / Yogyakarta',
    minTotalScore: 340,
    dominantSubtests: ['tkp', 'twk', 'tiu'],
    dayaTampung: 310,
    keketatanLabel: 'Moderat (±8,5%)',
    extraRequirement: 'Seleksi Tertulis, Wawancara & Kesehatan Pertanian',
  },
];

export interface KedinasanScoreSummary {
  sanitizedScores: KedinasanSubtestScores;
  totalScore: number; // twk + tiu + tkp (0..550)
  maxTotalScore: 550;
  passedTwk: boolean;
  passedTiu: boolean;
  passedTkp: boolean;
  passedAllPg: boolean;
  failedPgList: { key: KedinasanSubtestKey; code: string; current: number; required: number; deficit: number }[];
  strongestSubtest: KedinasanSubtestDefinition & { score: number; percent: number };
  weakestSubtest: KedinasanSubtestDefinition & { score: number; percent: number };
  tierLabel: string;
  tierDescription: string;
}

export interface KedinasanMatchResult {
  program: KedinasanProgram;
  scoreDiff: number; // totalScore - program.minTotalScore
  fitStatus: KedinasanFitStatus;
  chancePercent: number;
  neededPointsTotal: number;
  blockedByPg: boolean;
}

export interface KedinasanAnalysisFilter {
  agency?: KedinasanAgency | 'Semua';
  fitStatus?: KedinasanFitStatus | 'Semua';
  searchQuery?: string;
  sortBy?: 'recommended' | 'highest-target' | 'highest-chance';
}

export function sanitizeKedinasanScore(key: KedinasanSubtestKey, value: number): number {
  const def = KEDINASAN_SUBTESTS.find((s) => s.key === key);
  const max = def?.maxScore ?? 225;
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(max, Math.round(value)));
}

export function sanitizeAllKedinasanScores(
  scores: KedinasanSubtestScores
): KedinasanSubtestScores {
  return {
    twk: sanitizeKedinasanScore('twk', scores.twk),
    tiu: sanitizeKedinasanScore('tiu', scores.tiu),
    tkp: sanitizeKedinasanScore('tkp', scores.tkp),
  };
}

export function calculateKedinasanSkdSummary(
  scores: KedinasanSubtestScores
): KedinasanScoreSummary {
  const s = sanitizeAllKedinasanScores(scores);
  const totalScore = s.twk + s.tiu + s.tkp;

  const passedTwk = s.twk >= 65;
  const passedTiu = s.tiu >= 80;
  const passedTkp = s.tkp >= 166;
  const passedAllPg = passedTwk && passedTiu && passedTkp;

  const failedPgList = KEDINASAN_SUBTESTS.filter((def) => s[def.key] < def.passingGrade).map(
    (def) => ({
      key: def.key,
      code: def.code,
      current: s[def.key],
      required: def.passingGrade,
      deficit: def.passingGrade - s[def.key],
    })
  );

  const enriched = KEDINASAN_SUBTESTS.map((def) => ({
    ...def,
    score: s[def.key],
    percent: Math.round((s[def.key] / def.maxScore) * 100),
  }));

  let strongestSubtest = enriched[0];
  let weakestSubtest = enriched[0];
  for (const item of enriched) {
    if (item.percent > strongestSubtest.percent) strongestSubtest = item;
    if (item.percent < weakestSubtest.percent) weakestSubtest = item;
  }

  let tierLabel = 'Belum Memenuhi Ambang Batas (PG)';
  let tierDescription =
    'Minimal satu subtes SKD masih di bawah Passing Grade BKN (TWK 65, TIU 80, TKP 166). Kejar ambang batas wajib terlebih dahulu.';

  if (passedAllPg) {
    if (totalScore >= 430) {
      tierLabel = 'Klaster Elit PKN STAN & STIS';
      tierDescription =
        'Total skor SKD Anda lolos Passing Grade dan berada di zona sangat kompetitif untuk PKN STAN, Polstat STIS, maupun Poltek SSN.';
    } else if (totalScore >= 395) {
      tierLabel = 'Klaster Kompetitif Sekolah Kedinasan Nasional';
      tierDescription =
        'Lolos semua Passing Grade dengan daya saing kuat untuk IPDN, STIN, STMKG, Poltekim, Poltekip, dan Kemenhub.';
    } else if (totalScore >= 355) {
      tierLabel = 'Klaster Peluang Kemenhub & Kedinasan Wilayah';
      tierDescription =
        'Memenuhi ambang batas BKN dan rasional untuk sekolah kedinasan Kemenhub serta beberapa formasi daerah.';
    } else {
      tierLabel = 'Lolos Ambang Batas Minimal (Perlu Tambah Skor Perankingan)';
      tierDescription =
        'Seluruh Passing Grade sudah aman! Tingkatkan total skor minimal +45 poin agar unggul dalam kuota perankingan SKD.';
    }
  }

  return {
    sanitizedScores: s,
    totalScore,
    maxTotalScore: 550,
    passedTwk,
    passedTiu,
    passedTkp,
    passedAllPg,
    failedPgList,
    strongestSubtest,
    weakestSubtest,
    tierLabel,
    tierDescription,
  };
}

export function analyzeKedinasanMatches(
  scores: KedinasanSubtestScores,
  programs: KedinasanProgram[] = KEDINASAN_PROGRAMS,
  filter: KedinasanAnalysisFilter = {}
): KedinasanMatchResult[] {
  const summary = calculateKedinasanSkdSummary(scores);
  const { totalScore, passedAllPg } = summary;
  const agencyFilter = filter.agency ?? 'Semua';
  const statusFilter = filter.fitStatus ?? 'Semua';
  const query = (filter.searchQuery ?? '').trim().toLowerCase();
  const sortBy = filter.sortBy ?? 'recommended';

  const evaluated = programs
    .filter((p) => {
      if (agencyFilter !== 'Semua' && p.agency !== agencyFilter) return false;
      if (query) {
        const hay = `${p.schoolName} ${p.shortSchool} ${p.major} ${p.ministry} ${p.city} ${p.agency}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    })
    .map((program): KedinasanMatchResult => {
      const scoreDiff = totalScore - program.minTotalScore;
      const blockedByPg = !passedAllPg;

      let fitStatus: KedinasanFitStatus;
      if (blockedByPg) {
        fitStatus = 'tantangan';
      } else if (scoreDiff >= 15) {
        fitStatus = 'aman';
      } else if (scoreDiff >= -15) {
        fitStatus = 'kompetitif';
      } else {
        fitStatus = 'tantangan';
      }

      const rawChance = blockedByPg
        ? Math.min(28, 12 + Math.max(0, (totalScore - 260) * 0.08))
        : 64 + scoreDiff * 0.72;
      const chancePercent = Math.max(6, Math.min(97, Math.round(rawChance)));

      const pgDeficitSum = summary.failedPgList.reduce((acc, item) => acc + item.deficit, 0);
      const neededPointsTotal = Math.max(
        scoreDiff < 0 ? Math.abs(scoreDiff) : 0,
        pgDeficitSum
      );

      return {
        program,
        scoreDiff,
        fitStatus,
        chancePercent,
        neededPointsTotal,
        blockedByPg,
      };
    })
    .filter((item) => statusFilter === 'Semua' || item.fitStatus === statusFilter);

  const order: Record<KedinasanFitStatus, number> = {
    kompetitif: 0,
    aman: 1,
    tantangan: 2,
  };

  evaluated.sort((a, b) => {
    if (sortBy === 'highest-target') {
      return b.program.minTotalScore - a.program.minTotalScore;
    }
    if (sortBy === 'highest-chance') {
      return b.chancePercent - a.chancePercent || b.program.minTotalScore - a.program.minTotalScore;
    }
    const tierDiff = order[a.fitStatus] - order[b.fitStatus];
    if (tierDiff !== 0) return tierDiff;
    if (a.fitStatus === 'aman') {
      return b.program.minTotalScore - a.program.minTotalScore;
    }
    return Math.abs(a.scoreDiff) - Math.abs(b.scoreDiff);
  });

  return evaluated;
}

export function pickStrategicKedinasanChoices(matches: KedinasanMatchResult[]): {
  pilihan1: KedinasanMatchResult | null;
  pilihan2: KedinasanMatchResult | null;
} {
  if (matches.length === 0) return { pilihan1: null, pilihan2: null };

  const amanList = [...matches]
    .filter((m) => m.fitStatus === 'aman')
    .sort((a, b) => b.program.minTotalScore - a.program.minTotalScore);
  const kompetitifList = [...matches]
    .filter((m) => m.fitStatus === 'kompetitif')
    .sort((a, b) => b.chancePercent - a.chancePercent);
  const tantanganList = [...matches]
    .filter((m) => m.fitStatus === 'tantangan')
    .sort((a, b) => a.neededPointsTotal - b.neededPointsTotal);

  const pilihan1 = kompetitifList[0] ?? amanList[0] ?? tantanganList[0] ?? null;
  const pilihan2Pool = amanList.filter((m) => m.program.id !== pilihan1?.program.id);
  const pilihan2 =
    pilihan2Pool[0] ??
    kompetitifList.find((m) => m.program.id !== pilihan1?.program.id) ??
    tantanganList.find((m) => m.program.id !== pilihan1?.program.id) ??
    null;

  return { pilihan1, pilihan2 };
}

export function estimateKedinasanFromGrade(grade0To100: number): KedinasanSubtestScores {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(grade0To100) ? grade0To100 : 0));
  const ratio = 0.45 + (clamped / 100) * 0.45; // 45%..90% mastery
  return sanitizeAllKedinasanScores({
    twk: Math.round(150 * ratio),
    tiu: Math.round(175 * ratio),
    tkp: Math.round(225 * Math.min(0.95, ratio + 0.06)),
  });
}

export function estimateKedinasanFromHistory(
  records: HistoryRecord[]
): KedinasanSubtestScores | null {
  if (!records || records.length === 0) return null;
  const skdLike = records.filter((r) => /skd|kedinasan|twk|tiu|tkp|stan|stis|ipdn/i.test(r.quizTitle));
  const pool = skdLike.length > 0 ? skdLike : records;
  const avgGrade = pool.reduce((sum, r) => sum + r.grade, 0) / pool.length;
  return estimateKedinasanFromGrade(avgGrade);
}
