import React, { useState } from 'react';
import { ShieldCheck, Cloud, Download, RotateCcw, RotateCw, FileText,
  Image, ChevronDown, Check, Sparkles, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Navbar({
  documentName,
  pageCount,
  isPrivateMode,
  setIsPrivateMode,
  onResetDocument,
  onExportPdf,
  onExportWord,
  onExportExcel,
  onOpenPngModal,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleDownloadPdf = () => {
    setShowExportMenu(false);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.1 } });
    onExportPdf();
  };

  return (
    <>
      <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0">
        {/* Brand & Document Name */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={onResetDocument} title="Custumu Home">
            <img src="/logo.svg" alt="Custumu" className="w-8 h-8" />
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                Custumu
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-dark-border mx-1 hidden md:block"></div>

          {/* Active File Pill */}
          <div className="hidden md:flex items-center space-x-2 bg-white/80 border border-slate-200 px-3 py-1.5 rounded-full text-xs text-slate-700">
            <FileText className="w-3.5 h-3.5 text-brand-400" />
            <span className="font-medium truncate max-w-[200px]">{documentName || 'Document.pdf'}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-600">{pageCount} {pageCount === 1 ? 'Page' : 'Pages'}</span>
          </div>
        </div>

        {/* Center: Undo / Redo */}
        <div className="hidden lg:flex items-center space-x-1 bg-white/60 p-1 rounded-lg border border-slate-200">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded transition ${canUndo ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-600 cursor-not-allowed'}`}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded transition ${canRedo ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-600 cursor-not-allowed'}`}
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Privacy Toggle & Export */}
        <div className="flex items-center space-x-3">
          {/* Privacy Switcher Badge */}
          <div className="flex items-center bg-white border border-slate-200 rounded-full p-0.5">
            <button
              onClick={() => setIsPrivateMode(true)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium transition ${
                isPrivateMode
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-600 hover:text-slate-700'
              }`}
              title="Private Mode: Zero uploads, 100% in-browser WebAssembly"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Private WASM</span>
            </button>
            <button
              onClick={() => setIsPrivateMode(false)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium transition ${
                !isPrivateMode
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30 shadow-sm'
                  : 'text-slate-600 hover:text-slate-700'
              }`}
              title="Cloud Mode: High-capacity AI & heavy worker conversions"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cloud Enclave</span>
            </button>
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="p-1 text-slate-500 hover:text-slate-700 transition"
              title="Privacy Information"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center space-x-2 bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white font-medium text-xs sm:text-sm px-3.5 sm:px-4 py-1.5 rounded-lg shadow-md hover:shadow-brand-500/25 transition"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl py-1.5 z-50 text-xs">
                <button
                  onClick={handleDownloadPdf}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-2 text-slate-800 transition"
                >
                  <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900">Export as PDF (.pdf)</div>
                    <div className="text-[11px] text-slate-500">Includes all annotations & edits</div>
                  </div>
                </button>
                <button
                  onClick={() => { setShowExportMenu(false); onOpenPngModal && onOpenPngModal(); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-2 text-slate-800 transition border-t border-slate-100"
                >
                  <Image className="w-4 h-4 text-cyan-600 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900">Export as PNG (.png)</div>
                    <div className="text-[11px] text-slate-500">Current page or all pages (High-Res)</div>
                  </div>
                </button>
                <button
                  onClick={() => { setShowExportMenu(false); onExportWord(); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-2 text-slate-800 transition border-t border-slate-100"
                >
                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900">Export as Word (.doc)</div>
                    <div className="text-[11px] text-slate-500">Editable text & headings</div>
                  </div>
                </button>
                <button
                  onClick={() => { setShowExportMenu(false); onExportExcel(); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-2 text-slate-800 transition border-t border-slate-100"
                >
                  <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900">Export Tables to Excel (.xlsx)</div>
                    <div className="text-[11px] text-slate-500">Spreadsheet table parser</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Privacy Guarantee Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Custumu Dual Privacy Engine</h3>
                <p className="text-xs text-slate-600">custumu.com enterprise guarantee</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed mb-6">
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Private Mode (Default)
                </div>
                <p className="text-slate-600">
                  Runs 100% inside your browser's WebAssembly engine. Your documents never leave your computer or touch any server.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <div className="font-semibold text-brand-400 mb-1 flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5" /> Cloud Enclave Mode
                </div>
                <p className="text-slate-600">
                  Used for high-capacity multi-page OCR and deep AI transformations. Files are end-to-end encrypted (TLS 1.3) and permanently purged immediately after generation.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium text-xs transition shadow"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
}




