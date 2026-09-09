import React from 'react';
import { Trash2, RotateCw, Copy, ArrowUp, ArrowDown, Plus, Layers, Split } from 'lucide-react';

export default function LeftPanelPages({
  pages,
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

      {/* Pages Thumbnails List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {pages.map((page, idx) => {
          const isActive = idx === activePageIndex;
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
              {/* Thumbnail Container */}
              <div className="w-full aspect-[8.5/11] bg-white rounded-lg shadow-sm overflow-hidden flex flex-col items-center justify-center relative border border-slate-300">
                {/* Simulated Document Preview Lines */}
                <div className="w-full h-full p-2.5 flex flex-col justify-between select-none">
                  <div className="space-y-1.5 w-full">
                    <div className="h-2 w-3/4 bg-slate-800 rounded"></div>
                    <div className="h-1.5 w-full bg-slate-300 rounded"></div>
                    <div className="h-1.5 w-5/6 bg-slate-300 rounded"></div>
                    <div className="h-1.5 w-4/6 bg-slate-200 rounded"></div>
                  </div>

                  {idx === 0 && (
                    <div className="w-full border border-slate-300 rounded p-1 bg-slate-50 space-y-1">
                      <div className="h-1 w-full bg-brand-300 rounded"></div>
                      <div className="h-1 w-4/5 bg-slate-200 rounded"></div>
                      <div className="h-1 w-2/3 bg-slate-200 rounded"></div>
                    </div>
                  )}

                  {idx === 2 && (
                    <div className="flex justify-between w-full pt-2 border-t border-slate-200">
                      <div className="h-3 w-10 border border-dashed border-emerald-400 rounded bg-emerald-50 text-[6px] text-emerald-600 flex items-center justify-center font-bold">
                        Signed
                      </div>
                      <div className="h-3 w-10 border border-dashed border-slate-300 rounded"></div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[7px] text-slate-400">
                    <span>Custumu</span>
                    <span>p. {idx + 1}</span>
                  </div>
                </div>

                {/* Page Number Badge */}
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[9px] font-bold text-white">
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
