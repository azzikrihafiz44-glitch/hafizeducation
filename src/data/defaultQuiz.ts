import type { QuizRoom } from '../types/quiz';

export const DEFAULT_ROOM: QuizRoom = {
  code: 'HF882A',
  title: 'Belum Ada Paket Soal Aktif',
  createdAt: '2026-11-19T08:00:00.000Z',
  questions: [],
};

export const TUTORIAL_STEPS = [
  {
    emoji: '👗',
    title: '1. Dandani Avatar Kamu',
    desc: 'Buka Lemari Avatar untuk memilih lebih dari 145+ kombinasi avatar cewek, cowok, chibi, gaya rambut/hijab, baju, rok/celana, dan aksesoris favoritmu.',
  },
  {
    emoji: '🔑',
    title: '2. Masukkan Nama & Kode Room',
    desc: 'Ketik nama lengkapmu (yang akan tercetak di Sertifikat Digital) lalu masukkan Kode Room dari guru/admin atau klik Room Aktif yang tersedia.',
  },
  {
    emoji: '🏫',
    title: '3. Jelajahi Lobi Kuis',
    desc: 'Berjalanlah di Plaza Utama Akademi Hafiz menggunakan tombol WASD / Panah, tekan Spasi untuk melompat, joget, menyapa, dan kirim pesan obrolan ke teman!',
  },
  {
    emoji: '⚡',
    title: '4. Kerjakan Kuis A–E Tanpa Panik',
    desc: 'Setiap soal pilihan ganda A–E bebas batas waktu panik. Manfaatkan bantuan 50:50 satu kali, jaga streak jawaban benar, dan pelajari Pembahasan Soal secara langsung.',
  },
  {
    emoji: '🏆',
    title: '5. Raih Podium & Sertifikat HD',
    desc: 'Setelah selesai, lihat peringkatmu di Podium Juara dan unduh Sertifikat Digital HD resmi dari Hafiz Education dalam format PNG atau cetak PDF!',
  },
];
