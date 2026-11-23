import React, { useEffect, useState } from 'react';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
import type { HistoryRecord, QuizCategory, QuizQuestion, QuizRoom } from '../types/quiz';
import type { LiveTeachingSession, ParticipantRecord, SiteSettings } from '../firebase';
import type { SmaGrade, StudyModule, TkaTrack } from '../data/academicCatalog';
import {
  estimateQuestionCount,
  extractPrintableTextFromBinary,
  formatTemplateContent,
  parseQuizCSV,
  parseQuizExcelRows,
  parseQuizJSON,
  parseQuizText,
  stripHtmlAndXmlToText,
  stripRtfToText,
} from '../utils/quizLogic';
import {
  attachImagesToQuestions,
  autoUploadQuestionImages,
  compressDataUrlImage,
  extractHtmlImagesAndPlaceholders,
  uploadQuestionImageToServer,
  type ExtractedQuestionWithBBox,
} from '../utils/imageHelper';
import {
  extractImageFileRegionsToQuestions,
  extractPdfQuestionImages,
} from '../utils/pdfQuestionExtractor';
import {
  buildPwaBuilderLaunchUrl,
  DEFAULT_STORE_DISTRIBUTION,
  evaluateStoreLaunchReadiness,
  generateAppleAppSiteAssociationJson,
  generateAssetLinksJson,
  generateCapacitorConfigJson,
  generateMicrosoftIdentityAssociationJson,
  generateMicrosoftStoreConfigJson,
  generateStorePublishingGuide,
  generateTwaManifestJson,
  OFFICIAL_SITE_ORIGIN,
  resolveDirectStoreLinks,
  sanitizeAppleTeamId,
  sanitizeMicrosoftStoreId,
  sanitizePackageId,
  sanitizeSha256Fingerprint,
  sanitizeStoreDistributionSettings,
  sanitizeUuidGuid,
  STORE_DEVELOPER_CONSOLES,
} from '../utils/appStoreDistribution';
import {
  INDONESIAN_MONTHS,
  composeScheduleParts,
  decomposeScheduleParts,
  getDaysInMonth,
  getQuizScheduleStatus,
  parseOpenAtInput,
  toDateTimeLocalInput,
} from '../utils/quizSchedule';

const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

interface AdminStudioViewProps {
  studioTitle: string;
  studioCategory: QuizCategory;
  studioOpenAt: string;
  studioCloseAt: string;
  studioCode: string;
  studioQuestions: QuizQuestion[];
  isPublished: boolean;
  studioRoomStatus: 'waiting' | 'started';
  history: HistoryRecord[];
  googleAdminEmail: string | null;
  isGoogleAdminVerified: boolean;
  isSyncingCloud: boolean;
  onStudioTitleChange: (val: string) => void;
  onStudioCategoryChange: (val: QuizCategory) => void;
  onStudioOpenAtChange: (val: string) => void;
  onStudioCloseAtChange: (val: string) => void;
  onGenerateNewCode: () => void;
  onStartNewRoom?: () => void;
  onCopyShareLink: () => void;
  onPublishRoom: () => void;
  onToggleRoomStart: (nextStatus: 'waiting' | 'started', targetRoom?: QuizRoom) => void;
  onEnterPreviewLobby: (targetRoom?: QuizRoom) => void;
  onUpdateQuestions: (qs: QuizQuestion[]) => void;
  onExportExcel: () => void;
  onOpenGoogleScriptModal: () => void;
  onGoogleAdminLogin: () => Promise<void>;
  onGoogleAdminLogout: () => Promise<void>;
  onSyncCloudNow: () => Promise<void>;
  onCloseStudio: () => void;
  siteSettings: SiteSettings;
  onSaveSiteSettings: (next: SiteSettings) => Promise<void>;
  participants: ParticipantRecord[];
  uploadedRooms: QuizRoom[];
  onLoadRoomToStudio: (room: QuizRoom) => void;
  onQuickToggleCloseRoom: (room: QuizRoom) => void;
  onDeleteRoom: (room: QuizRoom) => void;
  uploadedMaterials: StudyModule[];
  onSaveMaterial: (material: StudyModule) => Promise<void>;
  onDeleteMaterial: (materialId: string) => Promise<void>;
  liveSessions: LiveTeachingSession[];
  onSaveLiveSession: (session: LiveTeachingSession) => Promise<void>;
  onDeleteLiveSession: (sessionId: string) => Promise<void>;
  onRequestDeleteHistoryItem: (record: HistoryRecord) => void;
  onRequestClearAllHistory: () => void;
  onDownloadHistoryCertificate: (record: HistoryRecord) => void;
  onRequestDeleteParticipant?: (participant: ParticipantRecord) => void;
  onRequestClearAllParticipants?: () => void;
  canManageParticipantDb?: boolean;
  onAdminUpsertParticipant?: (payload: {
    uid?: string;
    displayName: string;
    username?: string;
    password?: string;
    school?: string;
    phone?: string;
    targetTrack?: 'utbk' | 'kedinasan' | 'both';
    targetCampus?: string;
    photoDataUrl?: string;
  }) => Promise<void>;
  onRefreshParticipants?: () => Promise<void>;
  onNotify: (text: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Gagal membaca file biner.'));
    reader.readAsDataURL(file);
  });
}

async function callSmartAIParser(payload: {
  text?: string;
  fileBase64?: string;
  mimeType?: string;
  fileName?: string;
  expectedCount?: number;
}): Promise<{ title?: string; questions: ExtractedQuestionWithBBox[] }> {
  const tokenRes = await fetch('/api/session-token', {
    method: 'GET',
    credentials: 'same-origin',
  });
  const tokenData = (await tokenRes.json()) as { ok?: boolean; token?: string; error?: string };
  if (!tokenRes.ok || !tokenData.token) {
    throw new Error(tokenData.error || 'Gagal memverifikasi sesi keamanan browser.');
  }

  const res = await fetch('/api/parse-quiz', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-Hafiz-Token': tokenData.token,
    },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    title?: string;
    questions?: ExtractedQuestionWithBBox[];
    error?: string;
  };
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Gagal memproses soal dengan pembaca otomatis AI.');
  }
  return {
    title: data.title,
    questions: Array.isArray(data.questions) ? data.questions : [],
  };
}

