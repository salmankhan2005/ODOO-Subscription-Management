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
import { StaffManagement } from '../admin/StaffManagement';
import { invoiceApi } from '../../api/services';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';

export const WorkspaceShell: React.FC = () => {
  const { role } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<string>(
    role === 'customer' ? 'customer_overview' : 'overview'
  );
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
    if (role === 'customer') {
      setOverdueCount(0);
      return;
    }

    const checkOverdue = async () => {
      try {
        const res = await invoiceApi.getAll({ status: 'overdue' });
        if (res.success) {
          setOverdueCount(res.data.length);
        }
      } catch (error) {
        const responseMessage = axios.isAxiosError(error) &&
          error.response?.data &&
          typeof error.response.data === 'object' &&
          'message' in error.response.data &&
          typeof error.response.data.message === 'string'
          ? error.response.data.message
          : undefined;
        showToast('Could not load overdue invoices', {
          type: 'error',
          message: responseMessage || (error instanceof Error ? error.message : 'Please try again.'),
        });
      }
    };
    void checkOverdue();
  }, [role, showToast]);

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
    staff: 'Add Staff',
    customer_overview: 'Subscriber Overview',
    customer_plans: 'Available Plans',
    customer_invoices: 'My Invoices',
    customer_payments: 'Payment Receipts',
    customer_profile: 'Organization Profile'
  };

  return (
    <div className="flex h-screen bg-[#F7FAFA] text-[#252B2E] overflow-hidden">
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

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F7FAFA]">
          <div className="max-w-7xl mx-auto pb-16">
            {activeTab === 'overview' && role !== 'customer' && <OverviewDashboard onNavigate={setActiveTab} />}
            {activeTab === 'customers' && role !== 'customer' && <CustomerManagement />}
            {activeTab === 'products' && role === 'admin' && <ProductManagement />}
            {activeTab === 'plans' && role !== 'customer' && <PlanManagement />}
            {activeTab === 'quotations' && role !== 'customer' && <QuotationManagement />}
            {activeTab === 'subscriptions' && role !== 'customer' && (
              <SubscriptionManagement onNavigate={setActiveTab} />
            )}
            {activeTab === 'invoices' && role !== 'customer' && <InvoiceManagement />}
            {activeTab === 'payments' && role !== 'customer' && <PaymentManagement />}
            {activeTab === 'billing' && role === 'admin' && <BillingDashboard />}
            {(activeTab === 'discounts' || activeTab === 'taxes') && role === 'admin' && <DiscountAndTaxManagement />}
            {activeTab === 'reports' && role !== 'customer' && <ReportsAnalytics />}
            {activeTab === 'staff' && role === 'admin' && <StaffManagement />}
            {activeTab.startsWith('customer_') && role === 'customer' && <CustomerPortal initialTab={activeTab} />}
          </div>
        </main>
      </div>
    </div>
  );
};
