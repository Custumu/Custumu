import React, { useState } from 'react';
import { X, Minimize2, CheckCircle2, Zap } from 'lucide-react';

export default function CompressModal({ isOpen, onClose, onApplyCompression, originalSizeBytes }) {
  const [targetMb, setTargetMb] = useState(2);
  const [quality, setQuality] = useState('medium'); // 'high' | 'medium' | 'extreme'

  if (!isOpen) return null;

  const originalMb = (originalSizeBytes / (1024 * 1024)).toFixed(2);
  const estimatedMb = (originalMb * (quality === 'extreme' ? 0.35 : quality === 'medium' ? 0.55 : 0.75)).toFixed(2);
  const estimatedSavings = Math.round((1 - (estimatedMb / originalMb)) * 100);

  const handleApply = () => {
    onApplyCompression(targetMb, quality);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Minimize2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Smart PDF Compression</h3>
              <p className="text-xs text-slate-600">Client-side WebAssembly compression</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-600 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Size & Reduction Preview */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 rounded-xl bg-white border border-slate-200">
            <div className="text-[11px] text-slate-600 mb-0.5">Original Size</div>
            <div className="text-base font-mono font-bold text-slate-200">{originalMb} MB</div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="text-[11px] text-amber-300 mb-0.5">Estimated Result</div>
            <div className="text-base font-mono font-bold text-amber-400">
              ~{estimatedMb} MB <span className="text-xs font-normal">(-{estimatedSavings}%)</span>
            </div>
          </div>
        </div>

        {/* Compression Presets */}
        <div className="space-y-2 mb-6">
          <label className="text-xs font-medium text-slate-700">Compression Profile</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'high', label: 'Light', desc: 'Best clarity' },
              { id: 'medium', label: 'Balanced', desc: 'Recommended' },
              { id: 'extreme', label: 'Extreme', desc: 'Email size' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setQuality(p.id)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  quality === p.id
                    ? 'bg-amber-500/20 border-amber-500/50 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="text-xs font-semibold">{p.label}</div>
                <div className="text-[10px] text-slate-600">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">Target Maximum Size</span>
            <span className="font-mono text-amber-400 font-semibold">&lt; {targetMb} MB</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={targetMb}
            onChange={(e) => setTargetMb(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleApply}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition"
        >
          <Zap className="w-4 h-4" />
          <span>Compress & Optimize PDF</span>
        </button>
      </div>
    </div>
  );
}

