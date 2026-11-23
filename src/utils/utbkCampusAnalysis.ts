import type { HistoryRecord } from '../types/quiz';

export type UtbkSubtestKey = 'pu' | 'ppu' | 'pbm' | 'pk' | 'lbi' | 'lbe' | 'pm';

export type UtbkSubtestScores = Record<UtbkSubtestKey, number>;

export type CampusRumpun = 'Saintek' | 'Soshum' | 'Campuran';

export type MatchFitStatus = 'aman' | 'kompetitif' | 'tantangan';

export interface SubtestDefinition {
  key: UtbkSubtestKey;
  code: string;
  label: string;
  group: 'TPS' | 'Literasi & PM';
  description: string;
}

export const UTBK_SUBTESTS: SubtestDefinition[] = [
  {
    key: 'pu',
    code: 'PU',
    label: 'Penalaran Umum',
    group: 'TPS',
    description: 'Penalaran induktif, deduktif, dan kuantitatif dasar',
  },
  {
    key: 'ppu',
    code: 'PPU',
    label: 'Pengetahuan & Pemahaman Umum',
    group: 'TPS',
    description: 'Kosakata, makna konteks, dan struktur paragraf',
  },
  {
    key: 'pbm',
    code: 'PBM',
    label: 'Pemahaman Bacaan & Menulis',
    group: 'TPS',
    description: 'Ejaan (PUEBI/EYD V), kalimat efektif, dan inti bacaan',
  },
  {
    key: 'pk',
    code: 'PK',
    label: 'Pengetahuan Kuantitatif',
    group: 'TPS',
    description: 'Aljabar, geometri, aritmetika, dan statistika dasar',
  },
  {
    key: 'lbi',
    code: 'LBI',
    label: 'Literasi Bahasa Indonesia',
    group: 'Literasi & PM',
    description: 'Analisis teks panjang, argumen, dan literasi wacana',
  },
  {
    key: 'lbe',
    code: 'LBE',
    label: 'Literasi Bahasa Inggris',
    group: 'Literasi & PM',
    description: 'Main idea, inference, author tone, dan comprehension',
  },
  {
    key: 'pm',
    code: 'PM',
    label: 'Penalaran Matematika',
    group: 'Literasi & PM',
    description: 'Pemodelan matematika kontekstual kehidupan nyata',
  },
];

export const DEFAULT_UTBK_SCORES: UtbkSubtestScores = {
  pu: 640,
  ppu: 615,
  pbm: 625,
  pk: 605,
  lbi: 650,
  lbe: 610,
  pm: 635,
};

export interface CampusProgram {
  id: string;
  universityId?: string;
  university: string;
  shortUniv: string;
  major: string;
  rumpun: CampusRumpun;
  city: string;
  province?: string;
  region?: string;
  minTotalScore: number; // Sum of all 7 subtests (0..7000)
  dominantSubtests: UtbkSubtestKey[];
  akreditasi: 'Unggul' | 'A';
  dayaTampung: number;
  keketatanLabel: string;
}

