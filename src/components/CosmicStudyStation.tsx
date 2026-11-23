import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { HistoryRecord } from '../types/quiz';
import { calculateAstronautRank, formatCountdownMMSS } from '../utils/astronautRank';
import {
  ALL_MISSIONS_BONUS_XP,
  DAILY_MISSION_SLOTS,
  claimAllMissionsBonus,
  claimMissionReward,
  formatTimeUntilMidnight,
  getLocalDateKey,
  incrementManualMissionProgress,
  rerollUnclaimedMissions,
  resolveDailyMissions,
  swapSingleMission,
  syncStateForDate,
  type DailyMissionState,
  type MissionCategory,
  type MissionDifficulty,
} from '../utils/dailyMissions';

interface CosmicStudyStationProps {
  userHistory: HistoryRecord[];
  onOpenPortalsAsas: () => void;
  onOpenWardrobe: () => void;
}

interface FocusPreset {
  id: string;
  label: string;
  minutes: number;
  desc: string;
}

const FOCUS_PRESETS: FocusPreset[] = [
  { id: 'sprint', label: '15 mnt', minutes: 15, desc: 'Sprint Cepat' },
  { id: 'pomodoro', label: '25 mnt', minutes: 25, desc: 'Fokus UTBK / ASAS' },
  { id: 'deep', label: '45 mnt', minutes: 45, desc: 'Deep Study' },
  { id: 'break', label: '5 mnt', minutes: 5, desc: 'Istirahat Singkat' },
];

const STORAGE_FOCUS_KEY = 'hafiz_cosmic_focus_sessions_v1';
const STORAGE_MISSIONS_V2_KEY = 'hafiz_cosmic_daily_missions_v2';

const CATEGORY_META: Record<MissionCategory, { label: string; colorClass: string }> = {
  fokus: { label: 'Fokus', colorClass: 'text-sky-300 bg-sky-500/15 border-sky-400/35' },
  kuis: { label: 'Kuis', colorClass: 'text-indigo-200 bg-indigo-500/15 border-indigo-400/35' },
  materi: { label: 'Materi', colorClass: 'text-teal-200 bg-teal-500/15 border-teal-400/35' },
  eksplorasi: { label: 'Eksplorasi', colorClass: 'text-amber-200 bg-amber-500/15 border-amber-400/35' },
};

const DIFFICULTY_COLOR: Record<MissionDifficulty, string> = {
  Mudah: 'text-emerald-300',
  Menengah: 'text-sky-300',
  Tantangan: 'text-amber-300',
};

function loadMissionState(): DailyMissionState {
  const todayKey = getLocalDateKey();
  try {
    const raw = localStorage.getItem(STORAGE_MISSIONS_V2_KEY);
    if (!raw) return syncStateForDate(null, todayKey);
    const parsed = JSON.parse(raw) as DailyMissionState;
    return syncStateForDate(parsed, todayKey);
  } catch {
    return syncStateForDate(null, todayKey);
  }
}

