import React, { useState, useEffect } from 'react';
import { Trash2, RotateCw, Copy, ArrowUp, ArrowDown, Plus, Layers, Split } from 'lucide-react';

export default function LeftPanelPages({
  pages,
  thumbnails = [],
  activePageIndex,
  setActivePageIndex,
  onRotatePage,
  onDeletePage,
  onDuplicatePage,
  onMovePage,
  onAddPage,
  onOpenSplitModal
}) {
  const [contextMenu, setContextMenu] = useState(null); // { x: number, y: number, pageIndex: number }

  useEffect(() => {
    const handleClose = () => setContextMenu(null);
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, []);

  return (
    <aside className="w-64 border-r border-slate-200 bg-white/90 backdrop-blur-sm flex flex-col h-full z-10 shrink-0">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-brand-500" />
          <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider">Pages</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600 border border-slate-200">
            {pages.length}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={onOpenSplitModal}
            className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition text-xs flex items-center gap-1"
            title="Split Document"
          >
            <Split className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onAddPage}
            className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition text-xs flex items-center gap-1"
            title="Add Page"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real Page Thumbnails List - Single Clean Design */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 flex flex-col items-center">
        {pages.map((page, idx) => {
          const isActive = idx === activePageIndex;
          const thumbUrl = thumbnails[idx];

          return (
            <div
              key={idx}
              onClick={() => setActivePageIndex(idx)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActivePageIndex(idx);
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  pageIndex: idx,
                });
              }}
              className={`relative w-36 aspect-[8.5/11] bg-white rounded-md transition-all cursor-pointer overflow-hidden flex items-center justify-center border-2 shrink-0 ${
                isActive
                  ? 'border-brand-500 shadow-md shadow-brand-500/15 ring-2 ring-brand-500/20'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt={`Page ${idx + 1}`}
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
              ) : (
                <div className="text-slate-400 text-xs flex flex-col items-center">
                  <span>Page {idx + 1}</span>
                </div>
              )}

              {/* Page Number Badge: Top Left showing Page X / Total */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] font-semibold text-white shadow-xs select-none pointer-events-none">
                {idx + 1} / {pages.length}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Right-Click Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 w-44 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: `${Math.min(contextMenu.y, window.innerHeight - 210)}px`,
            left: `${Math.min(contextMenu.x, window.innerWidth - 190)}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
            Page {contextMenu.pageIndex + 1} of {pages.length}
          </div>

          <button
            onClick={() => {
              onRotatePage(contextMenu.pageIndex);
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 text-slate-700 hover:bg-slate-100 hover:text-brand-600 transition text-left cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 text-brand-500" />
            <span>Rotate 90°</span>
          </button>

          <button
            onClick={() => {
              onDuplicatePage(contextMenu.pageIndex);
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 text-slate-700 hover:bg-slate-100 hover:text-cyan-600 transition text-left cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-cyan-500" />
            <span>Duplicate Page</span>
          </button>

          {contextMenu.pageIndex > 0 && (
            <button
              onClick={() => {
                onMovePage(contextMenu.pageIndex, contextMenu.pageIndex - 1);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 flex items-center gap-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition text-left cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
              <span>Move Up</span>
            </button>
          )}

          {contextMenu.pageIndex < pages.length - 1 && (
            <button
              onClick={() => {
                onMovePage(contextMenu.pageIndex, contextMenu.pageIndex + 1);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 flex items-center gap-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition text-left cursor-pointer"
            >
              <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
              <span>Move Down</span>
            </button>
          )}

          <div className="my-1 border-t border-slate-100" />

          <button
            onClick={() => {
              onDeletePage(contextMenu.pageIndex);
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Page</span>
          </button>
        </div>
      )}
    </aside>
  );
}


