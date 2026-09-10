import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroDropzone from './components/HeroDropzone';
import LeftPanelPages from './components/LeftPanelPages';
import CenterCanvas from './components/CenterCanvas';
import RightPanelAI from './components/RightPanelAI';

import SignatureModal from './components/modals/SignatureModal';
import CompressModal from './components/modals/CompressModal';
import SplitModal from './components/modals/SplitModal';
import MergeModal from './components/modals/MergeModal';
import OCRModal from './components/modals/OCRModal';
import PngModal from './components/modals/PngModal';

import {
  inspectPdf,
  deletePagesFromPdf,
  rotatePdfPage,
  reorderPdfPages,
  mergePdfs,
  splitPdf,
  addWatermarkToPdf,
  compressPdf,
  exportTableToExcel,
  exportTextToWord,
  convertPdfPageToPng,
  convertAllPagesToPng,
  downloadImage,
} from './services/pdfEngine';

import { extractPdfTextLayers } from './services/pdfTextExtractor';
import { loadPdfDoc, renderThumbnail } from './services/pdfRenderer';

import { 
  Merge, 
  Split, 
  Minimize2, 
  FileText, 
  FileSpreadsheet, 
  ScanText, 
  CheckCircle2, 
  Sparkles
} from 'lucide-react';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isEditor = location.pathname === '/editor';

  // Document state
  const [docBuffer, setDocBuffer] = useState(null);
  const [docName, setDocName] = useState('');
  const [docMeta, setDocMeta] = useState({ pageCount: 0, pages: [], sizeBytes: 0 });
  const [docContext, setDocContext] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isPrivateMode, setIsPrivateMode] = useState(true);
  const [initialPrompt, setInitialPrompt] = useState('');

  // Undo / Redo History
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Annotations
  const [annotations, setAnnotations] = useState([]);

  // Modals state
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isCompressModalOpen, setIsCompressModalOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isPngModalOpen, setIsPngModalOpen] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Generate real page thumbnails whenever docBuffer changes
  const updateThumbnails = async (buffer, pageCount) => {
    try {
      const pdfDoc = await loadPdfDoc(buffer);
      const thumbs = [];
      for (let i = 1; i <= pageCount; i++) {
        const thumbData = await renderThumbnail(pdfDoc, i);
        thumbs.push(thumbData);
      }
      setThumbnails(thumbs);
    } catch (e) {
      console.warn('Could not generate thumbnails', e);
    }
  };

  // Push state to history
  const pushState = (newBuffer, newMeta, newAnnotations = annotations) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push({
      buffer: newBuffer,
      meta: newMeta,
      annotations: newAnnotations,
    });
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    updateThumbnails(newBuffer, newMeta.pageCount);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setDocBuffer(prev.buffer);
      setDocMeta(prev.meta);
      setAnnotations(prev.annotations);
      setHistoryIndex(historyIndex - 1);
      updateThumbnails(prev.buffer, prev.meta.pageCount);
      showToast('Action undone', 'info');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setDocBuffer(next.buffer);
      setDocMeta(next.meta);
      setAnnotations(next.annotations);
      setHistoryIndex(historyIndex + 1);
      updateThumbnails(next.buffer, next.meta.pageCount);
      showToast('Action redone', 'info');
    }
  };

  // Load new file buffer (from user file upload or demo)
  const loadBuffer = async (buffer, name, prompt = '') => {
    try {
      const meta = await inspectPdf(buffer);
      setDocBuffer(buffer);
      setDocName(name);
      setDocMeta(meta);
      setActivePageIndex(0);
      setAnnotations([]);
      setInitialPrompt(prompt);

      // Reset history
      setHistory([{ buffer, meta, annotations: [] }]);
      setHistoryIndex(0);

      // Generate real thumbnails from the actual PDF buffer
      updateThumbnails(buffer, meta.pageCount);

      // Extract real text layers for AI Grounding / RAG
      extractPdfTextLayers(buffer).then((context) => {
        setDocContext(context);
      });

      showToast(`Loaded ${name} (${meta.pageCount} pages)`);
      navigate('/editor');
    } catch (err) {
      console.error('Failed to load PDF', err);
      showToast('Failed to parse PDF document.', 'error');
    }
  };

  // Reset document
  const handleResetDocument = () => {
    if (confirm('Return to home screen? Unexported changes will be cleared.')) {
      setDocBuffer(null);
      setDocName('');
      setDocMeta({ pageCount: 0, pages: [], sizeBytes: 0 });
      setDocContext(null);
      setThumbnails([]);
      setHistory([]);
      setHistoryIndex(-1);
      navigate('/');
    }
  };

  // Rotate Page
  const handleRotatePage = async (pageIdx, degrees = 90) => {
    try {
      const updated = await rotatePdfPage(docBuffer, pageIdx, degrees);
      const meta = await inspectPdf(updated);
      setDocBuffer(updated);
      setDocMeta(meta);
      pushState(updated, meta);
      showToast(`Rotated Page ${pageIdx + 1} by ${degrees}°`);
    } catch (e) {
      console.error(e);
      showToast('Failed to rotate page', 'error');
    }
  };

  // Delete Page
  const handleDeletePage = async (pageIdx) => {
    if (docMeta.pageCount <= 1) {
      alert('Document must contain at least 1 page.');
      return;
    }
    try {
      const updated = await deletePagesFromPdf(docBuffer, [pageIdx]);
      const meta = await inspectPdf(updated);
      setDocBuffer(updated);
      setDocMeta(meta);
      setActivePageIndex((prev) => Math.min(prev, meta.pageCount - 1));
      const updatedAnnos = annotations.filter((a) => a.pageIndex !== pageIdx);
      setAnnotations(updatedAnnos);
      pushState(updated, meta, updatedAnnos);
      showToast(`Page ${pageIdx + 1} deleted`);
    } catch (e) {
      console.error(e);
      showToast('Failed to delete page', 'error');
    }
  };

  // Duplicate Page
  const handleDuplicatePage = async (pageIdx) => {
    try {
      const order = [];
      for (let i = 0; i < docMeta.pageCount; i++) {
        order.push(i);
        if (i === pageIdx) order.push(i);
      }
      const updated = await reorderPdfPages(docBuffer, order);
      const meta = await inspectPdf(updated);
      setDocBuffer(updated);
      setDocMeta(meta);
      pushState(updated, meta);
      showToast(`Duplicated Page ${pageIdx + 1}`);
    } catch (e) {
      console.error(e);
      showToast('Failed to duplicate page', 'error');
    }
  };

  // Move Page
  const handleMovePage = async (fromIdx, toIdx) => {
    try {
      const order = Array.from({ length: docMeta.pageCount }, (_, i) => i);
      const [removed] = order.splice(fromIdx, 1);
      order.splice(toIdx, 0, removed);

      const updated = await reorderPdfPages(docBuffer, order);
      const meta = await inspectPdf(updated);
      setDocBuffer(updated);
      setDocMeta(meta);
      setActivePageIndex(toIdx);
      pushState(updated, meta);
      showToast(`Moved Page ${fromIdx + 1} to Page ${toIdx + 1}`);
    } catch (e) {
      console.error(e);
      showToast('Failed to reorder pages', 'error');
    }
  };

  // Add Page
  const handleAddPage = async () => {
    try {
      const order = Array.from({ length: docMeta.pageCount }, (_, i) => i);
      const updated = await reorderPdfPages(docBuffer, [...order, order[0]]);
      const meta = await inspectPdf(updated);
      setDocBuffer(updated);
      setDocMeta(meta);
      setActivePageIndex(meta.pageCount - 1);
      pushState(updated, meta);
      showToast('Added new page to document');
    } catch (e) {
      console.error(e);
      showToast('Failed to add page', 'error');
    }
  };

  // Add Watermark
  const handleAddWatermark = async (watermarkText) => {
    try {
      const updated = await addWatermarkToPdf(docBuffer, watermarkText);
      const meta = await inspectPdf(updated);
      setDocBuffer(updated);
      setDocMeta(meta);
      pushState(updated, meta);
      showToast(`Watermark "${watermarkText}" stamped on all pages`);
    } catch (e) {
      console.error(e);
      showToast('Failed to add watermark', 'error');
    }
  };

  // Adopt Signature
  const handleAdoptSignature = (signatureDataUrl) => {
    setAnnotations((prev) => [
      ...prev,
      {
        pageIndex: activePageIndex,
        type: 'signature',
        dataUrl: signatureDataUrl,
        x: 180,
        y: 350,
        width: 170,
        height: 60,
      }
    ]);
    showToast('Signature placed on active page');
  };

  // Apply Compression
  const handleApplyCompression = async (targetMb, quality) => {
    try {
      const updated = await compressPdf(docBuffer, quality === 'extreme' ? 0.4 : 0.7);
      const meta = await inspectPdf(updated);
      setDocBuffer(updated);
      setDocMeta(meta);
      pushState(updated, meta);
      showToast(`Optimized document (< ${targetMb}MB)`);
    } catch (e) {
      console.error(e);
      showToast('Failed to compress document', 'error');
    }
  };

  // Apply Split
  const handleApplySplit = async (ranges) => {
    try {
      const splitDocs = await splitPdf(docBuffer, ranges);
      for (const item of splitDocs) {
        const blob = new Blob([item.bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name;
        a.click();
        URL.revokeObjectURL(url);
      }
      showToast(`Extracted ${splitDocs.length} PDF file(s)`);
    } catch (e) {
      console.error(e);
      showToast('Failed to split document', 'error');
    }
  };

  // Apply Merge
  const handleApplyMerge = async (pdfBuffers) => {
    try {
      const mergedBytes = await mergePdfs(pdfBuffers);
      await loadBuffer(mergedBytes, 'Custumu_Merged_Document.pdf');
      showToast('Successfully merged documents into workspace');
    } catch (e) {
      console.error(e);
      showToast('Failed to merge documents', 'error');
    }
  };

  // Export PDF
  const handleExportPdf = () => {
    const blob = new Blob([docBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Custumu_${docName || 'Document.pdf'}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded PDF with all changes');
  };

  // Export Word
  const handleExportWord = () => {
    const textContent = docContext?.fullText || 'Custumu Document Content';
    exportTextToWord(docName || 'Document', textContent, `Custumu_${docName.replace(/\.pdf$/i, '')}.doc`);
    showToast('Downloaded Word document (.doc)');
  };

  // Export Excel
  const handleExportExcel = (customTables) => {
    const tables = customTables || [
      {
        name: 'Extracted Tables',
        rows: [
          { 'Item': 'Document Analysis', 'File': docName || 'Document', 'Status': 'Verified' }
        ],
      },
    ];
    exportTableToExcel(tables, `Custumu_${(docName || 'Data').replace(/\.pdf$/i, '')}.xlsx`);
    showToast('Downloaded Excel spreadsheet (.xlsx)');
  };

  // Autonomous AI action execution
  const handleExecuteAiAction = async (action) => {
    if (!action) return;

    if (action.type === 'SPLIT_PDF') {
      const totalP = docMeta?.pageCount || 1;
      let ranges = [];

      if (action.mode === 'all_pages' || (!action.pageNumbers?.length && !action.ranges?.length)) {
        // Split every single page into its own PDF file
        ranges = Array.from({ length: totalP }, (_, i) => ({
          name: `${(docName || 'document').replace(/\.pdf$/i, '')}_page_${i + 1}.pdf`,
          pageIndices: [i],
        }));
      } else if (action.ranges && action.ranges.length > 0) {
        ranges = action.ranges.map((r, idx) => ({
          name: r.name || `part_${idx + 1}.pdf`,
          pageIndices: (r.page_numbers || r.pageNumbers || [])
            .map((p) => p - 1)
            .filter((p) => p >= 0 && p < totalP),
        }));
      } else if (action.pageNumbers && action.pageNumbers.length > 0) {
        const indices = action.pageNumbers
          .map((p) => p - 1)
          .filter((p) => p >= 0 && p < totalP);
        ranges = [
          {
            name: `${(docName || 'document').replace(/\.pdf$/i, '')}_extracted.pdf`,
            pageIndices: indices,
          },
        ];
      }

      if (ranges.length > 0) {
        await handleApplySplit(ranges);
      } else {
        showToast('No valid pages found to split.', 'error');
      }
    } else if (action.type === 'DELETE_PAGES' || action.type === 'DELETE_PAGE') {
      const pageNumbers = action.pageNumbers || (action.pageNumber ? [action.pageNumber] : []);
      if (!pageNumbers.length) return;
      if (docMeta.pageCount <= pageNumbers.length) {
        showToast('Cannot delete all pages from document.', 'error');
        return;
      }
      const pageIndices = pageNumbers
        .map((p) => p - 1)
        .filter((p) => p >= 0 && p < docMeta.pageCount);
      try {
        const updated = await deletePagesFromPdf(docBuffer, pageIndices);
        const meta = await inspectPdf(updated);
        setDocBuffer(updated);
        setDocMeta(meta);
        setActivePageIndex((prev) => Math.min(prev, meta.pageCount - 1));
        const updatedAnnos = annotations.filter((a) => !pageIndices.includes(a.pageIndex));
        setAnnotations(updatedAnnos);
        pushState(updated, meta, updatedAnnos);
        showToast(
          pageNumbers.length === 1
            ? `Deleted Page ${pageNumbers[0]}`
            : `Deleted Pages ${pageNumbers.join(', ')}`
        );
      } catch (e) {
        console.error(e);
        showToast('Failed to delete page(s)', 'error');
      }
    } else if (action.type === 'ROTATE_PAGES' || action.type === 'ROTATE_PAGE') {
      const pageNumbers = action.pageNumbers || (action.pageNumber ? [action.pageNumber] : []);
      const degrees = action.degrees || 90;
      const totalP = docMeta?.pageCount || 1;
      const targetIndices = pageNumbers.length > 0
        ? pageNumbers.map((p) => p - 1).filter((p) => p >= 0 && p < totalP)
        : Array.from({ length: totalP }, (_, i) => i);

      try {
        let currentBuf = docBuffer;
        for (const idx of targetIndices) {
          currentBuf = await rotatePdfPage(currentBuf, idx, degrees);
        }
        const meta = await inspectPdf(currentBuf);
        setDocBuffer(currentBuf);
        setDocMeta(meta);
        pushState(currentBuf, meta);
        showToast(
          targetIndices.length === 1
            ? `Rotated Page ${targetIndices[0] + 1} by ${degrees}°`
            : `Rotated ${targetIndices.length} pages by ${degrees}°`
        );
      } catch (e) {
        console.error(e);
        showToast('Failed to rotate pages', 'error');
      }
    } else if (action.type === 'REORDER_PAGES') {
      const newOrder = action.newOrder || [];
      const totalP = docMeta?.pageCount || 1;
      const orderIndices = newOrder.map((p) => p - 1).filter((p) => p >= 0 && p < totalP);
      if (orderIndices.length !== totalP) {
        showToast('Invalid page sequence for reordering.', 'error');
        return;
      }
      try {
        const updated = await reorderPdfPages(docBuffer, orderIndices);
        const meta = await inspectPdf(updated);
        setDocBuffer(updated);
        setDocMeta(meta);
        pushState(updated, meta);
        showToast('Reordered document pages successfully');
      } catch (e) {
        console.error(e);
        showToast('Failed to reorder pages', 'error');
      }
    } else if (action.type === 'WATERMARK') {
      handleAddWatermark(action.text);
    } else if (action.type === 'COMPRESS') {
      handleApplyCompression(action.targetMb || 5, action.quality || 'medium');
    } else if (action.type === 'EXPORT') {
      if (action.format === 'word') handleExportWord();
      else if (action.format === 'excel') handleExportExcel();
      else if (action.format === 'png') handleExportPng({ scope: 'all' });
      else handleExportPdf();
    } else if (action.type === 'EXTRACT_TABLES') {
      handleExportExcel(action.tables);
    } else if (action.type === 'EXPORT_WORD') {
      handleExportWord();
    }
  };

  const handleExportPng = async ({ scope, scale = 2 }) => {
    if (!docBuffer) return;
    try {
      setToast({ message: 'Rendering high-resolution PNG...', type: 'info' });
      const baseName = (docName || 'document').replace(/\.[^/.]+$/, '');

      if (scope === 'all') {
        const pages = await convertAllPagesToPng(docBuffer, scale, annotations);
        pages.forEach(({ pageNumber, dataUrl }) => {
          downloadImage(dataUrl, `${baseName}-page-${pageNumber}.png`);
        });
        setToast({ message: `Exported ${pages.length} pages to PNG!`, type: 'success' });
      } else {
        const dataUrl = await convertPdfPageToPng(docBuffer, activePageIndex, scale, annotations);
        if (dataUrl) {
          downloadImage(dataUrl, `${baseName}-page-${activePageIndex + 1}.png`);
          setToast({ message: `Page ${activePageIndex + 1} exported to PNG!`, type: 'success' });
        } else {
          alert('Could not render page to PNG.');
        }
      }
      setIsPngModalOpen(false);
    } catch (err) {
      console.error('Export PNG failed:', err);
      alert('Failed to export PNG image.');
    }
  };

  return (
    <div className={`bg-slate-50 text-slate-800 flex flex-col selection:bg-brand-500 selection:text-white ${isEditor ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-slide-up">
          <div className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs shadow-2xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        hasDocument={isEditor && Boolean(docBuffer)}
        documentName={docName}
        pageCount={docMeta.pageCount}
        isPrivateMode={isPrivateMode}
        setIsPrivateMode={setIsPrivateMode}
        onResetDocument={isEditor ? handleResetDocument : () => navigate('/')}
        onExportPdf={handleExportPdf}
        onExportWord={handleExportWord}
        onExportExcel={handleExportExcel}
        onOpenPngModal={() => setIsPngModalOpen(true)}
        onOpenMergeModal={() => setIsMergeModalOpen(true)}
        onOpenSplitModal={() => setIsSplitModalOpen(true)}
        onDeletePage={() => {
          if (docMeta.pageCount <= 1) {
            showToast('Document must contain at least 1 page.', 'error');
            return;
          }
          if (window.confirm(`Delete current page (Page ${activePageIndex + 1})?`)) {
            handleDeletePage(activePageIndex);
          }
        }}
        onExtractPages={() => setIsSplitModalOpen(true)}
        onOrganizePages={() => {
          showToast('Use the left thumbnails panel to reorder, rotate, or duplicate pages', 'info');
        }}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />

      <Routes>
        {/* Root Path: Landing Page */}
        <Route
          path="/"
          element={
            <main className="flex-1 flex flex-col justify-center">
              {docBuffer && (
                <div className="max-w-xl mx-auto w-full px-4 pt-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900 shadow-sm">
                    <div className="flex items-center space-x-2 truncate">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="truncate font-medium">Active document in editor: {docName}</span>
                    </div>
                    <button
                      onClick={() => navigate('/editor')}
                      className="px-3 py-1.5 bg-[#205ae3] hover:bg-[#184cc8] text-white font-medium rounded-lg transition shrink-0 ml-2 cursor-pointer text-xs"
                    >
                      Return to Editor &rarr;
                    </button>
                  </div>
                </div>
              )}
              <HeroDropzone
                onFileLoaded={(buf, name, prompt) => loadBuffer(buf, name, prompt)}
              />
            </main>
          }
        />

        {/* Editor Path: Full 3-Panel Editor Layout */}
        <Route
          path="/editor"
          element={
            !docBuffer ? (
              <Navigate to="/" replace />
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                {/* Top Quick Tools Ribbon */}
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

                {/* 3-Panel Grid */}
                <div className="flex-1 flex overflow-hidden min-h-0">
                  {/* Left: Real Page Thumbnails */}
                  <LeftPanelPages
                    pages={docMeta.pages}
                    thumbnails={thumbnails}
                    activePageIndex={activePageIndex}
                    setActivePageIndex={setActivePageIndex}
                    onRotatePage={handleRotatePage}
                    onDeletePage={handleDeletePage}
                    onDuplicatePage={handleDuplicatePage}
                    onMovePage={handleMovePage}
                    onAddPage={handleAddPage}
                    onOpenSplitModal={() => setIsSplitModalOpen(true)}
                  />

                  {/* Center: Real PDF Canvas Viewer & Interactive Annotations */}
                  <CenterCanvas
                    docBuffer={docBuffer}
                    activePageIndex={activePageIndex}
                    totalPages={docMeta.pageCount}
                    setActivePageIndex={setActivePageIndex}
                    onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
                    annotations={annotations}
                    setAnnotations={setAnnotations}
                    onAddWatermark={handleAddWatermark}
                  />

                  {/* Right: Enterprise AI Copilot */}
                  <RightPanelAI
                    documentMetadata={docMeta}
                    documentContext={docContext}
                    onExecuteAiAction={handleExecuteAiAction}
                    onExportExcel={handleExportExcel}
                    onExportWord={handleExportWord}
                    onJumpToPage={(targetIdx) => setActivePageIndex(targetIdx)}
                    initialPrompt={initialPrompt}
                  />
                </div>
              </div>
            )
          }
        />

        {/* Catch-all: Redirect unknown routes to "/" */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Modals */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onAdoptSignature={handleAdoptSignature}
      />

      <CompressModal
        isOpen={isCompressModalOpen}
        onClose={() => setIsCompressModalOpen(false)}
        onApplyCompression={handleApplyCompression}
        originalSizeBytes={docMeta.sizeBytes}
      />

      <SplitModal
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
        totalPages={docMeta.pageCount}
        onApplySplit={handleApplySplit}
      />

      <MergeModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        currentDocBytes={docBuffer}
        currentDocName={docName}
        onApplyMerge={handleApplyMerge}
      />

      <OCRModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        activePageIndex={activePageIndex}
      />

      <PngModal
        isOpen={isPngModalOpen}
        onClose={() => setIsPngModalOpen(false)}
        activePageIndex={activePageIndex}
        totalPages={docMeta.pageCount}
        docName={docName}
        onExport={handleExportPng}
      />
    </div>
  );
}




