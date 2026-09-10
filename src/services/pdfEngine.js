import { loadPdfDoc } from './pdfRenderer';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as XLSX from 'xlsx';

/**
 * Custumu Client-Side PDF Engine (WASM / Zero-Upload)
 * High-performance, memory-safe in-browser manipulations.
 */

// Load and inspect any PDF file
export async function inspectPdf(arrayBuffer) {
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();
  const pages = [];

  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();
    const rotation = page.getRotation().angle;
    pages.push({
      pageNumber: i + 1,
      width,
      height,
      rotation,
    });
  }

  return {
    pageCount,
    pages,
    sizeBytes: arrayBuffer.byteLength,
    title: pdfDoc.getTitle() || 'Document.pdf',
  };
}

// Delete specific page indices (0-based)
export async function deletePagesFromPdf(arrayBuffer, pageIndicesToDelete) {
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  // Sort indices descending so deleting does not shift subsequent target indices
  const sorted = [...pageIndicesToDelete].sort((a, b) => b - a);
  for (const idx of sorted) {
    if (idx >= 0 && idx < pdfDoc.getPageCount()) {
      pdfDoc.removePage(idx);
    }
  }
  return await pdfDoc.save();
}

// Rotate page by 90 degrees
export async function rotatePdfPage(arrayBuffer, pageIndex, additionalDegrees = 90) {
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const page = pdfDoc.getPage(pageIndex);
  const currentRotation = page.getRotation().angle;
  const newRotation = (currentRotation + additionalDegrees) % 360;
  page.setRotation(degrees(newRotation));
  return await pdfDoc.save();
}

// Reorder pages in PDF
export async function reorderPdfPages(arrayBuffer, newOrderArray) {
  const sourceDoc = await PDFDocument.load(arrayBuffer);
  const newDoc = await PDFDocument.create();

  const copiedPages = await newDoc.copyPages(sourceDoc, newOrderArray);
  copiedPages.forEach((page) => newDoc.addPage(page));

  return await newDoc.save();
}

// Merge multiple PDFs
export async function mergePdfs(pdfBuffers) {
  const mergedDoc = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const doc = await PDFDocument.load(buffer);
    const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices());
    copiedPages.forEach((page) => mergedDoc.addPage(page));
  }

  return await mergedDoc.save();
}

// Split PDF into multiple separate single-page or range PDF buffers
export async function splitPdf(arrayBuffer, ranges) {
  const sourceDoc = await PDFDocument.load(arrayBuffer);
  const results = [];

  for (const range of ranges) {
    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(sourceDoc, range.pageIndices);
    copiedPages.forEach((page) => newDoc.addPage(page));
    const saved = await newDoc.save();
    results.push({
      name: range.name || `split_part_${results.length + 1}.pdf`,
      bytes: saved,
    });
  }

  return results;
}

// Add Watermark to all pages
export async function addWatermarkToPdf(arrayBuffer, watermarkText = 'CONFIDENTIAL') {
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    page.drawText(watermarkText, {
      x: width / 2 - 140,
      y: height / 2 - 20,
      size: 48,
      font,
      color: rgb(0.85, 0.2, 0.2),
      opacity: 0.22,
      rotate: degrees(45),
    });
  });

  return await pdfDoc.save();
}

// Add Stamped Signature
export async function stampSignature(
  arrayBuffer,
  pageIndex,
  signaturePngDataUrl,
  x,
  y,
  width = 160,
  height = 60
) {
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const page = pdfDoc.getPage(pageIndex);
  const signatureImage = await pdfDoc.embedPng(signaturePngDataUrl);

  page.drawImage(signatureImage, {
    x,
    y,
    width,
    height,
  });

  return await pdfDoc.save();
}

// Add Text Annotation
export async function addTextToPage(
  arrayBuffer,
  pageIndex,
  text,
  x,
  y,
  size = 12,
  color = [0, 0, 0]
) {
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const page = pdfDoc.getPage(pageIndex);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText(text, {
    x,
    y,
    size,
    font,
    color: rgb(color[0], color[1], color[2]),
  });

  return await pdfDoc.save();
}

