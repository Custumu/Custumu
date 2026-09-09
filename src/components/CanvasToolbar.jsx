import React, { useMemo } from 'react';
import {
  MousePointer,
  Type,
  PenTool,
  Highlighter,
  Square,
  Stamp,
  Lock,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2
} from 'lucide-react';

export default function CanvasToolbar({
  activeTool,
  setActiveTool,
  onOpenSignatureModal,
  onAddWatermark,
  zoom,
  setZoom,
  onFitWidth,
  onFitPage
}) {
  // Consistent brand color styling with soft translucent opacity
  const brandActiveClass = 'bg-[rgba(252,181,0,0.15)] hover:bg-[rgba(252,181,0,0.22)] text-amber-950 border-[rgba(252,181,0,0.35)] shadow-xs font-semibold';

  const actionGroups = useMemo(() => [
    {
      id: 'drawing-tools',
      items: [
        {
          id: 'select',
          label: 'Select',
          icon: MousePointer,
          title: 'Select & Cursor',
          isTool: true,
          activeClass: brandActiveClass,
        },
        {
          id: 'text',
          label: 'Text',
          icon: Type,
          title: 'Add Text Overlay',
          isTool: true,
          activeClass: brandActiveClass,
        },
        {
          id: 'draw',
          label: 'Pen',
          icon: PenTool,
          title: 'Freehand Pen',
          isTool: true,
          activeClass: brandActiveClass,
        },
        {
          id: 'highlight',
          label: 'Highlight',
          icon: Highlighter,
          title: 'Highlighter',
          isTool: true,
          activeClass: brandActiveClass,
        },
        {
          id: 'redact',
          label: 'Redact',
          icon: Square,
          title: 'Redact / Blackout Box',
          isTool: true,
          activeClass: brandActiveClass,
        },
      ],
    },
    {
      id: 'document-actions',
      items: [
        {
          id: 'sign',
          label: 'Sign',
          icon: Stamp,
          title: 'e-Signature Pad',
          onClick: onOpenSignatureModal,
          className: 'text-amber-950 bg-[rgba(252,181,0,0.15)] hover:bg-[rgba(252,181,0,0.22)] border-[rgba(252,181,0,0.35)] shadow-xs font-semibold',
        },
        {
          id: 'watermark',
          label: 'Watermark',
          icon: Lock,
          title: 'Watermark Document',
          onClick: () => onAddWatermark('CONFIDENTIAL'),
          className: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent',
          hideOnSmall: true,
        },
      ],
    },
  ], [onOpenSignatureModal, onAddWatermark]);

  return (
    <div className="h-11 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 flex items-center justify-between z-10 shrink-0 shadow-xs">
      {/* Left: Interactive Tools & Actions */}
      <div className="flex items-center space-x-1">
        {actionGroups.map((group, groupIdx) => (
          <React.Fragment key={group.id}>
            {groupIdx > 0 && <div className="h-4 w-px bg-slate-200 mx-1.5" />}
            <div className="flex items-center space-x-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTool === item.id;

                if (item.isTool) {
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTool(item.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 transition cursor-pointer border ${
                        isActive
                          ? item.activeClass
                          : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title={item.title}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </button>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 transition cursor-pointer border ${item.className}`}
                    title={item.title}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className={item.hideOnSmall ? 'hidden md:inline' : ''}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Right: Zoom & View Controls */}
      <div className="flex items-center space-x-2">
        {/* Zoom controls */}
        <div className="flex items-center space-x-1 bg-white px-1.5 py-0.5 text-slate-700">
          <button
            onClick={() => setZoom(Math.max(40, zoom - 15))}
            className="p-0.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(100)}
            className="text-[11px] w-10 text-center hover:text-[#fcb500] font-medium cursor-pointer"
            title="Click to reset to 100%"
          >
            {zoom}%
          </button>
          <button
            onClick={() => setZoom(Math.min(200, zoom + 15))}
            className="p-0.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Fit Width / Fit Page buttons */}
        {/* <div className="flex items-center space-x-0.5 bg-white p-0.5 rounded-lg border border-slate-200 text-slate-600">
          <button
            onClick={onFitWidth}
            className="px-1.5 py-0.5 rounded text-[11px] font-medium hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1 cursor-pointer"
            title="Fit to Width"
          >
            <Maximize2 className="w-3 h-3 text-slate-500" />
            <span className="hidden xl:inline">Fit Width</span>
          </button>
          <button
            onClick={onFitPage}
            className="px-1.5 py-0.5 rounded text-[11px] font-medium hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1 cursor-pointer"
            title="Fit to Page"
          >
            <Minimize2 className="w-3 h-3 text-slate-500" />
            <span className="hidden xl:inline">Fit Page</span>
          </button>
        </div> */}
      </div>
    </div>
  );
}
