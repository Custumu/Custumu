import React from 'react';
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
  return (
    <aside className="w-64 border-r border-dark-border bg-dark-surface/80 backdrop-blur-sm flex flex-col h-[calc(100vh-4rem)] z-10 shrink-0">
      {/* Header */}
      <div className="p-3.5 border-b border-dark-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-brand-400" />
          <span className="font-semibold text-xs text-white uppercase tracking-wider">Pages</span>
          <span className="px-1.5 py-0.5 rounded bg-dark-card text-[10px] font-medium text-slate-400 border border-dark-border">
            {pages.length}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={onOpenSplitModal}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-dark-hover transition text-xs flex items-center gap-1"
            title="Split Document"
          >
            <Split className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onAddPage}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-dark-hover transition text-xs flex items-center gap-1"
            title="Add Page"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real Page Thumbnails List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {pages.map((page, idx) => {
          const isActive = idx === activePageIndex;
          const thumbUrl = thumbnails[idx];

          return (
            <div
              key={idx}
              onClick={() => setActivePageIndex(idx)}
              className={`group relative rounded-xl p-2.5 transition-all cursor-pointer border ${
                isActive
                  ? 'bg-brand-500/10 border-brand-500/50 shadow-md shadow-brand-500/10'
                  : 'bg-dark-card/50 border-dark-border hover:border-slate-600 hover:bg-dark-card'
              }`}
            >
              {/* Real Thumbnail Preview */}
              <div className="w-full aspect-[8.5/11] bg-white rounded-lg shadow-sm overflow-hidden flex items-center justify-center relative border border-slate-300">
                {thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt={`Page ${idx + 1}`}
                    className="w-full h-full object-contain pointer-events-none select-none"
                  />
                ) : (
                  <div className="text-slate-400 text-[10px] flex flex-col items-center">
                    <span>Page {idx + 1}</span>
                  </div>
                )}

                {/* Page Number Badge */}
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[9px] font-bold text-white shadow">
                  {idx + 1}
                </div>
              </div>

              {/* Action Bar for Page */}
              <div className="mt-2 flex items-center justify-between text-slate-400 text-xs pt-1 border-t border-dark-border/50">
                <span className="text-[11px] font-medium text-slate-300">
                  Page {idx + 1}
                </span>

                <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => { e.stopPropagation(); onRotatePage(idx); }}
                    className="p-1 hover:text-brand-400 hover:bg-dark-hover rounded"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); onDuplicatePage(idx); }}
                    className="p-1 hover:text-cyan-400 hover:bg-dark-hover rounded"
                    title="Duplicate Page"
                  >
                    <Copy className="w-3 h-3" />
                  </button>

                  {idx > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onMovePage(idx, idx - 1); }}
                      className="p-1 hover:text-white hover:bg-dark-hover rounded"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                  )}

                  {idx < pages.length - 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onMovePage(idx, idx + 1); }}
                      className="p-1 hover:text-white hover:bg-dark-hover rounded"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    onClick={(e) => { e.stopPropagation(); onDeletePage(idx); }}
                    className="p-1 hover:text-rose-400 hover:bg-dark-hover rounded"
                    title="Delete Page"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