export const CAMPUS_PROGRAMS: CampusProgram[] = [
  {
    id: 'ui-fk',
    university: 'Universitas Indonesia',
    shortUniv: 'UI',
    major: 'Pendidikan Dokter',
    rumpun: 'Saintek',
    city: 'Depok',
    minTotalScore: 5390,
    dominantSubtests: ['pu', 'lbi', 'pk'],
    akreditasi: 'Unggul',
    dayaTampung: 75,
    keketatanLabel: 'Sangat Ketat (±1,5%)',
  },
  {
    id: 'itb-steik',
    university: 'Institut Teknologi Bandung',
    shortUniv: 'ITB',
    major: 'STEI - Komputasi (Informatika/SI)',
    rumpun: 'Saintek',
    city: 'Bandung',
    minTotalScore: 5250,
    dominantSubtests: ['pm', 'pk', 'pu'],
    akreditasi: 'Unggul',
    dayaTampung: 110,
    keketatanLabel: 'Sangat Ketat (±2,1%)',
  },
  {
    id: 'ugm-fk',
    university: 'Universitas Gadjah Mada',
    shortUniv: 'UGM',
    major: 'Kedokteran',
    rumpun: 'Saintek',
    city: 'Yogyakarta',
    minTotalScore: 5215,
    dominantSubtests: ['pu', 'lbi', 'pm'],
    akreditasi: 'Unggul',
    dayaTampung: 55,
    keketatanLabel: 'Sangat Ketat (±1,6%)',
  },
  {
    id: 'ui-ilkom',
    university: 'Universitas Indonesia',
    shortUniv: 'UI',
    major: 'Ilmu Komputer',
    rumpun: 'Saintek',
    city: 'Depok',
    minTotalScore: 5110,
    dominantSubtests: ['pm', 'pk', 'lbe'],
    akreditasi: 'Unggul',
    dayaTampung: 80,
    keketatanLabel: 'Sangat Ketat (±2,4%)',
  },
  {
    id: 'ui-akuntansi',
    university: 'Universitas Indonesia',
    shortUniv: 'UI',
    major: 'Akuntansi',
    rumpun: 'Soshum',
    city: 'Depok',
    minTotalScore: 4970,
    dominantSubtests: ['pk', 'pu', 'lbe'],
    akreditasi: 'Unggul',
    dayaTampung: 115,
    keketatanLabel: 'Ketat (±3,2%)',
  },
  {
    id: 'ugm-hukum',
    university: 'Universitas Gadjah Mada',
    shortUniv: 'UGM',
    major: 'Ilmu Hukum',
    rumpun: 'Soshum',
    city: 'Yogyakarta',
    minTotalScore: 4865,
    dominantSubtests: ['lbi', 'ppu', 'pbm'],
    akreditasi: 'Unggul',
    dayaTampung: 105,
    keketatanLabel: 'Ketat (±3,5%)',
  },
  {
    id: 'itb-sbm',
    university: 'Institut Teknologi Bandung',
    shortUniv: 'ITB',
    major: 'Sekolah Bisnis & Manajemen (SBM)',
    rumpun: 'Soshum',
    city: 'Bandung',
    minTotalScore: 4900,
    dominantSubtests: ['lbe', 'pk', 'pu'],
    akreditasi: 'Unggul',
    dayaTampung: 90,
    keketatanLabel: 'Ketat (±3,1%)',
  },
  {
    id: 'ui-hi',
    university: 'Universitas Indonesia',
    shortUniv: 'UI',
    major: 'Ilmu Hubungan Internasional',
    rumpun: 'Soshum',
    city: 'Depok',
    minTotalScore: 4935,
    dominantSubtests: ['lbe', 'lbi', 'ppu'],
    akreditasi: 'Unggul',
    dayaTampung: 28,
    keketatanLabel: 'Sangat Ketat (±2,0%)',
  },
  {
    id: 'itb-fti',
    university: 'Institut Teknologi Bandung',
    shortUniv: 'ITB',
    major: 'Fakultas Teknologi Industri (FTI)',
    rumpun: 'Saintek',
    city: 'Bandung',
    minTotalScore: 4935,
    dominantSubtests: ['pm', 'pk', 'pu'],
    akreditasi: 'Unggul',
    dayaTampung: 140,
    keketatanLabel: 'Ketat (±3,4%)',
  },
  {
    id: 'its-informatika',
    university: 'Institut Teknologi Sepuluh Nopember',
    shortUniv: 'ITS',
    major: 'Teknik Informatika',
    rumpun: 'Saintek',
    city: 'Surabaya',
    minTotalScore: 4830,
    dominantSubtests: ['pm', 'pk', 'pu'],
    akreditasi: 'Unggul',
    dayaTampung: 95,
    keketatanLabel: 'Ketat (±3,6%)',
  },
  {
    id: 'unpad-fk',
    university: 'Universitas Padjadjaran',
    shortUniv: 'UNPAD',
    major: 'Pendidikan Dokter',
    rumpun: 'Saintek',
    city: 'Sumedang',
    minTotalScore: 4970,
    dominantSubtests: ['pu', 'lbi', 'pm'],
    akreditasi: 'Unggul',
    dayaTampung: 90,
    keketatanLabel: 'Ketat (±2,8%)',
  },
  {
    id: 'unair-fk',
    university: 'Universitas Airlangga',
    shortUniv: 'UNAIR',
    major: 'Kedokteran',
    rumpun: 'Saintek',
    city: 'Surabaya',
    minTotalScore: 5040,
    dominantSubtests: ['pu', 'lbi', 'pk'],
    akreditasi: 'Unggul',
    dayaTampung: 105,
    keketatanLabel: 'Ketat (±2,7%)',
  },
  {
    id: 'ugm-psikologi',
    university: 'Universitas Gadjah Mada',
    shortUniv: 'UGM',
    major: 'Psikologi',
    rumpun: 'Campuran',
    city: 'Yogyakarta',
    minTotalScore: 4760,
    dominantSubtests: ['pu', 'lbi', 'pbm'],
    akreditasi: 'Unggul',
    dayaTampung: 75,
    keketatanLabel: 'Ketat (±3,9%)',
  },
  {
    id: 'ui-manajemen',
    university: 'Universitas Indonesia',
    shortUniv: 'UI',
    major: 'Manajemen',
    rumpun: 'Soshum',
    city: 'Depok',
    minTotalScore: 4865,
    dominantSubtests: ['pk', 'lbe', 'pu'],
    akreditasi: 'Unggul',
    dayaTampung: 120,
    keketatanLabel: 'Ketat (±3,3%)',
  },
  {
    id: 'ipb-statistika',
    university: 'IPB University',
    shortUniv: 'IPB',
    major: 'Statistika dan Sains Data',
    rumpun: 'Saintek',
    city: 'Bogor',
    minTotalScore: 4690,
    dominantSubtests: ['pm', 'pk', 'pu'],
    akreditasi: 'Unggul',
    dayaTampung: 52,
    keketatanLabel: 'Ketat (±4,2%)',
  },
  {
    id: 'undip-sipil',
    university: 'Universitas Diponegoro',
    shortUniv: 'UNDIP',
    major: 'Teknik Sipil',
    rumpun: 'Saintek',
    city: 'Semarang',
    minTotalScore: 4550,
    dominantSubtests: ['pm', 'pk', 'pu'],
    akreditasi: 'Unggul',
    dayaTampung: 95,
    keketatanLabel: 'Kompetitif (±5,4%)',
  },
  {
    id: 'undip-hukum',
    university: 'Universitas Diponegoro',
    shortUniv: 'UNDIP',
    major: 'Ilmu Hukum',
    rumpun: 'Soshum',
    city: 'Semarang',
    minTotalScore: 4480,
    dominantSubtests: ['lbi', 'ppu', 'pbm'],
    akreditasi: 'Unggul',
    dayaTampung: 310,
    keketatanLabel: 'Kompetitif (±6,1%)',
  },
  {
    id: 'ub-ti',
    university: 'Universitas Brawijaya',
    shortUniv: 'UB',
    major: 'Teknik Informatika',
    rumpun: 'Saintek',
    city: 'Malang',
    minTotalScore: 4620,
    dominantSubtests: ['pm', 'pk', 'pu'],
    akreditasi: 'Unggul',
    dayaTampung: 105,
    keketatanLabel: 'Kompetitif (±4,8%)',
  },
  {
    id: 'ub-manajemen',
    university: 'Universitas Brawijaya',
    shortUniv: 'UB',
    major: 'Manajemen',
    rumpun: 'Soshum',
    city: 'Malang',
    minTotalScore: 4445,
    dominantSubtests: ['pu', 'pk', 'lbi'],
    akreditasi: 'Unggul',
    dayaTampung: 155,
    keketatanLabel: 'Kompetitif (±5,9%)',
  },
  {
    id: 'unpad-ilkom',
    university: 'Universitas Padjadjaran',
    shortUniv: 'UNPAD',
    major: 'Ilmu Komunikasi',
    rumpun: 'Soshum',
    city: 'Sumedang',
    minTotalScore: 4620,
    dominantSubtests: ['lbi', 'lbe', 'pbm'],
    akreditasi: 'Unggul',
    dayaTampung: 48,
    keketatanLabel: 'Ketat (±3,8%)',
  },
  {
    id: 'its-si',
    university: 'Institut Teknologi Sepuluh Nopember',
    shortUniv: 'ITS',
    major: 'Sistem Informasi',
    rumpun: 'Campuran',
    city: 'Surabaya',
    minTotalScore: 4690,
    dominantSubtests: ['pm', 'pu', 'lbe'],
    akreditasi: 'Unggul',
    dayaTampung: 80,
    keketatanLabel: 'Ketat (±4,4%)',
  },
  {
    id: 'ipb-ilkom',
    university: 'IPB University',
    shortUniv: 'IPB',
    major: 'Ilmu Komputer',
    rumpun: 'Saintek',
    city: 'Bogor',
    minTotalScore: 4620,
    dominantSubtests: ['pm', 'pk', 'lbe'],
    akreditasi: 'Unggul',
    dayaTampung: 68,
    keketatanLabel: 'Ketat (±4,7%)',
  },
  {
    id: 'unair-farmasi',
    university: 'Universitas Airlangga',
    shortUniv: 'UNAIR',
    major: 'Farmasi',
    rumpun: 'Saintek',
    city: 'Surabaya',
    minTotalScore: 4585,
    dominantSubtests: ['pu', 'pk', 'lbi'],
    akreditasi: 'Unggul',
    dayaTampung: 100,
    keketatanLabel: 'Kompetitif (±5,0%)',
  },
  {
    id: 'uns-dkv',
    university: 'Universitas Sebelas Maret',
    shortUniv: 'UNS',
    major: 'Desain Komunikasi Visual (DKV)',
    rumpun: 'Soshum',
    city: 'Surakarta',
    minTotalScore: 4270,
    dominantSubtests: ['ppu', 'lbi', 'pu'],
    akreditasi: 'Unggul',
    dayaTampung: 65,
    keketatanLabel: 'Kompetitif (±6,5%)',
  },
  {
    id: 'uns-informatika',
    university: 'Universitas Sebelas Maret',
    shortUniv: 'UNS',
    major: 'Informatika',
    rumpun: 'Saintek',
    city: 'Surakarta',
    minTotalScore: 4515,
    dominantSubtests: ['pm', 'pk', 'pu'],
    akreditasi: 'Unggul',
    dayaTampung: 55,
    keketatanLabel: 'Kompetitif (±5,2%)',
  },
  {
    id: 'upi-pend-mat',
    university: 'Universitas Pendidikan Indonesia',
    shortUniv: 'UPI',
    major: 'Pendidikan Matematika',
    rumpun: 'Saintek',
    city: 'Bandung',
    minTotalScore: 4200,
    dominantSubtests: ['pm', 'pk', 'pu'],
    akreditasi: 'Unggul',
    dayaTampung: 50,
    keketatanLabel: 'Moderat (±8,2%)',
  },
  {
    id: 'uny-pgsd',
    university: 'Universitas Negeri Yogyakarta',
    shortUniv: 'UNY',
    major: 'Pendidikan Guru Sekolah Dasar (PGSD)',
    rumpun: 'Campuran',
    city: 'Yogyakarta',
    minTotalScore: 4165,
    dominantSubtests: ['lbi', 'pbm', 'pu'],
    akreditasi: 'Unggul',
    dayaTampung: 120,
    keketatanLabel: 'Moderat (±8,5%)',
  },
  {
    id: 'unnes-kesehatan',
    university: 'Universitas Negeri Semarang',
    shortUniv: 'UNNES',
    major: 'Kesehatan Masyarakat',
    rumpun: 'Saintek',
    city: 'Semarang',
    minTotalScore: 4200,
    dominantSubtests: ['lbi', 'pu', 'ppu'],
    akreditasi: 'Unggul',
    dayaTampung: 110,
    keketatanLabel: 'Moderat (±7,9%)',
  },
  {
    id: 'upnvj-akuntansi',
    university: 'UPN Veteran Jakarta',
    shortUniv: 'UPNVJ',
    major: 'Akuntansi',
    rumpun: 'Soshum',
    city: 'Jakarta',
    minTotalScore: 4305,
    dominantSubtests: ['pk', 'pu', 'lbi'],
    akreditasi: 'Unggul',
    dayaTampung: 105,
    keketatanLabel: 'Kompetitif (±6,8%)',
  },
  {
    id: 'unj-ilkom',
    university: 'Universitas Negeri Jakarta',
    shortUniv: 'UNJ',
    major: 'Ilmu Komunikasi',
    rumpun: 'Soshum',
    city: 'Jakarta',
    minTotalScore: 4235,
    dominantSubtests: ['lbi', 'lbe', 'pbm'],
    akreditasi: 'Unggul',
    dayaTampung: 40,
    keketatanLabel: 'Kompetitif (±6,9%)',
  },
  {
    id: 'unhas-sipil',
    university: 'Universitas Hasanuddin',
    shortUniv: 'UNHAS',
    major: 'Teknik Sipil',
    rumpun: 'Saintek',
    city: 'Makassar',
    minTotalScore: 4095,
    dominantSubtests: ['pm', 'pk', 'pu'],
    akreditasi: 'Unggul',
    dayaTampung: 80,
    keketatanLabel: 'Moderat (±9,4%)',
  },
  {
    id: 'usu-hukum',
    university: 'Universitas Sumatera Utara',
    shortUniv: 'USU',
    major: 'Ilmu Hukum',
    rumpun: 'Soshum',
    city: 'Medan',
    minTotalScore: 4130,
    dominantSubtests: ['lbi', 'ppu', 'pbm'],
    akreditasi: 'Unggul',
    dayaTampung: 240,
    keketatanLabel: 'Moderat (±9,1%)',
  },
  {
    id: 'unand-farmasi',
    university: 'Universitas Andalas',
    shortUniv: 'UNAND',
    major: 'Farmasi',
    rumpun: 'Saintek',
    city: 'Padang',
    minTotalScore: 4340,
    dominantSubtests: ['pu', 'pk', 'lbi'],
    akreditasi: 'Unggul',
    dayaTampung: 75,
    keketatanLabel: 'Kompetitif (±6,4%)',
  },
  {
    id: 'unsri-ti',
    university: 'Universitas Sriwijaya',
    shortUniv: 'UNSRI',
    major: 'Teknik Informatika',
    rumpun: 'Saintek',
    city: 'Palembang',
    minTotalScore: 4200,
    dominantSubtests: ['pm', 'pk', 'pu'],
    akreditasi: 'Unggul',
    dayaTampung: 120,
    keketatanLabel: 'Moderat (±7,8%)',
  },
  {
    id: 'unja-fk',
    university: 'Universitas Jambi',
    shortUniv: 'UNJA',
    major: 'Kedokteran',
    rumpun: 'Saintek',
    city: 'Jambi',
    minTotalScore: 4550,
    dominantSubtests: ['pu', 'lbi', 'pk'],
    akreditasi: 'A',
    dayaTampung: 70,
    keketatanLabel: 'Ketat (±4,5%)',
  },
  {
    id: 'unja-si',
    university: 'Universitas Jambi',
    shortUniv: 'UNJA',
    major: 'Sistem Informasi',
    rumpun: 'Campuran',
    city: 'Jambi',
    minTotalScore: 3780,
    dominantSubtests: ['pm', 'pu', 'lbe'],
    akreditasi: 'A',
    dayaTampung: 65,
    keketatanLabel: 'Peluang Terbuka (±12,5%)',
  },
  {
    id: 'unja-hukum',
    university: 'Universitas Jambi',
    shortUniv: 'UNJA',
    major: 'Ilmu Hukum',
    rumpun: 'Soshum',
    city: 'Jambi',
    minTotalScore: 3640,
    dominantSubtests: ['lbi', 'ppu', 'pbm'],
    akreditasi: 'Unggul',
    dayaTampung: 185,
    keketatanLabel: 'Peluang Terbuka (±14,2%)',
  },
  {
    id: 'unila-agribisnis',
    university: 'Universitas Lampung',
    shortUniv: 'UNILA',
    major: 'Agribisnis',
    rumpun: 'Campuran',
    city: 'Bandar Lampung',
    minTotalScore: 3570,
    dominantSubtests: ['pu', 'lbi', 'pk'],
    akreditasi: 'Unggul',
    dayaTampung: 90,
    keketatanLabel: 'Peluang Terbuka (±15,8%)',
  },
];

