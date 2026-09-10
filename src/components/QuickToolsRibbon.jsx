import React from 'react';
import {
  Merge,
  Split,
  Minimize2,
  ScanText,
  FileText,
  FileSpreadsheet,
  Sparkles,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { useDocument } from '../context/DocumentContext';

export default function QuickToolsRibbon() {
  const {
    docName,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    isPrivateMode,
    setIsMergeModalOpen,
    setIsSplitModalOpen,
    setIsCompressModalOpen,
    setIsOcrModalOpen,
    handleExportWord,
    handleExportExcel,
  } = useDocument();

  return (
    <div className="h-9 bg-white dark:bg-[#161619] border-b border-slate-200/90 dark:border-[#27272e] px-4 flex items-center justify-between text-xs shrink-0 z-20 shadow-2xs transition-colors duration-150">
      <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-hidden">
        {/* PDF File Name */}
        {docName && (
          <div className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-[#202026] px-2.5 py-0.5 rounded-full border border-slate-200/60 dark:border-[#2b2b34] shrink-0">
            <FileText className="w-3.5 h-3.5 text-brand-400 shrink-0" />
            <span className="font-medium truncate max-w-[130px] sm:max-w-[200px]" title={docName}>
              {docName}
            </span>
          </div>
        )}

        {/* Undo / Redo Buttons */}
        <div className="flex items-center space-x-0.5 bg-slate-100/80 dark:bg-[#202026] p-0.5 rounded-md border border-slate-200/60 dark:border-[#2b2b34] shrink-0">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`p-1 rounded transition ${
              canUndo
                ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#282832] cursor-pointer'
                : 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className={`p-1 rounded transition ${
              canRedo
                ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#282832] cursor-pointer'
                : 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-3 h-3" />
          </button>
        </div>

        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline shrink-0">|</span>

        <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium hidden sm:inline shrink-0">Tools:</span>
        <button
          onClick={() => setIsMergeModalOpen(true)}
          className="px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#25252c] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition text-[11px] cursor-pointer"
        >
          <Merge className="w-3 h-3 text-indigo-500" />
          <span>Merge</span>
        </button>

        <button
          onClick={() => setIsSplitModalOpen(true)}
          className="px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#25252c] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition text-[11px] cursor-pointer"
        >
          <Split className="w-3 h-3 text-cyan-600" />
          <span>Split</span>
        </button>

        <button
          onClick={() => setIsCompressModalOpen(true)}
          className="px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#25252c] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition text-[11px] cursor-pointer"
        >
          <Minimize2 className="w-3 h-3 text-amber-500" />
          <span>Compress</span>
        </button>

        <button
          onClick={() => setIsOcrModalOpen(true)}
          className="px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#25252c] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition text-[11px] cursor-pointer"
        >
          <ScanText className="w-3 h-3 text-emerald-600" />
          <span>OCR</span>
        </button>

        <button
          onClick={handleExportWord}
          className="px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#25252c] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition text-[11px] cursor-pointer"
        >
          <FileText className="w-3 h-3 text-blue-500" />
          <span>→ Word</span>
        </button>

        <button
          onClick={() => handleExportExcel()}
          className="px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#25252c] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition text-[11px] cursor-pointer"
        >
          <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
          <span>→ Excel</span>
        </button>
      </div>

      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 text-[11px] text-slate-700 dark:text-slate-200 font-medium">
          <Sparkles className="w-3 h-3 text-brand-500" />
          <span>AI Engine Connected</span>
        </div>
        <span className="text-slate-300 dark:text-slate-600 hidden md:inline">|</span>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:inline">
          custumu.com • {isPrivateMode ? '🛡️ Local WASM Engine' : '⚡ Cloud Enclave'}
        </div>
      </div>
    </div>
  );
}
