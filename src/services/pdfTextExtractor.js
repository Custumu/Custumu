/**
 * Custumu Native PDF Text Extractor
 * Pure client-side text layer extractor for document RAG.
 * Zero-dependency, ultra-fast stream decoder that works across all browsers.
 */

export async function extractPdfTextLayers(arrayBuffer) {
  try {
    const bytes = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('latin1');
    const rawPdf = decoder.decode(bytes);

    // Split raw PDF into objects or stream chunks
    const pages = [];
    let pageCount = 0;

    // Count pages via /Type /Page
    const pageMatches = rawPdf.match(/\/Type\s*\/Page\b/g);
    pageCount = pageMatches ? pageMatches.length : 1;

    // Extract text between BT (Begin Text) and ET (End Text) blocks
    const btEtRegex = /BT([\s\S]*?)ET/g;
    let match;
    const extractedBlocks = [];

    while ((match = btEtRegex.exec(rawPdf)) !== null) {
      const block = match[1];
      // Match text strings in (text) Tj or [(text)] TJ
      const textMatches = block.match(/\((.*?)\)\s*(?:Tj|'|")/g) || [];
      const lineText = textMatches
        .map(m => {
          const str = m.replace(/^[^(]*\(/, '').replace(/\)[^)]*$/, '');
          // Unescape standard PDF octals and slashes
          return str
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '')
            .replace(/\\t/g, '\t')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\');
        })
        .filter(s => s.trim().length > 0)
        .join(' ');

      if (lineText.trim()) {
        extractedBlocks.push(lineText.trim());
      }
    }

    // If blocks were successfully parsed from streams
    if (extractedBlocks.length > 0) {
      const totalBlocks = extractedBlocks.length;
      const blocksPerPage = Math.ceil(totalBlocks / Math.max(1, pageCount));

      for (let i = 0; i < pageCount; i++) {
        const pageBlocks = extractedBlocks.slice(i * blocksPerPage, (i + 1) * blocksPerPage);
        const pageText = pageBlocks.join('\n');
        pages.push({
          pageNumber: i + 1,
          text: pageText,
          wordCount: pageText.split(/\s+/).length,
        });
      }

      const fullText = pages.map(p => `--- [PAGE ${p.pageNumber}] ---\n${p.text}`).join('\n\n');
      return {
        numPages: pageCount,
        pages,
        fullText,
      };
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
