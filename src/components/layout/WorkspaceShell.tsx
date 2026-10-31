import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { CommandPalette } from './CommandPalette';
import { OverviewDashboard } from '../admin/OverviewDashboard';
import { CustomerManagement } from '../admin/CustomerManagement';
import { ProductManagement } from '../admin/ProductManagement';
import { PlanManagement } from '../admin/PlanManagement';
import { QuotationManagement } from '../admin/QuotationManagement';
import { SubscriptionManagement } from '../admin/SubscriptionManagement';
import { InvoiceManagement } from '../admin/InvoiceManagement';
import { PaymentManagement } from '../admin/PaymentManagement';
import { BillingDashboard } from '../admin/BillingDashboard';
import { DiscountAndTaxManagement } from '../admin/DiscountAndTaxManagement';
import { ReportsAnalytics } from '../admin/ReportsAnalytics';
import { CustomerPortal } from '../customer/CustomerPortal';
import { invoiceApi } from '../../api/services';

const TAB_ORDER = [
  'overview',
  'customers',
  'products',
  'plans',
  'quotations',
  'subscriptions',
  'invoices',
  'payments',
  'billing',
  'discounts',
  'taxes',
  'reports',
  'customer_overview',
  'customer_plans',
  'customer_invoices',
  'customer_payments',
  'customer_profile'
];

export const WorkspaceShell: React.FC = () => {
  const { role, requestedTab, clearRequestedTab } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [navDirection, setNavDirection] = useState<1 | -1>(1);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [overdueCount, setOverdueCount] = useState<number>(1);
  const [isCommandOpen, setIsCommandOpen] = useState<boolean>(false);
  const mainScrollRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleNavigate = (nextRawTab: string) => {
    const nextTab = nextRawTab === 'discounts_taxes' ? 'taxes' : nextRawTab;
    const prevIdx = TAB_ORDER.indexOf(activeTab);
    const nextIdx = TAB_ORDER.indexOf(nextTab);
    if (prevIdx !== -1 && nextIdx !== -1 && prevIdx !== nextIdx) {
      setNavDirection(nextIdx > prevIdx ? 1 : -1);
    } else {
      setNavDirection(1);
    }
    setActiveTab(nextTab);
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (requestedTab) {
      const normalized = requestedTab === 'discounts_taxes' ? 'taxes' : requestedTab;
      setActiveTab(normalized);
      clearRequestedTab();
      return;
    }
    if (role === 'customer') {
      setActiveTab('customer_overview');
    } else {
      setActiveTab('overview');
    }
  }, [role, requestedTab, clearRequestedTab]);

  useEffect(() => {
    const checkOverdue = async () => {
      const res = await invoiceApi.getAll('overdue');
      if (res.success) {
        setOverdueCount(res.data.length);
      }
    };
    checkOverdue();
  }, [activeTab]);

  // Global Cmd+K / Ctrl+K shortcut for instant workspace navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const viewTitles: Record<string, string> = {
    overview: 'Executive Overview',
    customers: 'Customer Accounts',
    products: 'Products & Variants',
    plans: 'Plans & Cadences',
    quotations: 'Quotation Engine',
    subscriptions: 'Subscription Lifecycle',
    invoices: 'Statutory Invoices',
    payments: 'Payment Ledger',
    billing: 'Batch Billing & Dunning Studio',
    discounts: 'Discount Rules',
    taxes: 'Tax Jurisdictions',
    reports: 'Executive Revenue Reports',
    customer_overview: 'My Subscriptions',
    customer_plans: 'Available Plans',
    customer_invoices: 'My Invoices',
    customer_payments: 'Payment Receipts',
    customer_profile: 'Organization Profile'
  };

  return (
    <div className="flex h-screen bg-[#F7FAFA] text-[#252B2E] overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        overdueCount={overdueCount}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav
          activeView={viewTitles[activeTab] || 'Workspace'}
          onOpenCommandPalette={() => setIsCommandOpen(true)}
        />

        <main
          ref={mainScrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F7FAFA] scroll-smooth"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${role}-${activeTab}`}
              initial={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 0, y: navDirection * 10 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 0, y: navDirection * -8 }
              }
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-7xl mx-auto pb-16"
            >
              {activeTab === 'overview' && <OverviewDashboard onNavigate={handleNavigate} />}
              {activeTab === 'customers' && <CustomerManagement />}
              {activeTab === 'products' && <ProductManagement />}
              {activeTab === 'plans' && <PlanManagement />}
              {activeTab === 'quotations' && <QuotationManagement />}
              {activeTab === 'subscriptions' && <SubscriptionManagement />}
              {activeTab === 'invoices' && <InvoiceManagement />}
              {activeTab === 'payments' && <PaymentManagement />}
              {activeTab === 'billing' && <BillingDashboard />}
              {(activeTab === 'discounts' || activeTab === 'taxes') && <DiscountAndTaxManagement />}
              {activeTab === 'reports' && <ReportsAnalytics />}
              {activeTab.startsWith('customer_') && <CustomerPortal initialTab={activeTab} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Instant Cmd+K / Ctrl+K Command Palette */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        activeTab={activeTab}
        onSelectTab={handleNavigate}
      />
    </div>
  );
};
