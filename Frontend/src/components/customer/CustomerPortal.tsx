import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { portalApi } from '../../api/services';
import { Customer, Subscription, Invoice, Payment, SubscriptionPlan } from '../../types';
import { BentoCard } from '../common/BentoCard';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import {
  Repeat,
  Receipt,
  CreditCard,
  Layers,
  UserCheck,
  Download,
  Eye,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface CustomerPortalProps {
  initialTab?: string;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ initialTab = 'customer_overview' }) => {
  const { user } = useAuth();
  const customerId = user?.customerId;

  const [portalTab, setPortalTab] = useState<'overview' | 'plans' | 'invoices' | 'payments' | 'profile'>('overview');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);

  // Action modals
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const { showToast } = useToast();

  const loadPortalData = async () => {
    if (!customerId) return;
    const res = await portalApi.getCustomerData();
    if (res.success && res.data) {
      setCustomer(res.data.customer || null);
      setSubscriptions(res.data.subscriptions || []);
      setInvoices(res.data.invoices || []);
      setPayments(res.data.payments || []);
      setAvailablePlans(res.data.availablePlans || []);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, [customerId]);

  useEffect(() => {
    if (initialTab === 'customer_plans') setPortalTab('plans');
    else if (initialTab === 'customer_invoices') setPortalTab('invoices');
    else if (initialTab === 'customer_payments') setPortalTab('payments');
    else if (initialTab === 'customer_profile') setPortalTab('profile');
    else setPortalTab('overview');
  }, [initialTab]);

  const handleRequestPause = async (s: Subscription) => {
    const res = await portalApi.requestPause(s.id);
    if (res.success) {
      showToast('Pause request submitted');
      loadPortalData();
    }
  };

  const handleRequestRenew = async (s: Subscription) => {
    const res = await portalApi.requestRenew(s.id);
    if (res.success) {
      showToast('Renewal request submitted');
      loadPortalData();
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    showToast(`Upgrade request received for ${plan.name}. A sales engineer will apply terms.`, {
      type: 'info'
    });
  };

  const activeSub = subscriptions.find((s) => s.status === 'active') || subscriptions[0];

  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-[#111827] to-[#0E1524] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 font-mono text-[11px] mb-2 border border-indigo-700/50">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Authenticated Subscriber · {customer?.company || user?.company}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Welcome back, {customer?.name || user?.name}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your organization's active Brightloop software subscriptions, renewals, and invoice receipts.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 self-start md:self-auto overflow-x-auto max-w-full">
          {[
            { id: 'overview', label: 'My Subscriptions' },
            { id: 'plans', label: 'Available Plans' },
            { id: 'invoices', label: 'Invoices & Receipts' },
            { id: 'profile', label: 'Profile' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPortalTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap font-medium ${
                portalTab === tab.id ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Overview & My Subscriptions */}
      {portalTab === 'overview' && (
        <div className="space-y-5">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <BentoCard glow className="p-4">
              <span className="text-xs text-slate-400">Active Subscriptions</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {subscriptions.filter((s) => s.status === 'active').length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Fully operational</div>
            </BentoCard>

            <BentoCard glow className="p-4">
              <span className="text-xs text-slate-400">Next Scheduled Billing</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {activeSub?.nextBillingDate || 'No pending bills'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Automated Stripe capture</div>
            </BentoCard>

            <BentoCard glow className="p-4">
              <span className="text-xs text-slate-400">Outstanding Balance</span>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                ${customer?.outstandingBalance || 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Current account balance</div>
            </BentoCard>
          </div>

          {/* Subscriptions List */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-white tracking-tight">Active Agreements</h2>
            {subscriptions.length === 0 ? (
              <BentoCard>
                <p className="text-center py-6 text-slate-400 text-xs">No subscriptions currently active.</p>
              </BentoCard>
            ) : (
              subscriptions.map((s) => (
                <BentoCard key={s.id} glow className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-white">{s.subscriptionNumber}</span>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="text-xs text-indigo-400 font-medium mt-0.5">{s.planName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold font-mono text-white">
                        ${s.totalAmount.toLocaleString()}
                        <span className="text-xs text-slate-400 font-normal"> / {s.billingInterval}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">Renews on {s.nextBillingDate}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 text-slate-300">
                      <div>
                        <strong>Included Modules:</strong> {s.lines.map((l) => l.productName).join(', ')}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Payment Terms: {s.paymentTerms} · Auto-renewal: {s.autoRenew ? 'Active' : 'Disabled'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {s.status === 'active' ? (
                        <button
                          onClick={() => handleRequestPause(s)}
                          className="px-3 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 font-medium text-xs transition-colors"
                        >
                          Request Pause
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRequestRenew(s)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 font-medium text-xs transition-colors"
                        >
                          Request Renewal
                        </button>
                      )}
                    </div>
                  </div>
                </BentoCard>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Available Plans */}
      {portalTab === 'plans' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight">Available Enterprise Plans & Upgrades</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {availablePlans.map((p) => (
              <BentoCard key={p.id} glow className="flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold block mb-2">
                    {p.billingInterval} Cadence
                  </span>
                  <h3 className="text-lg font-bold text-white">{p.name}</h3>
                  <div className="my-4">
                    <span className="text-3xl font-extrabold font-mono text-white">${p.price.toLocaleString()}</span>
                    <span className="text-xs text-slate-400"> / {p.billingInterval}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{p.description}</p>
                </div>

                <button
                  onClick={() => handleSelectPlan(p)}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5"
                >
                  <span>Select / Switch to Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </BentoCard>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Invoices */}
      {portalTab === 'invoices' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight">Billing Invoices & Receipts</h2>
          <BentoCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Invoice Number</th>
                    <th className="px-4 py-3 font-semibold">Invoice Date</th>
                    <th className="px-4 py-3 font-semibold">Due Date</th>
                    <th className="px-4 py-3 font-semibold text-right">Amount</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-slate-200">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-300">{inv.invoiceDate}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-400">{inv.dueDate}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-white">
                        ${inv.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setViewingInvoice(inv)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-400" />
                          <span>View PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </div>
      )}

      {/* Tab 4: Profile */}
      {portalTab === 'profile' && (
        <BentoCard title="Subscriber Organization Profile">
          <div className="space-y-4 mt-2 text-xs max-w-xl">
            <div>
              <span className="text-slate-400 block mb-1">Company Name</span>
              <input
                type="text"
                disabled
                value={customer?.company || 'Apex Global Logistics'}
                className="w-full bg-[#0E131F] border border-slate-700 rounded-lg p-2.5 text-slate-300"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Billing Contact Email</span>
              <input
                type="text"
                disabled
                value={customer?.email || 'sarah@apexlogistics.com'}
                className="w-full bg-[#0E131F] border border-slate-700 rounded-lg p-2.5 text-slate-300 font-mono"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Tax ID / VAT</span>
              <input
                type="text"
                disabled
                value={customer?.taxId || 'US-EIN-94820194'}
                className="w-full bg-[#0E131F] border border-slate-700 rounded-lg p-2.5 text-slate-300 font-mono"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Billing Address</span>
              <input
                type="text"
                disabled
                value={customer?.billingAddress || '450 Harbor Boulevard, Suite 800, San Francisco, CA'}
                className="w-full bg-[#0E131F] border border-slate-700 rounded-lg p-2.5 text-slate-300"
              />
            </div>
          </div>
        </BentoCard>
      )}

      {/* Invoice Document Modal for Customer */}
      {viewingInvoice && (
        <Modal
          isOpen={!!viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          title={`Invoice ${viewingInvoice.invoiceNumber}`}
          subtitle="Tax compliant electronic statement"
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="font-bold text-white">Brightloop Software Corp.</span>
                <span className="font-mono text-indigo-400 font-semibold">{viewingInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Invoice Date: {viewingInvoice.invoiceDate}</span>
                <span>Due Date: {viewingInvoice.dueDate}</span>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Module</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Tax (18%)</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {viewingInvoice.lines.map((l) => (
                    <tr key={l.id}>
                      <td className="p-3 font-semibold text-slate-200">{l.productName}</td>
                      <td className="p-3 text-center font-mono">{l.quantity}</td>
                      <td className="p-3 text-right font-mono">${l.taxAmount.toFixed(1)}</td>
                      <td className="p-3 text-right font-mono font-bold text-white">${l.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <div className="font-mono text-base font-bold text-emerald-400">
                Total: ${viewingInvoice.totalAmount.toLocaleString()}
              </div>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download / Print Receipt</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
