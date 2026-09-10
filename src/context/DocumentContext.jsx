import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '../services/pdfEngine';
import { extractPdfTextLayers } from '../services/pdfTextExtractor';
import { loadPdfDoc, renderThumbnail } from '../services/pdfRenderer';

const DocumentContext = createContext(null);

export function DocumentProvider({ children }) {
  const navigate = useNavigate();

  // Document Core State
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

  // Modals Visibility
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isCompressModalOpen, setIsCompressModalOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isPngModalOpen, setIsPngModalOpen] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Thumbnail generator
  const updateThumbnails = useCallback(async (buffer, pageCount) => {
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
  }, []);

  // History State Tracker
  const pushState = useCallback((newBuffer, newMeta, newAnnotations = annotations) => {
    setHistory((prevHistory) => {
      const nextHistory = prevHistory.slice(0, historyIndex + 1);
      nextHistory.push({
        buffer: newBuffer,
        meta: newMeta,
        annotations: newAnnotations,
      });
      return nextHistory;
    });
    setHistoryIndex((prevIndex) => prevIndex + 1);
    updateThumbnails(newBuffer, newMeta.pageCount);
  }, [annotations, historyIndex, updateThumbnails]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setDocBuffer(prev.buffer);
      setDocMeta(prev.meta);
      setAnnotations(prev.annotations);
      setHistoryIndex(historyIndex - 1);
      updateThumbnails(prev.buffer, prev.meta.pageCount);
      showToast('Action undone', 'info');
    }
  }, [history, historyIndex, showToast, updateThumbnails]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setDocBuffer(next.buffer);
      setDocMeta(next.meta);
      setAnnotations(next.annotations);
      setHistoryIndex(historyIndex + 1);
      updateThumbnails(next.buffer, next.meta.pageCount);
      showToast('Action redone', 'info');
    }
  }, [history, historyIndex, showToast, updateThumbnails]);

  // Load new buffer
  const loadBuffer = useCallback(async (buffer, name, prompt = '') => {
    try {
      const meta = await inspectPdf(buffer);
      setDocBuffer(buffer);
      setDocName(name);
      setDocMeta(meta);
      setActivePageIndex(0);
      setAnnotations([]);
      setInitialPrompt(prompt);

      setHistory([{ buffer, meta, annotations: [] }]);
      setHistoryIndex(0);

      updateThumbnails(buffer, meta.pageCount);

      extractPdfTextLayers(buffer).then((context) => {
        setDocContext(context);
      });

      showToast(`Loaded ${name} (${meta.pageCount} pages)`);
      navigate('/editor');
    } catch (err) {
      console.error('Failed to load PDF', err);
      showToast('Failed to parse PDF document.', 'error');
    }
  }, [navigate, showToast, updateThumbnails]);

  // Reset Document
  const handleResetDocument = useCallback(() => {
    if (window.confirm('Return to home screen? Unexported changes will be cleared.')) {
      setDocBuffer(null);
      setDocName('');
      setDocMeta({ pageCount: 0, pages: [], sizeBytes: 0 });
      setDocContext(null);
      setThumbnails([]);
      setHistory([]);
      setHistoryIndex(-1);
      navigate('/');
    }
  }, [navigate]);

  // Page Operations
  const handleRotatePage = useCallback(async (pageIdx, degrees = 90) => {
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
  }, [docBuffer, pushState, showToast]);

  const handleDeletePage = useCallback(async (pageIdx) => {
    if (docMeta.pageCount <= 1) {
      showToast('Document must contain at least 1 page.', 'error');
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
  }, [annotations, docBuffer, docMeta.pageCount, pushState, showToast]);

  const handleDuplicatePage = useCallback(async (pageIdx) => {
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
  }, [docBuffer, docMeta.pageCount, pushState, showToast]);

  const handleMovePage = useCallback(async (fromIdx, toIdx) => {
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
  }, [docBuffer, docMeta.pageCount, pushState, showToast]);

  const handleAddPage = useCallback(async () => {
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
  }, [docBuffer, docMeta.pageCount, pushState, showToast]);

  const handleAddWatermark = useCallback(async (watermarkText) => {
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
  }, [docBuffer, pushState, showToast]);

  const handleAdoptSignature = useCallback((signatureDataUrl) => {
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
      },
    ]);
    showToast('Signature placed on active page');
  }, [activePageIndex, showToast]);

  const handleApplyCompression = useCallback(async (targetMb, quality) => {
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
  }, [docBuffer, pushState, showToast]);

  const handleApplySplit = useCallback(async (ranges) => {
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
  }, [docBuffer, showToast]);

  const handleApplyMerge = useCallback(async (pdfBuffers) => {
    try {
      const mergedBytes = await mergePdfs(pdfBuffers);
      await loadBuffer(mergedBytes, 'Custumu_Merged_Document.pdf');
      showToast('Successfully merged documents into workspace');
    } catch (e) {
      console.error(e);
      showToast('Failed to merge documents', 'error');
    }
  }, [loadBuffer, showToast]);

  const handleExportPdf = useCallback(() => {
    if (!docBuffer) return;
    const blob = new Blob([docBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Custumu_${docName || 'Document.pdf'}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded PDF with all changes');
  }, [docBuffer, docName, showToast]);

  const handleExportWord = useCallback(() => {
    const textContent = docContext?.fullText || 'Custumu Document Content';
    exportTextToWord(docName || 'Document', textContent, `Custumu_${(docName || 'document').replace(/\.pdf$/i, '')}.doc`);
    showToast('Downloaded Word document (.doc)');
  }, [docContext?.fullText, docName, showToast]);

  const handleExportExcel = useCallback((customTables) => {
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
  }, [docName, showToast]);

  const handleExportPng = useCallback(async ({ scope, scale = 2 }) => {
    if (!docBuffer) return;
    try {
      showToast('Rendering high-resolution PNG...', 'info');
      const baseName = (docName || 'document').replace(/\.[^/.]+$/, '');

      if (scope === 'all') {
        const pages = await convertAllPagesToPng(docBuffer, scale, annotations);
        pages.forEach(({ pageNumber, dataUrl }) => {
          downloadImage(dataUrl, `${baseName}-page-${pageNumber}.png`);
        });
        showToast(`Exported ${pages.length} pages to PNG!`, 'success');
      } else {
        const dataUrl = await convertPdfPageToPng(docBuffer, activePageIndex, scale, annotations);
        if (dataUrl) {
          downloadImage(dataUrl, `${baseName}-page-${activePageIndex + 1}.png`);
          showToast(`Page ${activePageIndex + 1} exported to PNG!`, 'success');
        } else {
          showToast('Could not render page to PNG.', 'error');
        }
      }
      setIsPngModalOpen(false);
    } catch (err) {
      console.error('Export PNG failed:', err);
      showToast('Failed to export PNG image.', 'error');
    }
  }, [activePageIndex, annotations, docBuffer, docName, showToast]);

  const handleExecuteAiAction = useCallback(async (action) => {
    if (!action) return;

    if (action.type === 'SPLIT_PDF') {
      const totalP = docMeta?.pageCount || 1;
      let ranges = [];

      if (action.mode === 'all_pages' || (!action.pageNumbers?.length && !action.ranges?.length)) {
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
  }, [annotations, docBuffer, docMeta?.pageCount, docName, handleAddWatermark, handleApplyCompression, handleApplySplit, handleExportExcel, handleExportPdf, handleExportPng, handleExportWord, pushState, showToast]);

  const value = {
    // Document state
    docBuffer,
    setDocBuffer,
    docName,
    setDocName,
    docMeta,
    setDocMeta,
    docContext,
    thumbnails,
    activePageIndex,
    setActivePageIndex,
    isPrivateMode,
    setIsPrivateMode,
    initialPrompt,
    annotations,
    setAnnotations,
    history,
    historyIndex,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,

    // Modals
    isSignatureModalOpen,
    setIsSignatureModalOpen,
    isCompressModalOpen,
    setIsCompressModalOpen,
    isSplitModalOpen,
    setIsSplitModalOpen,
    isMergeModalOpen,
    setIsMergeModalOpen,
    isOcrModalOpen,
    setIsOcrModalOpen,
    isPngModalOpen,
    setIsPngModalOpen,

    // Toast
    toast,
    showToast,

    // Operations
    loadBuffer,
    handleResetDocument,
    handleUndo,
    handleRedo,
    handleRotatePage,
    handleDeletePage,
    handleDuplicatePage,
    handleMovePage,
    handleAddPage,
    handleAddWatermark,
    handleAdoptSignature,
    handleApplyCompression,
    handleApplySplit,
    handleApplyMerge,
    handleExportPdf,
    handleExportWord,
    handleExportExcel,
    handleExportPng,
    handleExecuteAiAction,
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
}
