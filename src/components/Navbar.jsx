import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Cloud,
  Download,
  FileText,
  Image,
  ChevronDown,
  Check,
  Sparkles,
  Info,
  Merge,
  Split,
  Trash2,
  Copy,
  ArrowUpDown,
  FileSpreadsheet,
  LayoutGrid,
  Layers,
  Sun,
  Moon,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDocument } from '../context/DocumentContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar(props) {
  const docCtx = useDocument();
  const { theme, isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const isEditor = location.pathname === '/editor';
  const hasDocument =
    props.hasDocument !== undefined ? props.hasDocument : isEditor && Boolean(docCtx.docBuffer);
  const documentName = props.documentName ?? docCtx.docName;
  const pageCount = props.pageCount ?? docCtx.docMeta.pageCount;
  const isPrivateMode = props.isPrivateMode ?? docCtx.isPrivateMode;
  const setIsPrivateMode = props.setIsPrivateMode ?? docCtx.setIsPrivateMode;
  const onResetDocument =
    props.onResetDocument ?? (isEditor ? docCtx.handleResetDocument : () => navigate('/'));
  const onExportPdf = props.onExportPdf ?? docCtx.handleExportPdf;
  const onExportWord = props.onExportWord ?? docCtx.handleExportWord;
  const onExportExcel = props.onExportExcel ?? docCtx.handleExportExcel;
  const onOpenPngModal = props.onOpenPngModal ?? (() => docCtx.setIsPngModalOpen(true));
  const onOpenMergeModal = props.onOpenMergeModal ?? (() => docCtx.setIsMergeModalOpen(true));
  const onOpenSplitModal = props.onOpenSplitModal ?? (() => docCtx.setIsSplitModalOpen(true));
  const onDeletePage =
    props.onDeletePage ??
    (() => {
      if (docCtx.docMeta.pageCount <= 1) {
        docCtx.showToast('Document must contain at least 1 page.', 'error');
        return;
      }
      if (window.confirm(`Delete current page (Page ${docCtx.activePageIndex + 1})?`)) {
        docCtx.handleDeletePage(docCtx.activePageIndex);
      }
    });
  const onExtractPages = props.onExtractPages ?? (() => docCtx.setIsSplitModalOpen(true));
  const onOrganizePages =
    props.onOrganizePages ??
    (() => {
      docCtx.showToast(
        'Use the left thumbnails panel to reorder, rotate, or duplicate pages',
        'info'
      );
    });
  const onUndo = props.onUndo ?? docCtx.handleUndo;
  const onRedo = props.onRedo ?? docCtx.handleRedo;
  const canUndo = props.canUndo !== undefined ? props.canUndo : docCtx.canUndo;
  const canRedo = props.canRedo !== undefined ? props.canRedo : docCtx.canRedo;
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const toolsMenuRef = useRef(null);
  const toolsTimeoutRef = useRef(null);
  const exportMenuRef = useRef(null);

  const handleToolsMouseEnter = () => {
    if (toolsTimeoutRef.current) clearTimeout(toolsTimeoutRef.current);
    setShowToolsMenu(true);
  };

  const handleToolsMouseLeave = () => {
    toolsTimeoutRef.current = setTimeout(() => {
      setShowToolsMenu(false);
    }, 180);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target)) {
        setShowToolsMenu(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    if (showToolsMenu || showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (toolsTimeoutRef.current) clearTimeout(toolsTimeoutRef.current);
    };
  }, [showToolsMenu, showExportMenu]);

  const handleDownloadPdf = () => {
    setShowToolsMenu(false);
    setShowExportMenu(false);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.1 } });
    onExportPdf && onExportPdf();
  };

  return (
    <>
      <header className="h-16 border-b border-slate-200 dark:border-[#27272e] bg-white/90 dark:bg-[#161619]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 transition-colors duration-150">
        {/* Left: Brand & Tools Menu */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div
            className="flex items-center space-x-2.5 cursor-pointer"
            onClick={onResetDocument}
            title="Custumu Home"
          >
            <img src="/logo.svg" alt="Custumu" className="w-8 h-8" />
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                Custumu
              </span>
            </div>
          </div>

          {/* Multi-Column Tools & Conversion Navigation Menu */}
          <div
            className="relative py-1.5"
            ref={toolsMenuRef}
            onMouseEnter={handleToolsMouseEnter}
            onMouseLeave={handleToolsMouseLeave}
          >
            <button
              onClick={() => {
                setShowToolsMenu(!showToolsMenu);
                setShowExportMenu(false);
              }}
              className={`flex items-center space-x-1 font-medium text-xs sm:text-sm px-3 py-1.5 rounded-lg transition cursor-pointer ${
                showToolsMenu
                  ? 'text-[#205ae3] bg-blue-50/80 dark:bg-blue-950/40 dark:text-blue-400'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#25252c]'
              }`}
            >
              <span>Tools</span>
              <ChevronDown
                className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${showToolsMenu ? 'rotate-180 text-[#205ae3] dark:text-blue-400' : ''}`}
              />
            </button>

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

            {showToolsMenu && (
              <div className="absolute left-0 top-full pt-1 w-[540px] max-w-[95vw] z-50 animate-fade-in">
                <div className="bg-white dark:bg-[#161619] border border-slate-200 dark:border-[#27272e] rounded-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200">
                  <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-[#27272e]">
                    {/* Column 1: Native Functionality */}
                    <div className="p-3 space-y-1 dark:bg-[#161619]">
                      <div className="px-3 py-1.5 mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-brand-500" />
                        <span>Organize & Edit</span>
                      </div>

                      {/* Merge PDF */}
                      <button
                        onClick={() => {
                          setShowToolsMenu(false);
                          onOpenMergeModal && onOpenMergeModal();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-start space-x-2.5 transition group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition shrink-0 mt-0.5">
                          <Merge className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 group-hover:text-indigo-600 transition">
                            Merge PDF
                          </div>
                          <div className="text-[11px] text-slate-500 leading-tight">
                            Combine multiple files into one
                          </div>
                        </div>
                      </button>

                      {/* Split PDF */}
                      <button
                        onClick={() => {
                          setShowToolsMenu(false);
                          if (!hasDocument) {
                            alert('Please open or upload a PDF document first.');
                            return;
                          }
                          onOpenSplitModal && onOpenSplitModal();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-start space-x-2.5 transition group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100 transition shrink-0 mt-0.5">
                          <Split className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 group-hover:text-cyan-600 transition">
                            Split PDF
                          </div>
                          <div className="text-[11px] text-slate-500 leading-tight">
                            Separate into individual files
                          </div>
                        </div>
                      </button>

                      {/* Remove pages */}
                      <button
                        onClick={() => {
                          setShowToolsMenu(false);
                          if (!hasDocument) {
                            alert('Please open or upload a PDF document first.');
                            return;
                          }
                          onDeletePage && onDeletePage();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-start space-x-2.5 transition group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-100 transition shrink-0 mt-0.5">
                          <Trash2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 group-hover:text-rose-600 transition">
                            Remove pages
                          </div>
                          <div className="text-[11px] text-slate-500 leading-tight">
                            Delete unwanted pages
                          </div>
                        </div>
                      </button>

                      {/* Extract pages */}
                      <button
                        onClick={() => {
                          setShowToolsMenu(false);
                          if (!hasDocument) {
                            alert('Please open or upload a PDF document first.');
                            return;
                          }
                          onExtractPages && onExtractPages();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-start space-x-2.5 transition group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition shrink-0 mt-0.5">
                          <Copy className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 group-hover:text-amber-600 transition">
                            Extract pages
                          </div>
                          <div className="text-[11px] text-slate-500 leading-tight">
                            Save page ranges as new PDF
                          </div>
                        </div>
                      </button>

                      {/* Organize PDF */}
                      <button
                        onClick={() => {
                          setShowToolsMenu(false);
                          if (!hasDocument) {
                            alert('Please open or upload a PDF document first.');
                            return;
                          }
                          onOrganizePages && onOrganizePages();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-start space-x-2.5 transition group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-violet-50 text-violet-600 group-hover:bg-violet-100 transition shrink-0 mt-0.5">
                          <ArrowUpDown className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 group-hover:text-violet-600 transition">
                            Organize PDF
                          </div>
                          <div className="text-[11px] text-slate-500 leading-tight">
                            Reorder, rotate & sort pages
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Column 2: Convert from PDF */}
                    <div className="p-3 space-y-1 bg-slate-50/40 dark:bg-[#131316]/50">
                      <div className="px-3 py-1.5 mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Convert from PDF</span>
                      </div>

                      {/* PDF to PNG */}
                      <button
                        onClick={() => {
                          setShowToolsMenu(false);
                          if (!hasDocument) {
                            alert('Please open or upload a PDF document first.');
                            return;
                          }
                          onOpenPngModal && onOpenPngModal();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white dark:hover:bg-[#202026] hover:shadow-xs flex items-start space-x-2.5 transition group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100 transition shrink-0 mt-0.5">
                          <Image className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 transition">
                            PDF to PNG
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                            High-res images (.png)
                          </div>
                        </div>
                      </button>

                      {/* PDF to Word */}
                      <button
                        onClick={() => {
                          setShowToolsMenu(false);
                          if (!hasDocument) {
                            alert('Please open or upload a PDF document first.');
                            return;
                          }
                          onExportWord && onExportWord();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white dark:hover:bg-[#202026] hover:shadow-xs flex items-start space-x-2.5 transition group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition">
                            PDF to Word
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                            Editable Word document (.doc)
                          </div>
                        </div>
                      </button>

                      {/* PDF to Excel */}
                      <button
                        onClick={() => {
                          setShowToolsMenu(false);
                          if (!hasDocument) {
                            alert('Please open or upload a PDF document first.');
                            return;
                          }
                          onExportExcel && onExportExcel();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white dark:hover:bg-[#202026] hover:shadow-xs flex items-start space-x-2.5 transition group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition shrink-0 mt-0.5">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition">
                            PDF to Excel
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                            Extract tables to spreadsheet (.xlsx)
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Theme Toggle & Export */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Theme Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#25252c] transition cursor-pointer"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 hover:text-slate-900" />
            )}
          </button>

          {/* Export Dropdown - visible when a document is in use */}
          {hasDocument && (
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => {
                  setShowExportMenu(!showExportMenu);
                  setShowToolsMenu(false);
                }}
                className="flex items-center space-x-2 bg-[#205ae3] border border-[#205ae3] text-white font-medium text-xs sm:text-sm px-3.5 sm:px-4 py-1.5 rounded-lg hover:bg-[#184cc8] transition cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 ml-0.5 opacity-80 transition-transform ${showExportMenu ? 'rotate-180' : ''}`}
                />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#161619] border border-slate-200 dark:border-[#27272e] rounded-xl shadow-2xl py-1.5 z-50 text-xs animate-fade-in">
                  <button
                    onClick={handleDownloadPdf}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-[#202026] flex items-center space-x-2 text-slate-800 dark:text-slate-200 transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        Export as PDF (.pdf)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Includes all annotations & edits
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      onOpenPngModal && onOpenPngModal();
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-[#202026] flex items-center space-x-2 text-slate-800 dark:text-slate-200 transition border-t border-slate-100 dark:border-[#27272e] cursor-pointer"
                  >
                    <Image className="w-4 h-4 text-cyan-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        Export as PNG (.png)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Current page or all pages (High-Res)
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      onExportWord && onExportWord();
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-[#202026] flex items-center space-x-2 text-slate-800 dark:text-slate-200 transition border-t border-slate-100 dark:border-[#27272e] cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        Export as Word (.doc)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Editable text & headings
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      onExportExcel && onExportExcel();
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-[#202026] flex items-center space-x-2 text-slate-800 dark:text-slate-200 transition border-t border-slate-100 dark:border-[#27272e] cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        Export Tables to Excel (.xlsx)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Spreadsheet table parser
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Privacy Guarantee Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#161619] border border-slate-200 dark:border-[#27272e] rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in text-slate-800 dark:text-slate-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Custumu Dual Privacy Engine
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  custumu.com enterprise guarantee
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
              <div className="p-3 rounded-lg bg-white dark:bg-[#1c1c21] border border-slate-200 dark:border-[#282834]">
                <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Private Mode (Default)
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Runs 100% inside your browser's WebAssembly engine. Your documents never leave
                  your computer or touch any server.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-[#1c1c21] border border-slate-200 dark:border-[#282834]">
                <div className="font-semibold text-brand-400 mb-1 flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5" /> Cloud Enclave Mode
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Used for high-capacity multi-page OCR and deep AI transformations. Files are
                  end-to-end encrypted (TLS 1.3) and permanently purged immediately after
                  generation.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium text-xs transition shadow cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
}
