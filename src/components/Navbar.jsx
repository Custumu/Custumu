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
  FileSpreadsheet,
  Sun,
  Moon,
  User,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDocument } from '../context/DocumentContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import UserMenu from './menus/UserMenu';
import ToolsMenu from './menus/ToolsMenu';

export default function Navbar(props) {
  const docCtx = useDocument();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const isEditor = location.pathname === '/editor';
  const hasDocument =
    props.hasDocument !== undefined ? props.hasDocument : isEditor && Boolean(docCtx.docBuffer);
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
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const exportMenuRef = useRef(null);
  const { user, openAuthModal } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  const handleDownloadPdf = () => {
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

          {/* Everyday PDF Tools Dropdown Menu */}
          <ToolsMenu
            hasDocument={hasDocument}
            onOpenMergeModal={onOpenMergeModal}
            onOpenSplitModal={onOpenSplitModal}
            onDeletePage={onDeletePage}
            onExtractPages={onExtractPages}
            onOrganizePages={onOrganizePages}
            onExportWord={onExportWord}
            onExportExcel={onExportExcel}
            onOpenPngModal={onOpenPngModal}
          />
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

          {/* User Auth: Sign In Button or Profile Dropdown */}
          {user ? (
            <UserMenu />
          ) : (
            <button
              onClick={() => openAuthModal('signin')}
              className="flex items-center space-x-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2f2f3a] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#25252c] transition cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Sign In</span>
            </button>
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
