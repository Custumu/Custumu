import { loadPdfDoc } from './pdfRenderer';

/**
 * Custumu PDF Text Extractor
 * Extracts real text layers from any PDF (handles FlateDecode compression, encodings, and layouts).
 */
export async function extractPdfTextLayers(arrayBuffer) {
  if (!arrayBuffer) {
    return { numPages: 1, pages: [], fullText: '' };
  }

  // 1. Primary: Use PDF.js getTextContent() for full decoding of compressed streams & font encodings
  try {
    const pdfDoc = await loadPdfDoc(arrayBuffer);
    if (pdfDoc && pdfDoc.numPages > 0) {
      const pages = [];
      const numPages = pdfDoc.numPages;

      for (let i = 1; i <= numPages; i++) {
        try {
          const page = await pdfDoc.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item) => item.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          pages.push({
            pageNumber: i,
            text: pageText,
            wordCount: pageText ? pageText.split(/\s+/).length : 0,
          });
        } catch (pageErr) {
          console.warn(`Error extracting text from page ${i}:`, pageErr);
          pages.push({ pageNumber: i, text: '', wordCount: 0 });
        }
      }

      const fullText = pages
        .filter((p) => p.text.length > 0)
        .map((p) => `--- [PAGE ${p.pageNumber}] ---\n${p.text}`)
        .join('\n\n');

      return {
        numPages,
        pages,
        fullText,
      };
    }
  } catch (pdfJsErr) {
    console.warn('PDF.js text extraction error, trying stream scanner:', pdfJsErr);
  }

  // 2. Secondary: Raw stream scanner if PDF.js is unavailable
  try {
    const bytes = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('latin1');
    const rawPdf = decoder.decode(bytes);

    const pageMatches = rawPdf.match(/\/Type\s*\/Page\b/g);
    const pageCount = pageMatches ? pageMatches.length : 1;

    const btEtRegex = /BT([\s\S]*?)ET/g;
    let match;
    const extractedBlocks = [];

    while ((match = btEtRegex.exec(rawPdf)) !== null) {
      const block = match[1];
      const textMatches = block.match(/\((.*?)\)\s*(?:Tj|'|")/g) || [];
      const lineText = textMatches
        .map((m) => {
          const str = m.replace(/^[^(]*\(/, '').replace(/\)[^)]*$/, '');
          return str
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '')
            .replace(/\\t/g, '\t')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\');
        })
        .filter((s) => s.trim().length > 0)
        .join(' ');

      if (lineText.trim()) {
        extractedBlocks.push(lineText.trim());
      }
    }

    if (extractedBlocks.length > 0) {
      const totalBlocks = extractedBlocks.length;
      const blocksPerPage = Math.ceil(totalBlocks / Math.max(1, pageCount));
      const pages = [];

      for (let i = 0; i < pageCount; i++) {
        const pageBlocks = extractedBlocks.slice(i * blocksPerPage, (i + 1) * blocksPerPage);
        const pageText = pageBlocks.join('\n');
        pages.push({
          pageNumber: i + 1,
          text: pageText,
          wordCount: pageText.split(/\s+/).length,
        });
      }

      const fullText = pages.map((p) => `--- [PAGE ${p.pageNumber}] ---\n${p.text}`).join('\n\n');
      return { numPages: pageCount, pages, fullText };
    }
  } catch (err) {
    console.warn('Native PDF text parsing exception', err);
  }

  return {
    numPages: 1,
    pages: [],
    fullText: '',
  };
}
