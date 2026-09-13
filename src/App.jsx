import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DocumentProvider } from './context/DocumentContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import { Toaster } from '@/components/ui/sonner';
import AuthModal from './components/modals/AuthModal';
import ModalsContainer from './components/modals/ModalsContainer';
import LandingPage from './pages/LandingPage';
import EditorPage from './pages/EditorPage';
import ToolLandingPage from './pages/ToolLandingPage';
import { ALL_TOOLS } from './lib/pdfTools';

function AppContent() {
  const location = useLocation();
  const isEditor = location.pathname === '/editor';

  return (
    <div
      className={`bg-[var(--bg-app)] text-[var(--text-primary)] dark:bg-[#101012] dark:text-slate-100 flex flex-col selection:bg-brand selection:text-white transition-colors duration-150 ${isEditor ? 'h-screen overflow-hidden' : 'min-h-screen'}`}
    >
      <Toast />
      <Toaster position="top-right" richColors />
      <Navbar />
      <AuthModal />
      <ModalsContainer />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/editor" element={<EditorPage />} />
        {ALL_TOOLS.map((tool) => (
          <Route
            key={tool.path}
            path={tool.path}
            element={<ToolLandingPage tool={tool} />}
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DocumentProvider>
        <AppContent />
      </DocumentProvider>
    </AuthProvider>
  );
}

