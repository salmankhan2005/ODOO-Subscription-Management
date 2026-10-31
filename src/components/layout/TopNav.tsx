import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { RoleSwitcher } from './RoleSwitcher';
import { store } from '../../api/storage';
import { useToast } from '../../context/ToastContext';
import { RotateCcw, ArrowUpRight, Search } from 'lucide-react';

interface TopNavProps {
  activeView?: string;
  onOpenCommandPalette?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeView = 'Overview',
  onOpenCommandPalette
}) => {
  const { appMode, setAppMode, role, launchWorkspace } = useAuth();
  const { showToast } = useToast();

  const handleResetData = () => {
    store.resetToDefaults();
    showToast('Workspace ledger reset to baseline enterprise dataset', { type: 'info' });
  };

  if (appMode === 'showcase') {
    // Strict 3-Zone Top Bar Contract for Marketing Landing Page
    return (
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E5ECEC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            className="text-lg font-extrabold tracking-tight text-[#1F3F47] font-display whitespace-nowrap shrink-0"
          >
            Brightloop
          </a>

          {/* Zone 2: 5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#56666B]">
            <a
              href="#three-d-bento"
              className="hover:text-[#1F3F47] underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
            >
              3D Platform
            </a>
            <a
              href="#cinematic-vault"
              className="hover:text-[#1F3F47] underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
            >
              Cinematic Vault
            </a>
            <a
              href="#isometric-pipeline"
              className="hover:text-[#1F3F47] underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
            >
              Quote to Cash
            </a>
            <a
              href="#analytics-bento"
              className="hover:text-[#1F3F47] underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
            >
              Analytics
            </a>
            <a
              href="#interactive-calculator"
              className="hover:text-[#1F3F47] underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
            >
              Variant Pricing
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => launchWorkspace('admin', 'overview')}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1F3F47] hover:bg-[#162E35] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Launch Workspace
            </button>
          </div>
        </div>
      </header>
    );
  }

  // Workspace Shell Header: Contextual Animated Breadcrumb + Quick Jump (Cmd+K) + Role Controls
  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-[#E5ECEC]">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Contextual Animated Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-[#56666B] whitespace-nowrap min-w-0">
          <span className="font-semibold text-[#345C64]">Brightloop</span>
          <span className="text-[#C5D4D4]">/</span>
          <span className="capitalize hidden sm:inline">
            {role === 'customer' ? 'Subscriber Portal' : `${role} Console`}
          </span>
          <span className="text-[#C5D4D4] hidden sm:inline">/</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={activeView}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
              className="text-[#252B2E] font-semibold truncate"
            >
              {activeView}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Workspace Quick Navigator & Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              title="Open Quick Navigator (Cmd+K / Ctrl+K)"
              className="group inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#56666B] hover:text-[#1F3F47] bg-[#F7FAFA] hover:bg-[#DDF3F0]/45 rounded-lg border border-[#E5ECEC] hover:border-[#345C64]/40 transition-colors whitespace-nowrap shrink-0"
            >
              <Search className="w-3.5 h-3.5 text-[#345C64] transition-transform duration-150 group-hover:scale-110" />
              <span className="hidden md:inline">Quick Jump</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold text-[#345C64] bg-white border border-[#E5ECEC] rounded">
                ⌘K
              </kbd>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetData}
            title="Reset workspace storage to baseline enterprise records"
            className="group hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#56666B] hover:text-[#1F3F47] hover:bg-[#F7FAFA] rounded-lg border border-transparent hover:border-[#E5ECEC] transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-rotate-90" />
            <span>Reset Data</span>
          </button>

          <button
            type="button"
            onClick={() => setAppMode('showcase')}
            className="group hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#1F3F47] bg-[#DDF3F0]/60 hover:bg-[#DDF3F0] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <span>Product Site</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>

          <RoleSwitcher />
        </div>
      </div>
    </header>
  );
};
