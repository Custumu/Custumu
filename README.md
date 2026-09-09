# Custumu — The AI Workspace for PDFs & Documents

> **Domain:** [custumu.com](https://custumu.com)  
> **Tagline:** *Your workspace for documents. Drop your PDF, tell us what you want, and we do it.*

---

## 🚀 Product Vision
Rather than building another generic clone of iLovePDF or Smallpdf with 40 isolated buttons, **Custumu** is designed as a unified **AI Document Workspace**.

- **Natural Language First:** Instead of finding the right tool, users simply drop a document and prompt:
  - *"Remove pages 3, 7 and 9, compress the document, and give me a version under 5 MB."*
  - *"Extract all invoice tables into an Excel file."*
  - *"Turn this scanned agreement into searchable, editable text."*
  - *"Find every occurrence of 'Acme Corp' and replace it with 'Custumu Inc.'."*
- **Unified 3-Panel Studio:** No page reloading between merge, split, annotate, or AI chat. Everything lives in one seamless workspace.
- **Privacy-First Dual Engine:**
  - 🛡️ **Private Mode:** Zero-upload processing directly in the browser via WebAssembly (pdf-lib, PDF.js, etc.).
  - ⚡ **Cloud Mode:** End-to-end encrypted pipelines for heavy OCR, deep conversions, batch processing, and LLM reasoning with guaranteed automatic deletion.

---

## 🏛️ The 4 Product Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                     CUSTUMU SAAS PLATFORM                       │
├─────────────────────────────────────────────────────────────────┤
│ Layer 4: PDF → Structured Data & Automations                    │
│   • Invoices / Receipts → Excel / JSON                          │
│   • Bank Statements → CSV / Accounting schemas                  │
│   • Resume parsing, PO extraction, Diff/Comparison Engine       │
├─────────────────────────────────────────────────────────────────┤
│ Layer 3: AI Document Editing & Deep Reasoning                   │
│   • Chat with PDF (Q&A, Summaries, Obligation analysis)         │
│   • Natural language document edits (Add pages, logos, etc.)    │
│   • Multi-document comparisons with semantic diff alerts        │
├─────────────────────────────────────────────────────────────────┤
│ Layer 2: High-Performance OCR & Transformations                 │
│   • Scanned PDF → Searchable PDF & Word                         │
│   • Layout preservation engine                                  │
├─────────────────────────────────────────────────────────────────┤
│ Layer 1: Everyday PDF Utilities (SEO Acquisition Drivers)       │
│   • Organize: Merge, Split, Reorder, Delete, Rotate, Crop      │
│   • Convert: PDF ⇄ Word, Excel, PPT, Images, HTML              │
│   • Optimize & Protect: Compress, Flatten, Sign, Password       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🖥️ Workspace Layout (3-Panel Studio)

```
┌──────────────────────────────────────────────────────────────────┐
│  Custumu    [ Undo ]  [ Redo ]  [ Privacy: Local 🛡️ ]  [ Export ]  │
├──────────────┬───────────────────────────────┬───────────────────┤
│ 📑 Pages     │ 📄 PDF Viewer & Editor Canvas │ 🤖 AI Assistant   │
│              │                               │                   │
│ ┌──────────┐ │  [ Page 1 Preview & Canvas ]  │ "What do you want │
│ │  Page 1  │ │                               │  to do today?"    │
│ └──────────┘ │  • Text editing               │                   │
│ ┌──────────┐ │  • Annotations & Highlight    │ [ Quick Prompts ] │
│ │  Page 2  │ │  • Redaction                  │ • Compress to 5MB │
│ └──────────┘ │  • Signatures & Watermarks    │ • Extract Tables  │
│ ┌──────────┐ │                               │ • Summarize Terms │
│ │  Page 3  │ │                               │                   │
│ └──────────┘ │                               │ [ Ask / Prompt ]  │
└──────────────┴───────────────────────────────┴───────────────────┘
```

---

## 🛠️ Technical Architecture

- **Frontend:** React / Modern SPA (Vanilla CSS design system, sleek dark/light mode, micro-animations)
- **Client-side PDF Engine:** WebAssembly, `pdf-lib`, `pdfjs-dist` for instant, private client operations
- **Backend API:** Node.js / Express (or Next.js)
- **Database & Auth:** Supabase / PostgreSQL
- **Worker & Processing Queue:** Asynchronous PDF processing worker tier (LibreOffice, Ghostscript, PDFium, MuPDF, Tesseract/OCR engine)
- **AI Orchestration:** LLM embeddings, document chunking, structured extraction schemas (Zod / JSON Schema), table parsers

---

## 🎯 MVP Launch Checklist (The Core 8)
1. [ ] **Merge PDF** (Instant browser-side + cloud)
2. [ ] **Split / Reorder Pages** (Visual thumbnail drag-and-drop)
3. [ ] **Smart Compress PDF** (Target file-size slider & WebAssembly optimizer)
4. [ ] **PDF → Word / Office**
5. [ ] **PDF → Excel / CSV** (Table extraction)
6. [ ] **OCR Engine** (Scanned document to searchable text)
7. [ ] **Interactive Visual Editor** (Text, signatures, annotations, redact)
8. [ ] **AI Chat & Action Assistant** (Ask questions + command-driven edits)

---

## 📂 Project Structure Guide
See [`docs/product_specification.md`](./docs/product_specification.md) for full technical requirements, API routes, and schema definitions.
