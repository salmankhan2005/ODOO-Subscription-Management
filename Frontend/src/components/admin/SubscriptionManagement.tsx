import React, { useState, useEffect } from 'react';
import { subscriptionApi, invoiceApi, paymentApi } from '../../api/services';
import { Subscription, SubscriptionStatus, Invoice, Payment } from '../../types';
import { BentoCard } from '../common/BentoCard';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import {
  Repeat,
  Search,
  Filter,
  Eye,
  Play,
  Pause,
  RotateCcw,
  XCircle,
  FileCheck,
  Calendar,
  Layers,
  Download
} from 'lucide-react';

export const SubscriptionManagement: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
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

  const loadSubscriptions = async () => {
    const res = await subscriptionApi.getAll(statusFilter);
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
  };

  useEffect(() => {
    loadSubscriptions();
  }, [statusFilter, search]);

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

        <button
          onClick={exportSubscriptionsCSV}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
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
            className="w-full bg-[#111827] border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
                  className="w-full bg-[#0E131F] border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
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
