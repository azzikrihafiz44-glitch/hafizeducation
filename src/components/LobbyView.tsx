import React, { useState } from 'react';
import type {
  AvatarConfig,
  LobbyChatMessage,
  LobbyPlayer,
  QuizRoom,
} from '../types/quiz';
import { CHARACTER_ITEMS, findWardrobeItem } from '../data/wardrobeCatalog';

interface LobbyViewProps {
  room: QuizRoom;
  playerName: string;
  avatar: AvatarConfig;
  players: LobbyPlayer[];
  chatMessages: LobbyChatMessage[];
  isAdmin: boolean;
  roomStatus: 'waiting' | 'started';
  countdownValue: number | 'go' | null;
  onSendChat: (text: string) => void;
  onOpenWardrobe: () => void;
  onSelectAvatarCharacter?: (characterId: string, skinColor: string) => void;
  onAdminStartQuiz: () => void;
  onLeaveLobby: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  avatar,
  players,
  isAdmin,
  roomStatus,
  countdownValue,
  onOpenWardrobe,
  onSelectAvatarCharacter,
  onAdminStartQuiz,
  onLeaveLobby,
}) => {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarSearch, setAvatarSearch] = useState('');
  const [visibleAvatarCount, setVisibleAvatarCount] = useState(48);

  const filteredAvatars = React.useMemo(() => {
    const q = avatarSearch.trim().toLowerCase();
    if (!q) return CHARACTER_ITEMS;
    return CHARACTER_ITEMS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.emoji.includes(q)
    );
  }, [avatarSearch]);

  const visibleAvatars = filteredAvatars.slice(0, visibleAvatarCount);

  return (
    <section id="view-lobby" className="space-y-6 relative max-w-6xl mx-auto">
      {/* 10 -> 0 -> LET'S GO! Dramatic Countdown Overlay */}
      {countdownValue !== null && (
        <div
          id="lobby-countdown-overlay"
          role="alert"
          aria-live="assertive"
          className="fixed inset-0 z-50 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center select-none"
        >
          <div className="space-y-4 max-w-lg">
            <p className="text-sm sm:text-base font-extrabold uppercase tracking-[0.25em] text-amber-300">
              {countdownValue === 'go' ? '🔥 ARENA KUIS DIMULAI! 🔥' : '🚀 KUIS SEGERA DIMULAI'}
            </p>
            {countdownValue === 'go' ? (
              <div className="text-6xl sm:text-8xl font-black tracking-tight bg-gradient-to-r from-emerald-300 via-amber-300 to-pink-400 bg-clip-text text-transparent animate-bounce drop-shadow-[0_0_35px_rgba(251,191,36,0.65)]">
                LET&apos;S GO!
              </div>
            ) : (
              <div
                key={countdownValue}
                className="w-40 h-40 sm:w-52 sm:h-52 mx-auto rounded-full bg-gradient-to-br from-indigo-600/40 via-purple-600/35 to-pink-600/40 border-4 border-amber-400 shadow-[0_0_60px_rgba(251,191,36,0.45)] flex items-center justify-center animate-pulse"
              >
                <span className="text-7xl sm:text-9xl font-black text-white tabular-nums drop-shadow-[0_4px_20px_rgba(0,0,0,0.7)]">
                  {countdownValue}
                </span>
              </div>
            )}
            <p className="text-xs sm:text-sm font-bold text-slate-200">
              {countdownValue === 'go'
                ? 'Semangat! Kerjakan dengan jujur & raih Peringkat #1 🏆'
                : 'Bersiaplah! Tetap fokus di layar kuis dan jangan berpindah tab.'}
            </p>
          </div>
        </div>
      )}

      {/* Clean Lobby Header Bar */}
      <div className="hero-glow-card holo-top-beam p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/20 border border-purple-400/40 text-purple-200 text-[11px] font-extrabold font-mono tracking-wider">
              KODE: {room.code}
            </span>
            <span className="text-xs font-bold text-emerald-300">
              ● {players.length} Peserta Bergabung
            </span>
          </div>
          <h2 id="lobby-quiz-title" className="font-display text-xl sm:text-2xl font-extrabold text-white">
            {room.title}
          </h2>
          <p className="text-xs text-slate-300">
            Lobi Peserta — Pilih dari {CHARACTER_ITEMS.length} avatar lucu dan tunggu Admin memulai kuis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            id="btn-lobby-pick-avatar"
            onClick={() => setShowAvatarPicker((prev) => !prev)}
            className="px-4 py-2.5 rounded-xl bg-purple-600/85 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition whitespace-nowrap"
          >
            <span aria-hidden="true">👽</span>{' '}
            {showAvatarPicker ? 'Tutup Pilihan Avatar' : `Pilih Avatar (${CHARACTER_ITEMS.length})`}
          </button>

          {isAdmin ? (
            <button
              type="button"
              id="btn-lobby-start-quiz"
              onClick={onAdminStartQuiz}
              className="btn-3d px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap"
            >
              <span aria-hidden="true">🚀</span> Mulai Kuis ({room.questions.length} Soal)
            </button>
          ) : (
            <div
              id="lobby-waiting-status"
              className="px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-200 font-extrabold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap"
            >
              <span aria-hidden="true">⏳</span>
              <span>
                {roomStatus === 'started'
                  ? 'Kuis Dimulai! Memasuki Arena...'
                  : 'Menunggu Admin Memulai Kuis'}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={onLeaveLobby}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/70 border border-slate-700 text-slate-300 hover:text-rose-300 font-bold text-xs sm:text-sm transition whitespace-nowrap"
          >
            Keluar
          </button>
        </div>
      </div>

      {!isAdmin && (
        <div
          id="lobby-admin-only-notice"
          className="px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-400/35 text-xs text-amber-100 flex flex-wrap items-center justify-between gap-2"
        >
          <span>
            🔒 <strong>Aturan Lobi Kuis:</strong> Setiap peserta wajib masuk lobi terlebih dahulu.{' '}
            <strong>Hanya Admin</strong> yang dapat menekan tombol <strong>Mulai Kuis</strong>.
          </span>
          <span className="text-[11px] font-bold text-amber-300">
            Status: {roomStatus === 'started' ? '🚀 Segera Mulai...' : '⏳ Menunggu Admin'}
          </span>
        </div>
      )}

      {/* Quick 548+ Cute Avatar Selector Panel directly inside Lobby */}
      {showAvatarPicker && (
        <div
          id="lobby-avatar-picker"
          className="glass-card p-5 rounded-3xl border border-purple-400/35 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-extrabold text-white">
                👽 Pilih Avatar Lucu ({CHARACTER_ITEMS.length} Pilihan)
              </h3>
              <p className="text-xs text-slate-400">
                Menampilkan {visibleAvatars.length} dari {filteredAvatars.length} avatar lucu — klik untuk langsung mengganti avatarmu
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const pick = CHARACTER_ITEMS[Math.floor(Math.random() * CHARACTER_ITEMS.length)];
                  onSelectAvatarCharacter?.(pick.id, pick.color);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/45 text-amber-200 text-xs font-bold transition whitespace-nowrap"
              >
                🎲 Acak Avatar Lucu
              </button>
              <button
                type="button"
                onClick={onOpenWardrobe}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-sky-400/30 text-sky-200 text-xs font-bold transition whitespace-nowrap"
              >
                ✨ Kostum Lengkap →
              </button>
            </div>
          </div>

          <input
            type="text"
            value={avatarSearch}
            onChange={(e) => {
              setAvatarSearch(e.target.value);
              setVisibleAvatarCount(48);
            }}
            placeholder="🔍 Cari avatar lucu (misal: Kucing, Panda, Alien, Slime, Kapibara, Dino, Sakura)..."
            aria-label="Cari avatar lucu"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-purple-400/30 focus:border-purple-400 outline-none text-xs text-white placeholder-slate-400"
          />

          <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
            {visibleAvatars.map((item) => {
              const isSelected = avatar.characterId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectAvatarCharacter?.(item.id, item.color);
                  }}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 text-center transition ${
                    isSelected
                      ? 'bg-purple-600/35 border-purple-300 shadow-[0_0_20px_rgba(192,132,252,0.35)] scale-[1.03]'
                      : 'bg-slate-900/80 border-slate-800 hover:border-purple-400/50 hover:bg-slate-800/80'
                  }`}
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-2xl shadow-inner border border-white/20"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${item.color}dd, ${item.color}44)`,
                    }}
                  >
                    {item.emoji}
                  </div>
                  <span className="text-[10px] font-bold text-slate-200 leading-tight line-clamp-2">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>

          {visibleAvatarCount < filteredAvatars.length && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setVisibleAvatarCount((c) => c + 64)}
                className="px-5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/45 text-purple-200 text-xs font-extrabold transition"
              >
                Tampilkan Lebih Banyak (+{Math.min(64, filteredAvatars.length - visibleAvatarCount)} dari {filteredAvatars.length - visibleAvatarCount} sisa)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Clean Participant Roster: ONLY Avatar & Nama Peserta */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-5">
        <div className="flex items-center justify-between gap-2 border-b border-sky-400/15 pb-3">
          <h3 className="font-display text-lg font-extrabold text-white">
            Peserta di Lobi ({players.length})
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            Avatar &amp; Nama Peserta
          </span>
        </div>

        <div
          id="lobby-participants-grid"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          {players.map((p) => {
            const charItem = findWardrobeItem(p.avatar.characterId, CHARACTER_ITEMS);
            const ringColor = charItem?.color || p.avatar.skinColor || '#a855f7';
            return (
              <div
                key={p.id}
                className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-3 transition ${
                  p.isLocal
                    ? 'bg-gradient-to-b from-purple-900/45 to-slate-900/90 border-purple-400/60 shadow-[0_0_24px_rgba(168,85,247,0.22)]'
                    : 'bg-slate-900/80 border-slate-800 hover:border-sky-400/35'
                }`}
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-4xl border-2 shadow-lg relative overflow-visible"
                  style={{
                    borderColor: ringColor,
                    background: `radial-gradient(circle at 30% 28%, ${ringColor}cc, #0f172a 85%)`,
                    boxShadow: `0 0 22px ${ringColor}44`,
                  }}
                >
                  {p.photoUrl ? (
                    <>
                      <img
                        src={p.photoUrl}
                        alt={`Foto ${p.name}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-950 border border-white/25 flex items-center justify-center text-base shadow"
                      >
                        {charItem?.emoji || '👽'}
                      </span>
                    </>
                  ) : (
                    <span aria-hidden="true">{charItem?.emoji || '👽'}</span>
                  )}
                </div>

                <p className="text-sm font-extrabold text-white leading-snug break-words w-full">
                  {p.name}
                  {p.isLocal && (
                    <span className="block text-[11px] font-bold text-purple-300 mt-0.5">
                      (Kamu)
                    </span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
