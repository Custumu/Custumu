import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { loadPdfDoc, renderPdfPage, renderPdfTextLayer } from '../services/pdfRenderer';
import CanvasToolbar from './CanvasToolbar';

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
  const [zoom, setZoom] = useState(100);
  const [activeTool, setActiveTool] = useState('select'); // 'select' | 'text' | 'draw' | 'highlight' | 'redact'
  const [isDrawing, setIsDrawing] = useState(false);
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

  // Interactive Signature State: selection and drag/resize tracking
  const [selectedSignatureId, setSelectedSignatureId] = useState(null);
  const [interactionState, setInteractionState] = useState(null);

  // Memoized signatures for the current active page
  const pageSignatures = useMemo(() => {
    return annotations
      .filter((a) => a.type === 'signature' && a.pageIndex === activePageIndex)
      .map((a, idx) => ({
        ...a,
        id: a.id || `sig-${a.pageIndex}-${idx}`,
      }));
  }, [annotations, activePageIndex]);

  // Automatically select newly stamped signatures during render without cascading effect renders
  const [prevSigCount, setPrevSigCount] = useState(pageSignatures.length);
  if (pageSignatures.length !== prevSigCount) {
    setPrevSigCount(pageSignatures.length);
    if (pageSignatures.length > prevSigCount) {
      setSelectedSignatureId(pageSignatures[pageSignatures.length - 1]?.id || null);
    }
  }

  // Window pointer listeners for moving and resizing signatures smoothly
  useEffect(() => {
    if (!interactionState) return;

    const handleMove = (e) => {
      const { type, handle, id, startPointer, startAnno, aspectRatio } = interactionState;
      const baseWidth = canvasDimensions.baseWidth || 612;
      const baseHeight = canvasDimensions.baseHeight || 792;
      const displayWidth = canvasDimensions.width || 612;
      const displayHeight = canvasDimensions.height || 792;

      const scaleX = baseWidth / displayWidth;
      const scaleY = baseHeight / displayHeight;

      const deltaX = (e.clientX - startPointer.x) * scaleX;
      const deltaY = (e.clientY - startPointer.y) * scaleY;

      if (type === 'move') {
        let newX = Math.round(startAnno.x + deltaX);
        let newY = Math.round(startAnno.y + deltaY);

        newX = Math.max(0, Math.min(newX, baseWidth - startAnno.width));
        newY = Math.max(0, Math.min(newY, baseHeight - startAnno.height));

        setAnnotations((prev) =>
          prev.map((a, idx) => {
            const annoId = a.id || `sig-${a.pageIndex}-${idx}`;
            return annoId === id ? { ...a, id: annoId, x: newX, y: newY } : a;
          })
        );
      } else if (type === 'resize') {
        const MIN_WIDTH = 45;
        const MIN_HEIGHT = 18;

        let newWidth = startAnno.width;
        let newHeight = startAnno.height;
        let newX = startAnno.x;
        let newY = startAnno.y;

        if (handle === 'se') {
          const delta = (deltaX + deltaY * aspectRatio) / 2;
          newWidth = Math.max(MIN_WIDTH, startAnno.width + delta);
          newHeight = Math.max(MIN_HEIGHT, Math.round(newWidth / aspectRatio));
          if (newX + newWidth > baseWidth) {
            newWidth = baseWidth - newX;
            newHeight = Math.round(newWidth / aspectRatio);
          }
          if (newY + newHeight > baseHeight) {
            newHeight = baseHeight - newY;
            newWidth = Math.round(newHeight * aspectRatio);
          }
        } else if (handle === 'sw') {
          const delta = (-deltaX + deltaY * aspectRatio) / 2;
          newWidth = Math.max(MIN_WIDTH, startAnno.width + delta);
          newHeight = Math.max(MIN_HEIGHT, Math.round(newWidth / aspectRatio));
          newX = startAnno.x + (startAnno.width - newWidth);
          if (newX < 0) {
            newX = 0;
            newWidth = startAnno.x + startAnno.width;
            newHeight = Math.round(newWidth / aspectRatio);
          }
          if (newY + newHeight > baseHeight) {
            newHeight = baseHeight - newY;
            newWidth = Math.round(newHeight * aspectRatio);
            newX = startAnno.x + (startAnno.width - newWidth);
          }
        } else if (handle === 'ne') {
          const delta = (deltaX - deltaY * aspectRatio) / 2;
          newWidth = Math.max(MIN_WIDTH, startAnno.width + delta);
          newHeight = Math.max(MIN_HEIGHT, Math.round(newWidth / aspectRatio));
          newY = startAnno.y + (startAnno.height - newHeight);
          if (newX + newWidth > baseWidth) {
            newWidth = baseWidth - newX;
            newHeight = Math.round(newWidth / aspectRatio);
            newY = startAnno.y + (startAnno.height - newHeight);
          }
          if (newY < 0) {
            newY = 0;
            newHeight = startAnno.y + startAnno.height;
            newWidth = Math.round(newHeight * aspectRatio);
          }
        } else if (handle === 'nw') {
          const delta = (-deltaX - deltaY * aspectRatio) / 2;
          newWidth = Math.max(MIN_WIDTH, startAnno.width + delta);
          newHeight = Math.max(MIN_HEIGHT, Math.round(newWidth / aspectRatio));
          newX = startAnno.x + (startAnno.width - newWidth);
          newY = startAnno.y + (startAnno.height - newHeight);
          if (newX < 0) {
            newX = 0;
            newWidth = startAnno.x + startAnno.width;
            newHeight = Math.round(newWidth / aspectRatio);
            newY = startAnno.y + (startAnno.height - newHeight);
          }
          if (newY < 0) {
            newY = 0;
            newHeight = startAnno.y + startAnno.height;
            newWidth = Math.round(newHeight * aspectRatio);
            newX = startAnno.x + (startAnno.width - newWidth);
          }
        }

        setAnnotations((prev) =>
          prev.map((a, idx) => {
            const annoId = a.id || `sig-${a.pageIndex}-${idx}`;
            return annoId === id
              ? {
                  ...a,
                  id: annoId,
                  x: Math.round(newX),
                  y: Math.round(newY),
                  width: Math.round(newWidth),
                  height: Math.round(newHeight),
                }
              : a;
          })
        );
      }
    };

    const handleUp = () => {
      setInteractionState(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [interactionState, canvasDimensions, setAnnotations]);

  // Keyboard shortcut: Delete or Backspace removes selected signature, Escape deselects
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedSignatureId) {
        setSelectedSignatureId(null);
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedSignatureId) {
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        ) {
          return;
        }
        setAnnotations((prev) =>
          prev.filter((a, idx) => (a.id || `sig-${a.pageIndex}-${idx}`) !== selectedSignatureId)
        );
        setSelectedSignatureId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSignatureId, setAnnotations]);

  // Click anywhere outside the signature overlay to deselect
  useEffect(() => {
    if (!selectedSignatureId) return;

    const handleGlobalPointerDown = (e) => {
      if (e.target.closest && e.target.closest('[data-signature-overlay]')) {
        return;
      }
      setSelectedSignatureId(null);
    };

    window.addEventListener('pointerdown', handleGlobalPointerDown);
    return () => {
      window.removeEventListener('pointerdown', handleGlobalPointerDown);
    };
  }, [selectedSignatureId]);

  const handleStartMove = (e, anno) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    setSelectedSignatureId(anno.id);
    setInteractionState({
      type: 'move',
      id: anno.id,
      startPointer: { x: e.clientX, y: e.clientY },
      startAnno: { x: anno.x, y: anno.y, width: anno.width, height: anno.height },
      aspectRatio: anno.width / (anno.height || 1),
    });
  };

  const handleStartResize = (e, anno, handle) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    setSelectedSignatureId(anno.id);
    setInteractionState({
      type: 'resize',
      handle,
      id: anno.id,
      startPointer: { x: e.clientX, y: e.clientY },
      startAnno: { x: anno.x, y: anno.y, width: anno.width, height: anno.height },
      aspectRatio: anno.width / (anno.height || 1),
    });
  };

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
    // Render all highlights (both committed on this page and active live stroke) onto an offscreen canvas
    // using solid opaque color. When overlapping strokes are drawn with opacity 1.0, they seamlessly merge
    // into a single contiguous shape without darkening. Then we blit the unified layer with a fixed 0.42 alpha.
    const highlightAnnos = pageAnnotations.filter((a) => a.type === 'highlight');
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
    const penAnnos = pageAnnotations.filter((a) => a.type === 'draw');
    penAnnos.forEach((anno) => {
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

    // 4. Signatures
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

  const handleMouseDown = (e) => {
    setSelectedSignatureId(null);
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const baseWidth = canvasDimensions.baseWidth || 612;
    const baseHeight = canvasDimensions.baseHeight || 792;
    const x = ((e.clientX - rect.left) / rect.width) * baseWidth;
    const y = ((e.clientY - rect.top) / rect.height) * baseHeight;

    if (activeTool === 'draw' || activeTool === 'highlight') {
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
    if (!isDrawing) return;
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const baseWidth = canvasDimensions.baseWidth || 612;
    const baseHeight = canvasDimensions.baseHeight || 792;
    const x = ((e.clientX - rect.left) / rect.width) * baseWidth;
    const y = ((e.clientY - rect.top) / rect.height) * baseHeight;

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
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const baseWidth = canvasDimensions.baseWidth || 612;
    const baseHeight = canvasDimensions.baseHeight || 792;
    const x = ((e.clientX - rect.left) / rect.width) * baseWidth;
    const y = ((e.clientY - rect.top) / rect.height) * baseHeight;

    if (activeTool === 'draw' || activeTool === 'highlight') {
      const finalPath = currentPath.length > 0 ? currentPath : [{ x, y }];
      if (finalPath.length > 0) {
        setAnnotations((prev) => [
          ...prev,
          {
            pageIndex: activePageIndex,
            type: activeTool,
            points: finalPath,
          },
        ]);
      }
      setCurrentPath([]);
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
    // Slightly larger hollow circle with a soft slate-600 border and no fill
    return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='11' fill='none' stroke='%23475569' stroke-width='1.5'/%3E%3C/svg%3E") 16 16, auto`;
  };

  return (
    <main className="flex-1 flex flex-col bg-slate-100/70 dark:bg-[#101012] h-full overflow-hidden relative min-w-0 transition-colors duration-150">
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
      <div
        ref={viewportRef}
        className="flex-1 overflow-auto p-6 md:p-8 flex flex-col items-center"
        onPointerDown={(e) => {
          if (!e.target.closest || !e.target.closest('[data-signature-overlay]')) {
            setSelectedSignatureId(null);
          }
        }}
      >
        <div className="my-auto py-2 flex flex-col items-center">
          <div
            className="relative bg-white shadow-2xl rounded-sm select-none"
            style={{
              width: `${canvasDimensions.width}px`,
              height: `${canvasDimensions.height}px`,
            }}
            onPointerDown={(e) => {
              if (!e.target.closest || !e.target.closest('[data-signature-overlay]')) {
                setSelectedSignatureId(null);
              }
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

            {/* 4. Interactive Movable & Resizable Signatures Layer */}
            {pageSignatures.map((anno) => {
              const isSelected = selectedSignatureId === anno.id;
              const baseWidth = canvasDimensions.baseWidth || 612;
              const baseHeight = canvasDimensions.baseHeight || 792;
              const displayWidth = canvasDimensions.width || 612;
              const displayHeight = canvasDimensions.height || 792;

              const leftPx = (anno.x / baseWidth) * displayWidth;
              const topPx = (anno.y / baseHeight) * displayHeight;
              const widthPx = (anno.width / baseWidth) * displayWidth;
              const heightPx = (anno.height / baseHeight) * displayHeight;

              return (
                <div
                  key={anno.id}
                  data-signature-overlay="true"
                  onPointerDown={(e) => handleStartMove(e, anno)}
                  onMouseDown={(e) => handleStartMove(e, anno)}
                  className={`absolute select-none touch-none cursor-move ${
                    isSelected
                      ? 'ring-2 ring-brand-500 ring-dashed bg-brand-500/10'
                      : 'hover:ring-1.5 hover:ring-brand-500/60 hover:ring-dashed hover:bg-brand-500/5'
                  }`}
                  style={{
                    left: `${leftPx}px`,
                    top: `${topPx}px`,
                    width: `${widthPx}px`,
                    height: `${heightPx}px`,
                    zIndex: isSelected ? 25 : 20,
                    pointerEvents: 'auto',
                  }}
                >
                  <img
                    src={anno.dataUrl}
                    alt="Stamped Signature"
                    draggable={false}
                    className="w-full h-full object-contain pointer-events-none select-none"
                  />

                  {/* Handles and delete button when selected */}
                  {isSelected && (
                    <>
                      {/* Delete button at top right */}
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setAnnotations((prev) =>
                            prev.filter(
                              (a, idx) => (a.id || `sig-${a.pageIndex}-${idx}`) !== anno.id
                            )
                          );
                          setSelectedSignatureId(null);
                        }}
                        title="Delete signature (or press Delete)"
                        className="absolute -top-3.5 -right-3.5 w-6 h-6 rounded-full bg-white dark:bg-slate-800 text-rose-500 hover:text-white hover:bg-rose-500 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors"
                        style={{ zIndex: 30 }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* 4 Corner Resize Handles */}
                      <div
                        onPointerDown={(e) => handleStartResize(e, anno, 'nw')}
                        onMouseDown={(e) => handleStartResize(e, anno, 'nw')}
                        title="Resize signature"
                        className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-brand-500 rounded-full shadow-xs cursor-nwse-resize hover:scale-125 transition-transform"
                        style={{ zIndex: 30 }}
                      />
                      <div
                        onPointerDown={(e) => handleStartResize(e, anno, 'ne')}
                        onMouseDown={(e) => handleStartResize(e, anno, 'ne')}
                        title="Resize signature"
                        className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-brand-500 rounded-full shadow-xs cursor-nesw-resize hover:scale-125 transition-transform"
                        style={{ zIndex: 30 }}
                      />
                      <div
                        onPointerDown={(e) => handleStartResize(e, anno, 'se')}
                        onMouseDown={(e) => handleStartResize(e, anno, 'se')}
                        title="Resize signature"
                        className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-brand-500 rounded-full shadow-xs cursor-nwse-resize hover:scale-125 transition-transform"
                        style={{ zIndex: 30 }}
                      />
                      <div
                        onPointerDown={(e) => handleStartResize(e, anno, 'sw')}
                        onMouseDown={(e) => handleStartResize(e, anno, 'sw')}
                        title="Resize signature"
                        className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-brand-500 rounded-full shadow-xs cursor-nesw-resize hover:scale-125 transition-transform"
                        style={{ zIndex: 30 }}
                      />
                    </>
                  )}
                </div>
              );
            })}

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
