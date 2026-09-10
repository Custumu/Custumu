import React from 'react';
import { useDocument } from '../../context/DocumentContext';
import SignatureModal from './SignatureModal';
import CompressModal from './CompressModal';
import SplitModal from './SplitModal';
import MergeModal from './MergeModal';
import OCRModal from './OCRModal';
import PngModal from './PngModal';

export default function ModalsContainer() {
  const {
    docBuffer,
    docName,
    docMeta,
    activePageIndex,
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
    handleAdoptSignature,
    handleApplyCompression,
    handleApplySplit,
    handleApplyMerge,
    handleExportPng,
  } = useDocument();

  return (
    <>
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onAdoptSignature={handleAdoptSignature}
      />

      <CompressModal
        isOpen={isCompressModalOpen}
        onClose={() => setIsCompressModalOpen(false)}
        onApplyCompression={handleApplyCompression}
        originalSizeBytes={docMeta?.sizeBytes || 0}
      />

      <SplitModal
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
        totalPages={docMeta?.pageCount || 1}
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
        totalPages={docMeta?.pageCount || 1}
        docName={docName}
        onExport={handleExportPng}
      />
    </>
  );
}