// Redact Area (Draw black box)
export async function redactAreaOnPage(arrayBuffer, pageIndex, x, y, width, height) {
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const page = pdfDoc.getPage(pageIndex);

  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: rgb(0, 0, 0),
  });

  return await pdfDoc.save();
}

// Compress PDF (Client-side optimization profile)
export async function compressPdf(arrayBuffer, targetQuality = 0.75) {
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  // Re-save with object stream compression
  return await pdfDoc.save({ useObjectStreams: true });
}

// Export structured tables to Excel (.xlsx) using SheetJS
export function exportTableToExcel(tables, filename = 'Custumu_Extracted_Data.xlsx') {
  const wb = XLSX.utils.book_new();

  tables.forEach((table, idx) => {
    const ws = XLSX.utils.json_to_sheet(table.rows);
    XLSX.utils.book_append_sheet(wb, ws, table.name || `Table ${idx + 1}`);
  });

  XLSX.writeFile(wb, filename);
}

// Export document text to Word (.docx formatted file)
export function exportTextToWord(title, contentText, filename = 'Custumu_Document.doc') {
  const header = `<!DOCTYPE html>
  <html>
  <head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Calibri', Arial, sans-serif; line-height: 1.6; padding: 40px; color: #333; }
    h1 { color: #0c8ee9; border-bottom: 2px solid #0c8ee9; padding-bottom: 8px; }
    p { margin-bottom: 12px; }
  </style>
  </head>
  <body>
  <h1>${title}</h1>
  ${contentText
    .split('\n')
    .map((p) => (p.trim() ? `<p>${p}</p>` : ''))
    .join('')}
  </body>
  </html>`;

  const blob = new Blob(['\ufeff', header], {
    type: 'application/msword',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Convert a specific PDF page to high-res PNG image with guaranteed solid white background
 */
export async function convertPdfPageToPng(docBuffer, pageIndex = 0, scale = 2.0, annotations = []) {
  if (!docBuffer) return null;
  const pdfDoc = await loadPdfDoc(docBuffer);
  if (!pdfDoc) {
    // Fallback: check DOM canvas if it has rendered content
    const domCanvas = document.querySelector('main canvas');
    if (domCanvas && domCanvas.width > 100) {
      const outCanvas = document.createElement('canvas');
      outCanvas.width = domCanvas.width;
      outCanvas.height = domCanvas.height;
      const oCtx = outCanvas.getContext('2d');
      oCtx.fillStyle = '#FFFFFF';
      oCtx.fillRect(0, 0, outCanvas.width, outCanvas.height);
      oCtx.drawImage(domCanvas, 0, 0);
      return outCanvas.toDataURL('image/png');
    }
    return null;
  }

  try {
    const page = await pdfDoc.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    // CRITICAL: Solid opaque white background - guarantees NO transparent black/white squares
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render the real PDF page at high resolution
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Overlay user annotations (drawings, signatures, redact boxes)
    if (annotations && annotations.length > 0) {
      const pageAnnotations = annotations.filter((a) => a.pageIndex === pageIndex);
      const ratio = viewport.width / 612;

      // 1. Highlight layer: render all highlights onto an offscreen canvas so overlaps merge uniformly
      const highlightAnnos = pageAnnotations.filter((a) => a.type === 'highlight');
      if (highlightAnnos.length > 0) {
        const hCanvas = document.createElement('canvas');
        hCanvas.width = canvas.width;
        hCanvas.height = canvas.height;
        const hCtx = hCanvas.getContext('2d');
        hCtx.strokeStyle = '#FACC15';
        hCtx.fillStyle = '#FACC15';
        hCtx.lineWidth = 18 * (ratio || 1);
        hCtx.lineCap = 'round';
        hCtx.lineJoin = 'round';

        highlightAnnos.forEach((anno) => {
          if (!anno.points || anno.points.length === 0) return;
          hCtx.beginPath();
          if (anno.points.length === 1) {
            hCtx.arc(
              anno.points[0].x * (ratio || 1),
              anno.points[0].y * (ratio || 1),
              hCtx.lineWidth / 2,
              0,
              Math.PI * 2
            );
            hCtx.fill();
          } else {
            anno.points.forEach((pt, idx) => {
              const px = pt.x * (ratio || 1);
              const py = pt.y * (ratio || 1);
              if (idx === 0) hCtx.moveTo(px, py);
              else hCtx.lineTo(px, py);
            });
            hCtx.stroke();
          }
        });

        ctx.save();
        ctx.globalAlpha = 0.42;
        ctx.drawImage(hCanvas, 0, 0);
        ctx.restore();
      }

      // 2. Preload image-based annotations (signatures and drawings) so they render with 100% reliability
      const imageAnnos = pageAnnotations.filter(
        (a) => (a.type === 'signature' || a.type === 'draw') && a.dataUrl
      );
      const loadedImages = await Promise.all(
        imageAnnos.map((anno) => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ anno, img });
            img.onerror = () => resolve({ anno, img: null });
            img.src = anno.dataUrl;
          });
        })
      );
      const imageMap = new Map();
      loadedImages.forEach(({ anno, img }) => {
        if (img) imageMap.set(anno, img);
      });

      // 3. Other annotations (pen, redact, text, signature)
      pageAnnotations.forEach((anno) => {
        if (anno.type === 'draw') {
          const img = imageMap.get(anno);
          if (img && anno.width && anno.height) {
            // Draw moved/resized drawing at its exact updated position and scale
            ctx.drawImage(
              img,
              anno.x * ratio,
              anno.y * ratio,
              anno.width * ratio,
              anno.height * ratio
            );
          } else if (anno.points) {
            // Fallback for legacy points-only drawings
            ctx.beginPath();
            ctx.strokeStyle = anno.color || '#0284C7';
            ctx.lineWidth = (anno.strokeWidth || anno.width || 3) * (ratio || 1);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            anno.points.forEach((pt, idx) => {
              const px = pt.x * (ratio || 1);
              const py = pt.y * (ratio || 1);
              if (idx === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            });
            ctx.stroke();
          }
        } else if (anno.type === 'redact') {
          ctx.fillStyle = '#000000';
          ctx.fillRect(anno.x * ratio, anno.y * ratio, anno.width * ratio, anno.height * ratio);
        } else if (anno.type === 'text') {
          ctx.fillStyle = '#1e293b';
          ctx.font = `bold ${Math.round(14 * ratio)}px Inter, sans-serif`;
          ctx.fillText(anno.text, anno.x * ratio, anno.y * ratio);
        } else if (anno.type === 'signature') {
          const img = imageMap.get(anno);
          if (img) {
            ctx.drawImage(
              img,
              anno.x * ratio,
              anno.y * ratio,
              anno.width * ratio,
              anno.height * ratio
            );
          }
        }
      });
    }

    return canvas.toDataURL('image/png');
  } catch (e) {
    console.error('PDF page to PNG rendering error:', e);
    return null;
  }
}

/**
 * Convert all pages in PDF to an array of high-res PNG images with solid white background
 */
export async function convertAllPagesToPng(docBuffer, scale = 2.0, annotations = []) {
  if (!docBuffer) return [];
  const pdfDoc = await loadPdfDoc(docBuffer);
  if (!pdfDoc) return [];

  const pngList = [];
  try {
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const dataUrl = await convertPdfPageToPng(docBuffer, i - 1, scale, annotations);
      if (dataUrl) {
        pngList.push({
          pageNumber: i,
          dataUrl,
        });
      }
    }
  } catch (e) {
    console.error('All pages to PNG error:', e);
  }
  return pngList;
}

/**
 * Helper to trigger browser image download
 */
export function downloadImage(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
