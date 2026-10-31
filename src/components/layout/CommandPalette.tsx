import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, CornerDownLeft, ShieldCheck, Users, UserCircle, RotateCcw, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { store } from '../../api/storage';
import { useToast } from '../../context/ToastContext';
import { AnimatedNavIcon, NavIconKind } from '../common/AnimatedNavIcon';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

interface CommandItem {
  id: string;
  group: 'Navigation' | 'Role Perspective' | 'System Actions';
  label: string;
  subtitle: string;
  iconKind?: NavIconKind;
  customIcon?: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab
}) => {
  const { role, switchRole, setAppMode } = useAuth();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<CommandItem[]>(() => {
    const navItems: CommandItem[] =
      role === 'customer'
        ? [
            {
              id: 'nav-cust-overview',
              group: 'Navigation',
              label: 'My Subscriptions',
              subtitle: 'Active contracts, seats & pause/resume controls',
              iconKind: 'customer_overview',
              action: () => onSelectTab('customer_overview')
            },
            {
              id: 'nav-cust-plans',
              group: 'Navigation',
              label: 'Available Enterprise Plans',
              subtitle: 'Compare cadences and request edition upgrades',
              iconKind: 'customer_plans',
              action: () => onSelectTab('customer_plans')
            },
            {
              id: 'nav-cust-invoices',
              group: 'Navigation',
              label: 'Billing Statements & Tax Receipts',
              subtitle: 'Download printable tax-compliant PDFs',
              iconKind: 'customer_invoices',
              action: () => onSelectTab('customer_invoices')
            },
            {
              id: 'nav-cust-payments',
              group: 'Navigation',
              label: 'Cleared Settlement History',
              subtitle: 'Inspect historical card, ACH & UPI settlements',
              iconKind: 'customer_payments',
              action: () => onSelectTab('customer_payments')
            },
            {
              id: 'nav-cust-profile',
              group: 'Navigation',
              label: 'Subscriber Organization Profile',
              subtitle: 'Legal entity, VAT/GST registration & address',
              iconKind: 'customer_profile',
              action: () => onSelectTab('customer_profile')
            }
          ]
        : [
            {
              id: 'nav-overview',
              group: 'Navigation',
              label: 'Executive Revenue Overview',
              subtitle: 'Real-time MRR, ARR, expansion charts & contract health',
              iconKind: 'overview',
              action: () => onSelectTab('overview')
            },
            {
              id: 'nav-customers',
              group: 'Navigation',
              label: 'Customer Accounts',
              subtitle: 'B2B organizations, tax IDs & receivable balances',
              iconKind: 'customers',
              action: () => onSelectTab('customers')
            },
            ...(role === 'admin'
              ? [
                  {
                    id: 'nav-products',
                    group: 'Navigation' as const,
                    label: 'Products & Variant Markups',
                    subtitle: 'Software catalog, Odoo Brand (+$560) & enterprise SKUs',
                    iconKind: 'products' as NavIconKind,
                    action: () => onSelectTab('products')
                  },
                  {
                    id: 'nav-plans',
                    group: 'Navigation' as const,
                    label: 'Plans & Billing Cadences',
                    subtitle: 'Monthly, quarterly & annual recurring plan templates',
                    iconKind: 'plans' as NavIconKind,
                    action: () => onSelectTab('plans')
                  }
                ]
              : []),
            {
              id: 'nav-quotations',
              group: 'Navigation',
              label: 'Quotation Engine (CPQ)',
              subtitle: 'Draft proposals & convert 1-click into active subscriptions',
              iconKind: 'quotations',
              action: () => onSelectTab('quotations')
            },
            {
              id: 'nav-subscriptions',
              group: 'Navigation',
              label: 'Subscription Lifecycle',
              subtitle: 'Manage active, paused & renewing recurring agreements',
              iconKind: 'subscriptions',
              action: () => onSelectTab('subscriptions')
            },
            {
              id: 'nav-invoices',
              group: 'Navigation',
              label: 'Invoice Ledger & Statements',
              subtitle: 'Statutory 18% GST/VAT statements & PDF dispatch',
              iconKind: 'invoices',
              action: () => onSelectTab('invoices')
            },
            {
              id: 'nav-payments',
              group: 'Navigation',
              label: 'Payment Settlements',
              subtitle: 'Stripe Card, ACH Wire & UPI ledger reconciliation',
              iconKind: 'payments',
              action: () => onSelectTab('payments')
            },
            ...(role === 'admin'
              ? [
                  {
                    id: 'nav-billing',
                    group: 'Navigation' as const,
                    label: 'Batch Billing & Dunning Studio',
                    subtitle: 'Execute cohort billing runs & multi-rail smart retries',
                    iconKind: 'billing' as NavIconKind,
                    action: () => onSelectTab('billing')
                  },
                  {
                    id: 'nav-taxes',
                    group: 'Navigation' as const,
                    label: 'Statutory Taxes & Discounts',
                    subtitle: 'Live pricing sandbox, promo vouchers & VAT/GST rules',
                    iconKind: 'taxes' as NavIconKind,
                    action: () => onSelectTab('taxes')
                  }
                ]
              : []),
            {
              id: 'nav-reports',
              group: 'Navigation',
              label: 'Executive Revenue Reports',
              subtitle: 'Collection efficiency, rail mix & audit exports',
              iconKind: 'reports',
              action: () => onSelectTab('reports')
            }
          ];

    const roleItems: CommandItem[] = [
      {
        id: 'role-admin',
        group: 'Role Perspective',
        label: 'Switch to Administrator Console',
        subtitle: 'Full access to catalog, batch billing studio & tax schedules',
        customIcon: <ShieldCheck className="w-4 h-4 text-[#1F3F47]" />,
        action: () => switchRole('admin')
      },
      {
        id: 'role-staff',
        group: 'Role Perspective',
        label: 'Switch to Sales & Finance Ops',
        subtitle: 'Focused CPQ quotation desk, subscriptions & receivables',
        customIcon: <Users className="w-4 h-4 text-[#2E9F92]" />,
        action: () => switchRole('staff')
      },
      {
        id: 'role-customer',
        group: 'Role Perspective',
        label: 'Switch to Subscriber Self-Service Portal',
        subtitle: 'Customer view of active contracts, upgrades & statements',
        customIcon: <UserCircle className="w-4 h-4 text-[#E96F50]" />,
        action: () => switchRole('customer')
      }
    ];

    const systemItems: CommandItem[] = [
      {
        id: 'sys-showcase',
        group: 'System Actions',
        label: 'Return to Product Showcase Site',
        subtitle: 'View interactive 3D bento, analytics grid & hero pipeline',
        customIcon: <ArrowUpRight className="w-4 h-4 text-[#345C64]" />,
        action: () => setAppMode('showcase')
      },
      {
        id: 'sys-reset',
        group: 'System Actions',
        label: 'Reset Demo Ledger to Baseline',
        subtitle: 'Restore default enterprise contracts, invoices & dunning queue',
        customIcon: <RotateCcw className="w-4 h-4 text-[#56666B]" />,
        action: () => {
          store.resetToDefaults();
          showToast('Workspace ledger reset to baseline enterprise dataset', { type: 'info' });
        }
      }
    ];

    return [...navItems, ...roleItems, ...systemItems];
  }, [role, onSelectTab, switchRole, setAppMode, showToast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0
        );
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].action();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[11vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#1F3F47]/35 backdrop-blur-xs"
          />

          {/* Command Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-xl rounded-2xl bg-white border border-[#E5ECEC] shadow-[0_28px_60px_-15px_rgba(11,26,32,0.32)] overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Workspace Command Palette"
          >
            {/* Search Input Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E5ECEC] bg-[#F7FAFA]">
              <Search className="w-4 h-4 text-[#345C64] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to any module, switch role perspective, or run action..."
                className="flex-1 bg-transparent text-xs sm:text-sm text-[#252B2E] placeholder-[#56666B] focus:outline-none"
              />
              <kbd className="px-2 py-0.5 text-[10px] font-mono font-semibold text-[#56666B] bg-white border border-[#E5ECEC] rounded">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="max-h-[360px] overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#56666B]">
                  No matching modules or workspace actions for “{query}”.
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const isFocused = idx === selectedIndex;
                  const showGroupHeader =
                    idx === 0 || filtered[idx - 1].group !== item.group;

                  return (
                    <React.Fragment key={item.id}>
                      {showGroupHeader && (
                        <div className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-wider font-semibold text-[#56666B]">
                          {item.group}
                        </div>
                      )}
                      <button
                        type="button"
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => {
                          item.action();
                          onClose();
                        }}
                        className="relative w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors"
                      >
                        {isFocused && (
                          <motion.div
                            layoutId="cmd-palette-active-bg"
                            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                            className="absolute inset-0 rounded-xl bg-[#DDF3F0]/80 border border-[#345C64]/20"
                          />
                        )}

                        <div className="relative z-10 flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-white border border-[#E5ECEC] flex items-center justify-center text-[#1F3F47] shrink-0">
                            {item.iconKind ? (
                              <AnimatedNavIcon
                                kind={item.iconKind}
                                isHovered={isFocused}
                                className="w-4 h-4 text-[#1F3F47]"
                              />
                            ) : (
                              item.customIcon
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#1F3F47] truncate">
                              {item.label}
                            </div>
                            <div className="text-[11px] text-[#56666B] truncate">
                              {item.subtitle}
                            </div>
                          </div>
                        </div>

                        {isFocused && (
                          <span className="relative z-10 inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#1F3F47] shrink-0">
                            <span>Open</span>
                            <CornerDownLeft className="w-3 h-3" />
                          </span>
                        )}
                      </button>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            {/* Footer Hints */}
            <div className="px-4 py-2.5 border-t border-[#E5ECEC] bg-[#F7FAFA] flex items-center justify-between text-[11px] text-[#56666B]">
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="font-mono font-semibold text-[#252B2E]">↑↓</kbd> Navigate
                </span>
                <span>
                  <kbd className="font-mono font-semibold text-[#252B2E]">↵</kbd> Select
                </span>
              </div>
              <span className="font-mono text-[#345C64] font-semibold">Brightloop Quick Navigator</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
