import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { WorkspaceShell } from './components/layout/WorkspaceShell';
import { LoginPage } from './components/auth/LoginPage';
import { ShowcaseLanding } from './components/landing/ShowcaseLanding';
import { UserRole } from './types';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, role, accounts, switchAccount } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleLaunch = async (requestedRole: UserRole) => {
    setSelectedRole(requestedRole);
    const savedAccount = accounts.find((account) => account.role === requestedRole);
    if (savedAccount) {
      const result = await switchAccount(savedAccount.id);
      if (!result.success) {
        setSelectedRole(requestedRole);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100">
      {isLoading ? (
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
          Checking your session...
        </div>
      ) : selectedRole && isAuthenticated && role === selectedRole ? (
        <WorkspaceShell />
      ) : selectedRole ? (
        <LoginPage
          expectedRole={selectedRole}
          onCancel={() => setSelectedRole(null)}
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