function saveMissionState(state: DailyMissionState): void {
  try {
    localStorage.setItem(STORAGE_MISSIONS_V2_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export const CosmicStudyStation: React.FC<CosmicStudyStationProps> = ({
  userHistory,
  onOpenPortalsAsas,
  onOpenWardrobe,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<FocusPreset>(FOCUS_PRESETS[1]);
  const [secondsLeft, setSecondsLeft] = useState<number>(FOCUS_PRESETS[1].minutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [ambientOn, setAmbientOn] = useState<boolean>(false);
  const [sessionJustFinished, setSessionJustFinished] = useState<boolean>(false);
  const [resetCountdown, setResetCountdown] = useState<string>(() => formatTimeUntilMidnight());
  const [missionBanner, setMissionBanner] = useState<string | null>(null);

  const [focusSessions, setFocusSessions] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(STORAGE_FOCUS_KEY) || '0');
      return Number.isFinite(saved) && saved >= 0 ? saved : 0;
    } catch {
      return 0;
    }
  });

  const [missionState, setMissionState] = useState<DailyMissionState>(() => loadMissionState());

  const updateMissionState = (updater: (prev: DailyMissionState) => DailyMissionState) => {
    setMissionState((prev) => {
      const synced = syncStateForDate(prev, getLocalDateKey());
      const next = updater(synced);
      saveMissionState(next);
      return next;
    });
  };

  // Keep daily missions automatically rotating if the clock passes midnight
  useEffect(() => {
    const interval = window.setInterval(() => {
      const todayKey = getLocalDateKey();
      setResetCountdown(formatTimeUntilMidnight());
      setMissionState((prev) => {
        if (prev.date !== todayKey) {
          const rotated = syncStateForDate(prev, todayKey);
          saveMissionState(rotated);
          return rotated;
        }
        return prev;
      });
    }, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  // Auto-hide transient mission reward banner
  useEffect(() => {
    if (!missionBanner) return;
    const t = window.setTimeout(() => setMissionBanner(null), 3500);
    return () => window.clearTimeout(t);
  }, [missionBanner]);

  // Web Audio API synthesized ambient deep-space soundscape
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscNodesRef = useRef<OscillatorNode[]>([]);

  const stopAmbientAudio = () => {
    try {
      oscNodesRef.current.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // already stopped
        }
      });
      oscNodesRef.current = [];
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      gainNodeRef.current = null;
    } catch {
      // ignore cleanup errors
    }
  };

  const toggleAmbientAudio = () => {
    if (ambientOn) {
      stopAmbientAudio();
      setAmbientOn(false);
      return;
    }
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.055, ctx.currentTime + 1.4);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, ctx.currentTime);

      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      const freqs = [110, 164.81, 220, 277.18];
      const oscs = freqs.map((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.detune.setValueAtTime((idx - 1.5) * 4, ctx.currentTime);
        osc.connect(filter);
        osc.start();
        return osc;
      });

      audioCtxRef.current = ctx;
      gainNodeRef.current = masterGain;
      oscNodesRef.current = oscs;
      setAmbientOn(true);
    } catch {
      setAmbientOn(false);
    }
  };

  useEffect(() => {
    return () => {
      stopAmbientAudio();
    };
  }, []);

  // Countdown tick
  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setIsRunning(false);
          setSessionJustFinished(true);
          setFocusSessions((count) => {
            const next = count + 1;
            try {
              localStorage.setItem(STORAGE_FOCUS_KEY, String(next));
            } catch {
              // ignore storage errors
            }
            return next;
          });
          updateMissionState((prevState) => ({
            ...prevState,
            focusSessionsToday: prevState.focusSessionsToday + 1,
          }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRunning]);

  const handleSelectPreset = (preset: FocusPreset) => {
    setIsRunning(false);
    setSessionJustFinished(false);
    setSelectedPreset(preset);
    setSecondsLeft(preset.minutes * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSessionJustFinished(false);
    setSecondsLeft(selectedPreset.minutes * 60);
  };

  // Compute today's real quiz activity from userHistory
  const activitySnapshot = useMemo(() => {
    const todayKey = missionState.date;
    let quizzesToday = 0;
    let highScoreQuizzesToday = 0;
    for (const rec of userHistory) {
      if (!rec.timestamp) continue;
      const parsedDate = new Date(rec.timestamp);
      if (Number.isNaN(parsedDate.getTime())) continue;
      const recDate = getLocalDateKey(parsedDate);
      if (recDate === todayKey) {
        quizzesToday += 1;
        if ((rec.grade || 0) >= 80) {
          highScoreQuizzesToday += 1;
        }
      }
    }
    return { quizzesToday, highScoreQuizzesToday };
  }, [userHistory, missionState.date]);

  const resolvedMissions = useMemo(
    () => resolveDailyMissions(missionState, activitySnapshot),
    [missionState, activitySnapshot]
  );

  const claimedCount = resolvedMissions.filter((m) => m.isClaimed).length;
  const allMissionsClaimed =
    resolvedMissions.length === DAILY_MISSION_SLOTS && claimedCount === DAILY_MISSION_SLOTS;
  const hasUnclaimedMission = resolvedMissions.some((m) => !m.isClaimed);

  const handleManualStep = (missionId: string) => {
    updateMissionState((prev) => incrementManualMissionProgress(prev, missionId));
  };

  const handleClaimMission = (missionId: string) => {
    let awarded = 0;
    updateMissionState((prev) => {
      const res = claimMissionReward(prev, missionId, activitySnapshot);
      awarded = res.xpAwarded;
      return res.state;
    });
    if (awarded > 0) {
      setMissionBanner(`Misi selesai! +${awarded} XP ditambahkan ke Pangkat Astronot.`);
    }
  };

  const handleClaimBonus = () => {
    let awarded = 0;
    updateMissionState((prev) => {
      const res = claimAllMissionsBonus(prev, activitySnapshot);
      awarded = res.xpAwarded;
      return res.state;
    });
    if (awarded > 0) {
      setMissionBanner(`Bonus Lengkap 4/4 Misi Harian! +${awarded} XP berhasil diklaim.`);
    }
  };

  const handleSwapMission = (missionId: string) => {
    updateMissionState((prev) => swapSingleMission(prev, missionId));
    setMissionBanner('Misi diganti dengan tantangan baru!');
  };

  const handleRerollAll = () => {
    updateMissionState((prev) => rerollUnclaimedMissions(prev));
    setMissionBanner('Set misi harian berhasil diacak ulang!');
  };

  const handleOpenPortalsWithTracking = () => {
    updateMissionState((prev) => ({
      ...prev,
      portalVisitsToday: prev.portalVisitsToday + 1,
    }));
    onOpenPortalsAsas();
  };

  const handleOpenWardrobeWithTracking = () => {
    updateMissionState((prev) => ({
      ...prev,
      wardrobeVisitsToday: prev.wardrobeVisitsToday + 1,
    }));
    onOpenWardrobe();
  };

  const totalQuizPoints = useMemo(
    () => userHistory.reduce((sum, rec) => sum + (rec.points || 0), 0),
    [userHistory]
  );

  const rankInfo = useMemo(
    () =>
      calculateAstronautRank(
        userHistory.length,
        totalQuizPoints,
        focusSessions,
        0,
        missionState.totalClaimedXp
      ),
    [userHistory.length, totalQuizPoints, focusSessions, missionState.totalClaimedXp]
  );

  const totalDurationSec = selectedPreset.minutes * 60;
  const elapsedRatio =
    totalDurationSec > 0 ? (totalDurationSec - secondsLeft) / totalDurationSec : 0;
  const ringRadius = 64;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference * (1 - elapsedRatio);

  return (
    <div id="cosmic-study-station" className="pt-4 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-sky-400/20 pb-4">
        <div>
          <p className="text-xs font-semibold text-sky-300 tracking-wide">
            Stasiun Fokus &amp; Sistem Misi Belajar Harian
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
            Timer Fokus Pomodoro &amp; Pangkat Astronot
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          Misi harian berganti otomatis setiap hari — selesaikan &amp; klaim XP untuk naik pangkat
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Interactive Cosmic Focus Timer + Ambient Sound */}
        <div className="lg:col-span-5 hero-glow-card holo-top-beam p-6 sm:p-7 rounded-3xl flex flex-col justify-between space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-bold text-white">Timer Fokus Belajar</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedPreset.desc} · +100 XP setiap sesi selesai
              </p>
            </div>
            <button
              type="button"
              onClick={toggleAmbientAudio}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                ambientOn
                  ? 'bg-sky-500/25 border-sky-400/60 text-sky-100 shadow-[0_0_18px_rgba(56,189,248,0.28)]'
                  : 'bg-slate-900/80 border-sky-400/25 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {ambientOn ? 'Suara Kosmik: Aktif' : 'Suara Kosmik: Mati'}
            </button>
          </div>

          {/* Preset Selector */}
          <div className="grid grid-cols-4 gap-2">
            {FOCUS_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold transition border ${
                  selectedPreset.id === preset.id
                    ? 'bg-sky-500/25 border-sky-400/60 text-sky-100'
                    : 'bg-slate-900/75 border-sky-400/15 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Orbital Circular Timer Display */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 148 148">
                <circle
                  cx="74"
                  cy="74"
                  r={ringRadius}
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.14)"
                  strokeWidth="8"
                />
                <circle
                  cx="74"
                  cy="74"
                  r={ringRadius}
                  fill="none"
                  stroke="url(#cosmic-timer-grad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringDashOffset}
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="cosmic-timer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#2dd4bf" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span
                  id="cosmic-timer-display"
                  className="font-hud text-3xl font-bold text-white tabular-nums tracking-tight"
                >
                  {formatCountdownMMSS(secondsLeft)}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-sky-300 mt-1">
                  {isRunning ? 'Fokus Aktif' : sessionJustFinished ? 'Sesi Selesai!' : 'Siap Mulai'}
                </span>
              </div>
            </div>

            <div className="space-y-3 w-full sm:w-auto flex-1">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (secondsLeft === 0) {
                      setSecondsLeft(selectedPreset.minutes * 60);
                    }
                    setSessionJustFinished(false);
                    setIsRunning((r) => !r);
                  }}
                  className="btn-gold py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap"
                >
                  {isRunning ? 'Jeda Timer' : 'Mulai Fokus'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-3 px-4 rounded-xl bg-slate-800/85 hover:bg-slate-700 border border-sky-400/30 text-sky-100 text-xs sm:text-sm font-bold transition whitespace-nowrap"
                >
                  Reset
                </button>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-slate-900/75 border border-sky-400/20 flex items-center justify-between text-xs">
                <span className="text-slate-400">Sesi Fokus Selesai</span>
                <span className="font-hud font-bold text-emerald-300 tabular-nums">
                  {focusSessions} Sesi
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-sky-400/15">
            <button
              type="button"
              onClick={handleOpenPortalsWithTracking}
              className="py-2.5 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/40 text-sky-100 text-xs font-bold transition whitespace-nowrap"
            >
              Buka Portal ASAS XII →
            </button>
            <button
              type="button"
              onClick={handleOpenWardrobeWithTracking}
              className="py-2.5 px-3 rounded-xl bg-slate-800/85 hover:bg-slate-700 border border-sky-400/25 text-slate-200 text-xs font-bold transition whitespace-nowrap"
            >
              Ganti Avatar
            </button>
          </div>
        </div>

        {/* Right: Astronaut Rank Progress & Dynamic Rotating Daily Mission System */}
        <div className="lg:col-span-7 hero-glow-card holo-top-beam p-6 sm:p-7 rounded-3xl flex flex-col justify-between space-y-5">
          {/* Rank Header */}
          <div className="space-y-3.5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-sky-300">
                  Pangkat Astronot Level {rankInfo.level}
                </p>
                <h3
                  className="font-display text-2xl font-bold mt-0.5"
                  style={{ color: rankInfo.accentColor }}
                >
                  {rankInfo.title}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/35 text-right">
                  <p className="text-[10px] font-semibold text-amber-200 uppercase tracking-wider">
                    Streak Harian
                  </p>
                  <p
                    data-testid="mission-streak-count"
                    className="font-hud text-sm font-bold text-amber-300 tabular-nums"
                  >
                    {missionState.streakDays} Hari
                  </p>
                </div>
                <div className="text-right">
                  <p
                    data-testid="astronaut-xp-value"
                    className="font-hud text-lg font-bold text-white tabular-nums"
                  >
                    {rankInfo.xp} XP
                  </p>
                  <p className="text-[11px] text-slate-400 tabular-nums">
                    Target berikut: {rankInfo.nextRankXp} XP
                  </p>
                </div>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-2.5 w-full rounded-full bg-slate-900/90 border border-sky-400/25 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-teal-300 transition-all duration-500"
                  style={{ width: `${Math.max(6, rankInfo.progressPercent)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 tabular-nums">
                <span>Progres Pangkat: {rankInfo.progressPercent}%</span>
                <span>
                  {userHistory.length} Kuis · {focusSessions} Fokus · +{missionState.totalClaimedXp}{' '}
                  XP Misi
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Daily Missions System */}
          <div className="space-y-3 pt-3 border-t border-sky-400/20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Misi Belajar Harian ({claimedCount}/{DAILY_MISSION_SLOTS} Selesai)
                </h4>
                <p className="text-[11px] text-slate-400 tabular-nums">
                  Rotasi otomatis harian · Reset dalam {resetCountdown}
                </p>
              </div>
              <button
                type="button"
                id="btn-reroll-missions"
                onClick={handleRerollAll}
                disabled={missionState.rerollsRemaining <= 0 || !hasUnclaimedMission}
                className="px-3 py-1.5 rounded-xl border border-sky-400/35 bg-sky-500/15 hover:bg-sky-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-sky-100 transition whitespace-nowrap"
              >
                Acak Misi ({missionState.rerollsRemaining}x)
              </button>
            </div>

            {missionBanner && (
              <div
                role="status"
                className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-xs font-semibold text-emerald-200"
              >
                {missionBanner}
              </div>
            )}

            <div data-testid="daily-missions-list" className="space-y-2.5">
              {resolvedMissions.map((mission) => {
                const catMeta = CATEGORY_META[mission.category];
                const isManual = mission.trackingType === 'manual';

                return (
                  <div
                    key={mission.id}
                    data-testid={`mission-card-${mission.id}`}
                    className={`p-3.5 rounded-2xl border transition ${
                      mission.isClaimed
                        ? 'bg-emerald-500/10 border-emerald-400/35'
                        : mission.isCompleted
                        ? 'bg-sky-500/15 border-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.16)]'
                        : 'bg-slate-900/75 border-sky-400/15 hover:border-sky-400/35'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${catMeta.colorClass}`}
                          >
                            {catMeta.label}
                          </span>
                          <span
                            className={`text-[10px] font-semibold ${DIFFICULTY_COLOR[mission.difficulty]}`}
                          >
                            {mission.difficulty}
                          </span>
                          <span className="font-hud text-[11px] font-bold text-sky-300 tabular-nums">
                            +{mission.xpReward} XP
                          </span>
                        </div>

                        <p
                          className={`text-xs sm:text-sm font-bold ${
                            mission.isClaimed ? 'line-through text-emerald-200/80' : 'text-white'
                          }`}
                        >
                          {mission.title}
                        </p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {mission.description}
                        </p>

                        {/* Mission Progress Bar */}
                        <div className="flex items-center gap-2.5 pt-0.5">
                          <div className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                mission.isClaimed
                                  ? 'bg-emerald-400'
                                  : mission.isCompleted
                                  ? 'bg-amber-300'
                                  : 'bg-sky-400'
                              }`}
                              style={{ width: `${mission.progressPercent}%` }}
                            />
                          </div>
                          <span className="font-hud text-[11px] text-slate-300 tabular-nums shrink-0">
                            {mission.progress}/{mission.target} {mission.unit}
                          </span>
                        </div>
                      </div>

                      {/* Mission Action Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {mission.isClaimed ? (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold whitespace-nowrap">
                            ✓ Terklaim
                          </span>
                        ) : mission.isCompleted ? (
                          <button
                            type="button"
                            onClick={() => handleClaimMission(mission.id)}
                            aria-label={`Klaim ${mission.xpReward} XP untuk ${mission.title}`}
                            className="btn-gold px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap"
                          >
                            Klaim +{mission.xpReward} XP
                          </button>
                        ) : isManual ? (
                          <button
                            type="button"
                            onClick={() => handleManualStep(mission.id)}
                            aria-label={`Tambah progres untuk ${mission.title}`}
                            className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/40 text-sky-100 text-xs font-bold transition whitespace-nowrap"
                          >
                            {mission.target > 1 ? '+1 Progres' : 'Tandai Selesai'}
                          </button>
                        ) : (
                          <span className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                            Otomatis
                          </span>
                        )}

                        {!mission.isClaimed && (
                          <button
                            type="button"
                            onClick={() => handleSwapMission(mission.id)}
                            disabled={missionState.rerollsRemaining <= 0}
                            aria-label={`Ganti misi ${mission.title}`}
                            title="Ganti misi ini dengan tantangan lain"
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800/85 hover:bg-slate-700 disabled:opacity-35 disabled:cursor-not-allowed border border-sky-400/20 text-slate-300 hover:text-white text-[11px] font-semibold transition whitespace-nowrap"
                          >
                            Ganti
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* All-Complete Daily Bonus Bar */}
            <div
              className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                missionState.bonusClaimed
                  ? 'bg-emerald-500/10 border-emerald-400/35'
                  : allMissionsClaimed
                  ? 'bg-amber-500/15 border-amber-400/50'
                  : 'bg-slate-900/60 border-sky-400/15'
              }`}
            >
              <div>
                <p className="text-xs font-bold text-white">
                  Bonus Tuntas Semua Misi Harian (+{ALL_MISSIONS_BONUS_XP} XP)
                </p>
                <p className="text-[11px] text-slate-400">
                  {missionState.bonusClaimed
                    ? 'Bonus harian hari ini sudah berhasil diklaim!'
                    : allMissionsClaimed
                    ? 'Semua 4 misi harian tuntas! Klaim bonus XP sekarang.'
                    : `Selesaikan dan klaim ${DAILY_MISSION_SLOTS - claimedCount} misi lagi untuk membuka bonus.`}
                </p>
              </div>
              {missionState.bonusClaimed ? (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold">
                  ✓ Bonus Terklaim
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleClaimBonus}
                  disabled={!allMissionsClaimed}
                  className="px-3.5 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/35 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-400/45 text-amber-200 text-xs font-bold transition whitespace-nowrap"
                >
                  Klaim +{ALL_MISSIONS_BONUS_XP} XP
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
