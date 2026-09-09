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
  Loader2
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
  const pdfCanvasRef = useRef(null);
  const annotationCanvasRef = useRef(null);
  const [zoom, setZoom] = useState(100);
  const [activeTool, setActiveTool] = useState('select'); // 'select' | 'text' | 'draw' | 'highlight' | 'redact'
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPath, setCurrentPath] = useState([]);
  const [textInputPos, setTextInputPos] = useState(null);
  const [textInputValue, setTextInputValue] = useState('');
  const [isRenderingPage, setIsRenderingPage] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 612, height: 792 });
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

  // 1. Render the REAL uploaded PDF page onto pdfCanvasRef
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

            // Synchronize the overlay annotation canvas dimensions
            if (annotationCanvasRef.current) {
              annotationCanvasRef.current.width = dimensions.width;
              annotationCanvasRef.current.height = dimensions.height;
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

  // 2. Render Annotations onto annotationCanvasRef
  useEffect(() => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pageAnnotations = annotations.filter(a => a.pageIndex === activePageIndex);

    pageAnnotations.forEach((anno) => {
      if (anno.type === 'draw' || anno.type === 'highlight') {
        ctx.beginPath();
        ctx.strokeStyle = anno.type === 'highlight' ? 'rgba(253, 224, 71, 0.45)' : (anno.color || '#0284C7');
        ctx.lineWidth = anno.type === 'highlight' ? 16 : (anno.width || 3);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        anno.points.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
      } else if (anno.type === 'redact') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(anno.x, anno.y, anno.width, anno.height);
      } else if (anno.type === 'text') {
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillText(anno.text, anno.x, anno.y);
      } else if (anno.type === 'signature') {
        const img = new Image();
        img.src = anno.dataUrl;
        img.onload = () => {
          ctx.drawImage(img, anno.x, anno.y, anno.width, anno.height);
        };
        if (img.complete) {
          ctx.drawImage(img, anno.x, anno.y, anno.width, anno.height);
        }
      }
    });
  }, [activePageIndex, annotations, canvasDimensions]);

  const handleMouseDown = (e) => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (activeTool === 'draw' || activeTool === 'highlight') {
      setIsDrawing(true);
      setCurrentPath([{ x, y }]);
    } else if (activeTool === 'redact') {
      setIsDrawing(true);
      setStartPos({ x, y });
    } else if (activeTool === 'text') {
      setTextInputPos({ x, y, clientX: e.clientX, clientY: e.clientY });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (activeTool === 'draw' || activeTool === 'highlight') {
      setCurrentPath((prev) => [...prev, { x, y }]);

      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.strokeStyle = activeTool === 'highlight' ? 'rgba(253, 224, 71, 0.45)' : '#0284C7';
      ctx.lineWidth = activeTool === 'highlight' ? 16 : 3;
      ctx.lineCap = 'round';
      const last = currentPath[currentPath.length - 1];
      if (last) {
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (activeTool === 'draw' || activeTool === 'highlight') {
      if (currentPath.length > 1) {
        setAnnotations((prev) => [
          ...prev,
          {
            pageIndex: activePageIndex,
            type: activeTool,
            points: currentPath,
          },
        ]);
      }
      setCurrentPath([]);
    } else if (activeTool === 'redact') {
      const width = Math.abs(x - startPos.x);
      const height = Math.abs(y - startPos.y);
      const startX = Math.min(x, startPos.x);
      const startY = Math.min(y, startPos.y);

      if (width > 8 && height > 8) {
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

  return (
    <main className="flex-1 flex flex-col bg-dark-bg h-[calc(100vh-4rem)] overflow-hidden relative">
      {/* Top Floating Action Toolbar */}
      <div className="h-12 border-b border-dark-border bg-dark-surface/90 backdrop-blur-md px-4 flex items-center justify-between z-20">
        {/* Tools */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTool('select')}
            className={`p-2 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition ${
              activeTool === 'select'
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                : 'text-slate-400 hover:text-white hover:bg-dark-hover'
            }`}
            title="Select & Cursor"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Select</span>
          </button>

          <button
            onClick={() => setActiveTool('text')}
            className={`p-2 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition ${
              activeTool === 'text'
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                : 'text-slate-400 hover:text-white hover:bg-dark-hover'
            }`}
            title="Add Text Overlay"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Text</span>
          </button>

          <button
            onClick={() => setActiveTool('draw')}
            className={`p-2 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition ${
              activeTool === 'draw'
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                : 'text-slate-400 hover:text-white hover:bg-dark-hover'
            }`}
            title="Freehand Pen"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pen</span>
          </button>

          <button
            onClick={() => setActiveTool('highlight')}
            className={`p-2 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition ${
              activeTool === 'highlight'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-dark-hover'
            }`}
            title="Highlighter"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Highlight</span>
          </button>

          <button
            onClick={() => setActiveTool('redact')}
            className={`p-2 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition ${
              activeTool === 'redact'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-white hover:bg-dark-hover'
            }`}
            title="Redact / Blackout Box"
          >
            <Square className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Redact</span>
          </button>

          <div className="h-4 w-px bg-dark-border mx-1"></div>

          <button
            onClick={onOpenSignatureModal}
            className="p-2 rounded-lg text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-1.5 transition"
            title="e-Signature Pad"
          >
            <Stamp className="w-3.5 h-3.5" />
            <span>Sign</span>
          </button>

          <button
            onClick={() => onAddWatermark('CONFIDENTIAL')}
            className="p-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-dark-hover flex items-center space-x-1.5 transition"
            title="Watermark Document"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Watermark</span>
          </button>
        </div>

        {/* Zoom & Page Navigation */}
        <div className="flex items-center space-x-2">
          {/* Page controls */}
          <div className="flex items-center space-x-1 bg-dark-card px-2 py-1 rounded-lg border border-dark-border text-xs text-slate-300">
            <button
              onClick={() => setActivePageIndex(Math.max(0, activePageIndex - 1))}
              disabled={activePageIndex === 0}
              className="p-0.5 rounded hover:bg-dark-hover disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-[11px] font-medium">
              {activePageIndex + 1} / {totalPages}
            </span>
            <button
              onClick={() => setActivePageIndex(Math.min(totalPages - 1, activePageIndex + 1))}
              disabled={activePageIndex === totalPages - 1}
              className="p-0.5 rounded hover:bg-dark-hover disabled:opacity-30"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center space-x-1 bg-dark-card px-2 py-1 rounded-lg border border-dark-border text-xs text-slate-300">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 15))}
              className="p-0.5 rounded hover:bg-dark-hover"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] w-9 text-center font-mono">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(175, zoom + 15))}
              className="p-0.5 rounded hover:bg-dark-hover"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Real PDF Canvas Viewport */}
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-dark-bg/80">
        <div
          className="relative bg-white shadow-2xl rounded-sm transition-all duration-200 select-none border border-slate-300 flex items-center justify-center overflow-hidden"
          style={{
            width: `${canvasDimensions.width}px`,
            height: `${canvasDimensions.height}px`,
            maxWidth: '100%',
          }}
        >
          {/* Loading indicator */}
          {isRenderingPage && !canvasRenderSuccess && (
            <div className="absolute inset-0 bg-dark-bg/60 backdrop-blur-xs flex items-center justify-center z-30">
              <div className="flex items-center space-x-2 text-brand-400 text-xs font-medium bg-dark-card px-3 py-1.5 rounded-lg border border-dark-border shadow-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Rendering Page {activePageIndex + 1}...</span>
              </div>
            </div>
          )}

          {/* 1. Base Layer: Real Uploaded PDF Page Rendered on Canvas */}
          <canvas
            ref={pdfCanvasRef}
            className={`w-full h-full ${canvasRenderSuccess ? 'block' : 'hidden'}`}
          />

          {/* 1b. Fallback native PDF viewer if canvas rendering is initializing */}
          {!canvasRenderSuccess && blobUrl && (
            <object
              data={`${blobUrl}#page=${activePageIndex + 1}&view=FitH&toolbar=0`}
              type="application/pdf"
              className="w-full h-full block"
            >
              <iframe
                src={`${blobUrl}#page=${activePageIndex + 1}`}
                className="w-full h-full border-0"
                title={`Page ${activePageIndex + 1}`}
              />
            </object>
          )}

          {/* 2. Top Layer: Interactive Annotation, Draw & Redaction Canvas */}
          <canvas
            ref={annotationCanvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`absolute inset-0 w-full h-full z-10 ${
              activeTool === 'select' ? 'pointer-events-none' : 'pointer-events-auto cursor-crosshair'
            }`}
          />

          {/* Text Input Popover */}
          {textInputPos && (
            <form
              onSubmit={handleAddTextSubmit}
              className="absolute z-30 bg-white border border-brand-500 shadow-xl rounded p-1 flex items-center space-x-1"
              style={{
                left: `${(textInputPos.x / canvasDimensions.width) * 100}%`,
                top: `${(textInputPos.y / canvasDimensions.height) * 100}%`,
              }}
            >
              <input
                type="text"
                autoFocus
                value={textInputValue}
                onChange={(e) => setTextInputValue(e.target.value)}
                placeholder="Type text annotation..."
                className="text-xs px-2 py-1 text-slate-800 outline-none w-48"
              />
              <button
                type="submit"
                className="bg-brand-500 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-brand-600"
              >
                Add
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
