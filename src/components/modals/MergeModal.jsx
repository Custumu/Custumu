import React, { useRef, useState } from 'react';
import { X, Plus, FileText, Trash2, ArrowUp, ArrowDown, Merge } from 'lucide-react';

export default function MergeModal({
  isOpen,
  onClose,
  currentDocBytes,
  currentDocName,
  onApplyMerge,
}) {
  const fileInputRef = useRef(null);
  const [fileList, setFileList] = useState([
    { name: currentDocName || 'Current_Document.pdf', bytes: currentDocBytes, size: '240 KB' },
  ]);

  if (!isOpen) return null;

  const handleAddFiles = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      setFileList((prev) => [
        ...prev,
        {
          name: file.name,
          bytes,
          size: `${(file.size / 1024).toFixed(0)} KB`,
        },
      ]);
    }
  };

  const handleRemove = (index) => {
    setFileList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMove = (fromIndex, toIndex) => {
    setFileList((prev) => {
      const copy = [...prev];
      const item = copy.splice(fromIndex, 1)[0];
      copy.splice(toIndex, 0, item);
      return copy;
    });
  };

  const handleMerge = () => {
    if (fileList.length < 2) {
      alert('Please add at least 2 files to merge.');
      return;
    }
    onApplyMerge(fileList.map((f) => f.bytes));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Merge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Merge PDF Files</h3>
              <p className="text-xs text-slate-600">Combine multiple documents in client memory</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-600 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Queue */}
        <div className="space-y-2 mb-4 max-h-56 overflow-y-auto">
          {fileList.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs"
            >
              <div className="flex items-center space-x-2.5 truncate max-w-[240px]">
                <FileText className="w-4 h-4 text-brand-400 shrink-0" />
                <div className="truncate">
                  <div className="text-white font-medium truncate">{file.name}</div>
                  <div className="text-[10px] text-slate-600">{file.size}</div>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {idx > 0 && (
                  <button
                    onClick={() => handleMove(idx, idx - 1)}
                    className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                )}
                {idx < fileList.length - 1 && (
                  <button
                    onClick={() => handleMove(idx, idx + 1)}
                    className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                )}
                {fileList.length > 1 && (
                  <button
                    onClick={() => handleRemove(idx)}
                    className="p-1 text-slate-600 hover:text-rose-400 hover:bg-slate-100 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add more button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAddFiles}
          accept="application/pdf"
          multiple
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2.5 mb-5 rounded-xl border border-dashed border-slate-200 hover:border-brand-500/50 hover:bg-white/50 text-xs text-slate-700 flex items-center justify-center space-x-1.5 transition"
        >
          <Plus className="w-4 h-4 text-brand-400" />
          <span>Add More PDF Documents</span>
        </button>

        <button
          onClick={handleMerge}
          disabled={fileList.length < 2}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-brand-500 hover:from-indigo-600 hover:to-brand-600 disabled:opacity-40 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-2 transition"
        >
          <Merge className="w-4 h-4" />
          <span>Merge {fileList.length} Documents</span>
        </button>
      </div>
    </div>
  );
}
