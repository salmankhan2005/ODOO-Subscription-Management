import React, { useState } from 'react';
import { Check, ChevronDown, LogOut, Plus, ShieldCheck, UserCircle, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserRole } from '../../types';
import { LoginPage } from '../auth/LoginPage';

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrator',
  staff: 'Staff / Sales',
  customer: 'Customer',
};

const roleIcons: Record<UserRole, React.ReactNode> = {
  admin: <ShieldCheck className="h-4 w-4 text-indigo-400" />,
  staff: <Users className="h-4 w-4 text-emerald-400" />,
  customer: <UserCircle className="h-4 w-4 text-amber-400" />,
};

export const RoleSwitcher: React.FC = () => {
  const { role, user, accounts, switchAccount, logout } = useAuth();
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [addingAccount, setAddingAccount] = useState(false);

  const handleSwitchAccount = async (accountId: string) => {
    const result = await switchAccount(accountId);
    if (!result.success) {
      showToast('Could not switch account', {
        type: 'error',
        message: result.message,
      });
      return;
    }
    setMenuOpen(false);
  };

  const handleLogout = () => {
    void logout().catch(() => {
      showToast('Signed out on this tab', {
        type: 'warning',
        message: 'The server could not revoke this session. Its tokens were removed from this tab.',
      });
    });
  };

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 transition hover:border-indigo-500/60 hover:bg-slate-800"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          title="Switch account or sign in to another account"
        >
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
            {roleIcons[role]}
            {roleLabels[role]}
          </span>
          <span className="hidden max-w-[110px] truncate text-xs text-slate-400 sm:inline">
            {user?.name?.split(' ')[0]}
          </span>
          <span className="hidden border-l border-slate-700 pl-2 text-[11px] font-medium text-indigo-300 md:inline">
            Switch account
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-slate-700 bg-[#FFFFFF] p-2 shadow-2xl"
          >
            <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Signed-in accounts
            </p>
            <p className="px-2 pb-2 text-[11px] leading-relaxed text-slate-400">
              Sign in with your Admin or Staff credentials to add that account. Your Customer account will stay signed in.
            </p>
            {accounts.map((account) => (
              <button
                key={account.id}
                type="button"
                role="menuitem"
                onClick={() => void handleSwitchAccount(account.id)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-slate-800"
              >
                {roleIcons[account.role]}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-slate-100">{account.name}</span>
                  <span className="block truncate text-[11px] text-slate-400">
                    {account.email} · {roleLabels[account.role]}
                  </span>
                </span>
                {account.id === user?.id && <Check className="h-4 w-4 text-indigo-400" />}
              </button>
            ))}
            <div className="my-1 border-t border-slate-700/80" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setAddingAccount(true);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium text-indigo-300 transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Sign in to another account
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium text-rose-300 transition hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
              Sign out this account
            </button>
          </div>
        )}
      </div>
      {addingAccount && (
        <LoginPage
          title="Sign in to another account"
          onCancel={() => setAddingAccount(false)}
          onAuthenticated={() => setAddingAccount(false)}
        />
      )}
    </>
  );
};
