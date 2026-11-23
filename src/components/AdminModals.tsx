import React, { useState } from 'react';

interface AdminGateModalProps {
  open: boolean;
  systemPasswordPlain: string;
  googleAdminEmail: string | null;
  isGoogleAdminVerified: boolean;
  onVerify: (inputPassword: string) => void;
  onGoogleAdminLogin: () => Promise<void>;
  onCopyPassword: () => void;
  onClose: () => void;
}

export const AdminGateModal: React.FC<AdminGateModalProps> = ({
  open,
  googleAdminEmail,
  isGoogleAdminVerified,
  onVerify,
  onGoogleAdminLogin,
  onClose,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify(passwordInput);
  };

  const handleGoogleClick = async () => {
    setSigningIn(true);
    try {
      await onGoogleAdminLogin();
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div
      id="modal-admin-gate"
      role="dialog"
      aria-modal="true"
      aria-label="Verifikasi Portal Admin"
      className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4"
    >
      <form
        onSubmit={handleSubmit}
        className="glass-card w-full max-w-md rounded-3xl p-6 border border-amber-500/40 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-amber-300 flex items-center gap-2">
            <span aria-hidden="true">🛡️</span> Verifikasi Portal Admin
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal admin"
            className="text-slate-400 hover:text-white font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Portal Admin dilindungi <strong>Firebase Auth + Firestore Rules</strong> serta enkripsi{' '}
          <strong>SHA-256</strong>. Login dengan Akun Google Admin untuk mengaktifkan sinkronisasi
          Database Cloud permanen.
        </p>

        <div className="p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-400/35 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold text-indigo-200">
              ☁️ Akses Database Cloud (Disarankan)
            </span>
            {isGoogleAdminVerified && googleAdminEmail && (
              <span className="text-[10px] font-bold text-emerald-300 truncate max-w-[160px]">
                ✓ {googleAdminEmail}
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={signingIn}
            onClick={handleGoogleClick}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 font-extrabold text-xs flex items-center justify-center gap-2 transition"
          >
            <span aria-hidden="true">🔐</span>
            {signingIn
              ? 'Menghubungkan ke Google...'
              : isGoogleAdminVerified
                ? 'Masuk Studio Admin (Google Terverifikasi)'
                : 'Login dengan Akun Google Admin'}
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
          <div className="h-px flex-1 bg-slate-800" />
          <span>ATAU PASSWORD CADANGAN (SHA-256)</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <div>
          <label
            htmlFor="admin-password-input"
            className="block text-xs font-bold text-slate-300 mb-1.5"
          >
            Masukkan Password Admin Cadangan:
          </label>
          <input
            type="password"
            id="admin-password-input"
            autoComplete="current-password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Masukkan password cadangan..."
            className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 focus:border-amber-400 outline-none text-sm text-white font-bold"
          />
          <p className="text-[11px] text-slate-400 mt-1.5">
            Demi keamanan, password cadangan tidak disimpan dalam teks biasa dan hanya dapat dibuat
            ulang setelah login Google Admin.
          </p>
        </div>

        <button
          type="submit"
          className="btn-3d w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-extrabold text-sm"
        >
          🔓 Masuk dengan Password Cadangan
        </button>
      </form>
    </div>
  );
};

interface AdminConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AdminConfirmModal: React.FC<AdminConfirmModalProps> = ({
  open,
  title,
  description,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <div
      id="modal-admin-confirm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4"
    >
      <div className="glass-card w-full max-w-sm rounded-3xl p-6 border border-rose-500/40 space-y-4 text-center">
        <div className="text-3xl" aria-hidden="true">⚠️</div>
        <h3 className="text-base font-extrabold text-white">{title}</h3>
        <p className="text-xs text-slate-300 leading-relaxed">{description}</p>
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-extrabold text-white"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
};

interface GoogleScriptModalProps {
  open: boolean;
  systemPasswordPlain: string;
  webhookUrl: string;
  onRegeneratePassword: () => void;
  onSaveWebhook: (url: string) => void;
  onTestWebhook: (url: string) => void;
  onClose: () => void;
}

export const GoogleScriptModal: React.FC<GoogleScriptModalProps> = ({
  open,
  systemPasswordPlain,
  webhookUrl,
  onRegeneratePassword,
  onSaveWebhook,
  onTestWebhook,
  onClose,
}) => {
  const [urlInput, setUrlInput] = useState(webhookUrl);

  React.useEffect(() => {
    setUrlInput(webhookUrl);
  }, [webhookUrl]);

  if (!open) return null;

  return (
    <div
      id="modal-google-script"
      role="dialog"
      aria-modal="true"
      aria-label="Integrasi Google Sheets & Keamanan Sistem"
      className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4"
    >
      <div className="glass-card w-full max-w-3xl rounded-3xl p-6 border border-sky-500/30 max-h-[90vh] overflow-y-auto custom-scrollbar space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
            <span aria-hidden="true">🔗</span> Integrasi Google Sheets &amp; Keamanan Sistem
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
          >
            Tutup ✕
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-amber-300">Password Admin Sistem Aktif:</p>
            <p className="text-base font-mono font-extrabold text-white mt-0.5">
              {systemPasswordPlain}
            </p>
          </div>
          <button
            type="button"
            onClick={onRegeneratePassword}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs whitespace-nowrap"
          >
            🔄 Buat Password Baru
          </button>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="google-webhook-input"
            className="block text-xs font-bold text-slate-300"
          >
            URL Web App Google Apps Script (Untuk Auto-Save &amp; Sinkronisasi Nilai ke Google
            Sheets):
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              id="google-webhook-input"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onSaveWebhook(urlInput)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs whitespace-nowrap"
              >
                Simpan URL
              </button>
              <button
                type="button"
                onClick={() => onTestWebhook(urlInput)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs whitespace-nowrap"
              >
                🔄 Tes &amp; Tarik Data
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Tempelkan URL berakhiran <code className="text-sky-300">/exec</code> dari hasil Deploy
            Apps Script Anda.
          </p>
        </div>
      </div>
    </div>
  );
};
