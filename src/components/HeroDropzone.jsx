import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  Wand2,
  Shield,
  Zap,
  FileSpreadsheet,
  Scissors,
  Minimize2,
} from 'lucide-react';

export default function HeroDropzone({ onFileLoaded }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0], pendingPrompt);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0], pendingPrompt);
    }
  };

  const processFile = async (file, promptToPass = '') => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert('Please upload a PDF file.');
      return;
    }
    const buffer = await file.arrayBuffer();
    onFileLoaded(buffer, file.name, promptToPass);
  };

  const handleQuickActionClick = (actionPrompt) => {
    setPendingPrompt(actionPrompt);
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center animate-fade-in">
      {/* Main Headline */}
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
        Your AI Workspace for <br className="hidden sm:inline" />
        <span>Documents & PDFs</span>
      </h1>

      <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
        Drop your document, tell us what you need, and Custumu handles it. Edit, convert, compress,
        extract tables, and chat with your files — in one unified workspace.
      </p>

      {/* Hero Dropzone Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`glass-panel rounded-2xl p-8 sm:p-12 transition-all duration-200 relative group cursor-pointer border-2 ${
          isDragging
            ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
            : 'border-dashed border-slate-200 dark:border-[#282834] hover:border-brand-500/50 hover:bg-white/50 dark:hover:bg-[#161619]/60'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          className="hidden"
        />

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-cyan-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-4 group-hover:scale-110 transition duration-300 shadow-lg shadow-brand-500/10">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            Drop your PDF here, or{' '}
            <span className="text-brand-400 underline underline-offset-4">browse</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
            Supports multi-page contracts, portfolios, invoices, scans, and financial documents
          </p>

          {/* Quick Action Badges */}
          <div className="w-full max-w-lg pt-4 border-t border-slate-200/80 dark:border-[#282834]">
            <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
              Choose your PDF to:
            </div>
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => handleQuickActionClick('Open in visual editor to annotate and sign')}
                className="p-2 rounded-lg bg-white dark:bg-[#1c1c21] hover:bg-slate-100 dark:hover:bg-[#25252c] border border-slate-200 dark:border-[#2b2b36] text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5 text-cyan-400" />
                <span>Edit & Sign</span>
              </button>

              <button
                onClick={() => handleQuickActionClick('Extract tables into Excel spreadsheet')}
                className="p-2 rounded-lg bg-white dark:bg-[#1c1c21] hover:bg-slate-100 dark:hover:bg-[#25252c] border border-slate-200 dark:border-[#2b2b36] text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>PDF → Excel</span>
              </button>

              <button
                onClick={() => handleQuickActionClick('Compress this document under 5MB')}
                className="p-2 rounded-lg bg-white dark:bg-[#1c1c21] hover:bg-slate-100 dark:hover:bg-[#25252c] border border-slate-200 dark:border-[#2b2b36] text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Compress</span>
              </button>

              <button
                onClick={() =>
                  handleQuickActionClick('What are the key takeaways of this document?')
                }
                className="p-2 rounded-lg bg-white dark:bg-[#1c1c21] hover:bg-slate-100 dark:hover:bg-[#25252c] border border-slate-200 dark:border-[#2b2b36] text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ask AI Copilot</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
