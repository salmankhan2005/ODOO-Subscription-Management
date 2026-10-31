import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { RoleSwitcher } from './RoleSwitcher';
import { store } from '../../api/storage';
import { useToast } from '../../context/ToastContext';
import { LayoutDashboard, Sparkles, RotateCcw } from 'lucide-react';

interface TopNavProps {
  activeView?: string;
}

export const TopNav: React.FC<TopNavProps> = ({ activeView = 'Overview' }) => {
  const { appMode, setAppMode, role } = useAuth();
  const { showToast } = useToast();

  const handleResetData = () => {
    store.resetToDefaults();
    showToast('Demo environment reset to pristine Odoo test data', { type: 'info' });
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setAppMode(appMode === 'showcase' ? 'workspace' : 'showcase')}
            className="text-left group flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-lg shadow-indigo-600/30">
              B
            </div>
            <span className="text-lg font-bold tracking-tight text-white font-display">
              Brightloop
            </span>
          </button>
        </div>

        {/* Zone 2: 4-5 clean single-line navigation links or contextual breadcrumb */}
        {appMode === 'showcase' ? (
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#bento-overview" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Platform
            </a>
            <a href="#interactive-calculator" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Variant Pricing
            </a>
            <a href="#dunning-engine" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              AI Dunning
            </a>
            <a href="#quote-to-cash" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Quote to Cash
            </a>
          </nav>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium whitespace-nowrap shrink-0">
            <span>Brightloop SaaS</span>
            <span className="text-slate-600">/</span>
            <span className="capitalize">{role} Experience</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200 font-semibold">{activeView}</span>
          </div>
        )}

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {appMode === 'showcase' ? (
            <button
              onClick={() => setAppMode('workspace')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all shadow-md shadow-indigo-600/25 whitespace-nowrap shrink-0"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Launch Live Workspace</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleResetData}
                title="Reset local storage to pristine test data"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg border border-transparent hover:border-slate-700 transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Demo</span>
              </button>
              <button
                onClick={() => setAppMode('showcase')}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40 rounded-lg border border-indigo-900/60 transition-all"
              >
                <Sparkles className="w-3 h-3" />
                <span>Showcase</span>
              </button>
              <RoleSwitcher />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
