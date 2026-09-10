import React, { useState } from 'react';
import { X, Split, Download, Layers } from 'lucide-react';

export default function SplitModal({ isOpen, onClose, totalPages, onApplySplit }) {
  const [mode, setMode] = useState('all'); // 'all' (every page separate) | 'range'
  const [rangeInput, setRangeInput] = useState('1-2');

  if (!isOpen) return null;

  const handleSplit = () => {
    if (mode === 'all') {
      const ranges = Array.from({ length: totalPages }, (_, i) => ({
        name: `page_${i + 1}.pdf`,
        pageIndices: [i],
      }));
      onApplySplit(ranges);
    } else {
      // Parse ranges like "1-2"
      const parts = rangeInput.split('-').map((s) => parseInt(s.trim(), 10) - 1);
      const start = Math.max(0, parts[0] || 0);
      const end = Math.min(totalPages - 1, parts[1] !== undefined ? parts[1] : start);
      const indices = [];
      for (let i = start; i <= end; i++) indices.push(i);

      onApplySplit([
        {
          name: `extracted_pages_${start + 1}_to_${end + 1}.pdf`,
          pageIndices: indices,
        },
      ]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Split className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Split & Extract Pages</h3>
              <p className="text-xs text-slate-600">
                Extract page subsets or burst into individual files
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-600 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode('all')}
              className={`p-3 rounded-xl border text-left transition ${
                mode === 'all'
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="text-xs font-semibold">Extract Every Page</div>
              <div className="text-[10px] text-slate-600">
                Split into {totalPages} individual files
              </div>
            </button>

            <button
              onClick={() => setMode('range')}
              className={`p-3 rounded-xl border text-left transition ${
                mode === 'range'
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="text-xs font-semibold">Custom Range</div>
              <div className="text-[10px] text-slate-600">Extract specific page interval</div>
            </button>
          </div>

          {mode === 'range' && (
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
              <label className="text-xs text-slate-700">Page Range (e.g. 1-2):</label>
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder="1-2"
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-white outline-none focus:border-cyan-500 font-mono"
              />
              <p className="text-[10px] text-slate-500">Document has {totalPages} pages total.</p>
            </div>
          )}
        </div>

        <button
          onClick={handleSplit}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 transition"
        >
          <Download className="w-4 h-4" />
          <span>Extract & Download</span>
        </button>
      </div>
    </div>
  );
}
