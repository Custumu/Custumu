import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Bot, 
  User, 
  FileSpreadsheet, 
  Trash2, 
  Minimize2, 
  ExternalLink,
  Stamp,
  RotateCw,
  Loader2,
  Split,
  ArrowUpDown,
  CheckCircle2,
  Zap,
  Download,
  ArrowUp
} from 'lucide-react';
import { streamEnterpriseAiResponse, getAiConfig, fetchSuggestedPrompts } from '../services/enterpriseAi';

// Toggle for Option 1: Set to false to disable automatic suggestions on document load
const AUTO_SUGGEST_ON_LOAD = true;

export default function RightPanelAI({
  documentMetadata,
  documentContext,
  onExecuteAiAction,
  onExportExcel,
  onExportWord,
  onJumpToPage,
  initialPrompt
}) {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [aiConfig, setAiConfig] = useState(getAiConfig());
  const [executedActionIds, setExecutedActionIds] = useState(new Set());
  const [executingActionId, setExecutingActionId] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  }, [input]);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Welcome to **Custumu Enterprise AI Copilot**.\n\nI have indexed your document's text layers across **${documentMetadata?.pageCount || 1} ${documentMetadata?.pageCount === 1 ? 'page' : 'pages'}**.\n\nYou can ask questions about the content, or simply tell me how to edit your PDF (e.g. *"split this document"*, *"delete page 2"*, *"rotate page 1"*).`,
      action: null,
    },
  ]);

  const [prompts, setPrompts] = useState([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);

  const hasDocText = Boolean(documentContext?.fullText && documentContext.fullText.trim().length >= 20);

  // Smart prompt suggestions generator
  const handleGeneratePrompts = useCallback(async () => {
    if (!hasDocText || isLoadingPrompts) return;
    setIsLoadingPrompts(true);
    try {
      const results = await fetchSuggestedPrompts(
        documentContext.fullText,
        documentMetadata?.pageCount || 1
      );
      setPrompts(results);
    } catch (e) {
      console.error('Failed to generate prompts:', e);
    } finally {
      setIsLoadingPrompts(false);
    }
  }, [documentContext?.fullText, documentMetadata?.pageCount, isLoadingPrompts, hasDocText]);

  useEffect(() => {
    if (AUTO_SUGGEST_ON_LOAD && hasDocText) {
      handleGeneratePrompts();
    }
  }, [hasDocText]);

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
    setInput('');
    setIsStreaming(true);
    setStreamedText('');

    let accumulatedText = '';

    try {
      const result = await streamEnterpriseAiResponse({
        prompt: query,
        conversationHistory: messages,
        documentContext,
        documentMetadata,
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

  const handleActionClick = async (action, messageId) => {
    if (!action || executingActionId) return;
    setExecutingActionId(messageId);
    try {
      if (action.type === 'EXTRACT_TABLES') {
        onExportExcel(action.tables);
      } else if (action.type === 'EXPORT_WORD') {
        onExportWord();
      } else {
        await onExecuteAiAction(action);
      }
      setExecutedActionIds((prev) => new Set(prev).add(messageId));
    } catch (err) {
      console.error('Failed to execute action:', err);
    } finally {
      setExecutingActionId(null);
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
            className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 mx-0.5 rounded bg-brand-500/20 hover:bg-brand-500/30 text-brand-600 border border-brand-500/30 text-[11px] font-mono font-semibold transition cursor-pointer"
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

  // Render Visually Rich 1-Click Action Card
  const renderActionCard = (action, messageId) => {
    if (!action) return null;

    const isExecuted = executedActionIds.has(messageId);
    const isExecuting = executingActionId === messageId;

    let icon = <Zap className="w-3.5 h-3.5 text-amber-500" />;
    let title = 'Document Action';
    let buttonLabel = 'Apply';
    let badge = null;

    if (action.type === 'SPLIT_PDF') {
      icon = <Split className="w-3.5 h-3.5 text-brand-500" />;
      title = 'Split Document';
      buttonLabel = action.mode === 'all_pages' 
        ? 'Split All Pages' 
        : action.pageNumbers?.length 
        ? `Extract Page ${action.pageNumbers.join(', ')}`
        : 'Split PDF';
      badge = (
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 font-medium">
          {action.mode === 'all_pages' ? 'All Individual Pages' : 'Custom Extract'}
        </span>
      );
    } else if (action.type === 'DELETE_PAGES' || action.type === 'DELETE_PAGE') {
      icon = <Trash2 className="w-3.5 h-3.5 text-rose-500" />;
      title = 'Delete Page(s)';
      const pNums = action.pageNumbers?.length ? action.pageNumbers : [action.pageNumber || 1];
      buttonLabel = `Delete Page ${pNums.join(', ')}`;
      badge = (
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/80 font-medium">
          Target: Page {pNums.join(', ')}
        </span>
      );
    } else if (action.type === 'ROTATE_PAGES' || action.type === 'ROTATE_PAGE') {
      icon = <RotateCw className="w-3.5 h-3.5 text-cyan-600" />;
      title = 'Rotate Page(s)';
      const pNums = action.pageNumbers?.length ? action.pageNumbers.join(', ') : 'All Pages';
      buttonLabel = `Rotate by ${action.degrees || 90}°`;
      badge = (
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200/80 font-medium">
          {action.degrees || 90}° Clockwise ({pNums})
        </span>
      );
    } else if (action.type === 'REORDER_PAGES') {
      icon = <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />;
      title = 'Reorder Pages';
      buttonLabel = 'Apply New Order';
      badge = (
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-mono font-medium">
          Order: {action.newOrder?.join(' → ')}
        </span>
      );
    } else if (action.type === 'WATERMARK') {
      icon = <Stamp className="w-3.5 h-3.5 text-amber-600" />;
      title = 'Stamp Watermark';
      buttonLabel = `Stamp "${action.text || 'CONFIDENTIAL'}"`;
      badge = (
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 font-medium">
          "{action.text}"
        </span>
      );
    } else if (action.type === 'COMPRESS') {
      icon = <Minimize2 className="w-3.5 h-3.5 text-amber-500" />;
      title = 'Compress & Optimize';
      buttonLabel = `Compress (< ${action.targetMb || 5} MB)`;
      badge = (
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 font-medium">
          Target: &lt; {action.targetMb || 5} MB
        </span>
      );
    } else if (action.type === 'EXPORT') {
      icon = <Download className="w-3.5 h-3.5 text-blue-500" />;
      title = 'Export Document';
      buttonLabel = `Download ${action.format?.toUpperCase()}`;
      badge = (
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 font-medium">
          Format: {action.format?.toUpperCase()}
        </span>
      );
    } else if (action.type === 'EXTRACT_TABLES') {
      icon = <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />;
      title = 'Extract Data Tables';
      buttonLabel = 'Download Excel (.xlsx)';
    }

    return (
      <div className="mt-3 rounded-xl border border-slate-200/90 bg-slate-50/90 p-3 shadow-xs">
        {/* Card Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/70">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded-md bg-white border border-slate-200 shadow-2xs">
              {icon}
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-800 tracking-tight">{title}</div>
              <div className="text-[10px] text-slate-500">Autonomous Action Ready</div>
            </div>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[rgba(252,181,0,0.15)] text-amber-950 border border-[rgba(252,181,0,0.35)]">
            1-Click Action
          </span>
        </div>

        {/* Action Summary */}
        <p className="text-[11px] text-slate-600 mb-2.5 font-medium leading-relaxed">
          {action.summary || 'Click below to execute this change directly on your document.'}
        </p>

        {/* Details Badge */}
        {badge && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {badge}
          </div>
        )}

        {/* 1-Click Action Button */}
        {isExecuted ? (
          <div className="w-full py-2 px-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Executed Successfully</span>
          </div>
        ) : (
          <button
            onClick={() => handleActionClick(action, messageId)}
            disabled={isExecuting}
            className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Executing action...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Execute: {buttonLabel}</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <aside className="w-80 lg:w-96 border-l border-slate-200 bg-white/95 backdrop-blur-sm flex flex-col h-full z-10 shrink-0">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-500 text-white shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
              Enterprise AI Copilot
            </div>
          </div>
        </div>
      </div>

      {/* Quick Prompt Chips - Only show if PDF contains real text */}
      {hasDocText && (
        <div className="px-3 py-2 border-b border-slate-200/60 bg-white/40 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
          <button
            onClick={handleGeneratePrompts}
            disabled={isLoadingPrompts || isStreaming}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-brand-50 border border-brand-200 hover:border-brand-400 hover:bg-brand-100 text-brand-700 transition text-[11px] font-medium flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
            title="Analyze document with AI and generate smart prompt suggestions"
          >
            {isLoadingPrompts ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-brand-600" />
                <span>Analyzing document...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-brand-600" />
                <span>{prompts.length > 0 ? 'Refresh Prompts' : 'Suggest Prompts'}</span>
              </>
            )}
          </button>

          {prompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSend(qp.prompt)}
              disabled={isStreaming}
              title={qp.prompt}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-brand-500/50 hover:text-brand-600 text-slate-700 transition text-[11px] disabled:opacity-40 shrink-0 cursor-pointer"
            >
              {qp.label}
            </button>
          ))}
        </div>
      )}

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
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">
                {renderMessageTextWithCitations(m.text)}
              </div>

              {/* Visually Rich 1-Click Action Card */}
              {m.action && renderActionCard(m.action, m.id)}
            </div>
          </div>
        ))}

        {/* Live Token Streaming Bubble */}
        {isStreaming && (
          <div className="flex flex-col items-start animate-fade-in">
            <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-brand-400">
              <Bot className="w-3 h-3 animate-pulse" />
              <span>Custumu Copilot is thinking...</span>
            </div>

            <div className="p-3 rounded-2xl max-w-[92%] leading-relaxed bg-white border border-brand-500/40 text-slate-800 rounded-tl-sm shadow-md shadow-brand-500/5">
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
      <div className="p-3 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim() && !isStreaming) {
              handleSend(input);
            }
          }}
          className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xs focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/20 transition flex flex-col"
        >
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim() && !isStreaming) {
                  handleSend(input);
                }
              }
            }}
            disabled={isStreaming}
            placeholder="Ask question or tell Custumu what to do..."
            className="w-full bg-transparent border-0 outline-none text-xs text-slate-800 placeholder-slate-400 resize-none p-1 focus:ring-0 leading-relaxed max-h-32 min-h-[44px]"
          />

          <div className="flex items-center justify-between pt-2 mt-1">
            <div className="flex items-center gap-2">
 
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="w-7 h-7 rounded-full bg-brand-600 hover:bg-brand-700 disabled:opacity-30 disabled:hover:bg-brand-600 text-white flex items-center justify-center transition shadow-xs shrink-0 cursor-pointer"
              title="Send message"
            >
              <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
}
