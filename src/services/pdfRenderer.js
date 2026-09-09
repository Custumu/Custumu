/**
 * Safe PDF rendering helpers for Custumu
 * Zero bundler imports to prevent Vite import resolution errors
 */

export async function loadPdfDoc(arrayBuffer) {
  if (typeof window !== 'undefined' && window.pdfjsLib) {
    try {
      const loadingTask = window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      return await loadingTask.promise;
    } catch (e) {
      console.warn('PDF.js parse warning:', e);
      return null;
    }
  }
  return null;
}

export async function renderPdfPage(pdfDoc, pageNumber, canvas, zoom = 100) {
  if (!pdfDoc || !canvas) return null;
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const scale = (zoom / 100) * 1.5;
    const viewport = page.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;
    return { width: viewport.width, height: viewport.height };
  } catch (e) {
    console.warn('PDF page render warning:', e);
    return null;
  }
}

export async function renderThumbnail(pdfDoc, pageNumber) {
  if (!pdfDoc) return null;
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 0.22 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (e) {
    return null;
  }
}
