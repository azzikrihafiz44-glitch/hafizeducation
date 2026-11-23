import type {
  AccessoryStyleType,
  AvatarConfig,
  BottomStyleType,
  HairStyleType,
  ShoeStyleType,
  WardrobeItem,
} from '../types/quiz';

export const SKIN_SWATCHES: { id: string; name: string; hex: string }[] = [
  { id: 'mars-green', name: 'Hijau Mars Neon', hex: '#4ade80' },
  { id: 'nebula-blue', name: 'Biru Nebula', hex: '#38bdf8' },
  { id: 'galaxy-purple', name: 'Ungu Galaksi', hex: '#a855f7' },
  { id: 'crystal-cyan', name: 'Cyan Kristal', hex: '#22d3ee' },
  { id: 'cosmic-pink', name: 'Pink Kosmik', hex: '#f472b6' },
  { id: 'silver-alien', name: 'Perak Alien', hex: '#cbd5e1' },
  { id: 'solar-gold', name: 'Emas Bintang', hex: '#facc15' },
  { id: 'void-indigo', name: 'Indigo Angkasa', hex: '#6366f1' },
];

interface ColorTheme {
  slug: string;
  label: string;
  hex: string;
  accent: string;
}

const FASHION_COLORS_12: ColorTheme[] = [
  { slug: 'sakura', label: 'Sakura', hex: '#f472b6', accent: '#fce7f3' },
  { slug: 'ruby', label: 'Merah Rubi', hex: '#e11d48', accent: '#ffe4e6' },
  { slug: 'coral', label: 'Koral Senja', hex: '#fb7185', accent: '#fff1f2' },
  { slug: 'amber', label: 'Emas Madu', hex: '#f59e0b', accent: '#fef3c7' },
  { slug: 'lemon', label: 'Kuning Lemon', hex: '#eab308', accent: '#fef9c3' },
  { slug: 'emerald', label: 'Zamrud', hex: '#10b981', accent: '#d1fae5' },
  { slug: 'teal', label: 'Tosca Laut', hex: '#0d9488', accent: '#ccfbf1' },
  { slug: 'sky', label: 'Biru Langit', hex: '#0ea5e9', accent: '#e0f2fe' },
  { slug: 'royal', label: 'Biru Royal', hex: '#2563eb', accent: '#dbeafe' },
  { slug: 'indigo', label: 'Indigo Galaksi', hex: '#4f46e5', accent: '#e0e7ff' },
  { slug: 'lilac', label: 'Ungu Lilac', hex: '#9333ea', accent: '#f3e8ff' },
  { slug: 'obsidian', label: 'Hitam Elegan', hex: '#18181b', accent: '#fbbf24' },
];

const EXTRA_COLORS_4: ColorTheme[] = [
  { slug: 'pearl', label: 'Putih Mutiara', hex: '#f8fafc', accent: '#94a3b8' },
  { slug: 'cream', label: 'Krim Latte', hex: '#d6c7b2', accent: '#78350f' },
  { slug: 'maroon', label: 'Marun Klasik', hex: '#881337', accent: '#fde68a' },
  { slug: 'navy', label: 'Biru Navy', hex: '#1e3a8a', accent: '#93c5fd' },
];

const SHOE_COLORS_16: ColorTheme[] = [...FASHION_COLORS_12, ...EXTRA_COLORS_4];

