import React, { useEffect, useState } from 'react';
import {
  normalizeParticipantUsername,
  validatePasswordOnlyRegistration,
  validateUsernamePasswordLogin,
  type ParticipantTargetTrack,
  type SavedSkdSummary,
} from '../utils/participantAuth';
import { compressDataUrlImage } from '../utils/imageHelper';

interface ParticipantAuthModalProps {
  open: boolean;
  initialMode?: 'register' | 'login' | 'profile';
  userEmail: string | null;
  playerName: string;
  username?: string;
  photoUrl?: string;
  school: string;
  phone: string;
  targetTrack: ParticipantTargetTrack;
  targetCampus: string;
  savedSkdSummary?: SavedSkdSummary;
  onPasswordRegister: (params: {
    displayName: string;
    username: string;
    password: string;
    school: string;
    phone: string;
    targetTrack: ParticipantTargetTrack;
    targetCampus: string;
    photoDataUrl?: string;
  }) => Promise<void>;
  onPasswordLogin: (params: { identifier: string; password: string }) => Promise<void>;
  onGoogleLogin?: () => Promise<void>;
  onSaveProfile: (profile: {
    displayName: string;
    school: string;
    phone: string;
    targetTrack: ParticipantTargetTrack;
    targetCampus: string;
    photoDataUrl?: string;
  }) => Promise<void>;
  onOpenSkdAnalysis?: () => void;
  onLogout: () => Promise<void>;
  onClose: () => void;
}

