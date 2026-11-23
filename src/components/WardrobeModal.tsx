import React, { useState } from 'react';
import type { AvatarConfig, WardrobeCategory, WardrobeItem } from '../types/quiz';
import {
  ACCESSORY_ITEMS,
  ALL_WARDROBE_ITEMS,
  AVATAR_PRESETS,
  BOTTOM_ITEMS,
  CHARACTER_ITEMS,
  HAIR_ITEMS,
  SHOE_ITEMS,
  SKIN_SWATCHES,
  TOP_ITEMS,
} from '../data/wardrobeCatalog';
import { AvatarPreview3D } from './AvatarPreview3D';

interface WardrobeModalProps {
  open: boolean;
  avatar: AvatarConfig;
  onChangeAvatar: (next: AvatarConfig) => void;
  onClose: () => void;
}

const TABS: { key: WardrobeCategory; label: string; items: WardrobeItem[] }[] = [
  { key: 'character', label: `👽 Avatar Lucu (${CHARACTER_ITEMS.length})`, items: CHARACTER_ITEMS },
  { key: 'hair', label: `💇 Rambut (${HAIR_ITEMS.length})`, items: HAIR_ITEMS },
  { key: 'top', label: `👚 Baju (${TOP_ITEMS.length})`, items: TOP_ITEMS },
  { key: 'bottom', label: `👗 Rok & Celana (${BOTTOM_ITEMS.length})`, items: BOTTOM_ITEMS },
  { key: 'shoe', label: `👟 Sepatu (${SHOE_ITEMS.length})`, items: SHOE_ITEMS },
  { key: 'accessory', label: `👑 Aksesoris (${ACCESSORY_ITEMS.length})`, items: ACCESSORY_ITEMS },
];