// 48 Karakter Makhluk Luar Angkasa Utama + 500 Avatar Lucu Kosmik = 548 Pilihan Avatar!
const CORE_CHARACTER_ITEMS: WardrobeItem[] = [
  { id: 'char-alien-mars', name: 'Alien Hijau Mars', category: 'character', color: '#4ade80', emoji: '👽', bodyStyle: 'boy' },
  { id: 'char-putri-andromeda', name: 'Putri Andromeda', category: 'character', color: '#c084fc', emoji: '🛸', bodyStyle: 'girl' },
  { id: 'char-makhluk-nebula', name: 'Makhluk Nebula', category: 'character', color: '#38bdf8', emoji: '🌌', bodyStyle: 'girl' },
  { id: 'char-cyborg-orion', name: 'Cyborg Orion', category: 'character', color: '#22d3ee', emoji: '🤖', bodyStyle: 'boy' },
  { id: 'char-slime-kosmik', name: 'Slime Kosmik Lucu', category: 'character', color: '#f472b6', emoji: '👾', bodyStyle: 'chibi' },
  { id: 'char-ksatria-saturnus', name: 'Ksatria Saturnus', category: 'character', color: '#f59e0b', emoji: '🪐', bodyStyle: 'tall' },
  { id: 'char-alien-mata-tiga', name: 'Alien Mata Tiga', category: 'character', color: '#a855f7', emoji: '👁️', bodyStyle: 'boy' },
  { id: 'char-peri-bulan', name: 'Peri Bulan Perak', category: 'character', color: '#e2e8f0', emoji: '🌙', bodyStyle: 'girl' },
  { id: 'char-naga-kosmos', name: 'Naga Kosmos', category: 'character', color: '#ef4444', emoji: '🐉', bodyStyle: 'tall' },
  { id: 'char-bayi-ufo', name: 'Bayi UFO Chibi', category: 'character', color: '#60a5fa', emoji: '🛸', bodyStyle: 'chibi' },
  { id: 'char-monster-bintang', name: 'Monster Bintang', category: 'character', color: '#facc15', emoji: '⭐', bodyStyle: 'chibi' },
  { id: 'char-rubah-nova', name: 'Rubah Supernova', category: 'character', color: '#fb7185', emoji: '🦊', bodyStyle: 'girl' },
  { id: 'char-hantu-pulsar', name: 'Roh Pulsar Biru', category: 'character', color: '#0ea5e9', emoji: '👻', bodyStyle: 'chibi' },
  { id: 'char-penguasa-galaksi', name: 'Penguasa Galaksi', category: 'character', color: '#7c3aed', emoji: '👑', bodyStyle: 'tall' },
  { id: 'char-cumi-angkasa', name: 'Gurita Galaksi', category: 'character', color: '#14b8a6', emoji: '🐙', bodyStyle: 'boy' },
  { id: 'char-kucing-astro', name: 'Kucing Luar Angkasa', category: 'character', color: '#fcd34d', emoji: '🐱', bodyStyle: 'chibi' },
  { id: 'char-makhluk-kristal', name: 'Makhluk Kristal Es', category: 'character', color: '#67e8f9', emoji: '💎', bodyStyle: 'girl' },
  { id: 'char-dewa-komet', name: 'Penjaga Komet', category: 'character', color: '#3b82f6', emoji: '☄️', bodyStyle: 'tall' },
  { id: 'char-makhluk-plasma', name: 'Makhluk Plasma Ungu', category: 'character', color: '#d946ef', emoji: '⚡', bodyStyle: 'boy' },
  { id: 'char-peri-meteor', name: 'Peri Hujan Meteor', category: 'character', color: '#ec4899', emoji: '🌠', bodyStyle: 'girl' },
  { id: 'char-robot-bima-sakti', name: 'Robot Bima Sakti', category: 'character', color: '#64748b', emoji: '🦾', bodyStyle: 'tall' },
  { id: 'char-chibi-alien-pink', name: 'Chibi Alien Pink', category: 'character', color: '#f9a8d4', emoji: '👾', bodyStyle: 'chibi' },
  { id: 'char-penjelajah-void', name: 'Penjelajah Lubang Hitam', category: 'character', color: '#4f46e5', emoji: '🕳️', bodyStyle: 'tall' },
  { id: 'char-kelinci-bulan', name: 'Kelinci Planet Bulan', category: 'character', color: '#fda4af', emoji: '🐰', bodyStyle: 'chibi' },
  { id: 'char-raja-alien', name: 'Raja Alien Galaksi', category: 'character', color: '#10b981', emoji: '👽', bodyStyle: 'tall' },
  { id: 'char-ubur-nebula', name: 'Ubur-Ubur Nebula', category: 'character', color: '#818cf8', emoji: '🪼', bodyStyle: 'girl' },
  { id: 'char-serigala-orbit', name: 'Serigala Orbit', category: 'character', color: '#94a3b8', emoji: '🐺', bodyStyle: 'tall' },
  { id: 'char-panda-jupiter', name: 'Panda Planet Jupiter', category: 'character', color: '#f8fafc', emoji: '🐼', bodyStyle: 'chibi' },
  { id: 'char-burung-phoenix-star', name: 'Phoenix Bintang', category: 'character', color: '#f97316', emoji: '🦅', bodyStyle: 'tall' },
  { id: 'char-kupu-aurora', name: 'Kupu-Kupu Aurora', category: 'character', color: '#2dd4bf', emoji: '🦋', bodyStyle: 'girl' },
  { id: 'char-dino-meteor', name: 'Dino Penunggang Meteor', category: 'character', color: '#22c55e', emoji: '🦖', bodyStyle: 'boy' },
  { id: 'char-unicorn-galaksi', name: 'Unicorn Galaksi', category: 'character', color: '#e879f9', emoji: '🦄', bodyStyle: 'girl' },
  { id: 'char-hiu-kosmik', name: 'Hiu Antariksa', category: 'character', color: '#0284c7', emoji: '🦈', bodyStyle: 'boy' },
  { id: 'char-paus-bintang', name: 'Paus Bima Sakti', category: 'character', color: '#38bdf8', emoji: '🐋', bodyStyle: 'tall' },
  { id: 'char-lebah-solar', name: 'Lebah Energi Surya', category: 'character', color: '#eab308', emoji: '🐝', bodyStyle: 'chibi' },
  { id: 'char-kodok-venus', name: 'Katak Planet Venus', category: 'character', color: '#84cc16', emoji: '🐸', bodyStyle: 'chibi' },
  { id: 'char-burung-hantu-lunar', name: 'Burung Hantu Lunar', category: 'character', color: '#a78bfa', emoji: '🦉', bodyStyle: 'boy' },
  { id: 'char-beruang-polar-star', name: 'Beruang Bintang Utara', category: 'character', color: '#bae6fd', emoji: '🐻‍❄️', bodyStyle: 'tall' },
  { id: 'char-singa-matahari', name: 'Singa Korona Surya', category: 'character', color: '#fbbf24', emoji: '🦁', bodyStyle: 'tall' },
  { id: 'char-harimau-plasma', name: 'Harimau Plasma', category: 'character', color: '#fb923c', emoji: '🐯', bodyStyle: 'boy' },
  { id: 'char-penguin-pluto', name: 'Penguin Es Pluto', category: 'character', color: '#7dd3fc', emoji: '🐧', bodyStyle: 'chibi' },
  { id: 'char-koala-komet', name: 'Koala Pengelana Komet', category: 'character', color: '#cbd5e1', emoji: '🐨', bodyStyle: 'chibi' },
  { id: 'char-monyet-roket', name: 'Monyet Pilot Roket', category: 'character', color: '#d97706', emoji: '🐵', bodyStyle: 'boy' },
  { id: 'char-kepiting-mars', name: 'Kepiting Kawah Mars', category: 'character', color: '#f43f5e', emoji: '🦀', bodyStyle: 'chibi' },
  { id: 'char-kalajengking-scorpio', name: 'Ksatria Scorpio', category: 'character', color: '#be123c', emoji: '🦂', bodyStyle: 'tall' },
  { id: 'char-penyihir-galaksi', name: 'Penyihir Dimensi', category: 'character', color: '#9333ea', emoji: '🧙', bodyStyle: 'tall' },
  { id: 'char-peri-nebula-emas', name: 'Peri Nebula Emas', category: 'character', color: '#fde047', emoji: '🧚', bodyStyle: 'girl' },
  { id: 'char-ninja-kuantum', name: 'Ninja Kuantum', category: 'character', color: '#1e293b', emoji: '🥷', bodyStyle: 'boy' },
];

