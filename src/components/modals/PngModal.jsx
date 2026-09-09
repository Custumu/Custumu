import React, { useState } from 'react';
import { X, Image, Sparkles, Download, Check, Loader2 } from 'lucide-react';

export default function PngModal({
  isOpen,
  onClose,
  activePageIndex = 0,
  totalPages = 1,
  docName = 'document.pdf',
  onExport
}) {
  const [scope, setScope] = useState('current'); // 'current' | 'all'
  const [scale, setScale] = useState(2); // 1 = 72dpi, 2 = 144dpi, 3 = 300dpi
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsProcessing(true);
    try {
      await onExport({ scope, scale });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden text-slate-800 animate-slide-up">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Image className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">PDF to PNG Converter</h3>
              <p className="text-[11px] text-slate-500">Render high-resolution PNG images from your PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Scope Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">Export Scope</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope('current')}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  scope === 'current'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">Current Page</div>
                  <div className="text-[10px] text-slate-500">Page {activePageIndex + 1} of {totalPages}</div>
                </div>
                {scope === 'current' && <Check className="w-4 h-4 text-blue-600" />}
              </button>

              <button
                type="button"
                onClick={() => setScope('all')}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  scope === 'all'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">All Pages</div>
                  <div className="text-[10px] text-slate-500">{totalPages} total PNGs</div>
                </div>
                {scope === 'all' && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            </div>
          </div>

          {/* Resolution Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">Output Resolution / Quality</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScale(1)}
                className={`p-2 rounded-xl border text-center transition ${
                  scale === 1
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600 text-xs'
                }`}
              >
                <div className="text-xs font-semibold">Standard</div>
                <div className="text-[10px] text-slate-400">1x (72 DPI)</div>
              </button>

              <button
                type="button"
                onClick={() => setScale(2)}
                className={`p-2 rounded-xl border text-center transition ${
                  scale === 2
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600 text-xs'
                }`}
              >
                <div className="text-xs font-semibold">High-Res</div>
                <div className="text-[10px] text-blue-600 font-medium">2x (Retina)</div>
              </button>

              <button
                type="button"
                onClick={() => setScale(3)}
                className={`p-2 rounded-xl border text-center transition ${
                  scale === 3
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600 text-xs'
                }`}
              >
                <div className="text-xs font-semibold">Ultra HD</div>
                <div className="text-[10px] text-slate-400">3x (300 DPI)</div>
              </button>
            </div>
          </div>

          {/* Info pill */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Direct browser rendering via WebAssembly. Preserves full colors, typography, images, and transparency.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleStartExport}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Converting...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export PNG {scope === 'all' ? `(${totalPages} Pages)` : `(Page ${activePageIndex + 1})`}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
