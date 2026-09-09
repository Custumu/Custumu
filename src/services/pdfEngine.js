import { loadPdfDoc } from './pdfRenderer';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as XLSX from 'xlsx';

/**
 * Custumu Client-Side PDF Engine (WASM / Zero-Upload)
 * High-performance, memory-safe in-browser manipulations.
 */

// Generate a realistic starter demo document for immediate testing
export async function createDemoDocument() {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Page 1: Executive Master Services Agreement
  const page1 = pdfDoc.addPage([612, 792]); // Standard US Letter
  const { width: p1w, height: p1h } = page1.getSize();

  // Header banner
  page1.drawRectangle({
    x: 0,
    y: p1h - 80,
    width: p1w,
    height: 80,
    color: rgb(0.05, 0.1, 0.2),
  });

  page1.drawText('CUSTUMU CLOUD SERVICES AGREEMENT', {
    x: 48,
    y: p1h - 48,
    size: 18,
    font: fontBold,
    color: rgb(0.22, 0.74, 0.97),
  });

  page1.drawText('Document ID: CST-2026-8942 • Version: 2.4 (Active)', {
    x: 48,
    y: p1h - 68,
    size: 9,
    font: fontRegular,
    color: rgb(0.7, 0.8, 0.9),
  });

  // Section 1
  page1.drawText('1. PARTIES & ENGAGEMENT SCOPE', {
    x: 48,
    y: p1h - 120,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  const introText = 
    'This Master Services Agreement ("Agreement") is entered into as of September 9, 2026, by and\n' +
    'between Custumu Document Technologies ("Provider"), and Acme Enterprises Inc. ("Client").\n' +
    'Provider delivers automated AI workspace infrastructure, OCR document parsing, and secure\n' +
    'client-side WebAssembly document transformation pipelines.';
  page1.drawText(introText, {
    x: 48,
    y: p1h - 150,
    size: 10.5,
    font: fontRegular,
    lineHeight: 16,
    color: rgb(0.2, 0.25, 0.35),
  });

  // Section 2: Financial Terms Table
  page1.drawText('2. FINANCIAL SCHEDULE & INVOICING', {
    x: 48,
    y: p1h - 240,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  // Table header
  page1.drawRectangle({
    x: 48,
    y: p1h - 280,
    width: 516,
    height: 26,
    color: rgb(0.92, 0.95, 0.98),
  });
  page1.drawText('Service Tier', { x: 58, y: p1h - 272, size: 10, font: fontBold, color: rgb(0.1, 0.2, 0.35) });
  page1.drawText('Units (Monthly)', { x: 190, y: p1h - 272, size: 10, font: fontBold, color: rgb(0.1, 0.2, 0.35) });
  page1.drawText('Rate (USD)', { x: 340, y: p1h - 272, size: 10, font: fontBold, color: rgb(0.1, 0.2, 0.35) });
  page1.drawText('Subtotal', { x: 470, y: p1h - 272, size: 10, font: fontBold, color: rgb(0.1, 0.2, 0.35) });

  const rows = [
    ['AI Document Workspace', '50 Seats', '$49.00 / seat', '$2,450.00'],
    ['High-Speed OCR Pipeline', '10,000 Pages', '$0.05 / page', '$500.00'],
    ['Private Mode WASM Engine', 'Unlimited', 'Included', '$0.00'],
    ['Total Monthly Retainer', '—', '—', '$2,950.00'],
  ];

  rows.forEach((row, i) => {
    const yPos = p1h - 310 - (i * 24);
    const isTotal = i === rows.length - 1;
    page1.drawText(row[0], { x: 58, y: yPos, size: 9.5, font: isTotal ? fontBold : fontRegular, color: isTotal ? rgb(0.05, 0.45, 0.8) : rgb(0.2, 0.25, 0.3) });
    page1.drawText(row[1], { x: 190, y: yPos, size: 9.5, font: fontRegular, color: rgb(0.3, 0.35, 0.4) });
    page1.drawText(row[2], { x: 340, y: yPos, size: 9.5, font: fontRegular, color: rgb(0.3, 0.35, 0.4) });
    page1.drawText(row[3], { x: 470, y: yPos, size: 9.5, font: isTotal ? fontBold : fontRegular, color: isTotal ? rgb(0.05, 0.45, 0.8) : rgb(0.2, 0.25, 0.3) });
  });

  // Section 3: Payment terms
  page1.drawText('3. PAYMENT & TERMINATION TERMS', {
    x: 48,
    y: p1h - 430,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  const paymentTerms = 
    'Payment Terms: Net 30 days from invoice dispatch date.\n' +
    'Late Interest: Outstanding balances incur 1.5% per month or the legal statutory maximum.\n' +
    'Termination Notice: Either party may terminate with 30 days written notice.\n' +
    'Data Retention: In Private Mode, zero document data leaves client device memory.';
  page1.drawText(paymentTerms, {
    x: 48,
    y: p1h - 460,
    size: 10,
    font: fontRegular,
    lineHeight: 16,
    color: rgb(0.2, 0.25, 0.35),
  });

  // Footer
  page1.drawText('Page 1 of 3 • Custumu Document Studio (custumu.com)', {
    x: 48,
    y: 36,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.6, 0.65, 0.7),
  });

  // Page 2: Service Level Agreement (SLA)
  const page2 = pdfDoc.addPage([612, 792]);
  page2.drawText('SERVICE LEVEL AGREEMENT & PRIVACY ENCLAVE', {
    x: 48,
    y: 730,
    size: 15,
    font: fontBold,
    color: rgb(0.05, 0.45, 0.8),
  });

  const slaContent = 
    '1. UPTIME COMMITMENT: 99.95% monthly uptime across Cloud API endpoints.\n\n' +
    '2. ZERO-KNOWLEDGE PRIVATE MODE:\n' +
    'When user toggles "Private Mode", all PDF manipulation, reordering, splitting, merging,\n' +
    'and annotations execute exclusively inside local WebAssembly runtime.\n' +
    'No file bytes or metadata are transmitted over network.\n\n' +
    '3. CLOUD ENCLAVE PROCESSING:\n' +
    'When Cloud Mode is utilized for multi-language OCR or complex LibreOffice conversions,\n' +
    'all payload buffers are encrypted in transit (TLS 1.3) and in memory, and purged\n' +
    'immediately upon completion of user download or 60 minutes, whichever is earlier.';

  page2.drawText(slaContent, {
    x: 48,
    y: 680,
    size: 10.5,
    font: fontRegular,
    lineHeight: 18,
    color: rgb(0.2, 0.25, 0.35),
  });

  page2.drawText('Page 2 of 3 • Custumu Document Studio (custumu.com)', {
    x: 48,
    y: 36,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.6, 0.65, 0.7),
  });

  // Page 3: Signatures Page
  const page3 = pdfDoc.addPage([612, 792]);
  page3.drawText('EXECUTION & AUTHORIZED SIGNATURES', {
    x: 48,
    y: 730,
    size: 15,
    font: fontBold,
    color: rgb(0.05, 0.45, 0.8),
  });

  page3.drawText('IN WITNESS WHEREOF, the authorized representatives have executed this Agreement.', {
    x: 48,
    y: 690,
    size: 10.5,
    font: fontRegular,
    color: rgb(0.25, 0.3, 0.4),
  });

  // Signature boxes
  page3.drawRectangle({ x: 48, y: 520, width: 230, height: 120, borderColor: rgb(0.8, 0.85, 0.9), borderWidth: 1 });
  page3.drawText('PROVIDER: CUSTUMU TECHNOLOGIES', { x: 58, y: 620, size: 9, font: fontBold, color: rgb(0.2, 0.3, 0.4) });
  page3.drawText('Signature: [ e-Signed via Custumu ]', { x: 58, y: 560, size: 9.5, font: fontRegular, color: rgb(0.1, 0.6, 0.3) });
  page3.drawText('Date: September 9, 2026', { x: 58, y: 535, size: 9, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });

  page3.drawRectangle({ x: 334, y: 520, width: 230, height: 120, borderColor: rgb(0.8, 0.85, 0.9), borderWidth: 1 });
  page3.drawText('CLIENT: ACME ENTERPRISES INC.', { x: 344, y: 620, size: 9, font: fontBold, color: rgb(0.2, 0.3, 0.4) });
  page3.drawText('Signature: __________________________', { x: 344, y: 560, size: 9.5, font: fontRegular, color: rgb(0.5, 0.55, 0.6) });
  page3.drawText('Date: _______________________________', { x: 344, y: 535, size: 9, font: fontRegular, color: rgb(0.5, 0.55, 0.6) });

  page3.drawText('Page 3 of 3 • Custumu Document Studio (custumu.com)', {
    x: 48,
    y: 36,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.6, 0.65, 0.7),
  });

  return await pdfDoc.save();
}

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
export async function stampSignature(arrayBuffer, pageIndex, signaturePngDataUrl, x, y, width = 160, height = 60) {
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
export async function addTextToPage(arrayBuffer, pageIndex, text, x, y, size = 12, color = [0, 0, 0]) {
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
  ${contentText.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')}
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
      const pageAnnotations = annotations.filter(a => a.pageIndex === pageIndex);
      const ratio = viewport.width / 612;

      pageAnnotations.forEach(anno => {
        if (anno.type === 'draw' || anno.type === 'highlight') {
          ctx.beginPath();
          ctx.strokeStyle = anno.type === 'highlight' ? 'rgba(253, 224, 71, 0.45)' : (anno.color || '#2563EB');
          ctx.lineWidth = (anno.type === 'highlight' ? 16 : (anno.width || 3)) * (ratio || 1);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          anno.points.forEach((pt, idx) => {
            const px = pt.x * (ratio || 1);
            const py = pt.y * (ratio || 1);
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();
        } else if (anno.type === 'redact') {
          ctx.fillStyle = '#000000';
          ctx.fillRect(anno.x * ratio, anno.y * ratio, anno.width * ratio, anno.height * ratio);
        } else if (anno.type === 'text') {
          ctx.fillStyle = '#1e293b';
          ctx.font = `bold ${Math.round(14 * ratio)}px Inter, sans-serif`;
          ctx.fillText(anno.text, anno.x * ratio, anno.y * ratio);
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
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      // Solid opaque white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport }).promise;
      pngList.push({
        pageNumber: i,
        dataUrl: canvas.toDataURL('image/png'),
      });
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
