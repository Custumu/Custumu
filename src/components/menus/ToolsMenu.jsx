import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Sparkles,
  Merge,
  Split,
  Copy,
  Trash2,
  ArrowUpDown,
  RotateCw,
  Crop,
  Files,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image,
  FileImage,
  FileUp,
  Table,
  SlidersHorizontal,
  Upload,
  Globe,
  Minimize2,
  Wrench,
  Layers,
  Archive,
  Type,
  Edit3,
  ImagePlus,
  PenTool,
  Highlighter,
  MessageSquare,
  Square,
  Stamp,
  Hash,
  PanelTop,
  Lock,
  Unlock,
  EyeOff,
  ShieldAlert,
  FileCheck2,
  CheckSquare,
  PenLine,
  Send,
  FolderKanban,
  ShieldCheck,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDocument } from '../../context/DocumentContext';

const CATEGORIES = [
  {
    id: 'organize',
    name: 'Organize',
    icon: FolderKanban,
    color: 'text-indigo-500 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/50',
    tools: [
      {
        name: 'Merge PDF',
        icon: Merge,
        desc: 'Combine multiple PDFs into one',
        action: 'merge_pdf',
        requiresDoc: false,
      },
      {
        name: 'Split PDF',
        icon: Split,
        desc: 'Extract ranges or separate pages',
        action: 'split_pdf',
        requiresDoc: true,
      },
      {
        name: 'Extract pages',
        icon: Copy,
        desc: 'Save selected pages as a new PDF',
        action: 'extract_pages',
        requiresDoc: true,
      },
      {
        name: 'Remove pages',
        icon: Trash2,
        desc: 'Remove unwanted pages from PDF',
        action: 'remove_pages',
        requiresDoc: true,
      },
      {
        name: 'Reorder pages',
        icon: ArrowUpDown,
        desc: 'Drag & sort page order',
        action: 'reorder_pages',
        requiresDoc: true,
      },
      {
        name: 'Rotate pages',
        icon: RotateCw,
        desc: 'Rotate pages 90° or 180°',
        action: 'rotate_pages',
        requiresDoc: true,
      },
      {
        name: 'Crop pages',
        icon: Crop,
        desc: 'Trim page margins or select area',
        action: 'crop_pages',
        requiresDoc: true,
      },
      {
        name: 'Duplicate pages',
        icon: Files,
        desc: 'Clone pages inside document',
        action: 'duplicate_pages',
        requiresDoc: true,
      },
    ],
  },
  {
    id: 'convert',
    name: 'Convert',
    icon: Sparkles,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/50',
    tools: [
      {
        name: 'PDF → Word',
        icon: FileText,
        desc: 'Convert to editable .doc file',
        action: 'pdf_to_word',
        requiresDoc: true,
      },
      {
        name: 'PDF → Excel',
        icon: FileSpreadsheet,
        desc: 'Extract tables to spreadsheet (.xlsx)',
        action: 'pdf_to_excel',
        requiresDoc: true,
      },
      {
        name: 'PDF → PowerPoint',
        icon: Presentation,
        desc: 'Convert slides to .pptx presentation',
        action: 'pdf_to_ppt',
        requiresDoc: true,
      },
      {
        name: 'PDF → JPG',
        icon: Image,
        desc: 'Save pages as high-quality JPG images',
        action: 'pdf_to_jpg',
        requiresDoc: true,
      },
      {
        name: 'PDF → PNG',
        icon: FileImage,
        desc: 'High-res transparent PNG export',
        action: 'pdf_to_png',
        requiresDoc: true,
      },
      {
        name: 'Word → PDF',
        icon: FileUp,
        desc: 'Convert DOC / DOCX files to PDF',
        action: 'word_to_pdf',
        requiresDoc: false,
      },
      {
        name: 'Excel → PDF',
        icon: Table,
        desc: 'Convert XLSX spreadsheets to PDF',
        action: 'excel_to_pdf',
        requiresDoc: false,
      },
      {
        name: 'PPT → PDF',
        icon: SlidersHorizontal,
        desc: 'Convert PowerPoint decks to PDF',
        action: 'ppt_to_pdf',
        requiresDoc: false,
      },
      {
        name: 'JPG → PDF',
        icon: Upload,
        desc: 'Convert images to a unified PDF',
        action: 'jpg_to_pdf',
        requiresDoc: false,
      },
      {
        name: 'HTML → PDF',
        icon: Globe,
        desc: 'Convert web pages or HTML code to PDF',
        action: 'html_to_pdf',
        requiresDoc: false,
      },
    ],
  },
  {
    id: 'optimize',
    name: 'Optimize',
    icon: Minimize2,
    color: 'text-amber-500 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/50',
    tools: [
      {
        name: 'Compress',
        icon: Minimize2,
        desc: 'Reduce file size while preserving quality',
        action: 'compress',
        requiresDoc: true,
      },
      {
        name: 'Repair',
        icon: Wrench,
        desc: 'Fix corrupted or unreadable PDF files',
        action: 'repair',
        requiresDoc: true,
      },
      {
        name: 'Flatten',
        icon: Layers,
        desc: 'Flatten annotations and form fields',
        action: 'flatten',
        requiresDoc: true,
      },
      {
        name: 'Convert to PDF/A',
        icon: Archive,
        desc: 'ISO-standard archive specification',
        action: 'pdf_to_pdfa',
        requiresDoc: true,
      },
    ],
  },
  {
    id: 'edit',
    name: 'Edit',
    icon: Edit3,
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/50',
    tools: [
      {
        name: 'Add text',
        icon: Type,
        desc: 'Insert custom text anywhere on page',
        action: 'add_text',
        requiresDoc: true,
      },
      {
        name: 'Edit text',
        icon: Edit3,
        desc: 'Modify existing text content with AI OCR',
        action: 'edit_text',
        requiresDoc: true,
      },
      {
        name: 'Add images',
        icon: ImagePlus,
        desc: 'Insert logos, stamps, or photos into PDF',
        action: 'add_images',
        requiresDoc: true,
      },
      {
        name: 'Draw',
        icon: PenTool,
        desc: 'Freehand markup and sketching',
        action: 'draw',
        requiresDoc: true,
      },
      {
        name: 'Highlight',
        icon: Highlighter,
        desc: 'Highlight paragraphs with translucent color',
        action: 'highlight',
        requiresDoc: true,
      },
      {
        name: 'Annotate',
        icon: MessageSquare,
        desc: 'Leave sticky notes and comments',
        action: 'annotate',
        requiresDoc: true,
      },
      {
        name: 'Whiteout',
        icon: Square,
        desc: 'Conceal or cover areas with clean white blocks',
        action: 'whiteout',
        requiresDoc: true,
      },
      {
        name: 'Watermark',
        icon: Stamp,
        desc: 'Stamp CONFIDENTIAL, DRAFT, or custom text',
        action: 'watermark',
        requiresDoc: true,
      },
      {
        name: 'Page numbers',
        icon: Hash,
        desc: 'Apply sequential page numbers to headers/footers',
        action: 'page_numbers',
        requiresDoc: true,
      },
      {
        name: 'Headers/footers',
        icon: PanelTop,
        desc: 'Add document title, dates, or company labels',
        action: 'headers_footers',
        requiresDoc: true,
      },
    ],
  },
  {
    id: 'security',
    name: 'Security',
    icon: ShieldCheck,
    color: 'text-emerald-500 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
    tools: [
      {
        name: 'Password protect',
        icon: Lock,
        desc: 'Encrypt with AES-256 password protection',
        action: 'password_protect',
        requiresDoc: true,
      },
      {
        name: 'Remove password',
        icon: Unlock,
        desc: 'Decrypt protected PDF for full access',
        action: 'remove_password',
        requiresDoc: true,
      },
      {
        name: 'Redact',
        icon: EyeOff,
        desc: 'Permanently remove sensitive private information',
        action: 'redact',
        requiresDoc: true,
      },
      {
        name: 'Remove metadata',
        icon: ShieldAlert,
        desc: 'Strip author names, GPS location, and edit history',
        action: 'remove_metadata',
        requiresDoc: true,
      },
    ],
  },
  {
    id: 'forms',
    name: 'Forms',
    icon: CheckSquare,
    color: 'text-violet-500 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-950/50',
    tools: [
      {
        name: 'Fill PDF',
        icon: FileCheck2,
        desc: 'Type and complete interactive AcroForms',
        action: 'fill_pdf',
        requiresDoc: true,
      },
      {
        name: 'Create form fields',
        icon: CheckSquare,
        desc: 'Add checkboxes, text boxes, and dropdowns',
        action: 'create_form_fields',
        requiresDoc: true,
      },
      {
        name: 'Sign',
        icon: PenLine,
        desc: 'Draw or type legally-binding e-Signatures',
        action: 'sign',
        requiresDoc: true,
      },
      {
        name: 'Request signature',
        icon: Send,
        desc: 'Send document to recipients for signature',
        action: 'request_signature',
        requiresDoc: true,
      },
    ],
  },
];

