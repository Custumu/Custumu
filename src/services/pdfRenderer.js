/**
 * Robust PDF rendering helpers for Custumu
 * Ensures PDF.js initialization, clones array buffers, and renders on solid white canvas
 */

export async function getPdfJsLib() {
  if (typeof window === 'undefined') return null;
  if (window.pdfjsLib) {
    if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    return window.pdfjsLib;
  }
  if (window['pdfjs-dist/build/pdf']) {
    const lib = window['pdfjs-dist/build/pdf'];
    lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    window.pdfjsLib = lib;
    return lib;
  }

  // Poll for CDN script readiness up to 4 seconds
  return new Promise((resolve) => {
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 100;
      const lib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
      if (lib) {
        clearInterval(interval);
        lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        window.pdfjsLib = lib;
        resolve(lib);
      } else if (elapsed >= 3500) {
        clearInterval(interval);
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
          const loadedLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
          if (loadedLib) {
            loadedLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            window.pdfjsLib = loadedLib;
          }
          resolve(loadedLib);
        };
        script.onerror = () => resolve(null);
        document.head.appendChild(script);
      }
    }, 100);
  });
}

export async function loadPdfDoc(arrayBuffer) {
  if (!arrayBuffer) return null;
  const pdfjs = await getPdfJsLib();
  if (!pdfjs) return null;

  try {
    const data = new Uint8Array(arrayBuffer.slice(0));
    const loadingTask = pdfjs.getDocument({ data });
    return await loadingTask.promise;
  } catch (e) {
    console.warn('PDF.js loadDoc error:', e);
    return null;
  }
}

export async function renderPdfPage(pdfDoc, pageNumber, canvas, zoom = 100) {
  if (!pdfDoc || !canvas) return null;
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const baseWidth = unscaledViewport.width;
    const baseHeight = unscaledViewport.height;

    // Standard CSS dimensions at user zoom level (zoom in percent: 100 = 1.0x scale)
    const userScale = zoom / 100;
    const cssWidth = Math.round(baseWidth * userScale);
    const cssHeight = Math.round(baseHeight * userScale);

    // HiDPI / Retina device pixel ratio (capped at 2.5 to optimize memory & performance)
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    // Render viewport at full device pixel density for vector-crisp sharpness
    const renderViewport = page.getViewport({ scale: userScale * dpr });

    // Cancel any previous ongoing render task on this canvas
    if (canvas._currentRenderTask) {
      try {
        canvas._currentRenderTask.cancel();
      } catch (e) {
        // ignore cancellation exception
      }
      canvas._currentRenderTask = null;
    }

    // Set internal canvas resolution
    canvas.width = Math.floor(renderViewport.width);
    canvas.height = Math.floor(renderViewport.height);

    // Set CSS display dimensions
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    const ctx = canvas.getContext('2d', { alpha: false });
    // Solid white background to prevent transparent checkerboard squares
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderTask = page.render({
      canvasContext: ctx,
      viewport: renderViewport,
    });
    canvas._currentRenderTask = renderTask;

    await renderTask.promise;
    canvas._currentRenderTask = null;

    return {
      width: cssWidth,
      height: cssHeight,
      baseWidth,
      baseHeight,
      dpr,
    };
  } catch (e) {
    if (e?.name === 'RenderingCancelledException') {
      return null;
    }
    console.warn('PDF page render error:', e);
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
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (e) {
    return null;
  }
}
