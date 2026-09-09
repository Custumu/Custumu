import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  FileSpreadsheet, 
  Trash2, 
  Minimize2, 
  FileText, 
  ShieldCheck, 
  Settings,
  ExternalLink,
  ChevronRight,
  Stamp,
  RotateCw,
  Cpu
} from 'lucide-react';
import { streamEnterpriseAiResponse, getAiConfig } from '../services/enterpriseAi';

export default function RightPanelAI({
  documentMetadata,
  documentContext,
  onExecuteAiAction,
  onExportExcel,
  onExportWord,
  onJumpToPage,
  initialPrompt,
  onOpenSettings
}) {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [aiConfig, setAiConfig] = useState(getAiConfig());

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Welcome to **Custumu Enterprise AI Copilot**.\n\nI have indexed your document's text layers across **${documentMetadata?.pageCount || 3} pages**.\n\nAsk any question with verified page citations, or prompt natural language document edits:`,
      action: null,
    },
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedText, isStreaming]);

  useEffect(() => {
    setAiConfig(getAiConfig());
  }, []);

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSend = async (textToSend) => {
    const query = typeof textToSend === 'string' ? textToSend : input;
    if (!query.trim() || isStreaming) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (typeof textToSend !== 'string') setInput('');
    setIsStreaming(true);
    setStreamedText('');

    let accumulatedText = '';

    try {
      const result = await streamEnterpriseAiResponse({
        prompt: query,
        conversationHistory: messages,
        documentContext,
        onToken: (token) => {
          accumulatedText += token;
          setStreamedText(accumulatedText);
        },
      });

      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: accumulatedText || result.text,
        action: result.action,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setStreamedText('');
      setIsStreaming(false);

      // Auto-trigger actions or prepare callbacks
      if (result.action) {
        // We present the action button for user confirmation
      }
    } catch (err) {
      console.error('Streaming error', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: `An error occurred during inference: ${err.message}`,
        }
      ]);
      setStreamedText('');
      setIsStreaming(false);
    }
  };

  const handleActionClick = (action) => {
    if (!action) return;
    if (action.type === 'EXTRACT_TABLES') {
      onExportExcel(action.tables);
    } else if (action.type === 'EXPORT_WORD') {
      onExportWord();
    } else {
      onExecuteAiAction(action);
    }
  };

  // Render text with clickable [Page X] citations
  const renderMessageTextWithCitations = (text) => {
    if (!text) return null;
    const parts = text.split(/(\[Page\s+\d+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[Page\s+(\d+)\]/);
      if (match) {
        const pageNum = parseInt(match[1], 10);
        return (
          <button
            key={index}
            onClick={() => onJumpToPage(pageNum - 1)}
            className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 mx-0.5 rounded bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/40 text-[11px] font-mono font-semibold transition"
            title={`Navigate to Page ${pageNum}`}
          >
            <span>p.{pageNum}</span>
            <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-70" />
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const quickPrompts = [
    { label: 'Payment terms?', prompt: 'What are the payment terms and late interest rate?' },
    { label: 'Extract tables to Excel', prompt: 'Extract tables into Excel' },
    { label: 'Remove page 2', prompt: 'Remove page 2 from this document' },
    { label: 'Summarize SLA', prompt: 'Summarize the Service Level Agreement and uptime' },
    { label: 'Add watermark DRAFT', prompt: 'Add watermark DRAFT' },
    { label: 'Compress < 5MB', prompt: 'Compress this document under 5MB' },
  ];

  return (
    <aside className="w-80 lg:w-96 border-l border-slate-200 bg-white/90 backdrop-blur-sm flex flex-col h-[calc(100vh-4rem)] z-10 shrink-0">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-500 text-white shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-semibold text-xs text-white flex items-center gap-1.5">
              Enterprise AI Copilot
              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                RAG Active
              </span>
            </div>
            <div className="text-[10px] text-slate-600 flex items-center gap-1">
              <span>Model:</span>
              <span className="font-mono text-brand-400">{aiConfig.model || 'gpt-4o-mini'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
          title="Configure AI Models & API Key"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Prompt Chips */}
      <div className="px-3 py-2 border-b border-slate-200/60 bg-white/40 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSend(qp.prompt)}
            disabled={isStreaming}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-brand-500/50 hover:text-brand-300 text-slate-700 transition text-[11px] disabled:opacity-40"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-slate-500">
              {m.sender === 'ai' ? (
                <>
                  <Bot className="w-3 h-3 text-brand-400" />
                  <span>Custumu Copilot</span>
                </>
              ) : (
                <>
                  <span>You</span>
                  <User className="w-3 h-3 text-slate-600" />
                </>
              )}
            </div>

            <div
              className={`p-3 rounded-2xl max-w-[92%] leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-brand-600 text-white rounded-tr-sm'
                  : 'bg-white border border-slate-200 text-slate-200 rounded-tl-sm shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">
                {renderMessageTextWithCitations(m.text)}
              </div>

              {/* Action Button Card */}
              {m.action && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/80">
                  <div className="text-[10px] uppercase font-bold text-brand-400 tracking-wider mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Autonomous Action Ready
                  </div>

                  {m.action.type === 'DELETE_PAGE' && (
                    <button
                      onClick={() => handleActionClick(m.action)}
                      className="w-full py-1.5 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold flex items-center justify-center space-x-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Execute: Delete Page {m.action.pageNumber}</span>
                    </button>
                  )}

                  {m.action.type === 'EXTRACT_TABLES' && (
                    <button
                      onClick={() => handleActionClick(m.action)}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center justify-center space-x-1.5 transition"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Download Extracted Excel (.xlsx)</span>
                    </button>
                  )}

                  {m.action.type === 'COMPRESS' && (
                    <button
                      onClick={() => handleActionClick(m.action)}
                      className="w-full py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold flex items-center justify-center space-x-1.5 transition"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span>Apply Compression (&lt; {m.action.targetMb} MB)</span>
                    </button>
                  )}

                  {m.action.type === 'WATERMARK' && (
                    <button
                      onClick={() => handleActionClick(m.action)}
                      className="w-full py-1.5 px-3 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/40 font-semibold flex items-center justify-center space-x-1.5 transition"
                    >
                      <Stamp className="w-3.5 h-3.5" />
                      <span>Stamp Watermark "{m.action.text}"</span>
                    </button>
                  )}

                  {m.action.type === 'EXPORT_WORD' && (
                    <button
                      onClick={() => handleActionClick(m.action)}
                      className="w-full py-1.5 px-3 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 font-semibold flex items-center justify-center space-x-1.5 transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Download Word (.doc)</span>
                    </button>
                  )}

                  {m.action.type === 'ROTATE_PAGE' && (
                    <button
                      onClick={() => handleActionClick(m.action)}
                      className="w-full py-1.5 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-semibold flex items-center justify-center space-x-1.5 transition"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Rotate Page {m.action.pageNumber} by {m.action.degrees}°</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Live Token Streaming Bubble */}
        {isStreaming && (
          <div className="flex flex-col items-start animate-fade-in">
            <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-brand-400">
              <Bot className="w-3 h-3 animate-pulse" />
              <span>Streaming response...</span>
            </div>

            <div className="p-3 rounded-2xl max-w-[92%] leading-relaxed bg-white border border-brand-500/40 text-slate-200 rounded-tl-sm shadow-md shadow-brand-500/5">
              <div className="whitespace-pre-wrap">
                {renderMessageTextWithCitations(streamedText)}
                <span className="inline-block w-1.5 h-3.5 bg-brand-400 animate-pulse ml-0.5 align-middle" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            placeholder="Ask question or tell Custumu what to do..."
            className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-brand-500 text-xs text-white placeholder-slate-500 outline-none transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="absolute right-1.5 p-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 px-1">
          <span>Grounded in active PDF text</span>
          <button
            onClick={onOpenSettings}
            className="hover:text-brand-400 underline underline-offset-2 transition"
          >
            Change AI Model
          </button>
        </div>
      </div>
    </aside>
  );
}

