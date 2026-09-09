import * as pdfjsLib from 'pdfjs-dist';

// Use standard CDN worker for high-performance zero-bundle browser rendering
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;

let cachedPdfDoc = null;
let cachedBuffer = null;

/**
 * Load PDF Document into memory for canvas rendering
 */
export async function loadPdfDoc(arrayBuffer) {
  if (cachedBuffer === arrayBuffer && cachedPdfDoc) {
    return cachedPdfDoc;
  }
  cachedBuffer = arrayBuffer;
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
    cMapPacked: true,
  });
  cachedPdfDoc = await loadingTask.promise;
  return cachedPdfDoc;
}

/**
 * Render exact PDF page onto a target <canvas> element
 */
export async function renderPdfPage(pdfDoc, pageNumber, canvas, zoom = 100) {
  if (!pdfDoc || !canvas) return null;
  const page = await pdfDoc.getPage(pageNumber);
  const scale = (zoom / 100) * 1.5; // High DPI crisp rendering
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const renderTask = page.render({
    canvasContext: ctx,
    viewport,
  });

  await renderTask.promise;
  return { width: viewport.width, height: viewport.height };
}

/**
 * Generate real thumbnail image DataURL for a specific page
 */
export async function renderThumbnail(pdfDoc, pageNumber) {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 0.22 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (err) {
    console.warn(`Failed to render thumbnail for page ${pageNumber}`, err);
    return null;
  }
}
