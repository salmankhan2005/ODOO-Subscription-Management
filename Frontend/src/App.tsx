import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { TopNav } from './components/layout/TopNav';
import { ShowcaseLanding } from './components/landing/ShowcaseLanding';
import { WorkspaceShell } from './components/layout/WorkspaceShell';

const AppContent: React.FC = () => {
  const { appMode } = useAuth();

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100">
      {appMode === 'showcase' ? (
        <>
          <TopNav activeView="Showcase" />
          <ShowcaseLanding />
        </>
      ) : (
        <WorkspaceShell />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