export const WardrobeModal: React.FC<WardrobeModalProps> = ({
  open,
  avatar,
  onChangeAvatar,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<WardrobeCategory>('character');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(60);

  if (!open) return null;

  const currentTabObj = TABS.find((t) => t.key === activeTab) ?? TABS[0];
  const filteredItems = currentTabObj.items.filter((item) =>
    item.name.toLowerCase().includes(search.trim().toLowerCase())
  );
  const displayedItems = filteredItems.slice(0, visibleCount);

  const handleRandomCuteAvatar = () => {
    const picked = CHARACTER_ITEMS[Math.floor(Math.random() * CHARACTER_ITEMS.length)];
    if (picked) {
      onChangeAvatar({ ...avatar, characterId: picked.id, skinColor: picked.color });
    }
  };

  const isSelected = (item: WardrobeItem): boolean => {
    switch (item.category) {
      case 'character':
        return avatar.characterId === item.id;
      case 'hair':
        return avatar.hairId === item.id;
      case 'top':
        return avatar.topId === item.id;
      case 'bottom':
        return avatar.bottomId === item.id;
      case 'shoe':
        return (avatar.shoeId || SHOE_ITEMS[0].id) === item.id;
      case 'accessory':
        return avatar.accessoryId === item.id;
    }
  };

  const handleSelectItem = (item: WardrobeItem) => {
    const next = { ...avatar };
    if (item.category === 'character') next.characterId = item.id;
    else if (item.category === 'hair') next.hairId = item.id;
    else if (item.category === 'top') next.topId = item.id;
    else if (item.category === 'bottom') next.bottomId = item.id;
    else if (item.category === 'shoe') next.shoeId = item.id;
    else if (item.category === 'accessory') next.accessoryId = item.id;
    onChangeAvatar(next);
  };

  return (
    <div
      id="modal-wardrobe"
      role="dialog"
      aria-modal="true"
      aria-label="Koleksi 500+ Avatar Lucu & Kostum"
      className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-3 sm:p-5"
    >
      <div className="glass-card w-full max-w-5xl rounded-3xl p-5 sm:p-6 border border-pink-500/30 max-h-[92vh] flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
              <span aria-hidden="true">👽</span> Koleksi Avatar Lucu &amp; Kostum ({CHARACTER_ITEMS.length} Avatar · {ALL_WARDROBE_ITEMS.length}+ Item)
            </h3>
            <p className="text-xs text-slate-400">
              Pilih lebih dari 500 avatar lucu &amp; makhluk luar angkasa, lengkap dengan kostum dan aksesoris.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRandomCuteAvatar}
              className="px-3 py-2 rounded-xl bg-fuchsia-600/30 hover:bg-fuchsia-500/40 border border-fuchsia-400/40 text-fuchsia-100 font-bold text-xs whitespace-nowrap"
            >
              🎲 Acak Avatar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm whitespace-nowrap shrink-0"
            >
              ✓ Simpan &amp; Tutup
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-y-auto custom-scrollbar pr-1">
          {/* Left: Live 3D Preview + Skin Swatches + Presets */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="w-full h-72 rounded-2xl bg-gradient-to-b from-indigo-950 to-slate-950 border border-slate-700 overflow-hidden">
              <AvatarPreview3D
                config={avatar}
                className="w-full h-full"
                testId="wardrobe-avatar-canvas"
              />
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <p className="text-[11px] font-bold text-slate-300 mb-2">Warna Kulit Karakter:</p>
              <div className="flex flex-wrap gap-2">
                {SKIN_SWATCHES.map((sw) => (
                  <button
                    key={sw.id}
                    type="button"
                    title={sw.name}
                    aria-label={`Warna kulit ${sw.name}`}
                    onClick={() => onChangeAvatar({ ...avatar, skinColor: sw.hex })}
                    className={`w-7 h-7 rounded-full border-2 transition ${
                      avatar.skinColor === sw.hex
                        ? 'border-white scale-110 ring-2 ring-indigo-400'
                        : 'border-slate-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: sw.hex }}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onChangeAvatar({ ...AVATAR_PRESETS.schoolgirl })}
                className="px-2.5 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/30 text-pink-200 text-[11px] font-bold"
              >
                🎀 Siswi Manis
              </button>
              <button
                type="button"
                onClick={() => onChangeAvatar({ ...AVATAR_PRESETS.princess })}
                className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-200 text-[11px] font-bold"
              >
                👸 Putri Bintang
              </button>
              <button
                type="button"
                onClick={() => onChangeAvatar({ ...AVATAR_PRESETS.hijab })}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 text-[11px] font-bold"
              >
                🧕 Hijab Chic
              </button>
              <button
                type="button"
                onClick={() => onChangeAvatar({ ...AVATAR_PRESETS.coolboy })}
                className="px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 text-sky-200 text-[11px] font-bold"
              >
                ⚡ Cowok Keren
              </button>
              <button
                type="button"
                onClick={() => onChangeAvatar({ ...AVATAR_PRESETS.prince })}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-200 text-[11px] font-bold"
              >
                👑 Pangeran
              </button>
            </div>
          </div>

          {/* Right: Tabs + Search + Item Grid */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5" role="tablist">
                {TABS.map((tab) => {
                  const active = tab.key === activeTab;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setActiveTab(tab.key);
                        setSearch('');
                        setVisibleCount(60);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        active
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setVisibleCount(60);
                }}
                placeholder="Cari avatar / item..."
                aria-label="Cari avatar atau item kostum"
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none w-40"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {displayedItems.map((item) => {
                const selected = isSelected(item);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                      selected
                        ? 'bg-indigo-600/30 border-indigo-400 ring-2 ring-indigo-400/40'
                        : 'bg-slate-900/75 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 border border-white/15"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    >
                      {item.emoji}
                    </span>
                    <span className="text-xs font-bold text-slate-100 leading-tight line-clamp-2">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
            {filteredItems.length > visibleCount && (
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 80)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-indigo-200 transition"
              >
                Tampilkan Lebih Banyak ({displayedItems.length} / {filteredItems.length})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
