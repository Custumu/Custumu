import React from 'react';
import { Merge, Split, Minimize2, ScanText, FileText, FileSpreadsheet, Sparkles } from 'lucide-react';
import { useDocument } from '../context/DocumentContext';

export default function QuickToolsRibbon() {
  const {
    isPrivateMode,
    setIsMergeModalOpen,
    setIsSplitModalOpen,
    setIsCompressModalOpen,
    setIsOcrModalOpen,
    handleExportWord,
    handleExportExcel,
  } = useDocument();

  return (
    <div className="h-9 bg-white border-b border-slate-200/90 px-4 flex items-center justify-between text-xs shrink-0 z-20 shadow-2xs">
      <div className="flex items-center space-x-1.5">
        <span className="text-slate-500 text-[11px] font-medium hidden sm:inline">Tools:</span>
        <button
          onClick={() => setIsMergeModalOpen(true)}
          className="px-2 py-1 rounded-md hover:bg-slate-100 text-slate-700 hover:text-slate-900 flex items-center gap-1.5 transition text-[11px] cursor-pointer"
        >
          <Merge className="w-3 h-3 text-indigo-500" />
          <span>Merge</span>
        </button>

        <button
          onClick={() => setIsSplitModalOpen(true)}
          className="px-2 py-1 rounded-md hover:bg-slate-100 text-slate-700 hover:text-slate-900 flex items-center gap-1.5 transition text-[11px] cursor-pointer"
        >
          <Split className="w-3 h-3 text-cyan-600" />
          <span>Split</span>
        </button>

        <button
          onClick={() => setIsCompressModalOpen(true)}
          className="px-2 py-1 rounded-md hover:bg-slate-100 text-slate-700 hover:text-slate-900 flex items-center gap-1.5 transition text-[11px] cursor-pointer"
        >
          <Minimize2 className="w-3 h-3 text-amber-500" />
          <span>Compress</span>
        </button>

        <button
          onClick={() => setIsOcrModalOpen(true)}
          className="px-2 py-1 rounded-md hover:bg-slate-100 text-slate-700 hover:text-slate-900 flex items-center gap-1.5 transition text-[11px] cursor-pointer"
        >
          <ScanText className="w-3 h-3 text-emerald-600" />
          <span>OCR</span>
        </button>

        <button
          onClick={handleExportWord}
          className="px-2 py-1 rounded-md hover:bg-slate-100 text-slate-700 hover:text-slate-900 flex items-center gap-1.5 transition text-[11px] cursor-pointer"
        >
          <FileText className="w-3 h-3 text-blue-500" />
          <span>→ Word</span>
        </button>

        <button
          onClick={() => handleExportExcel()}
          className="px-2 py-1 rounded-md hover:bg-slate-100 text-slate-700 hover:text-slate-900 flex items-center gap-1.5 transition text-[11px] cursor-pointer"
        >
          <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
          <span>→ Excel</span>
        </button>
      </div>

      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 text-[11px] text-slate-700 font-medium">
          <Sparkles className="w-3 h-3 text-brand-500" />
          <span>AI Engine Connected</span>
        </div>
        <span className="text-slate-300 hidden md:inline">|</span>
        <div className="text-[11px] text-slate-500 hidden md:inline">
          custumu.com • {isPrivateMode ? '🛡️ Local WASM Engine' : '⚡ Cloud Enclave'}
        </div>
      </div>
    </div>
  );
}