export const ParticipantAuthModal: React.FC<ParticipantAuthModalProps> = ({
  open,
  initialMode = 'register',
  userEmail,
  playerName,
  username = '',
  photoUrl = '',
  school,
  phone,
  targetTrack,
  targetCampus,
  savedSkdSummary,
  onPasswordRegister,
  onPasswordLogin,
  onGoogleLogin,
  onSaveProfile,
  onOpenSkdAnalysis,
  onLogout,
  onClose,
}) => {
  const [tab, setTab] = useState<'register' | 'login' | 'profile'>(
    userEmail ? 'profile' : initialMode === 'profile' ? 'register' : initialMode
  );

  // Non-Google Registration state
  const [regName, setRegName] = useState(playerName || '');
  const [regUsername, setRegUsername] = useState('');
  const [regUsernameEdited, setRegUsernameEdited] = useState(false);
  const [regSchool, setRegSchool] = useState(school || '');
  const [regPhone, setRegPhone] = useState(phone || '');
  const [regTrack, setRegTrack] = useState<ParticipantTargetTrack>(targetTrack || 'utbk');
  const [regTargetCampus, setRegTargetCampus] = useState(targetCampus || '');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regPhotoDataUrl, setRegPhotoDataUrl] = useState('');

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Profile editor state
  const [profName, setProfName] = useState(playerName || '');
  const [profSchool, setProfSchool] = useState(school || '');
  const [profPhone, setProfPhone] = useState(phone || '');
  const [profTrack, setProfTrack] = useState<ParticipantTargetTrack>(targetTrack || 'utbk');
  const [profTargetCampus, setProfTargetCampus] = useState(targetCampus || '');
  const [profPhotoDataUrl, setProfPhotoDataUrl] = useState('');

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    setErrorMsg('');
    setInfoMsg('');
    setRegPhotoDataUrl('');
    setProfPhotoDataUrl('');
    if (userEmail) {
      setTab('profile');
      setProfName(playerName || '');
      setProfSchool(school || '');
      setProfPhone(phone || '');
      setProfTrack(targetTrack || 'utbk');
      setProfTargetCampus(targetCampus || '');
    } else {
      setTab(initialMode === 'login' ? 'login' : 'register');
      if (playerName && !regName) {
        setRegName(playerName);
        if (!regUsernameEdited) {
          setRegUsername(normalizeParticipantUsername(playerName));
        }
      }
    }
  }, [open, userEmail, initialMode, playerName, school, phone, targetTrack, targetCampus]);

  if (!open) return null;

  const handlePhotoFileSelected = async (
    file: File | undefined,
    setter: (dataUrl: string) => void
  ) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Pilih file gambar (JPG, PNG, atau WEBP) untuk foto profil.');
      return;
    }
    try {
      const rawDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Gagal membaca file foto.'));
        reader.readAsDataURL(file);
      });
      const compressed = await compressDataUrlImage(rawDataUrl, 400, 0.85);
      setter(compressed);
      setErrorMsg('');
    } catch {
      setErrorMsg('Gagal memproses foto profil. Coba pilih gambar lain.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    const effectiveUsername = normalizeParticipantUsername(regUsername || regName);
    const check = validatePasswordOnlyRegistration({
      displayName: regName,
      username: effectiveUsername,
      password: regPassword,
      confirmPassword: regConfirm,
    });
    if (!check.valid) {
      setErrorMsg(check.error || 'Data pendaftaran belum lengkap.');
      return;
    }

    setBusy(true);
    try {
      await onPasswordRegister({
        displayName: regName.trim(),
        username: effectiveUsername,
        password: regPassword,
        school: regSchool.trim(),
        phone: regPhone.trim(),
        targetTrack: regTrack,
        targetCampus: regTargetCampus.trim(),
        ...(regPhotoDataUrl ? { photoDataUrl: regPhotoDataUrl } : {}),
      });
      setInfoMsg('Akun berhasil dibuat & disimpan ke Database Peserta.');
      setRegPassword('');
      setRegConfirm('');
      setRegPhotoDataUrl('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal mendaftarkan akun peserta.');
    } finally {
      setBusy(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    const check = validateUsernamePasswordLogin({
      identifier: loginIdentifier,
      password: loginPassword,
    });
    if (!check.valid) {
      setErrorMsg(check.error || 'Nama/Username dan kata sandi belum valid.');
      return;
    }

    setBusy(true);
    try {
      await onPasswordLogin({
        identifier: loginIdentifier.trim(),
        password: loginPassword,
      });
      setLoginPassword('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Nama/Username atau kata sandi salah.');
    } finally {
      setBusy(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    if (profName.trim().length < 2) {
      setErrorMsg('Nama lengkap peserta minimal 2 karakter.');
      return;
    }
    setBusy(true);
    try {
      await onSaveProfile({
        displayName: profName.trim(),
        school: profSchool.trim(),
        phone: profPhone.trim(),
        targetTrack: profTrack,
        targetCampus: profTargetCampus.trim(),
        ...(profPhotoDataUrl ? { photoDataUrl: profPhotoDataUrl } : {}),
      });
      setProfPhotoDataUrl('');
      setInfoMsg('Profil peserta & foto berhasil diperbarui di Database Peserta.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan perubahan profil.');
    } finally {
      setBusy(false);
    }
  };

  const activePhotoPreview = profPhotoDataUrl || photoUrl;

  return (
    <div
      id="modal-participant-auth"
      role="dialog"
      aria-modal="true"
      aria-labelledby="participant-auth-title"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="hero-glow-card holo-top-beam w-full max-w-lg rounded-3xl p-6 sm:p-7 space-y-5 border border-sky-400/35 my-auto max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-sky-400/20 pb-4">
          <div>
            <p className="text-xs font-bold text-sky-300">
              Akun Peserta Tanpa Google · Database Peserta
            </p>
            <h2
              id="participant-auth-title"
              className="font-display text-xl sm:text-2xl font-bold text-white mt-0.5"
            >
              {userEmail
                ? 'Profil & Database Peserta'
                : tab === 'register'
                  ? 'Buat Akun Peserta Baru'
                  : 'Masuk Akun Peserta'}
            </h2>
          </div>
          <button
            type="button"
            id="btn-close-participant-auth"
            onClick={onClose}
            aria-label="Tutup modal akun peserta"
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-sm shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Status messages */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/45 text-rose-200 text-xs leading-relaxed">
            {errorMsg}
          </div>
        )}
        {infoMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/45 text-emerald-200 text-xs leading-relaxed">
            {infoMsg}
          </div>
        )}

        {/* Tabs when signed out */}
        {!userEmail ? (
          <>
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-sky-400/20">
              <button
                type="button"
                id="tab-auth-register"
                onClick={() => {
                  setTab('register');
                  setErrorMsg('');
                }}
                className={`py-2.5 rounded-xl text-xs font-bold transition ${
                  tab === 'register'
                    ? 'btn-gold text-slate-950'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Daftar (Nama &amp; Sandi)
              </button>
              <button
                type="button"
                id="tab-auth-login"
                onClick={() => {
                  setTab('login');
                  setErrorMsg('');
                }}
                className={`py-2.5 rounded-xl text-xs font-bold transition ${
                  tab === 'login'
                    ? 'btn-gold text-slate-950'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Masuk Akun
              </button>
            </div>

            {tab === 'register' ? (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* Optional Profile Photo Upload */}
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-900/80 border border-sky-400/20">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-sky-400/35 overflow-hidden flex items-center justify-center shrink-0">
                    {regPhotoDataUrl ? (
                      <img
                        src={regPhotoDataUrl}
                        alt="Preview foto peserta"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-slate-400">Foto</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs font-bold text-slate-200">Foto Profil Peserta (Opsional)</p>
                    <p className="text-[11px] text-slate-400">
                      Bisa diunggah sekarang atau diubah Admin di Database Peserta.
                    </p>
                  </div>
                  <label className="cursor-pointer px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/40 text-sky-100 text-xs font-bold whitespace-nowrap transition">
                    Pilih Foto
                    <input
                      id="auth-reg-photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoFileSelected(e.target.files?.[0], setRegPhotoDataUrl)}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="auth-reg-name"
                      className="block text-[11px] font-bold text-slate-200 mb-1"
                    >
                      Nama Lengkap *
                    </label>
                    <input
                      id="auth-reg-name"
                      type="text"
                      required
                      maxLength={60}
                      value={regName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRegName(val);
                        if (!regUsernameEdited) {
                          setRegUsername(normalizeParticipantUsername(val));
                        }
                      }}
                      placeholder="Contoh: Aisyah Putri"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-sky-400/25 focus:border-sky-400 outline-none text-xs sm:text-sm text-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="auth-reg-username"
                      className="block text-[11px] font-bold text-slate-200 mb-1"
                    >
                      Username Login *
                    </label>
                    <input
                      id="auth-reg-username"
                      type="text"
                      required
                      maxLength={32}
                      value={regUsername}
                      onChange={(e) => {
                        setRegUsernameEdited(true);
                        setRegUsername(normalizeParticipantUsername(e.target.value));
                      }}
                      placeholder="aisyah.putri"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-sky-400/25 focus:border-sky-400 outline-none text-xs sm:text-sm text-sky-200 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="auth-reg-school"
                      className="block text-[11px] font-bold text-slate-200 mb-1"
                    >
                      Asal Sekolah / Instansi
                    </label>
                    <input
                      id="auth-reg-school"
                      type="text"
                      maxLength={120}
                      value={regSchool}
                      onChange={(e) => setRegSchool(e.target.value)}
                      placeholder="Contoh: MAN IC / SMAN 1"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-sky-400/25 focus:border-sky-400 outline-none text-xs sm:text-sm text-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="auth-reg-phone"
                      className="block text-[11px] font-bold text-slate-200 mb-1"
                    >
                      No. WhatsApp (Opsional)
                    </label>
                    <input
                      id="auth-reg-phone"
                      type="tel"
                      maxLength={24}
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-sky-400/25 focus:border-sky-400 outline-none text-xs sm:text-sm text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="auth-reg-track"
                      className="block text-[11px] font-bold text-slate-200 mb-1"
                    >
                      Jalur Persiapan Utama
                    </label>
                    <select
                      id="auth-reg-track"
                      value={regTrack}
                      onChange={(e) => setRegTrack(e.target.value as ParticipantTargetTrack)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-sky-400/25 focus:border-sky-400 outline-none text-xs sm:text-sm text-white"
                    >
                      <option value="utbk">UTBK-SNBT (PTN se-Indonesia)</option>
                      <option value="kedinasan">Sekolah Kedinasan (SKD)</option>
                      <option value="both">UTBK + Kedinasan Sekaligus</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="auth-reg-target"
                      className="block text-[11px] font-bold text-slate-200 mb-1"
                    >
                      Target Kampus / Kedinasan
                    </label>
                    <input
                      id="auth-reg-target"
                      type="text"
                      maxLength={120}
                      value={regTargetCampus}
                      onChange={(e) => setRegTargetCampus(e.target.value)}
                      placeholder="Misal: PKN STAN / Kedokteran UI"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-sky-400/25 focus:border-sky-400 outline-none text-xs sm:text-sm text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="auth-reg-password"
                      className="block text-[11px] font-bold text-slate-200 mb-1"
                    >
                      Buat Kata Sandi (Min. 4) *
                    </label>
                    <input
                      id="auth-reg-password"
                      type="password"
                      required
                      minLength={4}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-sky-400/25 focus:border-sky-400 outline-none text-xs sm:text-sm text-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="auth-reg-confirm"
                      className="block text-[11px] font-bold text-slate-200 mb-1"
                    >
                      Ulangi Kata Sandi *
                    </label>
                    <input
                      id="auth-reg-confirm"
                      type="password"
                      required
                      minLength={4}
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-sky-400/25 focus:border-sky-400 outline-none text-xs sm:text-sm text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-auth-submit-register"
                  disabled={busy}
                  className="btn-gold w-full py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm disabled:opacity-60"
                >
                  {busy ? 'Mendaftarkan Akun...' : 'Buat Akun & Simpan ke Database Peserta'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label
                    htmlFor="auth-login-identifier"
                    className="block text-[11px] font-bold text-slate-200 mb-1"
                  >
                    Nama Lengkap atau Username
                  </label>
                  <input
                    id="auth-login-identifier"
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Contoh: Aisyah Putri atau aisyah.putri"
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-900/90 border border-sky-400/25 focus:border-sky-400 outline-none text-xs sm:text-sm text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="auth-login-password"
                    className="block text-[11px] font-bold text-slate-200 mb-1"
                  >
                    Kata Sandi
                  </label>
                  <input
                    id="auth-login-password"
                    type="password"
                    required
                    minLength={4}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-900/90 border border-sky-400/25 focus:border-sky-400 outline-none text-xs sm:text-sm text-white"
                  />
                </div>
                <button
                  type="submit"
                  id="btn-auth-submit-login"
                  disabled={busy}
                  className="btn-gold w-full py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm disabled:opacity-60"
                >
                  {busy ? 'Memeriksa Akun...' : 'Masuk dengan Nama & Kata Sandi'}
                </button>
              </form>
            )}

            {onGoogleLogin && (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">Opsional jika ingin pakai Google:</span>
                <button
                  type="button"
                  id="btn-auth-google-signin"
                  disabled={busy}
                  onClick={async () => {
                    setErrorMsg('');
                    setBusy(true);
                    try {
                      await onGoogleLogin();
                    } catch {
                      setErrorMsg('Login Google dibatalkan.');
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-semibold text-[11px] transition disabled:opacity-60"
                >
                  Masuk via Google
                </button>
              </div>
            )}
          </>
        ) : (
          /* Signed-in Profile & Database Peserta Editor */
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-emerald-400/40 overflow-hidden flex items-center justify-center shrink-0">
                  {activePhotoPreview ? (
                    <img
                      src={activePhotoPreview}
                      alt={profName || playerName || 'Foto peserta'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-emerald-300">
                      {(profName || playerName || 'P').slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-emerald-300">Tersimpan di Database Peserta</p>
                  <p className="text-slate-300 truncate mt-0.5">
                    {username ? `@${username}` : userEmail}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/40 text-sky-100 font-bold text-xs">
                  Ganti Foto
                  <input
                    id="prof-photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoFileSelected(e.target.files?.[0], setProfPhotoDataUrl)}
                  />
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    await onLogout();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 font-bold text-xs shrink-0"
                >
                  Keluar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="prof-name" className="block text-[11px] font-bold text-slate-200 mb-1">
                  Nama Lengkap Peserta *
                </label>
                <input
                  id="prof-name"
                  type="text"
                  required
                  maxLength={60}
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-sky-400/25 focus:border-sky-400 outline-none text-xs sm:text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="prof-school" className="block text-[11px] font-bold text-slate-200 mb-1">
                  Asal Sekolah / Instansi
                </label>
                <input
                  id="prof-school"
                  type="text"
                  maxLength={120}
                  value={profSchool}
                  onChange={(e) => setProfSchool(e.target.value)}
                  placeholder="Contoh: MAN IC Jambi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-sky-400/25 focus:border-sky-400 outline-none text-xs sm:text-sm text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="prof-phone" className="block text-[11px] font-bold text-slate-200 mb-1">
                  No. WhatsApp / HP
                </label>
                <input
                  id="prof-phone"
                  type="tel"
                  maxLength={24}
                  value={profPhone}
                  onChange={(e) => setProfPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-sky-400/25 focus:border-sky-400 outline-none text-xs sm:text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="prof-track" className="block text-[11px] font-bold text-slate-200 mb-1">
                  Jalur Seleksi Target
                </label>
                <select
                  id="prof-track"
                  value={profTrack}
                  onChange={(e) => setProfTrack(e.target.value as ParticipantTargetTrack)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-sky-400/25 focus:border-sky-400 outline-none text-xs sm:text-sm text-white"
                >
                  <option value="utbk">UTBK-SNBT (PTN se-Indonesia)</option>
                  <option value="kedinasan">Sekolah Kedinasan (SKD)</option>
                  <option value="both">UTBK + Kedinasan Sekaligus</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="prof-target-campus"
                className="block text-[11px] font-bold text-slate-200 mb-1"
              >
                Target Universitas / Sekolah Kedinasan Impian
              </label>
              <input
                id="prof-target-campus"
                type="text"
                maxLength={120}
                value={profTargetCampus}
                onChange={(e) => setProfTargetCampus(e.target.value)}
                placeholder="Misal: PKN STAN / Polstat STIS / Teknik Informatika ITB"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-sky-400/25 focus:border-sky-400 outline-none text-xs sm:text-sm text-white"
              />
            </div>

            {/* Saved SKD Kedinasan Summary Card inside Profile DB */}
            <div className="p-4 rounded-2xl bg-purple-950/35 border border-purple-400/30 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold text-purple-200">
                  Skor SKD Kedinasan Tersimpan di Database
                </p>
                {onOpenSkdAnalysis && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSkdAnalysis();
                    }}
                    className="text-[11px] font-bold text-teal-300 hover:underline"
                  >
                    Analisis Skor SKD →
                  </button>
                )}
              </div>
              {savedSkdSummary ? (
                <div className="text-xs text-slate-200 space-y-1 tabular-nums">
                  <p>
                    Total <strong className="text-amber-300">{savedSkdSummary.total}/550</strong> (TWK{' '}
                    {savedSkdSummary.twk} · TIU {savedSkdSummary.tiu} · TKP {savedSkdSummary.tkp}){' '}
                    <span className={savedSkdSummary.passedAllPg ? 'text-emerald-300' : 'text-rose-300'}>
                      · {savedSkdSummary.passedAllPg ? 'Lolos PG BKN' : 'Belum Lolos PG'}
                    </span>
                  </p>
                  {savedSkdSummary.recommendedSchool && (
                    <p className="text-[11px] text-purple-200">
                      Kecocokan Utama: <strong>{savedSkdSummary.recommendedSchool}</strong>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Belum ada skor SKD tersimpan. Buka menu Analisis Kedinasan untuk menghitung &amp; menyimpan skor SKD Anda.
                </p>
              )}
            </div>

            <button
              type="submit"
              id="btn-save-participant-profile"
              disabled={busy}
              className="btn-gold w-full py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm disabled:opacity-60"
            >
              {busy ? 'Menyimpan ke Database...' : 'Simpan Perubahan ke Database Peserta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
