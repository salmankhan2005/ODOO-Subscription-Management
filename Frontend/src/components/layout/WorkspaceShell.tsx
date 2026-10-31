import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
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

export const WorkspaceShell: React.FC = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [overdueCount, setOverdueCount] = useState<number>(1);

  // Sync default tab when role changes
  useEffect(() => {
    if (role === 'customer') {
      setActiveTab('customer_overview');
    } else {
      setActiveTab('overview');
    }
  }, [role]);

  useEffect(() => {
    const checkOverdue = async () => {
      const res = await invoiceApi.getAll('overdue');
      if (res.success) {
        setOverdueCount(res.data.length);
      }
    };
    checkOverdue();
  }, [activeTab]);

  const viewTitles: Record<string, string> = {
    overview: 'Overview',
    customers: 'Customers',
    products: 'Products & Variants',
    plans: 'Plans',
    quotations: 'Quotations',
    subscriptions: 'Subscriptions',
    invoices: 'Invoices',
    payments: 'Payments',
    billing: 'AI Billing & Dunning',
    discounts: 'Discounts',
    taxes: 'Tax Rules',
    reports: 'Reports & Analytics',
    customer_overview: 'Subscriber Overview',
    customer_plans: 'Available Plans',
    customer_invoices: 'My Invoices',
    customer_payments: 'Payment Receipts',
    customer_profile: 'Organization Profile'
  };

  return (
    <div className="flex h-screen bg-[#0B0F17] text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        overdueCount={overdueCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav activeView={viewTitles[activeTab] || 'Workspace'} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0B0F17]">
          <div className="max-w-7xl mx-auto pb-16">
            {activeTab === 'overview' && <OverviewDashboard onNavigate={setActiveTab} />}
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
          </div>
        </main>
      </div>
    </div>
  );
};
