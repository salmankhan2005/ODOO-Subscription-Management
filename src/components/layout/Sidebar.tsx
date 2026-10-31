import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, LogOut } from 'lucide-react';
import { AnimatedNavIcon, NavIconKind } from '../common/AnimatedNavIcon';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  overdueCount?: number;
}

interface NavItem {
  id: string;
  label: string;
  iconKind: NavIconKind;
  badge?: number;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  overdueCount = 0
}) => {
  const { role, user, logout } = useAuth();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const adminNav: NavItem[] = [
    { id: 'overview', label: 'Overview', iconKind: 'overview' },
    { id: 'customers', label: 'Customers', iconKind: 'customers' },
    { id: 'products', label: 'Products & Variants', iconKind: 'products' },
    { id: 'plans', label: 'Plans & Cadences', iconKind: 'plans' },
    { id: 'quotations', label: 'Quotations', iconKind: 'quotations' },
    { id: 'subscriptions', label: 'Subscriptions', iconKind: 'subscriptions' },
    {
      id: 'invoices',
      label: 'Invoices',
      iconKind: 'invoices',
      badge: overdueCount > 0 ? overdueCount : undefined
    },
    { id: 'payments', label: 'Payments', iconKind: 'payments' },
    { id: 'billing', label: 'Billing & Dunning', iconKind: 'billing', highlight: true },
    { id: 'discounts', label: 'Discounts', iconKind: 'discounts' },
    { id: 'taxes', label: 'Tax Rules', iconKind: 'taxes' },
    { id: 'reports', label: 'Revenue Reports', iconKind: 'reports' }
  ];

  const staffNav: NavItem[] = [
    { id: 'overview', label: 'Dashboard', iconKind: 'overview' },
    { id: 'customers', label: 'Customers', iconKind: 'customers' },
    { id: 'quotations', label: 'Quotations', iconKind: 'quotations' },
    { id: 'subscriptions', label: 'Subscriptions', iconKind: 'subscriptions' },
    {
      id: 'invoices',
      label: 'Invoices',
      iconKind: 'invoices',
      badge: overdueCount > 0 ? overdueCount : undefined
    },
    { id: 'payments', label: 'Record Payments', iconKind: 'payments' },
    { id: 'reports', label: 'Sales Activity', iconKind: 'reports' }
  ];

  const customerNav: NavItem[] = [
    { id: 'customer_overview', label: 'My Subscriptions', iconKind: 'customer_overview' },
    { id: 'customer_plans', label: 'Available Plans', iconKind: 'customer_plans' },
    { id: 'customer_invoices', label: 'My Invoices', iconKind: 'customer_invoices' },
    { id: 'customer_payments', label: 'Payment Receipts', iconKind: 'customer_payments' },
    { id: 'customer_profile', label: 'Profile & Billing', iconKind: 'customer_profile' }
  ];

  const currentNav = role === 'admin' ? adminNav : role === 'staff' ? staffNav : customerNav;

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 360, damping: 32, mass: 0.7 }
      }
      className="relative z-20 shrink-0 bg-white border-r border-[#E5ECEC] flex flex-col overflow-hidden"
    >
      {/* Brand header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#E5ECEC]">
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="brand-expanded"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.14 }}
              className="flex items-center gap-2.5 overflow-hidden"
            >
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { rotate: -6, scale: 1.06 }}
                transition={{ duration: 0.16 }}
                className="w-7 h-7 rounded-lg bg-[#1F3F47] flex items-center justify-center font-bold text-xs text-white font-display shrink-0"
              >
                B
              </motion.div>
              <span className="font-extrabold text-base tracking-tight text-[#1F3F47] font-display truncate">
                Brightloop
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg text-[#56666B] hover:text-[#1F3F47] hover:bg-[#DDF3F0]/50 transition-colors ${
            collapsed ? 'mx-auto' : ''
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <motion.span
            initial={false}
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.span>
        </button>
      </div>

      {/* Organization Context */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="org-context"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.16 }}
            className="px-4 py-3 border-b border-[#E5ECEC] bg-[#F7FAFA] overflow-hidden"
          >
            <div className="text-[11px] font-semibold text-[#345C64] whitespace-nowrap">
              {role === 'customer'
                ? 'Subscriber Portal'
                : role === 'admin'
                  ? 'Enterprise Admin'
                  : 'Sales Operations'}
            </div>
            <div className="text-xs text-[#252B2E] font-medium truncate mt-0.5">{user?.company}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation items with shared-layout sliding highlight & animated icons */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {currentNav.map((item) => {
          const isActive = activeTab === item.id;
          const isHovered = hoveredId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`relative w-full flex items-center ${
                collapsed ? 'justify-center px-2' : 'gap-3 px-3'
              } py-2.5 rounded-lg text-xs transition-colors whitespace-nowrap ${
                isActive
                  ? 'text-[#1F3F47] font-semibold'
                  : 'text-[#56666B] hover:text-[#252B2E] font-medium'
              }`}
              title={collapsed ? item.label : undefined}
            >
              {/* Gliding Active Mint Pill */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }
                  }
                  className="absolute inset-0 rounded-lg bg-[#DDF3F0]"
                />
              )}

              {/* Subtle Hover Backdrop when inactive */}
              {!isActive && isHovered && (
                <motion.div
                  layoutId="sidebar-hover-indicator"
                  transition={{ duration: 0.14 }}
                  className="absolute inset-0 rounded-lg bg-[#F7FAFA]"
                />
              )}

              {/* Domain-Specific Animated Icon */}
              <span className="relative z-10 inline-flex items-center justify-center">
                <AnimatedNavIcon
                  kind={item.iconKind}
                  isActive={isActive}
                  isHovered={isHovered}
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? 'text-[#1F3F47]'
                      : item.highlight
                        ? 'text-[#2E9F92]'
                        : isHovered
                          ? 'text-[#345C64]'
                          : 'text-[#56666B]'
                  }`}
                />
              </span>

              {!collapsed && (
                <div className="relative z-10 flex-1 flex items-center justify-between truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-2 font-mono tabular-nums text-[11px] font-bold text-[#E96F50]">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / User info */}
      <div className="p-3 border-t border-[#E5ECEC] bg-[#F7FAFA]">
        <div
          className={`flex items-center ${
            collapsed ? 'justify-center' : 'justify-between gap-2'
          }`}
        >
          {!collapsed && (
            <div className="truncate min-w-0">
              <div className="text-xs font-semibold text-[#252B2E] truncate">{user?.name}</div>
              <div className="text-[11px] text-[#56666B] truncate font-mono">{user?.email}</div>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            className="group p-1.5 rounded-lg text-[#56666B] hover:text-[#E96F50] hover:bg-white transition-colors shrink-0"
            title="Return to landing showcase"
          >
            <LogOut className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
};
