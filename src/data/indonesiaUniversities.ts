import type { CampusProgram, CampusRumpun, UtbkSubtestKey } from '../utils/utbkCampusAnalysis';

export type IndonesiaRegion =
  | 'Sumatra'
  | 'Jawa Barat, DKI & Banten'
  | 'Jawa Tengah & DIY'
  | 'Jawa Timur'
  | 'Bali & Nusa Tenggara'
  | 'Kalimantan'
  | 'Sulawesi'
  | 'Maluku & Papua';

export type UniversityProfile = 'comprehensive' | 'tech-institut' | 'agriculture' | 'education' | 'islamic' | 'arts';

export interface IndonesianUniversityMeta {
  id: string;
  shortName: string;
  name: string;
  city: string;
  province: string;
  region: IndonesiaRegion;
  tierScore: number; // baseline multiplier: 1..10
  akreditasi: 'Unggul' | 'A';
  profile: UniversityProfile;
  hasMedical?: boolean;
}

export interface MajorTemplate {
  id: string;
  name: string;
  rumpun: CampusRumpun;
  baseMinTotal: number; // baseline sum of 7 UTBK subtests
  dominantSubtests: UtbkSubtestKey[];
  baseQuota: number;
  profiles: UniversityProfile[];
  requiresMedical?: boolean;
}