const CUTE_AVATAR_SPECIES: { slug: string; label: string; emoji: string; bodyStyle: 'chibi' | 'girl' | 'boy' | 'tall' }[] = [
  { slug: 'alien-chibi', label: 'Alien Chibi', emoji: '👽', bodyStyle: 'chibi' },
  { slug: 'slime-gemoy', label: 'Slime Gemoy', emoji: '👾', bodyStyle: 'chibi' },
  { slug: 'ufo-mini', label: 'UFO Mini', emoji: '🛸', bodyStyle: 'chibi' },
  { slug: 'kucing-mochi', label: 'Kucing Mochi', emoji: '🐱', bodyStyle: 'chibi' },
  { slug: 'kelinci-boba', label: 'Kelinci Boba', emoji: '🐰', bodyStyle: 'chibi' },
  { slug: 'panda-tidur', label: 'Panda Gemes', emoji: '🐼', bodyStyle: 'chibi' },
  { slug: 'beruang-madu', label: 'Beruang Madu', emoji: '🐻', bodyStyle: 'chibi' },
  { slug: 'hamster-pipi', label: 'Hamster Chubby', emoji: '🐹', bodyStyle: 'chibi' },
  { slug: 'rubah-imut', label: 'Rubah Imut', emoji: '🦊', bodyStyle: 'girl' },
  { slug: 'anjing-corgi', label: 'Puppy Kosmik', emoji: '🐶', bodyStyle: 'chibi' },
  { slug: 'koala-peluk', label: 'Koala Peluk', emoji: '🐨', bodyStyle: 'chibi' },
  { slug: 'harimau-mini', label: 'Macan Mini', emoji: '🐯', bodyStyle: 'boy' },
  { slug: 'singa-lucu', label: 'Singa Ceria', emoji: '🦁', bodyStyle: 'boy' },
  { slug: 'sapi-susu', label: 'Sapi Bima Sakti', emoji: '🐮', bodyStyle: 'chibi' },
  { slug: 'kodok-kawaii', label: 'Kodok Kawaii', emoji: '🐸', bodyStyle: 'chibi' },
  { slug: 'monyet-gokil', label: 'Monyet Gokil', emoji: '🐵', bodyStyle: 'boy' },
  { slug: 'anak-ayam', label: 'Chicky Imut', emoji: '🐥', bodyStyle: 'chibi' },
  { slug: 'penguin-chubby', label: 'Penguin Chubby', emoji: '🐧', bodyStyle: 'chibi' },
  { slug: 'bebek-kuning', label: 'Bebek Karet', emoji: '🦆', bodyStyle: 'chibi' },
  { slug: 'burung-hantu', label: 'Owl Pintar', emoji: '🦉', bodyStyle: 'boy' },
  { slug: 'unicorn-pelangi', label: 'Unicorn Lucu', emoji: '🦄', bodyStyle: 'girl' },
  { slug: 'lebah-manis', label: 'Lebah Madu', emoji: '🐝', bodyStyle: 'chibi' },
  { slug: 'kupu-cantik', label: 'Kupu Pastel', emoji: '🦋', bodyStyle: 'girl' },
  { slug: 'kepik-mungil', label: 'Kepik Mungil', emoji: '🐞', bodyStyle: 'chibi' },
  { slug: 'kura-turbo', label: 'Kura-Kura Turbo', emoji: '🐢', bodyStyle: 'chibi' },
  { slug: 'dino-bayi', label: 'Bayi Dino', emoji: '🦕', bodyStyle: 'chibi' },
  { slug: 'trex-imut', label: 'T-Rex Imut', emoji: '🦖', bodyStyle: 'boy' },
  { slug: 'gurita-bulat', label: 'Gurita Bulat', emoji: '🐙', bodyStyle: 'chibi' },
  { slug: 'ubur-glow', label: 'Ubur Glow', emoji: '🪼', bodyStyle: 'girl' },
  { slug: 'paus-mini', label: 'Paus Mini', emoji: '🐳', bodyStyle: 'chibi' },
  { slug: 'lumba-ceria', label: 'Lumba Ceria', emoji: '🐬', bodyStyle: 'girl' },
  { slug: 'anjing-laut', label: 'Seal Gemoy', emoji: '🦭', bodyStyle: 'chibi' },
  { slug: 'berang-lucu', label: 'Otter Lucu', emoji: '🦦', bodyStyle: 'chibi' },
  { slug: 'landak-mini', label: 'Landak Mini', emoji: '🦔', bodyStyle: 'chibi' },
  { slug: 'tupai-kacang', label: 'Tupai Lincah', emoji: '🐿️', bodyStyle: 'chibi' },
  { slug: 'rakun-cerdik', label: 'Rakun Cerdik', emoji: '🦝', bodyStyle: 'boy' },
  { slug: 'kapibara-chill', label: 'Kapibara Santuy', emoji: '🦫', bodyStyle: 'chibi' },
  { slug: 'alpaka-fluffy', label: 'Alpaka Fluffy', emoji: '🦙', bodyStyle: 'girl' },
  { slug: 'domba-awan', label: 'Domba Awan', emoji: '🐑', bodyStyle: 'chibi' },
  { slug: 'naga-kecil', label: 'Naga Kecil', emoji: '🐲', bodyStyle: 'boy' },
  { slug: 'robot-imut', label: 'Robot Imut', emoji: '🤖', bodyStyle: 'chibi' },
  { slug: 'hantu-gemes', label: 'Hantu Gemes', emoji: '👻', bodyStyle: 'chibi' },
  { slug: 'bintang-senyum', label: 'Bintang Ceria', emoji: '🌟', bodyStyle: 'chibi' },
  { slug: 'bulan-imut', label: 'Bulan Tersenyum', emoji: '🌝', bodyStyle: 'chibi' },
  { slug: 'awan-kapas', label: 'Awan Kapas', emoji: '☁️', bodyStyle: 'chibi' },
  { slug: 'donat-manis', label: 'Donat Kosmik', emoji: '🍩', bodyStyle: 'chibi' },
  { slug: 'cupcake-lucu', label: 'Cupcake Imut', emoji: '🧁', bodyStyle: 'girl' },
  { slug: 'es-krim-ceria', label: 'Es Krim Ceria', emoji: '🍦', bodyStyle: 'chibi' },
  { slug: 'stroberi-gemes', label: 'Stroberi Gemes', emoji: '🍓', bodyStyle: 'girl' },
  { slug: 'alpukat-santuy', label: 'Alpukat Santuy', emoji: '🥑', bodyStyle: 'chibi' },
];

const CUTE_AVATAR_THEMES: { slug: string; label: string; color: string }[] = [
  { slug: 'mint', label: 'Mint Neon', color: '#4ade80' },
  { slug: 'sakura', label: 'Pink Sakura', color: '#f472b6' },
  { slug: 'lavender', label: 'Ungu Lavender', color: '#a855f7' },
  { slug: 'sky', label: 'Biru Langit', color: '#38bdf8' },
  { slug: 'lemon', label: 'Kuning Lemon', color: '#facc15' },
  { slug: 'peach', label: 'Peach Manis', color: '#fb923c' },
  { slug: 'cyan', label: 'Cyan Kristal', color: '#22d3ee' },
  { slug: 'berry', label: 'Berry Fuchsia', color: '#e879f9' },
  { slug: 'coral', label: 'Koral Ceria', color: '#fb7185' },
  { slug: 'indigo', label: 'Indigo Galaksi', color: '#818cf8' },
];

const GENERATED_CUTE_AVATARS: WardrobeItem[] = CUTE_AVATAR_SPECIES.flatMap((sp) =>
  CUTE_AVATAR_THEMES.map((th) => ({
    id: `char-cute-${sp.slug}-${th.slug}`,
    name: `${sp.label} ${th.label}`,
    category: 'character' as const,
    color: th.color,
    emoji: sp.emoji,
    bodyStyle: sp.bodyStyle,
  }))
);

export const CHARACTER_ITEMS: WardrobeItem[] = [
  ...CORE_CHARACTER_ITEMS,
  ...GENERATED_CUTE_AVATARS,
];