export interface UtbkScoreSummary {
  sanitizedScores: UtbkSubtestScores;
  totalScore: number; // Sum of all 7 subtests (0..7000)
  maxTotalScore: 7000;
  tpsTotal: number; // pu + ppu + pbm + pk (0..4000)
  literasiTotal: number; // lbi + lbe + pm (0..3000)
  averageScore: number; // Math.round(totalScore / 7)
  strongestSubtest: SubtestDefinition & { score: number };
  weakestSubtest: SubtestDefinition & { score: number };
  tierLabel: string;
  tierDescription: string;
}

export interface CampusMatchResult {
  program: CampusProgram;
  requiredAverage: number;
  scoreDiff: number; // totalScore - program.minTotalScore
  fitStatus: MatchFitStatus;
  chancePercent: number;
  neededPointsTotal: number;
  neededPointsPerSubtest: number;
  dominantAverage: number;
}

export interface CampusAnalysisFilter {
  rumpun?: CampusRumpun | 'Semua';
  fitStatus?: MatchFitStatus | 'Semua';
  region?: string;
  universityId?: string;
  searchQuery?: string;
  sortBy?: 'recommended' | 'highest-target' | 'highest-chance';
}

export function sanitizeSubtestScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1000, Math.round(value)));
}

export function sanitizeAllSubtestScores(scores: UtbkSubtestScores): UtbkSubtestScores {
  return {
    pu: sanitizeSubtestScore(scores.pu),
    ppu: sanitizeSubtestScore(scores.ppu),
    pbm: sanitizeSubtestScore(scores.pbm),
    pk: sanitizeSubtestScore(scores.pk),
    lbi: sanitizeSubtestScore(scores.lbi),
    lbe: sanitizeSubtestScore(scores.lbe),
    pm: sanitizeSubtestScore(scores.pm),
  };
}

