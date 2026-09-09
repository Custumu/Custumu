import React, { useState, useEffect } from 'react';
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
  createDemoDocument,
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
    } catch (err) {
      console.error('Failed to load PDF', err);
      showToast('Failed to parse PDF document.', 'error');
    }
  };

  // Load sample demo agreement only if explicitly requested
  const handleLoadDemo = async (prompt = '') => {
    const demoBytes = await createDemoDocument();
    await loadBuffer(demoBytes, 'Custumu_Sample_Agreement.pdf', prompt);
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
  const handleExecuteAiAction = (action) => {
    if (action.type === 'DELETE_PAGE') {
      handleDeletePage(action.pageIndex);
    } else if (action.type === 'COMPRESS') {
      handleApplyCompression(action.targetMb, 'medium');
    } else if (action.type === 'WATERMARK') {
      handleAddWatermark(action.text);
    } else if (action.type === 'ROTATE_PAGE') {
      handleRotatePage(action.pageNumber - 1, action.degrees);
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
    <div className={`bg-slate-50 text-slate-800 flex flex-col selection:bg-brand-500 selection:text-white ${docBuffer ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
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
        documentName={docName}
        pageCount={docMeta.pageCount}
        isPrivateMode={isPrivateMode}
        setIsPrivateMode={setIsPrivateMode}
        onResetDocument={handleResetDocument}
        onExportPdf={handleExportPdf}
        onExportWord={handleExportWord}
        onExportExcel={handleExportExcel}
        onOpenPngModal={() => setIsPngModalOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />

      {/* Main Content Area */}
      {!docBuffer ? (
        <main className="flex-1 flex flex-col justify-center">
          <HeroDropzone
            onFileLoaded={(buf, name, prompt) => loadBuffer(buf, name, prompt)}
            onLoadDemo={(prompt) => handleLoadDemo(prompt)}
          />
        </main>
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
      )}

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




