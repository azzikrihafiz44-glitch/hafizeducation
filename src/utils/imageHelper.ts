import type { QuizQuestion } from '../types/quiz';
import { stripHtmlAndXmlToText } from './quizLogic';

export interface QuestionImageBBox {
  page: number;
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export type ExtractedQuestionWithBBox = QuizQuestion & {
  imageBBox?: QuestionImageBBox;
};

const VISUAL_QUESTION_HINT_REGEX =
  /(?:perhatikan|gambar|grafik|diagram|tabel|bagan|kurva|peta|rangkaian|bangun|skema|ilustrasi|foto|simbol|berikut\s+ini|di\s+bawah\s+ini|di\s+samping)/i;

export function clampNormalizedBBox(
  raw: Partial<QuestionImageBBox> | null | undefined
): QuestionImageBBox | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const page = Math.max(1, Math.min(200, Math.round(Number(raw.page || 1))));
  const ymin = Math.max(0, Math.min(990, Math.round(Number(raw.ymin ?? 0))));
  const xmin = Math.max(0, Math.min(990, Math.round(Number(raw.xmin ?? 0))));
  const ymax = Math.max(ymin + 10, Math.min(1000, Math.round(Number(raw.ymax ?? 0))));
  const xmax = Math.max(xmin + 10, Math.min(1000, Math.round(Number(raw.xmax ?? 0))));

  if (!Number.isFinite(ymin) || !Number.isFinite(xmin) || !Number.isFinite(ymax) || !Number.isFinite(xmax)) {
    return undefined;
  }
  if (ymax - ymin < 25 || xmax - xmin < 25) {
    return undefined;
  }
  return { page, ymin, xmin, ymax, xmax };
}

export function compressDataUrlImage(
  dataUrl: string,
  maxWidth = 720,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      try {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function extractHtmlImagesAndPlaceholders(html: string): {
  textWithPlaceholders: string;
  images: string[];
} {
  const images: string[] = [];
  const replacedHtml = html.replace(
    /<img\b[^>]*\bsrc=["'](data:image\/[^"']+)["'][^>]*>/gi,
    (_match, src: string) => {
      const idx = images.length;
      images.push(src);
      return `\n[[IMG_${idx}]]\n`;
    }
  );
  return {
    textWithPlaceholders: stripHtmlAndXmlToText(replacedHtml),
    images,
  };
}

export function attachImagesToQuestions(
  questions: QuizQuestion[],
  images: string[]
): QuizQuestion[] {
  if (images.length === 0) return questions;

  const tokenRegex = /\[\[IMG_(\d+)\]\]/g;
  const usedIndices = new Set<number>();

  const attached = questions.map((q) => {
    let foundImage: string | undefined = q.image;

    const extractFromField = (text: string): string =>
      text
        .replace(tokenRegex, (_m, numStr: string) => {
          const idx = Number(numStr);
          if (idx >= 0 && idx < images.length) {
            usedIndices.add(idx);
            if (!foundImage) {
              foundImage = images[idx];
            }
          }
          return '';
        })
        .replace(/\s{2,}/g, ' ')
        .trim();

    const cleanQuestion = extractFromField(q.question);
    const cleanChoices = q.choices.map((c) => extractFromField(c)) as [
      string,
      string,
      string,
      string,
      string,
    ];
    const cleanExplanation = extractFromField(q.explanation);

    return {
      ...q,
      question: cleanQuestion || q.question,
      choices: cleanChoices,
      explanation: cleanExplanation || q.explanation,
      image: foundImage,
    };
  });

  // Fallback when extracted images exist but AI or text parser stripped [[IMG_N]] markers:
  // 1) If image count == question count -> attach 1-to-1
  // 2) Otherwise distribute remaining images sequentially to questions referencing visual cues first
  const remainingImages = images.filter((_, idx) => !usedIndices.has(idx));
  if (remainingImages.length > 0 && attached.length > 0) {
    const result = [...attached];
    if (usedIndices.size === 0 && images.length === attached.length) {
      return result.map((q, i) => (q.image ? q : { ...q, image: images[i] }));
    }

    let imgCursor = 0;
    for (let i = 0; i < result.length && imgCursor < remainingImages.length; i++) {
      if (!result[i].image && VISUAL_QUESTION_HINT_REGEX.test(result[i].question)) {
        result[i] = { ...result[i], image: remainingImages[imgCursor] };
        imgCursor += 1;
      }
    }

    if (imgCursor === 0 && remainingImages.length === 1 && result.length === 1 && !result[0].image) {
      result[0] = { ...result[0], image: remainingImages[0] };
    }

    return result;
  }

  return attached;
}

/**
 * Automatically uploads a base64 / data URL question image to the server (/api/upload-question-image)
 * so every image inside an uploaded file becomes a persistent lightweight URL instead of bloating Firestore.
 * Falls back cleanly to the compressed data URL if offline or server upload fails.
 */
export async function uploadQuestionImageToServer(
  dataUrl: string,
  cachedToken?: string
): Promise<{ url: string; uploaded: boolean }> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return { url: dataUrl, uploaded: false };
  }
  try {
    let token = cachedToken;
    if (!token) {
      const tokenRes = await fetch('/api/session-token', {
        method: 'GET',
        credentials: 'same-origin',
      });
      const tokenData = (await tokenRes.json()) as { ok?: boolean; token?: string };
      if (!tokenRes.ok || !tokenData.token) {
        return { url: dataUrl, uploaded: false };
      }
      token = tokenData.token;
    }

    const res = await fetch('/api/upload-question-image', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-Hafiz-Token': token,
      },
      body: JSON.stringify({ dataUrl }),
    });
    const data = (await res.json()) as { ok?: boolean; url?: string };
    if (res.ok && data.ok && data.url) {
      return { url: data.url, uploaded: true };
    }
    return { url: dataUrl, uploaded: false };
  } catch {
    return { url: dataUrl, uploaded: false };
  }
}

export async function autoUploadQuestionImages(
  questions: QuizQuestion[],
  onProgress?: (uploadedCount: number, totalImages: number) => void
): Promise<{ questions: QuizQuestion[]; uploadedCount: number; totalImages: number }> {
  const indicesToUpload = questions
    .map((q, idx) => ({ idx, img: q.image }))
    .filter((item): item is { idx: number; img: string } =>
      Boolean(item.img && item.img.startsWith('data:image/'))
    );

  if (indicesToUpload.length === 0) {
    return { questions, uploadedCount: 0, totalImages: 0 };
  }

  let sharedToken: string | undefined;
  try {
    const tokenRes = await fetch('/api/session-token', {
      method: 'GET',
      credentials: 'same-origin',
    });
    const tokenData = (await tokenRes.json()) as { ok?: boolean; token?: string };
    if (tokenRes.ok && tokenData.token) {
      sharedToken = tokenData.token;
    }
  } catch {
    return { questions, uploadedCount: 0, totalImages: indicesToUpload.length };
  }

  const nextQuestions = [...questions];
  let uploadedCount = 0;
  for (const item of indicesToUpload) {
    const compressed = await compressDataUrlImage(item.img, 840, 0.8);
    const { url, uploaded } = await uploadQuestionImageToServer(compressed, sharedToken);
    if (uploaded) uploadedCount += 1;
    nextQuestions[item.idx] = {
      ...nextQuestions[item.idx],
      image: url,
    };
    onProgress?.(uploadedCount, indicesToUpload.length);
  }

  return {
    questions: nextQuestions,
    uploadedCount,
    totalImages: indicesToUpload.length,
  };
}