// 70 Gaya Rambut & Hijab
const BASE_HAIR_ITEMS: WardrobeItem[] = [
  { id: 'hair-long-black', name: 'Panjang Hitam Halus', category: 'hair', color: '#1e1b2e', emoji: '👩', hairStyle: 'long' },
  { id: 'hair-twintails-pink', name: 'Kuncir Dua Sakura', category: 'hair', color: '#f472b6', emoji: '🌸', hairStyle: 'twintails' },
  { id: 'hair-wavy-chestnut', name: 'Gelombang Cokelat', category: 'hair', color: '#6b3e26', emoji: '✨', hairStyle: 'wavy' },
  { id: 'hair-bob-espresso', name: 'Bob Pendek Rapi', category: 'hair', color: '#3b241a', emoji: '💁', hairStyle: 'bob' },
  { id: 'hair-hijab-emerald', name: 'Hijab Syari Zamrud', category: 'hair', color: '#059669', emoji: '🧕', hairStyle: 'hijab' },
  { id: 'hair-hijab-lilac', name: 'Hijab Pastel Lilac', category: 'hair', color: '#a78bfa', emoji: '💜', hairStyle: 'hijab' },
  { id: 'hair-pashmina-cream', name: 'Pashmina Krim Elegan', category: 'hair', color: '#e5d4c0', emoji: '🤍', hairStyle: 'pashmina' },
  { id: 'hair-ponytail-gold', name: 'Kuncir Kuda Emas', category: 'hair', color: '#eab308', emoji: '🌟', hairStyle: 'ponytail' },
  { id: 'hair-braids-indigo', name: 'Kepang Dua Indigo', category: 'hair', color: '#4f46e5', emoji: '🎀', hairStyle: 'braids' },
  { id: 'hair-bun-crimson', name: 'Sanggul Lucu Merah', category: 'hair', color: '#be123c', emoji: '🍡', hairStyle: 'bun' },
  { id: 'hair-spiky-navy', name: 'Spiky Biru Malam', category: 'hair', color: '#1e3a8a', emoji: '⚡', hairStyle: 'spiky' },
  { id: 'hair-sidepart-dark', name: 'Belah Samping Klasik', category: 'hair', color: '#1f2937', emoji: '👦', hairStyle: 'sidepart' },
  { id: 'hair-curly-mocha', name: 'Ikal Mocha Lembut', category: 'hair', color: '#5c3a21', emoji: '🌀', hairStyle: 'curly' },
  { id: 'hair-undercut-silver', name: 'Undercut Perak Keren', category: 'hair', color: '#94a3b8', emoji: '❄️', hairStyle: 'undercut' },
];

const HAIR_STYLE_FAMILIES: { slug: string; label: string; style: HairStyleType; emoji: string }[] = [
  { slug: 'long', label: 'Rambut Panjang', style: 'long', emoji: '👩' },
  { slug: 'twintails', label: 'Kuncir Dua', style: 'twintails', emoji: '🎀' },
  { slug: 'hijab', label: 'Hijab Anggun', style: 'hijab', emoji: '🧕' },
  { slug: 'pashmina', label: 'Pashmina Chic', style: 'pashmina', emoji: '🧣' },
  { slug: 'ponytail', label: 'Kuncir Kuda', style: 'ponytail', emoji: '🌟' },
  { slug: 'spiky', label: 'Spiky Keren', style: 'spiky', emoji: '⚡' },
  { slug: 'undercut', label: 'Undercut Modern', style: 'undercut', emoji: '✂️' },
];

const HAIR_PALETTE: { slug: string; label: string; hex: string }[] = [
  { slug: 'midnight', label: 'Hitam Pekat', hex: '#111827' },
  { slug: 'choco', label: 'Cokelat Karamel', hex: '#78350f' },
  { slug: 'gold', label: 'Pirang Emas', hex: '#eab308' },
  { slug: 'rose', label: 'Merah Mawar', hex: '#e11d48' },
  { slug: 'sakura', label: 'Pink Sakura', hex: '#f472b6' },
  { slug: 'ocean', label: 'Biru Samudra', hex: '#0284c7' },
  { slug: 'violet', label: 'Ungu Galaksi', hex: '#7c3aed' },
  { slug: 'mint', label: 'Hijau Mint', hex: '#10b981' },
];

export const HAIR_ITEMS: WardrobeItem[] = [
  ...BASE_HAIR_ITEMS,
  ...HAIR_STYLE_FAMILIES.flatMap((fam) =>
    HAIR_PALETTE.map((col) => ({
      id: `hair-ext-${fam.slug}-${col.slug}`,
      name: `${fam.label} ${col.label}`,
      category: 'hair' as const,
      color: col.hex,
      emoji: fam.emoji,
      hairStyle: fam.style,
    }))
  ),
];

