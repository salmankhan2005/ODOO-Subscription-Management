import React, { useState, useEffect } from 'react';
import { subscriptionApi, invoiceApi, paymentApi } from '../../api/services';
import { Subscription, SubscriptionStatus, Invoice, Payment } from '../../types';
import { BentoCard } from '../common/BentoCard';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import {
  Search,
  Eye,
  Play,
  Pause,
  XCircle,
  FileCheck,
  Download
} from 'lucide-react';

export const SubscriptionManagement: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'lines' | 'invoices' | 'payments' | 'activity'>('overview');

  const [relatedInvoices, setRelatedInvoices] = useState<Invoice[]>([]);
  const [relatedPayments, setRelatedPayments] = useState<Payment[]>([]);

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
          <h1 className="text-2xl font-bold tracking-tight text-[#252B2E] font-display">
            Subscription Lifecycle
          </h1>
          <p className="text-xs text-[#56666B] mt-1">
            Active recurring agreements, lifecycle transitions (Draft → Active → Paused → Closed), and renewal schedules.
          </p>
        </div>

        <button
          onClick={exportSubscriptionsCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#E5ECEC] hover:border-[#345C64]/50 text-[#252B2E] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-[#345C64]" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-[#E5ECEC]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#56666B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by subscription, customer, or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#252B2E] placeholder-[#56666B] focus:outline-none focus:border-[#345C64]"
          />
        </div>

        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC] overflow-x-auto w-full sm:w-auto">
          {['all', 'active', 'paused', 'confirmed', 'closed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs capitalize rounded-md transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#1F3F47] text-white font-semibold'
                  : 'text-[#56666B] hover:text-[#252B2E]'
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
            <thead className="bg-[#F7FAFA] text-[11px] text-[#56666B] border-b border-[#E5ECEC]">
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
            <tbody className="divide-y divide-[#E5ECEC]">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[#56666B]">
                    No subscriptions match current criteria.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#F7FAFA] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-mono font-bold text-[#1F3F47]">{sub.subscriptionNumber}</div>
                      <div className="text-[11px] text-[#56666B] font-mono">Created {sub.createdAt}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-[#252B2E]">{sub.customerName}</div>
                      <div className="text-[11px] text-[#56666B] font-mono">{sub.customerEmail}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-[#252B2E]">{sub.planName}</div>
                      <div className="text-[11px] text-[#56666B] capitalize">{sub.billingInterval} Cadence</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[#252B2E]">
                      {sub.nextBillingDate}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-[#252B2E]">
                      ${sub.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(sub)}
                          className="p-1.5 rounded-lg text-[#56666B] hover:text-[#1F3F47] hover:bg-[#DDF3F0]/60 transition-colors"
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
                            className="p-1.5 rounded-lg text-[#E96F50] hover:bg-[#E96F50]/10 transition-colors"
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
                            className="p-1.5 rounded-lg text-[#2E9F92] hover:bg-[#DDF3F0]/60 transition-colors"
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
                            className="p-1.5 rounded-lg text-[#56666B] hover:text-[#E96F50] hover:bg-[#E96F50]/10 transition-colors"
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
            {/* Primary Teal Header KPI Ribbon */}
            <div className="p-4 rounded-xl bg-[#345C64] text-white flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] text-[#DDF3F0] block">Current Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedSub.status} onDark />
                </div>
              </div>
              <div>
                <span className="text-[11px] text-[#DDF3F0] block">Cadence Price</span>
                <span className="text-xl font-bold font-mono text-white mt-1 block">
                  ${selectedSub.totalAmount.toLocaleString()}
                  <span className="text-xs text-[#DDF3F0] font-normal"> / {selectedSub.billingInterval}</span>
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#DDF3F0] block">Next Automated Billing</span>
                <span className="font-mono text-white font-semibold mt-1 block">{selectedSub.nextBillingDate}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#DDF3F0] block">Expiry Date</span>
                <span className="font-mono text-white font-semibold mt-1 block">
                  {selectedSub.expiryDate || 'Continuous Renewal'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 border-b border-[#E5ECEC] pb-2 overflow-x-auto">
              {(['overview', 'lines', 'invoices', 'payments', 'activity'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 capitalize rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-[#1F3F47] text-white font-semibold'
                      : 'text-[#56666B] hover:text-[#252B2E] hover:bg-[#F7FAFA]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] text-[#252B2E]">
                  <div>
                    <span className="text-[#56666B] block mb-0.5">Plan Name</span>
                    <span className="font-semibold">{selectedSub.planName}</span>
                  </div>
                  <div>
                    <span className="text-[#56666B] block mb-0.5">Payment Terms</span>
                    <span className="font-semibold">{selectedSub.paymentTerms}</span>
                  </div>
                  <div>
                    <span className="text-[#56666B] block mb-0.5">Start Date</span>
                    <span className="font-mono">{selectedSub.startDate}</span>
                  </div>
                  <div>
                    <span className="text-[#56666B] block mb-0.5">Auto-Renewal</span>
                    <span className="text-[#1E7A70] font-semibold">
                      {selectedSub.autoRenew ? 'Enabled (Automatic Cadence)' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {selectedSub.pauseReason && (
                  <div className="p-3.5 rounded-xl bg-[#E96F50]/10 border border-[#E96F50]/30 text-[#C85234]">
                    <span className="font-semibold block">Pause Reason:</span>
                    <p className="mt-0.5">{selectedSub.pauseReason}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'lines' && (
              <div className="border border-[#E5ECEC] rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#F7FAFA] text-[#56666B] text-[11px] border-b border-[#E5ECEC]">
                    <tr>
                      <th className="p-3 font-semibold">Product / Module</th>
                      <th className="p-3 font-semibold text-center">Qty</th>
                      <th className="p-3 font-semibold text-right">Unit Price</th>
                      <th className="p-3 font-semibold text-right">Tax (18%)</th>
                      <th className="p-3 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5ECEC]">
                    {selectedSub.lines.map((l) => (
                      <tr key={l.id}>
                        <td className="p-3">
                          <div className="font-semibold text-[#252B2E]">{l.productName}</div>
                          {l.variantName && <div className="text-[11px] text-[#345C64]">{l.variantName}</div>}
                        </td>
                        <td className="p-3 text-center font-mono">{l.quantity}</td>
                        <td className="p-3 text-right font-mono">${l.unitPrice}</td>
                        <td className="p-3 text-right font-mono">${l.taxAmount.toFixed(1)}</td>
                        <td className="p-3 text-right font-mono font-bold text-[#252B2E]">
                          ${l.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="space-y-2">
                {relatedInvoices.length === 0 ? (
                  <p className="text-center py-6 text-[#56666B]">No invoices generated yet for this subscription.</p>
                ) : (
                  relatedInvoices.map((inv) => (
                    <div key={inv.id} className="p-3.5 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] flex items-center justify-between">
                      <div>
                        <div className="font-mono font-semibold text-[#1F3F47]">{inv.invoiceNumber}</div>
                        <div className="text-[#56666B] font-mono">Date: {inv.invoiceDate} · Due: {inv.dueDate}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-[#252B2E] font-bold">${inv.totalAmount.toLocaleString()}</span>
                        <StatusBadge status={inv.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-2">
                {relatedPayments.length === 0 ? (
                  <p className="text-center py-6 text-[#56666B]">No payment receipts linked to this contract.</p>
                ) : (
                  relatedPayments.map((p) => (
                    <div key={p.id} className="p-3.5 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] flex items-center justify-between">
                      <div>
                        <div className="font-mono font-semibold text-[#1F3F47]">{p.paymentReference}</div>
                        <div className="text-[#56666B]">{p.method} · Ref: {p.transactionReference}</div>
                      </div>
                      <span className="font-mono text-[#2E9F92] font-bold">${p.amount.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="p-4 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] text-[#56666B] space-y-2">
                <div className="flex items-center gap-2 text-[#252B2E] font-semibold">
                  <FileCheck className="w-4 h-4 text-[#2E9F92]" />
                  <span>Contract activated on {selectedSub.startDate}</span>
                </div>
                <div className="text-[11px]">Automated recurring invoice generation schedule enabled.</div>
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
            <p className="text-[#56666B] leading-relaxed">
              Confirm transitioning this contract to{' '}
              <span className="font-bold uppercase text-[#1F3F47] font-mono">{confirmAction.status}</span>?
            </p>

            {confirmAction.reasonNeeded && (
              <div>
                <label className="block font-semibold text-[#252B2E] mb-1">Reason for Pause</label>
                <input
                  type="text"
                  required
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                  placeholder="e.g. Seasonal ERP system migration"
                  className="w-full bg-[#F7FAFA] border border-[#E5ECEC] rounded-lg p-2.5 text-[#252B2E] focus:outline-none focus:border-[#345C64]"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E5ECEC]">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC] text-[#56666B] font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteStateChange}
                className="px-3.5 py-1.5 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white font-semibold"
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
