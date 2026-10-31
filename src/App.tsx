import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { TopNav } from './components/layout/TopNav';
import { ShowcaseLanding } from './components/landing/ShowcaseLanding';
import { WorkspaceShell } from './components/layout/WorkspaceShell';

const AppContent: React.FC = () => {
  const { appMode } = useAuth();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [appMode]);

  return (
    <div className="min-h-screen bg-[#F7FAFA] text-[#252B2E]">
      <AnimatePresence mode="wait">
        {appMode === 'showcase' ? (
          <motion.div
            key="showcase-mode"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <TopNav activeView="Showcase" />
            <ShowcaseLanding />
          </motion.div>
        ) : (
          <motion.div
            key="workspace-mode"
            initial={{ opacity: 0, scale: 0.994 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.996 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <WorkspaceShell />
          </motion.div>
        )}
      </AnimatePresence>
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
