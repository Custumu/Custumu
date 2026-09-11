import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create E-Signature</DialogTitle>
        </DialogHeader>

        {/* Signature Drawing Canvas */}
        <div className="border border-slate-300 dark:border-slate-700 rounded-xl bg-white overflow-hidden relative my-2 shadow-xs">
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
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center space-x-1.5 px-3 py-2.5 rounded-lg bg-white dark:bg-card hover:bg-slate-100 dark:hover:bg-accent border border-slate-200 dark:border-border text-xs text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleAdopt}
              disabled={!hasDrawn}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-lg bg-brand hover:bg-brand/80 disabled:opacity-40 text-white text-xs font-semibold transition cursor-pointer"
            >
              <span>Stamp Signature</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
