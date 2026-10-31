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
import { ErrorBoundary } from '../common/ErrorBoundary';
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
  const [overdueCount, setOverdueCount] = useState<number>(0);

  // Sync default tab when role changes
  useEffect(() => {
    if (role === 'customer') {
      if (!activeTab.startsWith('customer_')) {
        setActiveTab('customer_overview');
      }
    } else {
      if (activeTab.startsWith('customer_')) {
        setActiveTab('overview');
      }
    }
  }, [role, activeTab]);

  useEffect(() => {
    if (role === 'customer') {
      setOverdueCount(0);
      return;
    }

    let isMounted = true;
    const checkOverdue = async () => {
      try {
        const res = await invoiceApi.getAll({ status: 'overdue' });
        if (isMounted && res.success && Array.isArray(res.data)) {
          setOverdueCount(res.data.length);
        }
      } catch (error) {
        if (!isMounted) return;
        const responseMessage = axios.isAxiosError(error) &&
          error.response?.data &&
          typeof error.response.data === 'object' &&
          'message' in error.response.data &&
          typeof error.response.data.message === 'string'
          ? error.response.data.message
          : undefined;
        showToast('Could not load overdue invoices', {
          type: 'warning',
          message: responseMessage || (error instanceof Error ? error.message : 'Please try again.'),
        });
      }
    };
    void checkOverdue();
    return () => {
      isMounted = false;
    };
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

  const renderActiveView = () => {
    if (role === 'customer') {
      return <CustomerPortal initialTab={activeTab} />;
    }

    switch (activeTab) {
      case 'overview':
        return <OverviewDashboard onNavigate={setActiveTab} />;
      case 'customers':
        return <CustomerManagement />;
      case 'products':
        return role === 'admin' ? <ProductManagement /> : <OverviewDashboard onNavigate={setActiveTab} />;
      case 'plans':
        return <PlanManagement />;
      case 'quotations':
        return <QuotationManagement />;
      case 'subscriptions':
        return <SubscriptionManagement onNavigate={setActiveTab} />;
      case 'invoices':
        return <InvoiceManagement />;
      case 'payments':
        return <PaymentManagement />;
      case 'billing':
        return role === 'admin' ? <BillingDashboard /> : <OverviewDashboard onNavigate={setActiveTab} />;
      case 'discounts':
      case 'taxes':
        return role === 'admin' ? <DiscountAndTaxManagement /> : <OverviewDashboard onNavigate={setActiveTab} />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'staff':
        return role === 'admin' ? <StaffManagement /> : <OverviewDashboard onNavigate={setActiveTab} />;
      default:
        return <OverviewDashboard onNavigate={setActiveTab} />;
    }
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
            <ErrorBoundary
              key={`${role}_${activeTab}`}
              fallbackTitle={`Could not display ${viewTitles[activeTab] || 'view'}`}
              onReset={() => setActiveTab(role === 'customer' ? 'customer_overview' : 'overview')}
            >
              {renderActiveView()}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};
