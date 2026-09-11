import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { loadPdfDoc, renderPdfPage, renderPdfTextLayer } from '../services/pdfRenderer';
import CanvasToolbar from './CanvasToolbar';
import SignatureOverlay from './SignatureOverlay';

export default function CenterCanvas({
  docBuffer,
  activePageIndex,
  totalPages,
  setActivePageIndex,
  onOpenSignatureModal,
  annotations,
  setAnnotations,
  onAddWatermark,
}) {
  const viewportRef = useRef(null);
  const pdfCanvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const annotationCanvasRef = useRef(null);
  const highlightOffscreenRef = useRef(null);
  const eraserCanvasCacheRef = useRef(new Map());
  const persistentDrawingCanvasesRef = useRef(new Map());
  const lastEraserPosRef = useRef(null);
  const [zoom, setZoom] = useState(100);
  const [activeTool, setActiveTool] = useState('select'); // 'select' | 'text' | 'draw' | 'highlight' | 'redact' | 'eraser'
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPath, setCurrentPath] = useState([]);
  const [textInputPos, setTextInputPos] = useState(null);
  const [textInputValue, setTextInputValue] = useState('');
  const [isRenderingPage, setIsRenderingPage] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 612,
    height: 792,
    baseWidth: 612,
    baseHeight: 792,
    dpr: 1,
  });
  const [canvasRenderSuccess, setCanvasRenderSuccess] = useState(false);

  // Create real Blob URL for uploaded PDF
  const blobUrl = useMemo(() => {
    if (!docBuffer) return null;
    try {
      const blob = new Blob([docBuffer], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (e) {
      return null;
    }
  }, [docBuffer]);

  // Clean up Blob URL when unmounted or changed
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  // 1. Render the REAL uploaded PDF page onto pdfCanvasRef with Retina DPR resolution
  useEffect(() => {
    let isCancelled = false;

    async function renderPage() {
      if (!docBuffer || !pdfCanvasRef.current) return;
      setIsRenderingPage(true);

      try {
        const pdfDoc = await loadPdfDoc(docBuffer);
        if (isCancelled) return;

        if (pdfDoc) {
          const dimensions = await renderPdfPage(
            pdfDoc,
            activePageIndex + 1,
            pdfCanvasRef.current,
            zoom
          );

          if (dimensions && !isCancelled) {
            setCanvasDimensions(dimensions);
            setCanvasRenderSuccess(true);

            // Synchronize the overlay annotation canvas physical resolution and CSS dimensions
            if (annotationCanvasRef.current) {
              const dpr = dimensions.dpr || 1;
              annotationCanvasRef.current.width = Math.floor(dimensions.width * dpr);
              annotationCanvasRef.current.height = Math.floor(dimensions.height * dpr);
              annotationCanvasRef.current.style.width = `${dimensions.width}px`;
              annotationCanvasRef.current.style.height = `${dimensions.height}px`;
            }

            // Render selectable DOM text layer matching the active zoom and dimensions
            if (textLayerRef.current) {
              await renderPdfTextLayer(pdfDoc, activePageIndex + 1, textLayerRef.current, zoom);
            }
          }
        }
      } catch (err) {
        console.error('Failed to render PDF page onto canvas', err);
      } finally {
        if (!isCancelled) {
          setIsRenderingPage(false);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [docBuffer, activePageIndex, zoom]);

  const HIGHLIGHT_COLOR = '#FACC15'; // Solid opaque yellow for layer merging
  const PEN_COLOR = '#0284C7';

  // Helper to draw raw line or point geometry
  const drawRawPath = (ctx, points, scaleX, scaleY) => {
    if (!points || points.length === 0) return;
    ctx.beginPath();
    if (points.length === 1) {
      ctx.arc(points[0].x * scaleX, points[0].y * scaleY, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      points.forEach((pt, idx) => {
        const px = pt.x * scaleX;
        const py = pt.y * scaleY;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }
  };

  const drawPenPath = (ctx, points, scaleX, scaleY, color, width) => {
    if (!points || points.length === 0) return;
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = color || PEN_COLOR;
    ctx.fillStyle = color || PEN_COLOR;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawRawPath(ctx, points, scaleX, scaleY);
    ctx.restore();
  };

  // 2. Render Annotations onto annotationCanvasRef
  const renderAnnotations = (
    activeLivePath = null,
    activeLiveType = null,
    liveRedactRect = null
  ) => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const baseWidth = canvasDimensions.baseWidth || 612;
    const baseHeight = canvasDimensions.baseHeight || 792;
    const scaleX = canvas.width / baseWidth;
    const scaleY = canvas.height / baseHeight;

    const pageAnnotations = annotations.filter((a) => a.pageIndex === activePageIndex);

    // 1. Unified Highlight Layer:
    // Render legacy highlights and active live stroke onto an offscreen canvas.
    // Committed overlay highlights are rendered in SignatureOverlay so they are movable & resizable.
    const highlightAnnos = pageAnnotations.filter((a) => a.type === 'highlight' && !a.dataUrl);
    const isLiveHighlighting =
      activeLiveType === 'highlight' && activeLivePath && activeLivePath.length > 0;

    if (highlightAnnos.length > 0 || isLiveHighlighting) {
      if (!highlightOffscreenRef.current) {
        highlightOffscreenRef.current = document.createElement('canvas');
      }
      const hCanvas = highlightOffscreenRef.current;
      if (hCanvas.width !== canvas.width || hCanvas.height !== canvas.height) {
        hCanvas.width = canvas.width;
        hCanvas.height = canvas.height;
      }
      const hCtx = hCanvas.getContext('2d');
      hCtx.clearRect(0, 0, hCanvas.width, hCanvas.height);
      hCtx.strokeStyle = HIGHLIGHT_COLOR;
      hCtx.fillStyle = HIGHLIGHT_COLOR;
      hCtx.lineWidth = 18 * scaleX;
      hCtx.lineCap = 'round';
      hCtx.lineJoin = 'round';

      highlightAnnos.forEach((anno) => {
        drawRawPath(hCtx, anno.points, scaleX, scaleY);
      });

      if (isLiveHighlighting) {
        drawRawPath(hCtx, activeLivePath, scaleX, scaleY);
      }

      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.drawImage(hCanvas, 0, 0);
      ctx.restore();
    }

    // 2. Freehand Pen layer
    // Only render legacy pen annotations that do not have an interactive overlay representation
    const legacyPenAnnos = pageAnnotations.filter(
      (a) => a.type === 'draw' && !a.svgPath && !a.dataUrl
    );
    legacyPenAnnos.forEach((anno) => {
      drawPenPath(ctx, anno.points, scaleX, scaleY, anno.color, (anno.width || 3) * scaleX);
    });
    if (activeLiveType === 'draw' && activeLivePath && activeLivePath.length > 0) {
      drawPenPath(ctx, activeLivePath, scaleX, scaleY, PEN_COLOR, 3 * scaleX);
    }

    // 3. Text annotations
    const textAnnos = pageAnnotations.filter((a) => a.type === 'text');
    textAnnos.forEach((anno) => {
      ctx.fillStyle = '#1e293b';
      ctx.font = `bold ${Math.round(14 * scaleX)}px Inter, sans-serif`;
      ctx.fillText(anno.text, anno.x * scaleX, anno.y * scaleY);
    });

    // 4. Signatures & Pen drawings
    // Note: Rendered as interactive DOM overlays so they can be smoothly moved & resized.

    // 5. Redact boxes (both committed and live preview)
    const redactAnnos = pageAnnotations.filter((a) => a.type === 'redact');
    redactAnnos.forEach((anno) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(anno.x * scaleX, anno.y * scaleY, anno.width * scaleX, anno.height * scaleY);
    });

    if (liveRedactRect) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(
        liveRedactRect.x * scaleX,
        liveRedactRect.y * scaleY,
        liveRedactRect.width * scaleX,
        liveRedactRect.height * scaleY
      );
    }
  };

  useEffect(() => {
    renderAnnotations();
  }, [activePageIndex, annotations, canvasDimensions]);

  // Helper to compute distance squared from point (px, py) to line segment (x1, y1)-(x2, y2)
  const distToSegmentSquared = (px, py, x1, y1, x2, y2) => {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return (px - x1) ** 2 + (py - y1) ** 2;
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return (px - (x1 + t * (x2 - x1))) ** 2 + (py - (y1 + t * (y2 - y1))) ** 2;
  };

  // Pixel-precision section eraser using destination-out
  const eraseSection = (fromX, fromY, toX, toY) => {
    const ERASER_RADIUS = 12;
    const ERASER_RADIUS_SQ = ERASER_RADIUS ** 2;

    let annotationsChanged = false;

    setAnnotations((prev) => {
      const updatedAnnos = [];

      for (const anno of prev) {
        if (anno.pageIndex !== activePageIndex) {
          updatedAnnos.push(anno);
          continue;
        }

        // 1. Signatures, Pen Drawings, and Highlights with image data (Pixel Precision Erasing)
        if (
          (anno.type === 'signature' || anno.type === 'draw' || anno.type === 'highlight') &&
          anno.dataUrl &&
          anno.width &&
          anno.height &&
          anno.x !== undefined &&
          anno.y !== undefined
        ) {
          const segMinX = Math.min(fromX, toX) - ERASER_RADIUS;
          const segMaxX = Math.max(fromX, toX) + ERASER_RADIUS;
          const segMinY = Math.min(fromY, toY) - ERASER_RADIUS;
          const segMaxY = Math.max(fromY, toY) + ERASER_RADIUS;

          const overlaps =
            segMaxX >= anno.x &&
            segMinX <= anno.x + anno.width &&
            segMaxY >= anno.y &&
            segMinY <= anno.y + anno.height;

          if (!overlaps) {
            updatedAnnos.push(anno);
            continue;
          }

          // Retrieve or create offscreen working canvas from cache or persistent ref
          let cacheEntry =
            eraserCanvasCacheRef.current.get(anno.id) ||
            persistentDrawingCanvasesRef.current.get(anno.id);

          if (!cacheEntry) {
            const dpr = 2;
            const offCanvas = document.createElement('canvas');
            offCanvas.width = Math.max(1, Math.round(anno.width * dpr));
            offCanvas.height = Math.max(1, Math.round(anno.height * dpr));
            const offCtx = offCanvas.getContext('2d');

            let painted = false;

            // 1. Direct vector rasterization if points are available (crisp & instantaneous)
            if (
              (anno.type === 'draw' || anno.type === 'highlight') &&
              anno.points &&
              anno.points.length > 0 &&
              !anno.isErased
            ) {
              const strokeColor =
                anno.type === 'highlight' ? HIGHLIGHT_COLOR : anno.color || PEN_COLOR;
              const sw = (anno.strokeWidth || (anno.type === 'highlight' ? 18 : 3)) * dpr;
              offCtx.strokeStyle = strokeColor;
              offCtx.fillStyle = strokeColor;
              offCtx.lineWidth = sw;
              offCtx.lineCap = 'round';
              offCtx.lineJoin = 'round';
              offCtx.beginPath();
              if (anno.points.length === 1) {
                offCtx.arc(
                  (anno.points[0].x - anno.x) * dpr,
                  (anno.points[0].y - anno.y) * dpr,
                  sw / 2,
                  0,
                  Math.PI * 2
                );
                offCtx.fill();
              } else {
                anno.points.forEach((pt, idx) => {
                  const px = (pt.x - anno.x) * dpr;
                  const py = (pt.y - anno.y) * dpr;
                  if (idx === 0) offCtx.moveTo(px, py);
                  else offCtx.lineTo(px, py);
                });
                offCtx.stroke();
              }
              painted = true;
            }

            // 2. Query DOM image if already rendered
            if (!painted) {
              const domImg = document.querySelector(`[data-annotation-id="${anno.id}"] img`);
              if (domImg && domImg.complete && domImg.naturalWidth > 0) {
                offCtx.drawImage(domImg, 0, 0, offCanvas.width, offCanvas.height);
                painted = true;
              }
            }

            // 3. Fallback to vector points even if isErased was set
            if (
              !painted &&
              (anno.type === 'draw' || anno.type === 'highlight') &&
              anno.points &&
              anno.points.length > 0
            ) {
              const strokeColor =
                anno.type === 'highlight' ? HIGHLIGHT_COLOR : anno.color || PEN_COLOR;
              const sw = (anno.strokeWidth || (anno.type === 'highlight' ? 18 : 3)) * dpr;
              offCtx.strokeStyle = strokeColor;
              offCtx.fillStyle = strokeColor;
              offCtx.lineWidth = sw;
              offCtx.lineCap = 'round';
              offCtx.lineJoin = 'round';
              offCtx.beginPath();
              if (anno.points.length === 1) {
                offCtx.arc(
                  (anno.points[0].x - anno.x) * dpr,
                  (anno.points[0].y - anno.y) * dpr,
                  sw / 2,
                  0,
                  Math.PI * 2
                );
                offCtx.fill();
              } else {
                anno.points.forEach((pt, idx) => {
                  const px = (pt.x - anno.x) * dpr;
                  const py = (pt.y - anno.y) * dpr;
                  if (idx === 0) offCtx.moveTo(px, py);
                  else offCtx.lineTo(px, py);
                });
                offCtx.stroke();
              }
              painted = true;
            }

            cacheEntry = { canvas: offCanvas, ctx: offCtx, dpr };
            eraserCanvasCacheRef.current.set(anno.id, cacheEntry);
            persistentDrawingCanvasesRef.current.set(anno.id, cacheEntry);
          } else {
            eraserCanvasCacheRef.current.set(anno.id, cacheEntry);
          }

          const { canvas, ctx: offCtx } = cacheEntry;

          const scaleW = canvas.width / anno.width;
          const scaleH = canvas.height / anno.height;
          const lx1 = (fromX - anno.x) * scaleW;
          const ly1 = (fromY - anno.y) * scaleH;
          const lx2 = (toX - anno.x) * scaleW;
          const ly2 = (toY - anno.y) * scaleH;
          const lr = ERASER_RADIUS * ((scaleW + scaleH) / 2);

          offCtx.save();
          offCtx.globalCompositeOperation = 'destination-out';
          offCtx.lineWidth = lr * 2;
          offCtx.lineCap = 'round';
          offCtx.lineJoin = 'round';
          offCtx.beginPath();
          offCtx.moveTo(lx1, ly1);
          offCtx.lineTo(lx2, ly2);
          offCtx.stroke();
          offCtx.beginPath();
          offCtx.arc(lx2, ly2, lr, 0, Math.PI * 2);
          offCtx.fill();
          offCtx.restore();

          persistentDrawingCanvasesRef.current.set(anno.id, cacheEntry);
          const updatedDataUrl = canvas.toDataURL('image/png');
          annotationsChanged = true;

          updatedAnnos.push({
            ...anno,
            dataUrl: updatedDataUrl,
            isErased: true,
          });
          continue;
        }

        // 2. Legacy Highlighter strokes: split into separate path segments
        if (anno.type === 'highlight' && !anno.dataUrl && anno.points && anno.points.length > 0) {
          const hitRadiusSq = (ERASER_RADIUS + 12) ** 2;
          let touched = false;
          const newSegments = [];
          let currentSegment = [];

          for (let i = 0; i < anno.points.length; i++) {
            const pt = anno.points[i];
            const distSq = distToSegmentSquared(pt.x, pt.y, fromX, fromY, toX, toY);
            if (distSq <= hitRadiusSq) {
              touched = true;
              if (currentSegment.length > 1) {
                newSegments.push(currentSegment);
              }
              currentSegment = [];
            } else {
              currentSegment.push(pt);
            }
          }
          if (currentSegment.length > 1) {
            newSegments.push(currentSegment);
          }

          if (touched) {
            annotationsChanged = true;
            newSegments.forEach((seg, sIdx) => {
              updatedAnnos.push({
                ...anno,
                id: `${anno.id || 'hl'}-split-${Date.now()}-${sIdx}`,
                points: seg,
              });
            });
            continue;
          } else {
            updatedAnnos.push(anno);
            continue;
          }
        }

        // 3. Text annotations: delete if touched
        if (anno.type === 'text' && anno.x !== undefined && anno.y !== undefined) {
          const textW = (anno.text?.length || 6) * 9;
          const textH = 18;
          const textX = anno.x;
          const textY = anno.y - textH;
          const nearX = Math.max(textX, Math.min(toX, textX + textW));
          const nearY = Math.max(textY, Math.min(toY, textY + textH));
          const distSq = (toX - nearX) ** 2 + (toY - nearY) ** 2;
          if (distSq <= ERASER_RADIUS_SQ) {
            annotationsChanged = true;
            continue;
          }
        }

        // 4. Redact boxes: delete if touched
        if (anno.type === 'redact' && anno.width && anno.height) {
          const nearX = Math.max(anno.x, Math.min(toX, anno.x + anno.width));
          const nearY = Math.max(anno.y, Math.min(toY, anno.y + anno.height));
          const distSq = (toX - nearX) ** 2 + (toY - nearY) ** 2;
          if (distSq <= ERASER_RADIUS_SQ) {
            annotationsChanged = true;
            continue;
          }
        }

        updatedAnnos.push(anno);
      }

      return annotationsChanged ? updatedAnnos : prev;
    });
  };

  const handleMouseDown = (e) => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const baseWidth = canvasDimensions.baseWidth || 612;
    const baseHeight = canvasDimensions.baseHeight || 792;
    const x = ((e.clientX - rect.left) / rect.width) * baseWidth;
    const y = ((e.clientY - rect.top) / rect.height) * baseHeight;

    if (activeTool === 'eraser') {
      setIsErasing(true);
      lastEraserPosRef.current = { x, y };
      eraseSection(x, y, x, y);
    } else if (activeTool === 'draw' || activeTool === 'highlight') {
      setIsDrawing(true);
      const initialPath = [{ x, y }];
      setCurrentPath(initialPath);
      renderAnnotations(initialPath, activeTool);
    } else if (activeTool === 'redact') {
      setIsDrawing(true);
      setStartPos({ x, y });
    } else if (activeTool === 'text') {
      setTextInputPos({ x, y });
    }
  };

  const handleMouseMove = (e) => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const baseWidth = canvasDimensions.baseWidth || 612;
    const baseHeight = canvasDimensions.baseHeight || 792;
    const x = ((e.clientX - rect.left) / rect.width) * baseWidth;
    const y = ((e.clientY - rect.top) / rect.height) * baseHeight;

    if (activeTool === 'eraser') {
      if (isErasing && lastEraserPosRef.current) {
        const fromPos = lastEraserPosRef.current;
        eraseSection(fromPos.x, fromPos.y, x, y);
        lastEraserPosRef.current = { x, y };
      }
      return;
    }

    if (!isDrawing) return;

    if (activeTool === 'draw' || activeTool === 'highlight') {
      const nextPath = [...currentPath, { x, y }];
      setCurrentPath(nextPath);
      renderAnnotations(nextPath, activeTool);
    } else if (activeTool === 'redact') {
      const width = Math.abs(x - startPos.x);
      const height = Math.abs(y - startPos.y);
      const startX = Math.min(x, startPos.x);
      const startY = Math.min(y, startPos.y);
      renderAnnotations(null, null, { x: startX, y: startY, width, height });
    }
  };

  const handleMouseUp = (e) => {
    if (activeTool === 'eraser') {
      setIsErasing(false);
      lastEraserPosRef.current = null;

      // Check if any canvas in cache was completely erased (100% transparent)
      if (eraserCanvasCacheRef.current.size > 0) {
        const fullyErasedIds = new Set();
        for (const [id, { canvas, ctx }] of eraserCanvasCacheRef.current.entries()) {
          try {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let hasPixels = false;
            for (let i = 3; i < imgData.length; i += 4) {
              if (imgData[i] > 10) {
                hasPixels = true;
                break;
              }
            }
            if (!hasPixels) {
              fullyErasedIds.add(id);
            }
          } catch (err) {
            console.warn('Could not inspect canvas alpha', err);
          }
        }
        if (fullyErasedIds.size > 0) {
          setAnnotations((prev) => prev.filter((a) => !fullyErasedIds.has(a.id)));
          fullyErasedIds.forEach((id) => {
            eraserCanvasCacheRef.current.delete(id);
            persistentDrawingCanvasesRef.current.delete(id);
          });
        }
        eraserCanvasCacheRef.current.clear();
      }
      return;
    }
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const baseWidth = canvasDimensions.baseWidth || 612;
    const baseHeight = canvasDimensions.baseHeight || 792;
    const x = ((e.clientX - rect.left) / rect.width) * baseWidth;
    const y = ((e.clientY - rect.top) / rect.height) * baseHeight;

    if (activeTool === 'draw') {
      const finalPath = currentPath.length > 0 ? currentPath : [{ x, y }];
      if (finalPath.length > 0) {
        const strokeWidth = 3;
        const pad = 10;
        const xs = finalPath.map((p) => p.x);
        const ys = finalPath.map((p) => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const rawWidth = Math.max(1, maxX - minX);
        const rawHeight = Math.max(1, maxY - minY);
        const boxWidth = Math.max(28, rawWidth + pad * 2);
        const boxHeight = Math.max(24, rawHeight + pad * 2);

        // Center stroke within padded bounding box
        const offsetX = (boxWidth - rawWidth) / 2;
        const offsetY = (boxHeight - rawHeight) / 2;
        const boxX = Math.max(0, minX - offsetX);
        const boxY = Math.max(0, minY - offsetY);

        // Build responsive vector SVG path
        let svgPath = '';
        if (finalPath.length === 1) {
          const rx = (finalPath[0].x - boxX).toFixed(1);
          const ry = (finalPath[0].y - boxY).toFixed(1);
          svgPath = `M ${rx} ${ry} m -${strokeWidth},0 a ${strokeWidth},${strokeWidth} 0 1,0 ${strokeWidth * 2},0 a ${strokeWidth},${strokeWidth} 0 1,0 -${strokeWidth * 2},0`;
        } else {
          svgPath = finalPath
            .map((p, idx) => {
              const rx = (p.x - boxX).toFixed(1);
              const ry = (p.y - boxY).toFixed(1);
              return `${idx === 0 ? 'M' : 'L'} ${rx} ${ry}`;
            })
            .join(' ');
        }

        // Generate transparent high-res PNG dataUrl for PDF export and canvas previews
        let pngDataUrl = null;
        let createdCanvas = null;
        let createdCtx = null;
        const dpr = 2;
        try {
          const offCanvas = document.createElement('canvas');
          offCanvas.width = Math.ceil(boxWidth * dpr);
          offCanvas.height = Math.ceil(boxHeight * dpr);
          const offCtx = offCanvas.getContext('2d');
          if (offCtx) {
            offCtx.strokeStyle = PEN_COLOR;
            offCtx.fillStyle = PEN_COLOR;
            offCtx.lineWidth = strokeWidth * dpr;
            offCtx.lineCap = 'round';
            offCtx.lineJoin = 'round';
            offCtx.beginPath();
            if (finalPath.length === 1) {
              offCtx.arc(
                (finalPath[0].x - boxX) * dpr,
                (finalPath[0].y - boxY) * dpr,
                (strokeWidth * dpr) / 2,
                0,
                Math.PI * 2
              );
              offCtx.fill();
            } else {
              finalPath.forEach((pt, idx) => {
                const px = (pt.x - boxX) * dpr;
                const py = (pt.y - boxY) * dpr;
                if (idx === 0) offCtx.moveTo(px, py);
                else offCtx.lineTo(px, py);
              });
              offCtx.stroke();
            }
            pngDataUrl = offCanvas.toDataURL('image/png');
            createdCanvas = offCanvas;
            createdCtx = offCtx;
          }
        } catch (err) {
          console.warn('Could not generate offscreen PNG for pen drawing', err);
        }

        const drawId = `draw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        if (createdCanvas && createdCtx) {
          persistentDrawingCanvasesRef.current.set(drawId, {
            canvas: createdCanvas,
            ctx: createdCtx,
            dpr,
          });
        }
        setAnnotations((prev) => [
          ...prev,
          {
            id: drawId,
            pageIndex: activePageIndex,
            type: 'draw',
            x: Math.round(boxX),
            y: Math.round(boxY),
            width: Math.round(boxWidth),
            height: Math.round(boxHeight),
            originalWidth: Math.round(boxWidth),
            originalHeight: Math.round(boxHeight),
            color: PEN_COLOR,
            strokeWidth,
            svgPath,
            dataUrl: pngDataUrl,
            points: finalPath,
          },
        ]);
      }
      setCurrentPath([]);
      renderAnnotations();
    } else if (activeTool === 'highlight') {
      const finalPath = currentPath.length > 0 ? currentPath : [{ x, y }];
      if (finalPath.length > 0) {
        const strokeWidth = 18;
        const pad = 12;
        const xs = finalPath.map((p) => p.x);
        const ys = finalPath.map((p) => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const rawWidth = Math.max(1, maxX - minX);
        const rawHeight = Math.max(1, maxY - minY);
        const boxWidth = Math.max(28, rawWidth + pad * 2);
        const boxHeight = Math.max(24, rawHeight + pad * 2);

        // Center stroke within padded bounding box
        const offsetX = (boxWidth - rawWidth) / 2;
        const offsetY = (boxHeight - rawHeight) / 2;
        const boxX = Math.max(0, minX - offsetX);
        const boxY = Math.max(0, minY - offsetY);

        // Generate transparent high-res PNG dataUrl for highlight
        let pngDataUrl = null;
        let createdCanvas = null;
        let createdCtx = null;
        const dpr = 2;
        try {
          const offCanvas = document.createElement('canvas');
          offCanvas.width = Math.ceil(boxWidth * dpr);
          offCanvas.height = Math.ceil(boxHeight * dpr);
          const offCtx = offCanvas.getContext('2d');
          if (offCtx) {
            offCtx.strokeStyle = HIGHLIGHT_COLOR;
            offCtx.fillStyle = HIGHLIGHT_COLOR;
            offCtx.lineWidth = strokeWidth * dpr;
            offCtx.lineCap = 'round';
            offCtx.lineJoin = 'round';
            offCtx.beginPath();
            if (finalPath.length === 1) {
              offCtx.arc(
                (finalPath[0].x - boxX) * dpr,
                (finalPath[0].y - boxY) * dpr,
                (strokeWidth * dpr) / 2,
                0,
                Math.PI * 2
              );
              offCtx.fill();
            } else {
              finalPath.forEach((pt, idx) => {
                const px = (pt.x - boxX) * dpr;
                const py = (pt.y - boxY) * dpr;
                if (idx === 0) offCtx.moveTo(px, py);
                else offCtx.lineTo(px, py);
              });
              offCtx.stroke();
            }
            pngDataUrl = offCanvas.toDataURL('image/png');
            createdCanvas = offCanvas;
            createdCtx = offCtx;
          }
        } catch (err) {
          console.warn('Could not generate offscreen PNG for highlight', err);
        }

        const hlId = `highlight-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        if (createdCanvas && createdCtx) {
          persistentDrawingCanvasesRef.current.set(hlId, {
            canvas: createdCanvas,
            ctx: createdCtx,
            dpr,
          });
        }
        setAnnotations((prev) => [
          ...prev,
          {
            id: hlId,
            pageIndex: activePageIndex,
            type: 'highlight',
            x: Math.round(boxX),
            y: Math.round(boxY),
            width: Math.round(boxWidth),
            height: Math.round(boxHeight),
            originalWidth: Math.round(boxWidth),
            originalHeight: Math.round(boxHeight),
            color: HIGHLIGHT_COLOR,
            strokeWidth,
            dataUrl: pngDataUrl,
            points: finalPath,
            opacity: 0.45,
          },
        ]);
      }
      setCurrentPath([]);
      renderAnnotations();
    } else if (activeTool === 'redact') {
      const width = Math.abs(x - startPos.x);
      const height = Math.abs(y - startPos.y);
      const startX = Math.min(x, startPos.x);
      const startY = Math.min(y, startPos.y);

      if (width > 6 && height > 6) {
        setAnnotations((prev) => [
          ...prev,
          {
            pageIndex: activePageIndex,
            type: 'redact',
            x: startX,
            y: startY,
            width,
            height,
          },
        ]);
      }
      renderAnnotations();
    }
  };

  const handleAddTextSubmit = (e) => {
    e.preventDefault();
    if (textInputValue.trim() && textInputPos) {
      setAnnotations((prev) => [
        ...prev,
        {
          pageIndex: activePageIndex,
          type: 'text',
          x: textInputPos.x,
          y: textInputPos.y,
          text: textInputValue.trim(),
        },
      ]);
    }
    setTextInputPos(null);
    setTextInputValue('');
  };

  const handleFitWidth = () => {
    if (!viewportRef.current || !canvasDimensions.baseWidth) return;
    const padding = 64;
    const availableWidth = viewportRef.current.clientWidth - padding;
    if (availableWidth > 150) {
      const targetZoom = Math.round((availableWidth / canvasDimensions.baseWidth) * 100);
      setZoom(Math.max(40, Math.min(200, targetZoom)));
    }
  };

  const handleFitPage = () => {
    if (!viewportRef.current || !canvasDimensions.baseHeight) return;
    const padding = 64;
    const availableHeight = viewportRef.current.clientHeight - padding;
    if (availableHeight > 150) {
      const targetZoom = Math.round((availableHeight / canvasDimensions.baseHeight) * 100);
      setZoom(Math.max(40, Math.min(200, targetZoom)));
    }
  };

  const getToolCursor = () => {
    if (activeTool === 'select') return 'default';
    if (activeTool === 'text') return 'text';
    if (activeTool === 'eraser') {
      // Circular dashed red eraser target matching 12px contact radius
      return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Ccircle cx='14' cy='14' r='12' fill='rgba(239,68,68,0.18)' stroke='%23ef4444' stroke-width='1.5' stroke-dasharray='3 2'/%3E%3Ccircle cx='14' cy='14' r='1.5' fill='%23ef4444'/%3E%3C/svg%3E") 14 14, crosshair`;
    }
    if (activeTool === 'draw') {
      // Smaller hollow circle for pen
      return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='4' fill='none' stroke='%23475569' stroke-width='1.5'/%3E%3C/svg%3E") 8 8, auto`;
    }
    // Larger hollow circle for highlighter
    return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='11' fill='none' stroke='%23475569' stroke-width='1.5'/%3E%3C/svg%3E") 16 16, auto`;
  };

  return (
    <main className="flex-1 flex flex-col bg-slate-100/70 dark:bg-[#181A19] h-full overflow-hidden relative min-w-0 transition-colors duration-150">
      {/* Top Floating Action Toolbar */}
      <CanvasToolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        onOpenSignatureModal={onOpenSignatureModal}
        onAddWatermark={onAddWatermark}
        zoom={zoom}
        setZoom={setZoom}
        onFitWidth={handleFitWidth}
        onFitPage={handleFitPage}
      />

      {/* Main Real PDF Canvas Viewport */}
      <div ref={viewportRef} className="flex-1 overflow-auto p-6 md:p-8 flex flex-col items-center">
        <div className="my-auto py-2 flex flex-col items-center">
          <div
            className="relative bg-white shadow-2xl rounded-sm select-none"
            style={{
              width: `${canvasDimensions.width}px`,
              height: `${canvasDimensions.height}px`,
            }}
          >
            {/* Loading indicator */}
            {isRenderingPage && (
              <div className="absolute inset-0 bg-white/75 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center z-30 transition-opacity">
                <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-400 text-xs font-medium bg-white dark:bg-[#1c1c21] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#27272e] shadow-lg">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                  <span>Rendering Page {activePageIndex + 1}...</span>
                </div>
              </div>
            )}

            {/* 1. Base Layer: Real Uploaded PDF Page Rendered on Canvas */}
            <canvas
              ref={pdfCanvasRef}
              className={`block ${canvasRenderSuccess ? 'opacity-100' : 'opacity-0'}`}
              style={{
                width: `${canvasDimensions.width}px`,
                height: `${canvasDimensions.height}px`,
              }}
            />

            {/* 2. Middle Layer: Real PDF Selectable Text Layer */}
            <div
              ref={textLayerRef}
              className="textLayer"
              style={{
                width: `${canvasDimensions.width}px`,
                height: `${canvasDimensions.height}px`,
                pointerEvents: activeTool === 'select' ? 'auto' : 'none',
                zIndex: 5,
              }}
            />

            {/* 3. Top Layer: Interactive Annotation, Draw & Redaction Canvas */}
            <canvas
              ref={annotationCanvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className={`absolute inset-0 ${
                activeTool === 'select' ? 'pointer-events-none' : 'pointer-events-auto'
              }`}
              style={{
                width: `${canvasDimensions.width}px`,
                height: `${canvasDimensions.height}px`,
                cursor: getToolCursor(),
                zIndex: 10,
              }}
            />

            {/* 4. Interactive Movable & Resizable Signatures & Drawings Layer */}
            <SignatureOverlay
              annotations={annotations}
              setAnnotations={setAnnotations}
              activePageIndex={activePageIndex}
              canvasDimensions={canvasDimensions}
              activeTool={activeTool}
            />

            {/* Text Input Popover */}
            {textInputPos && (
              <form
                onSubmit={handleAddTextSubmit}
                className="absolute z-30 bg-white border border-brand-500 shadow-xl rounded p-1 flex items-center space-x-1"
                style={{
                  left: `${(textInputPos.x / (canvasDimensions.baseWidth || 612)) * 100}%`,
                  top: `${(textInputPos.y / (canvasDimensions.baseHeight || 792)) * 100}%`,
                }}
              >
                <input
                  type="text"
                  autoFocus
                  value={textInputValue}
                  onChange={(e) => setTextInputValue(e.target.value)}
                  placeholder="Type text annotation..."
                  className="text-xs px-2 py-1 text-slate-800 outline-none w-48 bg-transparent"
                />
                <button
                  type="submit"
                  className="bg-brand-500 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-brand-600 cursor-pointer"
                >
                  Add
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