// 180 Baju / Atasan
const BASE_TOP_ITEMS: WardrobeItem[] = [
  { id: 'top-seragam-sma', name: 'Seragam Akademi Putih', category: 'top', color: '#f8fafc', accent: '#3b82f6', emoji: '👔' },
  { id: 'top-sailor-pink', name: 'Blus Pelaut Sakura', category: 'top', color: '#fbcfe8', accent: '#db2777', emoji: '🎀' },
  { id: 'top-blazer-navy', name: 'Blazer Kampus Navy', category: 'top', color: '#1e3a8a', accent: '#fbbf24', emoji: '🧥' },
  { id: 'top-blazer-maroon', name: 'Blazer Prestasi Marun', category: 'top', color: '#881337', accent: '#fde68a', emoji: '🎓' },
  { id: 'top-hoodie-indigo', name: 'Hoodie Galaksi Indigo', category: 'top', color: '#4f46e5', accent: '#a5b4fc', emoji: '🧥' },
  { id: 'top-hoodie-mint', name: 'Hoodie Mint Segar', category: 'top', color: '#10b981', accent: '#d1fae5', emoji: '🍃' },
  { id: 'top-hoodie-peach', name: 'Hoodie Persik Manis', category: 'top', color: '#fb923c', accent: '#ffedd5', emoji: '🍑' },
  { id: 'top-hoodie-black', name: 'Hoodie Hitam Cyber', category: 'top', color: '#18181b', accent: '#38bdf8', emoji: '🖤' },
  { id: 'top-batik-emas', name: 'Batik Nusantara Emas', category: 'top', color: '#78350f', accent: '#f59e0b', emoji: '🇮🇩' },
  { id: 'top-batik-biru', name: 'Batik Megamendung', category: 'top', color: '#0369a1', accent: '#bae6fd', emoji: '☁️' },
  { id: 'top-batik-ungu', name: 'Batik Parang Ungu', category: 'top', color: '#6b21a8', accent: '#e9d5ff', emoji: '🏵️' },
  { id: 'top-gaun-putri', name: 'Atasan Gaun Putri', category: 'top', color: '#c084fc', accent: '#fef08a', emoji: '👗' },
  { id: 'top-gaun-rose', name: 'Atasan Mawar Merah', category: 'top', color: '#e11d48', accent: '#fecdd3', emoji: '🌹' },
  { id: 'top-gaun-es', name: 'Atasan Kristal Es', category: 'top', color: '#38bdf8', accent: '#e0f2fe', emoji: '❄️' },
  { id: 'top-koko-putih', name: 'Baju Koko Putih Bersih', category: 'top', color: '#f1f5f9', accent: '#10b981', emoji: '🕌' },
  { id: 'top-koko-sage', name: 'Baju Koko Hijau Sage', category: 'top', color: '#047857', accent: '#a7f3d0', emoji: '🌿' },
  { id: 'top-gamis-pastel', name: 'Tunik Muslimah Pastel', category: 'top', color: '#a78bfa', accent: '#f5f3ff', emoji: '🧕' },
  { id: 'top-gamis-rose', name: 'Tunik Dusty Rose', category: 'top', color: '#be185d', accent: '#fbcfe8', emoji: '🌷' },
  { id: 'top-varsity-red', name: 'Jaket Varsity Merah', category: 'top', color: '#dc2626', accent: '#ffffff', emoji: '🏈' },
  { id: 'top-varsity-blue', name: 'Jaket Varsity Biru', category: 'top', color: '#2563eb', accent: '#fef08a', emoji: '🏀' },
  { id: 'top-varsity-green', name: 'Jaket Varsity Hijau', category: 'top', color: '#16a34a', accent: '#ffffff', emoji: '⚾' },
  { id: 'top-sweater-lavender', name: 'Sweater Rajut Lavender', category: 'top', color: '#8b5cf6', accent: '#ddd6fe', emoji: '🧶' },
  { id: 'top-sweater-cream', name: 'Sweater Hangat Krim', category: 'top', color: '#d6c7b2', accent: '#78350f', emoji: '☕' },
  { id: 'top-sweater-sky', name: 'Sweater Langit Cerah', category: 'top', color: '#0ea5e9', accent: '#e0f2fe', emoji: '🌤️' },
  { id: 'top-kemeja-flanel', name: 'Kemeja Flanel Merah', category: 'top', color: '#991b1b', accent: '#1f2937', emoji: '🪵' },
  { id: 'top-kemeja-denim', name: 'Jaket Denim Klasik', category: 'top', color: '#1d4ed8', accent: '#93c5fd', emoji: '👖' },
  { id: 'top-jas-lab', name: 'Jas Laboratorium Sains', category: 'top', color: '#ffffff', accent: '#06b6d4', emoji: '🧪' },
  { id: 'top-jubah-pangeran', name: 'Tunik Kerajaan Emas', category: 'top', color: '#1e1b4b', accent: '#fbbf24', emoji: '👑' },
  { id: 'top-jubah-penyihir', name: 'Jubah Bintang Ungu', category: 'top', color: '#581c87', accent: '#fde047', emoji: '🔮' },
  { id: 'top-astronot-putih', name: 'Baju Astronot Antariksa', category: 'top', color: '#e2e8f0', accent: '#f97316', emoji: '🧑‍🚀' },
  { id: 'top-kaos-olahraga', name: 'Jersey Olahraga Juara', category: 'top', color: '#0284c7', accent: '#38bdf8', emoji: '⚽' },
  { id: 'top-kaos-kuning', name: 'Kaos Ceria Matahari', category: 'top', color: '#eab308', accent: '#fef9c3', emoji: '☀️' },
  { id: 'top-cardigan-pink', name: 'Kardigan Stroberi', category: 'top', color: '#f43f5e', accent: '#ffe4e6', emoji: '🍓' },
  { id: 'top-cardigan-teal', name: 'Kardigan Tosca', category: 'top', color: '#0d9488', accent: '#ccfbf1', emoji: '💎' },
  { id: 'top-vest-akademi', name: 'Rompi Akademi Klasik', category: 'top', color: '#334155', accent: '#f8fafc', emoji: '📚' },
  { id: 'top-kimono-sakura', name: 'Atasan Kimono Sakura', category: 'top', color: '#ec4899', accent: '#fbcfe8', emoji: '🌸' },
];

const TOP_STYLE_FAMILIES: { slug: string; label: string; emoji: string }[] = [
  { slug: 'hoodie', label: 'Hoodie Streetwear', emoji: '🧥' },
  { slug: 'blazer', label: 'Blazer Akademi', emoji: '🎓' },
  { slug: 'batik', label: 'Batik Modern', emoji: '🇮🇩' },
  { slug: 'tunik', label: 'Tunik Elegan', emoji: '🧕' },
  { slug: 'varsity', label: 'Jaket Varsity', emoji: '🏀' },
  { slug: 'sweater', label: 'Sweater Rajut', emoji: '🧶' },
  { slug: 'kemeja', label: 'Kemeja Kasual', emoji: '👔' },
  { slug: 'gaun', label: 'Blus Gaun Pesta', emoji: '👗' },
  { slug: 'kimono', label: 'Kimono Festival', emoji: '🌸' },
  { slug: 'jersey', label: 'Jersey Juara', emoji: '⚽' },
  { slug: 'kardigan', label: 'Kardigan Cozy', emoji: '🧸' },
  { slug: 'rompi', label: 'Rompi Kampus', emoji: '📚' },
];

export const TOP_ITEMS: WardrobeItem[] = [
  ...BASE_TOP_ITEMS,
  ...TOP_STYLE_FAMILIES.flatMap((fam) =>
    FASHION_COLORS_12.map((col) => ({
      id: `top-ext-${fam.slug}-${col.slug}`,
      name: `${fam.label} ${col.label}`,
      category: 'top' as const,
      color: col.hex,
      accent: col.accent,
      emoji: fam.emoji,
    }))
  ),
];

