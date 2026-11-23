import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { QuizQuestion } from '../types/quiz';
import {
  clampNormalizedBBox,
  compressDataUrlImage,
  type QuestionImageBBox,
} from './imageHelper';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

export type QuestionWithOptionalBBox = QuizQuestion & {
  imageBBox?: QuestionImageBBox;
};

function cropCanvasRegionToJpeg(
  sourceCanvas: HTMLCanvasElement | HTMLImageElement,
  srcWidth: number,
  srcHeight: number,
  bbox: QuestionImageBBox
): string | undefined {
  const padX = Math.round(srcWidth * 0.02);
  const padY = Math.round(srcHeight * 0.02);

  const sx = Math.max(0, Math.floor((bbox.xmin / 1000) * srcWidth) - padX);
  const sy = Math.max(0, Math.floor((bbox.ymin / 1000) * srcHeight) - padY);
  const ex = Math.min(srcWidth, Math.ceil((bbox.xmax / 1000) * srcWidth) + padX);
  const ey = Math.min(srcHeight, Math.ceil((bbox.ymax / 1000) * srcHeight) + padY);

  const cw = ex - sx;
  const ch = ey - sy;
  if (cw < 24 || ch < 24) return undefined;

  const maxTargetWidth = 900;
  const scale = cw > maxTargetWidth ? maxTargetWidth / cw : 1;
  const outW = Math.max(1, Math.round(cw * scale));
  const outH = Math.max(1, Math.round(ch * scale));

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = outW;
  cropCanvas.height = outH;
  const ctx = cropCanvas.getContext('2d');
  if (!ctx) return undefined;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(sourceCanvas, sx, sy, cw, ch, 0, 0, outW, outH);
  return cropCanvas.toDataURL('image/jpeg', 0.84);
}

/**
 * Automatically extracts cropped question diagrams from an uploaded PDF using pdfjs-dist
 * based on AI-detected bounding boxes (`imageBBox` with page + normalized 0-1000 coordinates).
 */
export async function extractPdfQuestionImages(
  pdfBuffer: ArrayBuffer,
  questions: QuestionWithOptionalBBox[]
): Promise<QuizQuestion[]> {
  const withBoxes = questions.map((q) => ({
    q,
    bbox: clampNormalizedBBox(q.imageBBox),
  }));

  if (!withBoxes.some((item) => Boolean(item.bbox))) {
    return questions.map(({ imageBBox: _ignored, ...rest }) => rest);
  }

  try {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
    const pdf = await loadingTask.promise;

    const neededPages = Array.from(
      new Set(
        withBoxes
          .map((item) => item.bbox?.page)
          .filter((p): p is number => typeof p === 'number' && p >= 1 && p <= pdf.numPages)
      )
    );

    const renderedPages = new Map<number, HTMLCanvasElement>();
    for (const pageNum of neededPages) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        renderedPages.set(pageNum, canvas);
      }
    }

    return withBoxes.map(({ q, bbox }) => {
      const { imageBBox: _strip, ...cleanQ } = q;
      if (!bbox || cleanQ.image) return cleanQ;
      const pageCanvas = renderedPages.get(bbox.page);
      if (!pageCanvas) return cleanQ;
      const cropped = cropCanvasRegionToJpeg(
        pageCanvas,
        pageCanvas.width,
        pageCanvas.height,
        bbox
      );
      return cropped ? { ...cleanQ, image: cropped } : cleanQ;
    });
  } catch (err) {
    console.warn('PDF question image extraction fallback:', err);
    return questions.map(({ imageBBox: _ignored, ...rest }) => rest);
  }
}

/**
 * Automatically extracts cropped diagrams from an uploaded image file (single or multi-question photo/scan).
 */
export async function extractImageFileRegionsToQuestions(
  imageDataUrl: string,
  questions: QuestionWithOptionalBBox[]
): Promise<QuizQuestion[]> {
  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => resolve(null);
    el.src = imageDataUrl;
  });

  if (!img) {
    return questions.map(({ imageBBox: _ignored, ...rest }) => rest);
  }

  const out: QuizQuestion[] = [];
  for (const item of questions) {
    const { imageBBox, ...cleanQ } = item;
    const bbox = clampNormalizedBBox(imageBBox);
    if (cleanQ.image) {
      out.push(cleanQ);
      continue;
    }
    if (bbox) {
      const cropped = cropCanvasRegionToJpeg(img, img.naturalWidth || img.width, img.naturalHeight || img.height, bbox);
      if (cropped) {
        out.push({ ...cleanQ, image: cropped });
        continue;
      }
    }
    if (questions.length === 1) {
      const compressed = await compressDataUrlImage(imageDataUrl, 840, 0.8);
      out.push({ ...cleanQ, image: compressed });
    } else {
      out.push(cleanQ);
    }
  }
  return out;
}
