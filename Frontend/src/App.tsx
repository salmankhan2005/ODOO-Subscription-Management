import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { WorkspaceShell } from './components/layout/WorkspaceShell';
import { LoginPage } from './components/auth/LoginPage';
import { ShowcaseLanding } from './components/landing/ShowcaseLanding';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { UserRole } from './types';

const SELECTED_PORTAL_KEY = 'brightloop_selected_portal';
const getSavedPortal = (): UserRole | null => {
  const saved = sessionStorage.getItem(SELECTED_PORTAL_KEY);
  return saved === 'admin' || saved === 'staff' || saved === 'customer'
    ? saved
    : null;
};

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, role, accounts, switchAccount } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(getSavedPortal);

  // Sync selectedRole with authenticated role so workspace never gets locked out or blank
  useEffect(() => {
    if (isAuthenticated && role) {
      setSelectedRole(role);
      sessionStorage.setItem(SELECTED_PORTAL_KEY, role);
    }
  }, [isAuthenticated, role]);

  const handleLaunch = async (requestedRole: UserRole) => {
    setSelectedRole(requestedRole);
    sessionStorage.setItem(SELECTED_PORTAL_KEY, requestedRole);
    const savedAccount = accounts.find((account) => account.role === requestedRole);
    if (savedAccount) {
      const result = await switchAccount(savedAccount.id);
      if (!result.success) {
        setSelectedRole(requestedRole);
      }
    }
  };

  const handleCancelLogin = () => {
    sessionStorage.removeItem(SELECTED_PORTAL_KEY);
    setSelectedRole(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7FAFA] text-sm text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1F3F47] border-t-transparent" />
          <span>Checking your session...</span>
        </div>
      </div>
    );
  }

  // If user is authenticated, ALWAYS show their Workspace
  if (isAuthenticated && role) {
    return (
      <ErrorBoundary fallbackTitle="Workspace could not be displayed">
        <WorkspaceShell />
      </ErrorBoundary>
    );
  }

  // If user selected a portal to sign in
  if (selectedRole) {
    return (
      <ErrorBoundary fallbackTitle="Sign-in page encountered an error">
        <LoginPage
          expectedRole={selectedRole}
          onCancel={handleCancelLogin}
        />
      </ErrorBoundary>
    );
  }

  // Otherwise, show landing page
  return (
    <ErrorBoundary fallbackTitle="Landing page encountered an error">
      <ShowcaseLanding onLaunch={(requestedRole) => void handleLaunch(requestedRole)} />
    </ErrorBoundary>
  );
};

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Application encountered a critical error">
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
