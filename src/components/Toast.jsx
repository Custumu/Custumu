import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useDocument } from '../context/DocumentContext';

export default function Toast() {
  const { toast } = useDocument();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
  };

  return (
    <div className="fixed top-20 right-6 z-50 animate-slide-up pointer-events-none">
      <div className="flex items-center space-x-2.5 px-4 py-2.5 rounded-xl bg-white/95 backdrop-blur border border-slate-200 text-slate-800 text-xs shadow-2xl">
        {getIcon()}
        <span className="font-medium">{toast.message}</span>
      </div>
    </div>
  );
}