export const MAJOR_TEMPLATES: MajorTemplate[] = [
  // Kedokteran & Kesehatan
  {
    id: 'kedokteran',
    name: 'Pendidikan Dokter / Kedokteran',
    rumpun: 'Saintek',
    baseMinTotal: 4480,
    dominantSubtests: ['pu', 'lbi', 'pk'],
    baseQuota: 80,
    profiles: ['comprehensive', 'islamic'],
    requiresMedical: true,
  },
  {
    id: 'kedokteran-gigi',
    name: 'Kedokteran Gigi',
    rumpun: 'Saintek',
    baseMinTotal: 4280,
    dominantSubtests: ['pu', 'lbi', 'pm'],
    baseQuota: 55,
    profiles: ['comprehensive'],
    requiresMedical: true,
  },
  {
    id: 'farmasi',
    name: 'Farmasi',
    rumpun: 'Saintek',
    baseMinTotal: 4120,
    dominantSubtests: ['pu', 'pk', 'lbi'],
    baseQuota: 75,
    profiles: ['comprehensive', 'islamic'],
  },
  {
    id: 'keperawatan',
    name: 'Ilmu Keperawatan',
    rumpun: 'Saintek',
    baseMinTotal: 3820,
    dominantSubtests: ['lbi', 'pu', 'ppu'],
    baseQuota: 90,
    profiles: ['comprehensive', 'islamic'],
  },
  {
    id: 'kesmas',
    name: 'Kesehatan Masyarakat',
    rumpun: 'Saintek',
    baseMinTotal: 3860,
    dominantSubtests: ['lbi', 'pu', 'ppu'],
    baseQuota: 95,
    profiles: ['comprehensive', 'education', 'islamic'],
  },
  {
    id: 'ilmu-gizi',
    name: 'Ilmu Gizi',
    rumpun: 'Saintek',
    baseMinTotal: 3920,
    dominantSubtests: ['pu', 'lbi', 'pk'],
    baseQuota: 65,
    profiles: ['comprehensive', 'agriculture', 'education'],
  },

  // Teknik & Komputasi
  {
    id: 'informatika',
    name: 'Teknik Informatika / Ilmu Komputer',
    rumpun: 'Saintek',
    baseMinTotal: 4220,
    dominantSubtests: ['pm', 'pk', 'pu'],
    baseQuota: 95,
    profiles: ['comprehensive', 'tech-institut', 'agriculture', 'education', 'islamic'],
  },
  {
    id: 'sistem-informasi',
    name: 'Sistem Informasi',
    rumpun: 'Campuran',
    baseMinTotal: 4060,
    dominantSubtests: ['pm', 'pu', 'lbe'],
    baseQuota: 85,
    profiles: ['comprehensive', 'tech-institut', 'islamic'],
  },
  {
    id: 'sains-data',
    name: 'Sains Data / Teknologi Informasi',
    rumpun: 'Saintek',
    baseMinTotal: 4140,
    dominantSubtests: ['pm', 'pk', 'lbe'],
    baseQuota: 60,
    profiles: ['comprehensive', 'tech-institut', 'agriculture'],
  },
  {
    id: 'teknik-sipil',
    name: 'Teknik Sipil',
    rumpun: 'Saintek',
    baseMinTotal: 4020,
    dominantSubtests: ['pm', 'pk', 'pu'],
    baseQuota: 95,
    profiles: ['comprehensive', 'tech-institut', 'education'],
  },
  {
    id: 'arsitektur',
    name: 'Arsitektur',
    rumpun: 'Saintek',
    baseMinTotal: 4050,
    dominantSubtests: ['pm', 'pu', 'ppu'],
    baseQuota: 65,
    profiles: ['comprehensive', 'tech-institut', 'education', 'islamic'],
  },
  {
    id: 'teknik-elektro',
    name: 'Teknik Elektro',
    rumpun: 'Saintek',
    baseMinTotal: 4060,
    dominantSubtests: ['pm', 'pk', 'pu'],
    baseQuota: 90,
    profiles: ['comprehensive', 'tech-institut', 'education'],
  },
  {
    id: 'teknik-mesin',
    name: 'Teknik Mesin',
    rumpun: 'Saintek',
    baseMinTotal: 3980,
    dominantSubtests: ['pm', 'pk', 'pu'],
    baseQuota: 95,
    profiles: ['comprehensive', 'tech-institut', 'education'],
  },
  {
    id: 'teknik-industri',
    name: 'Teknik Industri',
    rumpun: 'Saintek',
    baseMinTotal: 4090,
    dominantSubtests: ['pm', 'pk', 'pu'],
    baseQuota: 85,
    profiles: ['comprehensive', 'tech-institut'],
  },
  {
    id: 'teknik-kimia',
    name: 'Teknik Kimia',
    rumpun: 'Saintek',
    baseMinTotal: 4010,
    dominantSubtests: ['pm', 'pk', 'pu'],
    baseQuota: 80,
    profiles: ['comprehensive', 'tech-institut'],
  },
  {
    id: 'teknik-lingkungan',
    name: 'Teknik Lingkungan',
    rumpun: 'Saintek',
    baseMinTotal: 3910,
    dominantSubtests: ['pu', 'pm', 'lbi'],
    baseQuota: 65,
    profiles: ['comprehensive', 'tech-institut', 'agriculture'],
  },
  {
    id: 'pwk',
    name: 'Perencanaan Wilayah dan Kota (PWK)',
    rumpun: 'Campuran',
    baseMinTotal: 3950,
    dominantSubtests: ['pu', 'lbi', 'pm'],
    baseQuota: 70,
    profiles: ['comprehensive', 'tech-institut'],
  },

  // MIPA & Sains
  {
    id: 'statistika',
    name: 'Statistika',
    rumpun: 'Saintek',
    baseMinTotal: 4020,
    dominantSubtests: ['pm', 'pk', 'pu'],
    baseQuota: 70,
    profiles: ['comprehensive', 'tech-institut', 'agriculture'],
  },
  {
    id: 'matematika',
    name: 'Matematika',
    rumpun: 'Saintek',
    baseMinTotal: 3820,
    dominantSubtests: ['pm', 'pk', 'pu'],
    baseQuota: 75,
    profiles: ['comprehensive', 'tech-institut', 'agriculture', 'education', 'islamic'],
  },
  {
    id: 'fisika',
    name: 'Fisika',
    rumpun: 'Saintek',
    baseMinTotal: 3680,
    dominantSubtests: ['pm', 'pk', 'pu'],
    baseQuota: 65,
    profiles: ['comprehensive', 'tech-institut', 'agriculture', 'education', 'islamic'],
  },
  {
    id: 'kimia',
    name: 'Kimia',
    rumpun: 'Saintek',
    baseMinTotal: 3740,
    dominantSubtests: ['pk', 'pu', 'pm'],
    baseQuota: 70,
    profiles: ['comprehensive', 'tech-institut', 'agriculture', 'education', 'islamic'],
  },
  {
    id: 'biologi',
    name: 'Biologi',
    rumpun: 'Saintek',
    baseMinTotal: 3730,
    dominantSubtests: ['pu', 'lbi', 'ppu'],
    baseQuota: 75,
    profiles: ['comprehensive', 'agriculture', 'education', 'islamic'],
  },

  // Pertanian, Pangan & Kelautan
  {
    id: 'agroteknologi',
    name: 'Agroteknologi / Agronomi',
    rumpun: 'Saintek',
    baseMinTotal: 3560,
    dominantSubtests: ['pu', 'lbi', 'pk'],
    baseQuota: 110,
    profiles: ['comprehensive', 'agriculture'],
  },
  {
    id: 'agribisnis',
    name: 'Agribisnis',
    rumpun: 'Campuran',
    baseMinTotal: 3620,
    dominantSubtests: ['pu', 'lbi', 'pk'],
    baseQuota: 100,
    profiles: ['comprehensive', 'agriculture', 'islamic'],
  },
  {
    id: 'peternakan',
    name: 'Peternakan',
    rumpun: 'Saintek',
    baseMinTotal: 3500,
    dominantSubtests: ['pu', 'lbi', 'ppu'],
    baseQuota: 105,
    profiles: ['comprehensive', 'agriculture'],
  },
  {
    id: 'teknologi-pangan',
    name: 'Teknologi Pangan',
    rumpun: 'Saintek',
    baseMinTotal: 3880,
    dominantSubtests: ['pu', 'pk', 'lbi'],
    baseQuota: 75,
    profiles: ['comprehensive', 'agriculture', 'tech-institut'],
  },
  {
    id: 'ilmu-kelautan',
    name: 'Ilmu Kelautan & Perikanan',
    rumpun: 'Saintek',
    baseMinTotal: 3520,
    dominantSubtests: ['pu', 'lbi', 'ppu'],
    baseQuota: 85,
    profiles: ['comprehensive', 'agriculture'],
  },

  // Ekonomi & Bisnis
  {
    id: 'akuntansi',
    name: 'Akuntansi',
    rumpun: 'Soshum',
    baseMinTotal: 4080,
    dominantSubtests: ['pk', 'pu', 'lbe'],
    baseQuota: 135,
    profiles: ['comprehensive', 'education', 'islamic'],
  },
  {
    id: 'manajemen',
    name: 'Manajemen / Bisnis',
    rumpun: 'Soshum',
    baseMinTotal: 4060,
    dominantSubtests: ['pu', 'pk', 'lbe'],
    baseQuota: 145,
    profiles: ['comprehensive', 'tech-institut', 'agriculture', 'education', 'islamic'],
  },
  {
    id: 'ekonomi-pembangunan',
    name: 'Ekonomi Pembangunan / Ilmu Ekonomi',
    rumpun: 'Soshum',
    baseMinTotal: 3890,
    dominantSubtests: ['pk', 'pu', 'lbi'],
    baseQuota: 110,
    profiles: ['comprehensive', 'agriculture', 'education', 'islamic'],
  },

  // Hukum, Sosial & Humaniora
  {
    id: 'ilmu-hukum',
    name: 'Ilmu Hukum',
    rumpun: 'Soshum',
    baseMinTotal: 4040,
    dominantSubtests: ['lbi', 'ppu', 'pbm'],
    baseQuota: 190,
    profiles: ['comprehensive', 'islamic'],
  },
  {
    id: 'psikologi',
    name: 'Psikologi',
    rumpun: 'Campuran',
    baseMinTotal: 4120,
    dominantSubtests: ['pu', 'lbi', 'pbm'],
    baseQuota: 100,
    profiles: ['comprehensive', 'education', 'islamic'],
  },
  {
    id: 'ilmu-komunikasi',
    name: 'Ilmu Komunikasi',
    rumpun: 'Soshum',
    baseMinTotal: 4040,
    dominantSubtests: ['lbi', 'lbe', 'pbm'],
    baseQuota: 95,
    profiles: ['comprehensive', 'education', 'islamic'],
  },
  {
    id: 'hi',
    name: 'Ilmu Hubungan Internasional',
    rumpun: 'Soshum',
    baseMinTotal: 4150,
    dominantSubtests: ['lbe', 'lbi', 'ppu'],
    baseQuota: 65,
    profiles: ['comprehensive', 'islamic'],
  },
  {
    id: 'administrasi-publik',
    name: 'Administrasi Publik / Ilmu Pemerintahan',
    rumpun: 'Soshum',
    baseMinTotal: 3830,
    dominantSubtests: ['lbi', 'ppu', 'pu'],
    baseQuota: 110,
    profiles: ['comprehensive', 'islamic'],
  },
  {
    id: 'sosiologi',
    name: 'Sosiologi',
    rumpun: 'Soshum',
    baseMinTotal: 3720,
    dominantSubtests: ['lbi', 'ppu', 'pbm'],
    baseQuota: 90,
    profiles: ['comprehensive', 'education', 'islamic'],
  },
  {
    id: 'sastra-inggris',
    name: 'Sastra / Bahasa Inggris',
    rumpun: 'Soshum',
    baseMinTotal: 3840,
    dominantSubtests: ['lbe', 'pbm', 'ppu'],
    baseQuota: 80,
    profiles: ['comprehensive', 'education', 'islamic'],
  },
  {
    id: 'sastra-indonesia',
    name: 'Sastra / Bahasa Indonesia',
    rumpun: 'Soshum',
    baseMinTotal: 3680,
    dominantSubtests: ['lbi', 'pbm', 'ppu'],
    baseQuota: 80,
    profiles: ['comprehensive', 'education', 'islamic'],
  },

  // Pendidikan & Seni/DKV
  {
    id: 'pgsd',
    name: 'Pendidikan Guru Sekolah Dasar (PGSD)',
    rumpun: 'Campuran',
    baseMinTotal: 3740,
    dominantSubtests: ['lbi', 'pbm', 'pu'],
    baseQuota: 130,
    profiles: ['comprehensive', 'education', 'islamic'],
  },
  {
    id: 'pend-matematika',
    name: 'Pendidikan Matematika',
    rumpun: 'Saintek',
    baseMinTotal: 3760,
    dominantSubtests: ['pm', 'pk', 'pu'],
    baseQuota: 75,
    profiles: ['comprehensive', 'education', 'islamic'],
  },
  {
    id: 'pend-bahasa-inggris',
    name: 'Pendidikan Bahasa Inggris',
    rumpun: 'Soshum',
    baseMinTotal: 3790,
    dominantSubtests: ['lbe', 'pbm', 'lbi'],
    baseQuota: 80,
    profiles: ['comprehensive', 'education', 'islamic'],
  },
  {
    id: 'bk',
    name: 'Bimbingan dan Konseling',
    rumpun: 'Soshum',
    baseMinTotal: 3680,
    dominantSubtests: ['lbi', 'ppu', 'pbm'],
    baseQuota: 70,
    profiles: ['comprehensive', 'education', 'islamic'],
  },
  {
    id: 'dkv',
    name: 'Desain Komunikasi Visual (DKV) & Seni',
    rumpun: 'Campuran',
    baseMinTotal: 3860,
    dominantSubtests: ['ppu', 'lbi', 'pu'],
    baseQuota: 70,
    profiles: ['comprehensive', 'tech-institut', 'education', 'arts'],
  },
  {
    id: 'seni-musik-tari',
    name: 'Seni Murni / Film / Pertunjukan',
    rumpun: 'Soshum',
    baseMinTotal: 3560,
    dominantSubtests: ['ppu', 'lbi', 'pbm'],
    baseQuota: 65,
    profiles: ['education', 'arts'],
  },
];