export function calculateUtbkScoreSummary(scores: UtbkSubtestScores): UtbkScoreSummary {
  const s = sanitizeAllSubtestScores(scores);
  const tpsTotal = s.pu + s.ppu + s.pbm + s.pk;
  const literasiTotal = s.lbi + s.lbe + s.pm;
  const totalScore = tpsTotal + literasiTotal;
  const averageScore = Math.round(totalScore / 7);

  let strongest = { ...UTBK_SUBTESTS[0], score: s[UTBK_SUBTESTS[0].key] };
  let weakest = { ...UTBK_SUBTESTS[0], score: s[UTBK_SUBTESTS[0].key] };

  for (const def of UTBK_SUBTESTS) {
    const val = s[def.key];
    if (val > strongest.score) strongest = { ...def, score: val };
    if (val < weakest.score) weakest = { ...def, score: val };
  }

  let tierLabel = 'Bangun Fondasi Subtes';
  let tierDescription =
    'Fokus kuatkan subtes terendah lewat Try Out bertarget untuk menembus total skor 4.200+.';

  if (totalScore >= 5100) {
    tierLabel = 'Klaster Elit Top PTN Nasional';
    tierDescription =
      'Total skor gabungan 7 subtes Anda berada di zona sangat kompetitif untuk FK, STEI, dan prodi favorit UI/ITB/UGM.';
  } else if (totalScore >= 4600) {
    tierLabel = 'Klaster Sangat Kompetitif PTN Favorit';
    tierDescription =
      'Peluang kuat di PTN top nasional (ITS, UNPAD, UNAIR, IPB, UNDIP, UB) dan prodi unggulan UI/UGM.';
  } else if (totalScore >= 4100) {
    tierLabel = 'Klaster Kompetitif PTN Nasional';
    tierDescription =
      'Sangat rasional untuk UNS, UPI, UNY, UNNES, UNHAS, USU, UNSRI, serta berbagai jurusan favorit PTN wilayah.';
  } else if (totalScore >= 3500) {
    tierLabel = 'Klaster Strategis & PTN Regional';
    tierDescription =
      'Peluang terbuka di PTN regional berkualitas (UNJA, UNILA, dsb.) sembari menaikkan rata-rata 50+ poin/subtes.';
  }

  return {
    sanitizedScores: s,
    totalScore,
    maxTotalScore: 7000,
    tpsTotal,
    literasiTotal,
    averageScore,
    strongestSubtest: strongest,
    weakestSubtest: weakest,
    tierLabel,
    tierDescription,
  };
}

