import React, { useState } from 'react';
import { X, ScanText, Copy, Check, Download, FileText } from 'lucide-react';

export default function OCRModal({ isOpen, onClose, activePageIndex }) {
  const [isScanning, setIsScanning] = useState(false);
  const [copied, setCopied] = useState(false);

  const sampleOcrText = `[CUSTUMU OCR ENGINE - PAGE ${activePageIndex + 1} DETECTED TEXT]
DOCUMENT ID: CST-2026-8942
LANGUAGE: en-US (Confidence: 99.4%)
RESOLUTION: 300 DPI Searchable Text Layer

SECTION 1. PARTIES & ENGAGEMENT SCOPE
This Master Services Agreement ("Agreement") is entered into as of September 9, 2026, by and
between Custumu Document Technologies ("Provider"), and Acme Enterprises Inc. ("Client").
Provider delivers automated AI workspace infrastructure, OCR document parsing, and secure
client-side WebAssembly document transformation pipelines.

SECTION 2. FINANCIAL SCHEDULE & INVOICING
Service Tier               Units          Rate (USD)      Subtotal
------------------------------------------------------------------
AI Document Workspace      50 Seats       $49.00 / seat   $2,450.00
High-Speed OCR Pipeline    10,000 Pages   $0.05 / page    $500.00
Private Mode WASM Engine   Unlimited      Included        $0.00
TOTAL MONTHLY RETAINER                                    $2,950.00

SECTION 3. PAYMENT & TERMINATION TERMS
Payment Terms: Net 30 days from invoice dispatch date.
Late Interest: Outstanding balances incur 1.5% per month or legal statutory maximum.
Termination Notice: Either party may terminate with 30 days written notice.
Data Retention: In Private Mode, zero document data leaves client device memory.`;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleOcrText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([sampleOcrText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OCR_Extracted_Page_${activePageIndex + 1}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ScanText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">OCR & Text Recognition</h3>
              <p className="text-xs text-slate-600">
                Extract selectable, searchable text from document scans
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-600 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* OCR Result Box */}
        <div className="border border-slate-200 rounded-xl bg-white p-3 mb-4 max-h-72 overflow-y-auto font-mono text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed">
          {sampleOcrText}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>Searchable text layer aligned</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-200 transition"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Text File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