export const INDONESIA_UNIVERSITIES: IndonesianUniversityMeta[] = [
  // ======================== DKI JAKARTA, BANTEN & JAWA BARAT ========================
  { id: 'ui', shortName: 'UI', name: 'Universitas Indonesia', city: 'Depok', province: 'Jawa Barat / DKI', region: 'Jawa Barat, DKI & Banten', tierScore: 10, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'itb', shortName: 'ITB', name: 'Institut Teknologi Bandung', city: 'Bandung', province: 'Jawa Barat', region: 'Jawa Barat, DKI & Banten', tierScore: 10, akreditasi: 'Unggul', profile: 'tech-institut' },
  { id: 'ipb', shortName: 'IPB', name: 'IPB University', city: 'Bogor', province: 'Jawa Barat', region: 'Jawa Barat, DKI & Banten', tierScore: 8.5, akreditasi: 'Unggul', profile: 'agriculture', hasMedical: true },
  { id: 'unpad', shortName: 'UNPAD', name: 'Universitas Padjadjaran', city: 'Sumedang', province: 'Jawa Barat', region: 'Jawa Barat, DKI & Banten', tierScore: 8.5, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'upi', shortName: 'UPI', name: 'Universitas Pendidikan Indonesia', city: 'Bandung', province: 'Jawa Barat', region: 'Jawa Barat, DKI & Banten', tierScore: 6.5, akreditasi: 'Unggul', profile: 'education', hasMedical: true },
  { id: 'unj', shortName: 'UNJ', name: 'Universitas Negeri Jakarta', city: 'Jakarta Timur', province: 'DKI Jakarta', region: 'Jawa Barat, DKI & Banten', tierScore: 6.5, akreditasi: 'Unggul', profile: 'education' },
  { id: 'upnvj', shortName: 'UPNVJ', name: 'UPN Veteran Jakarta', city: 'Jakarta Selatan', province: 'DKI Jakarta', region: 'Jawa Barat, DKI & Banten', tierScore: 7.0, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'uinjkt', shortName: 'UIN Jakarta', name: 'UIN Syarif Hidayatullah Jakarta', city: 'Tangerang Selatan', province: 'Banten', region: 'Jawa Barat, DKI & Banten', tierScore: 6.5, akreditasi: 'Unggul', profile: 'islamic', hasMedical: true },
  { id: 'untirta', shortName: 'UNTIRTA', name: 'Universitas Sultan Ageng Tirtayasa', city: 'Serang', province: 'Banten', region: 'Jawa Barat, DKI & Banten', tierScore: 5.5, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'unsika', shortName: 'UNSIKA', name: 'Universitas Singaperbangsa Karawang', city: 'Karawang', province: 'Jawa Barat', region: 'Jawa Barat, DKI & Banten', tierScore: 4.5, akreditasi: 'A', profile: 'comprehensive' },
  { id: 'unsil', shortName: 'UNSIL', name: 'Universitas Siliwangi', city: 'Tasikmalaya', province: 'Jawa Barat', region: 'Jawa Barat, DKI & Banten', tierScore: 4.5, akreditasi: 'A', profile: 'comprehensive' },
  { id: 'uinsgd', shortName: 'UIN Bandung', name: 'UIN Sunan Gunung Djati Bandung', city: 'Bandung', province: 'Jawa Barat', region: 'Jawa Barat, DKI & Banten', tierScore: 5.0, akreditasi: 'Unggul', profile: 'islamic' },
  { id: 'isbi-bdg', shortName: 'ISBI Bandung', name: 'Institut Seni Budaya Indonesia Bandung', city: 'Bandung', province: 'Jawa Barat', region: 'Jawa Barat, DKI & Banten', tierScore: 4.0, akreditasi: 'A', profile: 'arts' },

  // ======================== JAWA TENGAH & DI YOGYAKARTA ========================
  { id: 'ugm', shortName: 'UGM', name: 'Universitas Gadjah Mada', city: 'Yogyakarta', province: 'DI Yogyakarta', region: 'Jawa Tengah & DIY', tierScore: 9.8, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'undip', shortName: 'UNDIP', name: 'Universitas Diponegoro', city: 'Semarang', province: 'Jawa Tengah', region: 'Jawa Tengah & DIY', tierScore: 8.2, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'uns', shortName: 'UNS', name: 'Universitas Sebelas Maret', city: 'Surakarta', province: 'Jawa Tengah', region: 'Jawa Tengah & DIY', tierScore: 7.5, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'uny', shortName: 'UNY', name: 'Universitas Negeri Yogyakarta', city: 'Yogyakarta', province: 'DI Yogyakarta', region: 'Jawa Tengah & DIY', tierScore: 6.5, akreditasi: 'Unggul', profile: 'education' },
  { id: 'unnes', shortName: 'UNNES', name: 'Universitas Negeri Semarang', city: 'Semarang', province: 'Jawa Tengah', region: 'Jawa Tengah & DIY', tierScore: 6.2, akreditasi: 'Unggul', profile: 'education' },
  { id: 'unsoed', shortName: 'UNSOED', name: 'Universitas Jenderal Soedirman', city: 'Purwokerto', province: 'Jawa Tengah', region: 'Jawa Tengah & DIY', tierScore: 6.2, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'upnyk', shortName: 'UPN Jogja', name: 'UPN Veteran Yogyakarta', city: 'Yogyakarta', province: 'DI Yogyakarta', region: 'Jawa Tengah & DIY', tierScore: 6.3, akreditasi: 'Unggul', profile: 'comprehensive' },
  { id: 'uinsuka', shortName: 'UIN Jogja', name: 'UIN Sunan Kalijaga Yogyakarta', city: 'Yogyakarta', province: 'DI Yogyakarta', region: 'Jawa Tengah & DIY', tierScore: 5.5, akreditasi: 'Unggul', profile: 'islamic' },
  { id: 'untidar', shortName: 'UNTIDAR', name: 'Universitas Tidar', city: 'Magelang', province: 'Jawa Tengah', region: 'Jawa Tengah & DIY', tierScore: 4.3, akreditasi: 'A', profile: 'comprehensive' },
  { id: 'uinws', shortName: 'UIN Walisongo', name: 'UIN Walisongo Semarang', city: 'Semarang', province: 'Jawa Tengah', region: 'Jawa Tengah & DIY', tierScore: 4.6, akreditasi: 'Unggul', profile: 'islamic' },
  { id: 'isi-yk', shortName: 'ISI Jogja', name: 'Institut Seni Indonesia Yogyakarta', city: 'Yogyakarta', province: 'DI Yogyakarta', region: 'Jawa Tengah & DIY', tierScore: 5.0, akreditasi: 'Unggul', profile: 'arts' },
  { id: 'isi-ska', shortName: 'ISI Solo', name: 'Institut Seni Indonesia Surakarta', city: 'Surakarta', province: 'Jawa Tengah', region: 'Jawa Tengah & DIY', tierScore: 4.2, akreditasi: 'A', profile: 'arts' },

  // ======================== JAWA TIMUR ========================
  { id: 'its', shortName: 'ITS', name: 'Institut Teknologi Sepuluh Nopember', city: 'Surabaya', province: 'Jawa Timur', region: 'Jawa Timur', tierScore: 9.0, akreditasi: 'Unggul', profile: 'tech-institut' },
  { id: 'unair', shortName: 'UNAIR', name: 'Universitas Airlangga', city: 'Surabaya', province: 'Jawa Timur', region: 'Jawa Timur', tierScore: 8.8, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'ub', shortName: 'UB', name: 'Universitas Brawijaya', city: 'Malang', province: 'Jawa Timur', region: 'Jawa Timur', tierScore: 8.0, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'um', shortName: 'UM', name: 'Universitas Negeri Malang', city: 'Malang', province: 'Jawa Timur', region: 'Jawa Timur', tierScore: 6.3, akreditasi: 'Unggul', profile: 'education', hasMedical: true },
  { id: 'unesa', shortName: 'UNESA', name: 'Universitas Negeri Surabaya', city: 'Surabaya', province: 'Jawa Timur', region: 'Jawa Timur', tierScore: 5.8, akreditasi: 'Unggul', profile: 'education', hasMedical: true },
  { id: 'upnvjt', shortName: 'UPN Jatim', name: 'UPN Veteran Jawa Timur', city: 'Surabaya', province: 'Jawa Timur', region: 'Jawa Timur', tierScore: 6.0, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'unej', shortName: 'UNEJ', name: 'Universitas Jember', city: 'Jember', province: 'Jawa Timur', region: 'Jawa Timur', tierScore: 5.8, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'utm', shortName: 'UTM', name: 'Universitas Trunojoyo Madura', city: 'Bangkalan', province: 'Jawa Timur', region: 'Jawa Timur', tierScore: 4.2, akreditasi: 'A', profile: 'comprehensive' },
  { id: 'uinma', shortName: 'UIN Malang', name: 'UIN Maulana Malik Ibrahim Malang', city: 'Malang', province: 'Jawa Timur', region: 'Jawa Timur', tierScore: 5.4, akreditasi: 'Unggul', profile: 'islamic', hasMedical: true },
  { id: 'uinsa', shortName: 'UINSA', name: 'UIN Sunan Ampel Surabaya', city: 'Surabaya', province: 'Jawa Timur', region: 'Jawa Timur', tierScore: 4.8, akreditasi: 'Unggul', profile: 'islamic' },

  // ======================== SUMATRA ========================
  { id: 'usk', shortName: 'USK', name: 'Universitas Syiah Kuala', city: 'Banda Aceh', province: 'Aceh', region: 'Sumatra', tierScore: 5.6, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'unimal', shortName: 'UNIMAL', name: 'Universitas Malikussaleh', city: 'Lhokseumawe', province: 'Aceh', region: 'Sumatra', tierScore: 3.6, akreditasi: 'A', profile: 'comprehensive', hasMedical: true },
  { id: 'usu', shortName: 'USU', name: 'Universitas Sumatera Utara', city: 'Medan', province: 'Sumatera Utara', region: 'Sumatra', tierScore: 7.0, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'unimed', shortName: 'UNIMED', name: 'Universitas Negeri Medan', city: 'Medan', province: 'Sumatera Utara', region: 'Sumatra', tierScore: 5.2, akreditasi: 'Unggul', profile: 'education' },
  { id: 'unand', shortName: 'UNAND', name: 'Universitas Andalas', city: 'Padang', province: 'Sumatera Barat', region: 'Sumatra', tierScore: 6.8, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'unp', shortName: 'UNP', name: 'Universitas Negeri Padang', city: 'Padang', province: 'Sumatera Barat', region: 'Sumatra', tierScore: 5.4, akreditasi: 'Unggul', profile: 'education', hasMedical: true },
  { id: 'unri', shortName: 'UNRI', name: 'Universitas Riau', city: 'Pekanbaru', province: 'Riau', region: 'Sumatra', tierScore: 5.5, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'uin-suska', shortName: 'UIN Suska', name: 'UIN Sultan Syarif Kasim Riau', city: 'Pekanbaru', province: 'Riau', region: 'Sumatra', tierScore: 4.2, akreditasi: 'A', profile: 'islamic' },
  { id: 'umrah', shortName: 'UMRAH', name: 'Universitas Maritim Raja Ali Haji', city: 'Tanjungpinang', province: 'Kepulauan Riau', region: 'Sumatra', tierScore: 3.5, akreditasi: 'A', profile: 'comprehensive' },
  { id: 'unja', shortName: 'UNJA', name: 'Universitas Jambi', city: 'Jambi', province: 'Jambi', region: 'Sumatra', tierScore: 4.8, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'uin-sts', shortName: 'UIN Jambi', name: 'UIN Sulthan Thaha Saifuddin Jambi', city: 'Jambi', province: 'Jambi', region: 'Sumatra', tierScore: 3.8, akreditasi: 'A', profile: 'islamic' },
  { id: 'unsri', shortName: 'UNSRI', name: 'Universitas Sriwijaya', city: 'Palembang', province: 'Sumatera Selatan', region: 'Sumatra', tierScore: 6.5, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'ubb', shortName: 'UBB', name: 'Universitas Bangka Belitung', city: 'Pangkalpinang', province: 'Bangka Belitung', region: 'Sumatra', tierScore: 3.5, akreditasi: 'A', profile: 'comprehensive' },
  { id: 'unib', shortName: 'UNIB', name: 'Universitas Bengkulu', city: 'Bengkulu', province: 'Bengkulu', region: 'Sumatra', tierScore: 4.5, akreditasi: 'A', profile: 'comprehensive', hasMedical: true },
  { id: 'unila', shortName: 'UNILA', name: 'Universitas Lampung', city: 'Bandar Lampung', province: 'Lampung', region: 'Sumatra', tierScore: 5.6, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'itera', shortName: 'ITERA', name: 'Institut Teknologi Sumatera', city: 'Lampung Selatan', province: 'Lampung', region: 'Sumatra', tierScore: 5.0, akreditasi: 'A', profile: 'tech-institut' },

  // ======================== BALI & NUSA TENGGARA ========================
  { id: 'unud', shortName: 'UNUD', name: 'Universitas Udayana', city: 'Denpasar', province: 'Bali', region: 'Bali & Nusa Tenggara', tierScore: 6.8, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'undiksha', shortName: 'UNDIKSHA', name: 'Universitas Pendidikan Ganesha', city: 'Singaraja', province: 'Bali', region: 'Bali & Nusa Tenggara', tierScore: 4.6, akreditasi: 'Unggul', profile: 'education', hasMedical: true },
  { id: 'isi-dps', shortName: 'ISI Denpasar', name: 'Institut Seni Indonesia Denpasar', city: 'Denpasar', province: 'Bali', region: 'Bali & Nusa Tenggara', tierScore: 4.1, akreditasi: 'Unggul', profile: 'arts' },
  { id: 'unram', shortName: 'UNRAM', name: 'Universitas Mataram', city: 'Mataram', province: 'Nusa Tenggara Barat', region: 'Bali & Nusa Tenggara', tierScore: 5.0, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'undana', shortName: 'UNDANA', name: 'Universitas Nusa Cendana', city: 'Kupang', province: 'Nusa Tenggara Timur', region: 'Bali & Nusa Tenggara', tierScore: 4.2, akreditasi: 'A', profile: 'comprehensive', hasMedical: true },
  { id: 'unimor', shortName: 'UNIMOR', name: 'Universitas Timor', city: 'Kefamenanu', province: 'Nusa Tenggara Timur', region: 'Bali & Nusa Tenggara', tierScore: 3.0, akreditasi: 'A', profile: 'comprehensive' },

  // ======================== KALIMANTAN ========================
  { id: 'untan', shortName: 'UNTAN', name: 'Universitas Tanjungpura', city: 'Pontianak', province: 'Kalimantan Barat', region: 'Kalimantan', tierScore: 5.0, akreditasi: 'A', profile: 'comprehensive', hasMedical: true },
  { id: 'upr', shortName: 'UPR', name: 'Universitas Palangka Raya', city: 'Palangka Raya', province: 'Kalimantan Tengah', region: 'Kalimantan', tierScore: 4.0, akreditasi: 'A', profile: 'comprehensive', hasMedical: true },
  { id: 'ulm', shortName: 'ULM', name: 'Universitas Lambung Mangkurat', city: 'Banjarmasin', province: 'Kalimantan Selatan', region: 'Kalimantan', tierScore: 5.2, akreditasi: 'A', profile: 'comprehensive', hasMedical: true },
  { id: 'unmul', shortName: 'UNMUL', name: 'Universitas Mulawarman', city: 'Samarinda', province: 'Kalimantan Timur', region: 'Kalimantan', tierScore: 5.4, akreditasi: 'A', profile: 'comprehensive', hasMedical: true },
  { id: 'itk', shortName: 'ITK', name: 'Institut Teknologi Kalimantan', city: 'Balikpapan', province: 'Kalimantan Timur', region: 'Kalimantan', tierScore: 5.1, akreditasi: 'A', profile: 'tech-institut' },
  { id: 'ubt', shortName: 'UBT', name: 'Universitas Borneo Tarakan', city: 'Tarakan', province: 'Kalimantan Utara', region: 'Kalimantan', tierScore: 3.4, akreditasi: 'A', profile: 'comprehensive' },

  // ======================== SULAWESI ========================
  { id: 'unhas', shortName: 'UNHAS', name: 'Universitas Hasanuddin', city: 'Makassar', province: 'Sulawesi Selatan', region: 'Sulawesi', tierScore: 7.2, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'unm', shortName: 'UNM', name: 'Universitas Negeri Makassar', city: 'Makassar', province: 'Sulawesi Selatan', region: 'Sulawesi', tierScore: 5.2, akreditasi: 'Unggul', profile: 'education' },
  { id: 'uin-makassar', shortName: 'UIN Alauddin', name: 'UIN Alauddin Makassar', city: 'Gowa', province: 'Sulawesi Selatan', region: 'Sulawesi', tierScore: 4.5, akreditasi: 'Unggul', profile: 'islamic', hasMedical: true },
  { id: 'unsrat', shortName: 'UNSRAT', name: 'Universitas Sam Ratulangi', city: 'Manado', province: 'Sulawesi Utara', region: 'Sulawesi', tierScore: 5.3, akreditasi: 'Unggul', profile: 'comprehensive', hasMedical: true },
  { id: 'unima', shortName: 'UNIMA', name: 'Universitas Negeri Manado', city: 'Tondano', province: 'Sulawesi Utara', region: 'Sulawesi', tierScore: 3.8, akreditasi: 'A', profile: 'education' },
  { id: 'untad', shortName: 'UNTAD', name: 'Universitas Tadulako', city: 'Palu', province: 'Sulawesi Tengah', region: 'Sulawesi', tierScore: 4.3, akreditasi: 'A', profile: 'comprehensive', hasMedical: true },
  { id: 'uho', shortName: 'UHO', name: 'Universitas Halu Oleo', city: 'Kendari', province: 'Sulawesi Tenggara', region: 'Sulawesi', tierScore: 4.5, akreditasi: 'A', profile: 'comprehensive', hasMedical: true },
  { id: 'ung', shortName: 'UNG', name: 'Universitas Negeri Gorontalo', city: 'Gorontalo', province: 'Gorontalo', region: 'Sulawesi', tierScore: 4.2, akreditasi: 'Unggul', profile: 'education', hasMedical: true },
  { id: 'unsulbar', shortName: 'UNSULBAR', name: 'Universitas Sulawesi Barat', city: 'Majene', province: 'Sulawesi Barat', region: 'Sulawesi', tierScore: 3.2, akreditasi: 'A', profile: 'comprehensive' },

  // ======================== MALUKU & PAPUA ========================
  { id: 'unpatti', shortName: 'UNPATTI', name: 'Universitas Pattimura', city: 'Ambon', province: 'Maluku', region: 'Maluku & Papua', tierScore: 4.1, akreditasi: 'A', profile: 'comprehensive', hasMedical: true },
  { id: 'unkhair', shortName: 'UNKHAIR', name: 'Universitas Khairun', city: 'Ternate', province: 'Maluku Utara', region: 'Maluku & Papua', tierScore: 3.5, akreditasi: 'A', profile: 'comprehensive', hasMedical: true },
  { id: 'uncen', shortName: 'UNCEN', name: 'Universitas Cenderawasih', city: 'Jayapura', province: 'Papua', region: 'Maluku & Papua', tierScore: 3.9, akreditasi: 'A', profile: 'comprehensive', hasMedical: true },
  { id: 'unipa', shortName: 'UNIPA', name: 'Universitas Papua', city: 'Manokwari', province: 'Papua Barat', region: 'Maluku & Papua', tierScore: 3.3, akreditasi: 'A', profile: 'agriculture', hasMedical: true },
  { id: 'unmus', shortName: 'UNMUS', name: 'Universitas Musamus', city: 'Merauke', province: 'Papua Selatan', region: 'Maluku & Papua', tierScore: 3.1, akreditasi: 'A', profile: 'comprehensive' },
];

