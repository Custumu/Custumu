import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react';
import HeroDropzone from '../components/HeroDropzone';
import { useDocument } from '../context/DocumentContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { docBuffer, docName, loadBuffer } = useDocument();

  return (
    <main className="flex-1 flex flex-col justify-center">
      {/* Active Document Banner if a document is currently loaded in memory */}
      {docBuffer && (
        <div className="max-w-xl mx-auto w-full px-4 pt-6 animate-fade-in">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900 shadow-sm">
            <div className="flex items-center space-x-2.5 truncate">
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="truncate font-medium">
                Active document in editor: <strong className="font-semibold">{docName}</strong>
              </span>
            </div>
            <button
              onClick={() => navigate('/editor')}
              className="px-3.5 py-1.5 bg-[#205ae3] hover:bg-[#184cc8] text-white font-medium rounded-lg transition shrink-0 ml-2 cursor-pointer text-xs flex items-center gap-1.5 shadow-xs"
            >
              <span>Return to Editor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Upload & Action Area */}
      <HeroDropzone onFileLoaded={(buf, name, prompt) => loadBuffer(buf, name, prompt)} />
    </main>
  );
}
