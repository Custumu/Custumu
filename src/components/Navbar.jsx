import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Cloud, Download, RotateCcw, RotateCw, FileText,
  Image, ChevronDown, Check, Sparkles, Info, Merge, Split, Trash2, Copy,
  ArrowUpDown, FileSpreadsheet, LayoutGrid, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Navbar({
  hasDocument = false,
  documentName,
  pageCount,
  isPrivateMode,
  setIsPrivateMode,
  onResetDocument,
  onExportPdf,
  onExportWord,
  onExportExcel,
  onOpenPngModal,
  onOpenMergeModal,
  onOpenSplitModal,
  onDeletePage,
  onExtractPages,
  onOrganizePages,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) {
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const toolsMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target)) {
        setShowToolsMenu(false);
      }
    };
    if (showToolsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showToolsMenu]);

  const handleDownloadPdf = () => {
    setShowToolsMenu(false);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.1 } });
    onExportPdf && onExportPdf();
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

          {/* Active File Pill - only visible when a document is loaded */}
          {hasDocument && documentName && (
            <div className="hidden md:flex items-center space-x-2 text-xs text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/60">
              <FileText className="w-3.5 h-3.5 text-brand-400" />
              <span className="font-medium truncate max-w-[200px]">{documentName}</span>
            </div>
          )}
        </div>

        {/* Center: Undo / Redo - only visible when a document is in use */}
        {hasDocument && (
          <div className="hidden lg:flex items-center space-x-1 bg-white/60 p-1 rounded-lg border border-slate-200">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded transition ${canUndo ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 cursor-not-allowed'}`}
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded transition ${canRedo ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 cursor-not-allowed'}`}
              title="Redo (Ctrl+Y)"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Right: Tools Popover (Always Visible) & Export */}
        <div className="flex items-center space-x-2.5">
          {/* Privacy Switcher Badge */}
          {/* <div className="flex items-center bg-white border border-slate-200 rounded-full p-0.5">
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
          </div> */}

          {/* Multi-Column Tools & Conversion Popover */}
          <div className="relative" ref={toolsMenuRef}>
            <button
              onClick={() => setShowToolsMenu(!showToolsMenu)}
              className="flex items-center space-x-2 bg-[#205ae3] border border-[#205ae3] text-white font-medium text-xs sm:text-sm px-3.5 sm:px-4 py-1.5 rounded-lg hover:bg-[#184cc8] transition cursor-pointer shadow-sm"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Tools</span>
              <ChevronDown className={`w-3.5 h-3.5 ml-0.5 opacity-80 transition-transform ${showToolsMenu ? 'rotate-180' : ''}`} />
            </button>

              {showToolsMenu && (
                <div className="absolute right-0 mt-2 w-[540px] max-w-[95vw] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-800 animate-fade-in">
                  <div className="grid grid-cols-2 divide-x divide-slate-100">
                    
                    {/* Column 1: Native Functionality */}
                    <div className="p-3 space-y-1">
                      <div className="px-3 py-1.5 mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-brand-500" />
                        <span>Organize & Edit</span>
                      </div>

                      {/* Merge PDF */}
                      <button
                        onClick={() => { setShowToolsMenu(false); onOpenMergeModal && onOpenMergeModal(); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-start space-x-2.5 transition group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition shrink-0 mt-0.5">
                          <Merge className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 group-hover:text-indigo-600 transition">Merge PDF</div>
                          <div className="text-[11px] text-slate-500 leading-tight">Combine multiple files into one</div>
                        </div>
                      </button>

                      {/* Split PDF */}
                      <button
                        onClick={() => { setShowToolsMenu(false); if (!hasDocument) { alert('Please open or upload a PDF document first.'); return; } onOpenSplitModal && onOpenSplitModal(); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-start space-x-2.5 transition group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100 transition shrink-0 mt-0.5">
                          <Split className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 group-hover:text-cyan-600 transition">Split PDF</div>
                          <div className="text-[11px] text-slate-500 leading-tight">Separate into individual files</div>
                        </div>
                      </button>

                      {/* Remove pages */}
                      <button
                        onClick={() => { setShowToolsMenu(false); if (!hasDocument) { alert('Please open or upload a PDF document first.'); return; } onDeletePage && onDeletePage(); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-start space-x-2.5 transition group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-100 transition shrink-0 mt-0.5">
                          <Trash2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 group-hover:text-rose-600 transition">Remove pages</div>
                          <div className="text-[11px] text-slate-500 leading-tight">Delete unwanted pages</div>
                        </div>
                      </button>

                      {/* Extract pages */}
                      <button
                        onClick={() => { setShowToolsMenu(false); if (!hasDocument) { alert('Please open or upload a PDF document first.'); return; } onExtractPages && onExtractPages(); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-start space-x-2.5 transition group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition shrink-0 mt-0.5">
                          <Copy className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 group-hover:text-amber-600 transition">Extract pages</div>
                          <div className="text-[11px] text-slate-500 leading-tight">Save page ranges as new PDF</div>
                        </div>
                      </button>

                      {/* Organize PDF */}
                      <button
                        onClick={() => { setShowToolsMenu(false); if (!hasDocument) { alert('Please open or upload a PDF document first.'); return; } onOrganizePages && onOrganizePages(); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-start space-x-2.5 transition group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-violet-50 text-violet-600 group-hover:bg-violet-100 transition shrink-0 mt-0.5">
                          <ArrowUpDown className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 group-hover:text-violet-600 transition">Organize PDF</div>
                          <div className="text-[11px] text-slate-500 leading-tight">Reorder, rotate & sort pages</div>
                        </div>
                      </button>
                    </div>

                    {/* Column 2: Convert from PDF */}
                    <div className="p-3 space-y-1 bg-slate-50/40">
                      <div className="px-3 py-1.5 mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Convert from PDF</span>
                      </div>

                      {/* PDF to PNG */}
                      <button
                        onClick={() => { setShowToolsMenu(false); if (!hasDocument) { alert('Please open or upload a PDF document first.'); return; } onOpenPngModal && onOpenPngModal(); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white hover:shadow-xs flex items-start space-x-2.5 transition group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100 transition shrink-0 mt-0.5">
                          <Image className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 group-hover:text-cyan-600 transition">PDF to PNG</div>
                          <div className="text-[11px] text-slate-500 leading-tight">High-res images (.png)</div>
                        </div>
                      </button>

                      {/* PDF to Word */}
                      <button
                        onClick={() => { setShowToolsMenu(false); if (!hasDocument) { alert('Please open or upload a PDF document first.'); return; } onExportWord && onExportWord(); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white hover:shadow-xs flex items-start space-x-2.5 transition group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 group-hover:text-blue-600 transition">PDF to Word</div>
                          <div className="text-[11px] text-slate-500 leading-tight">Editable Word document (.doc)</div>
                        </div>
                      </button>

                      {/* PDF to Excel */}
                      <button
                        onClick={() => { setShowToolsMenu(false); if (!hasDocument) { alert('Please open or upload a PDF document first.'); return; } onExportExcel && onExportExcel(); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white hover:shadow-xs flex items-start space-x-2.5 transition group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition shrink-0 mt-0.5">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 group-hover:text-emerald-600 transition">PDF to Excel</div>
                          <div className="text-[11px] text-slate-500 leading-tight">Extract tables to spreadsheet (.xlsx)</div>
                        </div>
                      </button>

                      {/* Export as PDF */}
                      <button
                        onClick={() => { if (!hasDocument) { alert('Please open or upload a PDF document first.'); return; } handleDownloadPdf(); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white hover:shadow-xs flex items-start space-x-2.5 transition group cursor-pointer border-t border-slate-200/60 mt-2 pt-2.5"
                      >
                        <div className="p-2 rounded-lg bg-[#205ae3]/10 text-[#205ae3] group-hover:bg-[#205ae3]/20 transition shrink-0 mt-0.5">
                          <Download className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 group-hover:text-[#205ae3] transition">Export as PDF</div>
                          <div className="text-[11px] text-slate-500 leading-tight">Save PDF with annotations & edits</div>
                        </div>
                      </button>
                    </div>

                  </div>
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




