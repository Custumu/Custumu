import React from 'react';
import { Navigate } from 'react-router-dom';
import { useDocument } from '../context/DocumentContext';
import QuickToolsRibbon from '../components/QuickToolsRibbon';
import LeftPanelPages from '../components/LeftPanelPages';
import CenterCanvas from '../components/CenterCanvas';
import RightPanelAI from '../components/RightPanelAI';
import ModalsContainer from '../components/modals/ModalsContainer';

export default function EditorPage() {
  const {
    docBuffer,
    docMeta,
    docContext,
    thumbnails,
    activePageIndex,
    setActivePageIndex,
    annotations,
    setAnnotations,
    initialPrompt,
    handleRotatePage,
    handleDeletePage,
    handleDuplicatePage,
    handleMovePage,
    handleAddPage,
    handleAddWatermark,
    handleExecuteAiAction,
    handleExportExcel,
    handleExportWord,
    setIsSignatureModalOpen,
    setIsSplitModalOpen,
  } = useDocument();

  // If no document is active in memory, redirect back to landing
  if (!docBuffer) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Top Quick Tools Ribbon */}
      <QuickToolsRibbon />

      {/* 3-Panel Studio Layout */}
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

      {/* All dialog modals for tools */}
      <ModalsContainer />
    </div>
  );
}
