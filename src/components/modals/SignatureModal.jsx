import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, Check, Stamp } from 'lucide-react';

export default function SignatureModal({ isOpen, onClose, onAdoptSignature }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      setHasDrawn(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleAdopt = () => {
    if (!hasDrawn) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onAdoptSignature(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-[#161619] border border-slate-200 dark:border-[#27272e] rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Create E-Signature</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Draw your signature with your mouse or stylus
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Signature Drawing Canvas */}
        <div className="border border-slate-700 rounded-xl bg-white overflow-hidden relative mb-4">
          <canvas
            ref={canvasRef}
            width={460}
            height={180}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-full h-44 cursor-crosshair"
          />
          <div className="absolute bottom-2 left-4 text-[10px] text-slate-600 select-none">
            Custumu Verified E-Signature
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleClear}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 transition"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs text-slate-600 hover:text-slate-900 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAdopt}
              disabled={!hasDrawn}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md transition"
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