export function analyzeCampusMatches(
  scores: UtbkSubtestScores,
  programs: CampusProgram[] = CAMPUS_PROGRAMS,
  filter: CampusAnalysisFilter = {}
): CampusMatchResult[] {
  const summary = calculateUtbkScoreSummary(scores);
  const { totalScore, sanitizedScores } = summary;
  const query = (filter.searchQuery ?? '').trim().toLowerCase();
  const rumpunFilter = filter.rumpun ?? 'Semua';
  const statusFilter = filter.fitStatus ?? 'Semua';
  const regionFilter = filter.region ?? 'Semua Wilayah';
  const universityFilter = filter.universityId ?? 'Semua';
  const sortBy = filter.sortBy ?? 'recommended';

  const evaluated = programs
    .filter((p) => {
      if (rumpunFilter !== 'Semua' && p.rumpun !== rumpunFilter) return false;
      if (regionFilter && regionFilter !== 'Semua Wilayah' && p.region !== regionFilter) {
        return false;
      }
      if (universityFilter && universityFilter !== 'Semua') {
        const matchesUnivId =
          p.universityId === universityFilter || p.id.startsWith(`${universityFilter}-`);
        if (!matchesUnivId) return false;
      }
      if (query) {
        const hay = `${p.university} ${p.shortUniv} ${p.major} ${p.city} ${p.province ?? ''} ${p.region ?? ''} ${p.rumpun}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    })
    .map((program): CampusMatchResult => {
      const scoreDiff = totalScore - program.minTotalScore;
      const requiredAverage = Math.round(program.minTotalScore / 7);
      const fitStatus: MatchFitStatus =
        scoreDiff >= 140 ? 'aman' : scoreDiff >= -140 ? 'kompetitif' : 'tantangan';

      const domTotal = program.dominantSubtests.reduce(
        (acc, key) => acc + sanitizedScores[key],
        0
      );
      const dominantAverage = Math.round(
        domTotal / Math.max(1, program.dominantSubtests.length)
      );
      const dominantBonus = (dominantAverage - requiredAverage) * 0.04;

      const rawChance = 62 + scoreDiff * 0.075 + dominantBonus;
      const chancePercent = Math.max(8, Math.min(97, Math.round(rawChance)));

      const neededPointsTotal = scoreDiff < 0 ? Math.abs(scoreDiff) : 0;
      const neededPointsPerSubtest =
        neededPointsTotal > 0 ? Math.ceil(neededPointsTotal / 7) : 0;

      return {
        program,
        requiredAverage,
        scoreDiff,
        fitStatus,
        chancePercent,
        neededPointsTotal,
        neededPointsPerSubtest,
        dominantAverage,
      };
    })
    .filter((item) => statusFilter === 'Semua' || item.fitStatus === statusFilter);

  const statusOrder: Record<MatchFitStatus, number> = {
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
    // recommended: show ideal closest competitive & reachable high-target programs first
    const tierDiff = statusOrder[a.fitStatus] - statusOrder[b.fitStatus];
    if (tierDiff !== 0) return tierDiff;
    if (a.fitStatus === 'aman') {
      return b.program.minTotalScore - a.program.minTotalScore;
    }
    return Math.abs(a.scoreDiff) - Math.abs(b.scoreDiff);
  });

  return evaluated;
}

export function pickStrategicChoices(matches: CampusMatchResult[]): {
  pilihan1: CampusMatchResult | null;
  pilihan2: CampusMatchResult | null;
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

export function estimateSubtestsFromGrade(grade0To100: number): UtbkSubtestScores {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(grade0To100) ? grade0To100 : 0));
  // Convert quiz grade 0..100 to realistic UTBK IRT subtest baseline 340..840
  const base = Math.round(340 + clamped * 5);
  return sanitizeAllSubtestScores({
    pu: base + 15,
    ppu: base - 10,
    pbm: base,
    pk: base - 15,
    lbi: base + 20,
    lbe: base - 5,
    pm: base + 5,
  });
}

export function estimateSubtestsFromHistory(records: HistoryRecord[]): UtbkSubtestScores | null {
  if (!records || records.length === 0) return null;
  const utbkLike = records.filter((r) => /utbk|snbt|tps|literasi/i.test(r.quizTitle));
  const pool = utbkLike.length > 0 ? utbkLike : records;
  const avgGrade = pool.reduce((sum, r) => sum + r.grade, 0) / pool.length;
  return estimateSubtestsFromGrade(avgGrade);
}
