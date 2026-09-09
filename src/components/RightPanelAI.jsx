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
  Check, 
  ExternalLink,
  ChevronRight,
  Stamp
} from 'lucide-react';
import { processAiPrompt } from '../services/aiEngine';

export default function RightPanelAI({
  documentMetadata,
  onExecuteAiAction,
  onExportExcel,
  onExportWord,
  initialPrompt
}) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Hello! I'm your **Custumu Document Copilot**.\n\nI can read your document, answer questions with exact page citations, or edit it directly via natural language:`,
      actionSuggestion: null,
    },
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSend = async (textToSend) => {
    const query = typeof textToSend === 'string' ? textToSend : input;
    if (!query.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (typeof textToSend !== 'string') setInput('');
    setIsTyping(true);

    // Simulate AI thinking and intent resolution
    setTimeout(async () => {
      const response = await processAiPrompt(query, documentMetadata);
      setIsTyping(false);

      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: response.reply,
        citation: response.citation,
        action: response.action,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Auto-trigger actions or offer interactive buttons
      if (response.action) {
        if (response.action.type === 'EXTRACT_TABLES') {
          // Prepared table extraction
        }
      }
    }, 600);
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

  const quickPrompts = [
    { label: 'Remove page 2', prompt: 'Remove page 2 from this document' },
    { label: 'Extract tables to Excel', prompt: 'Extract tables into Excel' },
    { label: 'Payment terms?', prompt: 'What are the payment terms?' },
    { label: 'Compress < 5MB', prompt: 'Compress this document under 5MB' },
    { label: 'Summarize agreement', prompt: 'Summarize this agreement' },
    { label: 'Add watermark DRAFT', prompt: 'Add watermark DRAFT' },
  ];

  return (
    <aside className="w-80 lg:w-96 border-l border-dark-border bg-dark-surface/90 backdrop-blur-sm flex flex-col h-[calc(100vh-4rem)] z-10 shrink-0">
      {/* Header */}
      <div className="p-3.5 border-b border-dark-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-500 text-white shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-semibold text-xs text-white flex items-center gap-1.5">
              AI Document Assistant
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                LIVE
              </span>
            </div>
          </div>
        </div>
        <div className="text-[10px] text-slate-400">custumu.com</div>
      </div>

      {/* Quick Prompt Chips */}
      <div className="px-3 py-2 border-b border-dark-border/60 bg-dark-card/40 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSend(qp.prompt)}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-dark-surface border border-dark-border hover:border-brand-500/50 hover:text-brand-300 text-slate-300 transition text-[11px]"
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
                  <span>Custumu AI</span>
                </>
              ) : (
                <>
                  <span>You</span>
                  <User className="w-3 h-3 text-slate-400" />
                </>
              )}
            </div>

            <div
              className={`p-3 rounded-2xl max-w-[90%] leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-brand-600 text-white rounded-tr-sm'
                  : 'bg-dark-card border border-dark-border text-slate-200 rounded-tl-sm shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>

              {/* Citation Link */}
              {m.citation && (
                <div className="mt-2 pt-2 border-t border-dark-border/60 flex items-center space-x-1 text-[10px] text-brand-400">
                  <ExternalLink className="w-3 h-3" />
                  <span>Cites {m.citation.section} (Page {m.citation.page})</span>
                </div>
              )}

              {/* Action Button */}
              {m.action && (
                <div className="mt-3 pt-2 border-t border-dark-border">
                  {m.action.type === 'DELETE_PAGE' && (
                    <button
                      onClick={() => handleActionClick(m.action)}
                      className="w-full py-1.5 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold flex items-center justify-center space-x-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirm & Delete Page {m.action.pageNumber}</span>
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
                      <span>Apply Compression Target (&lt;{m.action.targetMb}MB)</span>
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
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center space-x-2 text-slate-500 text-xs pl-2">
            <Bot className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
            <span>Analyzing document clauses...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-dark-border bg-dark-surface">
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
            placeholder="Tell Custumu what you want to do..."
            className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-dark-card border border-dark-border focus:border-brand-500 text-xs text-white placeholder-slate-500 outline-none transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-1.5 p-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="text-[10px] text-slate-500 text-center mt-2">
          Private Mode active: Prompt queries processed in secure context
        </div>
      </div>
    </aside>
  );
}
