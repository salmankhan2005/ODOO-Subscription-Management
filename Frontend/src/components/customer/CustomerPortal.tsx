import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { portalApi } from '../../api/services';
import {
  Customer,
  Subscription,
  Invoice,
  Payment,
  PlanRecommendation,
  SubscriptionOptimizationRecommendation,
  SubscriptionPlan,
} from '../../types';
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
  const [availablePlans, setAvailablePlans] = useState<PlanRecommendation[]>([]);
  const [optimizerRecommendations, setOptimizerRecommendations] =
    useState<SubscriptionOptimizationRecommendation[]>([]);
  const [loadError, setLoadError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState({
    quantity: 1,
    payment_method: 'Bank Transfer',
    transaction_reference: '',
    billing_address: '',
    country: '',
    phone: '',
    notes: '',
  });

  // Action modals
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const { showToast } = useToast();

  const loadPortalData = async () => {
    if (!customerId) return;
    try {
      const res = await portalApi.getCustomerData();
      if (res.success && res.data) {
        setCustomer(res.data.customer || null);
        setSubscriptions(res.data.subscriptions || []);
        setInvoices(res.data.invoices || []);
        setPayments(res.data.payments || []);
        setAvailablePlans(res.data.availablePlans || []);
        setOptimizerRecommendations(res.data.optimizerRecommendations || []);
        setLoadError('');
      }
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      setLoadError(
        status === 401
          ? 'Your session has expired. Sign in again to reload your customer portal.'
          : 'Customer portal data could not be loaded. Please try again.'
      );
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
    setSelectedPlan(plan);
    setPurchaseDetails({
      quantity: plan.minimumQuantity || 1,
      payment_method: 'Bank Transfer',
      transaction_reference: '',
      billing_address: customer?.billingAddress || '',
      country: customer?.country || '',
      phone: customer?.phone || '',
      notes: '',
    });
  };

  const handlePurchasePlan = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPlan) return;
    setIsPurchasing(true);
    try {
      const result = await portalApi.purchasePlan(selectedPlan.id, purchaseDetails);
      showToast(`Plan activated · Invoice ${result.data.invoice_id}`, {
        type: 'success',
        message: 'Your manual payment was recorded and the invoice is marked paid.',
      });
      setSelectedPlan(null);
      await loadPortalData();
      setPortalTab('overview');
    } catch (error) {
      const message = axios.isAxiosError(error) &&
        error.response?.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data &&
        typeof error.response.data.message === 'string'
        ? error.response.data.message
        : error instanceof Error ? error.message : 'Please try again.';
      showToast('Plan purchase failed', { type: 'error', message });
    } finally {
      setIsPurchasing(false);
    }
  };

  const downloadInvoice = async (invoice: Invoice) => {
    try {
      await portalApi.downloadInvoicePdf(invoice.id);
    } catch (error) {
      showToast('Could not download invoice', {
        type: 'error',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  };

  const activeSub = subscriptions.find((s) => s.status === 'active') || subscriptions[0];

  return (
    <div className="space-y-6">
      {loadError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
        >
          {loadError}
        </div>
      )}
      {/* Customer Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-[#FFFFFF] to-[#FFFFFF] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
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

          {availablePlans[0] && (
            <BentoCard glow className="flex flex-col gap-3 border-emerald-500/30 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                  <Sparkles className="h-3 w-3" />
                  Recommended plan
                </div>
                <h2 className="text-base font-bold text-white">{availablePlans[0].name}</h2>
                <p className="mt-1 text-xs text-slate-400">
                  {availablePlans[0].recommendationReasons[0]} · $
                  {(availablePlans[0].price * availablePlans[0].minimumQuantity).toLocaleString()} /{' '}
                  {availablePlans[0].billingInterval}
                </p>
              </div>
              <button
                onClick={() => setPortalTab('plans')}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
              >
                Explore recommendations
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </BentoCard>
          )}

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
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Plans recommended for you</h2>
            <p className="mt-1 text-xs text-slate-400">
              Recommendations reflect plan selections by existing customers and, when available, your billing preferences.
            </p>
          </div>
          {optimizerRecommendations.length > 0 && (
            <BentoCard
              title="Subscription optimizer"
              subtitle="Suggestions from your current subscriptions and the subscription optimizer model"
              glow
            >
              <div className="space-y-2">
                {optimizerRecommendations.map((recommendation, index) => (
                  <div
                    key={`${recommendation.subscriptionId}-${recommendation.alternativePlanId}-${index}`}
                    className="flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-900/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        {recommendation.currentPlanName} → {recommendation.alternativePlanName}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {recommendation.action === 'review_unused_subscription'
                          ? 'Review this alternative against your current subscription.'
                          : `The model suggests a possible ${recommendation.action}.`}
                        {recommendation.confidence !== undefined
                          ? ` Model confidence: ${Math.round(recommendation.confidence * 100)}%.`
                          : ''}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-xs font-medium text-emerald-300">
                      ${recommendation.currentMonthlyCost.toLocaleString()} → $
                      {recommendation.alternativeMonthlyCost.toLocaleString()} / month
                    </span>
                  </div>
                ))}
              </div>
            </BentoCard>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {availablePlans.length === 0 && (
              <BentoCard className="md:col-span-3">
                <p className="py-6 text-center text-sm text-slate-500">
                  There are no active plans available right now. Please check back later.
                </p>
              </BentoCard>
            )}
            {availablePlans.map((p) => (
              <BentoCard key={p.id} glow className="flex flex-col justify-between">
                <div>
                  {p.recommendationScore > 0 && p.id === availablePlans[0]?.id && (
                    <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-emerald-950/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                      <Sparkles className="h-3 w-3" />
                      Top recommendation
                    </span>
                  )}
                  <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold block mb-2">
                    {p.billingInterval} Cadence
                  </span>
                  <h3 className="text-lg font-bold text-white">{p.name}</h3>
                  <div className="my-4">
                    <span className="text-3xl font-extrabold font-mono text-white">${(p.price * p.minimumQuantity).toLocaleString()}</span>
                    <span className="text-xs text-slate-400"> / {p.billingInterval}</span>
                    <div className="mt-1 text-[11px] text-slate-400">
                      Minimum {p.minimumQuantity} seat{p.minimumQuantity === 1 ? '' : 's'}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{p.description}</p>
                  <div className="mb-4 space-y-1">
                    {p.recommendationReasons.map((reason) => (
                      <p key={reason} className="text-[11px] text-emerald-300/90">
                        · {reason}
                      </p>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleSelectPlan(p)}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5"
                >
                  <span>Purchase Plan</span>
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
                          onClick={() => downloadInvoice(inv)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Download PDF</span>
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
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-300"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Billing Contact Email</span>
              <input
                type="text"
                disabled
                value={customer?.email || 'sarah@apexlogistics.com'}
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-300 font-mono"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Tax ID / VAT</span>
              <input
                type="text"
                disabled
                value={customer?.taxId || 'US-EIN-94820194'}
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-300 font-mono"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Billing Address</span>
              <input
                type="text"
                disabled
                value={customer?.billingAddress || '450 Harbor Boulevard, Suite 800, San Francisco, CA'}
                className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-300"
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
                    <th className="p-3 text-right">Tax</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {viewingInvoice.lines.map((l) => (
                    <tr key={l.id}>
                      <td className="p-3 font-semibold text-slate-200">{l.productName}</td>
                      <td className="p-3 text-center font-mono">{l.quantity}</td>
                      <td className="p-3 text-right font-mono">${l.taxAmount.toFixed(2)} ({l.taxRate}%)</td>
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
                onClick={() => downloadInvoice(viewingInvoice)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Invoice PDF</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      <Modal
        isOpen={!!selectedPlan}
        onClose={() => {
          if (!isPurchasing) setSelectedPlan(null);
        }}
        title={`Purchase ${selectedPlan?.name || 'Plan'}`}
        subtitle="Complete your billing and manual payment details. No payment provider is connected."
        maxWidth="xl"
      >
        {selectedPlan && (
          <form onSubmit={handlePurchasePlan} className="space-y-4 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Price per billing cycle</span>
                <span className="font-mono font-bold text-slate-900">
                  ${(selectedPlan.price * purchaseDetails.quantity).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 text-slate-500">
                {selectedPlan.billingInterval} · quantity {purchaseDetails.quantity} · tax calculated at checkout if applicable
              </div>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-slate-700">Quantity</label>
              <input
                type="number"
                required
                min={selectedPlan.minimumQuantity}
                max={10000}
                value={purchaseDetails.quantity}
                onChange={(event) => setPurchaseDetails({
                  ...purchaseDetails,
                  quantity: Number(event.target.value),
                })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Billing Address *</label>
                <input
                  type="text"
                  required
                  value={purchaseDetails.billing_address}
                  onChange={(event) => setPurchaseDetails({
                    ...purchaseDetails,
                    billing_address: event.target.value,
                  })}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Country *</label>
                <input
                  type="text"
                  required
                  value={purchaseDetails.country}
                  onChange={(event) => setPurchaseDetails({
                    ...purchaseDetails,
                    country: event.target.value,
                  })}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Manual Payment Method *</label>
                <select
                  required
                  value={purchaseDetails.payment_method}
                  onChange={(event) => setPurchaseDetails({
                    ...purchaseDetails,
                    payment_method: event.target.value,
                  })}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800"
                >
                  <option>Bank Transfer</option>
                  <option>Cash</option>
                  <option>Cheque</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Payment Reference</label>
                <input
                  type="text"
                  maxLength={120}
                  value={purchaseDetails.transaction_reference}
                  onChange={(event) => setPurchaseDetails({
                    ...purchaseDetails,
                    transaction_reference: event.target.value,
                  })}
                  placeholder="Optional receipt or transfer reference"
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-slate-700">Notes</label>
              <textarea
                rows={2}
                maxLength={500}
                value={purchaseDetails.notes}
                onChange={(event) => setPurchaseDetails({
                  ...purchaseDetails,
                  notes: event.target.value,
                })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800"
              />
            </div>

            <p className="rounded-lg bg-amber-50 p-3 text-amber-800">
              This records a manual payment and marks the invoice paid. It does not process a real transfer or charge a card.
            </p>

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                disabled={isPurchasing}
                onClick={() => setSelectedPlan(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPurchasing}
                className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
              >
                {isPurchasing ? 'Completing Purchase…' : 'Confirm Purchase'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