// 144 Rok & Celana
const BASE_BOTTOM_ITEMS: WardrobeItem[] = [
  { id: 'bot-rok-lipit-pink', name: 'Rok Lipit Sakura', category: 'bottom', color: '#f472b6', emoji: '🎀', bottomStyle: 'pleated' },
  { id: 'bot-rok-lipit-navy', name: 'Rok Lipit Akademi', category: 'bottom', color: '#1e3a8a', emoji: '🎒', bottomStyle: 'pleated' },
  { id: 'bot-rok-lipit-abu', name: 'Rok Lipit Abu SMA', category: 'bottom', color: '#64748b', emoji: '🏫', bottomStyle: 'pleated' },
  { id: 'bot-rok-lipit-merah', name: 'Rok Lipit Kotak Merah', category: 'bottom', color: '#be123c', emoji: '🍒', bottomStyle: 'pleated' },
  { id: 'bot-rok-lipit-ungu', name: 'Rok Lipit Lilac', category: 'bottom', color: '#9333ea', emoji: '💜', bottomStyle: 'pleated' },
  { id: 'bot-rok-lipit-hijau', name: 'Rok Lipit Zamrud', category: 'bottom', color: '#059669', emoji: '🍀', bottomStyle: 'pleated' },
  { id: 'bot-rok-tutu-bintang', name: 'Rok Tutu Putri Bintang', category: 'bottom', color: '#c084fc', emoji: '✨', bottomStyle: 'tutu' },
  { id: 'bot-rok-tutu-rose', name: 'Rok Tutu Mawar', category: 'bottom', color: '#fb7185', emoji: '🌹', bottomStyle: 'tutu' },
  { id: 'bot-rok-tutu-es', name: 'Rok Tutu Kristal Es', category: 'bottom', color: '#38bdf8', emoji: '❄️', bottomStyle: 'tutu' },
  { id: 'bot-rok-tutu-emas', name: 'Rok Tutu Keemasan', category: 'bottom', color: '#f59e0b', emoji: '🌟', bottomStyle: 'tutu' },
  { id: 'bot-rok-panjang-sage', name: 'Rok Panjang Sage', category: 'bottom', color: '#047857', emoji: '🌿', bottomStyle: 'longskirt' },
  { id: 'bot-rok-panjang-krim', name: 'Rok Panjang Krim', category: 'bottom', color: '#d6c7b2', emoji: '🤍', bottomStyle: 'longskirt' },
  { id: 'bot-rok-panjang-hitam', name: 'Rok Panjang Hitam Elegan', category: 'bottom', color: '#18181b', emoji: '🖤', bottomStyle: 'longskirt' },
  { id: 'bot-rok-panjang-lilac', name: 'Rok Panjang Lavender', category: 'bottom', color: '#7c3aed', emoji: '🪻', bottomStyle: 'longskirt' },
  { id: 'bot-rok-panjang-batik', name: 'Rok Batik Nusantara', category: 'bottom', color: '#78350f', emoji: '🇮🇩', bottomStyle: 'longskirt' },
  { id: 'bot-rok-panjang-rose', name: 'Rok Panjang Dusty Rose', category: 'bottom', color: '#be185d', emoji: '🌷', bottomStyle: 'longskirt' },
  { id: 'bot-rok-mini-denim', name: 'Rok Denim Kasual', category: 'bottom', color: '#2563eb', emoji: '💙', bottomStyle: 'skirt' },
  { id: 'bot-rok-mini-kuning', name: 'Rok Ceria Lemon', category: 'bottom', color: '#eab308', emoji: '🍋', bottomStyle: 'skirt' },
  { id: 'bot-celana-jeans-biru', name: 'Celana Jeans Biru', category: 'bottom', color: '#1d4ed8', emoji: '👖', bottomStyle: 'pants' },
  { id: 'bot-celana-jeans-gelap', name: 'Celana Jeans Indigo', category: 'bottom', color: '#1e3a8a', emoji: '🌌', bottomStyle: 'pants' },
  { id: 'bot-celana-jeans-terang', name: 'Celana Jeans Langit', category: 'bottom', color: '#60a5fa', emoji: '☁️', bottomStyle: 'pants' },
  { id: 'bot-celana-hitam', name: 'Celana Bahan Hitam', category: 'bottom', color: '#111827', emoji: '🖤', bottomStyle: 'pants' },
  { id: 'bot-celana-abu', name: 'Celana Seragam Abu', category: 'bottom', color: '#475569', emoji: '🎓', bottomStyle: 'pants' },
  { id: 'bot-celana-chino-khaki', name: 'Celana Chino Khaki', category: 'bottom', color: '#b48a5a', emoji: '🏜️', bottomStyle: 'pants' },
  { id: 'bot-celana-chino-olive', name: 'Celana Chino Zaitun', category: 'bottom', color: '#3f6212', emoji: '🫒', bottomStyle: 'pants' },
  { id: 'bot-celana-putih', name: 'Celana Putih Kerajaan', category: 'bottom', color: '#f1f5f9', emoji: '👑', bottomStyle: 'pants' },
  { id: 'bot-celana-jogger-navy', name: 'Jogger Sport Navy', category: 'bottom', color: '#0f172a', emoji: '👟', bottomStyle: 'pants' },
  { id: 'bot-celana-jogger-merah', name: 'Jogger Sport Merah', category: 'bottom', color: '#b91c1c', emoji: '🔥', bottomStyle: 'pants' },
  { id: 'bot-celana-kargo-cokelat', name: 'Celana Kargo Petualang', category: 'bottom', color: '#713f12', emoji: '🧭', bottomStyle: 'pants' },
  { id: 'bot-celana-kargo-hijau', name: 'Celana Kargo Rimba', category: 'bottom', color: '#166534', emoji: '🌲', bottomStyle: 'pants' },
  { id: 'bot-celana-astronot', name: 'Celana Antariksa', category: 'bottom', color: '#cbd5e1', emoji: '🚀', bottomStyle: 'pants' },
  { id: 'bot-celana-cyber', name: 'Celana Neon Cyber', category: 'bottom', color: '#312e81', emoji: '⚡', bottomStyle: 'pants' },
  { id: 'bot-shorts-sport', name: 'Celana Pendek Sport', category: 'bottom', color: '#0284c7', emoji: '⚽', bottomStyle: 'shorts' },
  { id: 'bot-shorts-denim', name: 'Celana Pendek Denim', category: 'bottom', color: '#2563eb', emoji: '☀️', bottomStyle: 'shorts' },
  { id: 'bot-shorts-hitam', name: 'Celana Pendek Santai', category: 'bottom', color: '#1f2937', emoji: '🛹', bottomStyle: 'shorts' },
  { id: 'bot-shorts-mint', name: 'Celana Pendek Mint', category: 'bottom', color: '#14b8a6', emoji: '🌊', bottomStyle: 'shorts' },
];

const BOTTOM_STYLE_FAMILIES: {
  slug: string;
  label: string;
  style: BottomStyleType;
  emoji: string;
}[] = [
  { slug: 'roklipit', label: 'Rok Lipit Akademi', style: 'pleated', emoji: '🎀' },
  { slug: 'roktutu', label: 'Rok Tutu Peri', style: 'tutu', emoji: '✨' },
  { slug: 'rokpanjang', label: 'Rok Panjang Syari', style: 'longskirt', emoji: '👗' },
  { slug: 'rokmini', label: 'Rok Kasual', style: 'skirt', emoji: '🌸' },
  { slug: 'jeans', label: 'Celana Jeans', style: 'pants', emoji: '👖' },
  { slug: 'chino', label: 'Celana Chino', style: 'pants', emoji: '👔' },
  { slug: 'jogger', label: 'Celana Jogger', style: 'pants', emoji: '🏃' },
  { slug: 'kargo', label: 'Celana Kargo', style: 'pants', emoji: '🧭' },
  { slug: 'shorts', label: 'Celana Pendek', style: 'shorts', emoji: '☀️' },
];

export const BOTTOM_ITEMS: WardrobeItem[] = [
  ...BASE_BOTTOM_ITEMS,
  ...BOTTOM_STYLE_FAMILIES.flatMap((fam) =>
    FASHION_COLORS_12.map((col) => ({
      id: `bot-ext-${fam.slug}-${col.slug}`,
      name: `${fam.label} ${col.label}`,
      category: 'bottom' as const,
      color: col.hex,
      emoji: fam.emoji,
      bottomStyle: fam.style,
    }))
  ),
];

