import React, { useState, useEffect, useMemo } from 'react';
import { Trash2 } from 'lucide-react';

export default function SignatureOverlay({
  annotations,
  setAnnotations,
  activePageIndex,
  canvasDimensions,
  activeTool = 'select',
  selectedSignatureId: externalSelectedId,
  setSelectedSignatureId: externalSetSelectedId,
}) {
  const [internalSelectedId, setInternalSelectedId] = useState(null);
  const [interactionState, setInteractionState] = useState(null);

  const selectedSignatureId =
    externalSelectedId !== undefined ? externalSelectedId : internalSelectedId;
  const setSelectedSignatureId = externalSetSelectedId || setInternalSelectedId;

  // Pure derived state: when eraser tool is active, nothing can be selected
  const effectiveSelectedId = activeTool === 'eraser' ? null : selectedSignatureId;

  // Memoized signatures, pen drawings, and highlights for the current active page
  const pageItems = useMemo(() => {
    return annotations
      .filter(
        (a) =>
          (a.type === 'signature' || a.type === 'draw' || a.type === 'highlight') &&
          a.pageIndex === activePageIndex
      )
      .map((a, idx) => ({
        ...a,
        id: a.id || `${a.type || 'item'}-${a.pageIndex}-${idx}`,
      }));
  }, [annotations, activePageIndex]);

  // Window pointer & mouse listeners for moving and resizing items smoothly
  useEffect(() => {
    if (!interactionState) return;

    const handleMove = (e) => {
      const { type, handle, id, startPointer, startAnno, aspectRatio } = interactionState;
      const baseWidth = canvasDimensions.baseWidth || 612;
      const baseHeight = canvasDimensions.baseHeight || 792;
      const displayWidth = canvasDimensions.width || 612;
      const displayHeight = canvasDimensions.height || 792;

      const scaleX = baseWidth / displayWidth;
      const scaleY = baseHeight / displayHeight;

      const deltaX = (e.clientX - startPointer.x) * scaleX;
      const deltaY = (e.clientY - startPointer.y) * scaleY;

      if (type === 'move') {
        let newX = Math.round(startAnno.x + deltaX);
        let newY = Math.round(startAnno.y + deltaY);

        newX = Math.max(0, Math.min(newX, baseWidth - startAnno.width));
        newY = Math.max(0, Math.min(newY, baseHeight - startAnno.height));

        setAnnotations((prev) =>
          prev.map((a, idx) => {
            const annoId = a.id || `${a.type || 'item'}-${a.pageIndex}-${idx}`;
            return annoId === id ? { ...a, id: annoId, x: newX, y: newY } : a;
          })
        );
      } else if (type === 'resize') {
        const isSmallItem = startAnno.type === 'draw' || startAnno.type === 'highlight';
        const MIN_WIDTH = isSmallItem ? 15 : 45;
        const MIN_HEIGHT = isSmallItem ? 12 : 18;

        let newWidth = startAnno.width;
        let newHeight = startAnno.height;
        let newX = startAnno.x;
        let newY = startAnno.y;

        if (handle === 'se') {
          const delta = (deltaX + deltaY * aspectRatio) / 2;
          newWidth = Math.max(MIN_WIDTH, startAnno.width + delta);
          newHeight = Math.max(MIN_HEIGHT, Math.round(newWidth / aspectRatio));
          if (newX + newWidth > baseWidth) {
            newWidth = baseWidth - newX;
            newHeight = Math.round(newWidth / aspectRatio);
          }
          if (newY + newHeight > baseHeight) {
            newHeight = baseHeight - newY;
            newWidth = Math.round(newHeight * aspectRatio);
          }
        } else if (handle === 'sw') {
          const delta = (-deltaX + deltaY * aspectRatio) / 2;
          newWidth = Math.max(MIN_WIDTH, startAnno.width + delta);
          newHeight = Math.max(MIN_HEIGHT, Math.round(newWidth / aspectRatio));
          newX = startAnno.x + (startAnno.width - newWidth);
          if (newX < 0) {
            newX = 0;
            newWidth = startAnno.x + startAnno.width;
            newHeight = Math.round(newWidth / aspectRatio);
          }
          if (newY + newHeight > baseHeight) {
            newHeight = baseHeight - newY;
            newWidth = Math.round(newHeight * aspectRatio);
            newX = startAnno.x + (startAnno.width - newWidth);
          }
        } else if (handle === 'ne') {
          const delta = (deltaX - deltaY * aspectRatio) / 2;
          newWidth = Math.max(MIN_WIDTH, startAnno.width + delta);
          newHeight = Math.max(MIN_HEIGHT, Math.round(newWidth / aspectRatio));
          newY = startAnno.y + (startAnno.height - newHeight);
          if (newX + newWidth > baseWidth) {
            newWidth = baseWidth - newX;
            newHeight = Math.round(newWidth / aspectRatio);
            newY = startAnno.y + (startAnno.height - newHeight);
          }
          if (newY < 0) {
            newY = 0;
            newHeight = startAnno.y + startAnno.height;
            newWidth = Math.round(newHeight * aspectRatio);
          }
        } else if (handle === 'nw') {
          const delta = (-deltaX - deltaY * aspectRatio) / 2;
          newWidth = Math.max(MIN_WIDTH, startAnno.width + delta);
          newHeight = Math.max(MIN_HEIGHT, Math.round(newWidth / aspectRatio));
          newX = startAnno.x + (startAnno.width - newWidth);
          newY = startAnno.y + (startAnno.height - newHeight);
          if (newX < 0) {
            newX = 0;
            newWidth = startAnno.x + startAnno.width;
            newHeight = Math.round(newWidth / aspectRatio);
            newY = startAnno.y + (startAnno.height - newHeight);
          }
          if (newY < 0) {
            newY = 0;
            newHeight = startAnno.y + startAnno.height;
            newWidth = Math.round(newHeight * aspectRatio);
            newX = startAnno.x + (startAnno.width - newWidth);
          }
        }

        setAnnotations((prev) =>
          prev.map((a, idx) => {
            const annoId = a.id || `${a.type || 'item'}-${a.pageIndex}-${idx}`;
            return annoId === id
              ? {
                  ...a,
                  id: annoId,
                  x: Math.round(newX),
                  y: Math.round(newY),
                  width: Math.round(newWidth),
                  height: Math.round(newHeight),
                }
              : a;
          })
        );
      }
    };

    const handleUp = () => {
      setInteractionState(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [interactionState, canvasDimensions, setAnnotations]);

  // Keyboard shortcut: Delete or Backspace removes selected item, Escape deselects
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedSignatureId) {
        setSelectedSignatureId(null);
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedSignatureId) {
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        ) {
          return;
        }
        setAnnotations((prev) =>
          prev.filter((a, idx) => (a.id || `${a.type || 'item'}-${a.pageIndex}-${idx}`) !== selectedSignatureId)
        );
        setSelectedSignatureId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSignatureId, setAnnotations]);

  // Click anywhere outside the overlay to deselect
  useEffect(() => {
    if (!selectedSignatureId) return;

    const handleGlobalPointerDown = (e) => {
      if (e.target.closest && e.target.closest('[data-signature-overlay]')) {
        return;
      }
      setSelectedSignatureId(null);
    };

    window.addEventListener('pointerdown', handleGlobalPointerDown);
    return () => {
      window.removeEventListener('pointerdown', handleGlobalPointerDown);
    };
  }, [selectedSignatureId]);

  const handleStartMove = (e, anno) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    setSelectedSignatureId(anno.id);
    setInteractionState({
      type: 'move',
      id: anno.id,
      startPointer: { x: e.clientX, y: e.clientY },
      startAnno: { x: anno.x, y: anno.y, width: anno.width, height: anno.height, type: anno.type },
      aspectRatio: anno.width / (anno.height || 1),
    });
  };

  const handleStartResize = (e, anno, handle) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    setSelectedSignatureId(anno.id);
    setInteractionState({
      type: 'resize',
      handle,
      id: anno.id,
      startPointer: { x: e.clientX, y: e.clientY },
      startAnno: { x: anno.x, y: anno.y, width: anno.width, height: anno.height, type: anno.type },
      aspectRatio: anno.width / (anno.height || 1),
    });
  };

  if (pageItems.length === 0) return null;

  return (
    <>
      {pageItems.map((anno) => {
        const isSelected = effectiveSelectedId === anno.id;
        const baseWidth = canvasDimensions.baseWidth || 612;
        const baseHeight = canvasDimensions.baseHeight || 792;
        const displayWidth = canvasDimensions.width || 612;
        const displayHeight = canvasDimensions.height || 792;

        const leftPx = (anno.x / baseWidth) * displayWidth;
        const topPx = (anno.y / baseHeight) * displayHeight;
        const widthPx = (anno.width / baseWidth) * displayWidth;
        const heightPx = (anno.height / baseHeight) * displayHeight;

        // When in eraser mode, all overlay items pass pointer events through to canvas eraser
        // When in draw or highlight mode, unselected drawings/highlights should not block new strokes
        const isDrawingOrHighlighting = activeTool === 'draw' || activeTool === 'highlight';
        const isInteractive =
          activeTool !== 'eraser' &&
          (isSelected || activeTool === 'select' || (!isDrawingOrHighlighting && anno.type === 'signature'));

        return (
          <div
            key={anno.id}
            data-signature-overlay="true"
            data-annotation-id={anno.id}
            onPointerDown={(e) => {
              if (isInteractive) handleStartMove(e, anno);
            }}
            onMouseDown={(e) => {
              if (isInteractive) handleStartMove(e, anno);
            }}
            className={`absolute select-none touch-none ${
              isInteractive ? 'cursor-move' : 'pointer-events-none'
            } ${
              isSelected
                ? 'ring-2 ring-brand-500 ring-dashed'
                : isInteractive
                ? 'hover:ring-1.5 hover:ring-brand-500/60 hover:ring-dashed hover:bg-brand-500/5'
                : ''
            }`}
            style={{
              left: `${leftPx}px`,
              top: `${topPx}px`,
              width: `${widthPx}px`,
              height: `${heightPx}px`,
              zIndex: isSelected ? 25 : 20,
              pointerEvents: isInteractive ? 'auto' : 'none',
            }}
          >
            <img
              src={anno.dataUrl}
              alt={
                anno.type === 'draw'
                  ? 'Pen Drawing'
                  : anno.type === 'highlight'
                  ? 'Highlight'
                  : 'Stamped Signature'
              }
              draggable={false}
              className="w-full h-full object-contain pointer-events-none select-none"
              style={
                anno.type === 'highlight'
                  ? { opacity: anno.opacity || 0.45, mixBlendMode: 'multiply' }
                  : undefined
              }
            />

            {/* Handles and delete button when selected */}
            {isSelected && (
              <>
                {/* Delete button at top right */}
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnnotations((prev) =>
                      prev.filter((a, idx) => (a.id || `${a.type || 'item'}-${a.pageIndex}-${idx}`) !== anno.id)
                    );
                    setSelectedSignatureId(null);
                  }}
                  title={
                    anno.type === 'draw'
                      ? 'Delete drawing (or press Delete)'
                      : anno.type === 'highlight'
                      ? 'Delete highlight (or press Delete)'
                      : 'Delete signature (or press Delete)'
                  }
                  className="absolute -top-3.5 -right-3.5 w-6 h-6 rounded-full bg-white dark:bg-slate-800 text-rose-500 hover:text-white hover:bg-rose-500 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors"
                  style={{ zIndex: 30, pointerEvents: 'auto' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* 4 Corner Resize Handles */}
                <div
                  onPointerDown={(e) => handleStartResize(e, anno, 'nw')}
                  onMouseDown={(e) => handleStartResize(e, anno, 'nw')}
                  title={
                    anno.type === 'draw'
                      ? 'Resize drawing'
                      : anno.type === 'highlight'
                      ? 'Resize highlight'
                      : 'Resize signature'
                  }
                  className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-brand-500 rounded-full shadow-xs cursor-nwse-resize hover:scale-125 transition-transform"
                  style={{ zIndex: 30, pointerEvents: 'auto' }}
                />
                <div
                  onPointerDown={(e) => handleStartResize(e, anno, 'ne')}
                  onMouseDown={(e) => handleStartResize(e, anno, 'ne')}
                  title={
                    anno.type === 'draw'
                      ? 'Resize drawing'
                      : anno.type === 'highlight'
                      ? 'Resize highlight'
                      : 'Resize signature'
                  }
                  className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-brand-500 rounded-full shadow-xs cursor-nesw-resize hover:scale-125 transition-transform"
                  style={{ zIndex: 30, pointerEvents: 'auto' }}
                />
                <div
                  onPointerDown={(e) => handleStartResize(e, anno, 'se')}
                  onMouseDown={(e) => handleStartResize(e, anno, 'se')}
                  title={
                    anno.type === 'draw'
                      ? 'Resize drawing'
                      : anno.type === 'highlight'
                      ? 'Resize highlight'
                      : 'Resize signature'
                  }
                  className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-brand-500 rounded-full shadow-xs cursor-nwse-resize hover:scale-125 transition-transform"
                  style={{ zIndex: 30, pointerEvents: 'auto' }}
                />
                <div
                  onPointerDown={(e) => handleStartResize(e, anno, 'sw')}
                  onMouseDown={(e) => handleStartResize(e, anno, 'sw')}
                  title={
                    anno.type === 'draw'
                      ? 'Resize drawing'
                      : anno.type === 'highlight'
                      ? 'Resize highlight'
                      : 'Resize signature'
                  }
                  className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-brand-500 rounded-full shadow-xs cursor-nesw-resize hover:scale-125 transition-transform"
                  style={{ zIndex: 30, pointerEvents: 'auto' }}
                />
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
