# Custumu — The AI Workspace for PDFs & Documents

> **Domain:** [custumu.com](https://custumu.com)  
> **Tagline:** *Your workspace for documents. Drop your PDF, tell us what you want, and we do it.*

---

## 🚀 Quick Start: How to Run Locally

### Prerequisites
- Node.js 20+ installed
- Git

---

### Terminal 1: Frontend (React 19 + Vite)
Open a terminal in the root directory:

```bash
# Navigate to the project root
cd Custumu

# Install dependencies (if not already done)
npm install

# Start Vite development server
npm run dev
```

- **App URL:** [http://localhost:3000](http://localhost:3000)

---

### Terminal 2: Backend Server (Express API & Real AI)
Open a second terminal window:

```bash
# Navigate to the server folder
cd Custumu/server

# Install server dependencies (if not already done)
npm install

# Start the Express API server
npm start
```

- **API URL:** [http://localhost:5000](http://localhost:5000)
- **Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 How to Configure Real AI API Keys

Custumu connects to real LLMs (**OpenAI**, **Google Gemini**, and **Anthropic Claude**) with real vector document RAG and autonomous function calling.

You can set up your API key in either of two ways:

### Option A: In the Web App (Easiest / 100% Private BYOK)
1. Open [http://localhost:3000](http://localhost:3000).
2. Click **AI Engine Settings** (or the ⚙️ gear icon in the top right of the AI panel).
3. Choose your provider (**OpenAI**, **Google Gemini**, or **Anthropic**).
4. Paste your API key and click **Apply Engine Settings**.
5. *Keys are stored strictly in your browser's local storage and make direct zero-knowledge API calls.*

### Option B: In the Backend `.env` File
1. Open `server/.env` in your editor.
2. Add one or more keys:
   ```env
   PORT=5000
   OPENAI_API_KEY=sk-proj-...
   # or
   GEMINI_API_KEY=AIzaSy...
   # or
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Restart the backend server (`npm start` in `server/`).

---

## 🏛️ Project Architecture & File Structure

```
Custumu/
├── src/                          # React 19 Frontend
│   ├── components/
│   │   ├── Navbar.jsx            # Top bar, privacy mode toggle, export options
│   │   ├── HeroDropzone.jsx      # Unified landing dropzone + sample document loader
│   │   ├── LeftPanelPages.jsx    # Page thumbnails, reorder, rotate, delete, duplicate
│   │   ├── CenterCanvas.jsx      # Interactive PDF canvas, drawing, text, redaction, signatures
│   │   ├── RightPanelAI.jsx      # Real streaming AI copilot, clickable citations, tool execution cards
│   │   └── modals/
│   │       ├── ApiKeyModal.jsx   # AI model & API key configuration modal
│   │       ├── SignatureModal.jsx# Canvas e-signature pad
│   │       ├── CompressModal.jsx # Target file-size slider & optimizer
│   │       ├── SplitModal.jsx    # Page range extraction & bursting
│   │       ├── MergeModal.jsx    # Multiple PDF combiner
│   │       └── OCRModal.jsx      # Scanned PDF text layer viewer
│   ├── services/
│   │   ├── enterpriseAi.js       # Client AI engine: SSE stream reader, tool call dispatcher
│   │   ├── pdfEngine.js          # Pure client WASM engine via pdf-lib: merge, split, rotate, sign
│   │   └── pdfTextExtractor.js   # Native PDF text layer extractor for real document RAG
│   ├── App.jsx                   # Master studio state management & tool coordinator
│   └── index.css                 # Tailwind CSS design system with custom dark mode & glassmorphism
│
├── server/                       # Node.js + Express Backend
│   ├── src/
│   │   ├── index.js              # Express server entry point & CORS
│   │   ├── routes/
│   │   │   ├── ai.js             # Real streaming SSE endpoint (OpenAI / Gemini / Claude)
│   │   │   └── jobs.js           # BullMQ job enqueueing, progress polling, and download
│   │   ├── services/
│   │   │   ├── rag.js            # Vector embeddings & cosine similarity search
│   │   │   └── queue.js          # BullMQ / Redis job queue manager
│   │   └── workers/
│   │       └── pdfWorker.js      # Headless worker (LibreOffice, Ghostscript, Tesseract OCR)
│   ├── Dockerfile.api            # Container for Express API
│   ├── Dockerfile.worker         # Container with LibreOffice, Ghostscript & Tesseract
│   └── .env                      # Server environment variables
│
├── migrations/                   # Database Migrations (PostgreSQL / Supabase)
│   └── 001_initial_schema.sql    # Tables for users, workspaces, documents, jobs, AI messages
│
├── docker-compose.yml            # Multi-container orchestration (Nginx, API, Worker, Redis)
└── Dockerfile.frontend           # Multi-stage React 19 production build served via Nginx
```

---

## 🐳 Running with Docker (AWS EC2 Production)

To run the complete production environment (Frontend, API, Worker, Redis):

```bash
docker compose up --build
```

- **Frontend (Nginx):** Port `80` / `3000`
- **Backend API:** Port `5000`
- **Redis Broker:** Port `6379`
- **Worker:** Headless LibreOffice + Ghostscript + Tesseract OCR

---

## 🎯 The 8 Core MVP Features Implemented

1. **Merge PDF:** Combine multiple PDF documents in browser memory.
2. **Split PDF:** Extract page ranges or burst into individual files.
3. **Smart Compress:** Target file-size slider (`< 2MB`, `< 5MB`) with savings preview.
4. **PDF → Word:** Structured layout & text exported as `.doc`.
5. **PDF → Excel:** Financial and invoice table detection exported to `.xlsx`.
6. **OCR Engine:** Scanned document detection & searchable text layer viewer.
7. **Visual PDF Editor:** Direct annotations, blackout redactions, and e-signatures.
8. **Real AI Copilot:** Conversational Q&A with verified citations + autonomous document tool calls (`delete_page`, `rotate_page`, `add_watermark`, `compress_pdf`, `extract_tables`).