// 96 Sepatu (Kategori Baru!)
const SHOE_STYLE_FAMILIES: {
  slug: string;
  label: string;
  style: ShoeStyleType;
  emoji: string;
}[] = [
  { slug: 'sneaker', label: 'Sneakers Keren', style: 'sneaker', emoji: '👟' },
  { slug: 'boots', label: 'Boots Petualang', style: 'boots', emoji: '🥾' },
  { slug: 'loafers', label: 'Pantofel Akademi', style: 'loafers', emoji: '👞' },
  { slug: 'heels', label: 'Sepatu Pesta', style: 'heels', emoji: '👠' },
  { slug: 'sport', label: 'Sepatu Lari Pro', style: 'sport', emoji: '⚡' },
  { slug: 'sandals', label: 'Sandal Santai', style: 'sandals', emoji: '🩴' },
];

export const SHOE_ITEMS: WardrobeItem[] = SHOE_STYLE_FAMILIES.flatMap((fam) =>
  SHOE_COLORS_16.map((col) => ({
    id: `shoe-${fam.slug}-${col.slug}`,
    name: `${fam.label} ${col.label}`,
    category: 'shoe' as const,
    color: col.hex,
    accent: col.accent,
    emoji: fam.emoji,
    shoeStyle: fam.style,
  }))
);

// 120 Aksesoris
const BASE_ACCESSORY_ITEMS: WardrobeItem[] = [
  { id: 'acc-none', name: 'Tanpa Aksesoris', category: 'accessory', color: '#64748b', emoji: '✨', accessoryStyle: 'none' },
  { id: 'acc-pita-pink', name: 'Pita Rambut Sakura', category: 'accessory', color: '#f472b6', emoji: '🎀', accessoryStyle: 'ribbon' },
  { id: 'acc-pita-merah', name: 'Pita Rambut Merah', category: 'accessory', color: '#e11d48', emoji: '❤️', accessoryStyle: 'ribbon' },
  { id: 'acc-pita-biru', name: 'Pita Rambut Langit', category: 'accessory', color: '#38bdf8', emoji: '🩵', accessoryStyle: 'ribbon' },
  { id: 'acc-pita-emas', name: 'Pita Rambut Emas', category: 'accessory', color: '#fbbf24', emoji: '⭐', accessoryStyle: 'ribbon' },
  { id: 'acc-mahkota-emas', name: 'Mahkota Emas Juara', category: 'accessory', color: '#f59e0b', emoji: '👑', accessoryStyle: 'crown' },
  { id: 'acc-mahkota-perak', name: 'Tiara Kristal Perak', category: 'accessory', color: '#e2e8f0', emoji: '💎', accessoryStyle: 'crown' },
  { id: 'acc-mahkota-rose', name: 'Tiara Mawar Putri', category: 'accessory', color: '#f472b6', emoji: '🌸', accessoryStyle: 'crown' },
  { id: 'acc-toga-wisuda', name: 'Topi Wisuda Akademi', category: 'accessory', color: '#1e293b', accent: '#fbbf24', emoji: '🎓', accessoryStyle: 'gradcap' },
  { id: 'acc-toga-biru', name: 'Topi Wisuda Biru', category: 'accessory', color: '#1d4ed8', accent: '#fde047', emoji: '📘', accessoryStyle: 'gradcap' },
  { id: 'acc-kacamata-bulat', name: 'Kacamata Cerdas Bulat', category: 'accessory', color: '#f59e0b', emoji: '🤓', accessoryStyle: 'glasses' },
  { id: 'acc-kacamata-hitam', name: 'Kacamata Keren Hitam', category: 'accessory', color: '#0f172a', emoji: '🕶️', accessoryStyle: 'glasses' },
  { id: 'acc-kacamata-pink', name: 'Kacamata Pastel Pink', category: 'accessory', color: '#f472b6', emoji: '🩷', accessoryStyle: 'glasses' },
  { id: 'acc-kacamata-biru', name: 'Kacamata Cyber Biru', category: 'accessory', color: '#06b6d4', emoji: '💠', accessoryStyle: 'glasses' },
  { id: 'acc-headset-indigo', name: 'Headset Gaming Indigo', category: 'accessory', color: '#6366f1', emoji: '🎧', accessoryStyle: 'headphones' },
  { id: 'acc-headset-pink', name: 'Headset Musik Pink', category: 'accessory', color: '#ec4899', emoji: '🎵', accessoryStyle: 'headphones' },
  { id: 'acc-headset-emerald', name: 'Headset Neon Hijau', category: 'accessory', color: '#10b981', emoji: '🎶', accessoryStyle: 'headphones' },
  { id: 'acc-headset-gold', name: 'Headset Studio Emas', category: 'accessory', color: '#eab308', emoji: '🎙️', accessoryStyle: 'headphones' },
  { id: 'acc-sayap-putih', name: 'Sayap Malaikat Putih', category: 'accessory', color: '#f8fafc', emoji: '🕊️', accessoryStyle: 'wings' },
  { id: 'acc-sayap-pink', name: 'Sayap Peri Sakura', category: 'accessory', color: '#f9a8d4', emoji: '🧚', accessoryStyle: 'wings' },
  { id: 'acc-sayap-biru', name: 'Sayap Kristal Biru', category: 'accessory', color: '#38bdf8', emoji: '🦋', accessoryStyle: 'wings' },
  { id: 'acc-sayap-emas', name: 'Sayap Cahaya Emas', category: 'accessory', color: '#fbbf24', emoji: '🌟', accessoryStyle: 'wings' },
  { id: 'acc-halo-emas', name: 'Halo Cahaya Emas', category: 'accessory', color: '#fde047', emoji: '😇', accessoryStyle: 'halo' },
  { id: 'acc-halo-biru', name: 'Halo Galaksi Biru', category: 'accessory', color: '#38bdf8', emoji: '💫', accessoryStyle: 'halo' },
  { id: 'acc-halo-pink', name: 'Halo Bintang Pink', category: 'accessory', color: '#f472b6', emoji: '✨', accessoryStyle: 'halo' },
  { id: 'acc-ransel-biru', name: 'Tas Ransel Sekolah', category: 'accessory', color: '#2563eb', emoji: '🎒', accessoryStyle: 'backpack' },
  { id: 'acc-ransel-pink', name: 'Tas Ransel Lucu Pink', category: 'accessory', color: '#ec4899', emoji: '🩷', accessoryStyle: 'backpack' },
  { id: 'acc-ransel-kuning', name: 'Tas Ransel Petualang', category: 'accessory', color: '#eab308', emoji: '🧭', accessoryStyle: 'backpack' },
  { id: 'acc-ransel-hijau', name: 'Tas Ransel Kampus', category: 'accessory', color: '#059669', emoji: '📗', accessoryStyle: 'backpack' },
  { id: 'acc-syal-merah', name: 'Syal Hangat Merah', category: 'accessory', color: '#dc2626', emoji: '🧣', accessoryStyle: 'scarf' },
  { id: 'acc-syal-biru', name: 'Syal Musim Dingin', category: 'accessory', color: '#0ea5e9', emoji: '❄️', accessoryStyle: 'scarf' },
  { id: 'acc-syal-emas', name: 'Syal Akademi Emas', category: 'accessory', color: '#f59e0b', emoji: '🏅', accessoryStyle: 'scarf' },
  { id: 'acc-baret-merah', name: 'Topi Baret Seniman', category: 'accessory', color: '#be123c', emoji: '🎨', accessoryStyle: 'beret' },
  { id: 'acc-baret-krim', name: 'Topi Baret Paris', category: 'accessory', color: '#d6c7b2', emoji: '🥐', accessoryStyle: 'beret' },
  { id: 'acc-baret-ungu', name: 'Topi Baret Ungu', category: 'accessory', color: '#7c3aed', emoji: '🔮', accessoryStyle: 'beret' },
  { id: 'acc-telinga-kucing-hitam', name: 'Bando Telinga Kucing', category: 'accessory', color: '#1f2937', accent: '#f472b6', emoji: '🐱', accessoryStyle: 'cat_ears' },
  { id: 'acc-telinga-kucing-putih', name: 'Bando Kucing Putih', category: 'accessory', color: '#f8fafc', accent: '#fb7185', emoji: '🐾', accessoryStyle: 'cat_ears' },
  { id: 'acc-topi-penyihir', name: 'Topi Penyihir Bintang', category: 'accessory', color: '#581c87', accent: '#fbbf24', emoji: '🧙', accessoryStyle: 'wizard_hat' },
  { id: 'acc-jubah-merah', name: 'Jubah Pahlawan Merah', category: 'accessory', color: '#dc2626', emoji: '🦸', accessoryStyle: 'cape' },
  { id: 'acc-jubah-biru', name: 'Jubah Pangeran Biru', category: 'accessory', color: '#1d4ed8', emoji: '🛡️', accessoryStyle: 'cape' },
  { id: 'acc-dasi-kupu', name: 'Dasi Kupu-Kupu Klasik', category: 'accessory', color: '#e11d48', emoji: '🎀', accessoryStyle: 'bowtie' },
  { id: 'acc-tongkat-bintang', name: 'Tongkat Bintang Ajaib', category: 'accessory', color: '#fbbf24', emoji: '🪄', accessoryStyle: 'star_wand' },
];

