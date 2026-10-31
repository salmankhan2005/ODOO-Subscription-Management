import React, { useState, useEffect } from 'react';
import {
  subscriptionApi,
  invoiceApi,
  paymentApi,
  customerApi,
  planApi,
} from '../../api/services';
import {
  Subscription,
  SubscriptionStatus,
  Invoice,
  Payment,
  Customer,
  SubscriptionPlan,
} from '../../types';
import { BentoCard } from '../common/BentoCard';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import {
  Search,
  Eye,
  Play,
  Pause,
  RotateCcw,
  XCircle,
  FileCheck,
  Download,
  Plus,
  Pencil,
  Trash2
} from 'lucide-react';

interface SubscriptionManagementProps {
  onNavigate?: (tab: string) => void;
}

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ onNavigate }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [deletingSub, setDeletingSub] = useState<Subscription | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState({
    customerId: '',
    planId: '',
    quantity: 1,
    startDate: new Date().toISOString().slice(0, 10),
    expiryDate: '',
    paymentTerms: 'Due on receipt',
    autoRenew: true,
    notes: '',
  });
  const [editForm, setEditForm] = useState({
    paymentTerms: '',
    expiryDate: '',
    autoRenew: true,
    notes: '',
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'lines' | 'invoices' | 'payments' | 'activity'>('overview');

  // Related invoices & payments for detail modal
  const [relatedInvoices, setRelatedInvoices] = useState<Invoice[]>([]);
  const [relatedPayments, setRelatedPayments] = useState<Payment[]>([]);

  // Action confirmation dialog
  const [confirmAction, setConfirmAction] = useState<{
    sub: Subscription;
    status: SubscriptionStatus;
    title: string;
    reasonNeeded?: boolean;
  } | null>(null);
  const [pauseReason, setPauseReason] = useState('');

  const { showToast } = useToast();

  const loadFormOptions = async () => {
    setIsLoadingOptions(true);
    setOptionsError('');
    try {
      const customerResponse = await customerApi.getAll({ status: 'active', per_page: 100 });
      if (customerResponse.success) {
        setCustomers(customerResponse.data.filter((customer) => customer.status === 'active'));
      }
      const firstPlanPage = await planApi.getAll({
        status: 'all',
        page: 1,
        per_page: 100,
      });
      if (!firstPlanPage.success) {
        throw new Error(firstPlanPage.message || 'The plan list could not be loaded');
      }

      const activePlans = firstPlanPage.data.filter((plan) => plan.status === 'active');
      const totalPages = firstPlanPage.pagination?.total_pages || 1;
      for (let page = 2; page <= totalPages; page += 1) {
        const planPage = await planApi.getAll({
          status: 'all',
          page,
          per_page: 100,
        });
        if (!planPage.success) {
          throw new Error(planPage.message || `Could not load plan page ${page}`);
        }
        activePlans.push(...planPage.data.filter((plan) => plan.status === 'active'));
      }
      setPlans(activePlans);
      setSubscriptionForm((current) => {
        if (activePlans.some((plan) => plan.id === current.planId)) return current;
        const firstPlan = activePlans[0];
        return {
          ...current,
          planId: firstPlan?.id || '',
          quantity: firstPlan?.minimumQuantity || 1,
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      setOptionsError(message);
      setPlans([]);
      showToast('Could not load subscription form options', {
        type: 'error',
        message,
      });
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const res = await subscriptionApi.getAll(
        statusFilter === 'all' ? undefined : { status: statusFilter }
      );
      if (res.success) {
        let data = res.data;
        if (search.trim()) {
          const q = search.toLowerCase();
          data = data.filter(
            (s) =>
              s.subscriptionNumber.toLowerCase().includes(q) ||
              s.customerName.toLowerCase().includes(q) ||
              s.planName.toLowerCase().includes(q)
          );
        }
        setSubscriptions(data);
      }
    } catch (error) {
      showToast('Could not load subscriptions', {
        type: 'error',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  };

  useEffect(() => {
    void loadSubscriptions();
  }, [statusFilter, search]);

  const openCreateForm = () => {
    setEditingSub(null);
    setSubscriptionForm({
      customerId: customers[0]?.id || '',
      planId: plans[0]?.id || '',
      quantity: plans[0]?.minimumQuantity || 1,
      startDate: new Date().toISOString().slice(0, 10),
      expiryDate: '',
      paymentTerms: 'Due on receipt',
      autoRenew: true,
      notes: '',
    });
    setOptionsError('');
    setIsFormOpen(true);
    void loadFormOptions();
  };

  const openEditForm = (sub: Subscription) => {
    setEditingSub(sub);
    setEditForm({
      paymentTerms: sub.paymentTerms,
      expiryDate: sub.expiryDate || '',
      autoRenew: sub.autoRenew,
      notes: sub.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleSaveSubscription = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      if (editingSub) {
        const response = await subscriptionApi.update(editingSub.id, {
          payment_terms: editForm.paymentTerms,
          expiry_date: editForm.expiryDate || null,
          auto_renew: editForm.autoRenew,
          notes: editForm.notes,
        });
        if (!response.success) throw new Error(response.message || 'Subscription update failed');
        showToast(`Subscription ${editingSub.subscriptionNumber} updated`);
      } else {
        if (!subscriptionForm.customerId || !subscriptionForm.planId) {
          throw new Error('Choose a customer and plan before creating a subscription');
        }
        const response = await subscriptionApi.create({
          customer_id: subscriptionForm.customerId,
          plan_id: subscriptionForm.planId,
          quantity: subscriptionForm.quantity,
          start_date: subscriptionForm.startDate,
          expiry_date: subscriptionForm.expiryDate || null,
          payment_terms: subscriptionForm.paymentTerms,
          auto_renew: subscriptionForm.autoRenew,
          notes: subscriptionForm.notes,
        });
        if (!response.success) throw new Error(response.message || 'Subscription creation failed');
        showToast(`Subscription ${response.data.subscriptionNumber} created as draft`);
      }
      setIsFormOpen(false);
      setEditingSub(null);
      await loadSubscriptions();
    } catch (error) {
      showToast(editingSub ? 'Could not update subscription' : 'Could not create subscription', {
        type: 'error',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubscription = async () => {
    if (!deletingSub) return;
    try {
      const response = await subscriptionApi.delete(deletingSub.id);
      if (!response.success) throw new Error(response.message || 'Subscription delete failed');
      showToast(
        response.data?.deleted
          ? `Draft subscription ${deletingSub.subscriptionNumber} deleted`
          : `Subscription ${deletingSub.subscriptionNumber} closed; billing history retained`
      );
      setDeletingSub(null);
      await loadSubscriptions();
    } catch (error) {
      showToast('Could not delete subscription', {
        type: 'error',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  };

  const handleOpenDetail = async (sub: Subscription) => {
    setSelectedSub(sub);
    setActiveTab('overview');

    const invRes = await invoiceApi.getAll();
    if (invRes.success) {
      setRelatedInvoices(invRes.data.filter((i) => i.subscriptionId === sub.id));
    }

    const payRes = await paymentApi.getAll();
    if (payRes.success) {
      setRelatedPayments(payRes.data.filter((p) => p.customerId === sub.customerId));
    }
  };

  const handleExecuteStateChange = async () => {
    if (!confirmAction) return;
    const res = await subscriptionApi.updateStatus(
      confirmAction.sub.id,
      confirmAction.status,
      pauseReason
    );
    if (res.success) {
      showToast(`Subscription ${confirmAction.sub.subscriptionNumber} set to ${confirmAction.status}`);
      setConfirmAction(null);
      setPauseReason('');
      if (selectedSub && selectedSub.id === confirmAction.sub.id) {
        setSelectedSub(res.data);
      }
      loadSubscriptions();
    }
  };

  const exportSubscriptionsCSV = () => {
    const headers = ['Subscription,Customer,Plan,Cadence,Amount,Next Billing,Status\n'];
    const rows = subscriptions.map(
      (s) =>
        `"${s.subscriptionNumber}","${s.customerName}","${s.planName}","${s.billingInterval}",${s.totalAmount},"${s.nextBillingDate}","${s.status}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brightloop_subscriptions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('Subscription roster exported');
  };

  const selectedPlanForCreate = plans.find((plan) => plan.id === subscriptionForm.planId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">Subscription Lifecycle</h1>
          <p className="text-xs text-slate-400 mt-1">
            Active recurring agreements, lifecycle state machine (Draft $\to$ Active $\to$ Paused $\to$ Closed), and renewal schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportSubscriptionsCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#345C64] text-white text-xs font-semibold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Subscription</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by subscription, customer, or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FFFFFF] border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'active', 'paused', 'confirmed', 'closed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs capitalize rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === st ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <BentoCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-semibold">Subscription Number</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Plan Cadence</th>
                <th className="px-4 py-3 font-semibold">Next Billing Date</th>
                <th className="px-4 py-3 font-semibold text-right">Cadence Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No subscriptions match current criteria.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-mono font-semibold text-slate-200">{sub.subscriptionNumber}</div>
                      <div className="text-[11px] text-slate-400">Created {sub.createdAt}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-200">{sub.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{sub.customerEmail}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-slate-200">{sub.planName}</div>
                      <div className="text-[11px] text-slate-400 capitalize">{sub.billingInterval} Cadence</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      {sub.nextBillingDate}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-white">
                      ${sub.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(sub)}
                          className="p-1.5 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                          title="View Subscription Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditForm(sub)}
                          className="p-1.5 rounded text-slate-500 hover:text-[#1F3F47] hover:bg-slate-100 transition-colors"
                          title="Edit Subscription Details"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingSub(sub)}
                          className="p-1.5 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title={sub.status === 'draft'
                            ? 'Delete Draft Subscription'
                            : 'Close or cancel; keep billing history'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {sub.status === 'active' && (
                          <button
                            onClick={() =>
                              setConfirmAction({
                                sub,
                                status: 'paused',
                                title: 'Pause Subscription',
                                reasonNeeded: true
                              })
                            }
                            className="p-1.5 rounded text-amber-400 hover:bg-amber-950/40 transition-colors"
                            title="Pause Subscription"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}

                        {sub.status === 'paused' && (
                          <button
                            onClick={() =>
                              setConfirmAction({
                                sub,
                                status: 'active',
                                title: 'Resume Subscription'
                              })
                            }
                            className="p-1.5 rounded text-emerald-400 hover:bg-emerald-950/40 transition-colors"
                            title="Resume Subscription"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}

                        {['active', 'paused'].includes(sub.status) && (
                          <button
                            onClick={() =>
                              setConfirmAction({
                                sub,
                                status: 'closed',
                                title: 'Close Subscription'
                              })
                            }
                            className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Close / Cancel"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </BentoCard>

      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          if (!isSaving) {
            setIsFormOpen(false);
            setEditingSub(null);
          }
        }}
        title={editingSub ? 'Edit Subscription Details' : 'Create Subscription'}
        subtitle={editingSub
          ? 'Update payment terms, expiry, renewal setting, and notes. Billing amounts and history are preserved.'
          : 'Choose an active customer and plan. New subscriptions begin as drafts.'}
        maxWidth="2xl"
      >
        {editingSub ? (
          <form onSubmit={handleSaveSubscription} className="space-y-4 text-sm">
            <label className="block">
              <span className="mb-1 block font-medium text-[#252B2E]">Payment Terms</span>
              <input
                value={editForm.paymentTerms}
                onChange={(event) => setEditForm({ ...editForm, paymentTerms: event.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-[#252B2E]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-medium text-[#252B2E]">Expiry Date</span>
              <input
                type="date"
                min={editingSub.startDate}
                value={editForm.expiryDate}
                onChange={(event) => setEditForm({ ...editForm, expiryDate: event.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-[#252B2E]"
              />
            </label>
            <label className="flex items-center gap-2 text-[#252B2E]">
              <input
                type="checkbox"
                checked={editForm.autoRenew}
                onChange={(event) => setEditForm({ ...editForm, autoRenew: event.target.checked })}
              />
              Automatically renew at the end of the billing cycle
            </label>
            <label className="block">
              <span className="mb-1 block font-medium text-[#252B2E]">Notes</span>
              <textarea
                rows={3}
                maxLength={2000}
                value={editForm.notes}
                onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-[#252B2E]"
              />
            </label>
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-[#252B2E]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-[#1F3F47] px-4 py-2 font-semibold text-white disabled:opacity-60"
              >
                {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSaveSubscription} className="space-y-4 text-sm">
            {isLoadingOptions && (
              <p role="status" className="rounded-lg bg-[#EAF7F5] p-3 text-[#1F3F47]">
                Loading active customers and plans…
              </p>
            )}
            {!isLoadingOptions && optionsError && (
              <div role="alert" className="flex items-center justify-between gap-3 rounded-lg bg-rose-50 p-3 text-rose-800">
                <span>Could not load active plans: {optionsError}</span>
                <button
                  type="button"
                  onClick={() => void loadFormOptions()}
                  className="shrink-0 rounded-md border border-rose-300 px-3 py-1.5 font-semibold hover:bg-rose-100"
                >
                  Retry
                </button>
              </div>
            )}
            {!isLoadingOptions && !optionsError && customers.length === 0 && (
              <p role="alert" className="rounded-lg bg-amber-50 p-3 text-amber-800">
                Create or activate a customer before creating a subscription.
              </p>
            )}
            {!isLoadingOptions && !optionsError && plans.length === 0 && (
              <div role="alert" className="flex flex-col gap-3 rounded-lg bg-amber-50 p-3 text-amber-800 sm:flex-row sm:items-center sm:justify-between">
                <span>No active plans were found. Create or activate a plan, then refresh this list.</span>
                <div className="flex shrink-0 gap-2">
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormOpen(false);
                        onNavigate('plans');
                      }}
                      className="rounded-md border border-amber-300 px-3 py-1.5 font-semibold hover:bg-amber-100"
                    >
                      Create a Plan
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void loadFormOptions()}
                    className="rounded-md border border-amber-300 px-3 py-1.5 font-semibold hover:bg-amber-100"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block font-medium text-[#252B2E]">Customer *</span>
                <select
                  required
                  value={subscriptionForm.customerId}
                  onChange={(event) => setSubscriptionForm({
                    ...subscriptionForm,
                    customerId: event.target.value,
                  })}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-[#252B2E]"
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} {customer.company ? `· ${customer.company}` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block font-medium text-[#252B2E]">Plan *</span>
                <select
                  required
                  value={subscriptionForm.planId}
                  onChange={(event) => {
                    const plan = plans.find((item) => item.id === event.target.value);
                    setSubscriptionForm({
                      ...subscriptionForm,
                      planId: event.target.value,
                      quantity: plan?.minimumQuantity || 1,
                    });
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-[#252B2E]"
                >
                  <option value="">Select plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} · ${plan.price.toLocaleString()} / {plan.billingInterval}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block font-medium text-[#252B2E]">Quantity *</span>
                <input
                  type="number"
                  required
                  min={selectedPlanForCreate?.minimumQuantity || 1}
                  max={10000}
                  value={subscriptionForm.quantity}
                  onChange={(event) => setSubscriptionForm({
                    ...subscriptionForm,
                    quantity: Number(event.target.value),
                  })}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-[#252B2E]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-medium text-[#252B2E]">Start Date *</span>
                <input
                  type="date"
                  required
                  value={subscriptionForm.startDate}
                  onChange={(event) => setSubscriptionForm({
                    ...subscriptionForm,
                    startDate: event.target.value,
                  })}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-[#252B2E]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-medium text-[#252B2E]">Expiry Date</span>
                <input
                  type="date"
                  min={subscriptionForm.startDate}
                  value={subscriptionForm.expiryDate}
                  onChange={(event) => setSubscriptionForm({
                    ...subscriptionForm,
                    expiryDate: event.target.value,
                  })}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-[#252B2E]"
                />
              </label>
            </div>
            {selectedPlanForCreate && (
              <div className="rounded-lg bg-[#F7FAFA] p-3 text-[#5D696C]">
                Draft total: <strong className="font-mono text-[#252B2E]">
                  ${(selectedPlanForCreate.price * subscriptionForm.quantity).toLocaleString()}
                </strong>{' '}
                per {selectedPlanForCreate.billingInterval} cadence
              </div>
            )}
            <label className="block">
              <span className="mb-1 block font-medium text-[#252B2E]">Payment Terms</span>
              <input
                value={subscriptionForm.paymentTerms}
                onChange={(event) => setSubscriptionForm({
                  ...subscriptionForm,
                  paymentTerms: event.target.value,
                })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-[#252B2E]"
              />
            </label>
            <label className="flex items-center gap-2 text-[#252B2E]">
              <input
                type="checkbox"
                checked={subscriptionForm.autoRenew}
                onChange={(event) => setSubscriptionForm({
                  ...subscriptionForm,
                  autoRenew: event.target.checked,
                })}
              />
              Automatically renew at the end of the billing cycle
            </label>
            <label className="block">
              <span className="mb-1 block font-medium text-[#252B2E]">Notes</span>
              <textarea
                rows={2}
                maxLength={2000}
                value={subscriptionForm.notes}
                onChange={(event) => setSubscriptionForm({
                  ...subscriptionForm,
                  notes: event.target.value,
                })}
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-[#252B2E]"
              />
            </label>
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-[#252B2E]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isLoadingOptions || Boolean(optionsError) || customers.length === 0 || plans.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1F3F47] px-4 py-2 font-semibold text-white disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {isSaving ? 'Creating…' : 'Create Draft Subscription'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={!!deletingSub}
        onClose={() => setDeletingSub(null)}
        title="Delete or close subscription?"
        subtitle={deletingSub?.subscriptionNumber}
        maxWidth="sm"
      >
        <div className="space-y-4 text-sm">
          <p className="text-slate-600">
            {deletingSub?.status === 'draft'
              ? 'An unbilled draft with no invoices can be permanently deleted.'
              : 'This subscription and any billing history will be retained. The system will cancel or close it instead.'}
          </p>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setDeletingSub(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-[#252B2E]"
            >
              Keep Subscription
            </button>
            <button
              type="button"
              onClick={handleDeleteSubscription}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700"
            >
              <Trash2 className="h-4 w-4" />
              Confirm
            </button>
          </div>
        </div>
      </Modal>

      {/* Subscription Detail Modal */}
      {selectedSub && (
        <Modal
          isOpen={!!selectedSub}
          onClose={() => setSelectedSub(null)}
          title={`Subscription ${selectedSub.subscriptionNumber}`}
          subtitle={`Subscriber: ${selectedSub.customerName} (${selectedSub.customerEmail})`}
          maxWidth="4xl"
        >
          <div className="space-y-4 text-xs">
            {/* Header KPI Ribbon */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] text-slate-400 block">Current Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedSub.status} />
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Cadence Price</span>
                <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                  ${selectedSub.totalAmount.toLocaleString()}
                  <span className="text-xs text-slate-400 font-normal"> / {selectedSub.billingInterval}</span>
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Next Automated Billing</span>
                <span className="font-mono text-slate-200 mt-1 block">{selectedSub.nextBillingDate}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Expiry Date</span>
                <span className="font-mono text-slate-200 mt-1 block">{selectedSub.expiryDate || 'Continuous Renewal'}</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
              {(['overview', 'lines', 'invoices', 'payments', 'activity'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 capitalize rounded-lg transition-colors ${
                    activeTab === tab ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
                  <div>
                    <span className="text-slate-500 block mb-0.5">Plan Name</span>
                    <span className="font-medium text-slate-100">{selectedSub.planName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Payment Terms</span>
                    <span className="font-medium text-slate-100">{selectedSub.paymentTerms}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Start Date</span>
                    <span className="font-mono text-slate-200">{selectedSub.startDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Auto-Renewal</span>
                    <span className="text-emerald-400 font-medium">
                      {selectedSub.autoRenew ? 'Enabled (Automatic Cadence)' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {selectedSub.pauseReason && (
                  <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-900/50 text-amber-300">
                    <span className="font-semibold block">Pause Reason:</span>
                    <p className="mt-0.5">{selectedSub.pauseReason}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Subscription Lines */}
            {activeTab === 'lines' && (
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Product / Module</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Tax (18%)</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {selectedSub.lines.map((l) => (
                      <tr key={l.id}>
                        <td className="p-3">
                          <div className="font-semibold text-slate-200">{l.productName}</div>
                          {l.variantName && <div className="text-[11px] text-indigo-400">{l.variantName}</div>}
                        </td>
                        <td className="p-3 text-center font-mono">{l.quantity}</td>
                        <td className="p-3 text-right font-mono">${l.unitPrice}</td>
                        <td className="p-3 text-right font-mono">${l.taxAmount.toFixed(1)}</td>
                        <td className="p-3 text-right font-mono font-semibold">${l.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 3: Invoices */}
            {activeTab === 'invoices' && (
              <div className="space-y-2">
                {relatedInvoices.length === 0 ? (
                  <p className="text-center py-6 text-slate-500">No invoices generated yet for this subscription.</p>
                ) : (
                  relatedInvoices.map((inv) => (
                    <div key={inv.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-semibold text-slate-200">{inv.invoiceNumber}</div>
                        <div className="text-slate-400">Date: {inv.invoiceDate} · Due: {inv.dueDate}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-slate-100 font-semibold">${inv.totalAmount.toLocaleString()}</span>
                        <StatusBadge status={inv.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 4: Payments */}
            {activeTab === 'payments' && (
              <div className="space-y-2">
                {relatedPayments.length === 0 ? (
                  <p className="text-center py-6 text-slate-500">No payment receipts linked to this contract.</p>
                ) : (
                  relatedPayments.map((p) => (
                    <div key={p.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-semibold text-slate-200">{p.paymentReference}</div>
                        <div className="text-slate-400">{p.method} · Ref: {p.transactionReference}</div>
                      </div>
                      <span className="font-mono text-emerald-400 font-semibold">${p.amount.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 5: Activity */}
            {activeTab === 'activity' && (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-2">
                <div className="flex items-center gap-2 text-slate-300">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Contract activated on {selectedSub.startDate}</span>
                </div>
                <div className="text-[11px] text-slate-500">Automated recurring invoice generation schedule enabled.</div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog Modal for State Machine Transitions */}
      {confirmAction && (
        <Modal
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          title={confirmAction.title}
          subtitle={`Subscription: ${confirmAction.sub.subscriptionNumber}`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-300 leading-relaxed">
              Are you sure you want to transition this subscription to{' '}
              <span className="font-bold uppercase text-white font-mono">{confirmAction.status}</span>?
            </p>

            {confirmAction.reasonNeeded && (
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Reason for Pause</label>
                <input
                  type="text"
                  required
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                  placeholder="e.g. Seasonal ERP system migration"
                  className="w-full bg-[#FFFFFF] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteStateChange}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30"
              >
                Confirm Transition
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