export const AdminStudioView: React.FC<AdminStudioViewProps> = ({
  studioTitle,
  studioCategory,
  studioOpenAt,
  studioCloseAt,
  studioCode,
  studioQuestions,
  isPublished,
  studioRoomStatus,
  history,
  googleAdminEmail,
  isGoogleAdminVerified,
  isSyncingCloud,
  onStudioTitleChange,
  onStudioCategoryChange,
  onStudioOpenAtChange,
  onStudioCloseAtChange,
  onGenerateNewCode,
  onStartNewRoom,
  onCopyShareLink,
  onPublishRoom,
  onToggleRoomStart,
  onEnterPreviewLobby,
  onUpdateQuestions,
  onExportExcel,
  onOpenGoogleScriptModal,
  onGoogleAdminLogin,
  onGoogleAdminLogout,
  onSyncCloudNow,
  onCloseStudio,
  siteSettings,
  onSaveSiteSettings,
  participants,
  uploadedRooms,
  onLoadRoomToStudio,
  onQuickToggleCloseRoom,
  onDeleteRoom,
  uploadedMaterials,
  onSaveMaterial,
  onDeleteMaterial,
  liveSessions,
  onSaveLiveSession,
  onDeleteLiveSession,
  onRequestDeleteHistoryItem,
  onRequestClearAllHistory,
  onDownloadHistoryCertificate,
  onRequestDeleteParticipant,
  onRequestClearAllParticipants,
  canManageParticipantDb = false,
  onAdminUpsertParticipant,
  onRefreshParticipants,
  onNotify,
}) => {
  const [siteDraft, setSiteDraft] = useState<SiteSettings>(siteSettings);
  const [savingSite, setSavingSite] = useState(false);
  const [androidSha256, setAndroidSha256] = useState<string>(() => {
    try {
      return localStorage.getItem('hafiz_android_sha256_v1') || '';
    } catch {
      return '';
    }
  });
  const [savingStoreConfig, setSavingStoreConfig] = useState(false);
  const [exportingStoreZip, setExportingStoreZip] = useState(false);

  useEffect(() => {
    setSiteDraft(siteSettings);
  }, [siteSettings]);
  const [pasteText, setPasteText] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [participantSearch, setParticipantSearch] = useState('');
  const [showAddParticipantForm, setShowAddParticipantForm] = useState(false);
  const [editingParticipantUid, setEditingParticipantUid] = useState<string | null>(null);
  const [pFormName, setPFormName] = useState('');
  const [pFormUsername, setPFormUsername] = useState('');
  const [pFormPassword, setPFormPassword] = useState('');
  const [pFormSchool, setPFormSchool] = useState('');
  const [pFormPhone, setPFormPhone] = useState('');
  const [pFormTrack, setPFormTrack] = useState<'utbk' | 'kedinasan' | 'both'>('utbk');
  const [pFormCampus, setPFormCampus] = useState('');
  const [pFormPhoto, setPFormPhoto] = useState('');
  const [savingParticipantForm, setSavingParticipantForm] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parsingStatus, setParsingStatus] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Study Material Upload Draft State
  type MaterialTarget =
    | 'utbk'
    | 'kedinasan'
    | 'tka-saintek'
    | 'tka-soshum'
    | 'sma-X'
    | 'sma-XI'
    | 'sma-XII';
  const [matTarget, setMatTarget] = useState<MaterialTarget>('utbk');
  const [matSubject, setMatSubject] = useState('');
  const [matTitle, setMatTitle] = useState('');
  const [matSummary, setMatSummary] = useState('');
  const [matKeyPointsText, setMatKeyPointsText] = useState('');
  const [matFormulasText, setMatFormulasText] = useState('');
  const [matYoutubeUrl, setMatYoutubeUrl] = useState('');
  const [matPptUrl, setMatPptUrl] = useState('');
  const [matPptName, setMatPptName] = useState('');
  const [matPptSizeLabel, setMatPptSizeLabel] = useState('');
  const [uploadingPptFile, setUploadingPptFile] = useState(false);
  const [savingMaterial, setSavingMaterial] = useState(false);

  const handleUploadMaterialAttachment = async (file: File) => {
    const MAX_BYTES = 25 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      onNotify('Ukuran file maksimal 25 MB. Gunakan link Google Drive/Slides untuk file lebih besar.', 'warning');
      return;
    }
    setUploadingPptFile(true);
    try {
      const tokenRes = await fetch('/api/session-token', {
        method: 'GET',
        credentials: 'same-origin',
      });
      const tokenData = (await tokenRes.json()) as { ok?: boolean; token?: string; error?: string };
      if (!tokenRes.ok || !tokenData.token) {
        throw new Error(tokenData.error || 'Gagal memverifikasi sesi browser.');
      }

      const fileBase64 = await fileToBase64(file);
      const uploadRes = await fetch('/api/upload-material-file', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Hafiz-Token': tokenData.token,
        },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          fileBase64,
        }),
      });
      const data = (await uploadRes.json()) as {
        ok?: boolean;
        url?: string;
        fileName?: string;
        sizeBytes?: number;
        error?: string;
      };
      if (!uploadRes.ok || !data.ok || !data.url) {
        throw new Error(data.error || 'Gagal mengunggah file ke server.');
      }

      const sizeKB = Math.max(1, Math.round((data.sizeBytes || file.size) / 1024));
      const sizeStr = sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
      setMatPptUrl(data.url);
      setMatPptName(data.fileName || file.name);
      setMatPptSizeLabel(sizeStr);
      onNotify(`📎 File "${file.name}" (${sizeStr}) berhasil diunggah & siap dipublikasikan!`, 'success');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal mengunggah file lampiran.', 'error');
    } finally {
      setUploadingPptFile(false);
    }
  };

  // Admin-Only Live Teaching (Zoom) Draft State
  const [liveTitle, setLiveTitle] = useState('');
  const [liveTutor, setLiveTutor] = useState('');
  const [liveCategory, setLiveCategory] = useState('UTBK-SNBT');
  const [liveSchedule, setLiveSchedule] = useState('');
  const [liveZoomUrl, setLiveZoomUrl] = useState('');
  const [liveIsNow, setLiveIsNow] = useState(true);
  const [savingLive, setSavingLive] = useState(false);

  const handleMaterialFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    try {
      let extractedText = '';
      if (ext === 'docx') {
        const res = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        extractedText = res.value;
      } else {
        extractedText = await file.text();
      }
      const lines = extractedText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length === 0) {
        onNotify('File materi kosong atau tidak dapat dibaca.', 'warning');
        return;
      }
      if (!matTitle.trim()) {
        setMatTitle(file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 180));
      }
      const summaryLines = lines.slice(0, 4).join('\n');
      const bulletLines = lines.slice(4, 18);
      setMatSummary(summaryLines.slice(0, 3500));
      if (bulletLines.length > 0) {
        setMatKeyPointsText(bulletLines.join('\n'));
      }
      onNotify(`📄 Isi file materi "${file.name}" berhasil dibaca otomatis!`, 'success');
    } catch {
      onNotify('Gagal membaca file materi. Gunakan format .DOCX, .TXT, atau .MD.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmitMaterial = async () => {
    if (!matTitle.trim() || !matSummary.trim()) {
      onNotify('Isi Judul Materi dan Ringkasan Materi terlebih dahulu.', 'warning');
      return;
    }
    setSavingMaterial(true);
    try {
      let portal: 'utbk' | 'tka' | 'sma' | 'kedinasan' = 'utbk';
      let grade: SmaGrade | undefined;
      let tkaTrack: TkaTrack | undefined;
      let subtitle = 'Materi UTBK & SNBT';
      if (matTarget === 'kedinasan') {
        portal = 'kedinasan';
        subtitle = 'Modul & Video Kedinasan (SKD)';
      } else if (matTarget === 'tka-saintek') {
        portal = 'tka';
        tkaTrack = 'Saintek';
        subtitle = 'Modul TKA Saintek';
      } else if (matTarget === 'tka-soshum') {
        portal = 'tka';
        tkaTrack = 'Soshum';
        subtitle = 'Modul TKA Soshum';
      } else if (matTarget === 'sma-X') {
        portal = 'sma';
        grade = 'X';
        subtitle = 'Kurikulum SMA/MA · Kelas X';
      } else if (matTarget === 'sma-XI') {
        portal = 'sma';
        grade = 'XI';
        subtitle = 'Kurikulum SMA/MA · Kelas XI';
      } else if (matTarget === 'sma-XII') {
        portal = 'sma';
        grade = 'XII';
        subtitle = 'Kurikulum SMA/MA · Kelas XII';
      }

      const keyPoints = matKeyPointsText
        .split(/\r?\n/)
        .map((l) => l.replace(/^[-•*0-9.)\s]+/, '').trim())
        .filter(Boolean);
      const formulas = matFormulasText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      const newMod: StudyModule = {
        id: `mat-${Date.now().toString(36)}`,
        portal,
        grade,
        tkaTrack,
        subject: matSubject.trim() || subtitle,
        title: matTitle.trim(),
        subtitle,
        readMinutes: Math.max(3, Math.ceil((matSummary.length + matKeyPointsText.length) / 350)),
        summary: matSummary.trim(),
        keyPoints,
        formulas,
        youtubeUrl: matYoutubeUrl.trim() || undefined,
        pptUrl: matPptUrl.trim() || undefined,
        pptName: matPptName.trim() || undefined,
        practiceQuestions: [],
        updatedAt: new Date().toISOString(),
      };

      await onSaveMaterial(newMod);
      setMatSubject('');
      setMatTitle('');
      setMatSummary('');
      setMatKeyPointsText('');
      setMatFormulasText('');
      setMatYoutubeUrl('');
      setMatPptUrl('');
      setMatPptName('');
    } finally {
      setSavingMaterial(false);
    }
  };

  const handleSubmitLiveSession = async () => {
    if (!liveTitle.trim() || !liveZoomUrl.trim()) {
      onNotify('Isi Judul Kelas Live Teaching dan Link Zoom terlebih dahulu.', 'warning');
      return;
    }
    const cleanUrl = /^https?:\/\//i.test(liveZoomUrl.trim())
      ? liveZoomUrl.trim()
      : `https://${liveZoomUrl.trim()}`;
    setSavingLive(true);
    try {
      await onSaveLiveSession({
        id: `live-${Date.now().toString(36)}`,
        title: liveTitle.trim(),
        tutorName: liveTutor.trim() || 'Mentor Hafiz Education',
        category: liveCategory,
        scheduleLabel: liveSchedule.trim() || (liveIsNow ? 'Sedang Berlangsung' : 'Segera Dimulai'),
        zoomUrl: cleanUrl,
        isLive: liveIsNow,
        updatedAt: new Date().toISOString(),
      });
      setLiveTitle('');
      setLiveTutor('');
      setLiveSchedule('');
      setLiveZoomUrl('');
    } finally {
      setSavingLive(false);
    }
  };

  const participantRows = participants.map((p) => {
    const matched = history.filter(
      (h) => h.playerName.trim().toLowerCase() === p.displayName.trim().toLowerCase()
    );
    const quizCount = matched.length;
    const bestGrade = matched.reduce((acc, cur) => Math.max(acc, cur.grade), 0);
    const totalPoints = matched.reduce((acc, cur) => acc + cur.points, 0);
    return {
      ...p,
      quizCount,
      bestGrade,
      totalPoints,
    };
  });

  const filteredParticipants = participantRows.filter((p) => {
    const q = participantSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      p.displayName.toLowerCase().includes(q) ||
      (p.username || '').toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.school || '').toLowerCase().includes(q) ||
      (p.targetCampus || '').toLowerCase().includes(q)
    );
  });

  const resetParticipantEditor = () => {
    setEditingParticipantUid(null);
    setPFormName('');
    setPFormUsername('');
    setPFormPassword('');
    setPFormSchool('');
    setPFormPhone('');
    setPFormTrack('utbk');
    setPFormCampus('');
    setPFormPhoto('');
  };

  const openEditParticipant = (p: ParticipantRecord) => {
    setEditingParticipantUid(p.uid);
    setShowAddParticipantForm(true);
    setPFormName(p.displayName || '');
    setPFormUsername(p.username || '');
    setPFormPassword('');
    setPFormSchool(p.school || '');
    setPFormPhone(p.phone || '');
    setPFormTrack(
      p.targetTrack === 'kedinasan' || p.targetTrack === 'both' ? p.targetTrack : 'utbk'
    );
    setPFormCampus(p.targetCampus || '');
    setPFormPhoto(p.photoUrl || '');
  };

  const handleSelectParticipantPhotoFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== 'string') return;
      const compressed = await compressDataUrlImage(reader.result, 400, 0.85);
      setPFormPhoto(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitParticipantForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAdminUpsertParticipant) return;
    if (!pFormName.trim()) {
      onNotify('Nama lengkap peserta wajib diisi.', 'warning');
      return;
    }
    if (!editingParticipantUid && pFormPassword.trim().length > 0 && pFormPassword.trim().length < 6) {
      onNotify('Kata sandi peserta baru minimal 6 karakter.', 'warning');
      return;
    }
    setSavingParticipantForm(true);
    try {
      await onAdminUpsertParticipant({
        uid: editingParticipantUid || undefined,
        displayName: pFormName.trim(),
        username: pFormUsername.trim() || undefined,
        password: pFormPassword.trim() || undefined,
        school: pFormSchool.trim(),
        phone: pFormPhone.trim(),
        targetTrack: pFormTrack,
        targetCampus: pFormCampus.trim(),
        photoDataUrl: pFormPhoto || undefined,
      });
      resetParticipantEditor();
      setShowAddParticipantForm(false);
    } finally {
      setSavingParticipantForm(false);
    }
  };

  const handleExportParticipantsExcel = () => {
    const rows = [
      [
        'No',
        'Nama Peserta',
        'Email',
        'Asal Sekolah / Instansi',
        'Jalur Target',
        'Target Kampus / Kedinasan',
        'Skor SKD Tersimpan',
        'Jumlah Kuis',
        'Nilai Tertinggi',
        'Total Poin',
        'Terakhir Aktif',
      ],
      ...participantRows.map((p, idx) => [
        idx + 1,
        p.displayName,
        p.email,
        p.school || '-',
        p.targetTrack || 'utbk',
        p.targetCampus || '-',
        p.savedSkdSummary ? `${p.savedSkdSummary.total}/550` : '-',
        p.quizCount,
        p.bestGrade,
        p.totalPoints,
        new Date(p.updatedAt).toLocaleString('id-ID'),
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Database Peserta');
    XLSX.writeFile(wb, `database_peserta_hafiz_education_${Date.now()}.xlsx`);
    onNotify('📊 Database Peserta (.XLSX) berhasil diunduh!', 'success');
  };

  useEffect(() => {
    if (!isPublished || !studioCode) {
      setQrDataUrl('');
      return;
    }
    const shareOrigin = window.location.hostname.endsWith('hafizeducation.my.id')
      ? window.location.origin
      : OFFICIAL_SITE_ORIGIN;
    const shareUrl = `${shareOrigin}/?room=${encodeURIComponent(studioCode)}`;
    QRCode.toDataURL(shareUrl, { width: 112, margin: 1 })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(''));
  }, [isPublished, studioCode]);

  const handleDownloadTemplate = (format: 'txt' | 'csv' | 'json' | 'xlsx') => {
    if (format === 'xlsx') {
      const ws = XLSX.utils.aoa_to_sheet([
        ['No', 'Pertanyaan', 'A', 'B', 'C', 'D', 'E', 'Jawaban', 'Pembahasan'],
        [
          1,
          'Ibu kota Provinsi Jawa Barat adalah...',
          'Semarang',
          'Bandung',
          'Surabaya',
          'Yogyakarta',
          'Serang',
          'B',
          'Bandung adalah ibu kota Provinsi Jawa Barat yang dikenal sebagai Kota Kembang.',
        ],
        [
          2,
          'Gas terbanyak yang menyusun atmosfer Bumi adalah...',
          'Oksigen',
          'Karbon Dioksida',
          'Nitrogen',
          'Argon',
          'Hidrogen',
          'C',
          'Sekitar 78% atmosfer Bumi tersusun atas gas Nitrogen (N2).',
        ],
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Soal Kuis');
      XLSX.writeFile(wb, 'template_soal_hafiz_education.xlsx');
      onNotify('Template .XLSX berhasil diunduh!', 'success');
      return;
    }
    const content = formatTemplateContent(format);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_soal_hafiz_education.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify(`Template .${format.toUpperCase()} berhasil diunduh!`, 'success');
  };

  const processUploadedFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    setIsParsingFile(true);
    setParsingStatus(`Membaca ${file.name}...`);

    try {
      let parsed: QuizQuestion[] = [];
      let detectedTitle = '';
      let usedAI = false;

      const parseTextWithAIFallback = async (rawText: string, label: string) => {
        const expectedCount = estimateQuestionCount(rawText);
        const localQs = parseQuizText(rawText);
        const localMatchesExpected =
          localQs.length > 0 && (expectedCount === 0 || localQs.length >= expectedCount);

        if (localMatchesExpected) {
          return localQs;
        }
        if (rawText.trim().length > 10) {
          setParsingStatus(
            expectedCount > 0
              ? `Membaca seluruh ${expectedCount} soal dari ${label} secara otomatis...`
              : `Menganalisis ${label} secara otomatis...`
          );
          try {
            const aiRes = await callSmartAIParser({
              text: rawText,
              fileName: file.name,
              expectedCount: expectedCount > 0 ? expectedCount : undefined,
            });
            detectedTitle = aiRes.title || '';
            usedAI = true;
            if (aiRes.questions.length >= localQs.length) {
              return aiRes.questions;
            }
          } catch {
            // Fall back to local parsed questions if server parser is unavailable
            if (localQs.length > 0) return localQs;
            throw new Error('Gagal membaca seluruh soal dari file.');
          }
        }
        return localQs;
      };

      const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'heic', 'heif', 'avif'];
      const SPREADSHEET_EXTS = ['xlsx', 'xls', 'ods'];
      const TEXT_MARKUP_EXTS = ['html', 'htm', 'xml'];

      if (SPREADSHEET_EXTS.includes(ext)) {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const firstSheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1 });
        parsed = parseQuizExcelRows(rows);
        if (parsed.length === 0) {
          setParsingStatus('Menganalisis spreadsheet secara otomatis dengan AI...');
          const csvFallback = XLSX.utils.sheet_to_csv(firstSheet);
          const aiRes = await callSmartAIParser({ text: csvFallback, fileName: file.name });
          parsed = aiRes.questions;
          detectedTitle = aiRes.title || '';
          usedAI = true;
        }
      } else if (ext === 'docx') {
        const buffer = await file.arrayBuffer();
        const htmlRes = await mammoth.convertToHtml({ arrayBuffer: buffer });
        const { textWithPlaceholders, images: rawImages } = extractHtmlImagesAndPlaceholders(
          htmlRes.value
        );
        const compressedImages = await Promise.all(
          rawImages.map((img) => compressDataUrlImage(img, 720, 0.72))
        );
        const extracted = await parseTextWithAIFallback(textWithPlaceholders, 'dokumen Word');
        parsed = attachImagesToQuestions(extracted, compressedImages);
      } else if (ext === 'pptx' || ext === 'odt' || ext === 'odp' || ext === 'epub') {
        setParsingStatus(`Mengekstrak teks & gambar dari dokumen ${ext.toUpperCase()}...`);
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const xmlFiles: string[] = [];
        const embeddedImages: string[] = [];

        const zipImageToDataUrl = async (zipPath: string): Promise<string | null> => {
          const entry = zip.files[zipPath];
          if (!entry) return null;
          const imgExt = zipPath.split('.').pop()?.toLowerCase() || 'png';
          const mime =
            imgExt === 'jpg' || imgExt === 'jpeg'
              ? 'image/jpeg'
              : imgExt === 'webp'
                ? 'image/webp'
                : imgExt === 'gif'
                  ? 'image/gif'
                  : 'image/png';
          const b64 = await entry.async('base64');
          return compressDataUrlImage(`data:${mime};base64,${b64}`, 720, 0.72);
        };

        if (ext === 'pptx') {
          const slidePaths = Object.keys(zip.files)
            .filter((p) => /^ppt\/slides\/slide\d+\.xml$/i.test(p))
            .sort((a, b) => {
              const na = Number(a.match(/slide(\d+)\.xml/i)?.[1] ?? 0);
              const nb = Number(b.match(/slide(\d+)\.xml/i)?.[1] ?? 0);
              return na - nb;
            });
          for (const p of slidePaths) {
            const slideName = p.split('/').pop()!;
            const relsPath = `ppt/slides/_rels/${slideName}.rels`;
            let slideImgToken = '';
            if (zip.files[relsPath]) {
              const relsXml = await zip.files[relsPath].async('text');
              const mediaMatch = relsXml.match(/Target="\.\.\/(media\/[^"]+\.(?:png|jpe?g|webp|gif))"/i);
              if (mediaMatch) {
                const compressed = await zipImageToDataUrl(`ppt/${mediaMatch[1]}`);
                if (compressed) {
                  const idx = embeddedImages.length;
                  embeddedImages.push(compressed);
                  slideImgToken = `\n[[IMG_${idx}]]\n`;
                }
              }
            }
            const xml = await zip.files[p].async('text');
            xmlFiles.push(stripHtmlAndXmlToText(xml) + slideImgToken);
          }
        } else if (ext === 'odt' || ext === 'odp') {
          const picPaths = Object.keys(zip.files)
            .filter((p) => /^Pictures\/.+\.(?:png|jpe?g|webp|gif)$/i.test(p))
            .sort();
          for (const pic of picPaths) {
            const compressed = await zipImageToDataUrl(pic);
            if (compressed) embeddedImages.push(compressed);
          }
          const contentFile = zip.files['content.xml'];
          if (contentFile) {
            xmlFiles.push(stripHtmlAndXmlToText(await contentFile.async('text')));
          }
        } else if (ext === 'epub') {
          const htmlPaths = Object.keys(zip.files)
            .filter((p) => /\.(?:xhtml|html|htm)$/i.test(p))
            .sort();
          for (const p of htmlPaths) {
            const { textWithPlaceholders, images: rawImgs } = extractHtmlImagesAndPlaceholders(
              await zip.files[p].async('text')
            );
            for (const img of rawImgs) {
              embeddedImages.push(await compressDataUrlImage(img, 720, 0.72));
            }
            xmlFiles.push(textWithPlaceholders);
          }
        }

        const extractedText = xmlFiles.join('\n\n').trim();
        const extracted = await parseTextWithAIFallback(extractedText, `file .${ext.toUpperCase()}`);
        parsed = attachImagesToQuestions(extracted, embeddedImages);
      } else if (ext === 'pdf' || IMAGE_EXTS.includes(ext) || file.type.startsWith('image/')) {
        setParsingStatus(`Mengekstrak soal, gambar, pilihan & pembahasan dari ${file.name}...`);
        const isPdf = ext === 'pdf' || file.type === 'application/pdf';
        const pdfBuffer = isPdf ? await file.arrayBuffer() : null;
        const fileBase64 = await fileToBase64(file);
        const mimeType =
          file.type ||
          (isPdf
            ? 'application/pdf'
            : ext === 'png'
              ? 'image/png'
              : ext === 'webp'
                ? 'image/webp'
                : ext === 'gif'
                  ? 'image/gif'
                  : 'image/jpeg');
        const aiRes = await callSmartAIParser({
          fileBase64,
          mimeType,
          fileName: file.name,
        });

        if (isPdf && pdfBuffer) {
          const hasPdfBoxes = aiRes.questions.some((q) => Boolean(q.imageBBox));
          if (hasPdfBoxes) {
            setParsingStatus('Memotong & mengekstrak gambar diagram dari halaman PDF...');
          }
          parsed = await extractPdfQuestionImages(pdfBuffer, aiRes.questions);
        } else if (mimeType.startsWith('image/')) {
          setParsingStatus('Mengekstrak area gambar untuk setiap soal...');
          parsed = await extractImageFileRegionsToQuestions(
            `data:${mimeType};base64,${fileBase64}`,
            aiRes.questions
          );
        } else {
          parsed = aiRes.questions;
        }
        detectedTitle = aiRes.title || '';
        usedAI = true;
      } else if (ext === 'csv' || ext === 'tsv') {
        const raw = await file.text();
        parsed = ext === 'csv' ? parseQuizCSV(raw) : [];
        if (parsed.length === 0 && raw.trim()) {
          parsed = await parseTextWithAIFallback(raw, `file .${ext.toUpperCase()}`);
        }
      } else if (ext === 'json') {
        const raw = await file.text();
        try {
          parsed = parseQuizJSON(raw);
        } catch {
          parsed = [];
        }
        if (parsed.length === 0 && raw.trim()) {
          parsed = await parseTextWithAIFallback(raw, 'file JSON');
        }
      } else if (ext === 'rtf') {
        const cleaned = stripRtfToText(await file.text());
        parsed = await parseTextWithAIFallback(cleaned, 'dokumen RTF');
      } else if (TEXT_MARKUP_EXTS.includes(ext)) {
        const rawMarkup = await file.text();
        const { textWithPlaceholders, images: rawImgs } = extractHtmlImagesAndPlaceholders(rawMarkup);
        const compressedImgs = await Promise.all(
          rawImgs.map((img) => compressDataUrlImage(img, 720, 0.72))
        );
        const extracted = await parseTextWithAIFallback(
          textWithPlaceholders,
          `dokumen ${ext.toUpperCase()}`
        );
        parsed = attachImagesToQuestions(extracted, compressedImgs);
      } else if (ext === 'doc' || ext === 'ppt') {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const extracted = extractPrintableTextFromBinary(bytes);
        parsed = await parseTextWithAIFallback(extracted, `dokumen .${ext.toUpperCase()}`);
      } else {
        // Universal fallback for TXT, MD, YAML, or any other file format
        const rawText = await file.text();
        const looksBinary = /[\x00-\x08\x0E-\x1F]/.test(rawText.slice(0, 500));
        const usableText = looksBinary
          ? extractPrintableTextFromBinary(new Uint8Array(await file.arrayBuffer()))
          : rawText;
        parsed = await parseTextWithAIFallback(usableText, file.name);
      }

      if (parsed.length === 0) {
        onNotify(
          'Tidak ditemukan soal yang valid di file tersebut. Pastikan isi file dapat dibaca.',
          'warning'
        );
      } else {
        // Automatically upload every embedded/extracted question image in the file to persistent server URLs
        const rawImageTotal = parsed.filter(
          (q) => typeof q.image === 'string' && q.image.startsWith('data:image/')
        ).length;
        let autoUploadedImgCount = 0;
        if (rawImageTotal > 0) {
          setParsingStatus(`Mengunggah ${rawImageTotal} gambar soal otomatis ke server...`);
          const uploadRes = await autoUploadQuestionImages(parsed, (done, total) => {
            setParsingStatus(`Mengunggah gambar soal otomatis (${done}/${total}) ke server...`);
          });
          parsed = uploadRes.questions;
          autoUploadedImgCount = uploadRes.uploadedCount;
        }

        onUpdateQuestions([...studioQuestions, ...parsed]);
        if (detectedTitle && !studioTitle.trim()) {
          onStudioTitleChange(detectedTitle);
        }
        const imgNote =
          autoUploadedImgCount > 0
            ? ` + ${autoUploadedImgCount} gambar soal otomatis terunggah ke server`
            : rawImageTotal > 0
              ? ` + ${rawImageTotal} gambar soal terpasang`
              : '';
        onNotify(
          `Berhasil membaca ${parsed.length} soal${imgNote} dari ${file.name}${usedAI ? ' dengan Pembaca Cerdas AI' : ''}!`,
          'success'
        );
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal membaca file soal. Pastikan file tidak rusak dan terbaca jelas.';
      onNotify(msg, 'error');
    } finally {
      setIsParsingFile(false);
      setParsingStatus('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processUploadedFile(file);
    e.target.value = '';
  };

  const handleFileDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (isParsingFile) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processUploadedFile(file);
    }
  };

  const handleConvertPaste = async (forceAI = false) => {
    const clean = pasteText.trim();
    if (!clean) {
      onNotify('Tempelkan teks soal terlebih dahulu.', 'warning');
      return;
    }

    if (!forceAI) {
      const parsed = parseQuizText(clean);
      if (parsed.length > 0) {
        onUpdateQuestions([...studioQuestions, ...parsed]);
        setPasteText('');
        onNotify(
          `Berhasil mengonversi ${parsed.length} soal (pilihan, jawaban & pembahasan) secara otomatis!`,
          'success'
        );
        return;
      }
    }

    // Fallback or explicit Smart AI extraction for free-form text
    setIsParsingFile(true);
    setParsingStatus('Mengekstrak soal, pilihan, kunci jawaban & pembahasan dengan AI...');
    try {
      const aiRes = await callSmartAIParser({ text: clean, fileName: 'teks-tempel.txt' });
      if (aiRes.questions.length === 0) {
        onNotify('Tidak ditemukan soal yang bisa diekstrak dari teks tersebut.', 'warning');
        return;
      }
      onUpdateQuestions([...studioQuestions, ...aiRes.questions]);
      if (aiRes.title && !studioTitle.trim()) {
        onStudioTitleChange(aiRes.title);
      }
      setPasteText('');
      onNotify(
        `✨ Pembaca Cerdas AI berhasil mengekstrak ${aiRes.questions.length} soal lengkap!`,
        'success'
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal mengekstrak teks soal. Coba rapikan format 1., A-E, Jawaban:.';
      onNotify(msg, 'error');
    } finally {
      setIsParsingFile(false);
      setParsingStatus('');
    }
  };

  const addBlankQuestion = () => {
    const next: QuizQuestion = {
      id: `q-manual-${Date.now()}`,
      question: '',
      choices: ['', '', '', '', ''],
      correctIndex: 0,
      explanation: '',
    };
    onUpdateQuestions([...studioQuestions, next]);
  };

  const updateQuestionField = (idx: number, patch: Partial<QuizQuestion>) => {
    const copy = studioQuestions.map((q, i) => (i === idx ? { ...q, ...patch } : q));
    onUpdateQuestions(copy);
  };

  const updateChoiceField = (qIdx: number, cIdx: number, val: string) => {
    const copy = studioQuestions.map((q, i) => {
      if (i !== qIdx) return q;
      const nextChoices = [...q.choices] as [string, string, string, string, string];
      nextChoices[cIdx] = val;
      return { ...q, choices: nextChoices };
    });
    onUpdateQuestions(copy);
  };

  const handleQuestionImageUpload = (qIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const compressed = await compressDataUrlImage(reader.result, 840, 0.8);
        const { url, uploaded } = await uploadQuestionImageToServer(compressed);
        updateQuestionField(qIdx, { image: url });
        onNotify(
          uploaded
            ? `🖼️ Gambar soal #${qIdx + 1} otomatis diunggah ke server!`
            : `🖼️ Gambar soal #${qIdx + 1} berhasil dipasang!`,
          'success'
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const removeQuestion = (idx: number) => {
    onUpdateQuestions(studioQuestions.filter((_, i) => i !== idx));
  };

  const moveQuestion = (idx: number, direction: -1 | 1) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= studioQuestions.length) return;
    const copy = [...studioQuestions];
    const [item] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, item);
    onUpdateQuestions(copy);
  };

  const duplicateQuestion = (idx: number) => {
    const src = studioQuestions[idx];
    if (!src) return;
    const clone: QuizQuestion = {
      ...src,
      id: `q-copy-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      choices: [...src.choices] as [string, string, string, string, string],
    };
    const copy = [...studioQuestions];
    copy.splice(idx + 1, 0, clone);
    onUpdateQuestions(copy);
    onNotify(`📄 Soal #${idx + 1} berhasil diduplikat ke #${idx + 2}.`, 'info');
  };

  const isEditingUploadedRoom = uploadedRooms.some(
    (r) => r.code === studioCode && r.questions.length > 0
  );

  const normalizedQuestionQuery = questionSearch.trim().toLowerCase();
  const indexedStudioQuestions = studioQuestions
    .map((q, origIdx) => ({ q, origIdx }))
    .filter(({ q, origIdx }) => {
      if (!normalizedQuestionQuery) return true;
      const numLabel = `${origIdx + 1}`;
      return (
        numLabel === normalizedQuestionQuery ||
        `#${numLabel}` === normalizedQuestionQuery ||
        q.question.toLowerCase().includes(normalizedQuestionQuery) ||
        q.explanation.toLowerCase().includes(normalizedQuestionQuery) ||
        q.choices.some((c) => c.toLowerCase().includes(normalizedQuestionQuery))
      );
    });

  const filteredHistory = history.filter((rec) => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return true;
    return (
      rec.playerName.toLowerCase().includes(q) ||
      rec.roomCode.toLowerCase().includes(q) ||
      rec.quizTitle.toLowerCase().includes(q)
    );
  });

  return (
    <section id="view-admin-studio" className="space-y-6">
      {/* Studio Top Bar */}
      <div className="glass-card p-5 rounded-3xl space-y-4 border-amber-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-amber-300 text-xs font-extrabold">
              Mode Admin Terverifikasi &bull; Database Cloud Aktif
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
              Quiz Studio &amp; Manajemen Room Hafiz Education
            </h2>
            <p className="text-xs text-slate-300">
              Upload file soal dalam <strong>SEMUA FORMAT</strong> (Word, Excel, PowerPoint, PDF,
              Foto/Gambar, TXT, CSV, JSON, RTF, HTML, XML, EPUB) — sistem otomatis membaca soal,
              pilihan A–E, kunci jawaban, dan pembahasan.
            </p>
          </div>

          <div className="flex flex-wrap lg:flex-nowrap gap-2 shrink-0">
            <button
              type="button"
              onClick={onExportExcel}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <span aria-hidden="true">📊</span> Rekap Nilai Excel (.xlsx)
            </button>
            <button
              type="button"
              onClick={onOpenGoogleScriptModal}
              className="px-4 py-2.5 rounded-xl bg-sky-600/30 hover:bg-sky-600/50 border border-sky-400/40 text-sky-200 font-bold text-xs flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <span aria-hidden="true">🔗</span> Google Sheets &amp; Keamanan
            </button>
            <button
              type="button"
              onClick={onCloseStudio}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition whitespace-nowrap"
            >
              ← Beranda
            </button>
            <button
              type="button"
              onClick={onGoogleAdminLogout}
              className="px-4 py-2.5 rounded-xl bg-rose-950/85 hover:bg-rose-900 border border-rose-400/40 text-rose-200 font-bold text-xs transition whitespace-nowrap"
            >
              🚪 Keluar Admin
            </button>
          </div>
        </div>

        {/* Cloud Database & Security Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-indigo-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs space-y-0.5">
            {isGoogleAdminVerified && googleAdminEmail ? (
              <>
                <p className="font-extrabold text-emerald-300">
                  ☁️ Database Cloud Firebase Terhubung ({googleAdminEmail})
                </p>
                <p className="text-[11px] text-slate-400">
                  Semua room kuis &amp; riwayat nilai peserta tersimpan permanen di cloud dan
                  dilindungi Firestore Security Rules.
                </p>
              </>
            ) : (
              <>
                <p className="font-extrabold text-amber-300">
                  🔒 Mode Lokal Aktif — Login Google Admin untuk Sinkron Database Cloud
                </p>
                <p className="text-[11px] text-slate-400">
                  Riwayat peserta tetap terkirim ke cloud otomatis; login Google Admin untuk
                  menerbitkan room lintas perangkat &amp; memuat seluruh arsip cloud.
                </p>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {isGoogleAdminVerified ? (
              <>
                <button
                  type="button"
                  disabled={isSyncingCloud}
                  onClick={onSyncCloudNow}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs whitespace-nowrap transition"
                >
                  {isSyncingCloud ? '⏳ Menyinkronkan...' : '🔄 Muat Ulang Cloud'}
                </button>
                <button
                  type="button"
                  onClick={onGoogleAdminLogout}
                  className="px-3.5 py-2 rounded-xl bg-rose-950/85 hover:bg-rose-900 border border-rose-400/35 text-rose-200 font-bold text-xs whitespace-nowrap transition"
                >
                  🚪 Keluar Google
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onGoogleAdminLogin}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs whitespace-nowrap transition"
              >
                🔐 Login Google Admin
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Uploaded Room Editing Banner */}
      {isEditingUploadedRoom && (
        <div
          id="studio-editing-banner"
          className="glass-card p-4 rounded-2xl border border-indigo-400/50 bg-indigo-950/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs sm:text-sm font-extrabold text-indigo-200 flex flex-wrap items-center gap-2">
              <span>✏️ Sedang Mengedit Paket Soal Terupload:</span>
              <span className="text-white truncate">{studioTitle || studioCode}</span>
              <span className="font-mono text-amber-300 text-xs">({studioCode})</span>
              {!isPublished ? (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[10px] font-extrabold">
                  Perubahan Belum Disimpan
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[10px] font-extrabold">
                  Tersinkron
                </span>
              )}
            </p>
            <p className="text-[11px] text-slate-300">
              Ubah pertanyaan, opsi A–E, kunci jawaban, pembahasan, gambar, atau jadwal buka/tutup di bawah lalu klik{' '}
              <strong>Simpan Perubahan</strong>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onPublishRoom}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition whitespace-nowrap"
            >
              💾 Simpan Perubahan
            </button>
            {onStartNewRoom && (
              <button
                type="button"
                onClick={onStartNewRoom}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs transition whitespace-nowrap"
              >
                ➕ Buat Paket Baru
              </button>
            )}
          </div>
        </div>
      )}

      {/* Studio 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Room Settings + Upload/Paste */}
        <div className="lg:col-span-5 space-y-5">
          <div className="hero-glow-card p-5 rounded-3xl space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span aria-hidden="true">🎯</span> Pengaturan &amp; Penerbitan Room
            </h3>

            <div>
              <label
                htmlFor="studio-quiz-title"
                className="block text-xs font-bold text-slate-300 mb-1"
              >
                Judul Kuis / Mata Pelajaran
              </label>
              <input
                type="text"
                id="studio-quiz-title"
                value={studioTitle}
                onChange={(e) => onStudioTitleChange(e.target.value)}
                placeholder="Contoh: Ujian Akhir Semester Biologi"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-400 outline-none text-sm text-white font-semibold"
              />
            </div>

            <div>
              <label
                htmlFor="studio-quiz-category"
                className="block text-xs font-bold text-amber-200 mb-1.5"
              >
                Kategori Portal / Upload Soal (UTBK-SNBT, TKA, Kelas X–XII)
              </label>
              <select
                id="studio-quiz-category"
                value={studioCategory}
                onChange={(e) => onStudioCategoryChange(e.target.value as QuizCategory)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-amber-300/30 focus:border-amber-300 outline-none text-sm text-amber-100 font-semibold"
              >
                <option value="UTBK-SNBT">UTBK &amp; SNBT (TPS &amp; Literasi)</option>
                <option value="Kedinasan">Portal Kedinasan (Try Out SKD: TWK · TIU · TKP)</option>
                <option value="TKA Saintek">TKA Saintek (Mat-IPA, Fisika, Kimia, Biologi)</option>
                <option value="TKA Soshum">TKA Soshum (Ekonomi, Geografi, Sosiologi, Sejarah)</option>
                <option value="Kelas X">Materi &amp; Try Out Kelas X SMA/MA</option>
                <option value="Kelas XI">Materi &amp; Try Out Kelas XI SMA/MA</option>
                <option value="ASAS XII">Portal ASAS XII (Asesmen Sumatif Akhir Semester XII)</option>
                <option value="Kelas XII">Materi &amp; Try Out Kelas XII SMA/MA</option>
                <option value="Umum">Umum / Room Kuis Bebas</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Soal yang diunggah &amp; diterbitkan akan langsung muncul di Portal Belajar sesuai kategori ini untuk peserta yang login Google.
              </p>
            </div>

            {/* Scheduled Quiz Open & Close Date/Time (Explicit Tanggal / Bulan / Tahun / Jam / Menit) */}
            {(() => {
              const openIso = parseOpenAtInput(studioOpenAt);
              const closeIso = parseOpenAtInput(studioCloseAt);
              const schedulePreview = getQuizScheduleStatus(openIso, Date.now(), closeIso);
              const now = new Date();
              const yearOptions = Array.from({ length: 12 }, (_, i) => 2024 + i);

              const openParts = decomposeScheduleParts(studioOpenAt) ?? {
                day: now.getDate(),
                month: now.getMonth() + 1,
                year: now.getFullYear(),
                hour: 8,
                minute: 0,
              };
              const maxOpenDays = getDaysInMonth(openParts.year, openParts.month);
              const updateOpenPart = (patch: Partial<typeof openParts>) => {
                onStudioOpenAtChange(composeScheduleParts({ ...openParts, ...patch }));
              };

              const closeParts = decomposeScheduleParts(studioCloseAt) ?? {
                day: now.getDate(),
                month: now.getMonth() + 1,
                year: now.getFullYear(),
                hour: 23,
                minute: 59,
              };
              const maxCloseDays = getDaysInMonth(closeParts.year, closeParts.month);
              const updateClosePart = (patch: Partial<typeof closeParts>) => {
                onStudioCloseAtChange(composeScheduleParts({ ...closeParts, ...patch }));
              };

              const applyOpenOffsetDays = (days: number) => {
                const target = new Date();
                target.setDate(target.getDate() + days);
                target.setHours(8, 0, 0, 0);
                onStudioOpenAtChange(toDateTimeLocalInput(target.toISOString()));
              };

              const applyCloseOffset = (hoursFromBase: number, useOpenBase = false) => {
                const base =
                  useOpenBase && openIso ? new Date(openIso) : new Date();
                const target = new Date(base.getTime() + hoursFromBase * 60 * 60 * 1000);
                onStudioCloseAtChange(toDateTimeLocalInput(target.toISOString()));
              };

              const hasInvalidRange =
                Boolean(openIso && closeIso && new Date(closeIso).getTime() <= new Date(openIso).getTime());

              return (
                <div className="space-y-3">
                  {/* BUKA SOAL */}
                  <div className="p-4 rounded-2xl bg-slate-950/75 border border-purple-400/30 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="block text-xs font-bold text-purple-200">
                        🟢 Jadwal Buka Soal (Tanggal · Bulan · Tahun · Jam)
                      </span>
                      {studioOpenAt ? (
                        <button
                          type="button"
                          onClick={() => onStudioOpenAtChange('')}
                          className="text-[11px] font-bold text-emerald-300 hover:text-emerald-200 transition"
                        >
                          ✕ Buka Langsung
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateOpenPart({})}
                          className="text-[11px] font-bold text-purple-300 hover:text-purple-200 transition"
                        >
                          + Atur Jadwal Buka
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      <div>
                        <label htmlFor="studio-open-day" className="block text-[10px] font-bold text-slate-400 mb-1">
                          Tanggal
                        </label>
                        <select
                          id="studio-open-day"
                          value={openParts.day}
                          onChange={(e) => updateOpenPart({ day: Number(e.target.value) })}
                          className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-purple-400/30 focus:border-purple-400 outline-none text-xs text-white font-semibold"
                        >
                          {Array.from({ length: maxOpenDays }, (_, i) => i + 1).map((d) => (
                            <option key={d} value={d}>
                              {String(d).padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label htmlFor="studio-open-month" className="block text-[10px] font-bold text-slate-400 mb-1">
                          Bulan
                        </label>
                        <select
                          id="studio-open-month"
                          value={openParts.month}
                          onChange={(e) => updateOpenPart({ month: Number(e.target.value) })}
                          className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-purple-400/30 focus:border-purple-400 outline-none text-xs text-white font-semibold"
                        >
                          {INDONESIAN_MONTHS.map((mName, idx) => (
                            <option key={mName} value={idx + 1}>
                              {mName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="studio-open-year" className="block text-[10px] font-bold text-slate-400 mb-1">
                          Tahun
                        </label>
                        <select
                          id="studio-open-year"
                          value={openParts.year}
                          onChange={(e) => updateOpenPart({ year: Number(e.target.value) })}
                          className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-purple-400/30 focus:border-purple-400 outline-none text-xs text-white font-semibold"
                        >
                          {yearOptions.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="studio-open-hour" className="block text-[10px] font-bold text-slate-400 mb-1">
                          Jam
                        </label>
                        <select
                          id="studio-open-hour"
                          value={openParts.hour}
                          onChange={(e) => updateOpenPart({ hour: Number(e.target.value) })}
                          className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-purple-400/30 focus:border-purple-400 outline-none text-xs text-white font-semibold"
                        >
                          {Array.from({ length: 24 }, (_, h) => (
                            <option key={h} value={h}>
                              {String(h).padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="studio-open-minute" className="block text-[10px] font-bold text-slate-400 mb-1">
                          Menit
                        </label>
                        <select
                          id="studio-open-minute"
                          value={openParts.minute}
                          onChange={(e) => updateOpenPart({ minute: Number(e.target.value) })}
                          className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-purple-400/30 focus:border-purple-400 outline-none text-xs text-white font-semibold"
                        >
                          {Array.from({ length: 60 }, (_, m) => (
                            <option key={m} value={m}>
                              {String(m).padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => onStudioOpenAtChange('')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                          !studioOpenAt
                            ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        Buka Langsung
                      </button>
                      <button
                        type="button"
                        onClick={() => applyOpenOffsetDays(1)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
                      >
                        Besok 08:00
                      </button>
                      <button
                        type="button"
                        onClick={() => applyOpenOffsetDays(3)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
                      >
                        +3 Hari
                      </button>
                      <button
                        type="button"
                        onClick={() => applyOpenOffsetDays(7)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
                      >
                        +7 Hari
                      </button>
                    </div>
                  </div>

                  {/* TUTUP SOAL */}
                  <div className="p-4 rounded-2xl bg-slate-950/75 border border-rose-400/30 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="block text-xs font-bold text-rose-200">
                        ⛔ Jadwal Tutup Soal (Tanggal · Bulan · Tahun · Jam)
                      </span>
                      {studioCloseAt ? (
                        <button
                          type="button"
                          onClick={() => onStudioCloseAtChange('')}
                          className="text-[11px] font-bold text-emerald-300 hover:text-emerald-200 transition"
                        >
                          ✕ Tanpa Batas Tutup
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateClosePart({})}
                          className="text-[11px] font-bold text-rose-300 hover:text-rose-200 transition"
                        >
                          + Atur Jadwal Tutup
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      <div>
                        <label htmlFor="studio-close-day" className="block text-[10px] font-bold text-slate-400 mb-1">
                          Tanggal
                        </label>
                        <select
                          id="studio-close-day"
                          value={closeParts.day}
                          onChange={(e) => updateClosePart({ day: Number(e.target.value) })}
                          className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-rose-400/30 focus:border-rose-400 outline-none text-xs text-white font-semibold"
                        >
                          {Array.from({ length: maxCloseDays }, (_, i) => i + 1).map((d) => (
                            <option key={d} value={d}>
                              {String(d).padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label htmlFor="studio-close-month" className="block text-[10px] font-bold text-slate-400 mb-1">
                          Bulan
                        </label>
                        <select
                          id="studio-close-month"
                          value={closeParts.month}
                          onChange={(e) => updateClosePart({ month: Number(e.target.value) })}
                          className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-rose-400/30 focus:border-rose-400 outline-none text-xs text-white font-semibold"
                        >
                          {INDONESIAN_MONTHS.map((mName, idx) => (
                            <option key={mName} value={idx + 1}>
                              {mName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="studio-close-year" className="block text-[10px] font-bold text-slate-400 mb-1">
                          Tahun
                        </label>
                        <select
                          id="studio-close-year"
                          value={closeParts.year}
                          onChange={(e) => updateClosePart({ year: Number(e.target.value) })}
                          className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-rose-400/30 focus:border-rose-400 outline-none text-xs text-white font-semibold"
                        >
                          {yearOptions.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="studio-close-hour" className="block text-[10px] font-bold text-slate-400 mb-1">
                          Jam
                        </label>
                        <select
                          id="studio-close-hour"
                          value={closeParts.hour}
                          onChange={(e) => updateClosePart({ hour: Number(e.target.value) })}
                          className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-rose-400/30 focus:border-rose-400 outline-none text-xs text-white font-semibold"
                        >
                          {Array.from({ length: 24 }, (_, h) => (
                            <option key={h} value={h}>
                              {String(h).padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="studio-close-minute" className="block text-[10px] font-bold text-slate-400 mb-1">
                          Menit
                        </label>
                        <select
                          id="studio-close-minute"
                          value={closeParts.minute}
                          onChange={(e) => updateClosePart({ minute: Number(e.target.value) })}
                          className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-rose-400/30 focus:border-rose-400 outline-none text-xs text-white font-semibold"
                        >
                          {Array.from({ length: 60 }, (_, m) => (
                            <option key={m} value={m}>
                              {String(m).padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => onStudioCloseAtChange('')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                          !studioCloseAt
                            ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        Tanpa Batas Tutup
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onStudioCloseAtChange(
                            toDateTimeLocalInput(new Date(Date.now() - 60_000).toISOString())
                          )
                        }
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-600/30 hover:bg-rose-600/50 border border-rose-400/40 text-rose-200 transition"
                      >
                        🔒 Tutup Sekarang
                      </button>
                      <button
                        type="button"
                        onClick={() => applyCloseOffset(2, true)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
                      >
                        +2 Jam
                      </button>
                      <button
                        type="button"
                        onClick={() => applyCloseOffset(24, true)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
                      >
                        +1 Hari
                      </button>
                      <button
                        type="button"
                        onClick={() => applyCloseOffset(24 * 7, true)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
                      >
                        +7 Hari
                      </button>
                    </div>
                  </div>

                  {/* Combined Open/Close Schedule Status Preview */}
                  {hasInvalidRange && (
                    <p className="text-[11px] font-semibold text-rose-300 bg-rose-500/15 border border-rose-400/40 rounded-xl px-3 py-2">
                      ⚠️ Waktu tutup tidak boleh lebih awal dari waktu buka. Silakan sesuaikan tanggal/jam tutup.
                    </p>
                  )}
                  {schedulePreview.isClosed ? (
                    <p className="text-[11px] font-semibold text-rose-300 bg-rose-500/10 border border-rose-400/35 rounded-xl px-3 py-2">
                      ⛔ Status Soal: <strong>Ditutup</strong> (ditutup sejak{' '}
                      <strong>{schedulePreview.formattedCloseDate}</strong>). Peserta tidak dapat mengerjakan soal ini.
                    </p>
                  ) : schedulePreview.isNotYetOpen ? (
                    <p className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-400/30 rounded-xl px-3 py-2">
                      🔒 Status Soal: <strong>Terjadwal Buka</strong> pada{' '}
                      <strong>{schedulePreview.formattedDate}</strong> ({schedulePreview.countdownLabel})
                      {schedulePreview.formattedCloseDate
                        ? ` · Tutup ${schedulePreview.formattedCloseDate}`
                        : ''}.
                    </p>
                  ) : (
                    <p className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-400/30 rounded-xl px-3 py-2">
                      🟢 Status Soal: <strong>Terbuka</strong>
                      {schedulePreview.formattedDate ? ` (sejak ${schedulePreview.formattedDate})` : ' (Buka Langsung)'}
                      {schedulePreview.formattedCloseDate
                        ? ` · Otomatis ditutup ${schedulePreview.formattedCloseDate} (${schedulePreview.countdownLabel})`
                        : ' · Tanpa batas tutup'}
                      .
                    </p>
                  )}
                </div>
              );
            })()}

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold text-slate-400">
                  🤖 Kode Kuis Otomatis dari Sistem
                </p>
                <p
                  id="studio-generated-code"
                  className="text-2xl font-extrabold tracking-widest text-amber-400 mt-0.5 font-mono"
                >
                  {studioCode}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Dibuat acak oleh sistem saat membuka studio
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={onGenerateNewCode}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 whitespace-nowrap"
                >
                  🎲 Acak Kode Sistem
                </button>
                <button
                  type="button"
                  onClick={onCopyShareLink}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-xs font-bold text-indigo-300 whitespace-nowrap"
                >
                  📋 Salin Kode &amp; Link
                </button>
              </div>
            </div>

            {isPublished && (
              <div
                id="studio-qr-wrapper"
                className="p-4 rounded-2xl bg-white text-slate-900 flex items-center gap-4"
              >
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt={`QR Room ${studioCode}`}
                    className="w-24 h-24 rounded-lg shrink-0"
                  />
                )}
                <div className="text-xs space-y-1">
                  <p className="font-extrabold text-slate-900">Room Aktif &amp; Siap Dimainkan!</p>
                  <p className="text-slate-600">
                    Bagikan kode <strong>{studioCode}</strong> atau QR ini kepada peserta. Peserta
                    akan menunggu di Lobi Kuis hingga Anda klik <strong>Mulai Kuis</strong>.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        onToggleRoomStart(studioRoomStatus === 'started' ? 'waiting' : 'started')
                      }
                      className={`px-3 py-1.5 rounded-lg font-extrabold text-xs text-white transition ${
                        studioRoomStatus === 'started'
                          ? 'bg-amber-600 hover:bg-amber-500'
                          : 'bg-emerald-600 hover:bg-emerald-500'
                      }`}
                    >
                      {studioRoomStatus === 'started'
                        ? '⏸️ Kembalikan ke Lobi Tunggu'
                        : '🚀 Mulai Kuis Sekarang (Semua Peserta)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onEnterPreviewLobby()}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                    >
                      Masuk Lobi Kuis →
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={onPublishRoom}
                className="btn-3d flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2"
              >
                <span aria-hidden="true">{isEditingUploadedRoom ? '💾' : '🚀'}</span>{' '}
                {isEditingUploadedRoom
                  ? 'Simpan Perubahan Soal & Perbarui di Cloud'
                  : 'Terbitkan Kuis & Simpan ke Cloud'}
              </button>
              {studioQuestions.length > 0 && (
                <button
                  type="button"
                  id="btn-studio-open-lobby"
                  onClick={() => onEnterPreviewLobby()}
                  className="py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 whitespace-nowrap transition"
                >
                  Masuk Lobi Kuis →
                </button>
              )}
            </div>
          </div>

          {/* Manage & Delete Uploaded Quiz Rooms */}
          <div className="glass-card p-5 rounded-3xl space-y-3 border-sky-400/25">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span aria-hidden="true">📚</span> Paket Soal Terupload ({uploadedRooms.filter((r) => r.questions.length > 0).length})
              </h3>
              <span className="text-[11px] text-slate-400">Ubah jadwal / hapus</span>
            </div>

            {uploadedRooms.filter((r) => r.questions.length > 0).length === 0 ? (
              <p className="text-xs text-slate-400 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-center">
                Belum ada paket soal yang diterbitkan. Unggah soal lalu klik <strong>Terbitkan Kuis</strong>.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {uploadedRooms
                  .filter((r) => r.questions.length > 0)
                  .map((r) => {
                    const sched = getQuizScheduleStatus(r.openAt, Date.now(), r.closeAt);
                    return (
                      <div
                        key={r.code}
                        className={`p-3.5 rounded-2xl space-y-2 border transition ${
                          r.code === studioCode
                            ? 'bg-indigo-950/45 border-indigo-400/70'
                            : 'bg-slate-950/75 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-white truncate">
                              {r.title}
                              {r.code === studioCode && (
                                <span className="ml-1.5 text-[10px] font-bold text-indigo-300">
                                  (Sedang Diedit)
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              <span className="font-mono text-amber-300 font-bold">{r.code}</span> ·{' '}
                              {r.category || 'Umum'} · {r.questions.length} Soal
                            </p>
                            {(sched.formattedDate || sched.formattedCloseDate) && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {sched.formattedDate ? `Buka: ${sched.formattedDate}` : 'Buka: Langsung'}
                                {sched.formattedCloseDate ? ` · Tutup: ${sched.formattedCloseDate}` : ''}
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${
                              sched.isClosed
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                                : sched.isNotYetOpen
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                            }`}
                          >
                            {sched.isClosed
                              ? '⛔ Ditutup'
                              : sched.isNotYetOpen
                                ? `🔒 ${sched.formattedDate}`
                                : '🟢 Dibuka'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              onToggleRoomStart(r.status === 'started' ? 'waiting' : 'started', r)
                            }
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-extrabold transition ${
                              r.status === 'started'
                                ? 'bg-amber-500/25 hover:bg-amber-500/40 border-amber-400/50 text-amber-200'
                                : 'bg-emerald-500/25 hover:bg-emerald-500/40 border-emerald-400/50 text-emerald-200'
                            }`}
                          >
                            {r.status === 'started' ? '⏸️ Kembali Lobi' : '🚀 Mulai Kuis'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onEnterPreviewLobby(r)}
                            className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/45 text-sky-200 text-[11px] font-bold transition"
                          >
                            🏟️ Lobi
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onLoadRoomToStudio(r);
                              window.setTimeout(() => {
                                document
                                  .getElementById('studio-questions-editor')
                                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }, 80);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-indigo-200 text-[11px] font-bold transition"
                          >
                            ✏️ Edit Soal &amp; Jadwal
                          </button>
                          <button
                            type="button"
                            onClick={() => onQuickToggleCloseRoom(r)}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition ${
                              sched.isClosed
                                ? 'bg-emerald-600/25 hover:bg-emerald-600/40 border-emerald-400/40 text-emerald-200'
                                : 'bg-amber-600/25 hover:bg-amber-600/40 border-amber-400/40 text-amber-200'
                            }`}
                          >
                            {sched.isClosed ? '🔓 Buka Soal' : '🔒 Tutup Soal'}
                          </button>
                          {isGoogleAdminVerified ? (
                            <button
                              type="button"
                              onClick={() => onDeleteRoom(r)}
                              className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[11px] font-bold transition"
                            >
                              🗑️ Hapus
                            </button>
                          ) : (
                            <span
                              title="Login Google Admin diperlukan untuk menghapus soal"
                              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-500 text-[11px] font-semibold"
                            >
                              🔒 Hapus (Khusus Admin)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* File Upload & Paste Converter */}
          <div className="glass-card p-5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span aria-hidden="true">📂</span> Pembaca File Soal Otomatis
              </h3>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('xlsx')}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-emerald-300"
                >
                  .XLSX
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('txt')}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-sky-300"
                >
                  .TXT
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('csv')}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-teal-300"
                >
                  .CSV
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('json')}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-amber-300"
                >
                  .JSON
                </button>
              </div>
            </div>

            <label
              htmlFor="file-quiz-upload"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={handleFileDrop}
              className={`block p-5 rounded-2xl border-2 border-dashed text-center transition ${
                isParsingFile
                  ? 'border-amber-400/60 bg-amber-950/20 cursor-wait'
                  : isDraggingFile
                    ? 'border-emerald-400 bg-emerald-950/30 cursor-copy'
                    : 'border-indigo-400/40 hover:border-indigo-400 bg-indigo-950/20 hover:bg-indigo-950/35 cursor-pointer'
              }`}
            >
              <p className="text-2xl mb-1" aria-hidden="true">
                {isParsingFile ? '⏳' : isDraggingFile ? '📥' : '📄'}
              </p>
              <p className="text-xs sm:text-sm font-bold text-white">
                {isParsingFile
                  ? parsingStatus || 'Sedang membaca file soal...'
                  : isDraggingFile
                    ? 'Lepaskan File Soal di Sini!'
                    : 'Klik atau Seret File Soal (Semua Format) ke Sini'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Mendukung{' '}
                <strong>
                  Word (.DOCX/.DOC/.RTF/.ODT), Excel (.XLSX/.XLS/.ODS), PowerPoint (.PPTX/.ODP),
                  PDF, Semua Gambar (.PNG/.JPG/.WEBP/.HEIC), HTML/XML, Markdown, EPUB, TXT, CSV,
                  JSON
                </strong>
                <br />
                Otomatis membaca <strong>Soal, Pilihan A–E, Kunci Jawaban &amp; Pembahasan</strong>.
              </p>
              <input
                type="file"
                id="file-quiz-upload"
                disabled={isParsingFile}
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            <div className="space-y-2">
              <label
                htmlFor="paste-quiz-textarea"
                className="block text-xs font-bold text-slate-300"
              >
                Atau Tempel Teks Soal Langsung (Mendukung format bebas, *tanda bintang, Kunci di
                bawah &amp; Pembahasan):
              </label>
              <textarea
                id="paste-quiz-textarea"
                rows={4}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={
                  '1. Contoh pertanyaan?\nA. Opsi A\n*B. Opsi B (Benar)\nC. Opsi C\nD. Opsi D\nE. Opsi E\nJawaban: B\nPembahasan: Penjelasan jawaban...'
                }
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 focus:border-indigo-400 outline-none text-xs text-slate-200"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isParsingFile}
                  onClick={() => handleConvertPaste(false)}
                  className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition"
                >
                  ⚡ Konversi Otomatis
                </button>
                <button
                  type="button"
                  disabled={isParsingFile}
                  onClick={() => handleConvertPaste(true)}
                  className="py-2.5 px-3 rounded-xl bg-fuchsia-600/80 hover:bg-fuchsia-500 disabled:opacity-50 text-white font-bold text-xs transition"
                >
                  ✨ Baca Cerdas AI
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Active Questions Editor + History Archive */}
        <div className="lg:col-span-7 space-y-6">
          <div id="studio-questions-editor" className="glass-card p-5 rounded-3xl space-y-4 scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>📚 Daftar &amp; Editor Soal ({studioQuestions.length} Soal)</span>
                  {isEditingUploadedRoom && !isPublished && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[10px] font-bold">
                      Belum Disimpan
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Edit langsung teks soal, opsi A–E, kunci jawaban, pembahasan, urutan, atau gambar tiap nomor.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={addBlankQuestion}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition whitespace-nowrap"
                >
                  + Tambah Soal Manual
                </button>
                <button
                  type="button"
                  onClick={onPublishRoom}
                  disabled={studioQuestions.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-extrabold text-xs transition whitespace-nowrap"
                >
                  💾 Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateQuestions([])}
                  className="px-3 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/30 text-rose-300 font-bold text-xs transition whitespace-nowrap"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            {studioQuestions.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  placeholder="🔍 Cari nomor (mis. 15) atau kata kunci soal / opsi / pembahasan..."
                  aria-label="Cari soal di editor"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-400 text-xs text-white outline-none"
                />
                <select
                  aria-label="Lompat ke nomor soal"
                  defaultValue=""
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    if (!Number.isNaN(idx)) {
                      setQuestionSearch('');
                      window.setTimeout(() => {
                        document
                          .getElementById(`studio-q-card-${idx}`)
                          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 40);
                    }
                    e.target.value = '';
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-indigo-200 font-bold outline-none sm:w-48"
                >
                  <option value="">⏭️ Lompat ke No. Soal...</option>
                  {studioQuestions.map((_, i) => (
                    <option key={i} value={i}>
                      Ke Soal #{i + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
              {studioQuestions.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                  Belum ada soal. Klik <strong>+ Tambah Soal Manual</strong>, pilih{' '}
                  <strong>✏️ Edit Soal &amp; Jadwal</strong> dari Paket Soal Terupload, atau unggah/tempel soal di panel sebelah kiri.
                </div>
              ) : indexedStudioQuestions.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400 space-y-2">
                  <p>Tidak ada soal yang cocok dengan pencarian &ldquo;{questionSearch}&rdquo;.</p>
                  <button
                    type="button"
                    onClick={() => setQuestionSearch('')}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold"
                  >
                    Tampilkan Semua Soal
                  </button>
                </div>
              ) : (
                indexedStudioQuestions.map(({ q, origIdx }) => (
                  <div
                    key={q.id || origIdx}
                    id={`studio-q-card-${origIdx}`}
                    className="p-4 rounded-2xl bg-slate-950/75 border border-slate-800 hover:border-indigo-500/40 space-y-3 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-indigo-300">
                        Soal #{origIdx + 1}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          disabled={origIdx === 0}
                          onClick={() => moveQuestion(origIdx, -1)}
                          title="Geser soal ke atas"
                          aria-label={`Geser soal ${origIdx + 1} ke atas`}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-35 text-[11px] font-bold text-slate-200"
                        >
                          ⬆️
                        </button>
                        <button
                          type="button"
                          disabled={origIdx === studioQuestions.length - 1}
                          onClick={() => moveQuestion(origIdx, 1)}
                          title="Geser soal ke bawah"
                          aria-label={`Geser soal ${origIdx + 1} ke bawah`}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-35 text-[11px] font-bold text-slate-200"
                        >
                          ⬇️
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateQuestion(origIdx)}
                          title="Duplikat soal ini"
                          aria-label={`Duplikat soal ${origIdx + 1}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-amber-200"
                        >
                          📄 Duplikat
                        </button>
                        <label className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-sky-300 cursor-pointer">
                          🖼️ Gambar
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleQuestionImageUpload(origIdx, e)}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeQuestion(origIdx)}
                          aria-label={`Hapus soal ${origIdx + 1}`}
                          className="px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-[11px] font-bold text-rose-300"
                        >
                          🗑️ Hapus
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={q.question}
                      onChange={(e) => updateQuestionField(origIdx, { question: e.target.value })}
                      placeholder="Tulis teks pertanyaan di sini..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-semibold outline-none focus:border-indigo-400"
                    />

                    {q.image && (
                      <div className="flex items-center gap-2">
                        <img
                          src={q.image}
                          alt={`Lampiran soal ${origIdx + 1}`}
                          className="h-14 rounded-lg border border-slate-700 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuestionField(origIdx, { image: undefined })}
                          className="text-[11px] text-rose-300 underline"
                        >
                          Hapus gambar
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.choices.map((ch, cIdx) => {
                        const isKey = q.correctIndex === cIdx;
                        return (
                          <div key={cIdx} className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateQuestionField(origIdx, { correctIndex: cIdx })}
                              title={`Jadikan ${LETTERS[cIdx]} kunci jawaban`}
                              className={`w-7 h-7 rounded-lg text-[11px] font-extrabold flex items-center justify-center shrink-0 transition ${
                                isKey
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {LETTERS[cIdx]}
                            </button>
                            <input
                              type="text"
                              value={ch}
                              onChange={(e) => updateChoiceField(origIdx, cIdx, e.target.value)}
                              placeholder={`Opsi ${LETTERS[cIdx]}`}
                              className={`flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border text-xs outline-none focus:border-indigo-400 ${
                                isKey
                                  ? 'border-emerald-500/60 text-emerald-100'
                                  : 'border-slate-800 text-slate-200'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Kunci Jawaban
                        </label>
                        <select
                          value={q.correctIndex}
                          onChange={(e) =>
                            updateQuestionField(origIdx, { correctIndex: Number(e.target.value) })
                          }
                          aria-label={`Kunci jawaban soal ${origIdx + 1}`}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-emerald-300 font-bold outline-none"
                        >
                          {LETTERS.map((l, i) => (
                            <option key={l} value={i}>
                              Jawaban {l}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Pembahasan Soal
                        </label>
                        <textarea
                          rows={2}
                          value={q.explanation}
                          onChange={(e) =>
                            updateQuestionField(origIdx, { explanation: e.target.value })
                          }
                          placeholder="Penjelasan singkat jawaban benar..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {studioQuestions.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={addBlankQuestion}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-indigo-200 transition"
                >
                  + Tambah Soal Baru
                </button>
                <button
                  type="button"
                  onClick={onPublishRoom}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs transition"
                >
                  💾 Simpan Semua Perubahan Soal ke Cloud
                </button>
              </div>
            )}
          </div>

          {/* Persistent Participant History & Certificates Archive */}
          <div className="glass-card p-5 rounded-3xl space-y-4 border-emerald-500/25">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span aria-hidden="true">🗄️</span> Arsip Riwayat Nilai &amp; Sertifikat Peserta (
                  {history.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Tersimpan permanen di <strong>Database Cloud Firebase</strong> &amp; perangkat
                  lokal — hanya Admin terverifikasi yang dapat menghapus arsip.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Cari nama / room..."
                  aria-label="Cari riwayat peserta"
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none w-36 sm:w-44"
                />
                <button
                  type="button"
                  onClick={onRequestClearAllHistory}
                  disabled={history.length === 0}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/25 hover:bg-rose-600/40 disabled:opacity-40 border border-rose-500/40 text-rose-300 text-xs font-bold shrink-0 whitespace-nowrap"
                >
                  🗑️ Hapus Semua
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 max-h-72 custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 text-[11px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">Room</th>
                    <th className="py-2.5 px-3">Judul Kuis</th>
                    <th className="py-2.5 px-3">Nama Peserta</th>
                    <th className="py-2.5 px-3 text-center">Nilai</th>
                    <th className="py-2.5 px-3 text-right">Poin</th>
                    <th className="py-2.5 px-3 text-center">Sertifikat</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/60">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-400">
                        Belum ada data riwayat peserta.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((rec, idx) => (
                      <tr key={rec.id}>
                        <td className="py-2.5 px-3 text-slate-400 tabular-nums">{idx + 1}</td>
                        <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                          {new Date(rec.timestamp).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-300">
                          {rec.roomCode}
                        </td>
                        <td className="py-2.5 px-3 text-slate-200 max-w-[140px] truncate">
                          {rec.quizTitle}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white">{rec.playerName}</td>
                        <td className="py-2.5 px-3 text-center font-extrabold text-emerald-300 tabular-nums">
                          {rec.grade}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-indigo-300 tabular-nums">
                          {rec.points}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => onDownloadHistoryCertificate(rec)}
                            className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 font-bold text-[11px]"
                          >
                            📜 PNG
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => onRequestDeleteHistoryItem(rec)}
                            aria-label={`Hapus riwayat ${rec.playerName}`}
                            className="px-2 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold text-[11px]"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Teaching Zoom Management (Khusus Admin) */}
          <div className="glass-card p-5 rounded-3xl space-y-4 border-rose-500/35">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span aria-hidden="true">🎥</span> Live Teaching — Upload Link Zoom ({liveSessions.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Hanya Admin terverifikasi yang dapat mengunggah &amp; mengelola link Zoom Live Teaching. Semua peserta dapat langsung bergabung.
                </p>
              </div>
              <span className="text-[11px] font-bold text-rose-300">Khusus Admin</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Judul Kelas Live Teaching
                </label>
                <input
                  type="text"
                  value={liveTitle}
                  onChange={(e) => setLiveTitle(e.target.value)}
                  placeholder="Contoh: Bedah Soal SKD Kedinasan & Trik Cepat TIU"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-semibold outline-none focus:border-rose-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Nama Pengajar / Mentor
                </label>
                <input
                  type="text"
                  value={liveTutor}
                  onChange={(e) => setLiveTutor(e.target.value)}
                  placeholder="Contoh: Kak Hafiz, S.Si"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-rose-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Kategori Kelas
                </label>
                <select
                  value={liveCategory}
                  onChange={(e) => setLiveCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-rose-100 font-bold outline-none focus:border-rose-400"
                >
                  <option value="UTBK-SNBT">UTBK &amp; SNBT</option>
                  <option value="Kedinasan">Kedinasan (SKD)</option>
                  <option value="TKA Saintek">TKA Saintek</option>
                  <option value="TKA Soshum">TKA Soshum</option>
                  <option value="Kelas X–XII">Kelas X–XII SMA/MA</option>
                  <option value="ASAS XII">ASAS XII</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Jadwal / Waktu
                </label>
                <input
                  type="text"
                  value={liveSchedule}
                  onChange={(e) => setLiveSchedule(e.target.value)}
                  placeholder="Contoh: Hari ini · 19.30 WIB"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-rose-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Link Meeting Zoom
                </label>
                <input
                  type="url"
                  value={liveZoomUrl}
                  onChange={(e) => setLiveZoomUrl(e.target.value)}
                  placeholder="https://zoom.us/j/1234567890"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-sky-200 outline-none focus:border-rose-400"
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  id="live-is-now"
                  type="checkbox"
                  checked={liveIsNow}
                  onChange={(e) => setLiveIsNow(e.target.checked)}
                  className="rounded border-slate-600"
                />
                <label htmlFor="live-is-now" className="text-xs font-semibold text-rose-200">
                  Tandai sebagai SEDANG LIVE SEKARANG
                </label>
              </div>
            </div>

            <button
              type="button"
              disabled={savingLive}
              onClick={handleSubmitLiveSession}
              className="btn-3d w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 disabled:opacity-60 text-white font-extrabold text-xs sm:text-sm"
            >
              {savingLive ? 'Mempublikasikan Link Zoom...' : '🎥 Publikasikan Link Zoom Live Teaching'}
            </button>

            {liveSessions.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1 pt-2 border-t border-slate-800">
                {liveSessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">
                        {sess.isLive ? '🔴 LIVE · ' : '🕒 '}
                        {sess.title}
                      </p>
                      <p className="text-[11px] text-rose-300 truncate">
                        {sess.category} · {sess.tutorName} · {sess.scheduleLabel}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onSaveLiveSession({ ...sess, isLive: !sess.isLive })}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-200 font-bold text-[11px]"
                      >
                        {sess.isLive ? 'Set Jadwal' : 'Set LIVE'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteLiveSession(sess.id)}
                        className="px-2 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold text-[11px]"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload & Kelola Materi Belajar (UTBK, Kedinasan, Modul TKA, Kelas X-XII + Video YouTube & PPT) */}
          <div className="glass-card p-5 rounded-3xl space-y-4 border-cyan-500/35">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span aria-hidden="true">📘</span> Upload &amp; Kelola Materi Belajar ({uploadedMaterials.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Unggah materi <strong>Kelas X–XII</strong>, <strong>Kedinasan</strong>, <strong>UTBK-SNBT</strong>, &amp; <strong>Modul TKA</strong> — mendukung <strong>Video Link YouTube</strong> &amp; <strong>Slide PPT</strong>.
                </p>
              </div>
              <label className="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/40 text-cyan-200 font-bold text-xs cursor-pointer whitespace-nowrap">
                📄 Isi dari File (.DOCX/.TXT/.MD)
                <input
                  type="file"
                  accept=".docx,.txt,.md"
                  className="hidden"
                  onChange={handleMaterialFileUpload}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Portal Tujuan Materi
                </label>
                <select
                  value={matTarget}
                  onChange={(e) => setMatTarget(e.target.value as MaterialTarget)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-cyan-100 font-bold outline-none focus:border-cyan-400"
                >
                  <option value="sma-X">Materi Kelas X SMA/MA (Video &amp; PPT)</option>
                  <option value="sma-XI">Materi Kelas XI SMA/MA (Video &amp; PPT)</option>
                  <option value="sma-XII">Materi Kelas XII SMA/MA (Video &amp; PPT)</option>
                  <option value="kedinasan">Portal Kedinasan (Modul &amp; Video SKD)</option>
                  <option value="utbk">Materi UTBK &amp; SNBT</option>
                  <option value="tka-saintek">Modul TKA Saintek</option>
                  <option value="tka-soshum">Modul TKA Soshum</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Mata Pelajaran / Subtes
                </label>
                <input
                  type="text"
                  value={matSubject}
                  onChange={(e) => setMatSubject(e.target.value)}
                  placeholder="Contoh: TWK / TIU / Matematika X / Fisika XII"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Judul Materi
                </label>
                <input
                  type="text"
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  placeholder="Contoh: Eksponen & Logaritma Lengkap + Video Pembahasan"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-semibold outline-none focus:border-cyan-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-rose-300 mb-1">
                  🎬 Link Video YouTube (Opsional — Otomatis diputar di halaman materi)
                </label>
                <input
                  type="url"
                  value={matYoutubeUrl}
                  onChange={(e) => setMatYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-rose-400/35 text-xs text-rose-100 outline-none focus:border-rose-400"
                />
              </div>
              {/* Universal File Upload for PPT & Any File Type + Optional External Link */}
              <div className="sm:col-span-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/35 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-extrabold text-amber-200">
                      📊 Upload File PPT / Lampiran Materi (Segala Jenis File)
                    </p>
                    <p className="text-[11px] text-slate-300">
                      Mendukung .PPT, .PPTX, .PDF, .DOCX, .XLSX, .ZIP, Gambar, Video, Audio, dll. (maks. 25 MB) atau tempel link.
                    </p>
                  </div>
                  <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs whitespace-nowrap transition shrink-0">
                    <span>{uploadingPptFile ? '⏳ Mengunggah...' : '📤 Pilih File Apa Saja'}</span>
                    <input
                      type="file"
                      disabled={uploadingPptFile}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          void handleUploadMaterialAttachment(f);
                        }
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {matPptUrl && (
                  <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-emerald-400/35 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-emerald-300 truncate">
                        ✅ {matPptName || 'File Lampiran Terpasang'}
                        {matPptSizeLabel ? ` (${matPptSizeLabel})` : ''}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{matPptUrl}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMatPptUrl('');
                        setMatPptName('');
                        setMatPptSizeLabel('');
                      }}
                      className="px-2 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold text-[11px] shrink-0"
                    >
                      ✕ Hapus
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-300/90 mb-1">
                      🔗 Atau Tempel Link PPT / Google Slides / Drive (Opsional)
                    </label>
                    <input
                      type="text"
                      value={matPptUrl}
                      onChange={(e) => {
                        setMatPptUrl(e.target.value);
                        setMatPptSizeLabel('');
                      }}
                      placeholder="https://docs.google.com/presentation/... atau otomatis terisi setelah upload"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-400/35 text-xs text-amber-100 outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-300/90 mb-1">
                      Nama File / Slide (Opsional)
                    </label>
                    <input
                      type="text"
                      value={matPptName}
                      onChange={(e) => setMatPptName(e.target.value)}
                      placeholder="Contoh: Slide Bab 1 Eksponen.pptx"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-400/35 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Ringkasan / Isi Materi
                </label>
                <textarea
                  rows={3}
                  value={matSummary}
                  onChange={(e) => setMatSummary(e.target.value)}
                  placeholder="Tulis ringkasan konsep atau unggah file .DOCX/.TXT di atas..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Poin Kunci (1 baris = 1 poin, opsional)
                </label>
                <textarea
                  rows={2}
                  value={matKeyPointsText}
                  onChange={(e) => setMatKeyPointsText(e.target.value)}
                  placeholder={'Poin 1...\nPoin 2...'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Rumus / Kaidah Penting (1 baris = 1 rumus, opsional)
                </label>
                <textarea
                  rows={2}
                  value={matFormulasText}
                  onChange={(e) => setMatFormulasText(e.target.value)}
                  placeholder={'F = m · a\npH = -log[H+]'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={savingMaterial}
              onClick={handleSubmitMaterial}
              className="btn-3d w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 disabled:opacity-60 text-slate-950 font-extrabold text-xs sm:text-sm"
            >
              {savingMaterial ? 'Menyimpan Materi...' : '📘 Simpan & Publikasikan Materi Belajar'}
            </button>

            {uploadedMaterials.length > 0 && (
              <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar pr-1 pt-2 border-t border-slate-800">
                {uploadedMaterials.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">
                        {m.title}
                        {m.youtubeUrl ? ' 🎬' : ''}
                        {m.pptUrl ? ' 📊' : ''}
                      </p>
                      <p className="text-[11px] text-cyan-300 truncate">
                        {m.portal === 'sma'
                          ? `Kelas ${m.grade}`
                          : m.portal === 'kedinasan'
                            ? 'Portal Kedinasan'
                            : m.portal === 'tka'
                              ? `Modul TKA ${m.tkaTrack || ''}`
                              : 'Materi UTBK-SNBT'}{' '}
                        · {m.subject}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteMaterial(m.id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold text-[11px] shrink-0"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Website Update & CMS Panel (Admin Only) */}
          <div className="glass-card p-5 rounded-3xl space-y-4 border-sky-500/35">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span aria-hidden="true">🌐</span> Akses Update Web &amp; Pengaturan Situs (Live)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Ubah nama platform, judul utama, deskripsi, atau pasang banner pengumuman langsung
                  ke seluruh pengunjung web secara real-time.
                </p>
              </div>
              <span className="text-[11px] font-bold text-sky-300">Khusus Admin</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Nama Website / Brand
                </label>
                <input
                  type="text"
                  maxLength={80}
                  value={siteDraft.brandName}
                  onChange={(e) => setSiteDraft((s) => ({ ...s, brandName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold outline-none focus:border-sky-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Tagline Atas (Sub-Header)
                </label>
                <input
                  type="text"
                  maxLength={160}
                  value={siteDraft.heroTagline}
                  onChange={(e) => setSiteDraft((s) => ({ ...s, heroTagline: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-sky-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Judul Utama Halaman Depan
                </label>
                <input
                  type="text"
                  maxLength={160}
                  value={siteDraft.heroTitle}
                  onChange={(e) => setSiteDraft((s) => ({ ...s, heroTitle: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold outline-none focus:border-sky-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Deskripsi Halaman Depan
                </label>
                <textarea
                  rows={2}
                  maxLength={400}
                  value={siteDraft.heroDescription}
                  onChange={(e) => setSiteDraft((s) => ({ ...s, heroDescription: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-sky-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-amber-300 mb-1">
                  📢 Banner Pengumuman Live (Kosongkan jika tidak ingin ditampilkan)
                </label>
                <input
                  type="text"
                  maxLength={300}
                  value={siteDraft.announcement}
                  onChange={(e) => setSiteDraft((s) => ({ ...s, announcement: e.target.value }))}
                  placeholder="Contoh: Kuis Olimpiade Sains dimulai pukul 09.00 WIB — Siapkan akun peserta!"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-xs text-amber-100 outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={savingSite}
              onClick={async () => {
                setSavingSite(true);
                try {
                  await onSaveSiteSettings(siteDraft);
                } finally {
                  setSavingSite(false);
                }
              }}
              className="btn-3d w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-60 text-white font-extrabold text-xs sm:text-sm"
            >
              {savingSite ? 'Menyimpan Update Web...' : '🚀 Publikasikan Update Web ke Semua Pengguna'}
            </button>
          </div>

          {/* Google Play Store, Apple App Store & Microsoft Store Launch & Publishing Center (Admin Only) */}
          <div id="admin-store-launch-center" className="glass-card p-5 rounded-3xl space-y-4 border-emerald-500/35">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span aria-hidden="true">🚀</span> Launch Center: Google Play Store, Apple App Store &amp; Microsoft Store
                </h3>
                <p className="text-[11px] text-slate-400">
                  Verifikasi kesiapan launching 3 store sekaligus, kemas paket build resmi (.AAB, .IPA, .MSIX) lewat PWABuilder, dan hubungkan URL store ke tombol unduhan seluruh pengguna.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(() => {
                  const links = resolveDirectStoreLinks(siteDraft);
                  return (
                    <>
                      <a
                        href={links.playStoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold transition whitespace-nowrap"
                      >
                        ▶ Play Store ↗
                      </a>
                      <a
                        href={links.appStoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-[11px] font-bold transition whitespace-nowrap"
                      >
                        🍎 App Store ↗
                      </a>
                      <a
                        href={links.microsoftStoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-[11px] font-bold transition whitespace-nowrap"
                      >
                        🪟 MS Store ↗
                      </a>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Live Store Launch Readiness & Direct Console Launchers */}
            {(() => {
              const currentOrigin =
                typeof window !== 'undefined' && window.location.hostname.endsWith('hafizeducation.my.id')
                  ? window.location.origin
                  : OFFICIAL_SITE_ORIGIN;
              const pwaBuilderUrl = buildPwaBuilderLaunchUrl(currentOrigin);
              const readinessList = evaluateStoreLaunchReadiness({
                origin: currentOrigin,
                playStoreUrl: siteDraft.playStoreUrl,
                appStoreUrl: siteDraft.appStoreUrl,
                microsoftStoreUrl: siteDraft.microsoftStoreUrl,
                androidPackageId: siteDraft.androidPackageId,
                iosBundleId: siteDraft.iosBundleId,
                appleTeamId: siteDraft.appleTeamId,
                microsoftStoreId: siteDraft.microsoftStoreId,
                microsoftAppGuid: siteDraft.microsoftAppGuid,
                androidSha256,
              });
              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {readinessList.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-white">{item.storeName}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              item.isLiveUrlPublished
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35'
                                : 'bg-sky-500/15 text-sky-200 border border-sky-400/30'
                            }`}
                          >
                            {item.isLiveUrlPublished ? 'LIVE LINK AKTIF' : 'SIAP KEMAS'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">{item.packageFormat}</p>
                        <p className="text-[11px] text-slate-200 leading-snug">{item.nextStepId}</p>
                        <div className="flex items-center justify-between gap-2 pt-1 text-[10px]">
                          <a
                            href={item.endpointPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-300 hover:underline truncate"
                          >
                            🔍 {item.endpointPath} ↗
                          </a>
                          <a
                            href={item.consoleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-amber-300 hover:underline shrink-0"
                          >
                            Console ↗
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/55 via-sky-950/50 to-indigo-950/55 border border-teal-400/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs space-y-0.5">
                      <p className="font-extrabold text-teal-200">
                        ⚡ Build Otomatis Paket .AAB (Play Store), .IPA (App Store) &amp; .MSIX (Microsoft Store)
                      </p>
                      <p className="text-[11px] text-slate-300">
                        Buka PWABuilder dengan URL web aktif untuk langsung menghasilkan paket instalasi siap unggah ke ketiga store developer console.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <a
                        id="btn-launch-pwabuilder"
                        href={pwaBuilderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold text-xs whitespace-nowrap transition"
                      >
                        🚀 Kemas di PWABuilder ↗
                      </a>
                      <a
                        href={STORE_DEVELOPER_CONSOLES.playConsole}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-400/40 text-emerald-200 font-bold text-[11px] whitespace-nowrap"
                      >
                        Play Console ↗
                      </a>
                      <a
                        href={STORE_DEVELOPER_CONSOLES.appStoreConnect}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-sky-400/40 text-sky-200 font-bold text-[11px] whitespace-nowrap"
                      >
                        App Store Connect ↗
                      </a>
                      <a
                        href={STORE_DEVELOPER_CONSOLES.microsoftPartnerCenter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-indigo-400/40 text-indigo-200 font-bold text-[11px] whitespace-nowrap"
                      >
                        MS Partner Center ↗
                      </a>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-emerald-300 mb-1">
                  Link Resmi Google Play Store (Opsional)
                </label>
                <input
                  type="url"
                  value={siteDraft.playStoreUrl || ''}
                  onChange={(e) => setSiteDraft((s) => ({ ...s, playStoreUrl: e.target.value }))}
                  placeholder="https://play.google.com/store/apps/details?id=com.hafizeducation.app"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/35 text-xs text-emerald-100 outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-sky-300 mb-1">
                  Link Resmi Apple App Store (Opsional)
                </label>
                <input
                  type="url"
                  value={siteDraft.appStoreUrl || ''}
                  onChange={(e) => setSiteDraft((s) => ({ ...s, appStoreUrl: e.target.value }))}
                  placeholder="https://apps.apple.com/id/app/hafiz-education/id1234567890"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-sky-500/35 text-xs text-sky-100 outline-none focus:border-sky-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-indigo-300 mb-1">
                  Link Resmi Microsoft Store (Windows · Opsional)
                </label>
                <input
                  type="url"
                  value={siteDraft.microsoftStoreUrl || ''}
                  onChange={(e) => setSiteDraft((s) => ({ ...s, microsoftStoreUrl: e.target.value }))}
                  placeholder="https://apps.microsoft.com/detail/9NXXXXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-indigo-500/35 text-xs text-indigo-100 outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Microsoft Store Product / App ID (Opsional)
                </label>
                <input
                  type="text"
                  value={siteDraft.microsoftStoreId || ''}
                  onChange={(e) => setSiteDraft((s) => ({ ...s, microsoftStoreId: e.target.value }))}
                  placeholder="9NXXXXXXXXXX (dari Microsoft Partner Center)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Android Package ID (Play Store)
                </label>
                <input
                  type="text"
                  value={siteDraft.androidPackageId ?? DEFAULT_STORE_DISTRIBUTION.androidPackageId}
                  onChange={(e) => setSiteDraft((s) => ({ ...s, androidPackageId: e.target.value }))}
                  placeholder="com.hafizeducation.app"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  iOS Bundle Identifier (App Store)
                </label>
                <input
                  type="text"
                  value={siteDraft.iosBundleId ?? DEFAULT_STORE_DISTRIBUTION.iosBundleId}
                  onChange={(e) => setSiteDraft((s) => ({ ...s, iosBundleId: e.target.value }))}
                  placeholder="com.hafizeducation.app"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono outline-none focus:border-sky-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Apple Developer Team ID (10 Karakter · Opsional)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={siteDraft.appleTeamId || ''}
                  onChange={(e) => setSiteDraft((s) => ({ ...s, appleTeamId: e.target.value.toUpperCase() }))}
                  placeholder="AB12CD34EF (untuk apple-app-site-association)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-sky-100 font-mono uppercase outline-none focus:border-sky-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Microsoft App Identity GUID (Opsional)
                </label>
                <input
                  type="text"
                  value={siteDraft.microsoftAppGuid || ''}
                  onChange={(e) => setSiteDraft((s) => ({ ...s, microsoftAppGuid: e.target.value }))}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-indigo-100 font-mono outline-none focus:border-indigo-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  SHA-256 Certificate Fingerprint Android (Untuk Verifikasi TWA Play Console)
                </label>
                <input
                  type="text"
                  value={androidSha256}
                  onChange={(e) => setAndroidSha256(e.target.value)}
                  placeholder="AA:BB:CC:DD:... (64 karakter hex dari Play Console / PWABuilder)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-amber-100 font-mono outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={savingStoreConfig}
                onClick={async () => {
                  setSavingStoreConfig(true);
                  try {
                    const sanitized = sanitizeStoreDistributionSettings({
                      playStoreUrl: siteDraft.playStoreUrl,
                      appStoreUrl: siteDraft.appStoreUrl,
                      microsoftStoreUrl: siteDraft.microsoftStoreUrl,
                      androidPackageId: siteDraft.androidPackageId,
                      iosBundleId: siteDraft.iosBundleId,
                      appleTeamId: siteDraft.appleTeamId,
                      microsoftStoreId: siteDraft.microsoftStoreId,
                      microsoftAppGuid: siteDraft.microsoftAppGuid,
                      androidSha256,
                    });
                    const updatedSiteDraft: SiteSettings = {
                      ...siteDraft,
                      playStoreUrl: sanitized.playStoreUrl,
                      appStoreUrl: sanitized.appStoreUrl,
                      microsoftStoreUrl: sanitized.microsoftStoreUrl,
                      androidPackageId: sanitized.androidPackageId,
                      iosBundleId: sanitized.iosBundleId,
                      appleTeamId: sanitized.appleTeamId,
                      microsoftStoreId: sanitized.microsoftStoreId,
                      microsoftAppGuid: sanitized.microsoftAppGuid,
                    };
                    setSiteDraft(updatedSiteDraft);
                    setAndroidSha256(sanitized.androidSha256);
                    try {
                      localStorage.setItem('hafiz_android_sha256_v1', sanitized.androidSha256);
                    } catch {
                      // ignore storage error
                    }
                    const tokenRes = await fetch('/api/session-token', { credentials: 'same-origin' });
                    const tokenJson = (await tokenRes.json()) as { token?: string };
                    if (tokenJson.token) {
                      await fetch('/api/store-config', {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: {
                          'Content-Type': 'application/json',
                          'X-Hafiz-Token': tokenJson.token,
                        },
                        body: JSON.stringify({
                          androidPackageId: sanitized.androidPackageId,
                          androidSha256: sanitized.androidSha256,
                          iosBundleId: sanitized.iosBundleId,
                          appleTeamId: sanitized.appleTeamId,
                          microsoftStoreId: sanitized.microsoftStoreId,
                          microsoftAppGuid: sanitized.microsoftAppGuid,
                        }),
                      });
                    }
                    await onSaveSiteSettings(updatedSiteDraft);
                    onNotify('✅ Konfigurasi Play Store, App Store, Microsoft Store & Verifikasi Domain disimpan!', 'success');
                  } catch {
                    onNotify('Gagal menyimpan konfigurasi Play Store / App Store / Microsoft Store.', 'error');
                  } finally {
                    setSavingStoreConfig(false);
                  }
                }}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-60 text-slate-950 font-extrabold text-xs transition"
              >
                {savingStoreConfig ? 'Menyimpan...' : '💾 Simpan Konfigurasi 3 Store & Verifikasi'}
              </button>

              <button
                type="button"
                disabled={exportingStoreZip}
                onClick={async () => {
                  setExportingStoreZip(true);
                  try {
                    const pkg = sanitizePackageId(siteDraft.androidPackageId);
                    const iosId = sanitizePackageId(siteDraft.iosBundleId);
                    const teamId = sanitizeAppleTeamId(siteDraft.appleTeamId);
                    const msId = sanitizeMicrosoftStoreId(siteDraft.microsoftStoreId);
                    const msGuid = sanitizeUuidGuid(siteDraft.microsoftAppGuid);
                    const fp = sanitizeSha256Fingerprint(androidSha256);
                    const origin = window.location.hostname.endsWith('hafizeducation.my.id')
                      ? window.location.origin
                      : OFFICIAL_SITE_ORIGIN;

                    const zip = new JSZip();
                    zip.file('twa-manifest.json', generateTwaManifestJson({
                      origin,
                      brandName: siteDraft.brandName,
                      shortName: 'HafizEdu',
                      packageId: pkg,
                    }));
                    zip.file('.well-known/assetlinks.json', generateAssetLinksJson(pkg, fp ? [fp] : []));
                    zip.file(
                      '.well-known/apple-app-site-association',
                      generateAppleAppSiteAssociationJson(iosId, teamId)
                    );
                    zip.file(
                      '.well-known/microsoft-identity-association.json',
                      generateMicrosoftIdentityAssociationJson(msGuid)
                    );
                    zip.file('capacitor.config.json', generateCapacitorConfigJson({
                      origin,
                      brandName: siteDraft.brandName,
                      iosBundleId: iosId,
                    }));
                    zip.file('microsoft-store-config.json', generateMicrosoftStoreConfigJson({
                      origin,
                      brandName: siteDraft.brandName,
                      publisherDisplayName: siteDraft.brandName,
                      microsoftStoreId: msId,
                      packageId: pkg,
                    }));
                    zip.file('PANDUAN_UPLOAD_ALL_STORES.txt', generateStorePublishingGuide({
                      origin,
                      androidPackageId: pkg,
                      iosBundleId: iosId,
                      appleTeamId: teamId,
                      microsoftStoreId: msId,
                    }));

                    const blob = await zip.generateAsync({ type: 'blob' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `hafizedu-play-app-microsoft-store-bundle.zip`;
                    a.click();
                    URL.revokeObjectURL(url);
                    onNotify('📦 Paket lengkap Play Store (.AAB), App Store (.IPA) & Microsoft Store (.MSIX) berhasil diunduh!', 'success');
                  } catch {
                    onNotify('Gagal membuat paket ekspor Store.', 'error');
                  } finally {
                    setExportingStoreZip(false);
                  }
                }}
                className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-sky-400/45 text-sky-100 font-extrabold text-xs transition"
              >
                {exportingStoreZip ? 'Membuat ZIP...' : '📦 Ekspor Paket Launch 3 Store (.ZIP)'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Database Peserta Terdaftar (Akun Tanpa Google + Firebase + Upload Foto Profil) */}
      <div id="admin-participant-database" className="glass-card p-5 sm:p-6 rounded-3xl space-y-4 border-sky-500/35">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span aria-hidden="true">👥</span> Database Peserta Terdaftar ({participants.length})
            </h3>
            <p className="text-[11px] text-slate-400">
              Kelola seluruh peserta yang mendaftar &amp; login (Nama + Kata Sandi atau Google), tambahkan peserta baru, dan upload foto profil peserta langsung dari panel ini.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={participantSearch}
              onChange={(e) => setParticipantSearch(e.target.value)}
              placeholder="Cari nama / username..."
              aria-label="Cari peserta terdaftar"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none w-36 sm:w-44"
            />
            {onAdminUpsertParticipant && (
              <button
                type="button"
                id="btn-toggle-add-participant"
                onClick={() => {
                  if (showAddParticipantForm && !editingParticipantUid) {
                    setShowAddParticipantForm(false);
                  } else {
                    resetParticipantEditor();
                    setShowAddParticipantForm(true);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 whitespace-nowrap transition"
              >
                {showAddParticipantForm && !editingParticipantUid
                  ? 'Tutup Form'
                  : '+ Tambah Peserta & Foto'}
              </button>
            )}
            {onRefreshParticipants && (
              <button
                type="button"
                onClick={onRefreshParticipants}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-200 text-xs font-bold shrink-0 whitespace-nowrap transition"
              >
                Muat Ulang
              </button>
            )}
            <button
              type="button"
              onClick={handleExportParticipantsExcel}
              disabled={participants.length === 0}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 disabled:opacity-40 border border-emerald-400/40 text-emerald-200 text-xs font-bold shrink-0 whitespace-nowrap"
            >
              📥 Excel Peserta
            </button>
            {onRequestClearAllParticipants && (
              <button
                type="button"
                id="btn-admin-clear-all-participants"
                onClick={onRequestClearAllParticipants}
                disabled={participants.length === 0}
                className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 disabled:opacity-40 border border-rose-500/40 text-rose-200 text-xs font-bold shrink-0 whitespace-nowrap transition"
              >
                🗑️ Hapus Semua
              </button>
            )}
          </div>
        </div>

        {/* Admin Add / Edit Participant Profile & Photo Form */}
        {showAddParticipantForm && onAdminUpsertParticipant && (
          <form
            id="admin-participant-upsert-form"
            onSubmit={handleSubmitParticipantForm}
            className="p-4 rounded-2xl bg-slate-950/85 border border-indigo-400/35 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs sm:text-sm font-extrabold text-indigo-200">
                {editingParticipantUid
                  ? `Perbarui Profil & Foto: ${pFormName}`
                  : 'Tambah Peserta Baru & Upload Foto Profil'}
              </p>
              <button
                type="button"
                onClick={() => {
                  resetParticipantEditor();
                  setShowAddParticipantForm(false);
                }}
                className="text-[11px] font-bold text-slate-400 hover:text-white"
              >
                Batal ✕
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex items-center gap-3 shrink-0">
                {pFormPhoto ? (
                  <img
                    src={pFormPhoto}
                    alt="Preview Foto Peserta"
                    className="w-16 h-16 rounded-2xl object-cover border border-indigo-400/50"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-dashed border-slate-700 flex items-center justify-center text-[11px] text-slate-400 text-center px-1">
                    Belum ada foto
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="inline-block cursor-pointer px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-[11px] font-bold transition">
                    {pFormPhoto ? 'Ganti Foto Profil' : 'Upload Foto Peserta'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleSelectParticipantPhotoFile(f);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {pFormPhoto && (
                    <button
                      type="button"
                      onClick={() => setPFormPhoto('')}
                      className="block text-[10px] text-rose-300 hover:underline font-semibold"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 w-full">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={pFormName}
                    onChange={(e) => setPFormName(e.target.value)}
                    placeholder="Nama Peserta"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">
                    Username Login (Opsional)
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    value={pFormUsername}
                    onChange={(e) => setPFormUsername(e.target.value)}
                    placeholder="misal: ahmad.rizky"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">
                    {editingParticipantUid
                      ? 'Kata Sandi Baru (Opsional)'
                      : 'Kata Sandi Login (Min. 6)'}
                  </label>
                  <input
                    type="text"
                    maxLength={72}
                    value={pFormPassword}
                    onChange={(e) => setPFormPassword(e.target.value)}
                    placeholder={
                      editingParticipantUid ? 'Kosongkan jika tetap' : 'Default: 123456'
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">
                    Asal Sekolah / Instansi
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    value={pFormSchool}
                    onChange={(e) => setPFormSchool(e.target.value)}
                    placeholder="SMAN 1 / MAN IC"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">
                    Jalur Target
                  </label>
                  <select
                    value={pFormTrack}
                    onChange={(e) =>
                      setPFormTrack(e.target.value as 'utbk' | 'kedinasan' | 'both')
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-indigo-400"
                  >
                    <option value="utbk">SNBT / UTBK</option>
                    <option value="kedinasan">Sekolah Kedinasan</option>
                    <option value="both">UTBK + Kedinasan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">
                    Target Kampus / Prodi
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={pFormCampus}
                    onChange={(e) => setPFormCampus(e.target.value)}
                    placeholder="ITB / UI / PKN STAN"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="submit"
                disabled={savingParticipantForm}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-xs transition"
              >
                {savingParticipantForm
                  ? 'Menyimpan...'
                  : editingParticipantUid
                    ? 'Simpan Profil & Foto Peserta'
                    : 'Tambahkan ke Database Peserta'}
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto rounded-2xl border border-slate-800 max-h-80 custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 text-[11px] sticky top-0">
              <tr>
                <th className="py-2.5 px-3">No</th>
                <th className="py-2.5 px-3">Profil Peserta</th>
                <th className="py-2.5 px-3">Akun / Login</th>
                <th className="py-2.5 px-3">Sekolah &amp; Target</th>
                <th className="py-2.5 px-3 text-center">SKD</th>
                <th className="py-2.5 px-3 text-center">Kuis</th>
                <th className="py-2.5 px-3 text-center">Nilai Tertinggi</th>
                <th className="py-2.5 px-3 text-right">Total Poin</th>
                <th className="py-2.5 px-3 text-right">Terakhir Aktif</th>
                {(onRequestDeleteParticipant || onAdminUpsertParticipant) && (
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/60">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td
                    colSpan={onRequestDeleteParticipant || onAdminUpsertParticipant ? 10 : 9}
                    className="py-6 text-center text-slate-400"
                  >
                    {isGoogleAdminVerified || canManageParticipantDb
                      ? 'Belum ada peserta terdaftar. Klik "+ Tambah Peserta & Foto" atau tunggu peserta mendaftar.'
                      : 'Buka sesi Admin untuk memuat Database Peserta.'}
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p, idx) => (
                  <tr key={p.uid}>
                    <td className="py-2.5 px-3 text-slate-400 tabular-nums">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        {p.photoUrl ? (
                          <img
                            src={p.photoUrl}
                            alt={p.displayName}
                            className="w-8 h-8 rounded-full object-cover border border-sky-400/50 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center text-[11px] font-bold text-indigo-200 shrink-0">
                            {(p.displayName || 'P').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="font-bold text-white whitespace-nowrap">{p.displayName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[11px]">
                      {p.username ? (
                        <span className="block font-mono text-indigo-300 font-semibold">
                          @{p.username}
                        </span>
                      ) : null}
                      <span className="block text-sky-300 font-mono truncate max-w-[180px]">
                        {p.email && !p.email.endsWith('@peserta.hafizeducation.my.id')
                          ? p.email
                          : p.authMethod === 'password'
                            ? 'Akun Tanpa Google'
                            : p.email}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-300">
                      <span className="block font-semibold text-white/90">{p.school || '-'}</span>
                      {p.targetCampus && (
                        <span className="block text-teal-300 truncate max-w-[170px]">{p.targetCampus}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-purple-300 tabular-nums">
                      {p.savedSkdSummary ? p.savedSkdSummary.total : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-200 tabular-nums">{p.quizCount}x</td>
                    <td className="py-2.5 px-3 text-center font-extrabold text-emerald-300 tabular-nums">
                      {p.bestGrade}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-cyan-300 tabular-nums">
                      {p.totalPoints}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400 whitespace-nowrap">
                      {new Date(p.updatedAt).toLocaleDateString('id-ID')}
                    </td>
                    {(onRequestDeleteParticipant || onAdminUpsertParticipant) && (
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {onAdminUpsertParticipant && (
                            <button
                              type="button"
                              onClick={() => openEditParticipant(p)}
                              aria-label={`Upload foto atau edit ${p.displayName}`}
                              title="Upload Foto / Edit Profil"
                              className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/40 text-sky-200 font-bold text-[11px] whitespace-nowrap transition"
                            >
                              Foto / Edit
                            </button>
                          )}
                          {onRequestDeleteParticipant && (
                            <button
                              type="button"
                              onClick={() => onRequestDeleteParticipant(p)}
                              aria-label={`Hapus peserta ${p.displayName}`}
                              title={`Hapus peserta ${p.displayName}`}
                              className="px-2.5 py-1 rounded-lg bg-rose-950/90 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-[11px] whitespace-nowrap transition"
                            >
                              🗑️ Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
