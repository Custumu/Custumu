import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DocumentProvider } from './context/DocumentContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import { Toaster } from '@/components/ui/sonner';
import AuthModal from './components/modals/AuthModal';
import LandingPage from './pages/LandingPage';
import EditorPage from './pages/EditorPage';

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

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/editor" element={<EditorPage />} />
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

