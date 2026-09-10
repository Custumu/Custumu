import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, Check } from 'lucide-react';

const SIGNATURE_COLORS = [
  { id: 'black', value: '#000000', label: 'Black' },
  { id: 'blue', value: '#0284C7', label: 'Blue' },
  { id: 'red', value: '#DC2626', label: 'Red' },
];

export default function SignatureModal({ isOpen, onClose, onAdoptSignature }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [isOpen, selectedColor]);

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedColor('#000000');
    setHasDrawn(false);
    onClose();
  };

  const startDrawing = (x, y) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (x, y) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    startDrawing(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    draw(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    startDrawing(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    draw(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = selectedColor;
    setHasDrawn(false);
  };

  const handleAdopt = () => {
    if (!hasDrawn) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onAdoptSignature(dataUrl);
    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-[#161619] border border-slate-200 dark:border-[#27272e] rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Create E-Signature
              </h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Signature Drawing Canvas */}
        <div className="border border-slate-300 dark:border-slate-700 rounded-xl bg-white overflow-hidden relative mb-4 shadow-xs">
          {/* Color Selector Controls */}
          <div
            className="absolute top-2.5 right-2.5 flex items-center space-x-1.5 px-2 py-1.5 z-10"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {SIGNATURE_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedColor(c.value)}
                title={`${c.label} color`}
                aria-label={`Select ${c.label} color`}
                className="w-5 h-5 rounded-full cursor-pointer flex items-center justify-center text-white"
                style={{ backgroundColor: c.value }}
              >
                {selectedColor === c.value && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            ))}
          </div>

          <canvas
            ref={canvasRef}
            width={470}
            height={200}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={stopDrawing}
            onTouchCancel={stopDrawing}
            className="w-full h-44 cursor-crosshair block touch-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleClear}
            className="flex items-center space-x-1.5 px-3 py-2.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 transition cursor-pointer"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleClose}
              className="px-4 py-2.5 rounded-lg text-xs text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAdopt}
              disabled={!hasDrawn}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-lg bg-brand hover:bg-brand/80 disabled:opacity-40 text-white text-xs font-semibold transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Stamp Signature</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