export interface ExtendedCampusProgram extends CampusProgram {
  universityId: string;
  province: string;
  region: IndonesiaRegion;
}

export function buildAllIndonesianCampusPrograms(): ExtendedCampusProgram[] {
  const results: ExtendedCampusProgram[] = [];

  for (const univ of INDONESIA_UNIVERSITIES) {
    // Tier 10 => +900 total score (~+128/subtest), Tier 3 => -35 total score
    const tierOffset = Math.round((univ.tierScore - 4) * 145);

    for (const major of MAJOR_TEMPLATES) {
      if (major.requiresMedical && !univ.hasMedical) continue;
      if (!major.profiles.includes(univ.profile)) continue;

      const rawMin = major.baseMinTotal + tierOffset;
      const minTotalScore = Math.max(3290, Math.min(5530, Math.round(rawMin / 5) * 5));

      const selectivity =
        minTotalScore >= 5050
          ? 'Sangat Ketat (±1,5%–2,5%)'
          : minTotalScore >= 4550
            ? 'Ketat (±3%–5%)'
            : minTotalScore >= 4050
              ? 'Kompetitif (±5,5%–9%)'
              : 'Peluang Terbuka (±10%–18%)';

      const quotaAdjust = Math.max(
        25,
        Math.round(major.baseQuota * (univ.tierScore >= 8 ? 0.9 : univ.tierScore <= 4 ? 1.15 : 1))
      );

      results.push({
        id: `${univ.id}-${major.id}`,
        universityId: univ.id,
        university: univ.name,
        shortUniv: univ.shortName,
        major: major.name,
        rumpun: major.rumpun,
        city: univ.city,
        province: univ.province,
        region: univ.region,
        minTotalScore,
        dominantSubtests: major.dominantSubtests,
        akreditasi: univ.akreditasi,
        dayaTampung: quotaAdjust,
        keketatanLabel: selectivity,
      });
    }
  }

  return results;
}

export const ALL_INDONESIA_CAMPUS_PROGRAMS: ExtendedCampusProgram[] =
  buildAllIndonesianCampusPrograms();

export const INDONESIA_REGIONS: (IndonesiaRegion | 'Semua Wilayah')[] = [
  'Semua Wilayah',
  'Sumatra',
  'Jawa Barat, DKI & Banten',
  'Jawa Tengah & DIY',
  'Jawa Timur',
  'Bali & Nusa Tenggara',
  'Kalimantan',
  'Sulawesi',
  'Maluku & Papua',
];
