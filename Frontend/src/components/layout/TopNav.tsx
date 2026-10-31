import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { RoleSwitcher } from './RoleSwitcher';

interface TopNavProps {
  activeView?: string;
}

export const TopNav: React.FC<TopNavProps> = ({ activeView = 'Overview' }) => {
  const { role } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold tracking-wider text-white shadow-lg shadow-indigo-600/30">
            B
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Brightloop</span>
          <span className="hidden text-slate-600 sm:inline">/</span>
          <span className="hidden text-xs font-medium capitalize text-slate-400 sm:inline">
            {role} portal
          </span>
          <span className="hidden text-slate-600 md:inline">/</span>
          <span className="hidden truncate text-xs font-semibold text-slate-200 md:inline">
            {activeView}
          </span>
        </div>
        <RoleSwitcher />
      </div>
    </header>
  );
};