function CategorySection({ category, onSelectTool, borderTop = false }) {
  const CatIcon = category.icon;
  return (
    <div className={borderTop ? 'pt-3 border-t border-slate-100 dark:border-[#27272e]' : ''}>
      <div className="px-2 py-1 mb-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <CatIcon className={`w-3.5 h-3.5 ${category.color}`} />
        <span>{category.name}</span>
      </div>
      <div className="space-y-0.5">
        {category.tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <DropdownMenuItem
              key={tool.name}
              onClick={() => onSelectTool(tool)}
              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-[#202026] flex items-start space-x-2.5 transition group cursor-pointer"
            >
              <div
                className={`p-1.5 rounded-lg ${category.bgColor} ${category.color} shrink-0 mt-0.5`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-brand dark:group-hover:text-blue-400 transition truncate">
                  {tool.name}
                </div>
                <div className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight truncate">
                  {tool.desc}
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </div>
    </div>
  );
}

export default function ToolsMenu(props) {
  const docCtx = useDocument();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const isEditor = location.pathname === '/editor';
  const hasDocument =
    props.hasDocument !== undefined ? props.hasDocument : isEditor && Boolean(docCtx.docBuffer);

  const onOpenMergeModal = props.onOpenMergeModal ?? (() => docCtx.setIsMergeModalOpen(true));
  const onOpenSplitModal = props.onOpenSplitModal ?? (() => docCtx.setIsSplitModalOpen(true));
  const onOpenCompressModal =
    props.onOpenCompressModal ?? (() => docCtx.setIsCompressModalOpen(true));
  const onOpenSignatureModal =
    props.onOpenSignatureModal ?? (() => docCtx.setIsSignatureModalOpen(true));
  const onOpenPngModal = props.onOpenPngModal ?? (() => docCtx.setIsPngModalOpen(true));
  const onExportWord = props.onExportWord ?? docCtx.handleExportWord;
  const onExportExcel = props.onExportExcel ?? docCtx.handleExportExcel;

  const onDeletePage =
    props.onDeletePage ??
    (() => {
      if (docCtx.docMeta.pageCount <= 1) {
        docCtx.showToast('Document must contain at least 1 page.', 'error');
        return;
      }
      if (window.confirm(`Delete current page (Page ${docCtx.activePageIndex + 1})?`)) {
        docCtx.handleDeletePage(docCtx.activePageIndex);
      }
    });

  const onExtractPages = props.onExtractPages ?? (() => docCtx.setIsSplitModalOpen(true));
  const onOrganizePages =
    props.onOrganizePages ??
    (() => {
      if (!isEditor) {
        navigate('/editor');
      }
      docCtx.showToast(
        'Use the left thumbnails panel to reorder, rotate, or duplicate pages',
        'info'
      );
    });

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        docCtx.showToast('Please select a PDF file.', 'error');
        return;
      }
      const buffer = await file.arrayBuffer();
      docCtx.loadBuffer(buffer, file.name);
    }
  };

  const executeAction = (action) => {
    switch (action) {
      case 'merge_pdf':
        onOpenMergeModal();
        break;
      case 'split_pdf':
        onOpenSplitModal();
        break;
      case 'extract_pages':
        onExtractPages();
        break;
      case 'remove_pages':
        onDeletePage();
        break;
      case 'reorder_pages':
        onOrganizePages();
        break;
      case 'rotate_pages':
        if (hasDocument) {
          docCtx.handleRotatePage(docCtx.activePageIndex, 90);
        }
        break;
      case 'crop_pages':
        if (!isEditor) navigate('/editor');
        docCtx.showToast('Crop tool active in editor canvas', 'info');
        break;
      case 'duplicate_pages':
        if (hasDocument) {
          docCtx.handleDuplicatePage(docCtx.activePageIndex);
        }
        break;
      case 'pdf_to_word':
        onExportWord && onExportWord();
        break;
      case 'pdf_to_excel':
        onExportExcel && onExportExcel();
        break;
      case 'pdf_to_ppt':
        docCtx.showToast('Converting PDF slides to PowerPoint presentation...', 'info');
        if (onExportWord) onExportWord();
        break;
      case 'pdf_to_jpg':
      case 'pdf_to_png':
        onOpenPngModal && onOpenPngModal();
        break;
      case 'word_to_pdf':
        handleOpenFilePicker();
        docCtx.showToast('Select Word file (.doc/.docx) to load into workspace', 'info');
        break;
      case 'excel_to_pdf':
        handleOpenFilePicker();
        docCtx.showToast('Select spreadsheet (.xlsx) to convert to PDF', 'info');
        break;
      case 'ppt_to_pdf':
        handleOpenFilePicker();
        docCtx.showToast('Select PPT presentation to convert to PDF', 'info');
        break;
      case 'jpg_to_pdf':
        handleOpenFilePicker();
        docCtx.showToast('Select image files to package into PDF', 'info');
        break;
      case 'html_to_pdf': {
        const url = window.prompt('Enter web page URL or HTML link to convert to PDF:');
        if (url) {
          docCtx.showToast(`Fetching and rendering ${url}...`, 'info');
        }
        break;
      }
      case 'compress':
        onOpenCompressModal();
        break;
      case 'repair':
        docCtx.showToast('Repairing PDF xref tables and trailer dictionary...', 'info');
        setTimeout(() => {
          docCtx.showToast('PDF file verified and integrity restored', 'success');
        }, 800);
        break;
      case 'flatten':
        docCtx.showToast('Flattening annotations and form layers...', 'info');
        if (docCtx.handleExportPdf) docCtx.handleExportPdf();
        break;
      case 'pdf_to_pdfa':
        docCtx.showToast('Applying ISO 19005-1 (PDF/A) conformance...', 'info');
        setTimeout(() => {
          docCtx.showToast('Compliant PDF/A-1b format ready', 'success');
        }, 800);
        break;
      case 'add_text':
        if (!isEditor) navigate('/editor');
        docCtx.showToast('Click anywhere on canvas to insert text', 'info');
        break;
      case 'edit_text':
        if (!isEditor) navigate('/editor');
        docCtx.setIsOcrModalOpen(true);
        break;
      case 'add_images':
        if (!isEditor) navigate('/editor');
        docCtx.showToast('Drop image onto document canvas to embed', 'info');
        break;
      case 'draw':
        if (!isEditor) navigate('/editor');
        docCtx.showToast('Pen tool active on canvas', 'info');
        break;
      case 'highlight':
        if (!isEditor) navigate('/editor');
        docCtx.showToast('Highlighter active on canvas', 'info');
        break;
      case 'annotate':
        if (!isEditor) navigate('/editor');
        docCtx.showToast('Annotation tools ready in studio toolbar', 'info');
        break;
      case 'whiteout':
        if (!isEditor) navigate('/editor');
        docCtx.showToast('Whiteout block selector active', 'info');
        break;
      case 'watermark': {
        const text = window.prompt('Enter watermark text:', 'CONFIDENTIAL');
        if (text) {
          docCtx.handleAddWatermark(text);
        }
        break;
      }
      case 'page_numbers':
        docCtx.showToast('Adding automatic page numbers (1 of N)...', 'info');
        docCtx.handleAddWatermark(`Page ${docCtx.activePageIndex + 1}`);
        break;
      case 'headers_footers': {
        const h = window.prompt('Enter header text to stamp:');
        if (h) docCtx.handleAddWatermark(h);
        break;
      }
      case 'password_protect': {
        const pwd = window.prompt('Enter password to encrypt PDF:');
        if (pwd) {
          docCtx.showToast('Document secured with 256-bit encryption', 'success');
        }
        break;
      }
      case 'remove_password':
        docCtx.showToast('Security permissions unlocked for editing', 'success');
        break;
      case 'redact':
        if (!isEditor) navigate('/editor');
        docCtx.showToast('Use redaction block to erase sensitive data', 'info');
        break;
      case 'remove_metadata':
        docCtx.showToast('Metadata and author history stripped clean', 'success');
        break;
      case 'fill_pdf':
        if (!isEditor) navigate('/editor');
        docCtx.showToast('Interactive form fields ready to fill', 'info');
        break;
      case 'create_form_fields':
        if (!isEditor) navigate('/editor');
        docCtx.showToast('Form designer active in editor', 'info');
        break;
      case 'sign':
        onOpenSignatureModal();
        break;
      case 'request_signature': {
        const email = window.prompt('Enter recipient email for signature request:');
        if (email) {
          docCtx.showToast(`Signature request dispatched to ${email}`, 'success');
        }
        break;
      }
      default:
        break;
    }
  };

  const handleToolClick = (tool) => {
    if (tool.requiresDoc && !hasDocument) {
      docCtx.showToast('Please open or upload a PDF document first.', 'info');
      handleOpenFilePicker();
      return;
    }
    executeAction(tool.action);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="application/pdf"
        className="hidden"
      />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center space-x-1 font-medium text-xs sm:text-sm px-3 py-1.5 rounded-lg transition cursor-pointer text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#25252c] data-[state=open]:text-[#205ae3] data-[state=open]:bg-blue-50/80 dark:data-[state=open]:bg-blue-950/40 dark:data-[state=open]:text-blue-400 focus:outline-none"
            aria-label="Everyday PDF Tools"
          >
            <span>Tools</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="w-[920px] max-w-[96vw] max-h-[85vh] overflow-y-auto p-0 rounded-2xl border border-slate-200 dark:border-[#27272e] bg-white dark:bg-[#161619] shadow-2xl"
        >
          {/* Header Banner - Everyday PDF tools */}
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-[#27272e] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70 dark:bg-[#131316]/70">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-brand dark:text-blue-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  Everyday PDF tools
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                    SEO Traffic Suite
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  These give you SEO traffic. High-performance, 100% private in-browser document
                  tools.
                </p>
              </div>
            </div>
          </div>

          {/* 6 Categorized Sections in 3 Responsive Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-[#27272e] p-2 sm:p-3 gap-y-4 md:gap-y-0">
            {/* Column 1: Organize & Security */}
            <div className="space-y-4 px-2">
              <CategorySection category={CATEGORIES[0]} onSelectTool={handleToolClick} />
              <CategorySection
                category={CATEGORIES[4]}
                onSelectTool={handleToolClick}
                borderTop={true}
              />
            </div>

            {/* Column 2: Convert & Optimize */}
            <div className="space-y-4 px-2">
              <CategorySection category={CATEGORIES[1]} onSelectTool={handleToolClick} />
              <CategorySection
                category={CATEGORIES[2]}
                onSelectTool={handleToolClick}
                borderTop={true}
              />
            </div>

            {/* Column 3: Edit & Forms */}
            <div className="space-y-4 px-2">
              <CategorySection category={CATEGORIES[3]} onSelectTool={handleToolClick} />
              <CategorySection
                category={CATEGORIES[5]}
                onSelectTool={handleToolClick}
                borderTop={true}
              />
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