const ACC_STYLE_FAMILIES: {
  slug: string;
  label: string;
  style: AccessoryStyleType;
  emoji: string;
}[] = [
  { slug: 'ribbon', label: 'Pita Eksklusif', style: 'ribbon', emoji: '🎀' },
  { slug: 'crown', label: 'Mahkota Royal', style: 'crown', emoji: '👑' },
  { slug: 'gradcap', label: 'Topi Wisuda', style: 'gradcap', emoji: '🎓' },
  { slug: 'glasses', label: 'Kacamata Stylish', style: 'glasses', emoji: '🕶️' },
  { slug: 'headphones', label: 'Headset Pro', style: 'headphones', emoji: '🎧' },
  { slug: 'wings', label: 'Sayap Fantasi', style: 'wings', emoji: '🦋' },
  { slug: 'halo', label: 'Halo Bintang', style: 'halo', emoji: '💫' },
  { slug: 'backpack', label: 'Tas Ransel', style: 'backpack', emoji: '🎒' },
  { slug: 'scarf', label: 'Syal Elegan', style: 'scarf', emoji: '🧣' },
  { slug: 'beret', label: 'Topi Baret', style: 'beret', emoji: '🎨' },
  { slug: 'cat', label: 'Bando Kucing', style: 'cat_ears', emoji: '🐱' },
  { slug: 'cape', label: 'Jubah Juara', style: 'cape', emoji: '🦸' },
  { slug: 'bowtie', label: 'Dasi Kupu', style: 'bowtie', emoji: '🎀' },
];

const ACC_COLORS_6 = FASHION_COLORS_12.slice(0, 6);

export const ACCESSORY_ITEMS: WardrobeItem[] = [
  ...BASE_ACCESSORY_ITEMS,
  ...ACC_STYLE_FAMILIES.flatMap((fam) =>
    ACC_COLORS_6.map((col) => ({
      id: `acc-ext-${fam.slug}-${col.slug}`,
      name: `${fam.label} ${col.label}`,
      category: 'accessory' as const,
      color: col.hex,
      accent: col.accent,
      emoji: fam.emoji,
      accessoryStyle: fam.style,
    }))
  ),
];

export const ALL_WARDROBE_ITEMS: WardrobeItem[] = [
  ...CHARACTER_ITEMS,
  ...HAIR_ITEMS,
  ...TOP_ITEMS,
  ...BOTTOM_ITEMS,
  ...SHOE_ITEMS,
  ...ACCESSORY_ITEMS,
];

export const DEFAULT_AVATAR: AvatarConfig = {
  characterId: 'char-alien-mars',
  skinColor: '#4ade80',
  hairId: 'hair-spiky-navy',
  topId: 'top-hoodie-indigo',
  bottomId: 'bot-celana-jeans-biru',
  shoeId: 'shoe-sport-indigo',
  accessoryId: 'acc-headset-indigo',
};

export const AVATAR_PRESETS: Record<string, AvatarConfig> = {
  schoolgirl: {
    characterId: 'char-putri-andromeda',
    skinColor: '#a855f7',
    hairId: 'hair-twintails-pink',
    topId: 'top-sailor-pink',
    bottomId: 'bot-rok-lipit-pink',
    shoeId: 'shoe-sneaker-sakura',
    accessoryId: 'acc-pita-pink',
  },
  princess: {
    characterId: 'char-makhluk-nebula',
    skinColor: '#38bdf8',
    hairId: 'hair-wavy-chestnut',
    topId: 'top-gaun-putri',
    bottomId: 'bot-rok-tutu-bintang',
    shoeId: 'shoe-heels-lilac',
    accessoryId: 'acc-mahkota-emas',
  },
  hijab: {
    characterId: 'char-peri-bulan',
    skinColor: '#cbd5e1',
    hairId: 'hair-hijab-emerald',
    topId: 'top-gamis-pastel',
    bottomId: 'bot-rok-panjang-sage',
    shoeId: 'shoe-loafers-cream',
    accessoryId: 'acc-kacamata-bulat',
  },
  coolboy: {
    characterId: 'char-alien-mars',
    skinColor: '#4ade80',
    hairId: 'hair-spiky-navy',
    topId: 'top-hoodie-indigo',
    bottomId: 'bot-celana-jeans-biru',
    shoeId: 'shoe-sport-indigo',
    accessoryId: 'acc-headset-indigo',
  },
  prince: {
    characterId: 'char-penguasa-galaksi',
    skinColor: '#6366f1',
    hairId: 'hair-sidepart-dark',
    topId: 'top-jubah-pangeran',
    bottomId: 'bot-celana-putih',
    shoeId: 'shoe-boots-obsidian',
    accessoryId: 'acc-mahkota-emas',
  },
};

export function findWardrobeItem(id: string | undefined, fallbackList: WardrobeItem[]): WardrobeItem {
  if (!id) return fallbackList[0];
  return fallbackList.find((item) => item.id === id) ?? fallbackList[0];
}
