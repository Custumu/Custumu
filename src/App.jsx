import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DocumentProvider } from './context/DocumentContext';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import LandingPage from './pages/LandingPage';
import EditorPage from './pages/EditorPage';

function AppContent() {
  const location = useLocation();
  const isEditor = location.pathname === '/editor';

  return (
    <div
      className={`bg-slate-50 text-slate-800 flex flex-col selection:bg-brand-500 selection:text-white ${isEditor ? 'h-screen overflow-hidden' : 'min-h-screen'}`}
    >
      <Toast />
      <Navbar />

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
    <DocumentProvider>
      <AppContent />
    </DocumentProvider>
  );
}
