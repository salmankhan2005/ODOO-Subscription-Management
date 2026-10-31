import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  FileSpreadsheet,
  Repeat,
  Receipt,
  CreditCard,
  Zap,
  Percent,
  Calculator,
  BarChart3,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';

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
  icon: React.ComponentType<{ className?: string }>;
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

  const adminNav: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'products', label: 'Products & Variants', icon: Package },
    { id: 'plans', label: 'Plans & Cadences', icon: Layers },
    { id: 'quotations', label: 'Quotations', icon: FileSpreadsheet },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
    { id: 'invoices', label: 'Invoices', icon: Receipt, badge: overdueCount > 0 ? overdueCount : undefined },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'billing', label: 'AI Billing & Dunning', icon: Zap, highlight: true },
    { id: 'discounts', label: 'Discounts', icon: Percent },
    { id: 'taxes', label: 'Tax Rules', icon: Calculator },
    { id: 'reports', label: 'Revenue Reports', icon: BarChart3 }
  ];

  const staffNav: NavItem[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'quotations', label: 'Quotations', icon: FileSpreadsheet },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
    { id: 'invoices', label: 'Invoices', icon: Receipt, badge: overdueCount > 0 ? overdueCount : undefined },
    { id: 'payments', label: 'Record Payments', icon: CreditCard },
    { id: 'reports', label: 'Sales Activity', icon: BarChart3 }
  ];

  const customerNav: NavItem[] = [
    { id: 'customer_overview', label: 'My Subscriptions', icon: Repeat },
    { id: 'customer_plans', label: 'Available Plans', icon: Layers },
    { id: 'customer_invoices', label: 'My Invoices', icon: Receipt },
    { id: 'customer_payments', label: 'Payment Receipts', icon: CreditCard },
    { id: 'customer_profile', label: 'Profile & Billing', icon: UserCheck }
  ];

  const currentNav = role === 'admin' ? adminNav : role === 'staff' ? staffNav : customerNav;

  return (
    <aside
      className={`relative z-20 shrink-0 bg-[#0E131F] border-r border-slate-800/80 transition-all duration-200 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
              B
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-100 truncate">
              Brightloop Cloud
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors ${
            collapsed ? 'mx-auto' : ''
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role tag */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/30">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
            {role === 'customer' ? 'Subscriber Portal' : `${role} Console`}
          </div>
          <div className="text-xs text-slate-300 font-medium truncate mt-0.5">{user?.company}</div>
        </div>
      )}

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {currentNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              } ${item.highlight && !isActive ? 'text-indigo-400 font-semibold' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-indigo-400' : 'text-slate-400'}`} />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
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
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between gap-2'}`}>
          {!collapsed && (
            <div className="truncate min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">{user?.name}</div>
              <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
            </div>
          )}
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
