import React, { useRef, useState, useEffect } from 'react';
import { 
  MousePointer, 
  Type, 
  PenTool, 
  Highlighter, 
  Square, 
  Stamp, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  FileCheck2,
  Lock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function CenterCanvas({
  activePageIndex,
  totalPages,
  setActivePageIndex,
  onOpenSignatureModal,
  annotations,
  setAnnotations,
  onAddWatermark
}) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(100);
  const [activeTool, setActiveTool] = useState('select'); // 'select' | 'text' | 'draw' | 'highlight' | 'redact'
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPath, setCurrentPath] = useState([]);
  const [textInputPos, setTextInputPos] = useState(null);
  const [textInputValue, setTextInputValue] = useState('');

  // Draw annotations on active page
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pageAnnotations = annotations.filter(a => a.pageIndex === activePageIndex);

    pageAnnotations.forEach((anno) => {
      if (anno.type === 'draw' || anno.type === 'highlight') {
        ctx.beginPath();
        ctx.strokeStyle = anno.type === 'highlight' ? 'rgba(253, 224, 71, 0.4)' : (anno.color || '#0284C7');
        ctx.lineWidth = anno.type === 'highlight' ? 14 : (anno.width || 3);
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
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(anno.text, anno.x, anno.y);
      } else if (anno.type === 'signature') {
        // Render signature image
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
  }, [activePageIndex, annotations, zoom]);

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

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
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

    if (activeTool === 'draw' || activeTool === 'highlight') {
      setCurrentPath((prev) => [...prev, { x, y }]);

      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
      ctx.strokeStyle = activeTool === 'highlight' ? 'rgba(253, 224, 71, 0.4)' : '#0284C7';
      ctx.lineWidth = activeTool === 'highlight' ? 14 : 3;
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
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

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
        {/* Left: Tools */}
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
            title="Redact / Blackout Rectangle"
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

        {/* Right: Zoom & Page Navigation */}
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

      {/* Main Canvas Document Viewer Area */}
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-dark-bg/60">
        <div
          className="relative bg-white shadow-2xl rounded-sm transition-all duration-200 select-none border border-slate-300"
          style={{
            width: `${612 * (zoom / 100)}px`,
            height: `${792 * (zoom / 100)}px`,
          }}
        >
          {/* Document Content Simulation */}
          <div className="w-full h-full p-8 text-slate-800 text-xs overflow-hidden pointer-events-none select-none">
            {activePageIndex === 0 && (
              <div className="space-y-4">
                <div className="bg-slate-900 text-cyan-400 p-4 -m-8 mb-6">
                  <h1 className="text-base font-bold tracking-tight">CUSTUMU CLOUD SERVICES AGREEMENT</h1>
                  <p className="text-[9px] text-slate-400 mt-1">Document ID: CST-2026-8942 • Version: 2.4 (Active)</p>
                </div>

                <div className="space-y-1">
                  <h2 className="font-bold text-slate-900 text-[11px] uppercase tracking-wide">1. Parties & Engagement Scope</h2>
                  <p className="text-[9.5px] text-slate-600 leading-relaxed">
                    This Master Services Agreement ("Agreement") is entered into as of September 9, 2026, by and
                    between Custumu Document Technologies ("Provider"), and Acme Enterprises Inc. ("Client").
                    Provider delivers automated AI workspace infrastructure, OCR document parsing, and secure
                    client-side WebAssembly document transformation pipelines.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <h2 className="font-bold text-slate-900 text-[11px] uppercase tracking-wide">2. Financial Schedule & Invoicing</h2>
                  <div className="border border-slate-200 rounded overflow-hidden text-[9px]">
                    <div className="bg-slate-100 p-1.5 font-bold flex justify-between border-b border-slate-200 text-slate-800">
                      <span className="w-2/5">Service Tier</span>
                      <span className="w-1/5 text-center">Units</span>
                      <span className="w-1/5 text-right">Rate</span>
                      <span className="w-1/5 text-right">Subtotal</span>
                    </div>
                    <div className="p-1.5 flex justify-between border-b border-slate-100 text-slate-700">
                      <span className="w-2/5 font-medium">AI Document Workspace</span>
                      <span className="w-1/5 text-center text-slate-500">50 Seats</span>
                      <span className="w-1/5 text-right">$49.00 / seat</span>
                      <span className="w-1/5 text-right font-medium">$2,450.00</span>
                    </div>
                    <div className="p-1.5 flex justify-between border-b border-slate-100 text-slate-700">
                      <span className="w-2/5 font-medium">High-Speed OCR Pipeline</span>
                      <span className="w-1/5 text-center text-slate-500">10,000 Pages</span>
                      <span className="w-1/5 text-right">$0.05 / page</span>
                      <span className="w-1/5 text-right font-medium">$500.00</span>
                    </div>
                    <div className="p-1.5 flex justify-between bg-slate-50 font-bold text-brand-600">
                      <span className="w-3/5">Total Monthly Retainer</span>
                      <span className="w-2/5 text-right">$2,950.00</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-2">
                  <h2 className="font-bold text-slate-900 text-[11px] uppercase tracking-wide">3. Payment & Termination Terms</h2>
                  <p className="text-[9.5px] text-slate-600 leading-relaxed">
                    <strong>Payment Terms:</strong> Net 30 days from invoice dispatch date.<br />
                    <strong>Late Interest:</strong> Outstanding balances incur 1.5% per month or statutory maximum.<br />
                    <strong>Termination Notice:</strong> Either party may terminate with 30 days written notice.<br />
                    <strong>Data Retention:</strong> In Private Mode, zero document data leaves client device memory.
                  </p>
                </div>
              </div>
            )}

            {activePageIndex === 1 && (
              <div className="space-y-4">
                <h1 className="text-sm font-bold text-brand-700 border-b border-slate-200 pb-2">
                  SERVICE LEVEL AGREEMENT & PRIVACY ENCLAVE
                </h1>

                <div className="space-y-2 text-[9.5px] text-slate-700 leading-relaxed">
                  <p><strong>1. UPTIME COMMITMENT:</strong> 99.95% monthly uptime across Cloud API endpoints.</p>
                  <p><strong>2. ZERO-KNOWLEDGE PRIVATE MODE:</strong><br />
                    When user toggles "Private Mode", all PDF manipulation, reordering, splitting, merging,
                    and annotations execute exclusively inside local WebAssembly runtime.
                    No file bytes or metadata are transmitted over network.
                  </p>
                  <p><strong>3. CLOUD ENCLAVE PROCESSING:</strong><br />
                    When Cloud Mode is utilized for multi-language OCR or complex LibreOffice conversions,
                    all payload buffers are encrypted in transit (TLS 1.3) and in memory, and purged
                    immediately upon completion of user download or 60 minutes, whichever is earlier.
                  </p>
                </div>
              </div>
            )}

            {activePageIndex === 2 && (
              <div className="space-y-6">
                <h1 className="text-sm font-bold text-brand-700 border-b border-slate-200 pb-2">
                  EXECUTION & AUTHORIZED SIGNATURES
                </h1>

                <p className="text-[9.5px] text-slate-600">
                  IN WITNESS WHEREOF, the authorized representatives have executed this Master Agreement.
                </p>

                <div className="grid grid-cols-2 gap-6 pt-4">
                  <div className="border border-slate-200 p-4 rounded bg-slate-50 space-y-2">
                    <div className="font-bold text-[10px] text-slate-700">PROVIDER: CUSTUMU TECHNOLOGIES</div>
                    <div className="h-10 flex items-center text-emerald-600 font-semibold text-xs border-b border-dashed border-slate-300">
                      [ e-Signed via Custumu ]
                    </div>
                    <div className="text-[9px] text-slate-500">Date: September 9, 2026</div>
                  </div>

                  <div className="border border-slate-200 p-4 rounded bg-slate-50 space-y-2">
                    <div className="font-bold text-[10px] text-slate-700">CLIENT: ACME ENTERPRISES INC.</div>
                    <div className="h-10 flex items-center text-slate-400 text-xs border-b border-dashed border-slate-300 italic">
                      Click "Sign" to stamp signature
                    </div>
                    <div className="text-[9px] text-slate-500">Date: ________________________</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Annotation Canvas Overlay */}
          <canvas
            ref={canvasRef}
            width={612}
            height={792}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="absolute inset-0 w-full h-full cursor-crosshair z-10"
          />

          {/* Text Input Popover */}
          {textInputPos && (
            <form
              onSubmit={handleAddTextSubmit}
              className="absolute z-30 bg-white border border-brand-500 shadow-xl rounded p-1 flex items-center space-x-1"
              style={{
                left: `${(textInputPos.x / 612) * 100}%`,
                top: `${(textInputPos.y / 792) * 100}%`,
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
