import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import HeroDropzone from '../components/HeroDropzone';
import { useDocument } from '../context/DocumentContext';
import { CATEGORIES } from '../lib/pdfTools';

export default function ToolLandingPage({ tool }) {
  const navigate = useNavigate();
  const docCtx = useDocument();
  const { docBuffer, docName, loadBuffer } = docCtx;

  // Find related tools in the same category for internal linking & crawler discovery
  const currentCategory = CATEGORIES.find((c) => c.name === tool?.category);
  const relatedTools = (currentCategory?.tools || [])
    .filter((t) => t.path !== tool?.path)
    .slice(0, 4);

  useEffect(() => {
    if (!tool) return;

    // 1. Update Title
    const pageTitle = `${tool.title || tool.name} - Free Online PDF Tool | Custumu`;
    document.title = pageTitle;

    // 2. Helper to set or create meta tag
    const setMetaTag = (attrName, attrVal, content) => {
      let meta = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrName, attrVal);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // 3. Update Meta Description & Keywords
    setMetaTag('name', 'description', `${tool.desc} 100% free, private in-browser WebAssembly PDF processing with zero cloud uploads.`);
    setMetaTag('name', 'keywords', `${tool.name}, ${tool.title}, PDF ${tool.name}, online PDF tools, free PDF editor, private PDF tools, Custumu`);
    setMetaTag('property', 'og:title', pageTitle);
    setMetaTag('property', 'og:description', tool.desc);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:url', `https://custumu.com${tool.path}`);

    // 4. Update Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `https://custumu.com${tool.path}`);

    // 5. Inject Schema.org JSON-LD Structured Data for AI & Search Engines (GEO)
    const schemaData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          '@id': `https://custumu.com${tool.path}#webapp`,
          name: tool.title || tool.name,
          url: `https://custumu.com${tool.path}`,
          description: tool.desc,
          applicationCategory: 'UtilityApplication',
          operatingSystem: 'All',
          browserRequirements: 'Requires HTML5 and WebAssembly support',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          featureList: [
            '100% in-browser WebAssembly execution',
            'Zero server file uploads for strict privacy',
            'Instant high-speed conversion and editing',
          ],
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: `How do I use ${tool.title || tool.name} on Custumu?`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: `Simply drop or select your PDF file into the dropzone. Custumu processes the operation instantly inside your browser using private WebAssembly without sending files to any third-party server.`,
              },
            },
            {
              '@type': 'Question',
              name: `Is Custumu ${tool.title || tool.name} safe and confidential?`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: `Yes, Custumu operates 100% locally in your browser memory. Your documents never leave your computer, ensuring compliance with strict privacy standards (GDPR, HIPAA, SOC 2).`,
              },
            },
            {
              '@type': 'Question',
              name: `Do I need to install any software or pay for ${tool.title || tool.name}?`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: `No installation, registration, or credit card is required. All everyday tools are completely free to use online.`,
              },
            },
          ],
        },
      ],
    };

    let scriptTag = document.getElementById('geo-jsonld-schema');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'geo-jsonld-schema';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(schemaData);

    return () => {
      document.title = 'Custumu — The AI Workspace for Documents & PDFs';
      if (scriptTag) scriptTag.textContent = '';
    };
  }, [tool]);

  if (!tool) {
    return null;
  }

  const handleFileLoaded = async (buf, name, prompt) => {
    await loadBuffer(buf, name, prompt || tool.prompt || tool.desc);

    // Auto-trigger tool modal if applicable
    if (tool.action === 'merge') {
      docCtx.setIsMergeModalOpen(true);
    } else if (tool.action === 'split' || tool.action === 'extract_pages') {
      docCtx.setIsSplitModalOpen(true);
    } else if (tool.action === 'compress') {
      docCtx.setIsCompressModalOpen(true);
    } else if (tool.action === 'sign') {
      docCtx.setIsSignatureModalOpen(true);
    } else if (tool.action === 'pdf_to_png' || tool.action === 'pdf_to_jpg') {
      docCtx.setIsPngModalOpen(true);
    } else if (tool.action === 'edit_text') {
      docCtx.setIsOcrModalOpen(true);
    }
  };

  const handleApplyToActiveDoc = () => {
    navigate('/editor');

    if (tool.action === 'merge') {
      docCtx.setIsMergeModalOpen(true);
    } else if (tool.action === 'split' || tool.action === 'extract_pages') {
      docCtx.setIsSplitModalOpen(true);
    } else if (tool.action === 'compress') {
      docCtx.setIsCompressModalOpen(true);
    } else if (tool.action === 'sign') {
      docCtx.setIsSignatureModalOpen(true);
    } else if (tool.action === 'pdf_to_png' || tool.action === 'pdf_to_jpg') {
      docCtx.setIsPngModalOpen(true);
    } else if (tool.action === 'edit_text') {
      docCtx.setIsOcrModalOpen(true);
    } else if (tool.action === 'pdf_to_word') {
      docCtx.handleExportWord && docCtx.handleExportWord();
    } else if (tool.action === 'pdf_to_excel') {
      docCtx.handleExportExcel && docCtx.handleExportExcel();
    } else if (tool.action === 'rotate_pages') {
      docCtx.handleRotatePage(docCtx.activePageIndex, 90);
    } else if (tool.action === 'duplicate_pages') {
      docCtx.handleDuplicatePage(docCtx.activePageIndex);
    } else if (tool.action === 'delete_pages') {
      docCtx.handleDeletePage(docCtx.activePageIndex);
    } else if (tool.action === 'watermark') {
      const text = window.prompt('Enter watermark text:', 'CONFIDENTIAL');
      if (text) docCtx.handleAddWatermark(text);
    }
  };

  return (
    <main className="flex-1 flex flex-col justify-center py-6">
      {/* Top Breadcrumb & Return Link */}
      <div className="max-w-4xl mx-auto w-full px-4 mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Everyday PDF Tools</span>
        </Link>
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {tool.category} / {tool.name}
        </span>
      </div>

      {/* Active Document Banner if a document is currently loaded in memory */}
      {docBuffer && (
        <div className="max-w-xl mx-auto w-full px-4 pb-4 animate-fade-in">
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200 shadow-sm">
            <div className="flex items-center space-x-2.5 truncate">
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="truncate font-medium">
                Active document: <strong className="font-semibold">{docName}</strong>
              </span>
            </div>
            <button
              onClick={handleApplyToActiveDoc}
              className="px-3.5 py-1.5 bg-[#205ae3] hover:bg-[#184cc8] text-white font-medium rounded-lg transition shrink-0 ml-2 cursor-pointer text-xs flex items-center gap-1.5 shadow-xs"
            >
              <span>Apply to Document</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Dropzone Card configured with this tool's title & description */}
      <HeroDropzone
        title={tool.title || tool.name}
        description={tool.desc}
        badge={`${tool.category} • Private WASM`}
        actionPrompt={tool.prompt || tool.desc}
        icon={tool.icon}
        onFileLoaded={handleFileLoaded}
      />

      {/* SEO & GEO Informational Section: How It Works, Features & FAQ */}
      <section className="max-w-4xl mx-auto px-4 pt-8 pb-16 w-full text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-[#27272e] mt-6">
        {/* 3 Step Guide for Humans and AI Search Engines */}
        <div className="text-center mb-10">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            How to {tool.name} Online for Free
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Experience 100% private, instant PDF manipulation directly in your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="p-4 rounded-xl bg-white dark:bg-[#161619] border border-slate-200 dark:border-[#27272e] shadow-2xs text-center">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#205ae3] dark:text-blue-400 font-bold text-xs flex items-center justify-center mx-auto mb-3">
              1
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">
              Select or Drop File
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload your PDF from your computer, phone, or drag and drop into the area above.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#161619] border border-slate-200 dark:border-[#27272e] shadow-2xs text-center">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#205ae3] dark:text-blue-400 font-bold text-xs flex items-center justify-center mx-auto mb-3">
              2
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">
              Process Locally
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Our WebAssembly engine executes {tool.name} instantaneously with zero external server uploads.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#161619] border border-slate-200 dark:border-[#27272e] shadow-2xs text-center">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#205ae3] dark:text-blue-400 font-bold text-xs flex items-center justify-center mx-auto mb-3">
              3
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">
              Save or Continue Editing
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Download your modified document or continue annotating and signing inside Custumu Editor.
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#131316]/70 border border-slate-200/60 dark:border-[#24242c] flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-xs text-slate-900 dark:text-white mb-0.5">
                Zero Cloud Uploads
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Your data stays strictly on your machine. Client-side WASM ensures privacy.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#131316]/70 border border-slate-200/60 dark:border-[#24242c] flex items-start space-x-3">
            <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-xs text-slate-900 dark:text-white mb-0.5">
                Lightning Fast Speed
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                No server transfer latency or file upload queues. Processing finishes in milliseconds.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#131316]/70 border border-slate-200/60 dark:border-[#24242c] flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-xs text-slate-900 dark:text-white mb-0.5">
                Free & No Limits
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Use all everyday tools as many times as you need without watermarks or paywalls.
              </p>
            </div>
          </div>
        </div>

        {/* FAQs Section */}
        <div className="mb-12">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-brand" />
            <span>Frequently Asked Questions</span>
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#161619] border border-slate-200 dark:border-[#27272e]">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Is {tool.title || tool.name} free to use?
              </h4>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Yes! All Custumu Everyday PDF Tools are completely free to use online with no signup or hidden fees.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-[#161619] border border-slate-200 dark:border-[#27272e]">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Are my documents stored on your servers?
              </h4>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Never. Custumu runs in your browser engine using local WebAssembly. Your documents remain confidential on your device.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-[#161619] border border-slate-200 dark:border-[#27272e]">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Can I continue editing this PDF after applying {tool.name}?
              </h4>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Absolutely. Custumu is an all-in-one studio: you can annotate, sign, highlight, or chat with AI in the same workspace.
              </p>
            </div>
          </div>
        </div>

        {/* Related Category Tools for Internal Crawl & SEO Links */}
        {relatedTools.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Explore More {tool.category} Tools
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {relatedTools.map((rel) => {
                const RelIcon = rel.icon;
                return (
                  <Link
                    key={rel.path}
                    to={rel.path}
                    className="p-2.5 rounded-xl bg-white dark:bg-[#161619] hover:bg-slate-50 dark:hover:bg-[#202026] border border-slate-200 dark:border-[#27272e] flex items-center space-x-2 transition group text-xs text-slate-700 dark:text-slate-300 hover:text-brand dark:hover:text-blue-400"
                  >
                    <RelIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand dark:group-hover:text-blue-400 shrink-0" />
                    <span className="font-medium truncate">{rel.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
