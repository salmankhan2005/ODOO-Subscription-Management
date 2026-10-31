import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { portalApi, subscriptionApi } from '../../api/services';
import { Customer, Subscription, Invoice, Payment, SubscriptionPlan } from '../../types';
import { BentoCard } from '../common/BentoCard';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { useToast } from '../../context/ToastContext';
import { UserCheck, Download, Eye, ArrowRight } from 'lucide-react';

interface CustomerPortalProps {
  initialTab?: string;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ initialTab = 'customer_overview' }) => {
  const { user } = useAuth();
  const customerId = user?.customerId || 'cust_1';

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
    const res = await portalApi.getCustomerData(customerId);
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
    const res = await subscriptionApi.updateStatus(s.id, 'paused', 'Customer self-service portal pause');
    if (res.success) {
      showToast(`Subscription ${s.subscriptionNumber} paused as requested`);
      loadPortalData();
    }
  };

  const handleRequestResume = async (s: Subscription) => {
    const res = await subscriptionApi.updateStatus(s.id, 'active');
    if (res.success) {
      showToast(`Subscription ${s.subscriptionNumber} resumed`);
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
      {/* Executive Subscriber Header */}
      <div className="p-6 rounded-xl bg-[#345C64] border border-[#27484F] text-white flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-[#DDF3F0] font-mono text-[11px] uppercase tracking-wider mb-1.5">
            <UserCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Subscriber Portal · {customer?.company || user?.company}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Welcome back, {customer?.name || user?.name}
          </h1>
          <p className="text-xs text-[#DDF3F0]/85 mt-1">
            Manage active Brightloop software contracts, scheduled renewals, payment history, and tax statements.
          </p>
        </div>

        {/* Shared-Layout Sliding Segmented Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-[#1F3F47] rounded-xl border border-white/10 self-start lg:self-auto overflow-x-auto max-w-full">
          {[
            { id: 'overview', label: 'My Subscriptions' },
            { id: 'plans', label: 'Available Plans' },
            { id: 'invoices', label: 'Statements' },
            { id: 'payments', label: 'Payments' },
            { id: 'profile', label: 'Profile' }
          ].map((tab) => {
            const isActive = portalTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPortalTab(tab.id as typeof portalTab)}
                className={`relative px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 font-medium ${
                  isActive ? 'text-[#1F3F47] font-semibold' : 'text-[#DDF3F0]/85 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="portal-segmented-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-lg bg-white"
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Smooth Sub-Tab View Transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={portalTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Tab 1: Overview & My Subscriptions */}
          {portalTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <BentoCard className="p-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#56666B]">
                    Active Contracts
                  </span>
                  <div className="text-2xl font-bold font-mono text-[#2E9F92] mt-1.5">
                    <AnimatedCounter value={subscriptions.filter((s) => s.status === 'active').length} />
                  </div>
                  <div className="text-[11px] text-[#56666B] mt-1">Provisioned enterprise licenses</div>
                </BentoCard>

                <BentoCard className="p-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#56666B]">
                    Next Scheduled Renewal
                  </span>
                  <div className="text-xl font-bold font-mono tabular-nums text-[#252B2E] mt-1.5">
                    {activeSub?.nextBillingDate || 'No pending renewals'}
                  </div>
                  <div className="text-[11px] text-[#56666B] mt-1">Automated Stripe settlement</div>
                </BentoCard>

                <BentoCard className="p-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#56666B]">
                    Outstanding Balance
                  </span>
                  <div
                    className={`text-2xl font-bold font-mono mt-1.5 ${
                      (customer?.outstandingBalance || 0) > 0 ? 'text-[#E96F50]' : 'text-[#252B2E]'
                    }`}
                  >
                    <AnimatedCounter value={customer?.outstandingBalance || 0} prefix="$" />
                  </div>
                  <div className="text-[11px] text-[#56666B] mt-1">Current organization receivable</div>
                </BentoCard>
              </div>

              {/* Subscriptions List */}
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-[#252B2E] tracking-tight font-display">
                  Active Software Agreements
                </h2>
                {subscriptions.length === 0 ? (
                  <BentoCard>
                    <p className="text-center py-6 text-[#56666B] text-xs">
                      No subscriptions are currently active on this organization profile.
                    </p>
                  </BentoCard>
                ) : (
                  subscriptions.map((s) => (
                    <BentoCard key={s.id} className="p-5 md:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5ECEC]">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-base font-bold text-[#1F3F47]">
                              {s.subscriptionNumber}
                            </span>
                            <StatusBadge status={s.status} />
                          </div>
                          <div className="text-xs text-[#345C64] font-semibold mt-0.5">{s.planName}</div>
                        </div>
                        <div className="sm:text-right">
                          <div className="text-2xl font-bold font-mono tabular-nums text-[#252B2E]">
                            ${s.totalAmount.toLocaleString()}
                            <span className="text-xs text-[#56666B] font-normal"> / {s.billingInterval}</span>
                          </div>
                          <div className="text-[11px] text-[#56666B] font-mono tabular-nums">
                            Next cycle {s.nextBillingDate}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1 text-[#252B2E]">
                          <div>
                            <span className="font-semibold text-[#56666B]">Provisioned Modules:</span>{' '}
                            {s.lines.map((l) => l.productName).join(', ')}
                          </div>
                          <div className="text-[#56666B] text-[11px]">
                            Terms: {s.paymentTerms} · Auto-renewal: {s.autoRenew ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {s.status === 'active' ? (
                            <button
                              type="button"
                              onClick={() => handleRequestPause(s)}
                              className="px-3.5 py-1.5 rounded-lg bg-[#F7FAFA] hover:bg-[#E96F50]/10 text-[#C94A29] border border-[#E96F50]/40 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
                            >
                              Request Pause
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRequestResume(s)}
                              className="px-3.5 py-1.5 rounded-lg bg-[#2E9F92] hover:bg-[#25857A] text-white font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
                            >
                              Resume Subscription
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
              <h2 className="text-base font-semibold text-[#252B2E] tracking-tight font-display">
                Enterprise Editions &amp; Seat Upgrades
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {availablePlans.map((p, idx) => {
                  const isFeatured = idx === 1;
                  return (
                    <BentoCard
                      key={p.id}
                      variant={isFeatured ? 'teal' : 'white'}
                      className="flex flex-col justify-between"
                    >
                      <div>
                        <span
                          className={`text-[11px] font-mono uppercase tracking-wider font-semibold block mb-2 ${
                            isFeatured ? 'text-[#DDF3F0]' : 'text-[#345C64]'
                          }`}
                        >
                          {p.billingInterval} Cadence
                        </span>
                        <h3
                          className={`text-lg font-bold font-display ${
                            isFeatured ? 'text-white' : 'text-[#252B2E]'
                          }`}
                        >
                          {p.name}
                        </h3>
                        <div className="my-4">
                          <span
                            className={`text-3xl font-extrabold font-mono tabular-nums ${
                              isFeatured ? 'text-white' : 'text-[#1F3F47]'
                            }`}
                          >
                            ${p.price.toLocaleString()}
                          </span>
                          <span className={`text-xs ${isFeatured ? 'text-[#DDF3F0]/80' : 'text-[#56666B]'}`}>
                            {' '}
                            / {p.billingInterval}
                          </span>
                        </div>
                        <p
                          className={`text-xs leading-relaxed mb-5 ${
                            isFeatured ? 'text-[#DDF3F0]/90' : 'text-[#56666B]'
                          }`}
                        >
                          {p.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectPlan(p)}
                        className={`group/btn w-full py-2.5 px-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                          isFeatured
                            ? 'bg-white hover:bg-[#DDF3F0] text-[#1F3F47]'
                            : 'bg-[#1F3F47] hover:bg-[#162E35] text-white'
                        }`}
                      >
                        <span>Request Plan Switch</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover/btn:translate-x-1" />
                      </button>
                    </BentoCard>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Invoices */}
          {portalTab === 'invoices' && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#252B2E] tracking-tight font-display">
                Billing Statements &amp; Tax Receipts
              </h2>
              <BentoCard className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7FAFA] text-[11px] uppercase tracking-wider text-[#56666B] border-b border-[#E5ECEC]">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Invoice Number</th>
                        <th className="px-4 py-3 font-semibold">Issue Date</th>
                        <th className="px-4 py-3 font-semibold">Due Date</th>
                        <th className="px-4 py-3 font-semibold text-right">Amount</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5ECEC]">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-[#F7FAFA] transition-colors">
                          <td className="px-5 py-3.5 font-mono font-semibold text-[#1F3F47]">
                            {inv.invoiceNumber}
                          </td>
                          <td className="px-4 py-3.5 font-mono tabular-nums text-[#56666B]">{inv.invoiceDate}</td>
                          <td className="px-4 py-3.5 font-mono tabular-nums text-[#56666B]">{inv.dueDate}</td>
                          <td className="px-4 py-3.5 text-right font-mono tabular-nums font-bold text-[#252B2E]">
                            ${inv.totalAmount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={inv.status} />
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => setViewingInvoice(inv)}
                              className="group/eye px-3 py-1.5 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC] hover:bg-[#DDF3F0]/50 text-[#1F3F47] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#345C64] transition-transform duration-150 group-hover/eye:scale-110" />
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

          {/* Tab 4: Payments */}
          {portalTab === 'payments' && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#252B2E] tracking-tight font-display">
                Cleared Settlement History
              </h2>
              <BentoCard className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7FAFA] text-[11px] uppercase tracking-wider text-[#56666B] border-b border-[#E5ECEC]">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Payment Ref</th>
                        <th className="px-4 py-3 font-semibold">Invoice Number</th>
                        <th className="px-4 py-3 font-semibold">Method</th>
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold text-right">Amount</th>
                        <th className="px-5 py-3 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5ECEC]">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-[#56666B]">
                            No settlement transactions recorded yet.
                          </td>
                        </tr>
                      ) : (
                        payments.map((p) => (
                          <tr key={p.id} className="hover:bg-[#F7FAFA] transition-colors">
                            <td className="px-5 py-3.5 font-mono font-semibold text-[#1F3F47]">
                              {p.paymentReference}
                            </td>
                            <td className="px-4 py-3.5 font-mono text-[#345C64]">{p.invoiceNumber}</td>
                            <td className="px-4 py-3.5 text-[#56666B]">{p.method}</td>
                            <td className="px-4 py-3.5 font-mono tabular-nums text-[#56666B]">{p.paymentDate}</td>
                            <td className="px-4 py-3.5 text-right font-mono tabular-nums font-bold text-[#2E9F92]">
                              ${p.amount.toLocaleString()}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <StatusBadge status={p.status} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </BentoCard>
            </div>
          )}

          {/* Tab 5: Profile */}
          {portalTab === 'profile' && (
            <BentoCard
              title="Subscriber Organization Profile"
              subtitle="Verified legal entity and statutory billing details on file"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs max-w-3xl">
                <div>
                  <span className="text-[#56666B] font-semibold block mb-1">Company Legal Name</span>
                  <input
                    type="text"
                    disabled
                    value={customer?.company || 'Apex Global Logistics'}
                    className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] font-medium"
                  />
                </div>
                <div>
                  <span className="text-[#56666B] font-semibold block mb-1">Billing Contact Email</span>
                  <input
                    type="text"
                    disabled
                    value={customer?.email || 'sarah@apexlogistics.com'}
                    className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] font-mono"
                  />
                </div>
                <div>
                  <span className="text-[#56666B] font-semibold block mb-1">Tax ID / VAT Registration</span>
                  <input
                    type="text"
                    disabled
                    value={customer?.taxId || 'US-EIN-94820194'}
                    className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] font-mono"
                  />
                </div>
                <div>
                  <span className="text-[#56666B] font-semibold block mb-1">Registered Billing Address</span>
                  <input
                    type="text"
                    disabled
                    value={customer?.billingAddress || '450 Harbor Boulevard, Suite 800, San Francisco, CA'}
                    className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E]"
                  />
                </div>
              </div>
            </BentoCard>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Invoice Document Modal for Customer */}
      {viewingInvoice && (
        <Modal
          isOpen={!!viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          title={`Statement ${viewingInvoice.invoiceNumber}`}
          subtitle="Tax-compliant electronic statement"
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-[#E5ECEC]">
                <span className="font-bold text-[#252B2E] font-display">Brightloop Software Corp.</span>
                <span className="font-mono text-[#345C64] font-semibold">{viewingInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-[#56666B] font-mono tabular-nums">
                <span>Issued: {viewingInvoice.invoiceDate}</span>
                <span>Due: {viewingInvoice.dueDate}</span>
              </div>
            </div>

            <div className="border border-[#E5ECEC] rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[#F7FAFA] text-[#56666B] text-[11px] uppercase tracking-wider border-b border-[#E5ECEC]">
                  <tr>
                    <th className="p-3 font-semibold">Module</th>
                    <th className="p-3 text-center font-semibold">Qty</th>
                    <th className="p-3 text-right font-semibold">Tax (18%)</th>
                    <th className="p-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5ECEC]">
                  {viewingInvoice.lines.map((l) => (
                    <tr key={l.id}>
                      <td className="p-3 font-semibold text-[#252B2E]">{l.productName}</td>
                      <td className="p-3 text-center font-mono tabular-nums text-[#252B2E]">{l.quantity}</td>
                      <td className="p-3 text-right font-mono tabular-nums text-[#56666B]">
                        ${l.taxAmount.toFixed(1)}
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums font-bold text-[#252B2E]">
                        ${l.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center p-4 rounded-xl bg-[#345C64] text-white">
              <div className="font-mono tabular-nums text-base font-bold">
                Total Statement: ${viewingInvoice.totalAmount.toLocaleString()}
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
