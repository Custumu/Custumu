import React, { useRef, useState, useEffect, useMemo } from 'react';
import { 
  MousePointer, 
  Type, 
  PenTool, 
  Highlighter, 
  Square, 
  Stamp, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft,
  ChevronRight,
  Lock,
  Loader2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { loadPdfDoc, renderPdfPage } from '../services/pdfRenderer';

export default function CenterCanvas({
  docBuffer,
  activePageIndex,
  totalPages,
  setActivePageIndex,
  onOpenSignatureModal,
  annotations,
  setAnnotations,
  onAddWatermark
}) {
  const viewportRef = useRef(null);
  const pdfCanvasRef = useRef(null);
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
    dpr: 1
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
  const renderAnnotations = (activeLivePath = null, activeLiveType = null, liveRedactRect = null) => {
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
    const isLiveHighlighting = activeLiveType === 'highlight' && activeLivePath && activeLivePath.length > 0;

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
    const sigAnnos = pageAnnotations.filter((a) => a.type === 'signature');
    sigAnnos.forEach((anno) => {
      const img = new Image();
      img.src = anno.dataUrl;
      const drawSig = () => {
        ctx.drawImage(img, anno.x * scaleX, anno.y * scaleY, anno.width * scaleX, anno.height * scaleY);
      };
      img.onload = drawSig;
      if (img.complete) drawSig();
    });

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

  const actionGroups = useMemo(() => [
    {
      id: 'drawing-tools',
      items: [
        {
          id: 'select',
          label: 'Select',
          icon: MousePointer,
          title: 'Select & Cursor',
          isTool: true,
          activeClass: 'bg-brand-50 text-brand-600 border-brand-200 shadow-2xs',
        },
        {
          id: 'text',
          label: 'Text',
          icon: Type,
          title: 'Add Text Overlay',
          isTool: true,
          activeClass: 'bg-brand-50 text-brand-600 border-brand-200 shadow-2xs',
        },
        {
          id: 'draw',
          label: 'Pen',
          icon: PenTool,
          title: 'Freehand Pen',
          isTool: true,
          activeClass: 'bg-brand-50 text-brand-600 border-brand-200 shadow-2xs',
        },
        {
          id: 'highlight',
          label: 'Highlight',
          icon: Highlighter,
          title: 'Highlighter',
          isTool: true,
          activeClass: 'bg-amber-50 text-amber-600 border-amber-200 shadow-2xs',
        },
        {
          id: 'redact',
          label: 'Redact',
          icon: Square,
          title: 'Redact / Blackout Box',
          isTool: true,
          activeClass: 'bg-rose-50 text-rose-600 border-rose-200 shadow-2xs',
        },
      ],
    },
    {
      id: 'document-actions',
      items: [
        {
          id: 'sign',
          label: 'Sign',
          icon: Stamp,
          title: 'e-Signature Pad',
          onClick: onOpenSignatureModal,
          className: 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/80 border-emerald-200 shadow-2xs',
        },
        {
          id: 'watermark',
          label: 'Watermark',
          icon: Lock,
          title: 'Watermark Document',
          onClick: () => onAddWatermark('CONFIDENTIAL'),
          className: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent',
          hideOnSmall: true,
        },
      ],
    },
  ], [onOpenSignatureModal, onAddWatermark]);

  const getToolCursor = () => {
    if (activeTool === 'select') return 'default';
    if (activeTool === 'text') return 'text';
    // Slightly larger hollow circle with a soft slate-600 border and no fill
    return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='11' fill='none' stroke='%23475569' stroke-width='1.5'/%3E%3C/svg%3E") 16 16, auto`;
  };

  return (
    <main className="flex-1 flex flex-col bg-slate-100/70 h-full overflow-hidden relative min-w-0">
      {/* Top Floating Action Toolbar */}
      <div className="h-11 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 flex items-center justify-between z-10 shrink-0 shadow-xs">
        {/* Left: Interactive Tools & Actions */}
        <div className="flex items-center space-x-1">
          {actionGroups.map((group, groupIdx) => (
            <React.Fragment key={group.id}>
              {groupIdx > 0 && <div className="h-4 w-px bg-slate-200 mx-1.5" />}
              <div className="flex items-center space-x-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTool === item.id;

                  if (item.isTool) {
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTool(item.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer border ${
                          isActive
                            ? item.activeClass
                            : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        title={item.title}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{item.label}</span>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={item.onClick}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer border ${item.className}`}
                      title={item.title}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className={item.hideOnSmall ? 'hidden md:inline' : ''}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Right: Page Navigation & Zoom Controls */}
        <div className="flex items-center space-x-2">
          {/* Page controls */}
          <div className="flex items-center space-x-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-xs text-slate-700 shadow-2xs">
            <button
              onClick={() => setActivePageIndex(Math.max(0, activePageIndex - 1))}
              disabled={activePageIndex === 0}
              className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-[11px] font-medium text-slate-700">
              {activePageIndex + 1} / {totalPages}
            </span>
            <button
              onClick={() => setActivePageIndex(Math.min(totalPages - 1, activePageIndex + 1))}
              disabled={activePageIndex === totalPages - 1}
              className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center space-x-1 bg-white px-1.5 py-0.5 rounded-lg border border-slate-200 text-xs text-slate-700 shadow-2xs">
            <button
              onClick={() => setZoom(Math.max(40, zoom - 15))}
              className="p-0.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="text-[11px] w-10 text-center font-mono hover:text-brand-600 font-medium cursor-pointer"
              title="Click to reset to 100%"
            >
              {zoom}%
            </button>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 15))}
              className="p-0.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fit Width / Fit Page buttons */}
          <div className="flex items-center space-x-0.5 bg-white p-0.5 rounded-lg border border-slate-200 text-slate-600 shadow-2xs">
            <button
              onClick={handleFitWidth}
              className="px-1.5 py-0.5 rounded text-[11px] font-medium hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1 cursor-pointer"
              title="Fit to Width"
            >
              <Maximize2 className="w-3 h-3 text-slate-500" />
              <span className="hidden xl:inline">Fit Width</span>
            </button>
            <button
              onClick={handleFitPage}
              className="px-1.5 py-0.5 rounded text-[11px] font-medium hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1 cursor-pointer"
              title="Fit to Page"
            >
              <Minimize2 className="w-3 h-3 text-slate-500" />
              <span className="hidden xl:inline">Fit Page</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Real PDF Canvas Viewport */}
      <div 
        ref={viewportRef}
        className="flex-1 overflow-auto p-6 md:p-8 flex flex-col items-center"
      >
        <div className="my-auto py-2 flex flex-col items-center">
          <div
            className="relative bg-white shadow-2xl rounded-sm select-none border border-slate-300"
            style={{
              width: `${canvasDimensions.width}px`,
              height: `${canvasDimensions.height}px`,
            }}
          >
            {/* Loading indicator */}
            {isRenderingPage && (
              <div className="absolute inset-0 bg-white/75 backdrop-blur-xs flex items-center justify-center z-30 transition-opacity">
                <div className="flex items-center space-x-2 text-brand-600 text-xs font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-lg">
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

            {/* 2. Top Layer: Interactive Annotation, Draw & Redaction Canvas */}
            <canvas
              ref={annotationCanvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className={`absolute inset-0 z-10 ${
                activeTool === 'select' ? 'pointer-events-none' : 'pointer-events-auto'
              }`}
              style={{
                width: `${canvasDimensions.width}px`,
                height: `${canvasDimensions.height}px`,
                cursor: getToolCursor(),
              }}
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
