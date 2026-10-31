import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { WorkspaceShell } from './components/layout/WorkspaceShell';
import { LoginPage } from './components/auth/LoginPage';
import { ShowcaseLanding } from './components/landing/ShowcaseLanding';
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

  return (
    <div className="min-h-screen bg-[#F7FAFA] text-[#252B2E]">
      {isLoading ? (
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
          Checking your session...
        </div>
      ) : selectedRole && isAuthenticated && role === selectedRole ? (
        <WorkspaceShell />
      ) : selectedRole ? (
        <LoginPage
          expectedRole={selectedRole}
          onCancel={() => {
            sessionStorage.removeItem(SELECTED_PORTAL_KEY);
            setSelectedRole(null);
          }}
        />
      ) : (
        <ShowcaseLanding onLaunch={(requestedRole) => void handleLaunch(requestedRole)} />
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
